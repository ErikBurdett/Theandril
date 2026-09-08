import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { biomeSourceSchema, biomeSourcesSchema } from './biome-source';
import { decodePng, encodePng, insideHex, paletteSchema, parseAssetManifest, sha256, validateAsset, type RgbaImage } from './index';
import { fitBiomeTile, prepareBiomeVariants } from '../../../scripts/art-biome-variants';

// These authored geometric test pixels are not generated originals or visual approvals.
const palette = paletteSchema.parse({ id: 'test.palette', version: 1, colors: ['#000000', '#ffffff'] });
const firstId = 'terrain.grassland.variant_1', secondId = 'terrain.marsh.variant_2';
const sourceDirectory = 'assets/art/source/biome-variants';
const toolHash = sha256(await readFile(fileURLToPath(new URL('../../../scripts/art-biome-variants.ts', import.meta.url))));
const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });

function hexSource(tone = 210): RgbaImage {
  const image = { width: 80, height: 80, data: new Uint8Array(80 * 80 * 4) };
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (insideHex(x, y, 64, 64)) {
    image.data.set([tone, tone, tone, 255], ((y + 8) * image.width + x + 8) * 4);
  }
  return image;
}
function enlarge(source: RgbaImage, scale: number): RgbaImage {
  const enlarged = { width: source.width * scale, height: source.height * scale, data: new Uint8Array(source.width * source.height * scale * scale * 4) };
  for (let y = 0; y < enlarged.height; y++) for (let x = 0; x < enlarged.width; x++) {
    const from = (Math.floor(y / scale) * source.width + Math.floor(x / scale)) * 4;
    enlarged.data.set(source.data.subarray(from, from + 4), (y * enlarged.width + x) * 4);
  }
  return enlarged;
}
function sourceRecord(id: string, image: RgbaImage, version = 1) {
  return biomeSourceSchema.parse({ id, version, sourcePath: `${sourceDirectory}/${id}-v${version}.png`, sourceHash: sha256(encodePng(image)),
    prompt: 'Authored isolated synthetic test hex; not an image-generation call or art approval.',
    provider: 'codex-imagegen', model: 'not-exposed-by-tool', seed: null, generatedAt: '2026-09-07T05:06:07.000Z' });
}
function paths(id: string, version = 1, preparation = toolHash.slice(0, 16)) {
  return { native: `assets/art/source/native/${id}/v${version}/${preparation}/idle-se-0.png`, record: `${sourceDirectory}/${id}-v${version}-${preparation}.json`,
    versionedBrief: `${sourceDirectory}/${id}-v${version}-${preparation}.brief.json`, brief: `assets/art/briefs/${id}.json` };
}
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'theandril-biome-source-')); roots.push(root);
  const put = async (path: string, bytes: string | Uint8Array) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), bytes); };
  const images = [hexSource(), hexSource(50)], sources = [sourceRecord(firstId, images[0]!), sourceRecord(secondId, images[1]!)];
  const index = async () => put(`${sourceDirectory}/generation.json`, JSON.stringify(sources));
  for (const [at, source] of sources.entries()) await put(source.sourcePath, encodePng(images[at]!));
  await put('assets/palettes/theandril-master.json', JSON.stringify(palette)); await index();
  return { root, put, sources, images, index, run: (ids?: readonly string[], write = false, activate = false) => prepareBiomeVariants(root, ids, write, activate) };
}
const missing = async (root: string, path: string) => expect(stat(join(root, path))).rejects.toMatchObject({ code: 'ENOENT' });

/** Test-authored previous preparation, with real matching files/seals, not historical production evidence. */
async function retainPriorPreparation(fixture: Awaited<ReturnType<typeof setup>>) {
  const { root, put, run } = fixture; await run([firstId], true);
  const current = paths(firstId), prior = paths(firstId, 1, 'fixture-old-tool');
  const native = await readFile(join(root, current.native)), record = JSON.parse(await readFile(join(root, current.record), 'utf8'));
  const manifest = parseAssetManifest(JSON.parse(await readFile(join(root, current.brief), 'utf8')));
  const priorRecord = Buffer.from(JSON.stringify({ ...record, nativePath: prior.native, toolHash: 'a'.repeat(64) }) + '\n');
  manifest.frames[0]!.sourcePath = prior.native; manifest.provenance.sourceRefs[1] = prior.record;
  manifest.referenceHashes = [fixture.sources[0]!.sourceHash, sha256(priorRecord)];
  const priorBrief = JSON.stringify(manifest, null, 2) + '\n';
  await put(prior.native, native); await put(prior.record, priorRecord); await put(prior.versionedBrief, priorBrief); await put(prior.brief, priorBrief);
  for (const path of [current.native, current.record, current.versionedBrief]) await rm(join(root, path));
  return { prior, priorBrief, native, priorRecord };
}

describe('terrain variant native fitting', () => {
  it('preserves the actual 56×64 pointy-hex mask, binary alpha, palette and detached source pixels', () => {
    const source = hexSource(), before = source.data.slice(), first = fitBiomeTile(source, palette), second = fitBiomeTile(source, palette);
    expect(first.crop).toEqual({ x: 12, y: 8, w: 56, h: 64 });
    expect(first.image).toMatchObject({ width: 64, height: 64 });
    expect(first.image.data).toEqual(second.image.data); expect(source.data).toEqual(before);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const at = (y * 64 + x) * 4;
      expect([...first.image.data.slice(at, at + 4)]).toEqual(insideHex(x, y, 64, 64) ? [255, 255, 255, 255] : [0, 0, 0, 0]);
    }
    first.image.data.fill(0); expect(source.data).toEqual(before); expect(second.image.data.some(value => value !== 0)).toBe(true);
  });
  it('accepts padded nearest-enlarged originals without changing native pixels', () => {
    const source = hexSource(), enlarged = enlarge(source, 3);
    expect(fitBiomeTile(enlarged, palette).image).toEqual(fitBiomeTile(source, palette).image);
  });
  it('rejects empty, opaque-matte and partially transparent-matte originals', () => {
    const empty = hexSource(); empty.data.fill(0);
    expect(() => fitBiomeTile(empty, palette)).toThrow(/opaque hex|transparent margins/);
    for (const alpha of [255, 1]) {
      const matte = hexSource();
      for (let at = 3; at < matte.data.length; at += 4) if (!matte.data[at]) matte.data[at] = alpha;
      expect(() => fitBiomeTile(matte, palette)).toThrow(/transparent margins/);
    }
  });
  it.each([[0, 40], [79, 40], [40, 0], [40, 79]])('rejects a visible clipped pixel at source edge %i,%i', (x, y) => {
    const clipped = hexSource(); clipped.data.set([255, 255, 255, 255], (y * clipped.width + x) * 4);
    expect(() => fitBiomeTile(clipped, palette)).toThrow(/Clipped/);
  });
  it('rejects a padded opaque rectangle instead of cutting a nonhex source into a hex', () => {
    const rectangle = hexSource();
    for (let y = 8; y < 72; y++) for (let x = 12; x < 68; x++) rectangle.data.set([210, 210, 210, 255], (y * 80 + x) * 4);
    expect(() => fitBiomeTile(rectangle, palette)).toThrow(/hex|silhouette/i);
  });
  it.each([1, 12])('rejects a fully enclosed %i-pixel-wide alpha hole, rather than treating it as edge fitting', width => {
    const source = hexSource(), start = 40 - Math.floor(width / 2);
    for (let y = start; y < start + width; y++) for (let x = start; x < start + width; x++) source.data.fill(0, (y * 80 + x) * 4, (y * 80 + x) * 4 + 4);
    expect(() => fitBiomeTile(source, palette)).toThrow(/interior|hole/i);
  });
  it('rejects an original interior hole even when nearest fitting would skip that source pixel', () => {
    const source = enlarge(hexSource(), 3), at = (120 * source.width + 120) * 4;
    source.data.fill(0, at, at + 4);
    expect(() => fitBiomeTile(source, palette)).toThrow(/interior|hole/i);
  });
});

describe('registered biome originals and immutable unapproved preparation', () => {
  it('accepts exactly the current twelve biome names and two variants without needing published new assets', () => {
    const biomes = ['ocean', 'grassland', 'temperate_forest', 'taiga', 'tundra', 'desert', 'steppe', 'marsh', 'rainforest', 'alpine', 'ash_scrub', 'chalkland'];
    const entries = biomes.flatMap(biome => [1, 2].map(variant => sourceRecord(`terrain.${biome}.variant_${variant}`, hexSource())));
    expect(biomeSourcesSchema.parse(entries)).toHaveLength(24);
    for (const id of ['terrain.grassland', 'terrain.plains.variant_1', 'terrain.marsh.variant_0', 'terrain.marsh.variant_3', 'unit.guard.variant_1']) {
      const source = { ...entries[0], id, sourcePath: `${sourceDirectory}/${id}-v1.png` };
      expect(() => biomeSourceSchema.parse(source)).toThrow(/Unregistered/);
    }
    expect(() => biomeSourcesSchema.parse([...entries, entries[0]])).toThrow();
  });
  it('rejects malformed provenance, arbitrary paths and unexposed invented metadata', () => {
    const base = sourceRecord(firstId, hexSource());
    for (const patch of [{ version: 0 }, { version: 100 }, { sourceHash: 'not-a-hash' }, { sourceHash: 'A'.repeat(64) }, { prompt: '' },
      { generatedAt: 'yesterday' }, { provider: 'invented' }, { model: 'invented-model' }, { seed: 123 }, { approval: true },
      { sourcePath: '../escape.png' }, { sourcePath: '/tmp/original.png' }, { sourcePath: `${sourceDirectory}/${firstId}-v2.png` }]) {
      expect(() => biomeSourceSchema.parse({ ...base, ...patch })).toThrow();
    }
  });
  it('is import-safe and dry-run only by default, without candidates, approvals or publication', async () => {
    const { root, run } = await setup();
    expect(await run()).toMatchObject([{ id: firstId, prepared: false, approved: false }, { id: secondId, prepared: false, approved: false }]);
    for (const id of [firstId, secondId]) for (const path of Object.values(paths(id))) await missing(root, path);
    for (const stage of ['candidates', 'approved', 'runtime']) await missing(root, `assets/art/${stage}`);
    await missing(root, 'apps/web/public/art');
  });
  it('retains exact original, prompt, tool and native hashes with one canonical static unreviewed hex frame', async () => {
    const { root, put, sources, run } = await setup();
    const protectedPaths = ['assets/art/approved/terrain.grassland.json', 'assets/art/runtime/catalog.json', 'apps/web/public/art/catalog.json', 'assets/art/briefs/terrain.grassland.json'];
    for (const path of protectedPaths) await put(path, `Existing retained sentinel ${path}`);
    expect(await run([firstId], true)).toMatchObject([{ id: firstId, prepared: true, approved: false }]);
    const target = paths(firstId), nativeBytes = await readFile(join(root, target.native)), recordBytes = await readFile(join(root, target.record));
    const manifest = parseAssetManifest(JSON.parse(await readFile(join(root, target.brief), 'utf8'))), image = decodePng(nativeBytes);
    expect(manifest).toMatchObject({ id: firstId, type: 'terrain', status: 'BRIEF_READY', version: 1, nativeResolution: { width: 64, height: 64 }, contentIds: [firstId],
      prompt: sources[0]!.prompt, createdAt: sources[0]!.generatedAt, review: null, validation: null, constraints: { binaryAlpha: true, terrain: 'hex', transparentPadding: 0 } });
    expect(manifest.frames).toEqual([{ id: `${firstId}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: [32, 32], sourcePath: target.native }]);
    expect(manifest.animation.states).toEqual({ idle: { frames: 1, fps: 4, loop: false } });
    expect(manifest.referenceHashes).toEqual([sources[0]!.sourceHash, sha256(recordBytes)]);
    expect(manifest.provenance).toMatchObject({ provider: 'codex-imagegen', model: 'not-exposed-by-tool', promptHash: sha256(sources[0]!.prompt), sourceRefs: [sources[0]!.sourcePath, target.record] });
    expect(manifest.processing[0]).toMatchObject({ inputHash: sources[0]!.sourceHash, outputHash: sha256(nativeBytes), settingsHash: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(JSON.parse(recordBytes.toString())).toMatchObject({ ...sources[0], nativeHash: sha256(nativeBytes), toolHash: sha256(await readFile(fileURLToPath(new URL('../../../scripts/art-biome-variants.ts', import.meta.url)))) });
    expect(validateAsset(manifest, [{ id: manifest.frames[0]!.id, image }], palette).passed).toBe(true);
    expect(await readFile(join(root, target.versionedBrief))).toEqual(await readFile(join(root, target.brief)));
    expect(sha256(await readFile(join(root, sources[0]!.sourcePath)))).toBe(sources[0]!.sourceHash);
    for (const path of protectedPaths) expect(await readFile(join(root, path), 'utf8')).toBe(`Existing retained sentinel ${path}`);
    expect(await readdir(join(root, 'assets/art/approved'))).toEqual(['terrain.grassland.json']);
    await missing(root, paths(secondId).brief); await missing(root, 'assets/art/candidates');
  });
  it('exact repeats are no-op audits retaining all bytes and modification times', async () => {
    const { root, run } = await setup(); await run(undefined, true);
    const files = [firstId, secondId].flatMap(id => Object.values(paths(id)));
    const before = await Promise.all(files.map(async path => ({ bytes: await readFile(join(root, path)), modified: (await stat(join(root, path), { bigint: true })).mtimeNs })));
    await run(undefined, true);
    for (const [index, path] of files.entries()) {
      expect(await readFile(join(root, path))).toEqual(before[index]!.bytes);
      expect((await stat(join(root, path), { bigint: true })).mtimeNs).toBe(before[index]!.modified);
    }
  });
  it('checks all selected source hashes before writing any earlier asset; a valid subset can still prepare', async () => {
    const { root, put, sources, run } = await setup(); await put(sources[1]!.sourcePath, encodePng(hexSource(99)));
    await expect(run(undefined, true)).rejects.toThrow(/source hash mismatch/);
    for (const path of Object.values(paths(firstId))) await missing(root, path);
    expect(await run([firstId], true)).toHaveLength(1);
  });
  it.each(['native', 'record', 'versionedBrief', 'brief'] as const)('preflights a late immutable %s conflict before writing the first selected asset', async kind => {
    const { root, put, run } = await setup(), blocked = paths(secondId)[kind]; await put(blocked, 'Retained conflicting evidence');
    await expect(run(undefined, true)).rejects.toThrow(/Immutable output conflict/);
    for (const path of Object.values(paths(firstId))) await missing(root, path);
    expect(await readFile(join(root, blocked), 'utf8')).toBe('Retained conflicting evidence');
  });
  it('refuses changing an active brief to a new source version, preserving prior version evidence', async () => {
    const { root, put, sources, index, run } = await setup(); await run([firstId], true);
    const before = await readFile(join(root, paths(firstId).brief));
    sources[0] = sourceRecord(firstId, hexSource(60), 2); await put(sources[0].sourcePath, encodePng(hexSource(60))); await index();
    await expect(run([firstId], true)).rejects.toThrow(/Immutable output conflict/);
    expect(await readFile(join(root, paths(firstId).brief))).toEqual(before);
    expect(await readFile(join(root, paths(firstId).versionedBrief))).toEqual(before);
    await missing(root, paths(firstId, 2).native);
  });
  it('requires explicit same-source preparation activation and preserves all prior immutable evidence', async () => {
    const fixture = await setup(), { root, run } = fixture, { prior, priorBrief, native, priorRecord } = await retainPriorPreparation(fixture);
    await expect(run([firstId], true)).rejects.toThrow(/activate-preparation/);
    await missing(root, paths(firstId).native);
    await run([firstId], false, true); // Approval to inspect activation is not approval to write.
    expect(await readFile(join(root, prior.brief), 'utf8')).toBe(priorBrief); await missing(root, paths(firstId).native);
    expect(await run([firstId], true, true)).toMatchObject([{ id: firstId, prepared: true, approved: false }]);
    expect(await readFile(join(root, prior.native))).toEqual(native);
    expect(await readFile(join(root, prior.record))).toEqual(priorRecord);
    expect(await readFile(join(root, prior.versionedBrief), 'utf8')).toBe(priorBrief);
    const active = await readFile(join(root, paths(firstId).brief));
    expect(active).toEqual(await readFile(join(root, paths(firstId).versionedBrief)));
    const modified = (await stat(join(root, paths(firstId).brief), { bigint: true })).mtimeNs;
    await run([firstId], true, true);
    expect((await stat(join(root, paths(firstId).brief), { bigint: true })).mtimeNs).toBe(modified);
    await missing(root, 'assets/art/approved'); await missing(root, 'assets/art/runtime');
  });
  it.each(['native', 'record', 'versionedBrief'] as const)('rejects preparation activation with altered prior %s before any new outputs', async kind => {
    const fixture = await setup(), { root, put, run } = fixture, { prior, priorBrief } = await retainPriorPreparation(fixture);
    await put(prior[kind], 'Altered immutable evidence');
    await expect(run(undefined, true, true)).rejects.toThrow(/Prior immutable preparation evidence/);
    for (const id of [firstId, secondId]) await missing(root, paths(id).native);
    expect(await readFile(join(root, prior.brief), 'utf8')).toBe(priorBrief);
  });
  it('cannot activate preparation over an approved ID, even when retained inputs are exact', async () => {
    const fixture = await setup(), { root, put, run } = fixture, { priorBrief } = await retainPriorPreparation(fixture);
    const approval = `assets/art/approved/${firstId}.json`; await put(approval, 'Sealed approval sentinel');
    await expect(run(undefined, true, true)).rejects.toThrow(/Approved ID is sealed/);
    await missing(root, paths(firstId).native); await missing(root, paths(secondId).native);
    expect(await readFile(join(root, approval), 'utf8')).toBe('Sealed approval sentinel');
    expect(await readFile(join(root, paths(firstId).brief), 'utf8')).toBe(priorBrief);
  });
  it('cannot activate a different original under a same-version prior preparation', async () => {
    const fixture = await setup(), { root, put, sources, index, run } = fixture, { priorBrief } = await retainPriorPreparation(fixture);
    sources[0] = sourceRecord(firstId, hexSource(70)); await put(sources[0].sourcePath, encodePng(hexSource(70))); await index();
    await expect(run([firstId], true, true)).rejects.toThrow(/Prior immutable preparation evidence/);
    await missing(root, paths(firstId).native);
    expect(await readFile(join(root, paths(firstId).brief), 'utf8')).toBe(priorBrief);
  });
  it('preflights later conflicts before replacing an earlier active preparation', async () => {
    const fixture = await setup(), { root, put, run } = fixture, { priorBrief } = await retainPriorPreparation(fixture);
    await put(paths(secondId).record, 'Unrelated retained conflict');
    await expect(run(undefined, true, true)).rejects.toThrow(/Immutable output conflict/);
    expect(await readFile(join(root, paths(firstId).brief), 'utf8')).toBe(priorBrief);
    await missing(root, paths(firstId).native); await missing(root, paths(secondId).native);
    expect(await readFile(join(root, paths(secondId).record), 'utf8')).toBe('Unrelated retained conflict');
  });
  it.each(['status', 'version'] as const)('does not activate a prior brief with a different %s contract', async field => {
    const fixture = await setup(), { root, put, run } = fixture, { prior, priorBrief } = await retainPriorPreparation(fixture);
    const old = JSON.parse(priorBrief); old[field] = field === 'status' ? 'CANDIDATE' : 2;
    const bytes = JSON.stringify(old); await put(prior.brief, bytes); await put(prior.versionedBrief, bytes);
    await expect(run([firstId], true, true)).rejects.toThrow(/unreviewed preparation of the same source version/);
    await missing(root, paths(firstId).native);
    expect(await readFile(join(root, prior.brief), 'utf8')).toBe(bytes);
  });
  it.each(['id', 'sourceHash', 'sourcePath'] as const)('rejects duplicate %s origins before preparing any pixels', async key => {
    const { root, sources, index, run } = await setup(); sources[1]![key] = sources[0]![key]; await index();
    await expect(run(undefined, true)).rejects.toThrow(); await missing(root, paths(firstId).native);
  });
  it('rejects unknown selection before writes and rejects a symlinked selected original', async () => {
    const { root, put, sources, run } = await setup();
    await expect(run(['terrain.no_such_biome.variant_1'], true)).rejects.toThrow(/Unknown terrain source ID/);
    // Replace only this test's authored source with a symlink to another test-owned file.
    await rm(join(root, sources[1]!.sourcePath)); await put('elsewhere/original.png', encodePng(hexSource(50)));
    await symlink(join(root, 'elsewhere/original.png'), join(root, sources[1]!.sourcePath));
    await expect(run(undefined, true)).rejects.toThrow(/Symlinked/); await missing(root, paths(firstId).native);
  });
  it('rejects symlinked output components before writing any other selected output', async () => {
    const { root, run } = await setup(); await mkdir(join(root, 'assets/art/source/native'), { recursive: true });
    await symlink(join(root, 'assets/palettes'), join(root, `assets/art/source/native/${secondId}`));
    await expect(run(undefined, true)).rejects.toThrow(/Symlinked/); await missing(root, paths(firstId).native);
    await missing(root, 'assets/palettes/v1/idle-se-0.png');
  });
});
