import { hexDistance, SeededRandom, type MapLayout } from './index';
import { directionNeighbor } from './hydrology';

export interface InlandSeaCarving { center: number; hostCells: number; targetCells: number; carvedCells: number; usableShoreCells: number }
const BUCKETS = 8192;
function hash(value: number): number {
  value = Math.imul(value ^ value >>> 16, 0x21f0aaad);
  value = Math.imul(value ^ value >>> 15, 0x735a2d97);
  return (value ^ value >>> 15) >>> 0;
}

/** Generator7 only: bounded connected salt-sea excavation before normal drainage.
 * Three intact land hexes separate each new sea from preexisting water. The fixed
 * bucket flood follows an unequal, softly warped basin envelope, not cell noise.
 * No retained arrays or gameplay discoveries are added to World. */
export function carveInlandSeasV7(seed: number, width: number, height: number, layout: Exclude<MapLayout, 'legacy'>,
  elevation: Uint16Array, rainfall: Uint8Array): InlandSeaCarving[] {
  const count = width * height;
  if (width < 100) throw new RangeError('Generator7 large basins require Small or larger relief.');
  if (elevation.length !== count || rainfall.length !== count) throw new RangeError('Basin relief dimensions differ.');
  const distance = new Uint16Array(count).fill(65535), labels = new Int32Array(count), queue = new Int32Array(count);
  let head = 0, tail = 0, landCells = 0;
  for (let cell = 0; cell < count; cell++) {
    if (elevation[cell] === 0) { distance[cell] = 0; queue[tail++] = cell; }
    else landCells++;
  }
  if (!tail) return []; // No known sea-level boundary means no safe inland margin.
  while (head < tail) {
    const cell = queue[head++]!;
    for (let direction = 1; direction <= 6; direction++) {
      const next = directionNeighbor(cell, width, height, direction);
      if (next !== null && distance[next] === 65535) { distance[next] = distance[cell]! + 1; queue[tail++] = next; }
    }
  }
  const hosts: { id: number; cells: number; center: number }[] = [];
  for (let origin = 0; origin < count; origin++) if (elevation[origin] && !labels[origin]) {
    const id = hosts.length + 1; head = 0; tail = 1; queue[0] = origin; labels[origin] = id;
    let center = -1, best = -Infinity;
    while (head < tail) {
      const cell = queue[head++]!;
      const score = distance[cell]! * 128 - Math.floor(elevation[cell]! / 32) + (hash(seed ^ cell) & 31);
      if (distance[cell]! >= 5 && score > best) { center = cell; best = score; }
      for (let direction = 1; direction <= 6; direction++) {
        const next = directionNeighbor(cell, width, height, direction);
        if (next !== null && elevation[next] && !labels[next]) { labels[next] = id; queue[tail++] = next; }
      }
    }
    hosts.push({ id, cells: tail, center });
  }
  const permille = layout === 'continents' ? 30 : layout === 'islands' ? 20 : 15;
  let remaining = Math.min(Math.floor(count * permille / 1000), Math.max(0, landCells - Math.ceil(count * .15)));
  const maximum = layout === 'continents' ? 3 : layout === 'islands' ? 2 : 1;
  const minimum = Math.max(24, Math.floor(count / 1000)), rng = new SeededRandom(seed ^ 0x37534541);
  const records: InlandSeaCarving[] = [], marked = new Uint8Array(count), heads = new Int32Array(BUCKETS), tails = new Int32Array(BUCKETS), links = new Int32Array(count);
  for (const host of hosts.filter(host => host.center >= 0 && host.cells >= minimum * 8).sort((a, b) => b.cells - a.cells || a.id - b.id).slice(0, 8)) {
    if (records.length >= maximum || remaining < minimum) break;
    const percentage = layout === 'continents' ? 12 + rng.nextInt(7) : layout === 'islands' ? 8 + rng.nextInt(7) : 5 + rng.nextInt(6);
    const target = Math.min(remaining, Math.floor(host.cells * percentage / 100));
    if (target < minimum) continue;
    heads.fill(-1); tails.fill(-1); marked.fill(0);
    const cx = host.center % width, cy = Math.floor(host.center / width), sign = rng.nextInt(2) ? 1 : -1;
    const lobe = Math.max(2, Math.floor(Math.sqrt(target) / 3)), noiseScale = Math.max(3, Math.floor(Math.sqrt(target) / 5)), phase = rng.nextInt(65536);
    const noise = (x: number, y: number): number => {
      const gx = Math.floor(x / noiseScale), gy = Math.floor(y / noiseScale), tx = x % noiseScale, ty = y % noiseScale;
      const sample = (dx: number, dy: number) => (hash(seed ^ phase ^ Math.imul(gx + dx, 0x632be5ab) ^ Math.imul(gy + dy, 0x85157af5)) & 255) - 128;
      return Math.floor(((sample(0, 0) * (noiseScale - tx) + sample(1, 0) * tx) * (noiseScale - ty)
        + (sample(0, 1) * (noiseScale - tx) + sample(1, 1) * tx) * ty) / (noiseScale * noiseScale));
    };
    const priority = (cell: number): number => {
      const x = cell % width, y = Math.floor(cell / width), dx = x - cx, dy = y - cy;
      const u = phase & 1 ? dy : dx, v = phase & 1 ? dx : dy, bu = u - sign * lobe, bv = v - Math.floor(lobe / 2);
      const main = 16 * u * u + 24 * v * v + sign * 6 * u * v;
      const branch = 28 * bu * bu + 37 * bv * bv;
      return Math.max(0, Math.min(BUCKETS - 1, Math.floor(Math.min(main, branch) * 512 / target) + noise(x, y) * 2 + Math.floor(elevation[cell]! / 16)));
    };
    const enqueue = (cell: number, level: number) => {
      marked[cell] = 1; links[cell] = -1;
      if (tails[level] === -1) heads[level] = cell; else links[tails[level]!] = cell;
      tails[level] = cell;
    };
    enqueue(host.center, 0); let selected = 0;
    for (let level = 0; level < BUCKETS && selected < target; level++) while (heads[level] !== -1 && selected < target) {
      const cell = heads[level]!; heads[level] = links[cell]!; if (heads[level] === -1) tails[level] = -1;
      marked[cell] = 2; queue[selected++] = cell;
      for (let direction = 1; direction <= 6; direction++) {
        const next = directionNeighbor(cell, width, height, direction);
        if (next !== null && !marked[next] && labels[next] === host.id && distance[next]! >= 4) enqueue(next, Math.max(level, priority(next)));
      }
    }
    // Keep only basins with room for real coastal expansion. Physical mountains
    // remain mountains; this guard does not manufacture towns or flatten shores.
    const shore = new Set<number>();
    for (let index = 0; index < selected; index++) for (let direction = 1; direction <= 6; direction++) {
      const next = directionNeighbor(queue[index]!, width, height, direction);
      if (next === null || marked[next] === 2 || !elevation[next] || elevation[next]! >= 2350) continue;
      let access = 0;
      for (let side = 1; side <= 6; side++) {
        const other = directionNeighbor(next, width, height, side);
        if (other !== null && marked[other] !== 2 && elevation[other] && elevation[other]! < 2350) access++;
      }
      if (access >= 4) shore.add(next);
    }
    const first = shore.values().next().value;
    if (selected < minimum || first === undefined || ![...shore].some(cell => hexDistance(first, cell, width) >= 4)) continue;
    for (let index = 0; index < selected; index++) { const cell = queue[index]!; elevation[cell] = 0; rainfall[cell] = 0; }
    remaining -= selected;
    records.push({ center: host.center, hostCells: host.cells, targetCells: target, carvedCells: selected, usableShoreCells: shore.size });
  }
  return records;
}
