import { expect, test } from 'vitest';
import fc from 'fast-check';
import { deriveWaterDepth, generateWorld, hexDistance, isPassable, isValidWaterDepth, MAP_DIMENSIONS, neighbors, TERRAIN, WATER_DEPTH, type MapSize } from './index';

function fingerprint(values: Iterable<number>): string {
  let hash = 0x811c9dc5;
  for (const value of values) hash = Math.imul(hash ^ value, 0x01000193) >>> 0;
  return hash.toString(16);
}

test('coastal shelf stops exactly two odd-row water hexes from land without edge wrapping', () => {
  const width = 9; const height = 7;
  const terrain = new Uint8Array(width * height);
  const island = 3 * width + 4;
  terrain[island] = TERRAIN.mountain;
  const depth = deriveWaterDepth(width, height, terrain);
  for (let cell = 0; cell < terrain.length; cell++) {
    const distance = hexDistance(cell, island, width);
    expect(depth[cell]).toBe(distance === 0 ? WATER_DEPTH.land : distance <= 2 ? WATER_DEPTH.shallow : WATER_DEPTH.deep);
  }
  expect(deriveWaterDepth(7, 1, Uint8Array.from([1, 0, 0, 0, 0, 0, 0]))).toEqual(Uint8Array.from([0, 1, 1, 2, 2, 2, 2]));
  expect(deriveWaterDepth(1, 7, Uint8Array.from([0, 0, 0, 0, 0, 0, 1]))).toEqual(Uint8Array.from([2, 2, 2, 2, 1, 1, 0]));
});

test('enclosed water uses the same shelf rule; all-water edges remain deep and all-land remains dry', () => {
  expect(deriveWaterDepth(3, 3, new Uint8Array(9))).toEqual(new Uint8Array(9).fill(WATER_DEPTH.deep));
  expect(deriveWaterDepth(3, 3, new Uint8Array(9).fill(TERRAIN.forest))).toEqual(new Uint8Array(9));
  const lagoon = new Uint8Array(25).fill(TERRAIN.plains);
  lagoon[12] = TERRAIN.water;
  expect(deriveWaterDepth(5, 5, lagoon)[12]).toBe(WATER_DEPTH.shallow);
});

test('arbitrary terrain agrees with independent nearest-land distances and never mutates its input', () => {
  fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 49, maxLength: 49 }), cells => {
    const terrain = Uint8Array.from(cells);
    const depth = deriveWaterDepth(7, 7, terrain);
    const land = cells.flatMap((value, cell) => value ? [cell] : []);
    for (let cell = 0; cell < terrain.length; cell++) {
      const nearest = Math.min(...land.map(other => hexDistance(cell, other, 7)));
      expect(depth[cell]).toBe(cells[cell] ? WATER_DEPTH.land : nearest <= 2 ? WATER_DEPTH.shallow : WATER_DEPTH.deep);
    }
    expect(Array.from(terrain)).toEqual(cells);
    expect(depth).toEqual(deriveWaterDepth(7, 7, terrain));
    depth.fill(255);
    expect(deriveWaterDepth(7, 7, terrain).every(isValidWaterDepth)).toBe(true);
  }), { numRuns: 100, seed: 20260905 });
});

test.each(Object.keys(MAP_DIMENSIONS) as MapSize[])('generator3 preserves old physical fields and generator2 climate on %s', size => {
  const modern = generateWorld(20260905, size, 48, 3);
  expect(modern.generatorVersion).toBe(3);
  for (const version of [1, 2] as const) {
    const old = generateWorld(20260905, size, 48, version);
    expect(fingerprint(modern.terrain)).toBe(fingerprint(old.terrain));
    expect(fingerprint(modern.fertility)).toBe(fingerprint(old.fertility));
    expect(modern.starts).toEqual(old.starts);
    expect(fingerprint(modern.waterDepth)).toBe(fingerprint(old.waterDepth));
    if (version === 2) expect(fingerprint(modern.biome)).toBe(fingerprint(old.biome));
  }
});

test.each([
  ['tiny', '46301137'], ['huge', 'cbbea0e5'], ['legendary', 'c922fb2b'],
] as const)('freezes generator3 seed20260905 %s water-depth fingerprint', (size, expected) => {
  expect(fingerprint(generateWorld(20260905, size, 8, 3).waterDepth)).toBe(expected);
});

test.each(['huge', 'legendary'] as const)('%s has real shallow/deep regions, consistent shores and unchanged safe starts', size => {
  for (const seed of [42, 20260905]) {
    const world = generateWorld(seed, size, 48, 4);
    const counts = new Uint32Array(3);
    let consistent = true;
    for (let cell = 0; cell < world.terrain.length; cell++) {
      const depth = world.waterDepth[cell]!;
      counts[depth] = counts[depth]! + 1;
      if ((world.terrain[cell] !== TERRAIN.water) !== (depth === WATER_DEPTH.land)) consistent = false;
      if (depth === WATER_DEPTH.land) continue;
      const adjacent = neighbors(cell, world.width, world.height);
      const nearLand = adjacent.some(next => world.terrain[next] !== TERRAIN.water || neighbors(next, world.width, world.height).some(second => world.terrain[second] !== TERRAIN.water));
      if (nearLand !== (depth === WATER_DEPTH.shallow)) consistent = false;
    }
    expect(consistent).toBe(true);
    expect(world.waterDepth.every(isValidWaterDepth)).toBe(true);
    expect(counts[WATER_DEPTH.shallow]! / world.terrain.length).toBeGreaterThan(0.01);
    expect(counts[WATER_DEPTH.deep]! / world.terrain.length).toBeGreaterThan(0.2);
    for (const start of world.starts) {
      expect(world.waterDepth[start]).toBe(WATER_DEPTH.land);
      expect(world.fertility[start]).toBeGreaterThanOrEqual(75);
      expect(neighbors(start, world.width, world.height).filter(cell => isPassable(world.terrain[cell]!)).length).toBeGreaterThanOrEqual(4);
    }
  }
});

test('rejects malformed dimensions, unknown physical terrain and invalid depths before allocating', () => {
  for (const [width, height] of [[0, 1], [1, 0], [1.5, 1], [1, Infinity], [NaN, 1], [351_000, 1], [2, 1]]) {
    expect(() => deriveWaterDepth(width!, height!, new Uint8Array(1))).toThrow(RangeError);
  }
  expect(() => deriveWaterDepth(1, 1, Uint8Array.of(5))).toThrow(RangeError);
  expect(() => deriveWaterDepth(1, 1, [0] as unknown as Uint8Array)).toThrow(RangeError);
  expect([-1, 3, NaN, 1.5, Infinity].some(isValidWaterDepth)).toBe(false);
  expect(Object.values(WATER_DEPTH).every(isValidWaterDepth)).toBe(true);
});
