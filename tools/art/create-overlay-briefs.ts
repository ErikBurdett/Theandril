/** Original integer-pixel overlays. Builds source/briefs only; never validates an approval into existence. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheKey, encodePng, insideHex, paletteSchema, parseAssetManifest, sha256, validateAsset, type AssetManifest, type RgbaImage } from '../../packages/art-pipeline/src/index';

type Point = readonly [number, number];
type Overlay = { id: string; type: 'effect' | 'terrain'; prompt: string; frames: RgbaImage[]; durationMs: number; loop: boolean };
const SIZE = 64;
const C = { edge: '#28272d', shadow: '#544938', earth: '#63513b', soil: '#8e7550', dust: '#b9a174', gold: '#ccb36b', light: '#efe2b0', waterDark: '#142733', water: '#234353', waterLight: '#396574', foam: '#659093', grassDark: '#2c4931', grass: '#4d6540', grassLight: '#7c8850', emberDark: '#642f26', ember: '#d67e35', emberLight: '#f2bc60', runeDark: '#322d50', rune: '#56527c', runeLight: '#8c84aa', runeBright: '#beb7d0' } as const;
const blank = (): RgbaImage => ({ width: SIZE, height: SIZE, data: new Uint8Array(SIZE * SIZE * 4) });
function pixel(image: RgbaImage, x: number, y: number, color: string): void {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error('Overlay coordinates must be integers');
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  image.data.set([Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16), 255], (y * SIZE + x) * 4);
}
function line(image: RgbaImage, start: Point, end: Point, color: string, radius = 0): void {
  let [x, y] = start;
  const dx = Math.abs(end[0] - x), sx = x < end[0] ? 1 : -1, dy = -Math.abs(end[1] - y), sy = y < end[1] ? 1 : -1;
  let error = dx + dy;
  while (true) {
    for (let oy = -radius; oy <= radius; oy++) for (let ox = -radius; ox <= radius; ox++) pixel(image, x + ox, y + oy, color);
    if (x === end[0] && y === end[1]) break;
    const doubled = error * 2;
    if (doubled >= dy) { error += dy; x += sx; }
    if (doubled <= dx) { error += dx; y += sy; }
  }
}
function path(image: RgbaImage, points: readonly Point[], color: string, radius = 0, closed = false): void {
  for (let index = 1; index < points.length; index++) line(image, points[index - 1]!, points[index]!, color, radius);
  if (closed) line(image, points.at(-1)!, points[0]!, color, radius);
}
function diamond(image: RgbaImage, x: number, y: number, radius: number, color: string): void {
  for (let oy = -radius; oy <= radius; oy++) for (let ox = -radius + Math.abs(oy); ox <= radius - Math.abs(oy); ox++) pixel(image, x + ox, y + oy, color);
}
function hexMask(image: RgbaImage): RgbaImage {
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!insideHex(x, y, SIZE, SIZE)) image.data.fill(0, (y * SIZE + x) * 4, (y * SIZE + x) * 4 + 4);
  return image;
}

export function buildOverlays(): Overlay[] {
  const selection = blank(), outline: Point[] = [[32, 5], [55, 18], [55, 45], [32, 58], [9, 45], [9, 18]];
  path(selection, outline, C.edge, 1, true); path(selection, outline, C.gold, 0, true);
  for (const [x, y] of [[32, 5], [55, 31], [32, 58], [9, 31]] as Point[]) { diamond(selection, x, y, 2, C.edge); diamond(selection, x, y, 1, C.light); }
  const movement = blank();
  path(movement, [[22, 40], [32, 45], [42, 40]], C.edge, 2); path(movement, [[22, 40], [32, 45], [42, 40]], C.gold, 0);
  path(movement, [[20, 29], [32, 21], [44, 29]], C.edge, 2); path(movement, [[20, 29], [32, 21], [44, 29]], C.light, 0);
  line(movement, [32, 22], [32, 36], C.edge, 2); line(movement, [32, 22], [32, 36], C.gold, 0); diamond(movement, 32, 36, 1, C.light);
  const melee = Array.from({ length: 4 }, (_, frame) => {
    const image = blank(), arcs: Point[][] = [[[17, 38], [21, 30], [26, 25]], [[18, 37], [24, 27], [34, 21], [43, 23]], [[23, 36], [31, 27], [43, 25], [48, 29]], [[34, 32], [42, 29], [47, 31]]];
    path(image, arcs[frame]!, C.emberDark, 2); path(image, arcs[frame]!, C.ember, 1); path(image, arcs[frame]!.slice(0, -1), C.emberLight);
    if (frame === 1 || frame === 2) {
      const reach = frame === 1 ? 4 : 8;
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) line(image, [35 + dx! * 4, 32 + dy! * 3], [35 + dx! * reach, 32 + dy! * reach], C.emberLight);
      diamond(image, 35, 32, frame === 1 ? 3 : 1, C.light);
    }
    return image;
  });
  const projectile = Array.from({ length: 4 }, (_, frame) => {
    const image = blank();
    if (frame < 2) {
      const tip: Point = frame === 0 ? [27, 37] : [32, 32], tail: Point = [tip[0] - 13, tip[1] + 13];
      line(image, tail, tip, C.edge, 1); line(image, tail, tip, C.dust);
      const head: Point[] = [tip, [tip[0] - 1, tip[1] + 5], [tip[0] - 5, tip[1] + 1]];
      path(image, head, C.edge, 1, true); path(image, head, C.light, 0, true);
      path(image, [[tail[0] - 2, tail[1] - 4], tail, [tail[0] + 4, tail[1] + 2]], C.gold);
      if (frame === 1) {
        diamond(image, 32, 32, 4, C.shadow); diamond(image, 32, 32, 2, C.light);
        line(image, [34, 27], [36, 24], C.gold); line(image, [37, 33], [41, 34], C.dust);
        line(image, [28, 29], [25, 26], C.gold);
      }
    } else if (frame === 2) {
      // Broken shaft pieces disperse from the fixed impact, not a translated arrow icon.
      for (const [start, end] of [[[20, 38], [25, 35]], [[28, 27], [26, 23]], [[36, 26], [39, 23]], [[39, 35], [44, 37]], [[33, 40], [34, 43]]] as [Point, Point][]) {
        line(image, start, end, C.earth, 1); line(image, start, end, C.dust);
      }
      diamond(image, 32, 32, 1, C.gold);
    } else {
      // Fade by shortening/darkening opaque clusters; no blurred or partial-alpha pixels.
      line(image, [18, 40], [20, 39], C.soil); line(image, [25, 21], [25, 22], C.earth);
      line(image, [44, 38], [46, 39], C.soil); pixel(image, 35, 46, C.earth);
    }
    return image;
  });
  const magic = Array.from({ length: 4 }, (_, frame) => {
    const image = blank(), radius = [7, 11, 16, 20][frame]!, half = Math.floor(radius / 2), center: Point = [32, 32];
    const ring: Point[] = [[32, 32 - radius], [32 + radius, 32 - half], [32 + radius, 32 + half], [32, 32 + radius], [32 - radius, 32 + half], [32 - radius, 32 - half]];
    path(image, ring, C.runeDark, 1, true); path(image, ring, frame === 3 ? C.rune : C.runeLight, 0, true);
    if (frame < 3) { diamond(image, ...center, 5 - frame, C.rune); diamond(image, ...center, 3 - frame, C.runeBright); }
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as Point[]) {
      const distance = radius - 2; diamond(image, 32 + dx * distance, 32 + dy * half, frame === 1 ? 2 : 1, frame === 3 ? C.runeLight : C.runeBright);
    }
    return image;
  });
  const road = blank();
  for (let x = 4; x < 60; x++) {
    const bend = x < 16 || x >= 48 ? 0 : x < 28 || x >= 40 ? 1 : 2;
    for (let y = 28 + bend; y <= 36 + bend; y++) pixel(road, x, y, y === 28 + bend || y === 36 + bend ? C.earth : C.soil);
    if (x % 8 < 3) { line(road, [x, 30 + bend], [x, 31 + bend], C.dust); pixel(road, x, 35 + bend, C.earth); }
  }
  const river = blank();
  for (let x = 4; x < 60; x++) {
    const bend = x < 16 || x >= 48 ? 0 : x < 24 || x >= 40 ? 1 : 2;
    for (let y = 26 + bend; y <= 38 + bend; y++) pixel(river, x, y, y === 26 + bend || y === 38 + bend ? C.waterDark : y < 29 + bend || y > 36 + bend ? C.water : C.waterLight);
    if (x % 14 < 6) pixel(river, x, 30 + bend, C.foam);
    if ((x + 6) % 17 < 5) pixel(river, x, 35 + bend, C.water);
  }
  const transitions = blank();
  for (let y = 17; y < 48; y++) {
    const inset = [3, 4, 4, 2, 2, 5, 5, 3][Math.floor(y / 3) % 8]!;
    for (let x = 60 - inset; x < 60; x++) pixel(transitions, x, y, x === 60 - inset ? C.grassDark : C.grass);
    if (y % 7 < 3) line(transitions, [57 - inset, y], [59 - inset, y], C.grassDark);
    if (y % 9 < 3) pixel(transitions, 58, y, C.grassLight);
  }
  const brief = (id: string, type: Overlay['type'], frames: RgbaImage[], prompt: string, durationMs = 250): Overlay => ({ id, type, frames, prompt, durationMs, loop: false });
  return [
    brief('effect.selection', 'effect', [selection], 'Original high-contrast brass pointy-hex selection ring, 64x64 native, center anchor 32,32. Single static idle/se presentation clip. The dark backing and pale cardinal marks must remain readable over light and dark terrain. Candidate for observed selection only; never a hit target.'),
    brief('effect.movement', 'effect', [movement], 'Original high-contrast stacked directional chevron and destination bracket, 64x64 native, center anchor 32,32. Single static idle/se clip with artwork pointing north; the se label is only the current packaging convention, not a six-facing set. Candidate destination cue for explicit observed movement only.'),
    brief('effect.melee', 'effect', melee, 'Original four-frame ember-and-iron impact arc: approach, impact flash, outward sparks, recovery fleck. Fixed impact anchor 32,32 on 64x64; 100ms per frame, one-shot idle/se packaging. Preview-only foundation: no timing or combat authority, no weapon-facing set.', 100),
    brief('effect.projectile', 'effect', projectile, 'Original four-frame projectile-hit effect: southwest approach, impact flash at 32,32, broken wooden shaft splinters, then shortened dark fading fragments. Fixed impact anchor 32,32 on 64x64; 100ms per frame, one-shot idle/se packaging. Hard alpha throughout, no duplicate poses or invented direction set. Future presentation-only foundation: canonical ranged projectile travel is not implemented and this effect never determines a hit or damage.', 100),
    brief('effect.magic', 'effect', magic, 'Original four-frame restrained violet witness-rune pulse: gather, release, expansion, dissipating outer ring. Fixed center anchor 32,32 on 64x64; 125ms per frame, one-shot idle/se packaging. Future magic visual only; does not add casting rules, spells, or magical state.', 125),
    brief('terrain.road', 'terrain', [hexMask(road)], 'Original worn ochre east-west road overlay on a transparent 64x64 pointy hex, center anchor 32,32. Equal edge-e/edge-w endpoints at x4/x59 around y32; single static idle/se packaging. One straight piece only, no turns or junctions. Future art: roads are not canonical world infrastructure and must not be drawn as existing routes.'),
    brief('terrain.river', 'terrain', [hexMask(river)], 'Original muted blue east-west river overlay with dark banks and broken reflections on transparent 64x64, center anchor 32,32. Matching edge-e/edge-w endpoints x4/x59 around y32; one static idle/se piece, no turns, mouths, bridges, or junctions. Future art only; does not invent canonical rivers.'),
    brief('terrain.transitions', 'terrain', [hexMask(transitions)], 'Original sparse moss-and-grass single east-edge transition fringe on transparent 64x64 pointy hex, anchor 32,32. One static idle/se packaging piece for edge e only (polygon vertices 1 to2); no six-edge, shared-corner, adjacency-mask or biome-pair completeness claim. Future art until a deterministic observed-neighbor transition consumer exists.'),
  ];
}

export async function createOverlayBriefs(root: string): Promise<AssetManifest[]> {
  const sourcePath = 'tools/art/create-overlay-briefs.ts', sourceHash = sha256(await readFile(resolve(root, sourcePath)));
  const palette = paletteSchema.parse(JSON.parse(await readFile(resolve(root, 'assets/palettes/theandril-master.json'), 'utf8')));
  const manifests: AssetManifest[] = [];
  for (const overlay of buildOverlays()) {
    const paths = overlay.frames.map((_, index) => `assets/art/source/native/${overlay.id}/idle-se-${index}.png`);
    const manifest = parseAssetManifest({
      schemaVersion: 1, id: overlay.id, type: overlay.type, status: 'BRIEF_READY', version: 1,
      nativeResolution: { width: SIZE, height: SIZE }, paletteId: palette.id, contentIds: [overlay.id], prompt: overlay.prompt,
      frames: paths.map((sourcePath, index) => ({ id: `${overlay.id}/idle/se/${index}`, direction: 'se', state: 'idle', index, durationMs: overlay.durationMs, pivot: [32, 32], sourcePath })),
      animation: { states: { idle: { frames: paths.length, fps: 1000 / overlay.durationMs, loop: overlay.loop } } },
      provenance: { provider: 'theandril-integer-overlay', model: 'integer-overlay-v1', promptHash: sha256(overlay.prompt), sourceRefs: [sourcePath], licenseNotes: ['Original integer-coordinate code-authored artwork for Theandril; no external bitmap references, model weights, or provider output used.', 'Source generator is retained in this repository; assets follow the project licensing policy. No third-party license rights are asserted.'] },
      createdAt: '2026-09-05T00:00:00.000Z', referenceHashes: [sourceHash],
      processing: [{ tool: 'theandril-integer-overlay', version: '1', profile: 'centered-overlay-64', settingsHash: cacheKey({ sourceHash, palette, native: SIZE, binaryAlpha: true, line: 'integer-bresenham' }), inputHash: sourceHash, outputHash: cacheKey(overlay.frames.map(image => sha256(encodePng(image)))) }],
      validation: null, review: null,
      constraints: { transparentPadding: 2, maxColors: 16, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 32, requireMotion: paths.length > 1, terrain: 'none' },
    });
    const report = validateAsset(manifest, overlay.frames.map((image, index) => ({ id: manifest.frames[index]!.id, image })), palette);
    if (!report.passed) throw new Error(`${overlay.id}: ${report.errors.join('; ')}`);
    for (const [index, image] of overlay.frames.entries()) { const output = resolve(root, paths[index]!); await mkdir(dirname(output), { recursive: true }); await writeFile(output, encodePng(image)); }
    const path = resolve(root, `assets/art/briefs/${overlay.id}.json`); await mkdir(dirname(path), { recursive: true }); await writeFile(path, JSON.stringify(manifest, null, 2) + '\n');
    manifests.push(manifest);
  }
  return manifests;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const manifests = await createOverlayBriefs(root);
  console.log(`Prepared ${manifests.length} original overlay briefs / ${manifests.reduce((sum, item) => sum + item.frames.length, 0)} actual frames; no approvals granted.`);
}
