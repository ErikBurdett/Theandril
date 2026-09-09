import { mkdtemp, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { deflateSync } from 'node:zlib';
import { buildSceneAtlases } from './scene-atlases';
import { approveAsset, assetInputHash, assetManifestSchema, buildAtlas, buildContactSheet, cacheKey, canonicalJson, createAssetCacheReceipt, cropImage, decodePng, encodePng, insideHex, normalizePalette, parseRuntimeCatalog, safeAssetPath, sha256, validateAsset, verifyAssetCacheReceipt, verifyCachedFiles, type AssetManifest, type FrameImage, type Palette, type Review, type RgbaImage } from './index';

const palette: Palette = { id: 'palette.test', version: 1, colors: ['#222222', '#dddddd'] };
const prompt = 'Original square test sprite; technical fixture, not production artwork.';
function image(width = 8, height = 8, inset = 2, alternate = false): RgbaImage {
  const data = new Uint8Array(width * height * 4);
  for (let y = inset; y < height - inset; y++) for (let x = inset; x < width - inset; x++) {
    const value = alternate && x === inset ? 221 : 34;
    data.set([value, value, value, 255], (y * width + x) * 4);
  }
  return { width, height, data };
}
function fixture(id = 'unit.test', count = 2): { manifest: AssetManifest; frames: FrameImage[] } {
  const frames = Array.from({ length: count }, (_, index) => ({ id: `${id}/idle/s/${String(index).padStart(3, '0')}`, image: image(8, 8, 2, index % 2 === 1) }));
  const manifest = assetManifestSchema.parse({ schemaVersion: 1, id, type: 'unit', status: 'CANDIDATE', version: 1, nativeResolution: { width: 8, height: 8 }, paletteId: palette.id, contentIds: [id], prompt, frames: frames.map((frame, index) => ({ id: frame.id, direction: 's', state: 'idle', index, durationMs: 250, pivot: [4, 6], sourcePath: `sources/${id}-${index}.png` })), animation: { states: { idle: { frames: count, fps: 4, loop: true } } }, provenance: { provider: 'original-test-fixture', promptHash: sha256(prompt), sourceRefs: ['packages/art-pipeline/src/core.test.ts'], licenseNotes: ['Programmatic technical test fixture; no production visual approval claimed.'] }, createdAt: '2026-09-05T00:00:00.000Z', review: null, constraints: { transparentPadding: 2, maxColors: 2, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 2, requireMotion: true, terrain: 'none' } });
  return { manifest, frames };
}
function approved(item = fixture()): typeof item {
  const report = validateAsset(item.manifest, item.frames, palette);
  const review: Review = { reviewer: 'Fixture reviewer', reviewedAt: '2026-09-05T01:00:00.000Z', notes: 'Technical fixture approval only; not production artwork.', evidencePaths: ['tests/fixture-review.txt'], inputHash: report.inputHash };
  return { ...item, manifest: approveAsset(item.manifest, report, review) };
}
const options = { id: 'foundation', pageSize: 1024 as const, imageUrl: '/art/foundation.png', jsonUrl: '/art/foundation.json', palette };

describe('lazy battlefield atlas partition', () => {
  it('adds researched works on a 1 MiB page without changing registered foundation pixels or frames', () => {
    const world = approved(fixture('unit.world')), work = approved(fixture('improvement.polder'));
    const original = buildAtlas([world], options), combined = buildSceneAtlases([work, world], options);
    expect(combined.pages[0]).toEqual(original);
    expect(combined.catalog.atlases.map(page => page.id)).toEqual(['foundation', 'map-works']);
    expect(combined.catalog.atlases[1]).toMatchObject({ width: 512, height: 512, imageUrl: '/art/map-works.png' });
    expect(combined.catalog.assets.find(asset => asset.id === work.manifest.id)?.atlasId).toBe('map-works');
    expect(buildSceneAtlases([world, work], options)).toEqual(combined);
    expect(() => buildSceneAtlases([world, fixture('improvement.polder')], options)).toThrow(/approval/);
    work.frames[0]!.image.data.fill(0);
    expect(() => buildSceneAtlases([world, work], options)).toThrow(/changed/);
  });
  it('keeps the world page byte-identical while adding a separately bounded combat page', () => {
    const world = approved(fixture('unit.world')), effect = approved(fixture('effect.battle_melee'));
    const original = buildAtlas([world], options), combined = buildSceneAtlases([effect, world], options);
    expect(combined.pages[0]).toEqual(original);
    expect(combined.catalog.atlases.map(page => page.id)).toEqual(['foundation', 'battle']);
    expect(combined.catalog.atlases[1]).toMatchObject({ width: 1024, height: 1024, imageUrl: '/art/battle.png' });
    expect(combined.catalog.assets.find(asset => asset.id === effect.manifest.id)?.atlasId).toBe('battle');
    expect(buildSceneAtlases([world, effect], options)).toEqual(combined);
  });
  it('does not create an empty tactical page and preserves shared approval checks', () => {
    const world = approved(fixture('unit.world'));
    expect(buildSceneAtlases([world], options).catalog.atlases).toHaveLength(1);
    expect(() => buildSceneAtlases([world, fixture('effect.battle_ward')], options)).toThrow(/approval/);
    const changed = approved(fixture('character.waykeeper')); changed.frames[0]!.image.data.fill(0);
    expect(() => buildSceneAtlases([world, changed], options)).toThrow(/changed/);
  });
  it('keeps exact native foot and mounted frames on independent deferred pages without shifting foundation', () => {
    const native = (id: string, size: number) => {
      const item = fixture(id);
      item.manifest.nativeResolution = { width: size, height: size };
      item.manifest.frames.forEach(frame => { frame.pivot = [size / 2, size - 8]; });
      item.frames.forEach((frame, index) => { frame.image = image(size, size, 2, index % 2 === 1); });
      return approved(item);
    };
    const world = approved(fixture('unit.world')), foot = native('battle.unit.guard', 64), horse = native('battle.unit.cavalry', 96);
    const combined = buildSceneAtlases([horse, world, foot], options);
    expect(combined.pages[0]).toEqual(buildAtlas([world], options));
    expect(combined.catalog.atlases.map(page => page.id)).toEqual(['foundation', 'battle-foot', 'battle-mounted']);
    for (const [item, pageId] of [[foot, 'battle-foot'], [horse, 'battle-mounted']] as const) {
      const page = combined.pages.find(page => page.catalog.atlases[0]!.id === pageId)!;
      expect(page.catalog.atlases[0]).toMatchObject({ width: 2048, height: 2048 });
      const decoded = decodePng(page.png);
      for (const frame of item.frames) expect(cropImage(decoded, page.json.frames[frame.id]!.frame)).toEqual(frame.image);
      expect(page.catalog.assets[0]!.pivot).toEqual(item.manifest.frames[0]!.pivot);
    }
  });
});
function chunk(type: string, payload: Uint8Array): Buffer {
  const data = Buffer.concat([Buffer.from(type), payload]);
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1; }
  const result = Buffer.alloc(data.length + 8); result.writeUInt32BE(payload.length, 0); data.copy(result, 4); result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}
function artificialPng(raw: Uint8Array, interlace = 0): Uint8Array {
  const header = Buffer.alloc(13); header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6; header[12] = interlace;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array())]);
}

describe('bounded real PNG processing', () => {
  it('round trips exact RGBA and encodes deterministically', () => {
    const source = image();
    expect(decodePng(encodePng(source))).toEqual(source);
    expect(encodePng(source)).toEqual(encodePng(source));
    expect(source.data[0]).toBe(0);
  });
  it('accepts RGB and grayscale PNG from independent pngjs modes', () => {
    for (const colorType of [0, 2] as const) {
      const source = new PNG({ width: 8, height: 8 });
      source.data.fill(255);
      const bytes = PNG.sync.write(source, { colorType, inputColorType: 6 });
      expect(decodePng(bytes).data).toEqual(new Uint8Array(8 * 8 * 4).fill(255));
    }
  });
  it('rejects CRC corruption, truncation, foreign bytes and oversized headers before inflate', () => {
    const bytes = encodePng(image());
    const corrupt = new Uint8Array(bytes); corrupt[40] = corrupt[40]! ^ 255;
    expect(() => decodePng(corrupt)).toThrow();
    expect(() => decodePng(bytes.subarray(0, bytes.length - 7))).toThrow();
    expect(() => decodePng(new Uint8Array(100))).toThrow(/signature/);
    const oversized = new Uint8Array(bytes); new DataView(oversized.buffer).setUint32(16, 65536);
    expect(() => decodePng(oversized)).toThrow(/dimensions/);
  });
  it('validates exact inflated size for normal and Adam7 PNG rather than truncating', () => {
    for (const interlace of [0, 1]) {
      expect(decodePng(artificialPng(new Uint8Array([0, 34, 34, 34, 255]), interlace)).data).toEqual(new Uint8Array([34, 34, 34, 255]));
      expect(() => decodePng(artificialPng(new Uint8Array(1024 * 1024), interlace))).toThrow();
      expect(() => decodePng(artificialPng(new Uint8Array(4), interlace))).toThrow(/inflated size/);
    }
  });
  it('decodes indexed palette transparency and refuses silently flattened APNG', () => {
    const header = Buffer.alloc(13); header.writeUInt32BE(2, 0); header.writeUInt32BE(1, 4); header[8] = 1; header[9] = 3;
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const bytes = Buffer.concat([signature, chunk('IHDR', header), chunk('PLTE', new Uint8Array([34, 34, 34, 221, 221, 221])), chunk('tRNS', new Uint8Array([0, 255])), chunk('IDAT', deflateSync(new Uint8Array([0, 64]))), chunk('IEND', new Uint8Array())]);
    const decoded = decodePng(bytes);
    expect([...decoded.data]).toEqual([34, 34, 34, 0, 221, 221, 221, 255]);
    const animation = Buffer.alloc(8); animation.writeUInt32BE(2, 0);
    const apng = Buffer.concat([bytes.subarray(0, 33), chunk('acTL', animation), bytes.subarray(33)]);
    expect(() => decodePng(apng)).toThrow(/APNG/);
  });
  it('crops bounded rectangles without sharing source storage', () => {
    const source = image();
    const crop = cropImage(source, { x: 2, y: 2, w: 4, h: 4 });
    expect(crop.data).toEqual(new Uint8Array(Array.from({ length: 16 }, () => [34, 34, 34, 255]).flat()));
    crop.data.fill(0); expect(source.data[72]).toBe(34);
    expect(() => cropImage(source, { x: 7, y: 0, w: 2, h: 4 })).toThrow(/outside/);
  });
  it('normalizes palette deterministically and clears transparent RGB', () => {
    const source = image(); source.data.set([32, 36, 35, 255], 72); source.data.set([255, 0, 0, 20], 0);
    const result = normalizePalette(source, palette);
    expect(result.changedPixels).toBe(2);
    expect([...result.image.data.subarray(0, 4)]).toEqual([0, 0, 0, 0]);
    expect([...result.image.data.subarray(72, 76)]).toEqual([34, 34, 34, 255]);
    expect(normalizePalette(result.image, palette).changedPixels).toBe(0);
    expect(source.data[0]).toBe(255);
    expect(() => normalizePalette(source, palette, { alphaThreshold: 0 })).toThrow();
  });
});

describe('strict art validation and explicit approval', () => {
  it('records metrics and manual requirements without changing candidate status', () => {
    const item = fixture();
    const report = validateAsset(item.manifest, item.frames, palette);
    expect(report.passed).toBe(true); expect(report.metrics[0]?.padding).toBe(2);
    expect(report.manualChecks.join(' ')).toContain('equipment');
    expect(item.manifest.status).toBe('CANDIDATE'); expect(item.manifest.review).toBeNull();
    expect(() => buildAtlas([item], options)).toThrow(/approval/);
  });
  it('rejects dimension, alpha, palette, padding, logical grid and empty-image faults', () => {
    const item = fixture();
    item.frames[0]!.image.data.set([9, 9, 9, 128], 0);
    const report = validateAsset(item.manifest, item.frames, palette);
    expect(report.errors.join(' ')).toMatch(/off-palette/); expect(report.errors.join(' ')).toMatch(/partially transparent/); expect(report.errors.join(' ')).toMatch(/padding/);
    item.frames[0]!.image = image(10, 8);
    expect(validateAsset(item.manifest, item.frames, palette).errors.join(' ')).toMatch(/dimensions/);
    item.frames[0]!.image = image(); item.frames[0]!.image.data.fill(0);
    expect(validateAsset(item.manifest, item.frames, palette).errors.join(' ')).toMatch(/entirely transparent/);
    const grid = fixture(); grid.manifest.constraints.logicalPixelSize = 2;
    expect(validateAsset(grid.manifest, grid.frames, palette).errors.join(' ')).toMatch(/logical grid/);
  });
  it('detects duplicate fake animation, missing frames, pivot drift and timing mismatch', () => {
    const item = fixture(); item.frames[1]!.image = image();
    expect(validateAsset(item.manifest, item.frames, palette).errors.join(' ')).toMatch(/only duplicate/);
    item.manifest.frames[1]!.pivot = [5, 6]; item.manifest.frames[1]!.durationMs = 200;
    expect(validateAsset(item.manifest, item.frames, palette).errors.join(' ')).toMatch(/pivot drift/);
    expect(validateAsset(item.manifest, item.frames, palette).errors.join(' ')).toMatch(/durations/);
    expect(validateAsset(item.manifest, item.frames.slice(0, 1), palette).passed).toBe(false);
    item.manifest.frames[1]!.id = item.manifest.frames[0]!.id;
    expect(() => assetManifestSchema.parse(item.manifest)).toThrow(/Duplicate/);
  });
  it('requires review hash and invalidates changed source, prompt, palette or tool settings', () => {
    const item = approved();
    expect(item.manifest.status).toBe('APPROVED');
    const original = assetInputHash(item.manifest, item.frames, palette);
    expect(original).toBe(item.manifest.review!.inputHash);
    item.frames[0]!.image = image(8, 8, 2, true);
    expect(() => buildAtlas([item], options)).toThrow(/changed/);
    const fresh = approved(); fresh.manifest.prompt += ' altered';
    expect(() => buildAtlas([fresh], options)).toThrow(/changed/);
    const noReview = fixture(); const report = validateAsset(noReview.manifest, noReview.frames, palette);
    expect(() => approveAsset(noReview.manifest, report, { reviewer: 'test', reviewedAt: '2026-09-05T00:00:00.000Z', notes: 'Actual manual review notes', evidencePaths: ['test.png'], inputHash: '0'.repeat(64) })).toThrow(/exact input/);
    noReview.manifest.prompt += ' changed after validation';
    expect(() => approveAsset(noReview.manifest, report, { reviewer: 'test', reviewedAt: '2026-09-05T00:00:00.000Z', notes: 'Actual manual review notes', evidencePaths: ['test.png'], inputHash: report.inputHash })).toThrow(/exact input/);
  });
  it('validates complete pointy hex alpha coverage and repeat edges independently', () => {
    const item = fixture('terrain.test', 1); item.manifest.type = 'terrain'; item.manifest.constraints.transparentPadding = 0; item.manifest.constraints.terrain = 'hex';
    const tile = image(8, 8, 0);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (!insideHex(x, y, 8, 8)) tile.data.fill(0, (y * 8 + x) * 4, (y * 8 + x) * 4 + 4);
    item.frames[0]!.image = tile;
    expect(validateAsset(item.manifest, item.frames, palette).passed).toBe(true);
    tile.data.fill(0, (4 * 8 + 4) * 4, (4 * 8 + 4) * 4 + 4);
    expect(validateAsset(item.manifest, item.frames, palette).errors.join(' ')).toMatch(/uncovered/);
    item.manifest.constraints.terrain = 'seamless'; item.frames[0]!.image = image(8, 8, 0);
    expect(validateAsset(item.manifest, item.frames, palette).passed).toBe(true);
    item.frames[0]!.image.data[0] = 221;
    expect(validateAsset(item.manifest, item.frames, palette).errors.join(' ')).toMatch(/repeat edges/);
  });
});

describe('deterministic padded atlas and browser catalog', () => {
  it('builds native and4x review sheets from unapproved assets with exact nearest pixels', async () => {
    const item = fixture(), root = await mkdtemp(join(tmpdir(), 'theandril-art-contact-'));
    for (const scale of [1, 4] as const) {
      const sheet = buildContactSheet([item], { scale, columns: 2 });
      const bytes = encodePng(sheet); await writeFile(join(root, `review-${scale}x.png`), bytes);
      expect(decodePng(bytes)).toEqual(sheet);
      expect(sheet.width).toBe((8 * scale + 16) * 2); expect(sheet.height).toBe(8 * scale + 16);
      for (let y = 0; y < scale; y++) for (let x = 0; x < scale; x++) expect([...sheet.data.subarray(((8 + 2 * scale + y) * sheet.width + 8 + 2 * scale + x) * 4, ((8 + 2 * scale + y) * sheet.width + 8 + 2 * scale + x) * 4 + 4)]).toEqual([34, 34, 34, 255]);
      expect(item.manifest.status).toBe('CANDIDATE');
      expect(buildContactSheet([fixture('unit.z'), item], { scale, columns: 2 })).toEqual(buildContactSheet([item, fixture('unit.z')], { scale, columns: 2 }));
    }
  });
  it('packs identically regardless of input order and preserves pixels, pivots and frame timing', () => {
    const first = approved(fixture('unit.alpha')), second = approved(fixture('unit.beta'));
    const a = buildAtlas([first, second], options), b = buildAtlas([second, first], options);
    expect(a.png).toEqual(b.png); expect(a.json).toEqual(b.json); expect(a.catalog).toEqual(b.catalog);
    const atlas = decodePng(a.png), rect = a.json.frames[first.frames[0]!.id]!.frame;
    expect(cropImage(atlas, rect)).toEqual(first.frames[0]!.image);
    expect(a.json.frames[first.frames[0]!.id]!.anchor).toEqual({ x: 0.5, y: 0.75 });
    expect(a.catalog.assets[0]!.clips[0]!.durationsMs).toEqual([250, 250]);
    expect(a.catalog.atlases[0]!.sha256).toBe(sha256(a.png));
    expect(a.catalog.assets[0]!.status).toBe('ATLASED');
  });
  it('extrudes opaque edge pixels and leaves a transparent gutter', () => {
    const item = fixture('terrain.repeat', 1); item.manifest.type = 'terrain'; item.manifest.constraints.transparentPadding = 0; item.frames[0]!.image = image(8, 8, 0);
    const built = buildAtlas([approved(item)], options), atlas = decodePng(built.png), rect = built.json.frames[item.frames[0]!.id]!.frame;
    expect([...atlas.data.subarray(((rect.y - 2) * atlas.width + rect.x - 2) * 4, ((rect.y - 2) * atlas.width + rect.x - 2) * 4 + 4)]).toEqual([34, 34, 34, 255]);
    expect(atlas.data[((rect.y - 3) * atlas.width + rect.x) * 4 + 3]).toBe(0);
  });
  it('rejects duplicate bindings, out-of-bounds frames, mismatched clips and unsafe browser URLs', () => {
    const built = buildAtlas([approved()], options);
    const badRect = structuredClone(built.catalog); badRect.assets[0]!.frames[0]!.frame.x = 1023;
    expect(() => parseRuntimeCatalog(badRect)).toThrow(/outside/);
    const badTime = structuredClone(built.catalog); badTime.assets[0]!.clips[0]!.durationsMs[0] = 500;
    expect(() => parseRuntimeCatalog(badTime)).toThrow(/mismatch/);
    const badUrl = structuredClone(built.catalog); badUrl.atlases[0]!.imageUrl = '/art/../secret.png';
    expect(() => parseRuntimeCatalog(badUrl)).toThrow(/Unsafe/);
    const overlap = structuredClone(built.catalog); overlap.assets[0]!.frames[1]!.frame = overlap.assets[0]!.frames[0]!.frame;
    expect(() => parseRuntimeCatalog(overlap)).toThrow(/Overlapping/);
    const second = approved(fixture('unit.other')); second.manifest.contentIds = ['unit.test'];
    expect(() => buildAtlas([approved(), second], options)).toThrow();
  });
});

describe('provenance and cache safety', () => {
  it('binds candidate receipts to exact keys, identities, manifest and all referenced source bytes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'theandril-art-receipt-')), item = fixture(), key = cacheKey({ tool: 'test1' });
    item.manifest.frames.forEach((frame, index) => { frame.sourcePath = `frame-${index}.png`; });
    item.manifest.provenance.sourceRefs = ['original-source.png', 'https://example.invalid/license'];
    const files = [];
    for (const [index, frame] of item.frames.entries()) { const path = item.manifest.frames[index]!.sourcePath, bytes = encodePng(frame.image); await writeFile(join(root, path), bytes); files.push({ path, sha256: sha256(bytes) }); }
    const original = encodePng(image()); await writeFile(join(root, 'original-source.png'), original); files.push({ path: 'original-source.png', sha256: sha256(original) });
    const receipt = createAssetCacheReceipt(key, item.manifest, files), expected = { key, assetId: item.manifest.id };
    expect(await verifyAssetCacheReceipt(root, receipt, expected)).toEqual(item.manifest);
    expect(createAssetCacheReceipt(key, item.manifest, [...files].reverse())).toEqual(receipt);
    expect(await verifyAssetCacheReceipt(root, receipt, { ...expected, key: '0'.repeat(64) })).toBeNull();
    expect(await verifyAssetCacheReceipt(root, receipt, { ...expected, assetId: 'unit.foreign' })).toBeNull();
    for (const invalid of [null, {}, { ...receipt, files: undefined }, { ...receipt, manifestHash: '0'.repeat(64) }, { ...receipt, unknown: true }, { ...receipt, files: receipt.files.slice(1) }, { ...receipt, files: [...receipt.files, receipt.files[0]] }]) expect(await verifyAssetCacheReceipt(root, invalid, expected)).toBeNull();
    const altered = structuredClone(receipt); altered.manifest.prompt += ' changed'; expect(await verifyAssetCacheReceipt(root, altered, expected)).toBeNull();
    const unsafeReference = structuredClone(receipt); unsafeReference.manifest.provenance.sourceRefs = ['../discarded-original.png']; unsafeReference.manifestHash = cacheKey(unsafeReference.manifest);
    expect(await verifyAssetCacheReceipt(root, unsafeReference, expected)).toBeNull();
    await writeFile(join(root, 'original-source.png'), 'changed original'); expect(await verifyAssetCacheReceipt(root, receipt, expected)).toBeNull();
  });
  it('does not accept receipt manifests already approved or omit source coverage', () => {
    const item = fixture(), files = item.manifest.frames.map((frame) => ({ path: frame.sourcePath, sha256: '0'.repeat(64) }));
    expect(() => createAssetCacheReceipt('0'.repeat(64), item.manifest, files)).toThrow(/referenced source/);
    const reviewed = approved(); reviewed.manifest.provenance.sourceRefs = ['https://example.invalid/license'];
    expect(() => createAssetCacheReceipt('0'.repeat(64), reviewed.manifest, files)).toThrow(/unapproved candidate/);
  });
  it('hashes canonical settings and rejects non-JSON values', () => {
    expect(cacheKey({ b: 2, a: [1, true] })).toBe(cacheKey({ a: [1, true], b: 2 }));
    expect(cacheKey({ seed: '1', tool: 'v1' })).not.toBe(cacheKey({ seed: '1', tool: 'v2' }));
    expect(() => canonicalJson({ bad: undefined })).toThrow();
    expect(() => canonicalJson({ bad: Infinity })).toThrow();
    expect(() => canonicalJson(new Date())).toThrow();
  });
  it('checks cache content rather than existence and rejects traversal/symlink paths', async () => {
    const root = await mkdtemp(join(tmpdir(), 'theandril-art-test-'));
    const bytes = encodePng(image()); await writeFile(join(root, 'frame.png'), bytes);
    const files = [{ path: 'frame.png', sha256: sha256(bytes) }];
    expect(await verifyCachedFiles(root, files)).toBe(true);
    await writeFile(join(root, 'frame.png'), 'not png'); expect(await verifyCachedFiles(root, files)).toBe(false);
    await expect(safeAssetPath(root, '../escape')).rejects.toThrow();
    await expect(safeAssetPath(root, '/etc/passwd')).rejects.toThrow();
    await symlink('/tmp', join(root, 'link')); await expect(safeAssetPath(root, 'link/escape.png')).rejects.toThrow(/Symlink/);
    expect(await safeAssetPath(root, 'new/frame.png')).toBe(join(root, 'new/frame.png'));
  });
});
