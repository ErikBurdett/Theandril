import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, open, readFile, readdir, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { approveAsset, assetManifestSchema, buildAtlas, cacheKey, cropImage, decodePng, encodePng, paletteSchema, parseArtLabCatalog, parseRuntimeCatalog, safeAssetPath, sha256, validateAsset, validationReportSchema, type AssetManifest, type FrameImage, type Palette, type RgbaImage, type RuntimeCatalog } from '../packages/art-pipeline/src/index';
import { validateAtlasData } from '../packages/render/src/art-validation';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tsxLoader = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
const palette: Palette = { id: 'palette.fixture', version: 1, colors: ['#222222'] };
const prompt = 'Programmatic CLI boundary fixture, not production artwork or visual approval.';

/** Exact dimensions and every RGBA byte, without recursive assertions on millions of numeric keys. */
function expectExactImage(actual: RgbaImage, expected: RgbaImage, id: string): void {
  expect(actual.width, `${id}: width`).toBe(expected.width);
  expect(actual.height, `${id}: height`).toBe(expected.height);
  expect(Buffer.from(actual.data).equals(Buffer.from(expected.data)), `${id}: exact RGBA bytes`).toBe(true);
}

async function write(root: string, path: string, value: string | Uint8Array) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), value);
}

/** Relocate the unchanged CLI so all writes target a disposable fixture root, never the actual art registry. */
async function fixture(retainApproval = false) {
  const root = await mkdtemp(join(tmpdir(), 'theandril-art-cli-'));
  await write(root, 'package.json', '{"type":"module"}');
  await write(root, 'scripts/art.ts', await readFile(join(repoRoot, 'scripts/art.ts')));
  await symlink(join(repoRoot, 'packages'), join(root, 'packages'), 'dir');
  await symlink(join(repoRoot, 'node_modules'), join(root, 'node_modules'), 'dir');
  await write(root, 'assets/palettes/theandril-master.json', JSON.stringify(palette));
  const image: RgbaImage = { width: 64, height: 64, data: new Uint8Array(64 * 64 * 4) };
  for (let y = 8; y < 56; y++) for (let x = 16; x < 48; x++) image.data.set([34, 34, 34, 255], (y * 64 + x) * 4);
  const sourcePath = 'assets/art/source/unit.test.png';
  await write(root, sourcePath, encodePng(image));
  const manifest = assetManifestSchema.parse({ schemaVersion: 1, id: 'unit.test', type: 'unit', status: 'CANDIDATE', version: 1, nativeResolution: { width: 64, height: 64 }, paletteId: palette.id, contentIds: ['unit.test'], prompt, frames: [{ id: 'unit.test/idle/se/0', direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: [32, 56], sourcePath }], animation: { states: { idle: { frames: 1, fps: 4, loop: false } } }, provenance: { provider: 'technical-test-fixture', promptHash: sha256(prompt), sourceRefs: [sourcePath], licenseNotes: ['Test-only pixels. This fixture is not reviewed production art.'] }, createdAt: '2026-09-05T00:00:00.000Z', review: null, constraints: { transparentPadding: 2, maxColors: 1, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 0, requireMotion: false, terrain: 'none' } });
  await write(root, 'assets/art/briefs/unit.test.json', JSON.stringify({ ...manifest, status: 'BRIEF_READY' }));
  await write(root, 'assets/art/candidates/unit.test.json', JSON.stringify(manifest));
  if (retainApproval) {
    const path = 'assets/art/approved/unit.test/retained-fixture/frame.png';
    await write(root, path, encodePng(image));
    await write(root, 'assets/art/approved/unit.test/retained-fixture/evidence.png', encodePng(image));
    const stable = assetManifestSchema.parse({ ...manifest, frames: [{ ...manifest.frames[0], sourcePath: path }] });
    const report = validateAsset(stable, [{ id: stable.frames[0]!.id, image }], palette);
    const approved = approveAsset(stable, report, { reviewer: 'CLI technical test fixture', reviewedAt: '2026-09-05T00:00:00.000Z', notes: 'Fixture attestation to test approval boundary; no production artwork is approved.', evidencePaths: ['assets/art/approved/unit.test/retained-fixture/evidence.png'], inputHash: report.inputHash }, 'assets/art/reports/unit.test.approved.json');
    await write(root, 'assets/art/reports/unit.test.approved.json', JSON.stringify(report));
    await write(root, 'assets/art/approved/unit.test.json', JSON.stringify(approved));
  }
  return { root, manifest, image };
}

async function cli(root: string, ...args: string[]) {
  // File descriptors retain console output even on Node versions that lose a final asynchronous pipe write.
  const stdoutPath = join(root, 'cli-stdout.txt'), stderrPath = join(root, 'cli-stderr.txt');
  const stdout = await open(stdoutPath, 'w'), stderr = await open(stderrPath, 'w');
  try {
    const code = await new Promise<number>((accept, reject) => {
      const child = spawn(process.execPath, ['--import', tsxLoader, join(root, 'scripts/art.ts'), ...args], { cwd: root, stdio: ['ignore', stdout.fd, stderr.fd] });
      const timeout = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Fixture CLI exceeded 10 second bound')); }, 10000);
      child.on('error', (error) => { clearTimeout(timeout); reject(error); });
      child.on('close', (value) => { clearTimeout(timeout); accept(value ?? -1); });
    });
    if ((await stat(stdoutPath)).size > 256 * 1024 || (await stat(stderrPath)).size > 256 * 1024) throw new Error('Fixture CLI diagnostics exceeded output budget');
    return { code, stdout: await readFile(stdoutPath, 'utf8'), stderr: await readFile(stderrPath, 'utf8') };
  } finally { await stdout.close(); await stderr.close(); }
}

describe('actual offline CLI in disposable repository fixtures', () => {
  it('validates a candidate without creating an approval or replacing an existing approval report', async () => {
    const item = await fixture(true), approvedPath = join(item.root, 'assets/art/approved/unit.test.json'), reportPath = join(item.root, 'assets/art/reports/unit.test.approved.json');
    const before = await readFile(approvedPath), reportBefore = await readFile(reportPath);
    const result = await cli(item.root, 'validate', 'unit.test');
    expect(result, result.stderr).toMatchObject({ code: 0 }); expect(result.stdout).toContain('PASS');
    expect(await readFile(approvedPath)).toEqual(before); expect(await readFile(reportPath)).toEqual(reportBefore);
    const source = assetManifestSchema.parse(JSON.parse(await readFile(join(item.root, 'assets/art/candidates/unit.test.json'), 'utf8')));
    expect(source.status).toBe('CANDIDATE'); expect(source.review).toBeNull();
  });
  it('rejects an incorrect visual-review hash before creating any approval', async () => {
    const item = await fixture();
    const result = await cli(item.root, 'review', 'unit.test', '--approve', '--hash', '0'.repeat(64), '--reviewer', 'Technical test', '--notes', 'This is deliberately the wrong reviewed input hash.', '--evidence', item.manifest.frames[0]!.sourcePath);
    expect(result.code).toBe(1); expect(result.stderr).toContain('changed since');
    await expect(stat(join(item.root, 'assets/art/approved/unit.test.json'))).rejects.toThrow();
    expect((await cli(item.root, 'status', 'unit.unknown')).code).toBe(1);
  });
  it('creates review sheets but explicitly refuses source-comparison approval', async () => {
    const item = await fixture();
    const result = await cli(item.root, 'review', 'unit.test', '--source'); expect(result, result.stderr).toMatchObject({ code: 0 });
    for (const scale of [1, 4]) expect(decodePng(await readFile(join(item.root, `assets/art/review-previews/unit.test-source-${scale}x.png`))).width).toBeGreaterThan(64);
    const rejected = await cli(item.root, 'review', 'unit.test', '--source', '--approve', '--hash', '0'.repeat(64), '--reviewer', 'Technical test', '--notes', 'Source comparison cannot approve processed output.', '--evidence', item.manifest.frames[0]!.sourcePath);
    expect(rejected.code).toBe(1); expect(rejected.stderr).toContain('not a processed candidate approval');
  });
  it('rebuilds a retained approval atlas without any cache or external art tools', async () => {
    const item = await fixture(true);
    await expect(stat(join(item.root, 'assets/art/cache'))).rejects.toThrow();
    const result = await cli(item.root, 'atlas'); expect(result, result.stderr).toMatchObject({ code: 0 });
    const catalog = parseRuntimeCatalog(JSON.parse(await readFile(join(item.root, 'assets/art/runtime/catalog.json'), 'utf8')));
    const png = await readFile(join(item.root, 'assets/art/runtime/foundation.png'));
    expect(catalog.assets.map((asset) => asset.id)).toEqual(['unit.test']); expect(sha256(png)).toBe(catalog.atlases[0]!.sha256);
    expect(await readdir(join(item.root, 'assets/art/runtime'))).toEqual(expect.arrayContaining(['catalog.json', 'foundation.json', 'foundation.png']));
    expect((await cli(item.root, 'atlas')).code).toBe(0); expect(await readFile(join(item.root, 'assets/art/runtime/foundation.png'))).toEqual(png);
  });
});

describe('published artwork and retained clean-checkout inputs', () => {
  let catalog: RuntimeCatalog;
  let inputs: { manifest: AssetManifest; frames: FrameImage[] }[];
  const bytes = new Map<string, Promise<Buffer>>();
  const retainedPaths = new Set<string>();
  const artifact = async (path: string): Promise<Buffer> => {
    expect(path, 'Released art may not depend on an ignored cache/candidate/review-preview file').not.toMatch(/(?:^|\/)(?:cache|candidates|review-previews)(?:\/|$)/);
    retainedPaths.add(path);
    let content = bytes.get(path);
    if (!content) { content = safeAssetPath(repoRoot, path).then((full) => readFile(full)); bytes.set(path, content); }
    return content;
  };
  beforeAll(async () => {
    catalog = parseRuntimeCatalog(JSON.parse((await artifact('assets/art/runtime/catalog.json')).toString()));
    expect(catalog.assets.length).toBeGreaterThan(0);
    inputs = await Promise.all(catalog.assets.map(async (runtime) => {
      const manifest = assetManifestSchema.parse(JSON.parse((await artifact(`assets/art/approved/${runtime.id}.json`)).toString()));
      return { manifest, frames: await Promise.all(manifest.frames.map(async (frame) => ({ id: frame.id, image: decodePng(await artifact(frame.sourcePath)) }))) };
    }));
    for (const { manifest } of inputs) {
      for (const path of [...manifest.provenance.sourceRefs, ...manifest.review!.evidencePaths, manifest.validation!.reportPath]) if (!/^https?:\/\//.test(path)) retainedPaths.add(path);
      for (const suffix of ['editable.aseprite', 'aseprite/sprite.png', 'aseprite/sprite.json']) retainedPaths.add(`${dirname(manifest.frames[0]!.sourcePath)}/${suffix}`);
    }
  });

  it('retains reviewed frames, evidence and original sources with fresh exact reports', async () => {
    expect(paletteSchema.parse(JSON.parse((await artifact('assets/palettes/theandril-master.json')).toString()))).toEqual(catalog.palette);
    const evidence = new Set<string>();
    for (const item of inputs) {
      const manifest = item.manifest, runtime = catalog.assets.find((asset) => asset.id === manifest.id)!;
      expect(['APPROVED', 'ATLASED', 'INTEGRATED']).toContain(manifest.status); expect(manifest.review).not.toBeNull(); expect(manifest.validation?.passed).toBe(true);
      expect(runtime.provenance).toEqual(manifest.provenance); expect(runtime.review).toEqual(manifest.review); expect(runtime.validation).toEqual(manifest.validation);
      const report = validateAsset(manifest, item.frames, catalog.palette);
      expect(report.errors, `${manifest.id}: ${report.errors.join('; ')}`).toEqual([]);
      expect(report.inputHash).toBe(manifest.review!.inputHash);
      expect(validationReportSchema.parse(JSON.parse((await artifact(manifest.validation!.reportPath)).toString()))).toEqual(report);
      for (const frame of manifest.frames) expect(frame.sourcePath).toMatch(new RegExp(`^assets/art/approved/${manifest.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[a-f0-9]{64}/frame-\\d+\\.png$`));
      for (const path of manifest.provenance.sourceRefs) if (!/^https?:\/\//.test(path)) expect((await artifact(path)).length).toBeGreaterThan(0);
      for (const path of manifest.review!.evidencePaths) evidence.add(path);
    }
    for (const path of evidence) {
      const source = await artifact(path), image = decodePng(source);
      expect(path).toBe(`assets/art/reviews/${sha256(source)}.png`);
      expect(image.width * image.height).toBeGreaterThan(0);
    }
  });

  it('preserves real editable/source exports, timings and their processing hashes', async () => {
    for (const { manifest, frames } of inputs) {
      const directory = dirname(manifest.frames[0]!.sourcePath);
      const editable = await artifact(`${directory}/editable.aseprite`), sheetBytes = await artifact(`${directory}/aseprite/sprite.png`), metadataBytes = await artifact(`${directory}/aseprite/sprite.json`);
      const tools = manifest.processing.filter((step) => step.tool === 'aseprite');
      expect(manifest.processing.some((step) => step.tool === 'spritefusion-pixel-snapper')).toBe(true);
      expect(tools).toHaveLength(2);
      expect(tools[0]!.outputHash).toBe(cacheKey([sha256(editable)]));
      expect(tools[1]!.inputHash).toBe(sha256(editable));
      expect(tools[1]!.outputHash).toBe(cacheKey([sha256(sheetBytes), sha256(metadataBytes)]));
      const sheet = decodePng(sheetBytes);
      const metadata = JSON.parse(metadataBytes.toString()) as { frames: { frame: { x: number; y: number; w: number; h: number }; sourceSize: { w: number; h: number }; duration: number; rotated: boolean; trimmed: boolean }[]; meta: { scale: string; size: { w: number; h: number } } };
      expect(metadata.meta).toMatchObject({ scale: '1', size: { w: sheet.width, h: sheet.height } });
      expect(metadata.frames).toHaveLength(frames.length);
      for (const [index, frame] of metadata.frames.entries()) {
        expect(frame.duration).toBe(manifest.frames[index]!.durationMs);
        expect(frame.rotated).toBe(false); expect(frame.trimmed).toBe(false);
        expect(frame.sourceSize).toEqual({ w: manifest.nativeResolution.width, h: manifest.nativeResolution.height });
        expectExactImage(cropImage(sheet, frame.frame), frames[index]!.image, manifest.frames[index]!.id);
      }
    }
  });

  it('rebuilds the published PNG/catalog and cross-checks browser copies and every frame pixel', async () => {
    const publicCatalog = parseRuntimeCatalog(JSON.parse((await artifact('apps/web/public/art/catalog.json')).toString()));
    expect(publicCatalog).toEqual(catalog);
    const lab = parseArtLabCatalog(JSON.parse((await artifact('apps/web/public/art/lab-catalog.json')).toString()));
    expect(lab.assets.flatMap((asset) => asset.runtime ? [asset.runtime.id] : []).sort()).toEqual(catalog.assets.map((asset) => asset.id).sort());
    for (const asset of lab.assets) if (!['APPROVED', 'ATLASED', 'INTEGRATED'].includes(asset.status)) expect(asset.runtime).toBeNull();
    for (const page of catalog.atlases) {
      expect(page.width).toBe(page.height); expect([1024, 2048]).toContain(page.width);
      const selected = inputs.filter((item) => catalog.assets.find((asset) => asset.id === item.manifest.id)!.atlasId === page.id);
      const size = page.width === 1024 ? 1024 : 2048;
      const rebuilt = buildAtlas([...selected].reverse(), { id: page.id, pageSize: size, imageUrl: page.imageUrl, jsonUrl: page.jsonUrl, palette: catalog.palette });
      const imageName = page.imageUrl.split('/').at(-1)!, jsonName = page.jsonUrl.split('/').at(-1)!;
      const png = await artifact(`assets/art/runtime/${imageName}`), raw = JSON.parse((await artifact(`assets/art/runtime/${jsonName}`)).toString());
      const runtimeAssets = catalog.assets.filter((asset) => asset.atlasId === page.id);
      expect(sha256(png)).toBe(page.sha256); expect(png.equals(Buffer.from(rebuilt.png)), `${page.id}: exact rebuilt PNG`).toBe(true); expect(raw).toEqual(rebuilt.json);
      expect(rebuilt.catalog.assets).toEqual(runtimeAssets);
      expect((await artifact(`apps/web/public/art/${imageName}`)).equals(png), `${page.id}: exact browser PNG`).toBe(true);
      expect(JSON.parse((await artifact(`apps/web/public/art/${jsonName}`)).toString())).toEqual(raw);
      const pixi = validateAtlasData(raw, page, runtimeAssets), decoded = decodePng(png);
      for (const item of selected) for (const frame of item.frames) expectExactImage(cropImage(decoded, pixi.frames[frame.id]!.frame), frame.image, frame.id);
    }
    const liveBindings = new Set(catalog.assets.flatMap((asset) => asset.contentIds));
    for (const required of ['unit.guard', 'unit.scout', 'unit.colonist', 'settlement.village', 'settlement.town', 'settlement.city', 'map.ruin', ...['ocean', 'grassland', 'temperate_forest', 'taiga', 'tundra', 'desert', 'steppe', 'marsh', 'rainforest', 'alpine'].map((biome) => `terrain.${biome}`)]) expect(liveBindings.has(required), `Missing live art binding ${required}`).toBe(true);
    expect(retainedPaths.size).toBeGreaterThan(catalog.assets.length);
  });

  it('keeps the complete published source/evidence closure outside Git ignore rules', async () => {
    const paths = [...retainedPaths].sort();
    for (let offset = 0; offset < paths.length; offset += 128) {
      const result = await new Promise<{ status: number | null; stdout: string; stderr: string }>((accept, reject) => {
        const child = spawn('git', ['check-ignore', '--no-index', '--', ...paths.slice(offset, offset + 128)], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '', stderr = '';
        const timeout = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Git ignore check exceeded 5 second bound')); }, 5000);
        child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); }); child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
        child.on('error', (error) => { clearTimeout(timeout); reject(error); });
        child.on('close', (status) => { clearTimeout(timeout); accept({ status, stdout, stderr }); });
      });
      expect(result.status, result.stderr || `Ignored release inputs: ${result.stdout}`).toBe(1);
      expect(result.stdout).toBe('');
    }
  });
});
