import { expect, test } from 'vitest';
import { BIOME, TERRAIN } from './index';
import { deriveV6Biomes, deriveV6Climate } from './climate-v6';

function climateFixture() {
  const width = 64, height = 40, count = width * height;
  const world = { seed: 20260905, width, height, terrain: new Uint8Array(count).fill(TERRAIN.plains), hydrology: new Uint8Array(count) };
  const elevation = new Uint16Array(count).fill(700);
  for (let y = 0; y < height; y++) for (const x of [0, width - 1]) {
    world.terrain[y * width + x] = TERRAIN.water; elevation[y * width + x] = 0;
  }
  return { world, elevation };
}

test('continuous upland cooling and a seeded leeward rain shadow affect real derived fields without mutating inputs', () => {
  const { world, elevation } = climateFixture(), baseline = deriveV6Climate(world, elevation);
  const east = baseline.prevailingWind === 'eastward', ridgeX = east ? 24 : 39;
  for (let y = 0; y < world.height; y++) elevation[y * world.width + ridgeX] = 3000;
  const before = structuredClone({ world, elevation }), climate = deriveV6Climate(world, elevation);
  expect(deriveV6Climate(world, elevation)).toEqual(climate);
  const ridge = 20 * world.width + ridgeX, windward = ridge + (east ? -1 : 1), leeward = ridge + (east ? 1 : -1);
  expect(climate.temperature[ridge]).toBeLessThan(baseline.temperature[ridge]! - 30);
  expect(climate.rainShadow[windward]).toBe(0);
  expect(climate.rainShadow[leeward]).toBeGreaterThan(20);
  expect(climate.moisture[leeward]).toBeLessThan(baseline.moisture[leeward]! - 20);
  expect(climate.moisture[windward]).toBe(baseline.moisture[windward]);
  expect(climate.temperature.every(value => value <= 100)).toBe(true);
  expect(climate.moisture.every(value => value <= 100)).toBe(true);
  expect({ world, elevation }).toEqual(before);
  climate.temperature.fill(255); climate.moisture.fill(255); climate.rainShadow.fill(255); climate.freshwaterDistance.fill(255);
  expect({ world, elevation }).toEqual(before);
});

test('a real freshwater corridor moistens only its bounded banks and makes low flat floodplains marsh, not uplands', () => {
  const { world, elevation } = climateFixture(), baseline = deriveV6Climate(world, elevation);
  // Complete east-flowing river across the authored lowland row, terminating at sea.
  for (let x = 20; x < world.width - 1; x++) world.hydrology[20 * world.width + x] = 9;
  const climate = deriveV6Climate(world, elevation), biomes = deriveV6Biomes(world, elevation), river = 20 * world.width + 30;
  expect(climate.freshwaterDistance[river]).toBe(0);
  expect(climate.moisture[river]).toBeGreaterThan(baseline.moisture[river]!);
  expect(climate.moisture[river]).toBeGreaterThanOrEqual(67);
  expect(biomes[river]).toBe(BIOME.marsh);
  const far = 15 * world.width + 30;
  expect(climate.freshwaterDistance[far]).toBe(3);
  expect(climate.moisture[far]).toBe(baseline.moisture[far]);
  elevation[river] = 1800; world.terrain[river] = TERRAIN.hills;
  expect(deriveV6Biomes(world, elevation)[river]).not.toBe(BIOME.marsh);
});

test('freshwater does not irrigate a separate island across a saltwater strait', () => {
  const { world, elevation } = climateFixture();
  for (let y = 0; y < world.height; y++) {
    world.terrain[y * world.width + 30] = TERRAIN.water;
    elevation[y * world.width + 30] = 0;
  }
  // Source on the western bank, with a valid immediate outlet into the strait.
  const river = 20 * world.width + 29; world.hydrology[river] = 9;
  const climate = deriveV6Climate(world, elevation);
  expect(climate.freshwaterDistance[river]).toBe(0);
  expect(climate.freshwaterDistance[river + 1]).toBe(3);
  expect(climate.freshwaterDistance[river + 2]).toBe(3);
});

test('retains explicit mountain and woodland presentation contracts while classifying warm and cold vegetation', () => {
  const { world, elevation } = climateFixture();
  for (let cell = 0; cell < world.terrain.length; cell++) if (world.terrain[cell] !== TERRAIN.water) world.terrain[cell] = TERRAIN.forest;
  const summit = 20 * world.width + 30; world.terrain[summit] = TERRAIN.mountain; elevation[summit] = 3000;
  const biomes = deriveV6Biomes(world, elevation);
  expect(biomes[summit]).toBe(BIOME.alpine);
  expect(biomes[30]).toBe(BIOME.tundra);
  expect(Array.from(biomes).some(value => value === BIOME.taiga)).toBe(true);
  expect(Array.from(biomes).some(value => value === BIOME.rainforest)).toBe(true);
  for (let cell = 0; cell < biomes.length; cell++) {
    if (world.terrain[cell] === TERRAIN.water) expect(biomes[cell]).toBe(BIOME.ocean);
    else if (cell !== summit) expect([BIOME.tundra, BIOME.taiga, BIOME.temperateForest, BIOME.rainforest, BIOME.marsh]).toContain(biomes[cell]);
  }
});

test('rejects malformed transient fields rather than silently classifying partial or out-of-range data', () => {
  const { world, elevation } = climateFixture();
  expect(() => deriveV6Climate(world, elevation.subarray(1))).toThrow(RangeError);
  expect(() => deriveV6Climate({ ...world, hydrology: world.hydrology.subarray(1) }, elevation)).toThrow(RangeError);
  elevation[100] = 4096; expect(() => deriveV6Climate(world, elevation)).toThrow(RangeError);
  elevation[100] = 700; world.hydrology[100] = 64; expect(() => deriveV6Climate(world, elevation)).toThrow(RangeError);
  world.hydrology[100] = 0; expect(() => deriveV6Climate({ ...world, seed: NaN }, elevation)).toThrow(RangeError);
});

test('Earth-like latitude bands are opt-in: colder poles, wetter equator, default fields unchanged', () => {
  const { world, elevation } = climateFixture(), plain = deriveV6Climate(world, elevation), banded = deriveV6Climate(world, elevation, { latitudeBands: true });
  expect(deriveV6Climate(world, elevation, {})).toEqual(plain);
  // Rows 3/13/20 of 40 sit at latitude 84, 33 and 2 (0 = equator, 100 = pole).
  const pole = 3 * world.width + 30, equator = 20 * world.width + 30, subtropic = 13 * world.width + 30;
  expect(banded.temperature[pole]).toBeLessThan(plain.temperature[pole]! - 5);
  expect(banded.temperature[equator]).toBeGreaterThanOrEqual(plain.temperature[equator]!);
  expect(banded.moisture[equator]).toBeGreaterThan(plain.moisture[equator]!);
  expect(banded.moisture[subtropic]).toBeLessThan(plain.moisture[subtropic]!);
  const biomes = deriveV6Biomes(world, elevation, { latitudeBands: true });
  expect(biomes[pole]).toBe(BIOME.tundra);
  expect(deriveV6Biomes(world, elevation)).not.toEqual(biomes);
});
