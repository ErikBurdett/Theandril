/** Immutable native preparation for the five existing civic buildings. Never generates or approves art. */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheKey, cropImage, decodePng, encodePng, normalizePalette, paletteSchema, parseAssetManifest, safeAssetPath, sha256, type ImageRect, type RgbaImage } from '../packages/art-pipeline/src/index';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = 'assets/art/source/hearth-civic';
const ids = ['granary', 'workshop', 'market', 'archive', 'harbor'].map(id => `building.${id}`);
type Source = { id: string; sourcePath: string; sourceHash: string; prompt: string; provider: string; model: string; version: number; seed: null; generatedAt: string };
const json = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
async function existing(path: string): Promise<Buffer | null> {
  try { return await readFile(await safeAssetPath(root, path)); }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null; throw error; }
}
function bounds(image: RgbaImage): ImageRect {
  let left = image.width, top = image.height, right = -1, bottom = -1, transparent = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const alpha = image.data[(y * image.width + x) * 4 + 3]!;
    if (alpha === 0) transparent++;
    if (alpha < 128) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < 0 || transparent < image.width * image.height / 10) throw new Error('Source requires a visible sprite and genuine transparent margins.');
  if (left === 0 || top === 0 || right === image.width - 1 || bottom === image.height - 1) throw new Error('Clipped source silhouette; regenerate before fitting.');
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}
const palette = paletteSchema.parse(JSON.parse((await readFile(resolve(root, 'assets/palettes/theandril-master.json'))).toString('utf8')));
const sources: Source[] = JSON.parse((await readFile(resolve(root, directory, 'generation.json'))).toString('utf8'));
if (!Array.isArray(sources) || sources.length !== 5 || new Set(sources.map(source => source.id)).size !== 5 || sources.some(source => !ids.includes(source.id))) throw new Error('Exactly the five canonical researched civic building sources are required.');
const selected = process.argv.find(arg => arg.startsWith('--id='))?.slice(5), prepare = process.argv.includes('--prepare');
if (selected && !ids.includes(selected)) throw new Error('Unknown civic building ID.');
const toolHash = sha256(await readFile(fileURLToPath(import.meta.url)));
const writes: { path: string; bytes: Buffer }[] = [];
const results: unknown[] = [];
for (const source of sources.filter(source => !selected || source.id === selected)) {
  if (source.version !== 1 || source.sourcePath !== `${directory}/${source.id}-v1.png` || source.provider !== 'codex-imagegen' || !source.prompt || !source.model || source.seed !== null || !Number.isFinite(Date.parse(source.generatedAt))) throw new Error(`Invalid retained source metadata: ${source.id}`);
  const originalPath = await safeAssetPath(root, source.sourcePath), info = await stat(originalPath);
  if (!info.isFile() || info.size > 64 * 1024 * 1024) throw new Error('Original source exceeds the import budget.');
  const original = await readFile(originalPath);
  if (sha256(original) !== source.sourceHash) throw new Error(`Source hash mismatch: ${source.id}`);
  const image = decodePng(original), crop = bounds(image), cropped = cropImage(image, crop);
  const frame: RgbaImage = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4) };
  const ratio = Math.min(56 / crop.w, 44 / crop.h), width = Math.max(1, Math.floor(crop.w * ratio)), height = Math.max(1, Math.floor(crop.h * ratio));
  const left = Math.floor((64 - width) / 2), top = 48 - height;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.min(cropped.width - 1, Math.floor((x + .5) * cropped.width / width)), sy = Math.min(cropped.height - 1, Math.floor((y + .5) * cropped.height / height));
    const from = (sy * cropped.width + sx) * 4;
    frame.data.set(cropped.data.subarray(from, from + 4), ((top + y) * 64 + left + x) * 4);
  }
  const png = Buffer.from(encodePng(normalizePalette(frame, palette, { alphaThreshold: 128 }).image));
  const nativePath = `assets/art/source/native/${source.id}/v1/idle-se-0.png`, recordPath = `${directory}/${source.id}-v1.json`;
  const contract = { nativeResolution: { width: 64, height: 64 }, pivot: [32, 48], visibleFit: [width, height], offset: [left, top] };
  const record = { schemaVersion: 1, ...source, sourceSize: [image.width, image.height], crop, ...contract, nativePath, nativeHash: sha256(png), toolHash, paletteHash: cacheKey(palette), method: 'nearest-pixel-center-alpha128', note: 'One independent original from the built-in image tool. Full source silhouette retained; native fitting and palette enforcement are candidate preparation, not visual approval.' };
  const recordBytes = json(record);
  const brief = parseAssetManifest({ schemaVersion: 1, id: source.id, type: 'map-object', status: 'BRIEF_READY', version: 1,
    nativeResolution: contract.nativeResolution, paletteId: palette.id, contentIds: [source.id], prompt: source.prompt,
    frames: [{ id: `${source.id}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: contract.pivot, sourcePath: nativePath }],
    animation: { states: { idle: { frames: 1, fps: 4, loop: false } } },
    provenance: { provider: source.provider, model: source.model, promptHash: sha256(source.prompt), sourceRefs: [source.sourcePath, recordPath], licenseNotes: ['Original built-in image generation commissioned for Theandril; no third-party artwork used. Service terms apply; model and seed are not exposed by the tool and no independent rights guarantee is inferred.'] },
    createdAt: source.generatedAt, referenceHashes: [source.sourceHash, sha256(recordBytes)],
    processing: [{ tool: 'theandril-hearth-civic-extraction', version: '1', profile: 'registered-map-prop-64', settingsHash: cacheKey({ crop, contract, toolHash, paletteHash: cacheKey(palette), method: record.method }), inputHash: source.sourceHash, outputHash: sha256(png) }],
    validation: null, review: null, constraints: { transparentPadding: 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 0, requireMotion: false, terrain: 'none' },
  });
  const planned = [{ path: nativePath, bytes: png }, { path: recordPath, bytes: recordBytes }, { path: `${directory}/${source.id}-v1.brief.json`, bytes: json(brief) }, { path: `assets/art/briefs/${source.id}.json`, bytes: json(brief) }];
  const pending = [];
  for (const item of planned) {
    const prior = await existing(item.path);
    if (prior && !prior.equals(item.bytes)) throw new Error(`Immutable preparation conflict: ${item.path}. Retain reviewed inputs; create a versioned revision workflow before changing this source.`);
    if (!prior) pending.push(item);
  }
  if (pending.length && await existing(`assets/art/approved/${source.id}.json`)) throw new Error(`Approved inputs are sealed: ${source.id}`);
  writes.push(...pending);
  results.push({ id: source.id, sourceSize: [image.width, image.height], crop, ...contract, nativeHash: sha256(png), newFiles: pending.length, prepared: prepare, approved: false });
}
if (prepare) for (const item of writes) {
  const path = await safeAssetPath(root, item.path); await mkdir(dirname(path), { recursive: true }); await writeFile(path, item.bytes, { flag: 'wx' });
}
for (const result of results) console.log(JSON.stringify(result));
