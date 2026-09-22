import { SeededRandom, type WorldLayout } from './index';
import type { ReliefPlate } from './relief-v6';

/**
 * Generator8 layout geometry. Everything here is new-version only: generators5–7
 * never call into this module, so their saved worlds keep regenerating exactly.
 * Plate layouts reuse the generator5–7 relief pipeline (insetPlates, irregular
 * envelopes, satellites, inland seas, drainage and climate); Fractal replaces the
 * plate stage with a warped multi-octave heightmap feeding the same pipeline.
 */
const angles = [[1024,0],[946,392],[724,724],[392,946],[0,1024],[-392,946],[-724,724],[-946,392],[-1024,0],[-946,-392],[-724,-724],[-392,-946],[0,-1024],[392,-946],[724,-724],[946,-392]] as const;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const angleOf = (heading: number) => ({ cos: angles[heading % 16]![0], sin: angles[heading % 16]![1] });
function mix(value: number): number {
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad); value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return (value ^ (value >>> 15)) >>> 0;
}
function lattice(gx: number, gy: number, seed: number): number {
  return (mix(seed ^ Math.imul(gx, 0x632be5ab) ^ Math.imul(gy, 0x85157af5)) >>> 16) - 32768;
}
function smooth(n: number): number { return Math.floor(n * n * (768 - 2 * n) / 65536); }
function lerp(a: number, b: number, t: number): number { return a + Math.floor((b - a) * t / 256); }
/** Integer bilinear value noise in ±32768, identical in form to the generator5 field. */
function field(x: number, y: number, scale: number, seed: number): number {
  const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
  const tx = smooth(Math.floor(x % scale * 256 / scale)), ty = smooth(Math.floor(y % scale * 256 / scale));
  return lerp(lerp(lattice(gx, gy, seed), lattice(gx + 1, gy, seed), tx), lerp(lattice(gx, gy + 1, seed), lattice(gx + 1, gy + 1, seed), tx), ty);
}

/** Which generator7 inland-sea budget a generator8 layout borrows; null carves none. */
export function inlandSeaProfile(layout: WorldLayout): 'continents' | 'islands' | 'archipelago' | null {
  if (layout === 'inland-sea') return null;
  if (layout === 'pangaea') return 'continents';
  if (layout === 'fractal' || layout === 'earthlike') return 'islands';
  return layout;
}

/** Which layouts take a generator8 plate arrangement. Continents and Islands (and
 * the Tiny archipelago) keep the historical plates() arrangement at v8 scale. */
export function hasV8Plates(layout: WorldLayout, width: number): layout is 'pangaea' | 'earthlike' | 'inland-sea' | 'archipelago' {
  return layout === 'pangaea' || layout === 'earthlike' || layout === 'inland-sea' || layout === 'archipelago' && width >= 100;
}

/** Continent membership for the historical continents arrangement: mainland and
 * its two lobes, then one eastern continent (two bodies) or two separate ones
 * (north and south, signalled by the two-bay variant); the offshore chain is free. */
export function continentGroups(bayCount: number): number[] {
  return bayCount === 2 ? [0, 0, 0, 1, 2, -1, -1] : [0, 0, 0, 1, 1, -1, -1];
}

/** Per-body continent groups (0–3). Free bodies and offshore satellites join the
 * group whose plain ellipse is strongest at their centre, so no island can bridge
 * two continents. */
export function plateGroups(bodies: readonly ReliefPlate[], original: readonly number[]): Int8Array {
  const groups = new Int8Array(bodies.length);
  for (let index = 0; index < bodies.length; index++) {
    const assigned = original[index] ?? -1;
    if (assigned >= 0) { groups[index] = assigned; continue; }
    let best = -Infinity, group = 0;
    for (let other = 0; other < original.length; other++) {
      if ((original[other] ?? -1) < 0) continue;
      const body = bodies[other]!, dx = bodies[index]!.x - body.x, dy = bodies[index]!.y - body.y;
      const u = Math.floor((dx * body.cos + dy * body.sin) / 1024), v = Math.floor((-dx * body.sin + dy * body.cos) / 1024);
      const px = Math.floor(u * 1024 / body.rx), py = Math.floor(v * 1024 / body.ry), envelope = 1000 - Math.floor((px * px + py * py) / 1024);
      if (envelope > best) { best = envelope; group = original[other]!; }
    }
    groups[index] = group;
  }
  return groups;
}

/** True where a second continent's envelope nearly reaches land too: that overlap
 * becomes a strait at least a few hexes wide, following both coastlines. */
export function continentStrait(groupBest: Int32Array, noise: number): boolean {
  let first = -100_000, second = -100_000;
  for (const value of groupBest) {
    if (value > first) { second = first; first = value; } else if (value > second) second = value;
  }
  return second + noise > -160;
}

/** Plate arrangements for generator8 layouts, in the same normalized 0–1024 space
 * as generator5 plates (x east, y south; insetPlates later pulls them inward). */
export function platesV8(seed: number, layout: 'pangaea' | 'earthlike' | 'inland-sea' | 'archipelago'): { bodies: ReliefPlate[]; bays: ReliefPlate[]; groups?: number[] } {
  const rng = new SeededRandom(seed ^ 0x38504c54);
  const bodies: ReliefPlate[] = [], bays: ReliefPlate[] = [];
  const jitter = (spread: number) => rng.nextInt(spread * 2 + 1) - spread;
  if (layout === 'earthlike') {
    // Fixed north/south orientation (latitude drives climate); only an east–west mirror.
    const mirror = rng.nextInt(2) === 1;
    const make = (x: number, y: number, rx: number, ry: number, heading: number): ReliefPlate => {
      const [cos, sin] = angles[((mirror ? 16 - heading : heading) + 16) % 16]!;
      return { x: mirror ? 1024 - x : x, y, rx, ry, cos, sin, phase: rng.nextInt(1024) };
    };
    const scale = (value: number) => Math.floor(value * (95 + rng.nextInt(16)) / 100);
    // Old World 0, New World 1, the southern continent 2; each island joins its neighbour.
    const groups = [0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 0, 0, 0, 2];
    // Old World: a broad east–west mass, a western peninsula, a southern
    // subcontinent and a tall southern continent joined through a land bridge.
    const northY = 250 + jitter(20);
    bodies.push(make(715 + jitter(15), northY, scale(320), scale(140), 0));
    bodies.push(make(560 + jitter(10), northY + 10, scale(110), scale(105), 15));
    bodies.push(make(790 + jitter(20), northY + 165, scale(100), scale(100), 1));
    // Land bridges run along their long axis so the envelope's side notch never severs them.
    bodies.push(make(675, northY + 150, 150, 60, 4));
    bodies.push(make(645 + jitter(10), 610 + jitter(20), scale(130), scale(200), 0));
    // New World: northern and southern continents joined by a narrow isthmus,
    // an ocean's width west of the Old World.
    bodies.push(make(175 + jitter(10), 270 + jitter(20), scale(150), scale(150), 1));
    bodies.push(make(215, 465 + jitter(10), 150, 52, 3 + rng.nextInt(3)));
    bodies.push(make(235 + jitter(10), 665 + jitter(20), scale(115), scale(195), 1));
    // A smaller southern continent and a few Earth-like islands.
    bodies.push(make(860 + jitter(20), 690 + jitter(25), scale(125), scale(90), 0));
    for (const [x, y, rx, ry] of [[320, 115, 70, 48], [480, 205, 28, 42], [945, 330, 24, 62], [735, 705, 24, 52], [960, 865, 28, 42]] as const) {
      bodies.push(make(x + jitter(10), y + jitter(10), rx, ry, rng.nextInt(16)));
    }
    // An inner sea between Europe and the southern continent, and a gulf in the New World.
    bays.push(make(545 + jitter(10), northY + 130, 80, 30, 0));
    bays.push(make(105, 470, 50, 48, 0));
    return { bodies, bays, groups };
  }
  if (layout === 'archipelago') {
    // Four curved chains of many small islands; generator5–7 used three chains of
    // larger pieces that often fused into medium islands at this scale.
    const chains = 4, pieces = 6 + rng.nextInt(3);
    for (let chain = 0; chain < chains; chain++) {
      const phase = rng.nextInt(16), bend = 35 + rng.nextInt(50);
      for (let piece = 0; piece < pieces; piece++) {
        const x = Math.floor((piece + .6) * 1024 / (pieces + .2)) + jitter(18);
        const y = Math.floor((chain + .55) * 1024 / (chains + .1)) + Math.floor(angles[(phase + piece * 2) % 16]![1]! * bend / 1024);
        const factor = 66 + rng.nextInt(45);
        bodies.push({ x, y, rx: Math.floor(64 * factor / 100), ry: Math.floor(88 * factor / 100), ...angleOf(rng.nextInt(16)), phase: rng.nextInt(1024) });
      }
    }
    return { bodies, bays };
  }
  const rotation = rng.nextInt(16), [globalCos, globalSin] = angles[rotation]!;
  const place = (distanceX: number, distanceY: number, direction: number, rx: number, ry: number, heading: number): ReliefPlate => {
    const [ax, ay] = angles[(direction + rotation) % 16]!, [cos, sin] = angles[(heading + rotation) % 16]!;
    return { x: 512 + Math.floor(ax * distanceX / 1024), y: 512 + Math.floor(ay * distanceY / 1024), rx, ry, cos, sin, phase: rng.nextInt(1024) };
  };
  if (layout === 'pangaea') {
    // One broad core and overlapping lobes on every side; rim bays make gulfs
    // without cutting the landmass apart. The core rotates with the whole map.
    const coreX = 512 + jitter(30), coreY = 512 + jitter(30), coreRx = 330 + rng.nextInt(50), coreRy = 300 + rng.nextInt(50);
    bodies.push({ x: coreX, y: coreY, rx: coreRx, ry: coreRy, cos: globalCos!, sin: globalSin!, phase: rng.nextInt(1024) });
    const lobes = 5 + rng.nextInt(3);
    for (let lobe = 0; lobe < lobes; lobe++) {
      const direction = Math.floor(lobe * 16 / lobes) + rng.nextInt(2), reach = 230 + rng.nextInt(90);
      bodies.push(place(reach, reach, direction, 150 + rng.nextInt(80), 125 + rng.nextInt(70), rng.nextInt(16)));
    }
    const gulfs = 2 + rng.nextInt(2);
    for (let gulf = 0; gulf < gulfs; gulf++) {
      const direction = Math.floor(gulf * 16 / gulfs) + rng.nextInt(4), reach = 330 + rng.nextInt(60);
      bays.push(place(reach, reach, direction, 60 + rng.nextInt(45), 55 + rng.nextInt(40), rng.nextInt(16)));
    }
    return { bodies, bays };
  }
  // Inland Sea: sixteen overlapping tangential lobes form an unbroken ring; a
  // central cut keeps its interior a single large salt sea facing every realm.
  const ringX = 355 + rng.nextInt(30), ringY = 350 + rng.nextInt(30);
  for (let direction = 0; direction < 16; direction++) {
    const radial = 100 + rng.nextInt(35), along = 150 + rng.nextInt(60);
    const outward = direction % 4 === 0 ? 0 : jitter(25);
    bodies.push(place(ringX + outward, ringY + outward, direction, along, radial, direction + 4));
  }
  bays.push({ x: 512 + jitter(20), y: 512 + jitter(20), rx: 215 + rng.nextInt(40), ry: 205 + rng.nextInt(40), cos: 1024, sin: 0, phase: 0 });
  for (let notch = 0; notch < 3; notch++) bays.push(place(250 + rng.nextInt(40), 245 + rng.nextInt(40), rng.nextInt(16), 55 + rng.nextInt(35), 50 + rng.nextInt(30), rng.nextInt(16)));
  return { bodies, bays };
}

/** Earth-like zonal rain added to plate rainfall (2–13, forest from 8): jungle
 * equator, dry subtropics, boreal forest and bare polar plains. */
export function earthlikeRainfall(width: number, height: number, rainfall: Uint8Array): void {
  for (let y = 0; y < height; y++) {
    const latitude = height === 1 ? 0 : Math.floor(Math.abs(2 * y - (height - 1)) * 100 / (height - 1));
    const band = latitude < 16 ? 3 : latitude < 22 ? 1 : latitude < 40 ? -3 : latitude < 50 ? 0 : latitude < 68 ? 1 : -2;
    for (let cell = y * width; cell < (y + 1) * width; cell++) if (rainfall[cell]) rainfall[cell] = clamp(rainfall[cell]! + band, 2, 13);
  }
}

/**
 * Fractal: a domain-warped four-octave heightmap cut at a seeded sea level. Land
 * masses, peninsulas and enclosed waters come from the noise itself rather than
 * from ellipse plates, so no two seeds share a silhouette. Mountains follow warped
 * ridge lines (zero crossings of a separate field) in high interiors only, broken
 * by passes. Returns the number of lake-seeding regions written to plateIds.
 * O(cells), with one Int32Array of scratch and a 4096-bucket histogram.
 */
export function fractalLandform(seed: number, width: number, height: number, elevation: Uint16Array, rainfall: Uint8Array, plateIds: Int8Array): number {
  const count = width * height, raw = new Int32Array(count), rng = new SeededRandom(seed ^ 0x3846524c);
  const base = Math.max(6, Math.floor(width / (4 + rng.nextInt(3)))), warp = Math.max(2, Math.floor(width / 8));
  const octave = [base, Math.max(2, base >> 1), Math.max(2, base >> 2), Math.max(2, base >> 3)];
  // Rifts: meandering ocean channels along zero crossings of a very low field
  // split the heightmap into a seeded number of masses (none to several).
  const riftScale = Math.max(8, Math.floor(width / 2)), riftDepth = rng.nextInt(4) * 7000, riftWidth = 2500 + rng.nextInt(2500);
  const landPermille = 340 + rng.nextInt(100), bandX = Math.max(4, Math.floor(width / 7)), bandY = Math.max(3, Math.floor(height / 6));
  const coastScale = Math.max(3, Math.floor(width / 17)), ridgeScale = Math.max(3, Math.floor(width / 8)), passScale = Math.max(3, Math.floor(width / 14));
  const histogram = new Uint32Array(4096);
  let minimum = Infinity, maximum = -Infinity;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const cell = y * width + x, fx = x + 4096, fy = y + 4096;
    const sx = fx + Math.floor(field(fx, fy, base * 2, seed ^ 0x38575850) * warp / 32768);
    const sy = fy + Math.floor(field(fx, fy, base * 2, seed ^ 0x38575951) * warp / 32768);
    // Persistence ~0.65 keeps strong mid/high octaves: ragged coasts, spits and isles.
    let value = field(sx, sy, octave[0]!, seed ^ 0x38465230) * 8 + field(sx, sy, octave[1]!, seed ^ 0x38465231) * 5
      + field(sx, sy, octave[2]!, seed ^ 0x38465232) * 3 + field(sx, sy, octave[3]!, seed ^ 0x38465233) * 2;
    value = Math.floor(value / 18);
    const rift = Math.abs(field(sx, sy, riftScale, seed ^ 0x38524654));
    if (rift < riftWidth) value -= Math.floor(riftDepth * (riftWidth - rift) / riftWidth);
    // Quadratic border falloff over a noise-warped band: open ocean at the map
    // edge without coasts running parallel to it.
    const wobble = field(fx, fy, base, seed ^ 0x3845444b);
    const ex = Math.max(0, Math.floor((bandX - Math.min(x, width - 1 - x)) * 1024 / bandX) + Math.floor(wobble / 128));
    const ey = Math.max(0, Math.floor((bandY - Math.min(y, height - 1 - y)) * 1024 / bandY) + Math.floor(wobble / 128));
    const edge = Math.min(1024, Math.max(ex, ey));
    value -= Math.floor(edge * edge / 1024 * 36000 / 1024);
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) value = -65536;
    raw[cell] = value; minimum = Math.min(minimum, value); maximum = Math.max(maximum, value);
  }
  const span = Math.max(1, maximum - minimum + 1), bucket = (value: number) => Math.floor((value - minimum) * 4096 / span);
  for (let cell = 0; cell < count; cell++) histogram[bucket(raw[cell]!)] = histogram[bucket(raw[cell]!)]! + 1;
  let level = 4095, above = 0;
  while (level > 0 && above + histogram[level]! <= Math.floor(count * landPermille / 1000)) above += histogram[level--]!;
  const seaLevel = minimum + Math.ceil((level + 1) * span / 4096), relief = Math.max(1, maximum - seaLevel);
  const columns = Math.max(1, Math.min(4, Math.floor(width / 40))), rows = Math.max(1, Math.min(3, Math.floor(height / 30)));
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const cell = y * width + x, value = raw[cell]!;
    if (value < seaLevel) continue;
    const heightValue = 70 + Math.floor((value - seaLevel) * 1400 / relief);
    // Ridged lines: mountains where a separate field crosses zero, rising with
    // distance from the coast and broken by low passes.
    const line = Math.abs(field(x + 4096, y + 4096, ridgeScale, seed ^ 0x38524447));
    const pass = field(x + 4096, y + 4096, passScale, seed ^ 0x38504153) < -10000;
    const ridge = pass ? 0 : Math.max(0, 2500 - Math.floor(line * 2500 / 6000));
    elevation[cell] = clamp(250 + heightValue + (heightValue > 200 ? Math.floor(ridge * Math.min(1024, heightValue * 3) / 1024) : 0), 1, 4095);
    rainfall[cell] = clamp(7 + Math.floor(field(x, y, coastScale, seed ^ 0x35524149) / 5000), 2, 13);
    plateIds[cell] = Math.floor(x * columns / width) + columns * Math.floor(y * rows / height);
  }
  return columns * rows;
}
