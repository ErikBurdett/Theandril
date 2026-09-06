/** Offline individual-source preparation. No generation, approval or runtime publication. */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cacheKey, decodePng, encodePng, paletteSchema, parseAssetManifest, safeAssetPath, sha256,
  type AssetManifest, type ImageRect, type RgbaImage,
} from '../packages/art-pipeline/src/index';
import { factionExpansionBatchIdSchema as batchIdSchema, factionExpansionBatchSchema } from '../packages/art-pipeline/src/faction-source';
export { factionExpansionBatchSchema, type FactionExpansionBatch } from '../packages/art-pipeline/src/faction-source';
import { factionFrameContract, fitFactionFrame } from './art-factions';

export type FactionExpansionOptions = { repoRoot: string; batchId: string; ids?: readonly string[]; write?: boolean; activateRevision?: boolean };
export type PreparedFactionSource = {
  id: string; version: number; sourceHash: string; nativeHash: string; nativePath: string; recordPath: string;
  versionedBriefPath: string; briefPath: string; createdPaths: string[]; replacedBrief: boolean; approved: false;
};
type PlannedWrite = { path: string; bytes: Uint8Array; prior: Uint8Array | null; owner: PreparedFactionSource };
const json = (value: unknown): Buffer => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const same = (a: Uint8Array, b: Uint8Array): boolean => Buffer.from(a).equals(Buffer.from(b));

async function boundedRead(root: string, path: string, limit: number): Promise<Buffer> {
  const absolute = await safeAssetPath(root, path), info = await stat(absolute);
  if (!info.isFile() || info.size > limit) throw new Error(`File exceeds allowed size or is not regular: ${path}`);
  const value = await readFile(absolute);
  if (value.byteLength > limit) throw new Error(`File exceeds allowed size: ${path}`);
  return value;
}
async function existing(root: string, path: string): Promise<Buffer | null> {
  try { return await boundedRead(root, path, 8 * 1024 * 1024); }
  catch (error) { if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null; throw error; }
}
function alphaBounds(image: RgbaImage): ImageRect {
  let left = image.width, top = image.height, right = -1, bottom = -1, transparent = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const alpha = image.data[(y * image.width + x) * 4 + 3]!;
    if (alpha === 0) transparent++;
    if (alpha < 128) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < 0) throw new Error('Empty source sprite');
  if (transparent < image.width * image.height / 10) throw new Error('Source lacks genuine transparent margins; background repair is forbidden.');
  if (left === 0 || top === 0 || right === image.width - 1 || bottom === image.height - 1) throw new Error('Source silhouette touches canvas edge; inspect/regenerate before fitting.');
  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

/** All selected inputs and collisions are checked before writes; an exact repeat performs zero writes. */
export async function prepareFactionExpansion(options: FactionExpansionOptions): Promise<PreparedFactionSource[]> {
  const batchId = batchIdSchema.parse(options.batchId), root = resolve(options.repoRoot);
  const directory = `assets/art/source/faction-expansion/${batchId}`;
  const batch = factionExpansionBatchSchema.parse(JSON.parse((await boundedRead(root, `${directory}/generation.json`, 4 * 1024 * 1024)).toString('utf8')));
  if (batch.batchId !== batchId) throw new Error('Source batch identity mismatch');
  if (options.ids && (!options.ids.length || options.ids.length > 90 || new Set(options.ids).size !== options.ids.length || options.ids.some(id => !batch.sources.some(source => source.id === id)))) throw new Error('Unknown or duplicate selected source ID');
  const sources = batch.sources.filter(source => !options.ids || options.ids.includes(source.id)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const palette = paletteSchema.parse(JSON.parse((await boundedRead(root, 'assets/palettes/theandril-master.json', 65536)).toString('utf8')));
  const toolHashes = {
    preparer: sha256(await readFile(fileURLToPath(import.meta.url))),
    fitter: sha256(await readFile(new URL('./art-factions.ts', import.meta.url))),
    sourceContract: sha256(await readFile(new URL('../packages/art-pipeline/src/faction-source.ts', import.meta.url))),
  };
  const writes: PlannedWrite[] = [], results: PreparedFactionSource[] = [];
  async function plan(path: string, bytes: Uint8Array, owner: PreparedFactionSource, allowReplacement = false) {
    const prior = await existing(root, path);
    if (prior && same(prior, bytes)) return;
    if (prior && !allowReplacement) throw new Error(`Immutable output conflict: ${path}; retain it and use a new source version.`);
    writes.push({ path, bytes, prior, owner });
  }
  for (const source of sources) {
    const original = await boundedRead(root, source.sourcePath, 64 * 1024 * 1024);
    if (sha256(original) !== source.sourceHash) throw new Error(`Original source hash mismatch: ${source.id}`);
    const image = decodePng(original), crop = alphaBounds(image), contract = factionFrameContract(source.role);
    const native = encodePng(fitFactionFrame(image, crop, source.role, palette));
    const nativePath = `assets/art/source/native/${source.id}/v${source.version}/idle-se-0.png`;
    const recordPath = `${directory}/${source.id}-v${source.version}.json`, versionedBriefPath = `${directory}/${source.id}-v${source.version}.brief.json`;
    const briefPath = `assets/art/briefs/${source.id}.json`;
    const record = { ...source, schemaVersion: 1, batchId, sourceSize: [image.width, image.height], crop,
      nativeResolution: contract.native, pivot: contract.pivot, nativePath, nativeHash: sha256(native), toolHashes,
      note: 'One original built-in generated asset. Full alpha>=128 silhouette bounds retained; nearest fitting and palette normalization prepare an unreviewed candidate, not visual approval.' };
    const recordBytes = json(record);
    const manifest = parseAssetManifest({ schemaVersion: 1, id: source.id, type: contract.type, status: 'BRIEF_READY', version: source.version,
      nativeResolution: { width: contract.native, height: contract.native }, paletteId: palette.id, contentIds: [source.id], prompt: source.prompt,
      frames: [{ id: `${source.id}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: contract.pivot, sourcePath: nativePath }],
      animation: { states: { idle: { frames: 1, fps: 4, loop: false } } },
      provenance: { provider: source.provider, model: source.model, promptHash: sha256(source.prompt), sourceRefs: [source.sourcePath, recordPath],
        licenseNotes: ['Original built-in image generation commissioned for Theandril. Service terms apply; no model or provider rights independently inferred. Seed/model unavailability is recorded explicitly in retained source metadata.'] },
      createdAt: source.generatedAt, ...(source.seed === null ? {} : { seed: source.seed }),
      referenceHashes: [source.sourceHash, sha256(recordBytes), ...source.referenceHashes],
      processing: [{ tool: 'theandril-single-asset-extraction', version: '2', profile: `registered-${contract.native}`,
        settingsHash: cacheKey({ crop, contract, toolHashes, paletteHash: cacheKey(palette), method: 'nearest-pixel-center', alphaThreshold: 128 }), inputHash: source.sourceHash, outputHash: sha256(native) }],
      validation: null, review: null, constraints: { transparentPadding: 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 0, requireMotion: false, terrain: 'none' },
    });
    const briefBytes = json(manifest);
    const result: PreparedFactionSource = { id: source.id, version: source.version, sourceHash: source.sourceHash, nativeHash: sha256(native), nativePath, recordPath, versionedBriefPath, briefPath, createdPaths: [], replacedBrief: false, approved: false };
    await plan(nativePath, native, result); await plan(recordPath, recordBytes, result); await plan(versionedBriefPath, briefBytes, result);
    const active = await existing(root, briefPath);
    if (active && !same(active, briefBytes)) {
      if (!options.activateRevision) throw new Error(`Active brief differs: ${source.id}; use a new version and explicit --activate-revision.`);
      const prior = parseAssetManifest(JSON.parse(active.toString('utf8')));
      if (prior.id !== source.id || prior.version >= source.version || prior.status !== 'BRIEF_READY' || prior.review !== null) throw new Error(`Cannot replace a reviewed, foreign or non-older brief: ${source.id}`);
      const priorCopyPath = `${directory}/${source.id}-v${prior.version}.brief.json`;
      const priorCopy = await existing(root, priorCopyPath);
      if (!priorCopy || !same(priorCopy, active)) throw new Error(`Prior immutable brief missing or altered: ${source.id}`);
      await verifyPriorSources(root, prior);
    }
    await plan(briefPath, briefBytes, result, Boolean(active && options.activateRevision));
    if (await existing(root, `assets/art/approved/${source.id}.json`) && writes.some(write => write.owner === result)) throw new Error(`Approved ID is sealed: ${source.id}; preparation cannot replace its inputs or active brief.`);
    results.push(result);
  }
  // Recheck every destination before the first write. Exclusive creation also protects later races.
  for (const write of writes) {
    const now = await existing(root, write.path);
    if (now === null ? write.prior !== null : write.prior === null || !same(now, write.prior)) throw new Error(`Output changed during preparation: ${write.path}`);
  }
  if (options.write) for (const write of writes) {
    const absolute = await safeAssetPath(root, write.path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, write.bytes, { flag: write.prior ? 'w' : 'wx' });
    if (write.prior) write.owner.replacedBrief = true; else write.owner.createdPaths.push(write.path);
  }
  return results;
}

async function verifyPriorSources(root: string, manifest: AssetManifest): Promise<void> {
  const source = manifest.provenance.sourceRefs[0], record = manifest.provenance.sourceRefs[1];
  if (!source || !record || !manifest.referenceHashes.includes(sha256(await boundedRead(root, source, 64 * 1024 * 1024))) || !manifest.referenceHashes.includes(sha256(await boundedRead(root, record, 4 * 1024 * 1024)))) throw new Error(`Prior source evidence is missing or altered: ${manifest.id}`);
  const native = await boundedRead(root, manifest.frames[0]!.sourcePath, 8 * 1024 * 1024);
  if (sha256(native) !== manifest.processing[0]?.outputHash) throw new Error(`Prior native evidence is altered: ${manifest.id}`);
}

export function parseExpansionArguments(args: readonly string[]): Omit<FactionExpansionOptions, 'repoRoot'> {
  const batch = args.filter(arg => arg.startsWith('--batch='));
  const ids = args.filter(arg => arg.startsWith('--id=')).map(arg => arg.slice(5));
  if (batch.length !== 1 || new Set(args).size !== args.length || args.some(arg => !arg.startsWith('--batch=') && !arg.startsWith('--id=') && arg !== '--prepare' && arg !== '--activate-revision')) throw new Error('Usage: --batch=<batchId> [--id=<qualifiedId>] [--prepare] [--activate-revision]');
  return { batchId: batchIdSchema.parse(batch[0]!.slice(8)), ...(ids.length ? { ids } : {}), write: args.includes('--prepare'), activateRevision: args.includes('--activate-revision') };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const results = await prepareFactionExpansion({ repoRoot, ...parseExpansionArguments(process.argv.slice(2)) });
  for (const result of results) console.log(JSON.stringify(result));
}
