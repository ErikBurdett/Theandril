/** Single-asset built-in source preparation. Never generates, approves or publishes art. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheKey, cropImage, decodePng, encodePng, insideHex, normalizePalette, paletteSchema, parseAssetManifest, safeAssetPath, sha256, type ImageRect, type RgbaImage } from '../packages/art-pipeline/src/index';
import { factionFrameContract, fitFactionFrame, FACTION_SHEET_ROLES } from './art-factions';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metadataPath = 'assets/art/source/slice12/generation.json';
type Source = { id: string; role: string; family: string; sourcePath: string; prompt: string; provider: string; model: string; version: number };
type Palette = ReturnType<typeof paletteSchema.parse>;
const families = ['iron_covenant', 'sepulchral_synod'];
function bounds(image: RgbaImage): ImageRect {
  let left = image.width, top = image.height, right = -1, bottom = -1, transparent = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const alpha = image.data[(y * image.width + x) * 4 + 3]!;
    if (alpha === 0) transparent++;
    if (alpha < 128) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < 0) throw new Error('Empty source sprite');
  if (transparent < image.width * image.height * .1) throw new Error('Source has no genuine transparent margins; do not erase its background.');
  if (left === 0 || top === 0 || right === image.width - 1 || bottom === image.height - 1) throw new Error('Source silhouette touches the canvas edge; inspect/regenerate before native fitting.');
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

function groundFrame(image: RgbaImage, crop: ImageRect, terrain: boolean, palette: Palette): RgbaImage {
  const source = cropImage(image, crop), output: RgbaImage = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4) };
  const ratio = Math.min(56 / crop.w, 44 / crop.h);
  const width = terrain ? 56 : Math.max(1, Math.floor(crop.w * ratio)), height = terrain ? 64 : Math.max(1, Math.floor(crop.h * ratio));
  const left = Math.floor((64 - width) / 2), top = terrain ? 0 : 48 - height;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.min(source.width - 1, Math.floor((x + .5) * source.width / width)), sy = Math.min(source.height - 1, Math.floor((y + .5) * source.height / height));
    output.data.set(source.data.subarray((sy * source.width + sx) * 4, (sy * source.width + sx) * 4 + 4), ((top + y) * 64 + left + x) * 4);
  }
  if (terrain) {
    const original = output.data.slice();
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const at = (y * 64 + x) * 4;
      if (!insideHex(x, y, 64, 64)) { output.data.fill(0, at, at + 4); continue; }
      // Match the existing ground-mask contract: only nearest interior colors fill edge pinholes.
      if (original[at + 3]! < 128) {
        let found = false;
        for (let radius = 1; radius < 64 && !found; radius++) for (let dy = -radius; dy <= radius && !found; dy++) for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= 64 || ny >= 64) continue;
          const from = (ny * 64 + nx) * 4;
          if (original[from + 3]! >= 128) { output.data.set(original.subarray(from, from + 4), at); found = true; break; }
        }
        if (!found) throw new Error('Terrain source has no usable interior color');
      }
      output.data[at + 3] = 255;
    }
  }
  return normalizePalette(output, palette, { alphaThreshold: 128 }).image;
}

async function write(path: string, value: string | Uint8Array) { const absolute = await safeAssetPath(root, path); await mkdir(dirname(absolute), { recursive: true }); await writeFile(absolute, value); }
const sources: Source[] = JSON.parse(await readFile(await safeAssetPath(root, metadataPath), 'utf8'));
if (!Array.isArray(sources) || sources.length > 64 || new Set(sources.map(item => item.id)).size !== sources.length) throw new Error('Invalid source index');
const palette = paletteSchema.parse(JSON.parse(await readFile(resolve(root, 'assets/palettes/theandril-master.json'), 'utf8')));
const scriptHash = sha256(await readFile(fileURLToPath(import.meta.url))), selectedId = process.argv.find(arg => arg.startsWith('--id='))?.slice(5), prepare = process.argv.includes('--prepare');
let count = 0;
for (const source of sources) {
  if (selectedId && source.id !== selectedId) continue;
  const role = FACTION_SHEET_ROLES.find(role => role === source.role), terrain = source.role.startsWith('terrain.');
  if (role ? !families.includes(source.family) || source.id !== `${role}.${source.family}` : !/^(terrain\.(ash_scrub|chalkland)|improvement\.(terraced_fields|managed_woodlot|quarry|reedworks|shore_fishery))$/.test(source.id)) throw new Error(`Unsupported new-art ID ${source.id}`);
  if (source.sourcePath !== `assets/art/source/slice12/${source.id}-v${source.version}.png` || source.provider !== 'codex-imagegen' || !source.prompt) throw new Error('Unregistered source path or provider');
  const bytes = await readFile(await safeAssetPath(root, source.sourcePath)), image = decodePng(bytes), crop = bounds(image);
  const frame = role ? fitFactionFrame(image, crop, role, palette) : groundFrame(image, crop, terrain, palette);
  const contract = role ? factionFrameContract(role) : { type: terrain ? 'terrain' as const : 'map-object' as const, native: 64, pivot: terrain ? [32, 32] as [number, number] : [32, 48] as [number, number] };
  const png = encodePng(frame), nativePath = `assets/art/source/native/${source.id}/idle-se-0.png`, recordPath = `assets/art/source/slice12/${source.id}-v${source.version}.json`;
  const record = { id: source.id, role: source.role, family: source.family, version: source.version, sourcePath: source.sourcePath, prompt: source.prompt, provider: source.provider, model: source.model, seed: null, sourceHash: sha256(bytes), sourceSize: [image.width, image.height], crop, nativeResolution: contract.native, pivot: contract.pivot, nativeHash: sha256(png), note: 'One distinct built-in image-generation call. Full alpha>=128 silhouette bounds retained; nearest fitting and palette normalization prepare a candidate, not visual approval.' };
  const recordText = JSON.stringify(record, null, 2) + '\n';
  const manifest = parseAssetManifest({ schemaVersion: 1, id: source.id, type: contract.type, status: 'BRIEF_READY', version: source.version,
    nativeResolution: { width: contract.native, height: contract.native }, paletteId: palette.id, contentIds: [source.id], prompt: source.prompt,
    frames: [{ id: `${source.id}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: contract.pivot, sourcePath: nativePath }],
    animation: { states: { idle: { frames: 1, fps: 4, loop: false } } },
    provenance: { provider: source.provider, model: source.model, promptHash: sha256(source.prompt), sourceRefs: [source.sourcePath, recordPath], licenseNotes: ['Original built-in image generation commissioned for Theandril; no third-party game artwork used. Service terms apply; model/seed unavailable and rights not independently guaranteed.'] },
    createdAt: '2026-09-05T00:00:00.000Z', referenceHashes: [sha256(bytes), sha256(recordText)],
    processing: [{ tool: 'theandril-single-asset-extraction', version: '1', profile: terrain ? 'pointy-hex64' : `registered-${contract.native}`, settingsHash: cacheKey({ crop, contract, scriptHash, paletteHash: cacheKey(palette), method: 'nearest-pixel-center', alphaThreshold: 128 }), inputHash: sha256(bytes), outputHash: sha256(png) }],
    validation: null, review: null, constraints: { transparentPadding: terrain ? 0 : 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: terrain ? 16 : 0, requireMotion: false, terrain: terrain ? 'hex' : 'none' },
  });
  if (prepare) { await write(nativePath, png); await write(recordPath, recordText); await write(`assets/art/briefs/${source.id}.json`, JSON.stringify(manifest, null, 2) + '\n'); }
  console.log(JSON.stringify({ id: source.id, sourceSize: [image.width, image.height], crop, native: contract.native, nativeHash: sha256(png), prepared: prepare, approved: false })); count++;
}
if (selectedId && !count) throw new Error('Requested source does not exist');
