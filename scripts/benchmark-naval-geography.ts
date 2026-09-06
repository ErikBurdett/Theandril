/** Geography only: no sim turns, pathfinding, save/archive costs, browser or hidden AI inputs. */
import { performance } from 'node:perf_hooks';
import { deriveWaterDepth, generateWorld, isPassable, MAP_DIMENSIONS, neighbors, RECOMMENDED_FACTION_COUNTS, TERRAIN, WATER_DEPTH, type MapSize, type World } from '@theandril/mapgen';

const args = new Map(process.argv.slice(2).map(arg => {
  const match = /^--(seed|samples|size)=(.+)$/.exec(arg);
  if (!match) throw new Error('Use --seed=uint32, --samples=1..21 or --size=<preset>.');
  return [match[1]!, match[2]!] as const;
}));
function integer(value: string | undefined, fallback: number, maximum: number): number {
  const number = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(number) || number < 0 || number > maximum) throw new RangeError('Invalid bounded integer argument.');
  return number;
}
const seed = integer(args.get('seed'), 20260905, 0xffff_ffff);
const samples = integer(args.get('samples'), 7, 21);
if (!samples) throw new RangeError('At least one sample is required.');
const requestedSize = args.get('size');
if (requestedSize && !Object.hasOwn(MAP_DIMENSIONS, requestedSize)) throw new RangeError('Unknown map size.');
const sizes: MapSize[] = requestedSize ? [requestedSize as MapSize] : ['huge', 'legendary'];
function fingerprint(values: Iterable<number>): string {
  let hash = 0x811c9dc5;
  for (const value of values) hash = Math.imul(hash ^ value, 0x01000193) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
function stats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, meanMs: values.reduce((sum, value) => sum + value, 0) / values.length, medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1]!, minMs: sorted[0]!, maxMs: sorted.at(-1)! };
}
function components(world: World, shallowOnly: boolean) {
  const seen = new Uint8Array(world.terrain.length), queue = new Int32Array(world.terrain.length);
  const allowed = (cell: number) => world.terrain[cell] === TERRAIN.water && (!shallowOnly || world.waterDepth[cell] === WATER_DEPTH.shallow);
  let count = 0, largestCells = 0;
  for (let origin = 0; origin < seen.length; origin++) {
    if (seen[origin] || !allowed(origin)) continue;
    let head = 0, tail = 1;
    queue[0] = origin; seen[origin] = 1; count++;
    while (head < tail) for (const next of neighbors(queue[head++]!, world.width, world.height)) {
      if (!seen[next] && allowed(next)) { seen[next] = 1; queue[tail++] = next; }
    }
    largestCells = Math.max(largestCells, tail);
  }
  return { count, largestCells };
}
const cases = sizes.map(size => {
  const factions = RECOMMENDED_FACTION_COUNTS[size];
  const world = generateWorld(seed, size, factions);
  const physical = (value: World) => [fingerprint(value.terrain), fingerprint(value.fertility), JSON.stringify(value.starts)];
  for (const version of [1, 2] as const) {
    const legacy = generateWorld(seed, size, factions, version);
    if (JSON.stringify(physical(legacy)) !== JSON.stringify(physical(world)) || version === 2 && fingerprint(legacy.biome) !== fingerprint(world.biome)) throw new Error('Legacy physical geography changed.');
  }
  for (let warm = 0; warm < 2; warm++) { generateWorld(seed, size, factions); deriveWaterDepth(world.width, world.height, world.terrain); }
  const generationMs: number[] = [], depthMs: number[] = [];
  const expectedDepth = fingerprint(world.waterDepth);
  for (let sample = 0; sample < samples; sample++) {
    let start = performance.now();
    const generated = generateWorld(seed, size, factions);
    generationMs.push(performance.now() - start);
    start = performance.now();
    const depth = deriveWaterDepth(world.width, world.height, world.terrain);
    depthMs.push(performance.now() - start);
    if (fingerprint(generated.waterDepth) !== expectedDepth || fingerprint(depth) !== expectedDepth) throw new Error('Non-deterministic depth.');
  }
  const counts = [0, 0, 0];
  let coastalPassableLand = 0;
  for (let cell = 0; cell < world.terrain.length; cell++) {
    const depth = world.waterDepth[cell]!;
    counts[depth] = counts[depth]! + 1;
    if (isPassable(world.terrain[cell]!) && neighbors(cell, world.width, world.height).some(next => world.terrain[next] === TERRAIN.water)) coastalPassableLand++;
  }
  return { size, seed, factions, cells: world.terrain.length, generatorVersion: world.generatorVersion,
    counts: { land: counts[0], shallow: counts[1], deep: counts[2], coastalPassableLand },
    fingerprints: { terrain: fingerprint(world.terrain), fertility: fingerprint(world.fertility), biome: fingerprint(world.biome), waterDepth: expectedDepth },
    legacyPhysicalIdentity: true, depthOutputBytes: world.waterDepth.byteLength, depthTemporaryQueueBoundBytes: world.waterDepth.length * 4,
    depthJsonArrayBytes: Buffer.byteLength(JSON.stringify(Array.from(world.waterDepth)), 'utf8'),
    allWaterComponents: components(world, false), shallowOnlyComponents: components(world, true),
    generation: stats(generationMs), deriveWaterDepth: stats(depthMs) };
});
console.log(JSON.stringify({ scope: 'Current whole generation including the new shelf; standalone shelf only. Warmed samples exclude correctness checks, component diagnostics, JSON encoding, saves, simulation and browser. No claim of isolated host or naval gameplay throughput.', node: process.version, cases }, null, 2));
