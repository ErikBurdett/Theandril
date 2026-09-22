import fc from 'fast-check';
import { expect, test } from 'vitest';
import { BIOME, describeGeography, deriveV6Biomes, generateWorld, inspectV6Climate, isLake, isPassable, neighbors, riverSize, validateHydrology } from './index';

// Byte-exact generator6 worlds (and the retained v5/v6 diagnostics seals) are in
// historical-seals.test.ts; generator8 carries the modern quality checks forward.
const layouts = ['continents', 'islands', 'archipelago'] as const;

test.each(layouts)('generator6 %s retains bounded hydrology, genuine starting regions and dense48-seat viability across seeds', layout => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.constantFrom(4, 48), (seed, count) => {
    const world = generateWorld(seed, 'tiny', count, 6, { layout }), report = describeGeography(world);
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
  }), { numRuns: 12, seed: 20260907 });
});

test('generated climate stages reproduce biomes exactly and respect actual freshwater, elevation and physical artwork constraints', () => {
  const world = generateWorld(20260905, 'small', 12, 6), before = world.biome.slice(), climate = inspectV6Climate(world);
  expect(deriveV6Biomes(world, climate.elevation)).toEqual(world.biome);
  let inlandMarshes = 0, riparianCells = 0, shadowCells = 0;
  const violations: number[] = [];
  for (let cell = 0; cell < world.terrain.length; cell++) {
    const physical = world.terrain[cell], biome = world.biome[cell];
    if ((physical === 0) !== (biome === BIOME.ocean) || (physical === 4) !== (biome === BIOME.alpine)) violations.push(cell);
    if (riverSize(world.hydrology[cell]!) && physical !== 0) { riparianCells++; if (climate.moisture[cell]! < 67) violations.push(cell); }
    if (biome === BIOME.marsh) {
      if (physical === 3 || climate.elevation[cell]! > 1000) violations.push(cell);
      if (!neighbors(cell, world.width, world.height).some(next => world.terrain[next] === 0)) {
        inlandMarshes++; if (climate.freshwaterDistance[cell]! > 1) violations.push(cell);
      }
    }
    if (isLake(world.hydrology[cell]!) && world.waterDepth[cell] !== 1) violations.push(cell);
    if (climate.rainShadow[cell]! > 0) shadowCells++;
  }
  expect(violations).toEqual([]);
  expect(inlandMarshes).toBeGreaterThan(100); expect(riparianCells).toBeGreaterThan(100); expect(shadowCells).toBeGreaterThan(100);
  climate.elevation.fill(4095); climate.moisture.fill(0); expect(world.biome).toEqual(before);
  expect(() => inspectV6Climate(generateWorld(20260905, 'tiny', 4, 5))).toThrow(RangeError);
});
