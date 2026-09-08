/** Prepare individually generated terrain originals; never approves or publishes pixels. */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheKey, cropImage, decodePng, encodePng, insideHex, normalizePalette, paletteSchema, parseAssetManifest, safeAssetPath, sha256, type Palette, type RgbaImage } from '../packages/art-pipeline/src/index';
import { biomeSourcesSchema } from '../packages/art-pipeline/src/biome-source';

/** Exact existing 56×64 pointy-hex geometry, independent of simulation terrain. */
export function fitBiomeTile(image: RgbaImage, palette: Palette): { image: RgbaImage; crop: { x: number; y: number; w: number; h: number } } {
  let left = image.width, top = image.height, right = -1, bottom = -1, transparent = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const alpha = image.data[(y * image.width + x) * 4 + 3]!;
    if (!alpha) transparent++;
    if (alpha < 128) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < 0 || transparent < image.width * image.height / 10) throw new Error('Source requires a real opaque hex and genuine transparent margins; do not erase a background.');
  if (!left || !top || right === image.width - 1 || bottom === image.height - 1) throw new Error('Clipped original: regenerate with complete transparent margins.');
  const crop = { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  if (crop.w / crop.h < .70 || crop.w / crop.h > 1.05) throw new Error('Original is not a pointy-top hex; inspect rather than distort it.');
  // Inspect original alpha, not just nearest samples: enclosed holes must not
  // disappear during native fitting. Only connected exterior pinholes can fill.
  const pixels = image.width * image.height, exterior = new Uint8Array(pixels), queue = new Int32Array(pixels);
  let head = 0, tail = 0;
  const enqueue = (cell: number) => { if (!exterior[cell] && image.data[cell * 4 + 3]! < 128) { exterior[cell] = 1; queue[tail++] = cell; } };
  for (let x = 0; x < image.width; x++) { enqueue(x); enqueue((image.height - 1) * image.width + x); }
  for (let y = 1; y < image.height - 1; y++) { enqueue(y * image.width); enqueue((y + 1) * image.width - 1); }
  while (head < tail) {
    const cell = queue[head++]!, x = cell % image.width, y = Math.floor(cell / image.width);
    if (x) enqueue(cell - 1); if (x < image.width - 1) enqueue(cell + 1);
    if (y) enqueue(cell - image.width); if (y < image.height - 1) enqueue(cell + image.width);
  }
  for (let cell = 0; cell < pixels; cell++) if (image.data[cell * 4 + 3]! < 128 && !exterior[cell]) throw new Error('Original hex has an enclosed interior alpha hole; regenerate.');
  const source = cropImage(image, crop), output: RgbaImage = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4) };
  for (let y = 0; y < 64; y++) for (let x = 4; x < 60; x++) {
    const sx = Math.min(crop.w - 1, Math.floor((x - 4 + .5) * crop.w / 56)), sy = Math.min(crop.h - 1, Math.floor((y + .5) * crop.h / 64));
    output.data.set(source.data.subarray((sy * crop.w + sx) * 4, (sy * crop.w + sx) * 4 + 4), (y * 64 + x) * 4);
  }
  const original = output.data.slice();
  let outside = 0;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (!insideHex(x, y, 64, 64) && original[(y * 64 + x) * 4 + 3]! >= 128) outside++;
  if (outside > 128) throw new Error('Original does not have a pointy hex silhouette; do not cut a rectangle into terrain.');
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const at = (y * 64 + x) * 4;
    if (!insideHex(x, y, 64, 64)) { output.data.fill(0, at, at + 4); continue; }
    if (original[at + 3]! < 128) {
      let found = false;
      for (let radius = 1; radius <= 4 && !found; radius++) for (let dy = -radius; dy <= radius && !found; dy++) for (let dx = -radius; dx <= radius; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= 64 || ny >= 64) continue;
        const from = (ny * 64 + nx) * 4;
        if (original[from + 3]! >= 128) { output.data.set(original.subarray(from, from + 4), at); found = true; break; }
      }
      if (!found) throw new Error('Hex has an interior alpha hole or incompatible silhouette; regenerate.');
    }
    output.data[at + 3] = 255;
  }
  return { image: normalizePalette(output, palette, { alphaThreshold: 128 }).image, crop };
}

export async function prepareBiomeVariants(root: string, ids?: readonly string[], write = false, activatePreparation = false): Promise<unknown[]> {
  const read = async (path: string) => {
    const absolute = await safeAssetPath(root, path), info = await stat(absolute);
    if (!info.isFile() || info.size > 64 * 1024 * 1024) throw new Error('Art input exceeds supported size');
    return readFile(absolute);
  };
  const sources = biomeSourcesSchema.parse(JSON.parse((await read('assets/art/source/biome-variants/generation.json')).toString()));
  for (const key of ['id', 'sourceHash', 'sourcePath'] as const) if (new Set(sources.map(item => item[key])).size !== sources.length) throw new Error('Each tile needs its own original and stable ID');
  if (ids?.some(id => !sources.some(source => source.id === id))) throw new Error('Unknown terrain source ID');
  const palette = paletteSchema.parse(JSON.parse((await read('assets/palettes/theandril-master.json')).toString()));
  const toolHash = sha256(await readFile(fileURLToPath(import.meta.url)));
  const writes: { path: string; bytes: Buffer; replace?: boolean; prior?: Buffer }[] = [], results: unknown[] = [];
  const json = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
  for (const source of sources.filter(source => !ids || ids.includes(source.id))) {
    const bytes = await read(source.sourcePath);
    if (sha256(bytes) !== source.sourceHash) throw new Error('Original source hash mismatch');
    const original = decodePng(bytes), fitted = fitBiomeTile(original, palette), png = Buffer.from(encodePng(fitted.image));
    const nativePath = `assets/art/source/native/${source.id}/v${source.version}/${toolHash.slice(0, 16)}/idle-se-0.png`;
    const recordPath = `assets/art/source/biome-variants/${source.id}-v${source.version}-${toolHash.slice(0, 16)}.json`;
    const record = { ...source, sourceSize: [original.width, original.height], crop: fitted.crop, nativePath, nativeHash: sha256(png), toolHash,
      note: 'One original built-in generation. Nearest pixel-center fitting, existing pointy-hex mask, nearest-interior fill limited to four native pixels, binary alpha and master palette. Not visual approval.' };
    const recordBytes = json(record);
    const brief = parseAssetManifest({ schemaVersion: 1, id: source.id, type: 'terrain', status: 'BRIEF_READY', version: source.version,
      nativeResolution: { width: 64, height: 64 }, paletteId: palette.id, contentIds: [source.id], prompt: source.prompt,
      frames: [{ id: `${source.id}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: [32, 32], sourcePath: nativePath }],
      animation: { states: { idle: { frames: 1, fps: 4, loop: false } } },
      provenance: { provider: source.provider, model: source.model, promptHash: sha256(source.prompt), sourceRefs: [source.sourcePath, recordPath], licenseNotes: ['Original built-in generation commissioned for Theandril; no third-party game artwork used. Service terms apply; unavailable model/seed are not invented, rights are not independently guaranteed.'] },
      createdAt: source.generatedAt, referenceHashes: [source.sourceHash, sha256(recordBytes)],
      processing: [{ tool: 'theandril-biome-native', version: '1', profile: 'pointy-hex64', settingsHash: cacheKey({ crop: fitted.crop, toolHash, palette, alphaThreshold: 128, maxEdgeFill: 4 }), inputHash: source.sourceHash, outputHash: sha256(png) }],
      validation: null, review: null, constraints: { transparentPadding: 0, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 16, requireMotion: false, terrain: 'hex' },
    });
    const activePath = `assets/art/briefs/${source.id}.json`, briefBytes = json(brief);
    let prior: Buffer | undefined;
    try { prior = await read(activePath); } catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error; }
    if (prior && !prior.equals(briefBytes)) {
      if (!activatePreparation) throw new Error(`Immutable output conflict: ${activePath}; retain evidence and use explicit --activate-preparation.`);
      const old = parseAssetManifest(JSON.parse(prior.toString()));
      if (old.id !== source.id || old.version !== source.version || old.status !== 'BRIEF_READY' || old.review !== null) throw new Error('Only an unreviewed preparation of the same source version may be activated.');
      try { await read(`assets/art/approved/${source.id}.json`); throw new Error('Approved ID is sealed; preparation cannot replace it.'); }
      catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error; }
      const oldRecord = old.provenance.sourceRefs[1];
      if (!oldRecord || !prior.equals(await read(oldRecord.replace(/\.json$/, '.brief.json'))) || !old.referenceHashes.includes(source.sourceHash)
        || !old.referenceHashes.includes(sha256(await read(oldRecord))) || sha256(await read(old.frames[0]!.sourcePath)) !== old.processing[0]?.outputHash) throw new Error('Prior immutable preparation evidence is missing or altered.');
    }
    writes.push({ path: nativePath, bytes: png }, { path: recordPath, bytes: recordBytes }, { path: recordPath.replace(/\.json$/, '.brief.json'), bytes: briefBytes }, { path: activePath, bytes: briefBytes, replace: Boolean(prior && activatePreparation), ...(prior ? { prior } : {}) });
    results.push({ id: source.id, crop: fitted.crop, nativeHash: sha256(png), prepared: write, approved: false });
  }
  // Preflight the complete batch before writing; exact repeats never overwrite evidence.
  const missing: typeof writes = [];
  for (const item of writes) {
    try { const existing = await read(item.path); if (!item.bytes.equals(existing)) { if (!item.replace || !item.prior?.equals(existing)) throw new Error(`Immutable output conflict: ${item.path}`); missing.push(item); } }
    catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error; missing.push(item); }
  }
  if (write) for (const item of missing) { const path = await safeAssetPath(root, item.path); await mkdir(dirname(path), { recursive: true }); await writeFile(path, item.bytes, { flag: item.replace ? 'w' : 'wx' }); }
  return results;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--prepare' && arg !== '--activate-preparation' && !arg.startsWith('--id='))) throw new Error('Usage: [--prepare] [--activate-preparation] [--id=terrain.<biome>.variant_<1|2>]');
  const ids = args.filter(arg => arg.startsWith('--id=')).map(arg => arg.slice(5));
  console.log(JSON.stringify(await prepareBiomeVariants(resolve(dirname(fileURLToPath(import.meta.url)), '..'), ids.length ? ids : undefined, args.includes('--prepare'), args.includes('--activate-preparation')), null, 2));
}
