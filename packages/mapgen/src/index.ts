/** Increment whenever the same seed/settings can produce different geography. */
import { generateV5, generateV6, generateV7, generateV8 } from './geography-v5';
export { describeGeography, inspectV6Climate, inspectV7Climate, inspectV8Climate } from './geography-v5';
export { deriveV6Climate, deriveV6Biomes, type V6ClimateFields, type ModernClimateOptions } from './climate-v6';
export { geographicDiversity } from './geography-metrics';
export { FLOW_DIRECTION, HYDROLOGY_MASK, LAKE_BIT, directionNeighbor, hydrologyDownstream, isLake, riverDirection, riverSize, validateHydrology } from './hydrology';
import { isLake, riverSize } from './hydrology';
/** Default for new campaigns. Generator8 is complete but opt-in until saves accept it. */
export const GENERATOR_VERSION = 8;
export type GeneratorVersion = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type MapLayout = 'legacy' | 'continents' | 'islands' | 'archipelago' | 'pangaea' | 'fractal' | 'earthlike' | 'inland-sea';
/** A selectable (non-legacy) map type. */
export type WorldLayout = Exclude<MapLayout, 'legacy'>;
export interface WorldGenerationOptions { layout?: WorldLayout }

/** Layouts accepted by generators5–7; their geography is frozen for saved worlds. */
const HISTORICAL_LAYOUTS: readonly WorldLayout[] = ['continents', 'islands', 'archipelago'];

export interface MapTypeInfo { id: WorldLayout; name: string; description: string }
/** New-campaign map types, in presentation order. All require generator8 except
 * Continents/Islands/Archipelago, which older generators also accept. */
export const MAP_TYPES: readonly MapTypeInfo[] = [
  { id: 'continents', name: 'Continents', description: 'Two or three large continents separated by open ocean, with offshore islands.' },
  { id: 'pangaea', name: 'Pangaea', description: 'One vast supercontinent shared by nearly every realm, with bays, inland waters and a few offshore isles.' },
  { id: 'fractal', name: 'Fractal', description: 'Unpredictable, irregular landmasses of every size: ragged coasts, long peninsulas, lakes and scattered isles.' },
  { id: 'islands', name: 'Islands', description: 'Several medium islands and their satellites; seafaring decides who meets whom.' },
  { id: 'archipelago', name: 'Archipelago', description: 'Chains of many small islands across open sea; a naval world from the first turn.' },
  { id: 'earthlike', name: 'Earth-like', description: 'Continents of unequal size in an Earth-like arrangement, cold toward the poles and warm, dry or jungled toward the equator.' },
  { id: 'inland-sea', name: 'Inland Sea', description: 'A ring of land whose coasts face a great central sea.' },
];
const V8_LAYOUTS: readonly WorldLayout[] = MAP_TYPES.map(type => type.id);

/** Layouts a generator version accepts; generators1–4 accept none (their layout is legacy). */
export function supportedLayouts(generatorVersion: GeneratorVersion): readonly WorldLayout[] {
  return generatorVersion >= 8 ? V8_LAYOUTS : generatorVersion >= 5 ? HISTORICAL_LAYOUTS : [];
}

/** Historical (generators1–7) dimensions. Frozen: saved worlds regenerate from them. */
export const MAP_DIMENSIONS = {
  tiny: { width: 48, height: 32 },
  small: { width: 256, height: 160 },
  standard: { width: 384, height: 256 },
  huge: { width: 512, height: 384 },
  legendary: { width: 640, height: 480 },
} as const;

export type MapSize = keyof typeof MAP_DIMENSIONS;

/** Generator8 dimensions: somewhat smaller, Civilization-scale maps for ~12 realms. */
export const MAP_DIMENSIONS_V8: Readonly<Record<MapSize, { readonly width: number; readonly height: number }>> = {
  tiny: { width: 48, height: 32 },
  small: { width: 176, height: 110 },
  standard: { width: 224, height: 140 },
  huge: { width: 288, height: 180 },
  legendary: { width: 352, height: 220 },
};

function isGeneratorVersion(version: unknown): version is GeneratorVersion {
  return version === 1 || version === 2 || version === 3 || version === 4 || version === 5 || version === 6 || version === 7 || version === 8;
}

/** Dimensions of a map size under a generator version. */
export function mapDimensions(size: MapSize, generatorVersion: GeneratorVersion): { width: number; height: number } {
  if (!Object.hasOwn(MAP_DIMENSIONS, size)) throw new RangeError('Unknown map size.');
  if (!isGeneratorVersion(generatorVersion)) throw new RangeError('Unknown generator version.');
  const { width, height } = (generatorVersion >= 8 ? MAP_DIMENSIONS_V8 : MAP_DIMENSIONS)[size];
  return { width, height };
}

/** Inverse of mapDimensions: recovers a saved world's size, or undefined for foreign dimensions. */
export function mapSizeOf(width: number, height: number, generatorVersion: GeneratorVersion): MapSize | undefined {
  if (!isGeneratorVersion(generatorVersion)) return undefined;
  const table = generatorVersion >= 8 ? MAP_DIMENSIONS_V8 : MAP_DIMENSIONS;
  return (Object.keys(table) as MapSize[]).find(size => table[size].width === width && table[size].height === height);
}

/** New-campaign UI defaults only. Explicit counts and existing seeded worlds remain unchanged. */
export const RECOMMENDED_FACTION_COUNTS: Readonly<Record<MapSize, number>> = {
  tiny: 4, small: 8, standard: 12, huge: 16, legendary: 20,
};
export function recommendedFactionCount(size: MapSize): number {
  if (!Object.hasOwn(RECOMMENDED_FACTION_COUNTS, size)) throw new RangeError('Unknown map size.');
  return RECOMMENDED_FACTION_COUNTS[size];
}

export const TERRAIN = { water: 0, plains: 1, forest: 2, hills: 3, mountain: 4 } as const;
export const TERRAIN_NAMES = ['Water', 'Plains', 'Forest', 'Hills', 'Mountain'] as const;
export const WATER_DEPTH = { land: 0, shallow: 1, deep: 2 } as const;
export const WATER_DEPTH_NAMES = ['Land', 'Coastal shallows', 'Deep ocean'] as const;
export function isValidWaterDepth(depth: number): boolean { return Number.isInteger(depth) && depth >= 0 && depth < WATER_DEPTH_NAMES.length; }
export const BIOME = { ocean: 0, grassland: 1, temperateForest: 2, taiga: 3, tundra: 4, desert: 5, steppe: 6, marsh: 7, rainforest: 8, alpine: 9, ashScrub: 10, chalkland: 11 } as const;
export const BIOME_NAMES = ['Ocean', 'Temperate grassland', 'Temperate forest', 'Taiga', 'Tundra', 'Desert', 'Steppe', 'Marsh', 'Rainforest', 'Alpine', 'Ash scrub', 'Chalkland'] as const;
export function isValidBiome(biome: number): boolean { return Number.isInteger(biome) && biome >= 0 && biome < BIOME_NAMES.length; }
export const FEATURE = { spring: 1, ore: 2, oldGrowth: 4, waterlogging: 8, peat: 16, richShoals: 32, glassShards: 64 } as const;
export const FEATURE_MASK = 127;
export function isValidFeatureMask(features: number): boolean { return Number.isInteger(features) && features >= 0 && features <= FEATURE_MASK; }

export interface World {
  /** Canonical unsigned 32-bit seed. */
  seed: number;
  generatorVersion: GeneratorVersion;
  layout: MapLayout;
  /** Downstream direction bits0–2, river size bits3–4, lake bit5; upper bits zero. */
  hydrology: Uint8Array;
  width: number;
  height: number;
  terrain: Uint8Array;
  /** Zero on land; the first two water hexes from land are shallow, all other water deep. */
  waterDepth: Uint8Array;
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

/** Same ordered topology as neighbors(), replacing caller-owned scratch storage.
 * The returned array is the supplied buffer; callers must not retain it as a
 * prior cell's neighbor list while reusing the buffer for another cell. */
export function neighborsInto(cell: number, width: number, height: number, result: number[]): number[] {
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
      !Number.isInteger(cell) || cell < 0 || cell >= width * height) {
    result.length = 0;
    return result;
  }
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

/**
 * A bounded two-hex coastal shelf, derived without RNG or changes to physical terrain.
 * All non-water terrain, including mountains, forms a shore. Map edges are not land.
 * O(cells) time and at most 5 bytes/cell of output + temporary storage; no recursive flood.
 * Also used on authored/legacy snapshots: regenerating terrain would erase their edits.
 */
export function deriveWaterDepth(width: number, height: number, terrain: Uint8Array): Uint8Array {
  if (!(terrain instanceof Uint8Array) || !Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
      width * height > 350_000 || terrain.length !== width * height || terrain.some(value => value > TERRAIN.mountain)) {
    throw new RangeError('Water depth requires matching bounded physical terrain.');
  }
  const result = new Uint8Array(terrain.length);
  const shoreline = new Int32Array(terrain.length);
  const adjacent: number[] = [];
  let count = 0;
  for (let cell = 0; cell < terrain.length; cell++) {
    if (terrain[cell] !== TERRAIN.water) continue;
    result[cell] = WATER_DEPTH.deep;
    writeNeighbors(cell, width, height, adjacent);
    if (adjacent.some(next => terrain[next] !== TERRAIN.water)) {
      result[cell] = WATER_DEPTH.shallow;
      shoreline[count++] = cell;
    }
  }
  // Expand only the first band, never enqueue the second: wide seas retain deep channels.
  for (let index = 0; index < count; index++) {
    writeNeighbors(shoreline[index]!, width, height, adjacent);
    for (const next of adjacent) if (terrain[next] === TERRAIN.water) result[next] = WATER_DEPTH.shallow;
  }
  return result;
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

/** Historical terrain-only classifier. Generator6 needs relief/hydrology and uses
 * deriveV6Biomes instead; this helper's default stays on the played generator5. */
export function deriveBiomes(seed: number, width: number, height: number, terrain: Uint8Array, generatorVersion: GeneratorVersion = 5): Uint8Array {
  if (generatorVersion === 6) throw new RangeError('Generator6 biomes require relief and hydrology; use deriveV6Biomes.');
  if (generatorVersion === 7) throw new RangeError('Generator7 biomes require relief and hydrology; use deriveV6Biomes.');
  if (generatorVersion === 8) throw new RangeError('Generator8 biomes require relief and hydrology; use deriveV6Biomes.');
  if (generatorVersion !== 1 && generatorVersion !== 2 && generatorVersion !== 3 && generatorVersion !== 4 && generatorVersion !== 5) throw new RangeError('Unknown generator version.');
  validateClimateInput(seed, width, height, terrain);
  const result = new Uint8Array(terrain.length);
  const climate = generatorVersion >= 2 ? deriveClimate(seed, width, height, terrain) : undefined;
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
    // Generator4 adds coherent Ashfall disturbance and calcareous land identities.
    // These are labels only: no relief, fertility, shelf or start-placement changes.
    // Woodland, tundra, marsh and alpine retain their existing climate constraints.
    if (generatorVersion >= 4 && physical !== TERRAIN.forest) {
      const geology = noise(cell % width, Math.floor(cell / width), Math.max(4, Math.floor(width / 9)), seed ^ 0x47454f4c);
      if (temperature >= 40 && moisture < 52 && geology < -9000) result[cell] = BIOME.ashScrub;
      else if (temperature >= 35 && moisture < 63 && geology > 8500) result[cell] = BIOME.chalkland;
    }
  }
  return result;
}

/**
 * Sparse, stateless O(1) feature query from immutable geography, including migrated
 * worlds. Never reads a cultivated biome, consumes an RNG stream, or scans the map.
 * Rules versions decide whether these economic features apply to a campaign.
 */
export function naturalFeatures(world: World, cell: number): number {
  const { width, height, seed, terrain, waterDepth } = world;
  if (!Number.isSafeInteger(seed) || !Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1 ||
      width * height > 350_000 || !(terrain instanceof Uint8Array) || !(waterDepth instanceof Uint8Array) ||
      terrain.length !== width * height || waterDepth.length !== terrain.length || !Number.isInteger(cell) || cell < 0 || cell >= terrain.length) {
    throw new RangeError('Natural features require a valid bounded world and cell.');
  }
  const physical = terrain[cell]!;
  if (physical > TERRAIN.mountain || !isValidWaterDepth(waterDepth[cell]!) || (physical === TERRAIN.water) === (waterDepth[cell] === WATER_DEPTH.land)) throw new RangeError('Natural feature terrain and depth disagree.');
  if (world.generatorVersion >= 5 && (!(world.hydrology instanceof Uint8Array) || world.hydrology.length !== terrain.length || world.hydrology[cell]! > 63)) throw new RangeError('Natural features require bounded matching hydrology.');
  const x = cell % width, y = Math.floor(cell / width);
  const geology = noise(x, y, Math.max(4, Math.floor(width / 9)), seed ^ 0x47454f4c);
  const roll = mix32(seed ^ Math.imul(cell + 1, 0x4e415455));
  let result = 0;
  if (physical === TERRAIN.water) {
    if (waterDepth[cell] === WATER_DEPTH.shallow) {
      if (roll % 3 !== 0) result |= FEATURE.richShoals;
      if (geology > 11000 && roll % 5 === 0) result |= FEATURE.glassShards;
    }
    return result;
  }
  if ((physical === TERRAIN.hills || physical === TERRAIN.mountain) && roll % 3 === 0) result |= FEATURE.ore;
  if (physical === TERRAIN.mountain) return result;
  if (roll % 17 === 0) result |= FEATURE.spring;
  if (world.generatorVersion >= 5 && (riverSize(world.hydrology[cell]!) || neighbors(cell, width, height).some(next => isLake(world.hydrology[next]!) || riverSize(world.hydrology[next]!)))) result |= FEATURE.spring;
  if (physical === TERRAIN.forest && (roll >>> 8) % 3 === 0) result |= FEATURE.oldGrowth;
  const coastal = neighbors(cell, width, height).some(next => terrain[next] === TERRAIN.water);
  const wet = noise(x, y, Math.max(4, Math.floor(width / 11)), seed ^ 0x5241494e) > 3500;
  if (physical !== TERRAIN.hills && wet && (coastal || (roll >>> 16) % 5 === 0)) {
    result |= FEATURE.waterlogging;
    if ((roll >>> 12) % 3 === 0) result |= FEATURE.peat;
  }
  if (coastal && geology > 11000 && roll % 3 === 0) result |= FEATURE.glassShards;
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

/** Versioned, worker-safe geography. V5–8 use independent relief/drainage;
 * the original two-envelope generator below remains frozen for versions1–4. */
export function generateWorld(seed: number, size: MapSize, factionCount: number, generatorVersion: GeneratorVersion = GENERATOR_VERSION, options: WorldGenerationOptions = {}): World {
  if (!Number.isSafeInteger(seed)) throw new RangeError('Seed must be a safe integer.');
  if (!Object.hasOwn(MAP_DIMENSIONS, size)) throw new RangeError('Unknown map size.');
  if (!isGeneratorVersion(generatorVersion)) throw new RangeError('Unknown generator version.');
  if (!Number.isInteger(factionCount) || factionCount < 1 || factionCount > 48) {
    throw new RangeError('Faction count must be an integer between 1 and 48.');
  }
  if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some(key => key !== 'layout') ||
    (options.layout !== undefined && !V8_LAYOUTS.includes(options.layout))) throw new RangeError('Unknown world layout.');
  if (generatorVersion <= 4 && options.layout !== undefined) throw new RangeError('Historical generators do not accept layout settings.');
  if (options.layout !== undefined && !supportedLayouts(generatorVersion).includes(options.layout)) {
    throw new RangeError(`World layout ${options.layout} requires generator 8.`);
  }
  if (generatorVersion === 5) return generateV5(seed, size, factionCount, options.layout ?? 'continents');
  if (generatorVersion === 6) return generateV6(seed, size, factionCount, options.layout ?? 'continents');
  if (generatorVersion === 7) return generateV7(seed, size, factionCount, options.layout ?? 'continents');
  if (generatorVersion === 8) return generateV8(seed, size, factionCount, options.layout ?? 'continents');
  const { width, height } = MAP_DIMENSIONS[size];
  const world: World = {
    seed: seed >>> 0, width, height, generatorVersion, layout: 'legacy', hydrology: new Uint8Array(width * height),
    terrain: new Uint8Array(width * height),
    waterDepth: new Uint8Array(width * height),
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
  world.waterDepth = deriveWaterDepth(width, height, world.terrain);
  return world;
}
