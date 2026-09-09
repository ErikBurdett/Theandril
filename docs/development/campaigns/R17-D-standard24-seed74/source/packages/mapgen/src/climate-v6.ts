import { BIOME, deriveClimate, TERRAIN, type World } from './index';
import { directionNeighbor, isLake, riverSize } from './hydrology';

type ClimateWorld = Pick<World, 'seed' | 'width' | 'height' | 'terrain' | 'hydrology'>;
export interface V6ClimateFields {
  /** Relative indices0–100, not physical degrees/rainfall units. */
  temperature: Uint8Array;
  moisture: Uint8Array;
  /** Leeward drying index0–35, observable only through explicit generator diagnostics. */
  rainShadow: Uint8Array;
  /** Hexes from a real river/lake, capped at3 (meaning beyond the two-cell floodplain). */
  freshwaterDistance: Uint8Array;
  prevailingWind: 'eastward' | 'westward';
}

const clamp = (value: number, max = 100) => Math.max(0, Math.min(max, value));
function mix(value: number): number {
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return (value ^ (value >>> 15)) >>> 0;
}
function geology(x: number, y: number, scale: number, seed: number): number {
  const sample = (gx: number, gy: number) => (mix(seed ^ Math.imul(gx, 0x632be5ab) ^ Math.imul(gy, 0x85157af5)) >>> 16) - 32768;
  const smooth = (n: number) => Math.floor(n * n * (768 - 2 * n) / 65536);
  const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
  const tx = smooth(Math.floor(x % scale * 256 / scale)), ty = smooth(Math.floor(y % scale * 256 / scale));
  const lerp = (a: number, b: number, weight: number) => a + Math.floor((b - a) * weight / 256);
  return lerp(lerp(sample(gx, gy), sample(gx + 1, gy), tx), lerp(sample(gx, gy + 1), sample(gx + 1, gy + 1), tx), ty);
}

/** Detached O(cells) climate. Relief is a transient generator field, never a new
 * canonical world array. The seeded prevailing wind follows rows; it is a readable
 * rain-shadow approximation, not a weather simulator. Drainage stays unchanged. */
export function deriveV6Climate(world: ClimateWorld, elevation: Uint16Array): V6ClimateFields {
  const { seed, width, height, terrain, hydrology } = world, count = width * height;
  if (!(elevation instanceof Uint16Array) || !(hydrology instanceof Uint8Array) || elevation.length !== count
    || hydrology.length !== count || elevation.some(value => value > 4095) || hydrology.some(value => value > 63)) {
    throw new RangeError('Modern climate requires matching bounded relief and hydrology.');
  }
  const { temperature, moisture } = deriveClimate(seed, width, height, terrain);
  const rainShadow = new Uint8Array(count), freshwaterDistance = new Uint8Array(count).fill(3);
  const queue = new Int32Array(count);
  let head = 0, tail = 0;
  for (let cell = 0; cell < count; cell++) if (riverSize(hydrology[cell]!) || isLake(hydrology[cell]!)) {
    freshwaterDistance[cell] = 0; queue[tail++] = cell;
  }
  while (head < tail) {
    const cell = queue[head++]!, distance = freshwaterDistance[cell]!;
    if (distance >= 2) continue;
    for (let direction = 1; direction <= 6; direction++) {
      const next = directionNeighbor(cell, width, height, direction);
      if (next !== null && freshwaterDistance[next] === 3 && (terrain[next] !== TERRAIN.water || isLake(hydrology[next]!))) {
        freshwaterDistance[next] = distance + 1; queue[tail++] = next;
      }
    }
  }
  const eastward = (mix(seed ^ 0x3657494e) & 1) === 0;
  const drying = Math.max(8, Math.floor(8000 / width)), shadowRecovery = Math.max(24, Math.floor(25000 / width));
  for (let y = 0; y < height; y++) {
    let humidity = 9000, ridge = 0, previous = 0;
    for (let step = 0; step < width; step++) {
      const x = eastward ? step : width - 1 - step, cell = y * width + x, altitude = elevation[cell]!;
      if (terrain[cell] === TERRAIN.water) {
        // Salt water resets the marine air mass. Small freshwater lakes moisten
        // their banks, but do not erase the regional mountain rain shadow.
        if (!isLake(hydrology[cell]!)) { humidity = 9000; ridge = 0; previous = 0; }
        continue;
      }
      const lift = clamp(Math.floor((altitude - previous) / 35), 22);
      ridge = Math.max(altitude, ridge - shadowRecovery);
      const shadow = clamp(Math.floor((ridge - altitude) / 45), 35);
      rainShadow[cell] = shadow;
      humidity = Math.max(1800, humidity - drying - lift * 45);
      // Undo the old categorical cooling before applying continuous relief.
      const oldCooling = terrain[cell] === TERRAIN.mountain ? 22 : terrain[cell] === TERRAIN.hills ? 7 : 0;
      temperature[cell] = clamp(temperature[cell]! + oldCooling - Math.floor(Math.max(0, altitude - 600) / 55));
      let wetness = Math.floor(moisture[cell]! * 2 / 3) + Math.floor(humidity / 300) + lift - shadow;
      const distance = freshwaterDistance[cell]!;
      if (distance < 3) {
        // Perennial water sustains a narrow green corridor even through arid
        // rain-shadow country. Farther dry terrain retains its own identity.
        wetness = Math.max(wetness + [22, 12, 4][distance]!, [67, 58, 0][distance]!);
      }
      moisture[cell] = clamp(wetness);
      previous = altitude;
    }
  }
  return { temperature, moisture, rainShadow, freshwaterDistance, prevailingWind: eastward ? 'eastward' : 'westward' };
}

/** Climate identity only: no terrain, fertility, depth, drainage, feature or start
 * edits. Existing woodland/mountain artwork contracts remain explicit constraints. */
export function deriveV6Biomes(world: ClimateWorld, elevation: Uint16Array): Uint8Array {
  const { width, height, terrain, seed } = world;
  const climate = deriveV6Climate(world, elevation), result = new Uint8Array(terrain.length);
  const geologyScale = Math.max(4, Math.floor(width / 9));
  for (let cell = 0; cell < terrain.length; cell++) {
    const physical = terrain[cell]!, temperature = climate.temperature[cell]!, moisture = climate.moisture[cell]!;
    if (physical === TERRAIN.water) { result[cell] = BIOME.ocean; continue; }
    // Alpine is also the current impassable mountain-art contract. Warm bare
    // summits require a separate future presentation rather than mislabelled art.
    if (physical === TERRAIN.mountain) { result[cell] = BIOME.alpine; continue; }
    if (temperature < 23) { result[cell] = BIOME.tundra; continue; }
    if (physical !== TERRAIN.hills && temperature >= 35 && elevation[cell]! <= 1000 && moisture >= 67) {
      let lowRelief = true, coast = false;
      for (let direction = 1; direction <= 6; direction++) {
        const next = directionNeighbor(cell, width, height, direction);
        if (next === null) continue;
        if (terrain[next] === TERRAIN.water) coast = true;
        else if (Math.abs(elevation[next]! - elevation[cell]!) > 260) lowRelief = false;
      }
      if (lowRelief && (climate.freshwaterDistance[cell]! <= 1 || coast && moisture >= 74)) { result[cell] = BIOME.marsh; continue; }
    }
    if (physical === TERRAIN.forest) {
      result[cell] = temperature < 43 ? BIOME.taiga : temperature >= 76 && moisture >= 66 ? BIOME.rainforest : BIOME.temperateForest;
      continue;
    }
    if (temperature >= 48 && moisture < 35) result[cell] = BIOME.desert;
    else if (moisture < 52 || temperature < 35) result[cell] = BIOME.steppe;
    else result[cell] = BIOME.grassland;
    const stone = geology(cell % width, Math.floor(cell / width), geologyScale, seed ^ 0x47454f4c);
    // Ash/chalk are coherent dry substrate regions, not speckles or barriers
    // painted across fresh floodplains and cold uplands.
    if (climate.freshwaterDistance[cell]! > 1) {
      if (temperature >= 40 && moisture < 52 && stone < -9000) result[cell] = BIOME.ashScrub;
      else if (temperature >= 35 && moisture < 63 && stone > 8500) result[cell] = BIOME.chalkland;
    }
  }
  return result;
}
