/** Reproducible extraction of the commissioned foundation sheets. Never grants approval. */
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng, cropImage, normalizePalette, paletteSchema, parseAssetManifest, sha256, cacheKey, insideHex, type RgbaImage, type AssetManifest } from '../packages/art-pipeline/src/index';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const palette = paletteSchema.parse(JSON.parse(await readFile(resolve(root, 'assets/palettes/theandril-master.json'), 'utf8')));
const generation = JSON.parse(await readFile(resolve(root, 'assets/art/source/generation-prompts.json'), 'utf8')) as { prompts: Record<string, string>; licenseNotes: string[] };
const revisions = JSON.parse(await readFile(resolve(root, 'assets/art/source/revisions.json'), 'utf8')) as Record<string, { version: number; source: string; prompt: string }>;
const createdAt = '2026-09-05T00:00:00.000Z';
async function save(path: string, bytes: string | Uint8Array) { await mkdir(dirname(resolve(root, path)), { recursive: true }); await writeFile(resolve(root, path), bytes); }
type Bounds = { x: number; y: number; w: number; h: number };
function bounds(image: RgbaImage): Bounds {
  let x = image.width, y = image.height, right = -1, bottom = -1;
  for (let row = 0; row < image.height; row++) for (let col = 0; col < image.width; col++) if (image.data[(row * image.width + col) * 4 + 3]! >= 128) {
    x = Math.min(x, col); y = Math.min(y, row); right = Math.max(right, col); bottom = Math.max(bottom, row);
  }
  if (right < 0) throw new Error('Empty generated source frame');
  return { x, y, w: right - x + 1, h: bottom - y + 1 };
}
function groundY(type: AssetManifest['type'], size: number): number { return type === 'terrain' ? size / 2 : type === 'map-object' || type === 'settlement' || size > 64 ? size - 16 : size - 8; }
function fit(image: RgbaImage, crop: Bounds, size: number, terrain: boolean, baseline = size - 8): RgbaImage {
  const result = { width: size, height: size, data: new Uint8Array(size * size * 4) };
  const scale = Math.min((size - 8) / crop.w, (baseline - 4) / crop.h);
  const w = terrain ? size * .875 : Math.floor(crop.w * scale), h = terrain ? size : Math.floor(crop.h * scale);
  const left = Math.floor((size - w) / 2), top = terrain ? 0 : baseline - h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(image.width - 1, crop.x + Math.floor((x + .5) * crop.w / w));
    const sy = Math.min(image.height - 1, crop.y + Math.floor((y + .5) * crop.h / h));
    result.data.set(image.data.subarray((sy * image.width + sx) * 4, (sy * image.width + sx) * 4 + 4), ((top + y) * size + left + x) * 4);
  }
  if (terrain) {
    // Canonical ground mask, not world geography. Fill only source-edge pinholes from the nearest interior pixel.
    const original = result.data.slice();
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const at = (y * size + x) * 4;
      if (!insideHex(x, y, size, size)) { result.data.fill(0, at, at + 4); continue; }
      if (original[at + 3]! < 128) {
        let found = false;
        for (let radius = 1; radius < size && !found; radius++) for (let dy = -radius; dy <= radius && !found; dy++) for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          const source = (ny * size + nx) * 4;
          if (original[source + 3]! >= 128) { result.data.set(original.subarray(source, source + 4), at); found = true; break; }
        }
      }
      result.data[at + 3] = 255;
    }
  }
  return normalizePalette(result, palette).image;
}
const manifests: AssetManifest[] = [];
async function emit(id: string, type: AssetManifest['type'], images: RgbaImage[], prompt: string, source: string, native: number, provider = 'codex-imagegen', version = 1) {
  const nativePaths: string[] = [];
  for (let index = 0; index < images.length; index++) {
    const path = `assets/art/source/native/${id}/idle-se-${index}.png`;
    await save(path, encodePng(images[index]!)); nativePaths.push(path);
  }
  const manifest = parseAssetManifest({
    schemaVersion: 1, id, type, status: 'BRIEF_READY', version, nativeResolution: { width: native, height: native }, paletteId: palette.id, contentIds: [id], prompt,
    frames: nativePaths.map((sourcePath, index) => ({ id: `${id}/idle/se/${index}`, direction: 'se', state: 'idle', index, durationMs: 250, pivot: [native / 2, groundY(type, native)], sourcePath })),
    animation: { states: { idle: { frames: images.length, fps: 4, loop: images.length > 1 } } },
    provenance: { provider, model: provider === 'codex-imagegen' ? 'not-exposed-by-tool' : 'integer-overlay-v1', promptHash: sha256(prompt), sourceRefs: [source, version > 1 ? 'assets/art/source/revisions.json' : 'assets/art/source/generation-prompts.json'], licenseNotes: generation.licenseNotes },
    createdAt, referenceHashes: [sha256(await readFile(resolve(root, source)))],
    processing: [{ tool: 'theandril-native-extraction', version: '1', profile: type === 'terrain' ? 'pointy-hex64' : `registered-${native}`, settingsHash: cacheKey({ method: 'nearest-pixel-center', alphaThreshold: 128, palette, scriptHash: sha256(await readFile(fileURLToPath(import.meta.url))) }), inputHash: sha256(await readFile(resolve(root, source))), outputHash: cacheKey(images.map(image => sha256(encodePng(image)))) }],
    validation: null, review: null,
    constraints: { transparentPadding: type === 'terrain' ? 0 : 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 16, requireMotion: images.length > 1, terrain: type === 'terrain' ? 'hex' : 'none' },
  });
  await save(`assets/art/briefs/${id}.json`, JSON.stringify(manifest, null, 2) + '\n'); manifests.push(manifest);
}

const units = decodePng(await readFile(resolve(root, 'assets/art/source/units-original.png')));
for (const [row, id] of ['unit.guard', 'unit.scout', 'unit.colonist'].entries()) {
  const cells = Array.from({ length: 4 }, (_, col) => cropImage(units, { x: col * units.width / 4, y: row * units.height / 3, w: units.width / 4, h: units.height / 3 }));
  const boxes = cells.map(bounds), x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  const union = { x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y };
  await emit(id, 'unit', cells.map(cell => fit(cell, union, 64, false)), generation.prompts.units!, 'assets/art/source/units-original.png', 64);
}
const groups: { file: string; columns: number; rows: number; entries: [string, AssetManifest['type'], number][]; prompt: string }[] = [
  { file: 'objects', columns: 3, rows: 2, prompt: 'objects', entries: [['settlement.village', 'settlement', 96], ['settlement.town', 'settlement', 96], ['settlement.city', 'settlement', 128], ['map.ruin', 'map-object', 64], ['map.watchtower', 'map-object', 64], ['map.resource', 'map-object', 64]] },
  { file: 'terrain', columns: 4, rows: 3, prompt: 'terrain', entries: ['grassland', 'temperate_forest', 'taiga', 'tundra', 'desert', 'steppe', 'marsh', 'rainforest', 'alpine', 'ocean', 'hills', 'coast'].map(id => [`terrain.${id}`, 'terrain', 64]) },
  { file: 'roster', columns: 4, rows: 2, prompt: 'roster', entries: [['unit.spearman', 'unit', 64], ['unit.heavy_infantry', 'unit', 64], ['unit.cavalry', 'unit', 96], ['unit.mage', 'unit', 64], ['unit.commander', 'unit', 64], ['monster.revenant', 'monster', 64], ['monster.quarry_ogre', 'monster', 96], ['monster.slateback', 'monster', 128]] },
];
for (const group of groups) {
  const path = `assets/art/source/${group.file}-original.png`, source = decodePng(await readFile(resolve(root, path)));
  for (const [index, [id, type, native]] of group.entries.entries()) {
    const revision = revisions[id];
    if (revision) {
      const image = decodePng(await readFile(resolve(root, revision.source)));
      await emit(id, type, [fit(image, bounds(image), native, type === 'terrain', groundY(type, native))], revision.prompt, revision.source, native, 'codex-imagegen', revision.version);
      continue;
    }
    const x = Math.floor(index % group.columns * source.width / group.columns), y = Math.floor(Math.floor(index / group.columns) * source.height / group.rows);
    const cell = cropImage(source, { x, y, w: Math.floor(source.width / group.columns), h: Math.floor(source.height / group.rows) });
    await emit(id, type, [fit(cell, bounds(cell), native, type === 'terrain', groundY(type, native))], generation.prompts[group.prompt]!, path, native);
  }
}
const expectedOverlays = ['terrain.river', 'terrain.road', 'terrain.transitions', 'effect.selection', 'effect.movement', 'effect.melee', 'effect.projectile', 'effect.magic'];
const registered = new Set((await readdir(resolve(root, 'assets/art/briefs'))).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5)));
await save('assets/art/foundation-index.json', JSON.stringify({ schemaVersion: 1, assets: [...manifests.map(asset => asset.id), ...expectedOverlays.filter(id => registered.has(id))].sort(), missing: expectedOverlays.filter(id => !registered.has(id)), note: 'Brief extraction is not approval. Overlay briefs are prepared separately with art:overlays. Future roster/map-object/effect assets have no canonical gameplay consumers yet; this index does not claim full directional or biome-transition coverage.' }, null, 2) + '\n');
console.log(`Prepared ${manifests.length} source-backed briefs; no approvals granted.`);
