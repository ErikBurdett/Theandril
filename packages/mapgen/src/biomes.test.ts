import { expect, test } from 'vitest';
import fc from 'fast-check';
import { BIOME, BIOME_NAMES, deriveBiomes, deriveClimate, generateWorld, isValidBiome, MAP_DIMENSIONS, neighbors, TERRAIN, type GeneratorVersion, type MapSize } from './index';

function fingerprint(values: Iterable<number>): string {
  let hash = 0x811c9dc5;
  for (const value of values) hash = Math.imul(hash ^ value, 0x01000193) >>> 0;
  return hash.toString(16);
}

test('freezes distinct modern climate and legacy terrain-only biome fingerprints', () => {
  const modern = generateWorld(20260905, 'tiny', 8);
  const legacy = generateWorld(20260905, 'tiny', 8, 1);
  expect(modern.generatorVersion).toBe(2);
  expect(legacy.generatorVersion).toBe(1);
  expect(fingerprint(modern.biome)).toBe('fa0ab681');
  expect(fingerprint(legacy.biome)).toBe('583ccc48');
  expect(deriveBiomes(1, 5, 1, Uint8Array.from([0, 1, 2, 3, 4]), 1)).toEqual(Uint8Array.from([0, 1, 2, 1, 9]));
});

test.each(Object.keys(MAP_DIMENSIONS) as MapSize[])('preserves all physical geography, fertility and starts on %s across versions', size => {
  const modern = generateWorld(20260905, size, 48, 2);
  const legacy = generateWorld(20260905, size, 48, 1);
  expect(fingerprint(modern.terrain)).toBe(fingerprint(legacy.terrain));
  expect(fingerprint(modern.fertility)).toBe(fingerprint(legacy.fertility));
  expect(modern.starts).toEqual(legacy.starts);
  expect(fingerprint(deriveBiomes(modern.seed, modern.width, modern.height, modern.terrain, 2))).toBe(fingerprint(modern.biome));
  expect(modern.biome.every(isValidBiome)).toBe(true);
});

test('climate and classification are deterministic bounded detached stages across arbitrary seeds', () => {
  fc.assert(fc.property(fc.integer({ min: -2147483648, max: 4294967295 }), seed => {
    const world = generateWorld(seed, 'tiny', 4);
    const terrain = new Uint8Array(world.terrain);
    const before = fingerprint(world.biome);
    const climate = deriveClimate(seed, world.width, world.height, world.terrain);
    expect(climate.temperature.every(value => value <= 100)).toBe(true);
    expect(climate.moisture.every(value => value <= 100)).toBe(true);
    expect(world.terrain).toEqual(terrain);
    expect(fingerprint(deriveBiomes(seed >>> 0, world.width, world.height, terrain))).toBe(before);
    climate.temperature.fill(255); climate.moisture.fill(255);
    expect(fingerprint(world.biome)).toBe(before);
  }), { numRuns: 40, seed: 20260905 });
});

test.each(['huge', 'legendary'] as const)('%s climate has coherent diverse distributions and preserves every starting food guarantee', size => {
  for (const seed of [42, 20260905]) {
    const world = generateWorld(seed, size, 48);
    const climate = deriveClimate(seed, world.width, world.height, world.terrain);
    const counts = new Uint32Array(BIOME_NAMES.length);
    let matchingLandEdges = 0;
    let landEdges = 0;
    let consistent = true;
    for (let cell = 0; cell < world.biome.length; cell++) {
      const biome = world.biome[cell]!;
      counts[biome] = counts[biome]! + 1;
      const terrain = world.terrain[cell];
      if ((terrain === TERRAIN.water) !== (biome === BIOME.ocean)) consistent = false;
      if ((terrain === TERRAIN.mountain) !== (biome === BIOME.alpine)) consistent = false;
      if ([BIOME.temperateForest, BIOME.taiga, BIOME.rainforest].includes(biome as 2 | 3 | 8) && terrain !== TERRAIN.forest) consistent = false;
      if (biome === BIOME.tundra && climate.temperature[cell]! >= 23) consistent = false;
      if (biome === BIOME.desert && (terrain === TERRAIN.forest || climate.temperature[cell]! < 48 || climate.moisture[cell]! >= 35)) consistent = false;
      if (biome === BIOME.marsh && !neighbors(cell, world.width, world.height).some(next => world.terrain[next] === TERRAIN.water)) consistent = false;
      const next = cell + 1;
      if (next % world.width && next < world.biome.length && terrain !== TERRAIN.water && world.terrain[next] !== TERRAIN.water) {
        landEdges++;
        if (biome === world.biome[next]) matchingLandEdges++;
      }
    }
    expect(consistent).toBe(true);
    expect(counts.every(count => count > 50)).toBe(true);
    expect((counts[BIOME.desert]! + counts[BIOME.steppe]!) / world.biome.length).toBeGreaterThan(0.05);
    expect((counts[BIOME.taiga]! + counts[BIOME.tundra]!) / world.biome.length).toBeGreaterThan(0.01);
    expect(counts[BIOME.rainforest]! / world.biome.length).toBeGreaterThan(0.01);
    expect(matchingLandEdges / landEdges).toBeGreaterThan(0.88);
    for (const start of world.starts) {
      expect(world.fertility[start]).toBeGreaterThanOrEqual(75);
      expect(neighbors(start, world.width, world.height).some(cell => world.fertility[cell]! >= 70)).toBe(true);
      expect(world.biome[start]).not.toBe(BIOME.ocean);
      expect(world.biome[start]).not.toBe(BIOME.alpine);
    }
  }
});

test('rejects unsupported versions, mismatched dimensions and invalid physical inputs', () => {
  expect(() => generateWorld(1, 'tiny', 4, 3 as GeneratorVersion)).toThrow(RangeError);
  expect(() => deriveBiomes(1, 1, 1, new Uint8Array([0]), 0 as GeneratorVersion)).toThrow(RangeError);
  expect(() => deriveBiomes(NaN, 1, 1, new Uint8Array([0]))).toThrow(RangeError);
  expect(() => deriveBiomes(1, 2, 1, new Uint8Array([0]))).toThrow(RangeError);
  expect(() => deriveClimate(1, 1, 1, new Uint8Array([5]))).toThrow(RangeError);
  expect(() => deriveClimate(1, 0, 0, new Uint8Array())).toThrow(RangeError);
  expect([-1, 10, NaN, 1.5].some(isValidBiome)).toBe(false);
  expect(Object.values(BIOME).every(isValidBiome)).toBe(true);
});
