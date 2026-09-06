import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { parseAssetManifest, paletteSchema, decodePng, encodePng, normalizePalette, cropImage, validateAsset, approveAsset, buildAtlas, buildContactSheet, safeAssetPath, sha256, cacheKey, createAssetCacheReceipt, verifyAssetCacheReceipt, insideHex, type AssetManifest, type FrameImage, type ArtLabCatalog, type Palette } from '../packages/art-pipeline/src/index';
import { asepriteVersion, findPixelSnapper, runTool, runPixelSnapper, createAsepriteSource, exportAseprite, type AsepriteProfile, type ToolProcessResult } from '../packages/art-pipeline/src/toolchain';
import { PixelLabGenerator, PerfectPixelGenerator, ComfyUIGenerator, type ArtGenerator } from '../packages/art-pipeline/src/generators';
import { FACTION_ART_FAMILIES, FACTION_ART_IDS } from '../packages/art-pipeline/src/faction-art';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2).filter(value => value !== '--');
const command = args[0] ?? 'help';
const option = (name: string): string | undefined => { const at = args.indexOf('--' + name); return at < 0 ? undefined : args[at + 1]; };
const target = args[1] && !args[1].startsWith('--') ? args[1] : 'all';
// Loaded before every asset command; doctor/help intentionally run without a palette file.
let palette!: Palette;
const json = async (path: string): Promise<unknown> => JSON.parse(await readFile(await safeAssetPath(root, path), 'utf8'));
async function exists(path: string) { try { await stat(await safeAssetPath(root, path)); return true; } catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false; throw error; } }
async function save(path: string, value: unknown, binary = false) {
  const full = await safeAssetPath(root, path); await mkdir(dirname(full), { recursive: true });
  await writeFile(full, binary ? value as Uint8Array : JSON.stringify(value, null, 2) + '\n');
}
async function entries(directory: string): Promise<string[]> {
  if (!await exists(directory)) return [];
  return (await readdir(await safeAssetPath(root, directory))).filter(file => file.endsWith('.json')).sort();
}
async function briefs(): Promise<AssetManifest[]> {
  const all = await Promise.all((await entries('assets/art/briefs')).map(async file => { const asset = parseAssetManifest(await json('assets/art/briefs/' + file)); if (file !== `${asset.id}.json`) throw new Error('Brief filename must match its stable asset ID'); return asset; }));
  if (new Set(all.map(asset => asset.id)).size !== all.length) throw new Error('Duplicate brief IDs');
  if (all.length > 4096) throw new Error('Art registry exceeds 4096 asset budget');
  const family = option('family');
  if (family && !(FACTION_ART_FAMILIES as readonly string[]).includes(family)) throw new Error('Unknown authored art family');
  if (family && target !== 'all') throw new Error('Choose an individual asset or --family, not both');
  if (target === 'all') return family ? all.filter(asset => asset.id.endsWith('.' + family)) : all;
  const result = all.filter(asset => asset.id === target); if (!result.length) throw new Error(`Unknown asset ID: ${target}`); return result;
}
async function frames(asset: AssetManifest): Promise<FrameImage[]> {
  return Promise.all(asset.frames.map(async frame => ({ id: frame.id, image: decodePng(await readFile(await safeAssetPath(root, frame.sourcePath))) })));
}
async function candidate(brief: AssetManifest): Promise<AssetManifest> {
  const pointer = `assets/art/candidates/${brief.id}.json`;
  return await exists(pointer) ? parseAssetManifest(await json(pointer)) : brief;
}
function profile(asset: AssetManifest): AsepriteProfile {
  const size = asset.nativeResolution.width;
  if (asset.nativeResolution.height !== size) throw new Error('Foundation native profiles require square canvases');
  if (asset.type === 'terrain' && size === 64) return 'aseprite-terrain-64';
  if (asset.type === 'settlement' && size === 96) return 'aseprite-settlement-96';
  if (asset.type === 'settlement' && size === 128) return 'aseprite-settlement-128';
  if (size === 64) return 'aseprite-unit-64'; if (size === 96) return 'aseprite-unit-96'; if (size === 128) return 'aseprite-monster-128'; if (size === 32) return 'aseprite-ui-32';
  throw new Error('No reviewed native export profile for this size');
}
function nativeFrame(image: FrameImage['image'], asset: AssetManifest): FrameImage['image'] {
  const { width, height } = asset.nativeResolution, result = { width, height, data: new Uint8Array(width * height * 4) };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = (y * width + x) * 4, source = (Math.min(image.height - 1, Math.floor((y + .5) * image.height / height)) * image.width + Math.min(image.width - 1, Math.floor((x + .5) * image.width / width))) * 4;
    result.data.set(image.data.subarray(source, source + 4), at);
  }
  return normalizePalette(result, palette).image;
}
const processing = (tool: ToolProcessResult, profile: string): AssetManifest['processing'][number] => ({ tool: tool.tool, version: tool.version, profile, settingsHash: tool.settingsHash, inputHash: tool.inputHash, outputHash: cacheKey(tool.files.map(file => file.sha256)) });
async function generate(brief: AssetManifest) {
  if (new Set(brief.frames.map(frame => frame.state)).size !== 1 || brief.frames[0]!.state !== 'idle' || new Set(brief.frames.map(frame => frame.direction)).size !== 1) throw new Error('Foundation CLI supports one facing and one idle clip; use explicit tagged toolchain exports for multi-state/directional assets.');
  const started = performance.now(), provider = option('provider') ?? 'source';
  const aseprite = await asepriteVersion({ repoRoot: root }), snapper = await findPixelSnapper({ repoRoot: root });
  if (!snapper) throw new Error('Pixel Snapper is required: run tools/art/install-pixel-snapper.sh or set PIXEL_SNAPPER_BIN.');
  const snapperVersion = (await runTool(snapper, ['--version'])).stdout.trim();
  const sourceHashes = await Promise.all(brief.frames.map(async frame => sha256(await readFile(await safeAssetPath(root, frame.sourcePath)))));
  const toolchainHashes = await Promise.all(['packages/art-pipeline/src/toolchain/aseprite.ts', 'packages/art-pipeline/src/toolchain/pixelsnapper.ts', 'packages/art-pipeline/src/toolchain/process.ts', 'packages/art-pipeline/src/png.ts', 'packages/art-pipeline/src/palette.ts', 'tools/art/import-frames.lua'].map(async path => ({ path, hash: sha256(await readFile(resolve(root, path))) })));
  const key = cacheKey({ brief, sourceHashes, palette, provider, aseprite: aseprite.version, snapper: snapperVersion, toolchainHashes, cli: sha256(await readFile(fileURLToPath(import.meta.url))) });
  const folder = `assets/art/cache/${brief.id}/${key}`;
  const cachePath = `${folder}/receipt.json`;
  if (await exists(cachePath)) {
    let receipt: unknown;
    try { receipt = await json(cachePath); } catch { console.warn(`${brief.id}: unreadable cache receipt; rebuilding from sources.`); }
    const manifest = await verifyAssetCacheReceipt(root, receipt, { key, assetId: brief.id });
    if (manifest) {
      const report = validateAsset(manifest, await frames(manifest), palette);
      if (report.passed) { await save(`assets/art/candidates/${brief.id}.json`, manifest); console.log(`${brief.id}: verified cache hit (${key.slice(0, 12)})`); return; }
    }
  }
  await mkdir(await safeAssetPath(root, folder), { recursive: true });
  let inputPaths = brief.frames.map(frame => frame.sourcePath), provenance = brief.provenance;
  if (provider !== 'source') {
    if (brief.frames.length !== 1) throw new Error('This CLI requires one explicit source per animated frame; remote still-image generation cannot fabricate animation.');
    const providers: Record<string, () => ArtGenerator> = { pixellab: () => new PixelLabGenerator(), perfectpixel: () => new PerfectPixelGenerator(), comfyui: () => new ComfyUIGenerator() };
    const factory = providers[provider]; if (!factory) throw new Error('Provider must be source, pixellab, perfectpixel or comfyui');
    const outputDirectory = await safeAssetPath(root, `${folder}/provider`);
    await mkdir(outputDirectory, { recursive: true });
    const generated = await factory().generate({ assetId: brief.id, prompt: brief.prompt, width: brief.nativeResolution.width, height: brief.nativeResolution.height, seed: brief.seed, outputDirectory });
    const selected = generated[0]; if (!selected || selected.files.length !== 1) throw new Error('Provider must return exactly one image for this single-frame brief');
    inputPaths = [relative(root, selected.files[0]!.path)];
    provenance = { provider: selected.provider, model: selected.model, promptHash: selected.promptHash, sourceRefs: inputPaths, licenseNotes: selected.licenseNotes };
  }
  const steps = [...brief.processing], nativePaths: string[] = [];
  for (const [index, input] of inputPaths.entries()) {
    const rawPath = `${folder}/snap-${index}.png`;
    // Snapper expects enlarged pixel clusters; re-snapping a one-pixel native image erases deliberate detail.
    const normalized = nativeFrame(decodePng(await readFile(await safeAssetPath(root, input))), brief);
    const enlarged = nativeFrame(normalized, { ...brief, nativeResolution: { width: normalized.width * 4, height: normalized.height * 4 } });
    const enlargedPath = `${folder}/grid4-${index}.png`, enlargedBytes = encodePng(enlarged); await save(enlargedPath, enlargedBytes, true);
    steps.push({ tool: 'theandril-grid-enlarge', version: '1', profile: 'nearest-4x', inputHash: sha256(encodePng(normalized)), outputHash: sha256(enlargedBytes), settingsHash: cacheKey({ scale: 4, filter: 'nearest' }) });
    const result = await runPixelSnapper({ inputPath: await safeAssetPath(root, enlargedPath), outputPath: await safeAssetPath(root, rawPath), pixelSize: 4, colorCount: 64, palette: palette.colors, repoRoot: root });
    steps.push(processing(result, 'fixed-palette-pixel4'));
    const image = nativeFrame(decodePng(await readFile(await safeAssetPath(root, rawPath))), brief);
    if (brief.constraints.terrain === 'hex') {
      // Snapper's adaptive cuts may alter geometry. Preserve the validated native ground footprint, not a fake world change.
      const original = nativeFrame(decodePng(await readFile(await safeAssetPath(root, input))), brief);
      for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        const at = (y * image.width + x) * 4;
        if (!insideHex(x, y, image.width, image.height)) image.data.fill(0, at, at + 4);
        else if (image.data[at + 3] !== 255) image.data.set(original.data.subarray(at, at + 4), at);
      }
    }
    const nativePath = `${folder}/native-${index}.png`, bytes = encodePng(image); await save(nativePath, bytes, true); nativePaths.push(nativePath);
    steps.push({ tool: 'theandril-native-normalize', version: '1', profile: 'nearest-alpha128', inputHash: result.files[0]!.sha256, outputHash: sha256(bytes), settingsHash: cacheKey({ native: brief.nativeResolution, palette, mask: brief.constraints.terrain }) });
  }
  const source = await createAsepriteSource({ frames: nativePaths.map((path, index) => ({ path: resolve(root, path), durationMs: brief.frames[index]!.durationMs })), tags: [{ name: 'idle', from: 0, to: nativePaths.length - 1 }], outputPath: await safeAssetPath(root, `${folder}/editable.aseprite`), profile: profile(brief) });
  steps.push(processing(source, profile(brief)));
  const exported = await exportAseprite({ sourcePath: source.files[0]!.path, outputDirectory: await safeAssetPath(root, `${folder}/aseprite`), profile: profile(brief), stem: 'sprite' }); steps.push(processing(exported, profile(brief)));
  const sheet = decodePng(await readFile(exported.files[0]!.path));
  if (exported.metadata.frames.length !== brief.frames.length) throw new Error('Aseprite frame count differs from the brief');
  const finalFrames: AssetManifest['frames'] = [];
  for (const [index, frame] of exported.metadata.frames.entries()) {
    const path = `${folder}/frame-${index}.png`;
    if (frame.duration !== brief.frames[index]!.durationMs) throw new Error('Aseprite changed animation timing');
    await save(path, encodePng(cropImage(sheet, frame.frame)), true); finalFrames.push({ ...brief.frames[index]!, sourcePath: path });
  }
  const manifest = parseAssetManifest({ ...brief, provenance, status: 'CANDIDATE', frames: finalFrames, processing: steps, validation: null, review: null });
  const report = validateAsset(manifest, await frames(manifest), palette);
  await save(`assets/art/reports/${brief.id}.json`, report);
  await save(`assets/art/candidates/${brief.id}.json`, manifest);
  const files = await Promise.all([...new Set([...finalFrames.map(frame => frame.sourcePath), ...source.files.map(file => relative(root, file.path)), ...exported.files.map(file => relative(root, file.path)), ...manifest.provenance.sourceRefs.filter(ref => !ref.includes('://'))])].map(async path => ({ path, sha256: sha256(await readFile(await safeAssetPath(root, path))) })));
  await save(cachePath, createAssetCacheReceipt(key, manifest, files));
  console.log(`${brief.id}: ${report.passed ? 'CANDIDATE (checks pass; visual review required)' : 'NEEDS_REVISION: ' + report.errors.join('; ')}; ${(performance.now() - started).toFixed(1)} ms`);
}
async function approved() { return Promise.all((await entries('assets/art/approved')).map(async file => { const manifest = parseAssetManifest(await json('assets/art/approved/' + file)); return { manifest, frames: await frames(manifest) }; })); }
async function atlas(integrate: boolean) {
  const inputs = await approved(); if (!inputs.length) throw new Error('No reviewed approvals; runtime atlas cannot include candidates.');
  // The134-asset release overflowed1024; keep native pixels intact on one explicit2048 page.
  const requestedSize = option('page-size') ?? '2048';
  if (requestedSize !== '1024' && requestedSize !== '2048') throw new Error('Atlas page-size must be1024 or2048');
  const pageSize = requestedSize === '1024' ? 1024 : 2048;
  const started = performance.now(), result = buildAtlas(inputs, { id: 'foundation', pageSize, imageUrl: '/art/foundation.png', jsonUrl: '/art/foundation.json', palette });
  const second = buildAtlas([...inputs].reverse(), { id: 'foundation', pageSize, imageUrl: '/art/foundation.png', jsonUrl: '/art/foundation.json', palette });
  if (sha256(result.png) !== sha256(second.png) || cacheKey(result.catalog) !== cacheKey(second.catalog)) throw new Error('Atlas determinism check failed');
  await save('assets/art/runtime/foundation.png', result.png, true); await save('assets/art/runtime/foundation.json', result.json); await save('assets/art/runtime/catalog.json', result.catalog);
  if (integrate) {
    await save('apps/web/public/art/foundation.png', result.png, true); await save('apps/web/public/art/foundation.json', result.json); await save('apps/web/public/art/catalog.json', result.catalog);
    const runtimeById = new Map(result.catalog.assets.map(asset => [asset.id, asset]));
    const allBriefs = await Promise.all((await entries('assets/art/briefs')).map(file => json('assets/art/briefs/' + file).then(parseAssetManifest)));
    const live = new Set([...FACTION_ART_IDS, 'unit.guard', 'unit.scout', 'unit.colonist', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry', 'settlement.village', 'settlement.town', 'settlement.city', 'map.ruin', ...['ocean', 'grassland', 'temperate_forest', 'taiga', 'tundra', 'desert', 'steppe', 'marsh', 'rainforest', 'alpine', 'ash_scrub', 'chalkland'].map(id => 'terrain.' + id), ...['terraced_fields', 'managed_woodlot', 'quarry', 'reedworks', 'shore_fishery'].map(id => 'improvement.' + id)]);
    const lab: ArtLabCatalog = { schemaVersion: 1, palette, atlases: result.catalog.atlases, assets: allBriefs.map(asset => {
      const runtime = runtimeById.get(asset.id) ?? null;
      return { id: asset.id, type: asset.type, status: runtime?.status ?? asset.status, contentIds: asset.contentIds, nativeResolution: asset.nativeResolution, pivot: asset.frames[0]!.pivot, previewUrl: null, runtime, validation: runtime?.validation ?? null, provenance: runtime?.provenance ?? asset.provenance, review: runtime?.review ?? null, reasons: [live.has(asset.id) ? 'Bound to an existing observation-derived gameplay renderer or faction UI.' : 'Foundation artwork for future content. No canonical gameplay consumer exists yet.', ...(!runtime ? ['Not approved or not published. Candidate files are never served in production.'] : [])] };
    }) };
    await save('apps/web/public/art/lab-catalog.json', lab);
  }
  console.log(`${integrate ? 'Published' : 'Built'} ${inputs.length} approved assets, ${Object.keys(result.json.frames).length} frames; ${pageSize}x${pageSize} / ${pageSize * pageSize * 4 / 1024 / 1024} MiB per decoded page; PNG ${result.png.length} bytes; ${result.catalog.atlases[0]!.sha256}; two-order rebuild ${(performance.now() - started).toFixed(1)} ms. In-game review remains separate.`);
}

try {
  if (command !== 'doctor' && command !== 'help') palette = paletteSchema.parse(await json('assets/palettes/theandril-master.json'));
  if (command === 'doctor') {
    const { doctor } = await import('../packages/art-pipeline/src/toolchain/doctor');
    console.log(JSON.stringify(await doctor({ repoRoot: root }), null, 2));
  } else if (command === 'generate') { for (const brief of await briefs()) await generate(brief); }
  else if (command === 'status') {
    for (const brief of await briefs()) { const asset = await candidate(brief), approvalPath = `assets/art/approved/${brief.id}.json`; console.log(`${brief.id}: ${asset.status}${await exists(approvalPath) ? ' / reviewed approval present (art:validate verifies freshness)' : ''}`); }
  } else if (command === 'validate') {
    let failed = false;
    for (const brief of await briefs()) {
      const asset = await candidate(brief), report = validateAsset(asset, await frames(asset), palette);
      await save(`assets/art/reports/${asset.id}.json`, report); console.log(`${asset.id} (${asset.status}): ${report.passed ? 'PASS' : 'FAIL'} ${report.inputHash}${report.errors.length ? '\n  ' + report.errors.join('\n  ') : ''}`); failed ||= !report.passed;
    }
    for (const asset of await approved()) { const report = validateAsset(asset.manifest, asset.frames, palette); if (!report.passed || report.inputHash !== asset.manifest.review?.inputHash) { console.error(`Stale approved asset: ${asset.manifest.id}`); failed = true; } }
    if (failed) process.exitCode = 1;
  } else if (command === 'review') {
    const items = await Promise.all((await briefs()).map(async brief => { const manifest = args.includes('--source') ? brief : await candidate(brief); return { manifest, frames: await frames(manifest) }; }));
    if (args.includes('--approve') || args.includes('--reject')) {
      const rejection = args.includes('--reject'); if (rejection && args.includes('--approve')) throw new Error('Choose approval or rejection, not both');
      const notes = option('notes'), reviewer = option('reviewer'), evidence = option('evidence'), hash = option('hash');
      if (target === 'all' || !notes || !reviewer || !evidence || !hash) throw new Error('Approve one inspected asset: art:review <id> --approve --hash <validation hash> --reviewer <name> --notes <observed findings> --evidence <repo-relative existing image>.');
      if (args.includes('--source')) throw new Error('Source comparison is not a processed candidate approval.');
      const evidencePath = await safeAssetPath(root, evidence); if (!(await stat(evidencePath)).isFile()) throw new Error('Review evidence must be a file');
      const item = items[0]!, candidateReport = validateAsset(item.manifest, item.frames, palette);
      if (!candidateReport.passed || candidateReport.inputHash !== hash) throw new Error('The candidate changed since this visual review; inspect and validate it again.');
      const stage = rejection ? 'rejected' : 'approved', stableFolder = `assets/art/${stage}/${item.manifest.id}/${hash}`;
      const evidenceBytes = await readFile(evidencePath); decodePng(evidenceBytes);
      const stableEvidence = `assets/art/reviews/${sha256(evidenceBytes)}.png`; await save(stableEvidence, evidenceBytes, true);
      const stableFrames: AssetManifest['frames'] = [];
      for (const [index, frame] of item.manifest.frames.entries()) {
        const sourcePath = `${stableFolder}/frame-${index}.png`, bytes = await readFile(await safeAssetPath(root, frame.sourcePath));
        await save(sourcePath, bytes, true); stableFrames.push({ ...frame, sourcePath });
      }
      const candidateFolder = dirname(item.manifest.frames[0]!.sourcePath);
      for (const name of ['editable.aseprite', 'aseprite/sprite.png', 'aseprite/sprite.json']) {
        const path = `${candidateFolder}/${name}`; await save(`${stableFolder}/${name}`, await readFile(await safeAssetPath(root, path)), true);
      }
      const sourceRefs: string[] = [];
      for (const [index, ref] of item.manifest.provenance.sourceRefs.entries()) {
        if (ref.startsWith('assets/art/cache/')) { const source = `${stableFolder}/provider-source-${index}.png`; await save(source, await readFile(await safeAssetPath(root, ref)), true); sourceRefs.push(source); }
        else sourceRefs.push(ref);
      }
      const stable = parseAssetManifest({ ...item.manifest, frames: stableFrames, provenance: { ...item.manifest.provenance, sourceRefs } }), retainedFrames = await frames(stable), report = validateAsset(stable, retainedFrames, palette);
      if (retainedFrames.some((frame, index) => sha256(frame.image.data) !== sha256(item.frames[index]!.image.data))) throw new Error('Promoted pixels differ from reviewed candidate');
      const review = { reviewer, reviewedAt: new Date().toISOString(), notes: `${notes}\nReviewed candidate ${hash}; byte-identical frames and evidence retained in the ${stage} source directory.`, evidencePaths: [stableEvidence], inputHash: report.inputHash };
      const reportPath = `assets/art/reports/${item.manifest.id}.${stage}.json`;
      const manifest = rejection ? parseAssetManifest({ ...stable, status: 'REJECTED', review, validation: { score: report.score, passed: report.passed, reportPath } }) : approveAsset(stable, report, review, reportPath);
      await save(reportPath, report);
      await save(`assets/art/${stage}/${manifest.id}.json`, manifest); console.log(`${rejection ? 'Rejected' : 'Approved'} ${manifest.id} against exact input ${hash}.`);
    } else {
      const name = (option('family') ?? target) + (args.includes('--source') ? '-source' : '');
      const groups = target === 'all' && !option('family') ? [...new Set(items.map(item => item.manifest.type))].sort().map(type => ({ name: `${name}-${type}`, items: items.filter(item => item.manifest.type === type) })) : [{ name, items }];
      for (const group of groups) for (const scale of [1, 4] as const) await save(`assets/art/review-previews/${group.name}-${scale}x.png`, encodePng(buildContactSheet(group.items, { scale, columns: 6 })), true);
      await save(`assets/art/review-previews/${name}-order.json`, [...items].sort((a, b) => a.manifest.id < b.manifest.id ? -1 : 1).flatMap(item => [...item.manifest.frames].sort((a, b) => a.id < b.id ? -1 : 1).map(frame => ({ asset: item.manifest.id, frame: frame.id }))));
      console.log(`Contact sheets saved: ${groups.map(group => `assets/art/review-previews/${group.name}-{1,4}x.png`).join(', ')}. Inspect before individual approval; no asset status was changed.`);
    }
  } else if (command === 'atlas' || command === 'integrate') await atlas(command === 'integrate');
  else console.log('Art factory: doctor | status [id] | generate [id] [--provider source|pixellab|perfectpixel|comfyui] | validate [id] | review [id] [--approve ...] | atlas | integrate. Source reprocesses committed generated inputs; it does not silently make new provider calls.');
} catch (error) { console.error(error instanceof Error ? error.message : 'Art pipeline failed'); process.exitCode = 1; }
