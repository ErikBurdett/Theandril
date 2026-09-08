import { hexDistance, SeededRandom } from './index';
import { directionNeighbor } from './hydrology';

export interface ReliefPlate { x: number; y: number; rx: number; ry: number; cos: number; sin: number; phase: number }
const angles = [[1024,0],[946,392],[724,724],[392,946],[0,1024],[-392,946],[-724,724],[-946,392],[-1024,0],[-946,-392],[-724,-724],[-392,-946],[0,-1024],[392,-946],[724,-724],[946,-392]] as const;

/** Leave room for branching coasts and offshore water instead of clipping the
 * same ellipse against the world rectangle. Inputs are fresh generator plates. */
export function insetPlates(originals: readonly ReliefPlate[]): ReliefPlate[] {
  return originals.map(body => {
    const x = Math.max(144, Math.min(880, 512 + Math.floor((body.x - 512) * .90)));
    const y = Math.max(144, Math.min(880, 512 + Math.floor((body.y - 512) * .90)));
    const rx = Math.floor(body.rx * .84), ry = Math.floor(body.ry * .84);
    const bx = (body.phase & 1 ? 1 : -1) * Math.floor(rx * 650 / 1024), by = (body.phase & 2 ? 1 : -1) * Math.floor(ry * (body.phase & 4 ? 480 : 270) / 1024);
    const length = (a: number, b: number) => Math.ceil(Math.sqrt(a * a + b * b) / 1024);
    // Bound both the main oval and offset peninsula including coast variation.
    // Boundary-near bodies become smaller complete islands, not clipped tiles.
    const ex = Math.max(Math.ceil(length(rx * body.cos, ry * body.sin) * 1.25), Math.ceil(Math.abs(bx * body.cos - by * body.sin) / 1024) + length(Math.ceil(rx * .75) * body.cos, Math.ceil(ry * .67) * body.sin));
    const ey = Math.max(Math.ceil(length(rx * body.sin, ry * body.cos) * 1.25), Math.ceil(Math.abs(bx * body.sin + by * body.cos) / 1024) + length(Math.ceil(rx * .75) * body.sin, Math.ceil(ry * .67) * body.cos));
    const scale = Math.min(1024, Math.floor(Math.min(x - 24, 1000 - x) * 1024 / ex), Math.floor(Math.min(y - 24, 1000 - y) * 1024 / ey));
    return { ...body, x, y, rx: Math.max(12, Math.floor(rx * scale / 1024)), ry: Math.max(12, Math.floor(ry * scale / 1024)) };
  });
}

/** Connected unequal lobes and a deep side bay in the plate's own rotated axes.
 * This changes macro silhouettes, not merely the frequency of coastline noise. */
export function irregularEnvelope(px: number, py: number, phase: number): number {
  const sx = phase & 1 ? 1 : -1, sy = phase & 2 ? 1 : -1;
  const main = 1000 - Math.floor((px * px + py * py) / 1024);
  const bx = px - sx * 650, by = py - sy * (phase & 4 ? 480 : 270);
  const branch = 650 - Math.floor((bx * bx * 2 + by * by * (phase & 8 ? 4 : 3)) / 1024);
  const cx = px + sx * 420, cy = py - sy * 840;
  const bay = 440 - Math.floor((cx * cx * 4 + cy * cy * 2) / 1024);
  const outline = Math.max(main, branch);
  return bay > 0 ? Math.min(outline, 100 - bay * 2) : outline;
}

/** An independent stream leaves the original plates untouched. Short, tapering
 * satellite groups occupy actual offshore space, never arbitrary inland holes.
 * Fixed candidate budgets bound work even when a dense layout offers no room. */
export function offshoreSatellites(seed: number, width: number, originals: readonly ReliefPlate[]): ReliefPlate[] {
  const rng = new SeededRandom(seed ^ 0x3649534c), added: ReliefPlate[] = [];
  const wanted = width < 100 ? 4 : Math.min(20, 8 + Math.floor(width / 64));
  const small = width < 100;
  for (let group = 0; group < 48 && added.length < wanted; group++) {
    const parent = originals[rng.nextInt(originals.length)]!;
    const heading = rng.nextInt(16), firstRadius = (small ? 39 : 23) + rng.nextInt(small ? 18 : 29);
    for (let piece = 0; piece < 3 && added.length < wanted; piece++) {
      const radius = Math.max(small ? 32 : 15, Math.floor(firstRadius * (100 - piece * 22) / 100));
      const [ax, ay] = angles[(heading + piece) % 16]!;
      const gap = small ? 45 : 25, lx = Math.floor(ax * (parent.rx + radius + gap) / 1024), ly = Math.floor(ay * (parent.ry + radius + gap) / 1024);
      const x = parent.x + Math.floor((lx * parent.cos - ly * parent.sin) / 1024), y = parent.y + Math.floor((lx * parent.sin + ly * parent.cos) / 1024);
      const rx = radius, ry = Math.floor(radius * (85 + rng.nextInt(51)) / 100);
      if (x < rx + 20 || x > 1004 - rx || y < ry + 20 || y > 1004 - ry) continue;
      const fits = [...originals, ...added].every(body => {
        const dx = x - body.x, dy = y - body.y;
        const u = Math.floor((dx * body.cos + dy * body.sin) / 1024), v = Math.floor((-dx * body.sin + dy * body.cos) / 1024);
        const px = Math.floor(u * 1024 / (body.rx + rx + gap)), py = Math.floor(v * 1024 / (body.ry + ry + gap));
        return px * px + py * py > 1024 * 1024;
      });
      if (!fits) continue;
      const [cos, sin] = angles[(heading + piece + 3) % 16]!;
      added.push({ x, y, rx, ry, cos, sin, phase: rng.nextInt(1024) });
    }
  }
  return added;
}

/** Fraction0–1024: gentler shoulders around more frequent traversable saddles. */
export function spineSaddle(chosenU: number, phase: number): number {
  const at = (chosenU + 4096 + phase) % 120, distance = Math.min(at, 120 - at);
  return Math.max(0, Math.min(1024, (distance - 8) * 128));
}

/** At most three separate enclosed salt-water bodies. No forced hollow center
 * on small islands: every retained basin has a genuine enclosing land margin. */
export function carveEnclosedSeas(seed: number, width: number, height: number, maximum: number, elevation: Uint16Array, rainfall: Uint8Array): void {
  const count = width * height, distance = new Uint16Array(count).fill(65535), queue = new Int32Array(count);
  let head = 0, tail = 0;
  for (let cell = 0; cell < count; cell++) if (elevation[cell] === 0) { distance[cell] = 0; queue[tail++] = cell; }
  while (head < tail) {
    const cell = queue[head++]!;
    for (let direction = 1; direction <= 6; direction++) {
      const next = directionNeighbor(cell, width, height, direction);
      if (next !== null && distance[next] === 65535) { distance[next] = distance[cell]! + 1; queue[tail++] = next; }
    }
  }
  const chosen: { cell: number; radius: number }[] = [], rng = new SeededRandom(seed ^ 0x36534541);
  for (let basin = 0; basin < Math.min(3, maximum); basin++) {
    let center = -1;
    for (let cell = 0; cell < count; cell++) {
      if (distance[cell]! < 5 || chosen.some(other => hexDistance(other.cell, cell, width) < other.radius * 3 + 5)) continue;
      if (center < 0 || distance[cell]! > distance[center]!) center = cell;
    }
    if (center < 0) break;
    const radius = Math.max(1, Math.min(Math.floor(width / (40 + rng.nextInt(15))), Math.floor((distance[center]! - 3) / 2)));
    const cx = center % width, cy = Math.floor(center / width), sx = rng.nextInt(2) ? 1 : -1, sy = rng.nextInt(2) ? 1 : -1;
    const branchRadius = Math.max(1, Math.floor(radius * .7)), notchRadius = Math.floor(radius * .45);
    for (let y = cy - radius * 2; y <= cy + radius * 2; y++) for (let x = cx - radius * 2; x <= cx + radius * 2; x++) {
      const cell = y * width + x;
      const dx = x - cx, dy = y - cy, bx = dx - sx * Math.floor(radius * .55), by = dy - sy * Math.floor(radius * .35);
      const nx = dx + sx * Math.floor(radius * .7), ny = dy - sy * Math.floor(radius * .6);
      const body = 2 * dx * dx + 3 * dy * dy <= 2 * radius * radius || bx * bx + by * by <= branchRadius * branchRadius;
      const notch = nx * nx + ny * ny < notchRadius * notchRadius;
      if (body && !notch && hexDistance(center, cell, width) <= radius * 2) {
        elevation[cell] = 0; rainfall[cell] = 0;
      }
    }
    chosen.push({ cell: center, radius });
  }
}
