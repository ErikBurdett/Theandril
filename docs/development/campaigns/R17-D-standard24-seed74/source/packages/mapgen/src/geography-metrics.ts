import { BIOME_NAMES, TERRAIN, type World } from './index';
import { directionNeighbor, hydrologyDownstream, riverSize } from './hydrology';

/** Explicit diagnostic only: linear scratch storage, no canonical fields/cache. */
export function geographicDiversity(world: World) {
  const { width, height, terrain, hydrology, biome } = world, count = terrain.length;
  const biomeCounts = new Uint32Array(BIOME_NAMES.length), riverSizes = [0, 0, 0, 0];
  const paths = new Int32Array(count).fill(-1), trunks = new Uint32Array(count), stack = new Int32Array(count), passes = new Uint8Array(count);
  let longestRiver = 0, longestMajorTrunk = 0, matchingLandEdges = 0, landEdges = 0;
  const reach = Math.max(2, Math.floor(width / 64));
  for (let cell = 0; cell < count; cell++) {
    biomeCounts[biome[cell]!] = biomeCounts[biome[cell]!]! + 1;
    const size = riverSize(hydrology[cell]!); if (size) riverSizes[size] = riverSizes[size]! + 1;
    if (!hydrology[cell]) paths[cell] = 0;
    // One horizontal edge per east–west pair, excluding water and row wrapping.
    // This directional sample is not agreement across all six hex neighbors.
    if (cell % width !== width - 1 && terrain[cell] && terrain[cell + 1]) { landEdges++; if (biome[cell] === biome[cell + 1]) matchingLandEdges++; }
    if (terrain[cell] === TERRAIN.water || terrain[cell] === TERRAIN.mountain) continue;
    // A candidate has real barriers on opposite rays and traversable land on a
    // different opposing axis. Adjacent candidates are one pass region below.
    const barrier = (direction: number): boolean => {
      let at = cell;
      for (let step = 0; step < reach; step++) {
        const next = directionNeighbor(at, width, height, direction);
        if (next === null || terrain[next] === TERRAIN.water) return false;
        if (terrain[next] === TERRAIN.mountain) return true;
        at = next;
      }
      return false;
    };
    const open = (direction: number): boolean => {
      const next = directionNeighbor(cell, width, height, direction);
      return next !== null && terrain[next] !== TERRAIN.water && terrain[next] !== TERRAIN.mountain;
    };
    for (let axis = 1; axis <= 3; axis++) if (barrier(axis) && barrier(axis + 3)) {
      for (let other = 1; other <= 3; other++) if (axis !== other && open(other) && open(other + 3)) passes[cell] = 1;
    }
  }
  for (let origin = 0; origin < count; origin++) if (paths[origin] === -1) {
    let cell = origin, length = 0;
    while (paths[cell] === -1) {
      if (length >= count) throw new Error('Diagnostic drainage cycle.');
      stack[length++] = cell;
      const next = hydrologyDownstream(cell, width, height, hydrology[cell]!);
      if (next === null) throw new Error('Diagnostic drainage outlet missing.');
      cell = next;
    }
    while (length > 0) {
      const previous = stack[--length]!, size = riverSize(hydrology[previous]!);
      paths[previous] = paths[cell]! + Number(size > 0);
      trunks[previous] = size === 3 ? 1 + trunks[cell]! : 0;
      longestRiver = Math.max(longestRiver, paths[previous]!); longestMajorTrunk = Math.max(longestMajorTrunk, trunks[previous]!); cell = previous;
    }
  }
  let passRegions = 0, passCells = 0;
  for (let origin = 0; origin < count; origin++) if (passes[origin] === 1) {
    passRegions++; let head = 0, tail = 1; stack[0] = origin; passes[origin] = 2;
    while (head < tail) {
      const cell = stack[head++]!; passCells++;
      for (let direction = 1; direction <= 6; direction++) {
        const next = directionNeighbor(cell, width, height, direction);
        if (next !== null && passes[next] === 1) { passes[next] = 2; stack[tail++] = next; }
      }
    }
  }
  return { biomeCounts: Object.fromEntries(BIOME_NAMES.map((name, id) => [name, biomeCounts[id]!])), landBiomeNeighborAgreement: matchingLandEdges / Math.max(1, landEdges),
    landBiomeNeighborSampling: 'east-west-same-row-land-edges' as const, landBiomeSampledEdges: landEdges, landBiomeMatchingEdges: matchingLandEdges,
    riverSizeCells: riverSizes.slice(1), longestRiverCellsToSea: longestRiver, longestConnectedMajorTrunk: longestMajorTrunk,
    passRegions, passCells, passDefinition: `Connected passable candidates with opposing mountain barriers within${reach}hexes and a different open opposing axis; not a strategic route-connectivity guarantee.` };
}
