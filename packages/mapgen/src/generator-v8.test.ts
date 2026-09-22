import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import {
  BIOME, describeGeography, deriveV6Biomes, generateWorld, geographicDiversity, hexDistance, inspectV8Climate, isLake, isPassable,
  MAP_DIMENSIONS, MAP_DIMENSIONS_V8, MAP_TYPES, mapDimensions, mapSizeOf, neighbors,
  RECOMMENDED_FACTION_COUNTS, recommendedFactionCount, supportedLayouts, TERRAIN, validateHydrology, WATER_DEPTH,
  type GeneratorVersion, type MapSize, type World, type WorldLayout,
} from './index';

const LAYOUTS = MAP_TYPES.map(type => type.id);
const SIZES = Object.keys(MAP_DIMENSIONS) as MapSize[];
const NAVAL = new Set<WorldLayout>(['islands', 'archipelago']);
/** Land fraction bounds per layout (generous around measured 20-seed ranges). */
const LAND: Record<WorldLayout, [number, number]> = {
  continents: [.2, .32], pangaea: [.26, .42], fractal: [.3, .46], islands: [.14, .3],
  archipelago: [.17, .3], earthlike: [.2, .32], 'inland-sea': [.28, .42],
};
const cache = new Map<string, World>();
function world(layout: WorldLayout, size: MapSize, seed: number, factions = RECOMMENDED_FACTION_COUNTS[size]): World {
  const key = `${layout}/${size}/${seed}/${factions}`;
  if (!cache.has(key)) cache.set(key, generateWorld(seed, size, factions, 8, { layout }));
  return cache.get(key)!;
}
function seal(value: World): string {
  const hash = createHash('sha256');
  for (const values of [value.terrain, value.fertility, value.biome, value.waterDepth, value.hydrology]) hash.update(values);
  return hash.update(JSON.stringify(value.starts)).digest('hex');
}
/** Passable landmass label per cell (0 = water/mountain). */
function landmasses(value: World): Int32Array {
  const labels = new Int32Array(value.terrain.length);
  let next = 0;
  for (let origin = 0; origin < labels.length; origin++) {
    if (labels[origin] || !isPassable(value.terrain[origin]!)) continue;
    const queue = [origin]; labels[origin] = ++next;
    for (let index = 0; index < queue.length; index++) for (const cell of neighbors(queue[index]!, value.width, value.height)) {
      if (!labels[cell] && isPassable(value.terrain[cell]!)) { labels[cell] = next; queue.push(cell); }
    }
  }
  return labels;
}
/** Every start is valid, spaced, fed, and (off naval maps) shares its landmass. */
function proveStarts(value: World, factions: number, spacing: number): void {
  expect(value.starts).toHaveLength(factions);
  expect(new Set(value.starts).size).toBe(factions);
  const labels = landmasses(value), perMass = new Map<number, number>(), report = describeGeography(value);
  expect(report.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3)).toBe(true);
  value.starts.forEach((start, index) => {
    expect(isPassable(value.terrain[start]!)).toBe(true);
    expect(value.fertility[start]).toBeGreaterThanOrEqual(75);
    const access = neighbors(start, value.width, value.height).filter(cell => isPassable(value.terrain[cell]!));
    expect(access.length).toBeGreaterThanOrEqual(4);
    expect(access.some(cell => value.fertility[cell]! >= 70)).toBe(true);
    for (const other of value.starts.slice(index + 1)) expect(hexDistance(start, other, value.width)).toBeGreaterThanOrEqual(spacing);
    perMass.set(labels[start]!, (perMass.get(labels[start]!) ?? 0) + 1);
  });
  if (!NAVAL.has(value.layout as WorldLayout) && factions > 1) expect(Math.min(...perMass.values())).toBeGreaterThanOrEqual(2);
}

test('generator8 dimensions, map types and recommendations are explicit and invertible', () => {
  expect(MAP_DIMENSIONS_V8).toEqual({
    tiny: { width: 48, height: 32 }, small: { width: 176, height: 110 }, standard: { width: 224, height: 140 },
    huge: { width: 288, height: 180 }, legendary: { width: 352, height: 220 },
  });
  // Historical dimensions are frozen: saved generator1–7 worlds regenerate from them.
  expect(MAP_DIMENSIONS).toEqual({
    tiny: { width: 48, height: 32 }, small: { width: 256, height: 160 }, standard: { width: 384, height: 256 },
    huge: { width: 512, height: 384 }, legendary: { width: 640, height: 480 },
  });
  for (const version of [1, 2, 3, 4, 5, 6, 7, 8] as GeneratorVersion[]) for (const size of SIZES) {
    const { width, height } = mapDimensions(size, version);
    expect({ width, height }).toEqual(version >= 8 ? MAP_DIMENSIONS_V8[size] : MAP_DIMENSIONS[size]);
    expect(mapSizeOf(width, height, version)).toBe(size);
  }
  expect(mapSizeOf(256, 160, 8)).toBeUndefined(); expect(mapSizeOf(176, 110, 7)).toBeUndefined();
  expect(mapSizeOf(48, 32, 9 as GeneratorVersion)).toBeUndefined();
  expect(() => mapDimensions('vast' as MapSize, 8)).toThrow(RangeError);
  expect(() => mapDimensions('tiny', 0 as GeneratorVersion)).toThrow(RangeError);
  expect(RECOMMENDED_FACTION_COUNTS).toEqual({ tiny: 4, small: 8, standard: 12, huge: 16, legendary: 20 });
  for (const size of SIZES) expect(recommendedFactionCount(size)).toBe(RECOMMENDED_FACTION_COUNTS[size]);
  expect(() => recommendedFactionCount('invalid' as MapSize)).toThrow('Unknown map size');
  expect(LAYOUTS).toEqual(['continents', 'pangaea', 'fractal', 'islands', 'archipelago', 'earthlike', 'inland-sea']);
  for (const type of MAP_TYPES) { expect(type.name.length).toBeGreaterThan(3); expect(type.description.length).toBeGreaterThan(20); }
  expect(supportedLayouts(8)).toEqual(LAYOUTS);
  for (const version of [5, 6, 7] as const) expect(supportedLayouts(version)).toEqual(['continents', 'islands', 'archipelago']);
  for (const version of [1, 2, 3, 4] as const) expect(supportedLayouts(version)).toEqual([]);
});

test('layouts are validated against the generator version', () => {
  for (const layout of ['pangaea', 'fractal', 'earthlike', 'inland-sea'] as const) for (const version of [5, 6, 7] as const) {
    expect(() => generateWorld(1, 'tiny', 4, version, { layout })).toThrow('requires generator 8');
  }
  for (const version of [1, 2, 3, 4] as const) expect(() => generateWorld(1, 'tiny', 4, version, { layout: 'pangaea' })).toThrow('Historical');
  expect(() => generateWorld(1, 'tiny', 4, 8, { layout: 'legacy' as WorldLayout })).toThrow('Unknown world layout');
  expect(() => generateWorld(1, 'tiny', 4, 8, { layout: 'ringworld' as WorldLayout })).toThrow('Unknown world layout');
  expect(() => generateWorld(1, 'tiny', 4, 9 as GeneratorVersion)).toThrow('Unknown generator version');
  // Generator 8 seats a crowded 42-realm map plus its city-states; historical generators stop at 48.
  expect(() => generateWorld(1, 'tiny', 65, 8)).toThrow(RangeError);
  expect(() => generateWorld(1, 'tiny', 49, 7)).toThrow(RangeError);
  expect(generateWorld(7, 'standard', 56, 8).starts).toHaveLength(56);
  const fallback = generateWorld(1, 'tiny', 4, 8);
  expect(fallback.layout).toBe('continents'); expect(fallback.generatorVersion).toBe(8);
});

test.each(LAYOUTS)('%s is deterministic, bounded and places the recommended realms on Small', layout => {
  for (const seed of [42, 20260905]) {
    const value = world(layout, 'small', seed), report = describeGeography(value);
    expect([value.width, value.height, value.generatorVersion, value.layout]).toEqual([176, 110, 8, layout]);
    expect(report.landCells / report.cells).toBeGreaterThanOrEqual(LAND[layout][0]);
    expect(report.landCells / report.cells).toBeLessThanOrEqual(LAND[layout][1]);
    expect(() => validateHydrology(value)).not.toThrow();
    expect(report.riverCells).toBeGreaterThan(0);
    proveStarts(value, 8, 12);
  }
  expect(seal(generateWorld(42, 'small', 8, 8, { layout }))).toBe(seal(world(layout, 'small', 42)));
  expect(seal(world(layout, 'small', 20260905))).not.toBe(seal(world(layout, 'small', 42)));
});

test.each(LAYOUTS)('%s seats four realms on Tiny across seeds', layout => {
  for (const seed of [0, 7, 74, 0xffff_ffff]) proveStarts(world(layout, 'tiny', seed), 4, 5);
});

test('recommended and larger counts fit at scale, within the generation budget', () => {
  for (const layout of LAYOUTS) {
    const started = performance.now(), standard = world(layout, 'standard', 99, 16);
    expect(performance.now() - started).toBeLessThan(1000);
    proveStarts(standard, 16, 15);
  }
  // Legendary at its recommended 20: the densest plate, heightmap and naval layouts.
  for (const layout of ['pangaea', 'fractal', 'archipelago'] as const) {
    const started = performance.now(), legendary = world(layout, 'legendary', 7);
    expect(performance.now() - started).toBeLessThan(3000);
    proveStarts(legendary, 20, 20);
  }
});

test('largest-landmass share orders Pangaea > Continents > Islands > Archipelago, with Inland Sea one ring', () => {
  for (const seed of [42, 20260905]) {
    const share = (layout: WorldLayout) => { const report = describeGeography(world(layout, 'small', seed)); return report.landComponents[0]! / report.landCells; };
    expect(share('pangaea')).toBeGreaterThan(.85);
    expect(share('inland-sea')).toBeGreaterThan(.85);
    expect(share('continents')).toBeLessThan(.7);
    expect(share('pangaea')).toBeGreaterThan(share('continents'));
    expect(share('continents')).toBeGreaterThan(share('islands'));
    expect(share('islands')).toBeGreaterThan(share('archipelago'));
    expect(share('archipelago')).toBeLessThan(.25);
    // Continents: two or three large landmasses; Earth-like: an Old and a New World.
    for (const layout of ['continents', 'earthlike'] as const) {
      const report = describeGeography(world(layout, 'small', seed));
      expect(report.landComponents.filter(size => size >= report.landCells * .15).length).toBeGreaterThanOrEqual(2);
    }
    // Pangaea and Inland Sea seat every realm on the one shared landmass.
    for (const layout of ['pangaea', 'inland-sea'] as const) expect(describeGeography(world(layout, 'small', seed)).startComponents).toBe(1);
    // Inland Sea: a single large enclosed central sea.
    const ring = world('inland-sea', 'small', seed), sea = describeGeography(ring);
    expect(sea.inlandWaterBodies[0]!).toBeGreaterThan(sea.cells * .08);
    expect(ring.terrain[Math.floor(ring.height / 2) * ring.width + Math.floor(ring.width / 2)]).toBe(TERRAIN.water);
  }
});

test('Earth-like climate is cold toward the poles and warm toward the equator', () => {
  for (const seed of [42, 20260905]) {
    const value = world('earthlike', 'small', seed);
    const bands = { polar: [0, 0, 0] as [number, number, number], equator: [0, 0, 0] as [number, number, number] };
    for (let y = 0; y < value.height; y++) {
      const latitude = Math.floor(Math.abs(2 * y - (value.height - 1)) * 100 / (value.height - 1));
      const band = latitude >= 60 ? bands.polar : latitude <= 25 ? bands.equator : null;
      if (!band) continue;
      for (let cell = y * value.width; cell < (y + 1) * value.width; cell++) {
        const biome = value.biome[cell]!;
        if (biome === BIOME.ocean || biome === BIOME.alpine) continue;
        band[0]++;
        if (biome === BIOME.tundra || biome === BIOME.taiga) band[1]++;
        if (biome === BIOME.rainforest || biome === BIOME.desert || biome === BIOME.marsh) band[2]++;
      }
    }
    expect(bands.polar[0]).toBeGreaterThan(100); expect(bands.equator[0]).toBeGreaterThan(100);
    expect(bands.polar[1] / bands.polar[0]).toBeGreaterThan(.6);
    expect(bands.equator[1] / bands.equator[0]).toBeLessThan(.05);
    expect(bands.equator[2] / bands.equator[0]).toBeGreaterThan(.3);
    expect(bands.polar[2] / bands.polar[0]).toBeLessThan(.05);
    // The inspectable climate stage reproduces the stored zonal biomes exactly.
    expect(deriveV6Biomes(value, inspectV8Climate(value).elevation, { latitudeBands: true })).toEqual(value.biome);
  }
});

test('Fractal is a heightmap, structurally unlike plate Continents on the same seeds', () => {
  for (const seed of [42, 20260905]) {
    const fractal = world('fractal', 'small', seed), continents = world('continents', 'small', seed);
    let both = 0, either = 0;
    for (let cell = 0; cell < fractal.terrain.length; cell++) {
      const a = fractal.terrain[cell] !== TERRAIN.water, b = continents.terrain[cell] !== TERRAIN.water;
      if (a && b) both++; if (a || b) either++;
    }
    expect(both / either).toBeLessThan(.4);
    const land = (value: World) => describeGeography(value).landCells / value.terrain.length;
    expect(land(fractal)).toBeGreaterThan(land(continents) + .04);
    // No plate spines: fractal mountains follow warped ridge lines and stay sparse.
    const report = describeGeography(fractal);
    expect(report.mountainCells / report.landCells).toBeGreaterThan(.02);
    expect(report.mountainCells / report.landCells).toBeLessThan(.12);
    expect(report.lakeBodies + report.inlandWaterBodies.length).toBeGreaterThan(2);
  }
});

test('generator8 keeps modern water depth, lake, border and cohesion rules', () => {
  for (const layout of LAYOUTS) {
    const value = world(layout, 'small', 42), depth = [0, 0, 0];
    let consistent = true;
    for (let cell = 0; cell < value.terrain.length; cell++) {
      const water = value.terrain[cell] === TERRAIN.water, lake = isLake(value.hydrology[cell]!);
      depth[value.waterDepth[cell]!]!++;
      if (water === (value.waterDepth[cell] === WATER_DEPTH.land)) consistent = false;
      if (lake && value.waterDepth[cell] !== WATER_DEPTH.shallow) consistent = false;
      if (water && !lake) {
        const nearLand = neighbors(cell, value.width, value.height).some(next => value.terrain[next] !== TERRAIN.water
          || neighbors(next, value.width, value.height).some(second => value.terrain[second] !== TERRAIN.water));
        if (nearLand !== (value.waterDepth[cell] === WATER_DEPTH.shallow)) consistent = false;
      }
      if ((value.terrain[cell] === TERRAIN.water) !== (value.biome[cell] === BIOME.ocean)) consistent = false;
      if ((value.terrain[cell] === TERRAIN.mountain) !== (value.biome[cell] === BIOME.alpine)) consistent = false;
      const x = cell % value.width, y = Math.floor(cell / value.width);
      if ((x === 0 || y === 0 || x === value.width - 1 || y === value.height - 1) && !water) consistent = false;
    }
    expect(consistent).toBe(true);
    expect(depth[WATER_DEPTH.shallow]! / value.terrain.length).toBeGreaterThan(.05);
    expect(depth[WATER_DEPTH.deep]! / value.terrain.length).toBeGreaterThan(.2);
    const diversity = geographicDiversity(value);
    expect(diversity.landBiomeNeighborAgreement).toBeGreaterThan(.7);
    expect(diversity.longestRiverCellsToSea).toBeGreaterThanOrEqual(5);
    expect(Object.values(diversity.biomeCounts).filter(count => count > 0).length).toBeGreaterThanOrEqual(9);
    expect(describeGeography(value).lakeBodies).toBeGreaterThan(0);
  }
});

test('generator8 inland-sea carving stays within the borrowed generator7 budgets', () => {
  for (const [layout, budget] of [['continents', .03], ['pangaea', .03], ['fractal', .02], ['inland-sea', 0]] as const) {
    const value = world(layout, 'small', 20260905), carvings = inspectV8Climate(value).inlandSeaCarvings;
    expect(carvings.reduce((sum, basin) => sum + basin.carvedCells, 0)).toBeLessThanOrEqual(Math.floor(value.terrain.length * budget));
    for (const basin of carvings) {
      expect(basin.carvedCells).toBeLessThanOrEqual(basin.hostCells * .2);
      expect(value.terrain[basin.center]).toBe(TERRAIN.water);
      expect(isLake(value.hydrology[basin.center]!)).toBe(false);
    }
  }
  expect(() => inspectV8Climate(generateWorld(1, 'tiny', 4, 7))).toThrow(RangeError);
});
