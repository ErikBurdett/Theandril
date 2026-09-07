import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { encodePng, paletteSchema, parseAssetManifest, sha256 } from './index';
import { FACTION_NAVAL_ART_ROLES } from './faction-art';
import { buildNavalReview, parseNavalReviewArguments } from '../../../scripts/art-naval-review';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'theandril-naval-review-')); roots.push(root);
  const put = async (path: string, bytes: string | Uint8Array) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), bytes); };
  const palette = paletteSchema.parse({ id: 'test.palette', version: 1, colors: ['#000000', '#ffffff'] });
  await put('assets/palettes/theandril-master.json', JSON.stringify(palette));
  const manifests = [];
  for (const [index, role] of FACTION_NAVAL_ART_ROLES.entries()) {
    const id = `${role}.ashen_compact`, sourcePath = `assets/art/source/${id}.png`;
    const image = { width: 96, height: 96, data: new Uint8Array(96 * 96 * 4) };
    for (let y = 24; y < 70; y++) for (let x = 30; x < 40 + index * 4; x++) image.data.set([255, 255, 255, 255], (y * 96 + x) * 4);
    const png = encodePng(image); await put(sourcePath, png);
    const manifest = parseAssetManifest({ schemaVersion: 1, id, type: 'unit', status: 'CANDIDATE', version: 1,
      nativeResolution: { width: 96, height: 96 }, paletteId: palette.id, contentIds: [id], prompt: 'Synthetic rectangle review fixture, not generated or approved production art.',
      frames: [{ id: `${id}/idle/se/0`, state: 'idle', direction: 'se', index: 0, durationMs: 250, pivot: [48, 80], sourcePath }],
      animation: { states: { idle: { frames: 1, fps: 4, loop: false } } },
      provenance: { provider: 'procedural', model: 'synthetic-test', promptHash: sha256('Synthetic rectangle review fixture, not generated or approved production art.'), sourceRefs: [sourcePath], licenseNotes: ['Test-only original geometric fixture.'] },
      createdAt: '2026-09-06T00:00:00.000Z', referenceHashes: [], processing: [], validation: null, review: null,
      constraints: { transparentPadding: 2, maxColors: 2, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 0, requireMotion: false, terrain: 'none' } });
    manifests.push(manifest); await put(`assets/art/candidates/${id}.json`, JSON.stringify(manifest));
  }
  return { root, put, manifests };
}

describe('review-only naval evidence', () => {
  it('requires an explicit boundary and bounded registered family/cohort selection', () => {
    expect(parseNavalReviewArguments(['--stage=candidate', '--cohort=1'])).toEqual({ stage: 'candidate', cohort: 1 });
    expect(parseNavalReviewArguments(['--stage=approved', '--family=ashen_compact'])).toEqual({ stage: 'approved', family: 'ashen_compact' });
    for (const args of [[], ['--family=ashen_compact'], ['--stage=candidate', '--cohort=0'], ['--stage=candidate', '--family=unknown'], ['--stage=candidate', '--family=ashen_compact', '--approve'], ['--stage=candidate', '--family=ashen_compact', '--cohort=1']]) expect(() => parseNavalReviewArguments(args)).toThrow();
  });
  it('binds repeatable native/enlarged sheets to exact candidate hashes without changing manifests', async () => {
    const { root, manifests } = await setup(), options = { stage: 'candidate' as const, family: 'ashen_compact' };
    const before = await Promise.all(manifests.map(item => readFile(join(root, `assets/art/candidates/${item.id}.json`))));
    const first = await buildNavalReview(root, options), second = await buildNavalReview(root, options);
    expect(second).toEqual(first);
    expect(first.order.map(item => item.assetId)).toEqual(['unit.coastal_warship.ashen_compact', 'unit.ocean_warship.ashen_compact', 'unit.transport.ashen_compact']);
    expect(first.order.every(item => item.status === 'CANDIDATE' && /^[a-f0-9]{64}$/.test(item.inputHash))).toBe(true);
    expect(first.sheets.map(sheet => [sheet.width, sheet.height, sheet.scale])).toEqual([[336, 112, 1], [1200, 400, 4]]);
    for (const sheet of first.sheets) expect(sha256(await readFile(join(root, sheet.path)))).toBe(sheet.sha256);
    for (const [index, manifest] of manifests.entries()) expect(await readFile(join(root, `assets/art/candidates/${manifest.id}.json`))).toEqual(before[index]);
    await expect(stat(join(root, 'assets/art/approved'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(stat(join(root, 'assets/art/runtime'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('rejects a failed pixel input before output and never substitutes another stage', async () => {
    const { root, put, manifests } = await setup();
    await expect(buildNavalReview(root, { stage: 'approved', family: 'ashen_compact' })).rejects.toMatchObject({ code: 'ENOENT' });
    const first = manifests[0]!, corrupt = { width: 96, height: 96, data: new Uint8Array(96 * 96 * 4).fill(255) };
    await put(first.frames[0]!.sourcePath, encodePng(corrupt));
    await expect(buildNavalReview(root, { stage: 'candidate', family: 'ashen_compact' })).rejects.toThrow('Failed or stale');
    await expect(stat(join(root, 'assets/art/review-previews'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
