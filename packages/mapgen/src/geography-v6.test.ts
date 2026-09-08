import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { expect, test } from 'vitest';
import { BIOME, describeGeography, deriveV6Biomes, generateWorld, geographicDiversity, inspectV6Climate, isLake, isPassable, neighbors, riverSize, validateHydrology, type MapSize, type World } from './index';

const layouts = ['continents', 'islands', 'archipelago'] as const;
const fingerprint = (world: World, full = false) => {
  const hash = createHash('sha256');
  for (const values of [world.terrain, world.fertility, world.biome, world.waterDepth, world.hydrology]) hash.update(values);
  return hash.update(JSON.stringify(full ? { seed: world.seed, width: world.width, height: world.height, generatorVersion: world.generatorVersion, layout: world.layout, starts: world.starts }
    : { seed: world.seed, layout: world.layout, starts: world.starts })).digest('hex');
};

test('all twelve retained played-generator5 benchmark worlds remain byte-exact after generator6 wiring', () => {
  const prior = JSON.parse(readFileSync(new URL('../diagnostics/v5-geography-final.json', import.meta.url), 'utf8')) as {
    measurements: { size: MapSize; layout: typeof layouts[number]; seed: number; factionCount: number; sha256: string }[];
  };
  expect(prior.measurements).toHaveLength(12);
  for (const sample of prior.measurements) expect(fingerprint(generateWorld(sample.seed, sample.size, sample.factionCount, 5, { layout: sample.layout }), true)).toBe(sample.sha256);
});

test.each(layouts)('generator6 %s retains bounded hydrology, genuine starting regions and dense48-seat viability across seeds', layout => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.constantFrom(4, 48), (seed, count) => {
    const world = generateWorld(seed, 'tiny', count, 6, { layout }), report = describeGeography(world);
    expect(fingerprint(generateWorld(seed, 'tiny', count, 6, { layout }))).toBe(fingerprint(world));
    expect(world.generatorVersion).toBe(6); expect(world.layout).toBe(layout);
    expect(world.starts).toHaveLength(count); expect(new Set(world.starts).size).toBe(count);
    expect(report.landCells / report.cells).toBeGreaterThan(.23); expect(report.landCells / report.cells).toBeLessThan(.8);
    expect(report.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3)).toBe(true);
    expect(world.biome.every(value => value <= 11)).toBe(true);
    for (const start of world.starts) {
      expect(world.fertility[start]).toBeGreaterThanOrEqual(75);
      expect(neighbors(start, world.width, world.height).filter(next => isPassable(world.terrain[next]!)).length).toBeGreaterThanOrEqual(4);
      expect(neighbors(start, world.width, world.height).some(next => world.fertility[next]! >= 70)).toBe(true);
    }
    if (layout === 'archipelago') { expect(report.meaningfulLandmasses).toBeGreaterThanOrEqual(3); expect(report.startComponents).toBeGreaterThanOrEqual(3); }
    expect(() => validateHydrology(world)).not.toThrow();
  }), { numRuns: 120, seed: 20260907 });
});

test.each(['small', 'huge', 'legendary'] as const)('generator6 %s has useful connected trunks, enclosed waters, passes, distinct biomes and unclipped coasts', size => {
  for (const layout of layouts) {
    const world = generateWorld(20260905, size, 48, 6, { layout }), geography = describeGeography(world), diversity = geographicDiversity(world);
    expect(geography.meaningfulLandmasses).toBeGreaterThanOrEqual(4);
    expect(geography.lakeBodies).toBeGreaterThan(3);
    expect(geography.inlandSeaBodies).toBeGreaterThan(0);
    expect(diversity.longestConnectedMajorTrunk).toBeGreaterThanOrEqual(6);
    expect(diversity.longestRiverCellsToSea).toBeGreaterThanOrEqual(diversity.longestConnectedMajorTrunk);
    expect(diversity.passRegions).toBeGreaterThan(1);
    expect(diversity.landBiomeNeighborAgreement).toBeGreaterThan(.8);
    expect(Object.values(diversity.biomeCounts).filter(count => count > 0)).toHaveLength(12);
    expect(geography.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3)).toBe(true);
    for (let y = 0; y < world.height; y++) for (const x of [0, 1, world.width - 2, world.width - 1]) expect(world.terrain[y * world.width + x]).toBe(0);
    for (let x = 0; x < world.width; x++) for (const y of [0, 1, world.height - 2, world.height - 1]) expect(world.terrain[y * world.width + x]).toBe(0);
    expect(() => validateHydrology(world)).not.toThrow();
  }
});

test('three independent Small seeds show additional meaningful offshore bodies and real inland water in every layout', () => {
  for (const seed of [42, 74, 20260905]) for (const layout of layouts) {
    const current = describeGeography(generateWorld(seed, 'small', 12, 6, { layout }));
    const prior = describeGeography(generateWorld(seed, 'small', 12, 5, { layout }));
    expect(current.landComponents.filter(count => count >= 24).length).toBeGreaterThan(prior.landComponents.filter(count => count >= 24).length);
    expect(current.lakeBodies).toBeGreaterThan(prior.lakeBodies);
    expect(current.inlandWaterBodies.length).toBeGreaterThanOrEqual(1);
    expect(current.landCells / current.cells).toBeGreaterThan(.15);
  }
});

test('generated climate stages reproduce biomes exactly and respect actual freshwater, elevation and physical artwork constraints', () => {
  const world = generateWorld(20260905, 'small', 12, 6), before = fingerprint(world), climate = inspectV6Climate(world);
  expect(deriveV6Biomes(world, climate.elevation)).toEqual(world.biome);
  let inlandMarshes = 0, riparianCells = 0, shadowCells = 0;
  for (let cell = 0; cell < world.terrain.length; cell++) {
    const physical = world.terrain[cell], biome = world.biome[cell];
    if (physical === 0) expect(biome).toBe(BIOME.ocean);
    else if (physical === 4) expect(biome).toBe(BIOME.alpine);
    else expect(biome).not.toBe(BIOME.alpine);
    if (riverSize(world.hydrology[cell]!) && physical !== 0) { riparianCells++; expect(climate.moisture[cell]).toBeGreaterThanOrEqual(67); }
    if (biome === BIOME.marsh) {
      expect(physical).not.toBe(3); expect(climate.elevation[cell]).toBeLessThanOrEqual(1000);
      if (!neighbors(cell, world.width, world.height).some(next => world.terrain[next] === 0)) {
        inlandMarshes++; expect(climate.freshwaterDistance[cell]).toBeLessThanOrEqual(1);
      }
    }
    if (isLake(world.hydrology[cell]!)) expect(world.waterDepth[cell]).toBe(1);
    if (climate.rainShadow[cell]! > 0) shadowCells++;
  }
  expect(inlandMarshes).toBeGreaterThan(100); expect(riparianCells).toBeGreaterThan(100); expect(shadowCells).toBeGreaterThan(100);
  climate.elevation.fill(4095); climate.moisture.fill(0); expect(fingerprint(world)).toBe(before);
  expect(() => inspectV6Climate(generateWorld(20260905, 'tiny', 4, 5))).toThrow(RangeError);
});

test.each([
  ['tiny', 'continents', 'b7f59f3810b8bed5b6fc99f2154accafdf5b22d19cdc35707f02d1c6b4377578'],
  ['tiny', 'islands', 'f70bdd051eb832a6bf4fffc567429aef6ab26436c35fb10918344022f4c84b4c'],
  ['tiny', 'archipelago', '4725db539cec2f77ea70df34f0df79219427b223db14d641a67c1387b9d09ea3'],
  ['small', 'continents', '9f51e5c2c627e5be40c92d9b140da92a4f58325e792be51e3e7eebc139d5a82b'],
  ['small', 'islands', 'd9eea770d358b0893b2a737669f1be31b3897cbc1879c87e842141e92bfede45'],
  ['small', 'archipelago', '0728f08bf2e654b255d48f39b52bea722f163f6c945d6fabca5b4df43efbd54c'],
] as const)('freezes new generator6 %s/%s without replacing historical goldens', (size, layout, expected) => {
  expect(fingerprint(generateWorld(20260905, size, 4, 6, { layout }))).toBe(expected);
});
