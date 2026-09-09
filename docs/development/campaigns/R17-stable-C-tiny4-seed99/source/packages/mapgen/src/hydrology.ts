import type { World } from './index';

/** Fixed compass directions, never indexes into a boundary-shortened neighbor list. */
export const FLOW_DIRECTION = { none: 0, east: 1, southeast: 2, southwest: 3, west: 4, northwest: 5, northeast: 6 } as const;
export const LAKE_BIT = 32;
export const HYDROLOGY_MASK = 63;
export function riverDirection(value: number): number { return value & 7; }
export function riverSize(value: number): 0 | 1 | 2 | 3 { return ((value >>> 3) & 3) as 0 | 1 | 2 | 3; }
export function isLake(value: number): boolean { return (value & LAKE_BIT) !== 0; }

/** Resolve a 1..6 compass direction; zero, malformed coordinates and map exits return null. */
export function directionNeighbor(cell: number, width: number, height: number, direction: number): number | null {
  if (!Number.isInteger(cell) || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
    cell < 0 || cell >= width * height || !Number.isInteger(direction) || direction < 1 || direction > 6) return null;
  const x = cell % width, y = Math.floor(cell / width), odd = y & 1;
  const nx = x + (direction === 1 ? 1 : direction === 4 ? -1 : direction === 2 || direction === 6 ? odd : odd - 1);
  const ny = y + (direction === 2 || direction === 3 ? 1 : direction === 5 || direction === 6 ? -1 : 0);
  return nx < 0 || nx >= width || ny < 0 || ny >= height ? null : ny * width + nx;
}

export function hydrologyDownstream(cell: number, width: number, height: number, value: number): number | null {
  return directionNeighbor(cell, width, height, riverDirection(value));
}

/** O(cells) validation, including every outlet and cycle; no recursion or per-river world scan. */
export function validateHydrology(world: Pick<World, 'width' | 'height' | 'terrain' | 'hydrology'>): void {
  const { width, height, terrain, hydrology } = world, count = width * height;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || count > 350_000 ||
    !(terrain instanceof Uint8Array) || !(hydrology instanceof Uint8Array) || terrain.length !== count || hydrology.length !== count) {
    throw new RangeError('Hydrology requires matching bounded world arrays.');
  }
  const state = new Uint8Array(count);
  let hasLake = false;
  for (let cell = 0; cell < count; cell++) {
    const value = hydrology[cell]!, direction = riverDirection(value), size = riverSize(value), lake = isLake(value);
    hasLake ||= lake;
    if (terrain[cell]! > 4 || value > HYDROLOGY_MASK || direction === 7 ||
      (lake && (terrain[cell] !== 0 || size !== 0 || direction === 0)) ||
      (!lake && terrain[cell] === 0 && value !== 0) ||
      (!lake && terrain[cell] !== 0 && Boolean(size) !== Boolean(direction))) throw new RangeError('Invalid hydrology cell.');
    if (!direction) { state[cell] = 2; continue; }
    const next = hydrologyDownstream(cell, width, height, value);
    if (next === null || (terrain[next] !== 0 && riverSize(hydrology[next]!) === 0)) throw new RangeError('River or lake has a broken outlet.');
    if (!lake && !isLake(hydrology[next]!) && terrain[next] !== 0 && riverSize(hydrology[next]!) < size) throw new RangeError('River flow shrinks downstream.');
  }
  const path = new Int32Array(count);
  for (let origin = 0; origin < count; origin++) {
    if (state[origin] !== 0) continue;
    let cell = origin, length = 0;
    while (state[cell] === 0) {
      state[cell] = 1; path[length++] = cell;
      cell = hydrologyDownstream(cell, width, height, hydrology[cell]!)!;
    }
    if (state[cell] === 1) throw new RangeError('Hydrology contains a drainage cycle.');
    for (let index = 0; index < length; index++) state[path[index]!] = 2;
  }
  if (!hasLake) return;
  // Reuse the drained-path scratch storage for connected water bodies. This is
  // an import invariant too: a lake is inland and spills to one actual river,
  // not a renamed ocean bay or an acyclic body with several unrelated outlets.
  for (let origin = 0; origin < count; origin++) {
    if (!isLake(hydrology[origin]!) || state[origin] === 3) continue;
    let head = 0, tail = 1, outlets = 0; path[0] = origin; state[origin] = 3;
    while (head < tail) {
      const cell = path[head++]!, downstream = hydrologyDownstream(cell, width, height, hydrology[cell]!)!;
      if (!isLake(hydrology[downstream]!)) outlets++;
      for (let direction = 1; direction <= 6; direction++) {
        const next = directionNeighbor(cell, width, height, direction);
        if (next === null || terrain[next] === 0 && !isLake(hydrology[next]!)) throw new RangeError('Lake body is not inland.');
        if (isLake(hydrology[next]!) && state[next] !== 3) { state[next] = 3; path[tail++] = next; }
      }
    }
    if (outlets !== 1) throw new RangeError('Lake body must have exactly one spill outlet.');
  }
}
