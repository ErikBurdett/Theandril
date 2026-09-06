import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { encodePng, paletteSchema, parseAssetManifest, sha256 } from './index';
import { factionExpansionBatchSchema, parseExpansionArguments, prepareFactionExpansion, type FactionExpansionBatch } from '../../../scripts/art-faction-expansion';

const roots: string[] = [], batchId = 'cohort12';
const directory = `assets/art/source/faction-expansion/${batchId}`;
const guardId = 'unit.guard.mire_courts', scoutId = 'unit.scout.mire_courts';
const palette = paletteSchema.parse({ id: 'test.palette', version: 1, colors: ['#000000', '#ffffff'] });
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
function pixels(width = 12): Uint8Array {
  const image = { width: 96, height: 96, data: new Uint8Array(96 * 96 * 4) };
  for (let y = 30; y < 65; y++) for (let x = 30; x < 30 + width; x++) image.data.set([255, 255, 255, 255], (y * 96 + x) * 4);
  return encodePng(image);
}
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'theandril-faction-expansion-')); roots.push(root);
  const put = async (path: string, value: string | Uint8Array) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), value); };
  const source = (role: 'unit.guard' | 'unit.scout', bytes: Uint8Array, version = 1): FactionExpansionBatch['sources'][number] => ({
    id: `${role}.mire_courts`, role, family: 'mire_courts', version,
    sourcePath: `${directory}/${role}.mire_courts-v${version}.png`, sourceHash: sha256(bytes),
    prompt: 'Synthetic isolated test rectangle, not generated art or visual approval.', provider: 'codex-imagegen', model: 'not-exposed-by-tool', seed: null,
    generatedAt: '2026-09-06T13:14:15.000Z', referenceHashes: [],
  });
  const batch: FactionExpansionBatch = { schemaVersion: 1, batchId, sources: [source('unit.guard', pixels()), source('unit.scout', pixels(16))] };
  const index = async () => put(`${directory}/generation.json`, JSON.stringify(batch));
  await put('assets/palettes/theandril-master.json', JSON.stringify(palette));
  await put(batch.sources[0]!.sourcePath, pixels()); await put(batch.sources[1]!.sourcePath, pixels(16)); await index();
  return { root, put, batch, source, index, run: (options = {}) => prepareFactionExpansion({ repoRoot: root, batchId, ...options }) };
}
const missing = async (root: string, path: string) => expect(stat(join(root, path))).rejects.toMatchObject({ code: 'ENOENT' });

describe('individual faction expansion preflight and immutable provenance', () => {
  it('is import-safe and defaults to a read-only dry run', async () => {
    const { root, run } = await setup();
    const results = await run();
    expect(results.map(result => result.id)).toEqual([guardId, scoutId]);
    for (const result of results) {
      expect(result.createdPaths).toEqual([]); expect(result.approved).toBe(false);
      await missing(root, result.nativePath); await missing(root, result.briefPath); await missing(root, result.recordPath);
    }
  });
  it('retains exact timestamps, source/record hashes and static contracts while leaving old artifacts untouched', async () => {
    const { root, put, batch, run } = await setup();
    await put('assets/art/briefs/unit.guard.iron_covenant.json', 'old brief');
    await put('assets/art/approved/unit.guard.iron_covenant.json', 'old approval');
    await put('assets/art/faction-index.json', 'old index');
    const [result] = await run({ ids: [guardId], write: true });
    expect(result!.createdPaths).toHaveLength(4);
    const manifest = parseAssetManifest(JSON.parse(await readFile(join(root, result!.briefPath), 'utf8')));
    expect(manifest.createdAt).toBe(batch.sources[0]!.generatedAt);
    expect(manifest.status).toBe('BRIEF_READY'); expect(manifest.review).toBeNull(); expect(manifest.validation).toBeNull();
    expect(manifest.frames[0]).toMatchObject({ sourcePath: result!.nativePath, pivot: [32, 56], direction: 'se', index: 0, durationMs: 250 });
    expect(manifest.animation.states).toEqual({ idle: { frames: 1, fps: 4, loop: false } });
    expect(manifest.referenceHashes).toEqual([batch.sources[0]!.sourceHash, sha256(await readFile(join(root, result!.recordPath)))]);
    expect(manifest.processing[0]).toMatchObject({ tool: 'theandril-single-asset-extraction', version: '2', inputHash: batch.sources[0]!.sourceHash, outputHash: sha256(await readFile(join(root, result!.nativePath))) });
    expect(JSON.parse(await readFile(join(root, result!.recordPath), 'utf8')).toolHashes.fitter).toMatch(/^[a-f0-9]{64}$/);
    expect(await readFile(join(root, result!.versionedBriefPath))).toEqual(await readFile(join(root, result!.briefPath)));
    expect(await readFile(join(root, 'assets/art/briefs/unit.guard.iron_covenant.json'), 'utf8')).toBe('old brief');
    expect(await readFile(join(root, 'assets/art/approved/unit.guard.iron_covenant.json'), 'utf8')).toBe('old approval');
    expect(await readFile(join(root, 'assets/art/faction-index.json'), 'utf8')).toBe('old index');
    await missing(root, `assets/art/briefs/${scoutId}.json`);
  });
  it('performs no writes on an exact repeat, preserving file timestamps and bytes', async () => {
    const { root, run } = await setup();
    const first = await run({ write: true }), paths = first.flatMap(result => result.createdPaths);
    const before = await Promise.all(paths.map(async path => ({ bytes: await readFile(join(root, path)), time: (await stat(join(root, path), { bigint: true })).mtimeNs })));
    expect((await run({ write: true })).every(result => result.createdPaths.length === 0 && !result.replacedBrief)).toBe(true);
    for (const [index, path] of paths.entries()) {
      expect(await readFile(join(root, path))).toEqual(before[index]!.bytes);
      expect((await stat(join(root, path), { bigint: true })).mtimeNs).toBe(before[index]!.time);
    }
  });
  it('preflights every selected original before any output and permits a smaller valid selection', async () => {
    const { root, put, batch, run } = await setup();
    await put(batch.sources[1]!.sourcePath, pixels(17));
    await expect(run({ write: true })).rejects.toThrow(`Original source hash mismatch: ${scoutId}`);
    await missing(root, `assets/art/source/native/${guardId}`); await missing(root, `assets/art/briefs/${guardId}.json`);
    expect((await run({ ids: [guardId], write: true }))[0]!.createdPaths).toHaveLength(4);
  });
  it('preflights every destination collision before the first write', async () => {
    const { root, put, run } = await setup();
    await put(`assets/art/briefs/${scoutId}.json`, 'foreign existing brief');
    await expect(run({ write: true })).rejects.toThrow('Active brief differs');
    await missing(root, `assets/art/source/native/${guardId}`); await missing(root, `${directory}/${guardId}-v1.json`);
    expect(await readFile(join(root, `assets/art/briefs/${scoutId}.json`), 'utf8')).toBe('foreign existing brief');
  });
  it('rejects altered immutable native pixels without repairing or overwriting them', async () => {
    const { root, put, run } = await setup();
    const [first] = await run({ ids: [guardId], write: true });
    await put(first!.nativePath, pixels(19));
    await expect(run({ ids: [guardId], write: true })).rejects.toThrow('Immutable output conflict');
    expect(await readFile(join(root, first!.nativePath))).toEqual(Buffer.from(pixels(19)));
  });
  it('protects an approved ID while permitting an exact no-op audit of its retained preparation', async () => {
    const { root, put, run } = await setup();
    const [first] = await run({ ids: [guardId], write: true });
    await put(`assets/art/approved/${guardId}.json`, 'sealed approval marker');
    expect((await run({ ids: [guardId], write: true }))[0]!.createdPaths).toEqual([]);
    expect(await readFile(join(root, first!.briefPath))).toEqual(await readFile(join(root, first!.versionedBriefPath)));
    await put(`assets/art/approved/${scoutId}.json`, 'another sealed approval marker');
    await expect(run({ ids: [scoutId], write: true })).rejects.toThrow('Approved ID is sealed');
    await missing(root, `assets/art/source/native/${scoutId}`);
    expect(await readFile(join(root, `assets/art/approved/${scoutId}.json`), 'utf8')).toBe('another sealed approval marker');
  });
  it('requires explicit activation for a newer source and retains all prior evidence', async () => {
    const { root, put, batch, source, index, run } = await setup();
    const [first] = await run({ ids: [guardId], write: true });
    const originalBrief = await readFile(join(root, first!.briefPath));
    batch.sources[0] = source('unit.guard', pixels(20), 2); await put(batch.sources[0].sourcePath, pixels(20)); await index();
    await expect(run({ ids: [guardId], write: true })).rejects.toThrow('--activate-revision');
    await missing(root, `assets/art/source/native/${guardId}/v2`);
    const [next] = await run({ ids: [guardId], write: true, activateRevision: true });
    expect(next!.replacedBrief).toBe(true); expect(next!.createdPaths).toHaveLength(3);
    expect(await readFile(join(root, first!.versionedBriefPath))).toEqual(originalBrief);
    expect(sha256(await readFile(join(root, first!.nativePath)))).toBe(first!.nativeHash);
    expect(JSON.parse(await readFile(join(root, next!.briefPath), 'utf8')).version).toBe(2);
    expect((await run({ ids: [guardId], write: true }))[0]!.createdPaths).toEqual([]);
  });
  it('refuses revision activation when retained previous evidence has changed', async () => {
    const { root, put, batch, source, index, run } = await setup();
    const [first] = await run({ ids: [guardId], write: true });
    await put(first!.recordPath, '{}');
    batch.sources[0] = source('unit.guard', pixels(20), 2); await put(batch.sources[0].sourcePath, pixels(20)); await index();
    await expect(run({ ids: [guardId], write: true, activateRevision: true })).rejects.toThrow('Prior source evidence');
    await missing(root, `assets/art/source/native/${guardId}/v2`);
  });
  it('rejects symlinked output components before writing another selected asset', async () => {
    const { root, run } = await setup();
    await mkdir(join(root, 'assets/art/source/native'), { recursive: true });
    await symlink(join(root, 'assets/palettes'), join(root, `assets/art/source/native/${scoutId}`));
    await expect(run({ write: true })).rejects.toThrow('Symlinked');
    await missing(root, `assets/art/source/native/${guardId}`);
  });
  it('rejects edge-clipped and opaque originals rather than erasing their backgrounds', async () => {
    const { root, put, batch, index, run } = await setup();
    for (const opaque of [false, true]) {
      const image = { width: 32, height: 32, data: new Uint8Array(32 * 32 * 4) };
      if (opaque) for (let at = 0; at < image.data.length; at += 4) image.data.set([255, 255, 255, 255], at);
      else image.data.set([255, 255, 255, 255], 0);
      const bytes = encodePng(image); batch.sources[0]!.sourceHash = sha256(bytes); await put(batch.sources[0]!.sourcePath, bytes); await index();
      await expect(run({ ids: [guardId], write: true })).rejects.toThrow(opaque ? 'transparent margins' : 'canvas edge');
      await missing(root, `assets/art/briefs/${guardId}.json`);
    }
  });
  it('validates bounded source identity, unique originals, timestamps and selection before writing', async () => {
    const { batch, run } = await setup();
    expect(() => factionExpansionBatchSchema.parse({ ...batch, secret: 'must not be recorded' })).toThrow();
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [batch.sources[0], batch.sources[0]] })).toThrow('Duplicate source');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [{ ...batch.sources[0], family: 'iron_covenant', id: 'unit.guard.iron_covenant' }] })).toThrow('Unregistered expansion');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [{ ...batch.sources[0], sourcePath: '../escape.png' }] })).toThrow('Unregistered original');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [{ ...batch.sources[0], generatedAt: 'unknown' }] })).toThrow();
    await expect(run({ ids: [guardId, guardId] })).rejects.toThrow('Unknown or duplicate');
    await expect(run({ ids: ['unit.guard.no_such_family'] })).rejects.toThrow('Unknown or duplicate');
  });
  it('accepts only explicit bounded CLI switches and never treats preparation as approval', () => {
    expect(parseExpansionArguments(['--batch=cohort12', `--id=${guardId}`, '--prepare'])).toEqual({ batchId, ids: [guardId], write: true, activateRevision: false });
    for (const args of [[], ['--batch=../bad'], ['--batch=cohort12', '--approve'], ['--batch=cohort12', '--batch=cohort12']]) expect(() => parseExpansionArguments(args)).toThrow();
  });
});
