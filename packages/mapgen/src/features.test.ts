import { expect, test } from 'vitest';
import fc from 'fast-check';
import { FEATURE, FEATURE_MASK, generateWorld, isValidFeatureMask, naturalFeatures, neighbors, TERRAIN, WATER_DEPTH } from './index';

function fingerprint(values: Iterable<number>): string {
  let hash = 0x811c9dc5;
  for (const value of values) hash = Math.imul(hash ^ value, 0x01000193) >>> 0;
  return hash.toString(16);
}

test('feature identities are frozen and independent of generator labels and cultivation overlays', () => {
  expect(FEATURE).toEqual({ spring: 1, ore: 2, oldGrowth: 4, waterlogging: 8, peat: 16, richShoals: 32, glassShards: 64 });
  expect(Object.values(FEATURE).reduce((mask, bit) => mask | bit, 0)).toBe(FEATURE_MASK);
  for (const version of [1, 2, 3, 4] as const) {
    const world = generateWorld(20260905, 'tiny', 8, version);
    const features = Array.from(world.terrain, (_, cell) => naturalFeatures(world, cell));
    expect(fingerprint(features)).toBe('e71620f1');
    // A caller's sparse cultivation overlay never enters World. Even an invalid
    // label-only copy cannot rewrite the immutable geology queried here.
    expect(Array.from(world.terrain, (_, cell) => naturalFeatures({ ...world, biome: new Uint8Array() }, cell))).toEqual(features);
  }
});

test.each(['huge', 'legendary'] as const)('%s features retain useful deposits with consistent physical eligibility', size => {
  for (const seed of [42, 20260905]) {
    const world = generateWorld(seed, size, 48);
    const counts = new Map(Object.values(FEATURE).map(bit => [bit, 0]));
    let valid = true;
    for (let cell = 0; cell < world.terrain.length; cell++) {
      const mask = naturalFeatures(world, cell), terrain = world.terrain[cell], depth = world.waterDepth[cell];
      if (!isValidFeatureMask(mask)) valid = false;
      for (const bit of Object.values(FEATURE)) if (mask & bit) counts.set(bit, counts.get(bit)! + 1);
      if (mask & FEATURE.richShoals && (terrain !== TERRAIN.water || depth !== WATER_DEPTH.shallow)) valid = false;
      if (mask & FEATURE.oldGrowth && terrain !== TERRAIN.forest) valid = false;
      if (mask & FEATURE.ore && terrain !== TERRAIN.hills && terrain !== TERRAIN.mountain) valid = false;
      if (mask & FEATURE.peat && !(mask & FEATURE.waterlogging)) valid = false;
      if (mask & (FEATURE.spring | FEATURE.waterlogging | FEATURE.peat) && (terrain === TERRAIN.water || terrain === TERRAIN.mountain)) valid = false;
      if (mask & FEATURE.glassShards && !(depth === WATER_DEPTH.shallow || neighbors(cell, world.width, world.height).some(next => world.terrain[next] === TERRAIN.water))) valid = false;
      if (depth === WATER_DEPTH.deep && mask) valid = false;
    }
    expect(valid).toBe(true);
    expect([...counts.values()].every(count => count > 10)).toBe(true);
  }
});

test('feature queries use no shared mutable state and reject invalid cells before looking up terrain', () => {
  fc.assert(fc.property(fc.integer(), fc.integer({ min: 0, max: 1535 }), (seed, cell) => {
    const world = generateWorld(seed, 'tiny', 4), before = world.terrain.slice();
    const result = naturalFeatures(world, cell);
    naturalFeatures(world, (cell + 3) % world.terrain.length);
    expect(naturalFeatures(world, cell)).toBe(result);
    expect(isValidFeatureMask(result)).toBe(true);
    expect(world.terrain).toEqual(before);
  }), { numRuns: 30, seed: 20260906 });
  const world = generateWorld(42, 'tiny', 4);
  for (const cell of [-1, 1536, NaN, 0.5]) expect(() => naturalFeatures(world, cell)).toThrow(RangeError);
  expect(() => naturalFeatures({ ...world, waterDepth: new Uint8Array() }, 0)).toThrow(RangeError);
  expect([-1, 128, NaN, 0.5].some(isValidFeatureMask)).toBe(false);
});
