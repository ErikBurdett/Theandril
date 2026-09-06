import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { decodePng, encodePng, paletteSchema, parseAssetManifest, sha256, type RgbaImage } from './index';
import { FACTION_ART_ROLES } from './faction-art';
import { extractFactionSheet, factionFrameContract, factionCropContactSheet, inspectFactionCrops, inspectFactionSheet, parseFactionArguments, prepareFactionArt, prepareFactionCropEvidence, proposeFactionCrops, FACTION_SHEET_ROLES } from '../../../scripts/art-factions';

const palette = paletteSchema.parse({ id: 'test.palette', version: 1, colors: ['#000000', '#ffffff'], ramps: {} });
const temporaryRoots: string[] = [];
afterEach(async () => { for (const root of temporaryRoots.splice(0)) await rm(root, { recursive: true, force: true }); });
function source(width = 128): RgbaImage {
  const image = { width, height: width, data: new Uint8Array(width * width * 4) };
  for (let i = 0; i < 15; i++) {
    const left = Math.floor(i % 4 * width / 4) + 10, top = Math.floor(Math.floor(i / 4) * width / 4) + 6;
    for (let y = top; y < top + 20; y++) for (let x = left; x < left + 10; x++) image.data.set([220, 220, 220, 255], (y * width + x) * 4);
  }
  return image;
}
async function setup(image = source()) {
  const root = await mkdtemp(join(tmpdir(), 'theandril-faction-extraction-')); temporaryRoots.push(root);
  async function put(path: string, data: string | Uint8Array) { const absolute = join(root, path); await mkdir(dirname(absolute), { recursive: true }); await writeFile(absolute, data); }
  await put('assets/palettes/theandril-master.json', JSON.stringify(palette));
  await put('assets/art/source/faction-generation-prompts.json', JSON.stringify({ schemaVersion: 1, provider: 'codex-imagegen', model: 'not-exposed-by-tool', seed: null, prompts: { reedbound_council: 'Exact original test fixture prompt.', ashen_compact: 'Rejected original prompt.' }, licenseNotes: ['Authored synthetic test pixels, not production approvals.'] }));
  await put('assets/art/source/factions/reedbound_council-v1.png', encodePng(image));
  return { root, put };
}

describe('faction source preparation', () => {
  it('uses the exact prompt order while preserving every registered qualified role', () => {
    expect(new Set(FACTION_SHEET_ROLES)).toEqual(new Set(FACTION_ART_ROLES));
    expect(FACTION_SHEET_ROLES.slice(12)).toEqual(['ui.crest', 'ui.banner', 'ui.badge']);
    expect(parseFactionArguments(['--family=glass_tide'])).toEqual(['glass_tide']);
    expect(() => parseFactionArguments(['--family=../ashen_compact-v1-rejected'])).toThrow('Unknown faction');
    expect(() => parseFactionArguments(['--family=glass_tide', '--approve'])).toThrow('Usage');
  });
  it('partitions odd provider dimensions without losing pixels and creates deterministic padded native PNGs', () => {
    const image = decodePng(encodePng(source(130))), report = inspectFactionSheet(image);
    expect(report.errors).toEqual([]);
    expect(report.cells.reduce((sum, cell) => sum + cell.rect.w * cell.rect.h, 0)).toBe(130 * 130);
    const first = extractFactionSheet(image, palette), second = extractFactionSheet(image, palette);
    expect(first.frames).toHaveLength(15);
    for (let index = 0; index < first.frames.length; index++) {
      const frame = first.frames[index]!, contract = factionFrameContract(frame.role);
      expect(sha256(encodePng(frame.image))).toBe(sha256(encodePng(second.frames[index]!.image)));
      expect(frame.image.width).toBe(contract.native);
      expect(frame.nativeBounds.x).toBeGreaterThanOrEqual(2); expect(frame.nativeBounds.y).toBeGreaterThanOrEqual(2);
      expect(frame.nativeBounds.x + frame.nativeBounds.w).toBeLessThanOrEqual(contract.native - 2);
      expect(frame.nativeBounds.y + frame.nativeBounds.h).toBeLessThanOrEqual(contract.native - 2);
      for (let at = 0; at < frame.image.data.length; at += 4) {
        expect([0, 255]).toContain(frame.image.data[at + 3]);
        expect([0, 255]).toContain(frame.image.data[at]);
      }
    }
    expect(factionFrameContract('unit.cavalry')).toMatchObject({ native: 96, pivot: [48, 80] });
    expect(factionFrameContract('settlement.city')).toMatchObject({ native: 128, pivot: [64, 112] });
    expect(factionFrameContract('ui.badge')).toMatchObject({ native: 32, pivot: [16, 16] });
    expect(factionFrameContract('ui.banner')).toMatchObject({ native: 64, pivot: [32, 56] });
  });
  it('rejects even a small visible spill into the empty cell, fully opaque backgrounds and missing roles', () => {
    const spill = source(); spill.data.set([1, 1, 1, 128], (97 * 128 + 97) * 4);
    expect(() => extractFactionSheet(spill, palette)).toThrow('Cell 16 must be empty; found 1');
    const opaque = source(); for (let at = 3; at < opaque.data.length; at += 4) opaque.data[at] = 255;
    expect(inspectFactionSheet(opaque).errors.join(' ')).toContain('lacks genuine transparent margins');
    const missing = source(); for (let y = 0; y < 32; y++) missing.data.fill(0, y * 128 * 4, (y * 128 + 32) * 4);
    expect(() => extractFactionSheet(missing, palette)).toThrow('Cell 1 (unit.colonist) is empty');
  });
  it('proposes explicit component crops that retain detached details, rejecting overlap and omitted pixels', () => {
    const image = source(); image.data.set([220, 220, 220, 255], (29 * 128 + 12) * 4);
    const crops = proposeFactionCrops(image), report = inspectFactionCrops(image, crops);
    expect(report.errors).toEqual([]); expect(crops[0]!.rect).toEqual({ x: 10, y: 6, w: 10, h: 24 });
    const omitted = structuredClone(crops); omitted[0]!.rect.h--;
    expect(inspectFactionCrops(image, omitted).errors.join(' ')).toContain('1 visible source pixels omitted');
    const overlap = structuredClone(crops); overlap[0]!.rect.w = 50;
    expect(inspectFactionCrops(image, overlap).errors.join(' ')).toContain('overlaps another role');
    const extracted = extractFactionSheet(image, palette, crops);
    const native = factionCropContactSheet(extracted.frames, 1), enlarged = factionCropContactSheet(extracted.frames, 4);
    expect(enlarged.width).toBe(native.width * 4);
    for (const [x, y] of [[0, 0], [72, 72], [432, 72], [210, 420]] as const) {
      const sourceAt = (y * native.width + x) * 4, enlargedAt = (y * 4 * enlarged.width + x * 4) * 4;
      expect(enlarged.data.slice(enlargedAt, enlargedAt + 4)).toEqual(native.data.slice(sourceAt, sourceAt + 4));
    }
  });
  it('isolates overlapping rectangles only through complete disconnected component masks, without pixel loss', () => {
    const image = source();
    for (let y = 32; y < 96; y++) image.data.fill(0, (y * 128 + 96) * 4, (y * 128 + 128) * 4);
    const paint = (left: number, top: number, w: number, h: number) => {
      for (let y = top; y < top + h; y++) for (let x = left; x < left + w; x++) image.data.set([220, 220, 220, 255], (y * 128 + x) * 4);
    };
    paint(100, 38, 5, 32); paint(100, 38, 20, 5);
    paint(110, 64, 14, 5); paint(119, 64, 5, 27);
    expect(() => proposeFactionCrops(image)).toThrow('overlaps another role');
    const crops = proposeFactionCrops(image, true);
    expect(crops.filter((crop) => crop.componentIds).map((crop) => crop.role)).toEqual(['character.surveyor', 'settlement.city']);
    const report = inspectFactionCrops(image, crops);
    expect(report.errors).toEqual([]);
    const visible = image.data.reduce((sum, value, at) => sum + (at % 4 === 3 && value >= 128 ? 1 : 0), 0);
    expect(report.cells.reduce((sum, cell) => sum + cell.visiblePixels, 0)).toBe(visible);
    expect(extractFactionSheet(image, palette, crops).frames).toHaveLength(15);
    const wrong = structuredClone(crops);
    wrong[11]!.componentIds = [...wrong[7]!.componentIds!];
    expect(inspectFactionCrops(image, wrong).errors.join(' ')).toContain('Source component');
    const clipped = structuredClone(crops); clipped[7]!.rect.h -= 3;
    expect(inspectFactionCrops(image, clipped).errors.join(' ')).toContain('is clipped by its rectangle');
  });
  it('retains original source/prompt hashes and writes only static unreviewed qualified briefs, reproducibly', async () => {
    const { root, put } = await setup();
    await put('assets/art/briefs/unit.guard.json', 'unrelated original brief');
    await put('assets/art/foundation-index.json', 'unchanged foundation index');
    const result = await prepareFactionArt(root, ['reedbound_council']);
    expect(result[0]?.assets).toBe(15);
    const indexBefore = await readFile(join(root, 'assets/art/faction-index.json'), 'utf8');
    const path = join(root, 'assets/art/briefs/character.marshal.reedbound_council.json');
    const before = await readFile(path, 'utf8'), manifest = parseAssetManifest(JSON.parse(before));
    expect(manifest.contentIds).toEqual([manifest.id]);
    expect(manifest.status).toBe('BRIEF_READY'); expect(manifest.review).toBeNull(); expect(manifest.validation).toBeNull();
    expect(manifest.frames).toHaveLength(1); expect(manifest.frames[0]).toMatchObject({ direction: 'se', state: 'idle', index: 0, durationMs: 250 });
    expect(manifest.animation.states.idle).toEqual({ frames: 1, fps: 4, loop: false });
    expect(manifest.provenance.promptHash).toBe(sha256('Exact original test fixture prompt.'));
    expect(manifest.referenceHashes).toEqual([sha256(await readFile(join(root, 'assets/art/source/factions/reedbound_council-v1.png')))]);
    expect(manifest.processing[0]?.outputHash).toBe(sha256(await readFile(join(root, manifest.frames[0]!.sourcePath))));
    await prepareFactionArt(root, ['reedbound_council']);
    expect(await readFile(path, 'utf8')).toBe(before);
    expect(await readFile(join(root, 'assets/art/faction-index.json'), 'utf8')).toBe(indexBefore);
    expect(await readFile(join(root, 'assets/art/briefs/unit.guard.json'), 'utf8')).toBe('unrelated original brief');
    expect(await readFile(join(root, 'assets/art/foundation-index.json'), 'utf8')).toBe('unchanged foundation index');
  });
  it('validates all requested sources before writing and never falls back to rejected Ashen v1', async () => {
    const { root, put } = await setup();
    await put('assets/art/source/factions/ashen_compact-v1-rejected.png', encodePng(source()));
    await expect(prepareFactionArt(root, ['reedbound_council', 'ashen_compact'])).rejects.toThrow();
    await expect(readdir(join(root, 'assets/art/briefs'))).rejects.toMatchObject({ code: 'ENOENT' });
    await put('assets/art/source/factions/ashen_compact-v2.png', encodePng(source()));
    await put('assets/art/source/faction-revisions.json', JSON.stringify({ ashen_compact: { version: 2, source: 'assets/art/source/factions/ashen_compact-v2.png', prompt: 'Exact replacement prompt, not rejected v1.' } }));
    await prepareFactionArt(root, ['ashen_compact']);
    const manifest = parseAssetManifest(JSON.parse(await readFile(join(root, 'assets/art/briefs/unit.guard.ashen_compact.json'), 'utf8')));
    expect(manifest.version).toBe(2); expect(manifest.prompt).toBe('Exact replacement prompt, not rejected v1.');
    expect(manifest.provenance.sourceRefs).toEqual(['assets/art/source/factions/ashen_compact-v2.png', 'assets/art/source/faction-revisions.json']);
  });
  it('requires a source-hash-bound crop review, not an automatically generated contact sheet', async () => {
    const { root, put } = await setup();
    const proposal = await prepareFactionCropEvidence(root, 'reedbound_council');
    expect(proposal.review).toBeNull(); expect(proposal.evidence).toHaveLength(3);
    await expect(prepareFactionArt(root, ['reedbound_council'])).rejects.toThrow('source-crop review');
    await expect(readdir(join(root, 'assets/art/briefs'))).rejects.toMatchObject({ code: 'ENOENT' });
    const reviewed = { ...proposal, review: { reviewer: 'Synthetic fixture reviewer', notes: 'Test fixture geometry only; no production approval.', sourceHash: proposal.sourceHash, cropsHash: proposal.cropsHash } };
    await put('assets/art/source/factions/crops-reedbound_council.json', JSON.stringify(reviewed));
    await prepareFactionArt(root, ['reedbound_council']);
    const manifestPath = join(root, 'assets/art/briefs/unit.guard.reedbound_council.json'), before = await readFile(manifestPath, 'utf8');
    expect(parseAssetManifest(JSON.parse(before)).review).toBeNull();
    await put('assets/art/source/factions/crops-reedbound_council.json', JSON.stringify({ ...reviewed, sourceHash: '0'.repeat(64) }));
    await expect(prepareFactionArt(root, ['reedbound_council'])).rejects.toThrow('hash mismatch');
    expect(await readFile(manifestPath, 'utf8')).toBe(before);
    const changed = source(); changed.data.set([0, 0, 0, 255], (8 * 128 + 12) * 4);
    const bytes = encodePng(changed);
    await put('assets/art/source/factions/reedbound_council-v1.png', bytes);
    await put('assets/art/source/factions/crops-reedbound_council.json', JSON.stringify({ ...reviewed, sourceHash: sha256(bytes) }));
    await expect(prepareFactionArt(root, ['reedbound_council'])).rejects.toThrow('hash mismatch');
    expect(await readFile(manifestPath, 'utf8')).toBe(before);
  });
  it('preflights a corrupt retained index before changing any existing native or brief bytes', async () => {
    const { root, put } = await setup();
    const nativePath = 'assets/art/source/native/unit.guard.reedbound_council/idle-se-0.png';
    await put(nativePath, 'retained native'); await put('assets/art/briefs/unit.guard.reedbound_council.json', 'retained brief');
    await put('assets/art/faction-index.json', 'malformed index');
    await expect(prepareFactionArt(root, ['reedbound_council'])).rejects.toThrow();
    expect(await readFile(join(root, nativePath), 'utf8')).toBe('retained native');
    expect(await readFile(join(root, 'assets/art/briefs/unit.guard.reedbound_council.json'), 'utf8')).toBe('retained brief');
    expect(await readFile(join(root, 'assets/art/faction-index.json'), 'utf8')).toBe('malformed index');
  });
  it('rejects false declared component metadata even when its supplied source/component seal is unchanged', async () => {
    const { root, put } = await setup(), proposal = await prepareFactionCropEvidence(root, 'reedbound_council');
    const reviewed = { ...proposal, review: { reviewer: 'Synthetic fixture reviewer', notes: 'Test geometry only.', sourceHash: proposal.sourceHash, cropsHash: proposal.cropsHash } };
    await put('assets/art/source/factions/crops-reedbound_council.json', JSON.stringify(reviewed));
    await prepareFactionArt(root, ['reedbound_council']);
    const manifestPath = join(root, 'assets/art/briefs/unit.guard.reedbound_council.json'), before = await readFile(manifestPath, 'utf8');
    const tampered = structuredClone(reviewed); tampered.components.definitions[0]!.count--;
    expect(tampered.components.hash).toBe(reviewed.components.hash);
    await put('assets/art/source/factions/crops-reedbound_council.json', JSON.stringify(tampered));
    await expect(prepareFactionArt(root, ['reedbound_council'])).rejects.toThrow('component provenance hash mismatch');
    expect(await readFile(manifestPath, 'utf8')).toBe(before);
  });
});
