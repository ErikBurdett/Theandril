import { deriveBiomes, deriveWaterDepth, FEATURE, hexDistance, isPassable, mapDimensions, naturalFeatures, SeededRandom, TERRAIN, type MapLayout, type MapSize, type World } from './index';
import { directionNeighbor, isLake, LAKE_BIT, riverSize, validateHydrology } from './hydrology';
import { deriveV6Biomes, deriveV6Climate } from './climate-v6';
import { carveEnclosedSeas, insetPlates, irregularEnvelope, offshoreSatellites, spineSaddle } from './relief-v6';
import { carveInlandSeasV7, type InlandSeaCarving } from './inland-seas-v7';
import { continentGroups, continentStrait, earthlikeRainfall, fractalLandform, hasV8Plates, inlandSeaProfile, plateGroups, platesV8 } from './geography-v8';

type Layout = Exclude<MapLayout, 'legacy'>;
interface Plate { x: number; y: number; rx: number; ry: number; cos: number; sin: number; phase: number }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
function mix(value: number): number {
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad); value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return (value ^ (value >>> 15)) >>> 0;
}
function sample(x: number, y: number, seed: number): number { return (mix(seed ^ Math.imul(x, 0x632be5ab) ^ Math.imul(y, 0x85157af5)) >>> 16) - 32768; }
function smooth(n: number): number { return Math.floor(n * n * (768 - 2 * n) / 65536); }
function lerp(a: number, b: number, t: number): number { return a + Math.floor((b - a) * t / 256); }
function field(x: number, y: number, scale: number, seed: number): number {
  const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
  const tx = smooth(Math.floor(x % scale * 256 / scale)), ty = smooth(Math.floor(y % scale * 256 / scale));
  return lerp(lerp(sample(gx, gy, seed), sample(gx + 1, gy, seed), tx), lerp(sample(gx, gy + 1, seed), sample(gx + 1, gy + 1, seed), tx), ty);
}
function adjacent(cell: number, width: number, height: number, visit: (next: number, direction: number) => void): void {
  for (let direction = 1; direction <= 6; direction++) {
    const next = directionNeighbor(cell, width, height, direction); if (next !== null) visit(next, direction);
  }
}

function plates(seed: number, layout: Layout, width: number): { bodies: Plate[]; bays: Plate[] } {
  const rng = new SeededRandom(seed ^ 0x35504c54);
  const bodies: Plate[] = [], bays: Plate[] = [];
  const angles = [[1024,0],[946,392],[724,724],[392,946],[0,1024],[-392,946],[-724,724],[-946,392],[-1024,0],[-946,-392],[-724,-724],[-392,-946],[0,-1024],[392,-946],[724,-724],[946,-392]];
  const rotation = rng.nextInt(16), [globalCos, globalSin] = angles[rotation]!;
  const make = (x: number, y: number, rx: number, ry: number, heading: number): Plate => {
    const [cos, sin] = angles[(heading + rotation + 16) % 16]!;
    return { x: 512 + Math.floor(((x - 512) * globalCos! - (y - 512) * globalSin!) / 1024),
      y: 512 + Math.floor(((x - 512) * globalSin! + (y - 512) * globalCos!) / 1024), rx, ry, cos: cos!, sin: sin!, phase: rng.nextInt(1024) };
  };
  if (layout === 'continents') {
    // An unequal branching mainland and one/two smaller continental bodies; global
    // rotation, side, proportions and lobes vary, not just the shoreline texture.
    const three = rng.nextInt(2) === 0, mainY = 475 + rng.nextInt(75);
    const mainRx = 220 + rng.nextInt(35), mainRy = 270 + rng.nextInt(70);
    bodies.push(make(300, mainY, mainRx, mainRy, rng.nextInt(3) - 1));
    bodies.push(make(220 + rng.nextInt(70), mainY - mainRy + 45, 140 + rng.nextInt(40), 130 + rng.nextInt(50), 1));
    bodies.push(make(370 + rng.nextInt(65), mainY + mainRy - 70, 125 + rng.nextInt(45), 115 + rng.nextInt(50), 2));
    bays.push(make(480, mainY - 70, 65 + rng.nextInt(40), 100 + rng.nextInt(35), 1));
    bays.push(make(115, mainY + 100, 75 + rng.nextInt(25), 70 + rng.nextInt(40), -1));
    if (three) {
      bodies.push(make(785, 250 + rng.nextInt(70), 140 + rng.nextInt(35), 165 + rng.nextInt(35), 1));
      bodies.push(make(760, 740 + rng.nextInt(40), 165 + rng.nextInt(30), 145 + rng.nextInt(40), -1));
    } else {
      bodies.push(make(775, 495 + rng.nextInt(80), 165 + rng.nextInt(30), 290 + rng.nextInt(45), -1));
      bodies.push(make(740, 765, 95, 125, 2));
      bays.push(make(900, 565, 80, 110, 1));
    }
    // A small offshore chain complements (and does not duplicate) the large land.
    bodies.push(make(615, 105 + rng.nextInt(35), 35 + rng.nextInt(20), 55, 2));
    bodies.push(make(690, 85 + rng.nextInt(25), 22 + rng.nextInt(15), 35, 2));
  } else if (layout === 'islands') {
    for (let slot = 0; slot < 6; slot++) {
      const x = 160 + slot % 3 * 350 + rng.nextInt(85) - 42, y = 255 + Math.floor(slot / 3) * 490 + rng.nextInt(100) - 50;
      const factor = slot === 0 ? 125 : 65 + rng.nextInt(61), rx = Math.floor(145 * factor / 100), ry = Math.floor((160 + rng.nextInt(40)) * factor / 100);
      bodies.push(make(x, y, rx, ry, rng.nextInt(5) - 2));
      if (slot % 2 === 0) {
        bodies.push(make(x + rx + 30, y + 70, Math.max(25, Math.floor(rx * .38)), Math.max(35, Math.floor(ry * .40)), 2));
        bodies.push(make(x + rx + 90, y + 140, Math.max(20, Math.floor(rx * .21)), Math.max(25, Math.floor(ry * .26)), 3));
      }
      bays.push(make(x - rx + 15, y - 35, Math.floor(rx * .4), Math.floor(ry * .35), 1));
    }
  } else {
    // Curved chains with tapering, unevenly spaced islands, rather than a tile grid.
    const chains = width < 100 ? 2 : 3, pieces = width < 100 ? 4 : 5 + rng.nextInt(2);
    for (let chain = 0; chain < chains; chain++) {
      const phase = rng.nextInt(16), bend = 40 + rng.nextInt(55);
      for (let piece = 0; piece < pieces; piece++) {
        const x = Math.floor((piece + .65) * 1024 / (pieces + .3)) + rng.nextInt(35) - 17;
        const y = Math.floor((chain + .55) * 1024 / (chains + .1)) + Math.floor(angles[(phase + piece * 2) % 16]![1]! * bend / 1024);
        const factor = (width < 100 ? 90 : 70) + rng.nextInt(width < 100 ? 41 : 61);
        const rx = Math.floor((width < 100 ? 120 : 80) * factor / 100), ry = Math.floor((width < 100 ? 145 : 110) * factor / 100);
        bodies.push(make(x, y, rx, ry, (piece + chain) % 4 - 1));
      }
    }
  }
  return { bodies, bays };
}

/** Plate relief (generators5–8): irregular rotated plate envelopes, coast noise,
 * bays and spine ridges. Returns the plate count used by upland-basin seeding. */
function plateLandform(world: World, elevation: Uint16Array, rainfall: Uint8Array, plateIds: Int8Array): number {
  const { width, height, seed } = world, layout = world.layout as Layout, modern = world.generatorVersion >= 6;
  const v8 = world.generatorVersion >= 8, original: { bodies: Plate[]; bays: Plate[]; groups?: number[] } = v8 && hasV8Plates(layout, width) ? platesV8(seed, layout) : plates(seed, layout, width);
  if (v8 && layout === 'continents') original.groups = continentGroups(original.bays.length);
  const bodies = modern && width >= 100 ? insetPlates(original.bodies) : original.bodies, bays = modern && width >= 100 ? insetPlates(original.bays) : original.bays;
  if (modern) bodies.push(...offshoreSatellites(seed, width, bodies));
  // Generator8 only: bodies of different continents never fuse (see continentStrait).
  const groups = original.groups ? plateGroups(bodies, original.groups) : null, groupBest = new Int32Array(4);
  const coastScale = Math.max(3, Math.floor(width / 17)), detailScale = Math.max(2, Math.floor(width / 47));
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const cell = y * width + x, nx = Math.floor(x * 1024 / (width - 1)), ny = Math.floor(y * 1024 / (height - 1));
    let best = -100_000, ridge = 0, selected = -1, chosenU = 0, chosenV = 0;
    if (groups) groupBest.fill(-100_000);
    for (let index = 0; index < bodies.length; index++) {
      const body = bodies[index]!, dx = nx - body.x, dy = ny - body.y;
      const u = Math.floor((dx * body.cos + dy * body.sin) / 1024), v = Math.floor((-dx * body.sin + dy * body.cos) / 1024);
      const px = Math.floor(u * 1024 / body.rx), py = Math.floor(v * 1024 / body.ry);
      // Connected asymmetrical lobes and a bent spine; high-frequency coast noise comes later.
      const envelope = modern ? irregularEnvelope(px, py, body.phase) : 1000 - Math.floor((px * px + py * py) / 1024);
      if (envelope > best) {
        best = envelope; selected = index; chosenU = u; chosenV = v;
      }
      if (groups && envelope > groupBest[groups[index]!]!) groupBest[groups[index]!] = envelope;
    }
    const coast = Math.floor(field(x, y, coastScale, seed ^ 0x35434f41) / 75);
    const detail = Math.floor(field(x, y, detailScale, seed ^ 0x35444554) / 260);
    let heightValue = best + coast + detail;
    if (groups && continentStrait(groupBest, coast + detail)) heightValue = Math.min(heightValue, 40);
    for (const bay of bays) {
      const dx = nx - bay.x, dy = ny - bay.y, px = Math.floor(dx * 1024 / bay.rx), py = Math.floor(dy * 1024 / bay.ry);
      const cut = 1000 - Math.floor((px * px + py * py) / 1024);
      if (cut > 0) heightValue = Math.min(heightValue, 50 - Math.floor(cut / 2) + Math.floor(detail / 3));
    }
    if (heightValue < 70) continue;
    const body = bodies[selected]!, bend = Math.floor(field(chosenU + 2048, body.phase, 110, seed ^ selected ^ 0x5350494e) / 1500);
    const ridgeDistance = Math.abs(chosenV - bend), pass = (chosenU + 2048 + body.phase) % 150 < 17;
    ridge = modern ? Math.floor(Math.max(0, 1800 - ridgeDistance * 48) * spineSaddle(chosenU, body.phase) / 1024) * Number(Math.abs(chosenU) < body.rx * .8)
      : Math.max(0, 1800 - ridgeDistance * 48) * Number(Math.abs(chosenU) < body.rx * .8 && !pass);
    plateIds[cell] = selected;
    elevation[cell] = clamp(250 + heightValue + (heightValue > 380 ? ridge : 0), 1, 4095);
    rainfall[cell] = clamp(7 + Math.floor(field(x, y, coastScale, seed ^ 0x35524149) / 5000), 2, 13);
  }
  return bodies.length;
}

interface Relief { elevation: Uint16Array; rainfall: Uint8Array; basins: Uint8Array; inlandSeaCarvings?: InlandSeaCarving[] }
function createRelief(world: World): Relief {
  const { width, height, seed } = world, count = width * height, layout = world.layout as Layout;
  const modern = world.generatorVersion >= 6, v8 = world.generatorVersion >= 8;
  const elevation = new Uint16Array(count), rainfall = new Uint8Array(count), basins = new Uint8Array(count), plateIds = new Int8Array(count).fill(-1);
  // Generator8 Fractal swaps the plate stage for a heightmap; every later stage is shared.
  const plateCount = v8 && layout === 'fractal' ? fractalLandform(seed, width, height, elevation, rainfall, plateIds) : plateLandform(world, elevation, rainfall, plateIds);
  if (v8 && layout === 'earthlike') earthlikeRainfall(width, height, rainfall);
  const seaProfile = v8 ? inlandSeaProfile(layout) : layout;
  if (layout === 'archipelago' && width < 100) {
    // On the compact test map, neighbouring volcanic islands can otherwise
    // coalesce when coast noise meets the generous land needed by48 seats.
    // Keep a real sea strait on BOTH sides of every intersecting plate seam;
    // mountains never count as water separation. Larger maps retain their
    // existing naturally separated chain geometry byte for byte.
    const straits = new Uint8Array(count);
    for (let cell = 0; cell < count; cell++) if (elevation[cell]) {
      adjacent(cell, width, height, next => {
        if (elevation[next] && plateIds[next] !== plateIds[cell]) straits[cell] = 1;
      });
    }
    for (let cell = 0; cell < count; cell++) if (straits[cell]) {
      elevation[cell] = 0; rainfall[cell] = 0; plateIds[cell] = -1;
    }
  }
  // A large lowland basin enclosed by the mainland is an inland sea, not an
  // alpine freshwater lake. It keeps ordinary water/zero hydrology and is counted
  // separately by boundary-connected water-component diagnostics.
  let inlandSeaCarvings: InlandSeaCarving[] | undefined;
  if (seaProfile === null) inlandSeaCarvings = [];
  else if (world.generatorVersion >= 7 && width >= 100) inlandSeaCarvings = carveInlandSeasV7(seed, width, height, seaProfile, elevation, rainfall);
  else if (modern) carveEnclosedSeas(seed, width, height, seaProfile === 'continents' ? 3 : seaProfile === 'islands' ? 2 : 1, elevation, rainfall);
  else if (layout === 'continents') {
    const distance = new Uint16Array(count).fill(65535), queue = new Int32Array(count);
    let head = 0, tail = 0, center = -1;
    for (let cell = 0; cell < count; cell++) if (elevation[cell] === 0) { distance[cell] = 0; queue[tail++] = cell; }
    while (head < tail) {
      const cell = queue[head++]!;
      if (center < 0 || distance[cell]! > distance[center]!) center = cell;
      adjacent(cell, width, height, next => { if (distance[next] === 65535) { distance[next] = distance[cell]! + 1; queue[tail++] = next; } });
    }
    const radius = Math.max(1, Math.min(Math.floor(width / 32), Math.floor(distance[center]! / 2)));
    if (distance[center]! >= radius + 3) {
      const cx = center % width, cy = Math.floor(center / width);
      for (let y = cy - radius; y <= cy + radius; y++) for (let x = cx - radius; x <= cx + radius; x++) {
        const cell = y * width + x;
        if (hexDistance(center, cell, width) <= radius && (x - cx) * (x - cx) + 2 * (y - cy) * (y - cy) <= radius * radius) { elevation[cell] = 0; rainfall[cell] = 0; }
      }
    }
  }
  // Carve a few finite upland basins before drainage; the flood determines actual spill levels.
  // One basin per alternate plate is bounded, coherent and does not stamp lakes into lowlands.
  const radius = Math.max(1, Math.floor(width / 170)), bestCells = new Int32Array(plateCount).fill(-1);
  for (let cell = 0; cell < count; cell++) {
    const plate = plateIds[cell]!; if (plate < 0 || !modern && plate % 2 || elevation[cell]! < (modern ? 1600 : 2000)) continue;
    const x = cell % width, y = Math.floor(cell / width);
    if (x < radius + 3 || x >= width - radius - 3 || y < radius + 3 || y >= height - radius - 3) continue;
    let inland = true;
    for (let dy = -radius - 2; dy <= radius + 2 && inland; dy++) for (let dx = -radius - 2; dx <= radius + 2; dx++) {
      if (elevation[(y + dy) * width + x + dx] === 0) { inland = false; break; }
    }
    if (inland && (bestCells[plate] === -1 || elevation[cell]! > elevation[bestCells[plate]!]!)) bestCells[plate] = cell;
  }
  for (const center of bestCells) {
    if (center < 0) continue;
    const x = center % width, y = Math.floor(center / width), level = Math.max(1600, elevation[center]! - 200);
    for (let dy = -radius - 2; dy <= radius + 2; dy++) for (let dx = -radius - 2; dx <= radius + 2; dx++) {
      const cell = (y + dy) * width + x + dx, distance = hexDistance(cell, center, width);
      if (distance <= radius) { elevation[cell] = level - 400; basins[cell] = 1; }
      else if (distance === radius + 1) elevation[cell] = Math.max(elevation[cell]!, level);
    }
  }
  return { elevation, rainfall, basins, ...(inlandSeaCarvings ? { inlandSeaCarvings } : {}) };
}

/** Integer priority flood: each cell is enqueued once; FIFO elevation buckets preserve ties. */
function drainage(world: World, relief: Relief): { parent: Int32Array; flow: Uint32Array; lake: Uint8Array } {
  const { width, height } = world, { elevation, rainfall, basins } = relief, count = elevation.length;
  const parent = new Int32Array(count).fill(-2), filled = new Uint16Array(count), next = new Int32Array(count).fill(-1), rank = new Uint32Array(count);
  const heads = new Int32Array(4096).fill(-1), tails = new Int32Array(4096).fill(-1), lake = new Uint8Array(count);
  const enqueue = (cell: number, level: number) => {
    filled[cell] = level;
    if (tails[level] === -1) heads[level] = cell; else next[tails[level]!] = cell;
    tails[level] = cell;
  };
  for (let cell = 0; cell < count; cell++) if (elevation[cell] === 0) { parent[cell] = -1; enqueue(cell, 0); }
  let visited = 0;
  for (let level = 0; level < 4096; level++) while (heads[level] !== -1) {
    const cell = heads[level]!; heads[level] = next[cell]!; if (heads[level] === -1) tails[level] = -1;
    rank[cell] = visited++;
    adjacent(cell, width, height, other => {
      if (parent[other] !== -2) return;
      parent[other] = cell; enqueue(other, Math.max(level, elevation[other]!));
    });
  }
  for (let cell = 0; cell < count; cell++) if (basins[cell] && filled[cell]! > elevation[cell]!) lake[cell] = 1;
  // A lake has one spill outlet, not several independent flood-front exits. Root its
  // internal drainage at its earliest flood cell; that parent's chain cannot reenter
  // this basin because every parent was visited strictly earlier.
  const seen = new Uint8Array(count), queue = new Int32Array(count);
  for (let origin = 0; origin < count; origin++) {
    if (!lake[origin] || seen[origin]) continue;
    let head = 0, tail = 1, outlet = -1; queue[0] = origin; seen[origin] = 1;
    while (head < tail) {
      const cell = queue[head++]!;
      if (outlet < 0 || rank[cell]! < rank[outlet]!) outlet = cell;
      adjacent(cell, width, height, other => { if (lake[other] && !seen[other]) { seen[other] = 1; queue[tail++] = other; } });
    }
    if (outlet < 0) throw new Error('Lake has no drainage outlet.');
    // Keep only this group's cells in a reusable local membership/visited marker.
    for (let index = 0; index < tail; index++) seen[queue[index]!] = 2;
    head = 0; tail = 1; queue[0] = outlet; seen[outlet] = 3;
    while (head < tail) {
      const cell = queue[head++]!;
      adjacent(cell, width, height, other => { if (seen[other] === 2) { seen[other] = 3; parent[other] = cell; queue[tail++] = other; } });
    }
  }
  // Topological accumulation remains exact after basin rerooting; no recursive walks.
  const incoming = new Uint8Array(count), flow = new Uint32Array(count);
  for (let cell = 0; cell < count; cell++) { if (parent[cell]! >= 0) incoming[parent[cell]!] = incoming[parent[cell]!]! + 1; flow[cell] = rainfall[cell]!; }
  let head = 0, tail = 0;
  for (let cell = 0; cell < count; cell++) if (!incoming[cell]) queue[tail++] = cell;
  while (head < tail) {
    const cell = queue[head++]!, downstream = parent[cell]!;
    if (downstream >= 0) { flow[downstream] = flow[downstream]! + flow[cell]!; incoming[downstream] = incoming[downstream]! - 1; if (!incoming[downstream]) queue[tail++] = downstream; }
  }
  if (tail !== count) throw new Error('Drainage must be acyclic.');
  return { parent, flow, lake };
}

/** Reachable land components are also used to validate meaningful overseas starts. */
function components(world: World, passable: boolean, mountainsOnly = false): { labels: Int32Array; sizes: number[] } {
  const count = world.terrain.length, labels = new Int32Array(count), queue = new Int32Array(count), sizes = [0];
  for (let origin = 0; origin < count; origin++) {
    if (labels[origin] || (mountainsOnly ? world.terrain[origin] !== TERRAIN.mountain : passable ? !isPassable(world.terrain[origin]!) : world.terrain[origin] === 0)) continue;
    const id = sizes.length; let head = 0, tail = 1; queue[0] = origin; labels[origin] = id;
    while (head < tail) adjacent(queue[head++]!, world.width, world.height, next => {
      if (!labels[next] && (mountainsOnly ? world.terrain[next] === TERRAIN.mountain : passable ? isPassable(world.terrain[next]!) : world.terrain[next] !== 0)) { labels[next] = id; queue[tail++] = next; }
    });
    sizes.push(tail);
  }
  return { labels, sizes };
}

function placeModernStarts(world: World, count: number): void {
  const { width, height, terrain, fertility } = world, { labels, sizes } = components(world, true);
  const freshwater = new Uint8Array(terrain.length), coastal = new Uint8Array(terrain.length), queue = new Int32Array(terrain.length);
  const distance = (target: Uint8Array, source: (cell: number) => boolean, limit: number) => {
    target.fill(255); let head = 0, tail = 0;
    for (let cell = 0; cell < terrain.length; cell++) if (source(cell)) { target[cell] = 0; queue[tail++] = cell; }
    while (head < tail) {
      const cell = queue[head++]!; if (target[cell]! >= limit) continue;
      adjacent(cell, width, height, next => { if (isPassable(terrain[next]!) && target[next] === 255) { target[next] = target[cell]! + 1; queue[tail++] = next; } });
    }
  };
  distance(freshwater, cell => Boolean(riverSize(world.hydrology[cell]!) || isLake(world.hydrology[cell]!) ||
    (isPassable(terrain[cell]!) && (naturalFeatures(world, cell) & FEATURE.spring))), 3);
  distance(coastal, cell => terrain[cell] === 0 && !isLake(world.hydrology[cell]!), Math.max(8, Math.floor(width / 20)));
  const candidates: number[][] = sizes.map(() => []);
  for (let cell = 0; cell < terrain.length; cell++) {
    if (!labels[cell] || sizes[labels[cell]!]! < 24 || freshwater[cell]! > 3 || coastal[cell] === 255) continue;
    let access = 0; adjacent(cell, width, height, next => { if (labels[next] === labels[cell]) access++; });
    if (access >= 4) candidates[labels[cell]!]!.push(cell);
  }
  const total = candidates.reduce((sum, cells) => sum + cells.length, 0), stride = Math.max(1, Math.ceil(total / 8192));
  const available = candidates.map(cells => cells.filter((_, index) => index % stride === 0));
  const allocated = new Uint8Array(sizes.length), closest = new Uint16Array(terrain.length).fill(65535);
  for (let slot = 0; slot < count; slot++) {
    let region = -1, regionScore = -1;
    for (let id = 1; id < available.length; id++) {
      if (!available[id]!.some(cell => closest[cell]! >= 2)) continue;
      const score = Math.floor(sizes[id]! * 1024 / (allocated[id]! + 1)) + (allocated[id] === 0 ? terrain.length * 1024 : 0);
      if (score > regionScore) { region = id; regionScore = score; }
    }
    if (region < 0) throw new Error('World has insufficient viable freshwater starting regions.');
    let selected = -1, score = -1;
    for (const cell of available[region]!) {
      if (closest[cell]! < 2) continue;
      const value = Math.min(1000, closest[cell]!) * 128 + fertility[cell]! * 2 - freshwater[cell]! * 12 + (mix(world.seed ^ cell ^ 0x35535441) & 15);
      if (value > score) { score = value; selected = cell; }
    }
    world.starts.push(selected); allocated[region] = allocated[region]! + 1;
    for (const cells of available) for (const cell of cells) closest[cell] = Math.min(closest[cell]!, hexDistance(selected, cell, width));
  }
  for (const start of world.starts) {
    terrain[start] = TERRAIN.plains; fertility[start] = Math.max(75, fertility[start]!);
    let food = -1;
    adjacent(start, width, height, next => { if (food < 0 && isPassable(terrain[next]!)) food = next; });
    if (food >= 0) { terrain[food] = TERRAIN.plains; fertility[food] = Math.max(70, fertility[food]!); }
  }
}

/** Generator8 seats: realms are apportioned to landmasses by passable area
 * (D'Hondt), so shared continents host most of them. Landmasses smaller than 40%
 * of one realm's share host none unless nothing else fits. Except on Islands and
 * Archipelago, a realm is never alone on its landmass while another landmass holds
 * three or more. Each seat then takes the viable freshwater cell farthest from
 * every earlier start. O(seats × sampled candidates), with at most 8192 samples. */
function placeV8Starts(world: World, count: number): void {
  const { width, height, terrain, fertility } = world, { labels, sizes } = components(world, true);
  const freshwater = new Uint8Array(terrain.length).fill(255), queue = new Int32Array(terrain.length);
  let head = 0, tail = 0;
  for (let cell = 0; cell < terrain.length; cell++) if (riverSize(world.hydrology[cell]!) || isLake(world.hydrology[cell]!) ||
    (isPassable(terrain[cell]!) && (naturalFeatures(world, cell) & FEATURE.spring))) { freshwater[cell] = 0; queue[tail++] = cell; }
  while (head < tail) {
    const cell = queue[head++]!; if (freshwater[cell]! >= 3) continue;
    adjacent(cell, width, height, next => { if (isPassable(terrain[next]!) && freshwater[next] === 255) { freshwater[next] = freshwater[cell]! + 1; queue[tail++] = next; } });
  }
  const candidates: number[][] = sizes.map(() => []);
  for (let cell = 0; cell < terrain.length; cell++) {
    if (!labels[cell] || sizes[labels[cell]!]! < 24 || freshwater[cell]! > 3) continue;
    let access = 0; adjacent(cell, width, height, next => { if (labels[next] === labels[cell]) access++; });
    if (access >= 4) candidates[labels[cell]!]!.push(cell);
  }
  const total = candidates.reduce((sum, cells) => sum + cells.length, 0), stride = Math.max(1, Math.ceil(total / 8192));
  const available = candidates.map(cells => cells.filter((_, index) => index % stride === 0));
  const regions = available.flatMap((cells, id) => cells.length ? [id] : []);
  const land = regions.reduce((sum, id) => sum + sizes[id]!, 0), threshold = Math.max(24, Math.floor(land * 2 / 5 / count));
  const eligible = regions.filter(id => sizes[id]! >= threshold);
  const seats = new Uint16Array(sizes.length), naval = world.layout === 'islands' || world.layout === 'archipelago';
  const award = (from: readonly number[]) => {
    let best = -1;
    for (const id of from) if (best < 0 || sizes[id]! * (seats[best]! + 1) > sizes[best]! * (seats[id]! + 1)) best = id;
    if (best >= 0) seats[best] = seats[best]! + 1;
  };
  for (let seat = 0; seat < count; seat++) award(eligible);
  for (let pass = 0; !naval && count > 1 && pass < count; pass++) {
    const lonely = eligible.filter(id => seats[id] === 1).sort((a, b) => sizes[a]! - sizes[b]! || a - b)[0];
    if (lonely === undefined) break;
    const donor = eligible.reduce((best, id) => seats[id]! > seats[best]! || seats[id] === seats[best] && sizes[id]! > sizes[best]! ? id : best, lonely);
    if (seats[donor]! >= 3) { seats[donor] = seats[donor]! - 1; seats[lonely] = 2; continue; }
    seats[lonely] = 0; award(eligible.filter(id => seats[id]! > 0));
  }
  const placed = new Uint16Array(sizes.length), closest = new Uint16Array(terrain.length).fill(65535);
  const bestIn = (ids: readonly number[]) => {
    let selected = -1, score = -1;
    for (const id of ids) for (const cell of available[id]!) {
      if (closest[cell]! < 2) continue;
      const value = Math.min(1000, closest[cell]!) * 128 + fertility[cell]! * 2 - freshwater[cell]! * 12 + (mix(world.seed ^ cell ^ 0x38535441) & 15);
      if (value > score) { score = value; selected = cell; }
    }
    return selected;
  };
  for (let slot = 0; slot < count; slot++) {
    // The proportionally least-filled landmass seats next; ties favour the larger.
    let region = -1;
    for (const id of eligible) {
      if (placed[id]! >= seats[id]!) continue;
      const mine = region < 0 ? 1 : (seats[id]! - placed[id]!) * seats[region]!, theirs = region < 0 ? 0 : (seats[region]! - placed[region]!) * seats[id]!;
      if (mine > theirs || mine === theirs && sizes[id]! > sizes[region]!) region = id;
    }
    let selected = region >= 0 ? bestIn([region]) : -1;
    if (selected < 0) selected = bestIn(eligible);
    if (selected < 0) selected = bestIn(regions);
    if (selected < 0) throw new Error('World has insufficient viable freshwater starting regions.');
    world.starts.push(selected); placed[labels[selected]!] = placed[labels[selected]!]! + 1;
    for (const cells of available) for (const cell of cells) closest[cell] = Math.min(closest[cell]!, hexDistance(selected, cell, width));
  }
  for (const start of world.starts) {
    terrain[start] = TERRAIN.plains; fertility[start] = Math.max(75, fertility[start]!);
    let food = -1;
    adjacent(start, width, height, next => { if (food < 0 && isPassable(terrain[next]!)) food = next; });
    if (food >= 0) { terrain[food] = TERRAIN.plains; fertility[food] = Math.max(70, fertility[food]!); }
  }
}

function generateModern(seed: number, size: MapSize, factionCount: number, layout: Layout, generatorVersion: 5 | 6 | 7 | 8): World {
  const { width, height } = mapDimensions(size, generatorVersion), count = width * height;
  const world: World = { seed: seed >>> 0, width, height, generatorVersion, layout, terrain: new Uint8Array(count), fertility: new Uint8Array(count),
    biome: new Uint8Array(count), waterDepth: new Uint8Array(count), hydrology: new Uint8Array(count), starts: [] };
  const relief = createRelief(world), { parent, flow, lake } = drainage(world, relief);
  // Small still represents a continental world: do not turn every short coastal
  // catchment into a displayed brook. Tiny intentionally retains its test-scale network.
  const threshold = Math.max(width < 100 ? 36 : 200, Math.floor(count / 500));
  const river = new Uint8Array(count);
  for (let cell = 0; cell < count; cell++) if (relief.elevation[cell] && !lake[cell] && flow[cell]! >= threshold) {
    const major = generatorVersion === 5 ? 12 : layout === 'archipelago' ? 4 : layout === 'islands' ? 6 : 8;
    const medium = generatorVersion === 5 ? 4 : layout === 'archipelago' ? 2 : 3;
    river[cell] = flow[cell]! >= threshold * major ? 3 : flow[cell]! >= threshold * medium ? 2 : 1;
  }
  // Even a small upland lake has a real persistent outlet to sea, not a dead end.
  for (let cell = 0; cell < count; cell++) if (lake[cell]) {
    let next = parent[cell]!;
    while (next >= 0 && relief.elevation[next] && !lake[next] && !river[next]) { river[next] = 1; next = parent[next]!; }
  }
  for (let cell = 0; cell < count; cell++) {
    if (!relief.elevation[cell]) continue;
    if (lake[cell]) world.hydrology[cell] = LAKE_BIT;
    else {
      const upland = relief.elevation[cell]!, rain = relief.rainfall[cell]!;
      world.terrain[cell] = upland >= 2350 ? TERRAIN.mountain : upland >= 1500 ? TERRAIN.hills : rain >= 8 ? TERRAIN.forest : TERRAIN.plains;
      if (world.terrain[cell] !== TERRAIN.mountain) world.fertility[cell] = clamp(54 + rain * 3 - (world.terrain[cell] === TERRAIN.hills ? 25 : 0) + (river[cell] ? 8 : 0), 20, 100);
      world.hydrology[cell] = river[cell]! << 3;
    }
    if (lake[cell] || river[cell]) adjacent(cell, width, height, (next, direction) => { if (next === parent[cell]) world.hydrology[cell] = world.hydrology[cell]! | direction; });
  }
  world.waterDepth = deriveWaterDepth(width, height, world.terrain);
  // Lakes are inland fresh water, not deep-ocean access gates regardless of basin width.
  for (let cell = 0; cell < count; cell++) if (lake[cell]) world.waterDepth[cell] = 1;
  if (generatorVersion >= 8) placeV8Starts(world, factionCount); else placeModernStarts(world, factionCount);
  world.biome = generatorVersion >= 8 ? deriveV6Biomes(world, relief.elevation, { latitudeBands: layout === 'earthlike' })
    : generatorVersion >= 6 ? deriveV6Biomes(world, relief.elevation) : deriveBiomes(world.seed, width, height, world.terrain, 4);
  validateHydrology(world);
  return world;
}

/** The played generator5 retains its original exact physical and biome branch. */
export function generateV5(seed: number, size: MapSize, factionCount: number, layout: Layout): World {
  return generateModern(seed, size, factionCount, layout, 5);
}
export function generateV6(seed: number, size: MapSize, factionCount: number, layout: Layout): World {
  return generateModern(seed, size, factionCount, layout, 6);
}
export function generateV7(seed: number, size: MapSize, factionCount: number, layout: Layout): World {
  return generateModern(seed, size, factionCount, layout, 7);
}
/** Civilization-scale generator8: smaller maps, seven layouts, area-apportioned starts. */
export function generateV8(seed: number, size: MapSize, factionCount: number, layout: Layout): World {
  return generateModern(seed, size, factionCount, layout, 8);
}

/** Explicit diagnostic regeneration only; never called by per-cell simulation/UI reads. */
export function inspectV6Climate(world: World) {
  if (world.generatorVersion !== 6 || world.layout === 'legacy') throw new RangeError('Climate6 diagnostics require a generator6 world.');
  const { elevation } = createRelief(world);
  return { ...deriveV6Climate(world, elevation), elevation };
}

/** New-version diagnostic only; retained version6 relief is never reinterpreted. */
export function inspectV7Climate(world: World) {
  if (world.generatorVersion !== 7 || world.layout === 'legacy') throw new RangeError('Climate7 diagnostics require a generator7 world.');
  const { elevation, inlandSeaCarvings } = createRelief(world);
  return { ...deriveV6Climate(world, elevation), elevation, inlandSeaCarvings: inlandSeaCarvings ?? [] };
}

/** Generator8 diagnostic regeneration, including the Earth-like zonal climate. */
export function inspectV8Climate(world: World) {
  if (world.generatorVersion !== 8 || world.layout === 'legacy') throw new RangeError('Climate8 diagnostics require a generator8 world.');
  const { elevation, inlandSeaCarvings } = createRelief(world);
  return { ...deriveV6Climate(world, elevation, { latitudeBands: world.layout === 'earthlike' }), elevation, inlandSeaCarvings: inlandSeaCarvings ?? [] };
}

/** Detached generation diagnostics. Counts do not confer discoveries or ownership. */
export function describeGeography(world: World) {
  validateHydrology(world);
  const land = components(world, false), passable = components(world, true), mountain = components(world, false, true), count = world.terrain.length;
  let rivers = 0, lakes = 0, lakeBodies = 0, coast = 0, mountains = 0;
  const seen = new Uint8Array(count), queue = new Int32Array(count);
  for (let cell = 0; cell < count; cell++) {
    if (riverSize(world.hydrology[cell]!)) rivers++;
    if (world.terrain[cell] === TERRAIN.mountain) mountains++;
    if (world.terrain[cell] !== 0) { let edge = false; adjacent(cell, world.width, world.height, next => { if (world.terrain[next] === 0 && !isLake(world.hydrology[next]!)) edge = true; }); if (edge) coast++; }
    if (!isLake(world.hydrology[cell]!)) continue;
    lakes++;
    if (seen[cell]) continue;
    lakeBodies++; let head = 0, tail = 1; queue[0] = cell; seen[cell] = 1;
    while (head < tail) adjacent(queue[head++]!, world.width, world.height, next => { if (isLake(world.hydrology[next]!) && !seen[next]) { seen[next] = 1; queue[tail++] = next; } });
  }
  const enclosedWater: number[] = [];
  for (let origin = 0; origin < count; origin++) {
    if (world.terrain[origin] !== 0 || seen[origin]) continue;
    let head = 0, tail = 1, edge = false; queue[0] = origin; seen[origin] = 1;
    while (head < tail) {
      const cell = queue[head++]!, x = cell % world.width, y = Math.floor(cell / world.width);
      if (x === 0 || y === 0 || x === world.width - 1 || y === world.height - 1) edge = true;
      adjacent(cell, world.width, world.height, next => { if (world.terrain[next] === 0 && !seen[next]) { seen[next] = 1; queue[tail++] = next; } });
    }
    if (!edge) enclosedWater.push(tail);
  }
  const freshWithin3 = (start: number) => {
    const nearby = new Set([start]), queue = [{ cell: start, distance: 0 }];
    for (let index = 0; index < queue.length; index++) {
      const { cell, distance } = queue[index]!;
      if (riverSize(world.hydrology[cell]!) || isLake(world.hydrology[cell]!) || (isPassable(world.terrain[cell]!) && (naturalFeatures(world, cell) & FEATURE.spring))) return true;
      if (distance === 3) continue;
      adjacent(cell, world.width, world.height, next => {
        if (!nearby.has(next) && (isPassable(world.terrain[next]!) || isLake(world.hydrology[next]!) || riverSize(world.hydrology[next]!))) {
          nearby.add(next); queue.push({ cell: next, distance: distance + 1 });
        }
      });
    }
    return false;
  };
  return { cells: count, layout: world.layout, landCells: land.sizes.reduce((sum, size) => sum + size, 0),
    landComponents: land.sizes.slice(1).sort((a, b) => b - a), meaningfulLandmasses: land.sizes.filter(size => size >= Math.max(24, Math.floor(count / 1000))).length,
    coastalLandCells: coast, mountainCells: mountains, mountainChains: mountain.sizes.slice(1).sort((a, b) => b - a),
    riverCells: rivers, lakeCells: lakes, lakeBodies, inlandWaterBodies: enclosedWater.sort((a, b) => b - a),
    inlandSeaBodies: enclosedWater.filter(size => size >= Math.max(24, Math.floor(count / 1000))).length,
    startComponents: new Set(world.starts.map(cell => passable.labels[cell])).size,
    startingRegions: world.starts.map(cell => ({ cell, passableCells: passable.sizes[passable.labels[cell]!]!, freshwaterWithin3: freshWithin3(cell) })),
    canonicalBufferBytes: world.terrain.byteLength + world.biome.byteLength + world.fertility.byteLength + world.waterDepth.byteLength + world.hydrology.byteLength };
}
