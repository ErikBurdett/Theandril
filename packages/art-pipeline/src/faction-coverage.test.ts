import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { CHARACTER_DEFINITIONS, FACTIONS, UNITS } from '../../content/src/index';
import {
  FACTION_ART_FAMILIES, FACTION_ART_IDS, FACTION_ART_ROLES, factionArtId,
  cropImage, decodePng, parseAssetManifest, parseRuntimeCatalog, safeAssetPath, sha256, validateAsset,
  type RgbaImage, type RuntimeCatalog,
} from './index';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const expectedRoles = [...UNITS.map(unit => unit.id), ...CHARACTER_DEFINITIONS.map(character => character.id),
  'settlement.village', 'settlement.town', 'settlement.city', 'ui.crest', 'ui.badge', 'ui.banner'];
const bytes = new Map<string, Promise<Buffer>>();
function retained(path: string): Promise<Buffer> {
  let pending = bytes.get(path);
  if (!pending) { pending = safeAssetPath(root, path).then(path => readFile(path)); bytes.set(path, pending); }
  return pending;
}

/** Color-renaming invariant: a palette-only recolor retains this exact pixel partition. */
function colorPartitionHash(image: RgbaImage): string {
  const colors = new Map<number, number>(), pattern = new Uint8Array(image.width * image.height * 2);
  for (let pixel = 0; pixel < image.width * image.height; pixel++) {
    const at = pixel * 4;
    pattern[pixel * 2 + 1] = image.data[at + 3]!;
    if (!image.data[at + 3]) continue;
    const rgb = image.data[at]! * 65536 + image.data[at + 1]! * 256 + image.data[at + 2]!;
    if (!colors.has(rgb)) colors.set(rgb, colors.size + 1);
    const color = colors.get(rgb)!;
    if (color > 255) throw new Error('Faction frame exceeds the bounded palette partition');
    pattern[pixel * 2] = color;
  }
  return `${image.width}x${image.height}:${sha256(pattern)}`;
}

describe('published faction art release coverage — real retained files, no fixture substitutes', () => {
  let catalog: RuntimeCatalog;
  const atlasImages = new Map<string, RgbaImage>();
  beforeAll(async () => {
    const retainedCatalog = await retained('assets/art/runtime/catalog.json');
    expect(await retained('apps/web/public/art/catalog.json')).toEqual(retainedCatalog);
    catalog = parseRuntimeCatalog(JSON.parse(retainedCatalog.toString('utf8')));
    for (const atlas of catalog.atlases) {
      const imagePath = atlas.imageUrl.slice('/art/'.length), jsonPath = atlas.jsonUrl.slice('/art/'.length);
      const image = await retained(`assets/art/runtime/${imagePath}`);
      expect(await retained(`apps/web/public/art/${imagePath}`)).toEqual(image);
      expect(sha256(image)).toBe(atlas.sha256);
      const metadata = await retained(`assets/art/runtime/${jsonPath}`);
      expect(await retained(`apps/web/public/art/${jsonPath}`)).toEqual(metadata);
      const decoded = decodePng(image);
      expect([decoded.width, decoded.height]).toEqual([atlas.width, atlas.height]);
      atlasImages.set(atlas.id, decoded);
    }
  });

  it('covers every actual culture, unit and character plus all town stages and heraldry exactly once', () => {
    expect(FACTIONS.map(faction => faction.id).sort()).toEqual(FACTION_ART_FAMILIES.map(family => `faction.${family}`).sort());
    expect([...FACTION_ART_ROLES].sort()).toEqual([...expectedRoles].sort());
    expect(FACTION_ART_IDS).toHaveLength(60);
    expect(new Set(FACTION_ART_IDS).size).toBe(60);
    const missing = FACTION_ART_IDS.filter(id => !catalog.assets.some(asset => asset.id === id));
    expect(missing, 'Every culture must be approved and published; missing families are never skipped').toEqual([]);
    for (const faction of FACTIONS) for (const role of expectedRoles) {
      const id = factionArtId(role, faction.id);
      expect(id, `${faction.id}/${role}`).toBeDefined();
      const bindings = catalog.assets.filter(asset => asset.contentIds.includes(id!));
      expect(bindings, `${id} requires exactly one qualified runtime binding`).toHaveLength(1);
      expect(bindings[0]!.id).toBe(id);
      expect(bindings[0]!.contentIds).toEqual([id]);
    }
  });

  it('preserves reviewed native pixels, exact static pivots, source provenance and executable tool records for all sixty assets', async () => {
    for (const family of FACTION_ART_FAMILIES) for (const role of expectedRoles) {
      const id = factionArtId(role, `faction.${family}`)!;
      const asset = catalog.assets.find(asset => asset.id === id);
      expect(asset, `Missing approved runtime artwork: ${id}`).toBeDefined();
      if (!asset) throw new Error(`Missing approved runtime artwork: ${id}`);
      const native = role === 'settlement.city' ? 128 : role === 'unit.cavalry' || role === 'settlement.village' || role === 'settlement.town' ? 96 : role === 'ui.badge' ? 32 : 64;
      const pivot = [native / 2, role === 'ui.badge' || role === 'ui.crest' ? native / 2 : native > 64 ? native - 16 : 56];
      expect(asset.nativeResolution, id).toEqual({ width: native, height: native });
      expect(asset.pivot, id).toEqual(pivot);
      expect(['APPROVED', 'ATLASED', 'INTEGRATED']).toContain(asset.status);
      expect(asset.frames, `${id} is a single static pose, not fabricated animation`).toHaveLength(1);
      expect(asset.frames[0]).toMatchObject({ id: `${id}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250 });
      expect(asset.clips).toEqual([{ id: `${id}/idle/se`, direction: 'se', state: 'idle', frames: [`${id}/idle/se/0`], durationsMs: [250], loop: false }]);

      const manifest = parseAssetManifest(JSON.parse((await retained(`assets/art/approved/${id}.json`)).toString('utf8')));
      expect(manifest.status).toBe('APPROVED'); expect(manifest.contentIds).toEqual([id]);
      expect(manifest.nativeResolution).toEqual(asset.nativeResolution);
      expect(manifest.frames).toHaveLength(1); expect(manifest.frames[0]!.pivot).toEqual(pivot);
      expect(manifest.constraints.requireMotion).toBe(false);
      expect(manifest.animation.states).toEqual({ idle: { frames: 1, fps: 4, loop: false } });
      expect(manifest.provenance).toEqual(asset.provenance); expect(manifest.review).toEqual(asset.review);
      expect(manifest.provenance.promptHash).toBe(sha256(manifest.prompt));
      expect(manifest.provenance.provider).toBe('codex-imagegen');
      expect(manifest.provenance.licenseNotes.length).toBeGreaterThan(0);
      const original = manifest.provenance.sourceRefs.find(path => path.startsWith('assets/art/source/factions/') && path.endsWith('.png'));
      expect(original, `${id} needs a retained original family source`).toMatch(new RegExp(`/${family}-v[1-9][0-9]*\\.png$`));
      expect(manifest.referenceHashes).toContain(sha256(await retained(original!)));
      for (const path of [...manifest.provenance.sourceRefs, ...manifest.review!.evidencePaths]) {
        expect(path).not.toContain('/cache/'); expect(path).not.toContain('/rejected/');
        expect((await retained(path)).byteLength, `Retained provenance/evidence ${path}`).toBeGreaterThan(0);
      }
      expect(manifest.processing.map(step => step.tool)).toEqual(expect.arrayContaining(['theandril-faction-extraction', 'spritefusion-pixel-snapper', 'aseprite']));
      const framePath = manifest.frames[0]!.sourcePath;
      expect(framePath).toMatch(new RegExp(`^assets/art/approved/${id}/[a-f0-9]{64}/frame-0\\.png$`));
      const frame = decodePng(await retained(framePath));
      const approvedDirectory = framePath.slice(0, framePath.lastIndexOf('/'));
      expect((await retained(`${approvedDirectory}/editable.aseprite`)).byteLength).toBeGreaterThan(0);
      const validation = validateAsset(manifest, [{ id: manifest.frames[0]!.id, image: frame }], catalog.palette);
      expect(validation.errors, id).toEqual([]); expect(validation.passed).toBe(true);
      expect(validation.inputHash).toBe(asset.review.inputHash);
      const packed = cropImage(atlasImages.get(asset.atlasId)!, asset.frames[0]!.frame);
      expect(sha256(packed.data), `${id} published atlas must preserve exact approved RGBA`).toBe(sha256(frame.data));
    }
  });

  it('has sixty distinct frame hashes and does not implement cultures as identical pixel patterns with renamed colors', () => {
    const allHashes = new Set<string>();
    for (const role of expectedRoles) {
      const partitions = new Set<string>();
      for (const family of FACTION_ART_FAMILIES) {
        const id = factionArtId(role, `faction.${family}`)!;
        const asset = catalog.assets.find(asset => asset.id === id);
        if (!asset) throw new Error(`Missing approved runtime artwork: ${id}`);
        const image = cropImage(atlasImages.get(asset.atlasId)!, asset.frames[0]!.frame);
        const hash = `${image.width}x${image.height}:${sha256(image.data)}`;
        expect(allHashes.has(hash), `${id} duplicates another approved faction frame`).toBe(false); allHashes.add(hash);
        const partition = colorPartitionHash(image);
        expect(partitions.has(partition), `${role}: a culture is only a palette permutation of another`).toBe(false); partitions.add(partition);
      }
      expect(partitions.size).toBe(4);
    }
    expect(allHashes.size).toBe(60);
  });
});

it('the palette-permutation check ignores color names but detects changed silhouette/layout', () => {
  const image = { width: 2, height: 2, data: new Uint8Array([180, 0, 0, 255, 0, 140, 0, 255, 0, 0, 0, 0, 180, 0, 0, 255]) };
  const recolored = { ...image, data: new Uint8Array([0, 0, 120, 255, 250, 200, 0, 255, 0, 0, 0, 0, 0, 0, 120, 255]) };
  expect(colorPartitionHash(image)).toBe(colorPartitionHash(recolored));
  recolored.data.set([0, 0, 120, 255], 8);
  expect(colorPartitionHash(image)).not.toBe(colorPartitionHash(recolored));
});
