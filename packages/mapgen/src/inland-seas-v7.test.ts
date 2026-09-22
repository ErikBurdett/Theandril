import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { describeGeography, deriveWaterDepth, generateWorld, inspectV7Climate, isLake, isPassable, neighbors, validateHydrology, type World } from './index';
import { carveInlandSeasV7 } from './inland-seas-v7';

const layouts = ['continents', 'islands', 'archipelago'] as const;
const fingerprint = (world: World) => {
  const hash = createHash('sha256');
  for (const values of [world.terrain, world.fertility, world.biome, world.waterDepth, world.hydrology]) hash.update(values);
  return hash.update(JSON.stringify({ seed: world.seed, width: world.width, height: world.height, generatorVersion: world.generatorVersion, layout: world.layout, starts: world.starts })).digest('hex');
};

// Byte-exact generator6/7 worlds and the retained diagnostics seals live in historical-seals.test.ts.
test('Tiny keeps its dense48-seat physical geography instead of forcing giant seas into a test map', () => {
  for (const layout of layouts) {
    const previous = generateWorld(74, 'tiny', 48, 6, { layout }), current = generateWorld(74, 'tiny', 48, 7, { layout });
    for (const key of ['terrain', 'fertility', 'biome', 'waterDepth', 'hydrology', 'starts'] as const) expect(current[key]).toEqual(previous[key]);
    expect(current.generatorVersion).toBe(7);
    expect(inspectV7Climate(current).inlandSeaCarvings).toEqual([]);
  }
});

test.each(layouts)('generator7 %s keeps large inland waters within host/map budgets, with viable starts and drainage', layout => {
  for (const seed of [42]) {
    const world = generateWorld(seed, 'small', 48, 7, { layout }), before = fingerprint(world), current = describeGeography(world), detail = inspectV7Climate(world);
    expect(current.inlandWaterBodies[0]).toBeGreaterThan(current.cells * .005);
    const budget = layout === 'continents' ? .03 : layout === 'islands' ? .02 : .015;
    expect(detail.inlandSeaCarvings.reduce((sum, basin) => sum + basin.carvedCells, 0)).toBeLessThanOrEqual(Math.floor(world.terrain.length * budget));
    for (const basin of detail.inlandSeaCarvings) {
      expect(basin.carvedCells).toBeLessThanOrEqual(basin.hostCells * .2);
      expect(basin.usableShoreCells).toBeGreaterThan(2);
      expect(world.terrain[basin.center]).toBe(0);
      expect(isLake(world.hydrology[basin.center]!)).toBe(false);
      expect(world.waterDepth[basin.center]).toBe(2);
    }
    expect(current.landCells / current.cells).toBeGreaterThan(.15);
    expect(current.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3)).toBe(true);
    expect(new Set(world.starts).size).toBe(48);
    for (const start of world.starts) {
      expect(world.fertility[start]).toBeGreaterThanOrEqual(75);
      expect(neighbors(start, world.width, world.height).filter(cell => isPassable(world.terrain[cell]!)).length).toBeGreaterThanOrEqual(4);
    }
    expect(fingerprint(world)).toBe(before);
    expect(() => validateHydrology(world)).not.toThrow();
  }
});

test('basin excavation keeps three untouched land hexes to the original sea and refuses unusable mountain shores', () => {
  const width = 128, height = 96, count = width * height;
  const original = new Uint16Array(count), rain = new Uint8Array(count).fill(8);
  for (let y = 12; y < height - 12; y++) for (let x = 12; x < width - 12; x++) original[y * width + x] = 1000;
  const elevation = original.slice(), rainfall = rain.slice();
  const basins = carveInlandSeasV7(42, width, height, 'continents', elevation, rainfall);
  expect(basins.length).toBeGreaterThan(0);
  const oldDepth = deriveWaterDepth(width, height, Uint8Array.from(original, height => height ? 1 : 0));
  const newlyWater: number[] = [];
  for (let cell = 0; cell < count; cell++) {
    if (!original[cell] || elevation[cell]) { expect(elevation[cell]).toBe(original[cell]); expect(rainfall[cell]).toBe(rain[cell]); continue; }
    newlyWater.push(cell); expect(oldDepth[cell]).toBe(0); expect(rainfall[cell]).toBe(0);
    const seen = new Set([cell]); let frontier = [cell];
    for (let step = 0; step < 3; step++) {
      const next: number[] = [];
      for (const at of frontier) for (const adjacent of neighbors(at, width, height)) if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); }
      frontier = next;
    }
    expect([...seen].every(at => original[at]! > 0)).toBe(true);
  }
  expect(newlyWater.length).toBe(basins.reduce((sum, basin) => sum + basin.carvedCells, 0));
  expect(newlyWater.length).toBeLessThanOrEqual(Math.floor(count * .03));
  const mountains = Uint16Array.from(original, value => value ? 3000 : 0), unchanged = mountains.slice();
  expect(carveInlandSeasV7(42, width, height, 'continents', mountains, rain.slice())).toEqual([]);
  expect(mountains).toEqual(unchanged);
});
