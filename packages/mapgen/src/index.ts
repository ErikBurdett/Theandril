/** Increment whenever the same seed/settings can produce different geography. */
export const GENERATOR_VERSION = 2;
export type GeneratorVersion = 1 | 2;

export const MAP_DIMENSIONS = {
  tiny: { width: 48, height: 32 },
  small: { width: 256, height: 160 },
  standard: { width: 384, height: 256 },
  huge: { width: 512, height: 384 },
  legendary: { width: 640, height: 480 },
} as const;

export type MapSize = keyof typeof MAP_DIMENSIONS;

/** New-campaign UI defaults only. Explicit counts and existing seeded worlds remain unchanged. */
export const RECOMMENDED_FACTION_COUNTS: Readonly<Record<MapSize, number>> = {
  tiny: 4, small: 12, standard: 24, huge: 32, legendary: 40,
};
export function recommendedFactionCount(size: MapSize): number {
  if (!Object.hasOwn(RECOMMENDED_FACTION_COUNTS, size)) throw new RangeError('Unknown map size.');
  return RECOMMENDED_FACTION_COUNTS[size];
}

export const TERRAIN = { water: 0, plains: 1, forest: 2, hills: 3, mountain: 4 } as const;
export const TERRAIN_NAMES = ['Water', 'Plains', 'Forest', 'Hills', 'Mountain'] as const;
export const BIOME = { ocean: 0, grassland: 1, temperateForest: 2, taiga: 3, tundra: 4, desert: 5, steppe: 6, marsh: 7, rainforest: 8, alpine: 9 } as const;
export const BIOME_NAMES = ['Ocean', 'Temperate grassland', 'Temperate forest', 'Taiga', 'Tundra', 'Desert', 'Steppe', 'Marsh', 'Rainforest', 'Alpine'] as const;
export function isValidBiome(biome: number): boolean { return Number.isInteger(biome) && biome >= 0 && biome < BIOME_NAMES.length; }

export interface World {
  /** Canonical unsigned 32-bit seed. */
  seed: number;
  generatorVersion: GeneratorVersion;
  width: number;
  height: number;
  terrain: Uint8Array;
  /** Climate/vegetation identity, independent of physical movement terrain. */
  biome: Uint8Array;
  /** Base food potential, from 0 to 100. */
  fertility: Uint8Array;
  starts: number[];
}

/** Integer avalanche function, shared by coordinate noise and explicit RNG streams. */
function mix32(value: number): number {
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return (value ^ (value >>> 15)) >>> 0;
}

/** A reproducible stream: serialize `state` to resume it without clock dependence. */
export class SeededRandom {
  public state: number;

  constructor(seed: number) {
    if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be a safe integer.');
    this.state = seed >>> 0;
  }

  nextUint32(): number {
    this.state = (this.state + 0x9e3779b9) >>> 0;
    return mix32(this.state);
  }

  /** Fixed work, with less than 1/2^32 distribution error for non-power-of-two bounds. */
  nextInt(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 0x100000000) {
      throw new RangeError('Random bound must be an integer between 1 and 2^32.');
    }
    const value = this.nextUint32();
    const lowProduct = (value & 0xffff) * maxExclusive;
    const highProduct = (value >>> 16) * maxExclusive + Math.floor(lowProduct / 65536);
    return Math.floor(highProduct / 65536);
  }
}

export function isPassable(terrain: number): boolean {
  return terrain === TERRAIN.plains || terrain === TERRAIN.forest || terrain === TERRAIN.hills;
}

/** Odd-row offset hexes, clockwise from east; no wrapping across map edges. */
export function neighbors(cell: number, width: number, height: number): number[] {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
      !Number.isInteger(cell) || cell < 0 || cell >= width * height) return [];
  const result: number[] = [];
  writeNeighbors(cell, width, height, result);
  return result;
}

/** Internal scratch-buffer variant avoids allocating one array per visited tile. */
function writeNeighbors(cell: number, width: number, height: number, result: number[]): void {
  result.length = 0;
  const x = cell % width;
  const y = Math.floor(cell / width);
  const eastDiagonal = x + (y & 1);
  const westDiagonal = eastDiagonal - 1;
  if (x + 1 < width) result.push(cell + 1);
  if (y + 1 < height) {
    if (eastDiagonal < width) result.push((y + 1) * width + eastDiagonal);
    if (westDiagonal >= 0) result.push((y + 1) * width + westDiagonal);
  }
  if (x > 0) result.push(cell - 1);
  if (y > 0) {
    if (westDiagonal >= 0) result.push((y - 1) * width + westDiagonal);
    if (eastDiagonal < width) result.push((y - 1) * width + eastDiagonal);
  }
}

/** Geometric distance; terrain and map bounds do not alter the metric. */
export function hexDistance(a: number, b: number, width: number): number {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(a) || a < 0 ||
      !Number.isInteger(b) || b < 0) throw new RangeError('Invalid hex coordinates.');
  const ar = Math.floor(a / width);
  const br = Math.floor(b / width);
  const aq = a % width - ((ar - (ar & 1)) / 2);
  const bq = b % width - ((br - (br & 1)) / 2);
  return Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs(aq + ar - bq - br));
}

function lattice(x: number, y: number, seed: number): number {
  return (mix32(seed ^ Math.imul(x, 0x632be5ab) ^ Math.imul(y, 0x85157af5)) >>> 16) - 32768;
}

function smoothStep(t: number): number {
  return Math.floor((t * t * (768 - 2 * t)) / 65536);
}

function interpolate(a: number, b: number, weight: number): number {
  return a + Math.floor(((b - a) * weight) / 256);
}

/** Integer, bilinearly interpolated value noise. All intermediate products are exact integers. */
function noise(x: number, y: number, scale: number, seed: number): number {
  const gx = Math.floor(x / scale);
  const gy = Math.floor(y / scale);
  const tx = smoothStep(Math.floor(((x % scale) * 256) / scale));
  const ty = smoothStep(Math.floor(((y % scale) * 256) / scale));
  return interpolate(
    interpolate(lattice(gx, gy, seed), lattice(gx + 1, gy, seed), tx),
    interpolate(lattice(gx, gy + 1, seed), lattice(gx + 1, gy + 1, seed), tx),
    ty,
  );
}

export interface ClimateFields {
  /** Relative temperature and moisture indices, each 0–100; not degrees or rainfall units. */
  temperature: Uint8Array;
  moisture: Uint8Array;
}

function validateClimateInput(seed: number, width: number, height: number, terrain: Uint8Array): void {
  if (!(terrain instanceof Uint8Array) || !Number.isSafeInteger(seed) || !Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
      width * height > 350_000 || terrain.length !== width * height || terrain.some(value => value > TERRAIN.mountain)) {
    throw new RangeError('Climate requires a safe seed and matching bounded physical terrain.');
  }
}

/** Inspectable O(cells) climate stage: latitude, coherent weather fields and upland cooling. */
export function deriveClimate(seed: number, width: number, height: number, terrain: Uint8Array): ClimateFields {
  validateClimateInput(seed, width, height, terrain);
  const temperature = new Uint8Array(terrain.length);
  const moisture = new Uint8Array(terrain.length);
  const climateScale = Math.max(4, Math.floor(width / 7));
  const rainScale = Math.max(4, Math.floor(width / 11));
  const clamp = (value: number): number => Math.max(0, Math.min(100, value));
  for (let y = 0; y < height; y++) {
    const latitude = height === 1 ? 0 : Math.floor(Math.abs(2 * y - (height - 1)) * 100 / (height - 1));
    const equatorialRain = Math.max(0, 24 - Math.floor(latitude * 3 / 4));
    const dryBelt = Math.max(0, 24 - Math.abs(latitude - 38));
    for (let x = 0; x < width; x++) {
      const cell = y * width + x;
      const elevationCooling = terrain[cell] === TERRAIN.mountain ? 22 : terrain[cell] === TERRAIN.hills ? 7 : 0;
      temperature[cell] = clamp(100 - latitude + Math.floor(noise(x, y, climateScale, seed ^ 0x54454d50) / 4096) - elevationCooling);
      // Rain field uses the original woodland stream, keeping vegetation and climate coherent.
      moisture[cell] = clamp(52 + Math.floor(noise(x, y, rainScale, seed ^ 0x5241494e) / 750) + equatorialRain - dryBelt);
    }
  }
  return { temperature, moisture };
}

/** Derive labels from existing terrain, including authored/legacy maps; never mutate it. */
export function deriveBiomes(seed: number, width: number, height: number, terrain: Uint8Array, generatorVersion: GeneratorVersion = GENERATOR_VERSION): Uint8Array {
  if (generatorVersion !== 1 && generatorVersion !== 2) throw new RangeError('Unknown generator version.');
  validateClimateInput(seed, width, height, terrain);
  const result = new Uint8Array(terrain.length);
  const climate = generatorVersion === 2 ? deriveClimate(seed, width, height, terrain) : undefined;
  const adjacent: number[] = [];
  for (let cell = 0; cell < terrain.length; cell++) {
    const physical = terrain[cell];
    if (physical === TERRAIN.water) { result[cell] = BIOME.ocean; continue; }
    if (physical === TERRAIN.mountain) { result[cell] = BIOME.alpine; continue; }
    if (!climate) { result[cell] = physical === TERRAIN.forest ? BIOME.temperateForest : BIOME.grassland; continue; }
    const temperature = climate.temperature[cell]!;
    const moisture = climate.moisture[cell]!;
    if (temperature < 23) { result[cell] = BIOME.tundra; continue; }
    if (physical === TERRAIN.forest && temperature < 43) { result[cell] = BIOME.taiga; continue; }
    if (physical !== TERRAIN.hills && temperature >= 35 && moisture >= 63) {
      writeNeighbors(cell, width, height, adjacent);
      if (adjacent.some(next => terrain[next] === TERRAIN.water)) { result[cell] = BIOME.marsh; continue; }
    }
    if (physical === TERRAIN.forest) {
      result[cell] = temperature >= 76 && moisture >= 55 ? BIOME.rainforest : BIOME.temperateForest;
    } else if (temperature >= 48 && moisture < 35) result[cell] = BIOME.desert;
    else if (moisture < 52 || temperature < 35) result[cell] = BIOME.steppe;
    else result[cell] = BIOME.grassland;
  }
  return result;
}

/** Connected components are O(cells), with bounded typed-array queue storage. */
function largestPassableComponent(world: World): { labels: Int32Array; largest: number } {
  const { width, height, terrain } = world;
  const labels = new Int32Array(terrain.length);
  const queue = new Int32Array(terrain.length);
  const adjacent: number[] = [];
  let component = 0;
  let largest = 0;
  let largestCount = 0;
  for (let origin = 0; origin < terrain.length; origin++) {
    if (labels[origin] !== 0 || !isPassable(terrain[origin]!)) continue;
    component++;
    let head = 0;
    let tail = 1;
    queue[0] = origin;
    labels[origin] = component;
    while (head < tail) {
      const cell = queue[head++]!;
      writeNeighbors(cell, width, height, adjacent);
      for (const next of adjacent) {
        if (labels[next] === 0 && isPassable(terrain[next]!)) {
          labels[next] = component;
          queue[tail++] = next;
        }
      }
    }
    if (tail > largestCount) {
      largestCount = tail;
      largest = component;
    }
  }
  return { labels, largest };
}

function placeStarts(world: World, count: number): void {
  const { labels, largest } = largestPassableComponent(world);
  const { terrain, fertility, width, height } = world;
  const candidates: number[] = [];
  const adjacent: number[] = [];
  for (let cell = 0; cell < terrain.length; cell++) {
    if (labels[cell] !== largest || largest === 0) continue;
    writeNeighbors(cell, width, height, adjacent);
    let accessible = 0;
    for (const next of adjacent) if (labels[next] === largest) accessible++;
    if (accessible >= 4) candidates.push(cell);
  }
  // Even spatial sampling caps start selection at 8192 × factions, regardless of world size.
  const stride = Math.max(1, Math.ceil(candidates.length / 8192));
  const sampled = candidates.filter((_, index) => index % stride === 0);
  if (sampled.length < count) throw new Error('World has insufficient connected starting regions.');
  const closest = new Uint16Array(sampled.length).fill(65535);
  const rng = new SeededRandom(world.seed ^ 0x53544152);
  let selected = rng.nextInt(sampled.length);
  for (let slot = 0; slot < count; slot++) {
    const start = sampled[selected]!;
    if (closest[selected]! < 2) throw new RangeError('Too many factions for separated starting regions.');
    world.starts.push(start);
    let bestScore = -1;
    for (let index = 0; index < sampled.length; index++) {
      const cell = sampled[index]!;
      closest[index] = Math.min(closest[index]!, hexDistance(start, cell, width));
      const score = closest[index]! * 128 + fertility[cell]!;
      if (score > bestScore) {
        bestScore = score;
        selected = index;
      }
    }
  }
  // Food guarantee changes only already-passable cells; it cannot create a disconnected start.
  for (const start of world.starts) {
    terrain[start] = TERRAIN.plains;
    fertility[start] = Math.max(75, fertility[start]!);
    writeNeighbors(start, width, height, adjacent);
    const foodCell = adjacent.find((cell) => labels[cell] === largest);
    if (foodCell !== undefined) {
      terrain[foodCell] = TERRAIN.plains;
      fertility[foodCell] = Math.max(70, fertility[foodCell]!);
    }
  }
}

/**
 * Two irregular continental envelopes with coherent coast, upland and woodland fields.
 * Call in a simulation worker. Terrain is O(cells); starts use O(cells + 8192 × factions).
 * The foundation uses terrestrial starts together on the largest reachable landmass.
 */
export function generateWorld(seed: number, size: MapSize, factionCount: number, generatorVersion: GeneratorVersion = GENERATOR_VERSION): World {
  if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be a safe integer.');
  if (!Object.hasOwn(MAP_DIMENSIONS, size)) throw new RangeError('Unknown map size.');
  if (generatorVersion !== 1 && generatorVersion !== 2) throw new RangeError('Unknown generator version.');
  if (!Number.isInteger(factionCount) || factionCount < 1 || factionCount > 48) {
    throw new RangeError('Faction count must be an integer between 1 and 48.');
  }
  const { width, height } = MAP_DIMENSIONS[size];
  const world: World = {
    seed: seed >>> 0, width, height, generatorVersion,
    terrain: new Uint8Array(width * height),
    biome: new Uint8Array(width * height),
    fertility: new Uint8Array(width * height), starts: [],
  };
  const rng = new SeededRandom(seed ^ 0x504c4154);
  const centers = [
    { x: 260 + rng.nextInt(35), y: 430 + rng.nextInt(120), rx: 240 + rng.nextInt(20), ry: 405 + rng.nextInt(40) },
    { x: 760 + rng.nextInt(30), y: 440 + rng.nextInt(120), rx: 215 + rng.nextInt(30), ry: 345 + rng.nextInt(70) },
  ];
  const coastScale = Math.max(4, Math.floor(width / 11));
  const detailScale = Math.max(2, Math.floor(width / 35));
  for (let y = 0; y < height; y++) {
    const ny = Math.floor((y * 1024) / (height - 1));
    for (let x = 0; x < width; x++) {
      const cell = y * width + x;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) continue;
      const nx = Math.floor((x * 1024) / (width - 1));
      let envelope = -100000;
      for (const center of centers) {
        const dx = Math.floor(((nx - center.x) * 1024) / center.rx);
        const dy = Math.floor(((ny - center.y) * 1024) / center.ry);
        envelope = Math.max(envelope, 1000 - Math.floor((dx * dx + dy * dy) / 1024));
      }
      const coast = noise(x, y, coastScale, seed ^ 0x434f4153);
      const detail = noise(x, y, detailScale, seed ^ 0x44455441);
      const elevation = envelope + Math.floor(coast / 95) + Math.floor(detail / 280);
      if (elevation < 90) continue;
      const moisture = noise(x, y, coastScale, seed ^ 0x5241494e);
      const ridge = Math.abs(noise(x, y, detailScale, seed ^ 0x52494447));
      let terrain: number = TERRAIN.plains;
      if (elevation > 650 && ridge > 17000) terrain = TERRAIN.mountain;
      else if (elevation > 560 && ridge > 7500) terrain = TERRAIN.hills;
      else if (moisture > 1500) terrain = TERRAIN.forest;
      world.terrain[cell] = terrain;
      if (terrain === TERRAIN.mountain) continue;
      const latitudeCost = Math.floor(Math.abs(ny - 512) / 32);
      const terrainCost = terrain === TERRAIN.hills ? 28 : terrain === TERRAIN.forest ? 13 : 0;
      world.fertility[cell] = Math.max(15, Math.min(100,
        82 + Math.floor(moisture / 2200) - latitudeCost - terrainCost));
    }
  }
  placeStarts(world, factionCount);
  world.biome = deriveBiomes(world.seed, width, height, world.terrain, generatorVersion);
  return world;
}
