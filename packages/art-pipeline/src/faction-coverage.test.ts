import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { CHARACTER_DEFINITIONS, FACTIONS, UNITS } from '../../content/src/index';
import {
  FACTION_ART_FAMILIES, FACTION_ART_IDS, FACTION_ART_ROLES, factionArtId, isFactionNavalArtRole, SHARED_UNIT_ART, unitArtRole,
  cacheKey, cropImage, decodePng, measureFrame, parseAssetManifest, parseRuntimeCatalog, safeAssetPath, sha256, validateAsset,
  type AssetManifest, type RgbaImage, type RuntimeCatalog,
} from './index';
import { FACTION_SOURCE_KINDS, isFactionOriginalSource } from './faction-source';
import { animationSourceIndexSchema, scoutIdleRecipe } from './animation-source';

const root = fileURLToPath(new URL('../../../', import.meta.url));
// Slice23 introduces one explicit shared Waykeeper cast pilot, not24 newly
// approved culture variants. Keep every pre-existing qualified role mandatory.
const sharedCharacterPilots = ['character.waykeeper'];
const expectedRoles = [...new Set(UNITS.map(unit => unitArtRole(unit.id))), ...CHARACTER_DEFINITIONS.filter(character => !sharedCharacterPilots.includes(character.id)).map(character => character.id),
  'settlement.village', 'settlement.town', 'settlement.city', 'ui.crest', 'ui.badge', 'ui.banner'];
const bytes = new Map<string, Promise<Buffer>>();
const animatedScoutId = 'unit.scout.ashen_compact';
function retained(path: string): Promise<Buffer> {
  let pending = bytes.get(path);
  if (!pending) { pending = safeAssetPath(root, path).then(path => readFile(path)); bytes.set(path, pending); }
  return pending;
}

async function verifyScoutAnimationProvenance(manifest: AssetManifest, palette: RuntimeCatalog['palette']): Promise<void> {
  const indexPath = 'assets/art/source/animations/unit.scout.ashen_compact-idle-generation.json';
  const indexBytes = await retained(indexPath), index = animationSourceIndexSchema.parse(JSON.parse(indexBytes.toString('utf8')));
  expect(manifest.version).toBe(5);
  expect(manifest.provenance.sourceRefs).toContain(indexPath);
  expect(manifest.referenceHashes).toContain(sha256(indexBytes));
  for (const source of index.generations) {
    expect(manifest.provenance.sourceRefs).toContain(source.sourcePath);
    expect(sha256(await retained(source.sourcePath))).toBe(source.sha256);
    expect(manifest.referenceHashes).toContain(source.sha256);
    expect(manifest.prompt).toContain(source.prompt);
  }
  expect(manifest.provenance.sourceRefs).toContain(index.reference.path);
  expect(sha256(await retained(index.reference.path))).toBe(index.reference.sha256);
  expect(manifest.referenceHashes).toContain(index.reference.sha256);
  const recordPath = manifest.provenance.sourceRefs.find(path => path.startsWith(`assets/art/source/animations/prepared/${animatedScoutId}-v5-`) && path.endsWith('/record.json'));
  expect(recordPath, 'Retain the measured four-pose importer record, not a static-sheet extraction receipt').toBeDefined();
  const recordBytes = await retained(recordPath!), record = JSON.parse(recordBytes.toString('utf8')) as {
    id: string; assetVersion: number; sourceVersion: number; sourceIndex: unknown; sourceIndexHash: string; preparedAt: string; generatedAt: null;
    recipe: unknown; settingsHash: string; frames: { index: number; path: string; sha256: string; pixelHash: string }[];
  };
  expect(manifest.referenceHashes).toContain(sha256(recordBytes));
  expect(record).toMatchObject({ id: animatedScoutId, assetVersion: 5, sourceVersion: 2, sourceIndex: index, sourceIndexHash: sha256(indexBytes), generatedAt: null, preparedAt: manifest.createdAt });
  expect(record.recipe).toEqual(scoutIdleRecipe(index.generations[1]!.sha256));
  expect(record.frames).toHaveLength(4);
  for (const [frameIndex, frame] of record.frames.entries()) {
    expect(frame.index).toBe(frameIndex);
    const native = await retained(frame.path);
    const image = decodePng(native);
    expect(sha256(native)).toBe(frame.sha256); expect(sha256(image.data)).toBe(frame.pixelHash);
    expect(measureFrame({ id: `${animatedScoutId}/idle/se/${frameIndex}`, image }, palette).bounds).toEqual([
      { x: 13, y: 8, w: 43, h: 47 }, { x: 12, y: 8, w: 43, h: 47 }, { x: 12, y: 8, w: 44, h: 47 }, { x: 12, y: 8, w: 44, h: 47 },
    ][frameIndex]);
    expect(manifest.processing).toContainEqual(expect.objectContaining({ tool: 'theandril-grid-enlarge', inputHash: frame.sha256 }));
  }
  expect(new Set(record.frames.map(frame => frame.pixelHash)).size).toBe(4);
  expect(manifest.processing).toContainEqual(expect.objectContaining({ tool: 'theandril-animation-source', version: '1', profile: 'common-scale-foot-registered-idle64',
    inputHash: index.generations[1]!.sha256, settingsHash: record.settingsHash, outputHash: cacheKey(record.frames.map(frame => frame.sha256)) }));
  expect(manifest.processing.filter(step => step.tool === 'spritefusion-pixel-snapper')).toHaveLength(4);
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
    // Compare exact bytes without recursively asserting millions of Buffer
    // indices. The expanded pack must still match the public copy byte-for-byte.
    expect((await retained('apps/web/public/art/catalog.json')).equals(retainedCatalog)).toBe(true);
    catalog = parseRuntimeCatalog(JSON.parse(retainedCatalog.toString('utf8')));
    for (const atlas of catalog.atlases) {
      const imagePath = atlas.imageUrl.slice('/art/'.length), jsonPath = atlas.jsonUrl.slice('/art/'.length);
      const image = await retained(`assets/art/runtime/${imagePath}`);
      expect((await retained(`apps/web/public/art/${imagePath}`)).equals(image)).toBe(true);
      expect(sha256(image)).toBe(atlas.sha256);
      const metadata = await retained(`assets/art/runtime/${jsonPath}`);
      expect((await retained(`apps/web/public/art/${jsonPath}`)).equals(metadata)).toBe(true);
      const decoded = decodePng(image);
      expect([decoded.width, decoded.height]).toEqual([atlas.width, atlas.height]);
      atlasImages.set(atlas.id, decoded);
    }
  });

  it('covers every released culture, land/naval unit and culture-qualified character plus town stages and heraldry exactly once', () => {
    expect(FACTIONS).toHaveLength(24);
    expect(FACTION_ART_FAMILIES).toHaveLength(24);
    expect(FACTION_ART_ROLES).toHaveLength(18);
    expect(FACTION_ART_IDS).toHaveLength(432);
    const missing = FACTION_ART_IDS.filter(id => !catalog.assets.some(asset => asset.id === id));
    expect(missing, 'Every culture must be approved and published; missing families are never skipped').toEqual([]);
    expect(FACTIONS.map(faction => faction.id).sort()).toEqual(FACTION_ART_FAMILIES.map(family => `faction.${family}`).sort());
    expect([...FACTION_ART_ROLES].sort()).toEqual([...expectedRoles].sort());
    expect(FACTION_ART_IDS).toHaveLength(FACTION_ART_FAMILIES.length * FACTION_ART_ROLES.length);
    expect(new Set(FACTION_ART_IDS).size).toBe(FACTION_ART_IDS.length);
    for (const faction of FACTIONS) for (const role of expectedRoles) {
      const id = factionArtId(role, faction.id);
      expect(id, `${faction.id}/${role}`).toBeDefined();
      const bindings = catalog.assets.filter(asset => asset.contentIds.includes(id!));
      expect(bindings, `${id} requires exactly one qualified runtime binding`).toHaveLength(1);
      expect(bindings[0]!.id).toBe(id);
      expect(bindings[0]!.contentIds).toEqual([id]);
    }
  });

  it('keeps the new shared Waykeeper pilot explicit rather than claiming24 culture-specific casting kits', () => {
    expect(CHARACTER_DEFINITIONS.filter(character => !FACTION_ART_ROLES.some(role => role === character.id)).map(character => character.id)).toEqual(sharedCharacterPilots);
    const asset = catalog.assets.find(item => item.id === 'character.waykeeper');
    expect(asset).toMatchObject({ atlasId: 'battle', contentIds: ['character.waykeeper'], pivot: [32, 56] });
    expect(asset!.clips).toEqual([expect.objectContaining({ state: 'cast', direction: 'se', loop: false, durationsMs: Array(8).fill(100) })]);
    for (const faction of FACTIONS) expect(factionArtId('character.waykeeper', faction.id)).toBeUndefined();
  });

  it('maps specialists to retained approved silhouettes without inventing dedicated bindings or artwork', () => {
    expect(Object.keys(SHARED_UNIT_ART).sort()).toEqual(UNITS.filter(unit => unit.introducedInRules === 15).map(unit => unit.id).sort());
    for (const [unitId, shared] of Object.entries(SHARED_UNIT_ART)) for (const faction of FACTIONS) {
      expect(factionArtId(unitId, faction.id)).toBeUndefined();
      expect(catalog.assets.some(asset => asset.contentIds.includes(`${unitId}.${faction.id.slice(8)}`))).toBe(false);
      const actual = factionArtId(shared.role, faction.id)!;
      expect(catalog.assets.filter(asset => asset.contentIds.includes(actual))).toHaveLength(1);
    }
  });

  it('publishes all72 qualified naval roles without generic or infantry substitutions', () => {
    const navalRoles = UNITS.filter(unit => unit.movementDomain === 'naval').map(unit => unit.id).sort();
    expect(navalRoles).toEqual(['unit.coastal_warship', 'unit.ocean_warship', 'unit.transport']);
    expect(FACTION_ART_IDS.filter(id => navalRoles.some(role => id.startsWith(`${role}.`)))).toHaveLength(72);
    for (const faction of FACTIONS) for (const role of navalRoles) {
      const id = factionArtId(role, faction.id)!;
      expect(id).toBe(`${role}.${faction.id.slice('faction.'.length)}`);
      expect(catalog.assets.filter(asset => asset.contentIds.includes(id))).toEqual([expect.objectContaining({ id, contentIds: [id], nativeResolution: { width: 96, height: 96 }, pivot: [48, 80] })]);
      expect(catalog.assets.some(asset => asset.contentIds.includes(role))).toBe(false);
    }
  });

  it('publishes the two new biome stamps and all ten actual improvement props without generic substitute bindings', async () => {
    const ids = ['terrain.ash_scrub', 'terrain.chalkland', 'improvement.terraced_fields', 'improvement.managed_woodlot', 'improvement.quarry', 'improvement.reedworks', 'improvement.shore_fishery', 'improvement.spring_garden', 'improvement.polder', 'improvement.grove_archive', 'improvement.oreworks', 'improvement.tide_observatory'];
    for (const id of ids) {
      const bindings = catalog.assets.filter(asset => asset.contentIds.includes(id));
      expect(bindings, `${id} needs one exact approved consumer binding`).toHaveLength(1);
      const asset = bindings[0]!;
      expect(asset.id).toBe(id); expect(asset.contentIds).toEqual([id]);
      expect(asset.nativeResolution).toEqual({ width: 64, height: 64 });
      expect(asset.pivot).toEqual([32, id.startsWith('terrain.') ? 32 : 48]);
      expect(asset.frames).toHaveLength(1);
      const manifest = parseAssetManifest(JSON.parse((await retained(`assets/art/approved/${id}.json`)).toString('utf8')));
      const frame = decodePng(await retained(manifest.frames[0]!.sourcePath));
      const report = validateAsset(manifest, [{ id: manifest.frames[0]!.id, image: frame }], catalog.palette);
      expect(report.passed, id).toBe(true); expect(report.inputHash).toBe(asset.review.inputHash);
      const batch = ['spring_garden', 'polder', 'grove_archive', 'oreworks', 'tide_observatory'].some(name => id === `improvement.${name}`) ? 'hearth-improvements' : 'slice12';
      expect(manifest.provenance.sourceRefs.some(path => path.startsWith(`assets/art/source/${batch}/${id}-v`) && path.endsWith('.png'))).toBe(true);
      expect(sha256(cropImage(atlasImages.get(asset.atlasId)!, asset.frames[0]!.frame).data)).toBe(sha256(frame.data));
    }
  });

  it('preserves all reviewed pixels and tool provenance: one real four-pose scout and431 static faction assets', async () => {
    let animatedCount = 0, staticCount = 0;
    for (const family of FACTION_ART_FAMILIES) for (const role of FACTION_ART_ROLES) {
      const id = factionArtId(role, `faction.${family}`)!;
      const animated = id === animatedScoutId, frameCount = animated ? 4 : 1;
      if (animated) animatedCount++; else staticCount++;
      const asset = catalog.assets.find(asset => asset.id === id);
      expect(asset, `Missing approved runtime artwork: ${id}`).toBeDefined();
      if (!asset) throw new Error(`Missing approved runtime artwork: ${id}`);
      const native = role === 'settlement.city' ? 128 : isFactionNavalArtRole(role) || role === 'unit.cavalry' || role === 'settlement.village' || role === 'settlement.town' ? 96 : role === 'ui.badge' ? 32 : 64;
      const pivot = [native / 2, role === 'ui.badge' || role === 'ui.crest' ? native / 2 : native > 64 ? native - 16 : 56];
      expect(asset.nativeResolution, id).toEqual({ width: native, height: native });
      expect(asset.pivot, id).toEqual(pivot);
      expect(['APPROVED', 'ATLASED', 'INTEGRATED']).toContain(asset.status);
      expect(asset.frames, `${id}: only the approved Ashen scout has four real poses`).toHaveLength(frameCount);
      for (let index = 0; index < frameCount; index++) expect(asset.frames[index]).toMatchObject({ id: `${id}/idle/se/${index}`, direction: 'se', state: 'idle', index, durationMs: 250 });
      expect(asset.clips).toEqual([{ id: `${id}/idle/se`, direction: 'se', state: 'idle', frames: Array.from({ length: frameCount }, (_, index) => `${id}/idle/se/${index}`), durationsMs: Array(frameCount).fill(250), loop: animated }]);

      const manifest = parseAssetManifest(JSON.parse((await retained(`assets/art/approved/${id}.json`)).toString('utf8')));
      expect(manifest.status).toBe('APPROVED'); expect(manifest.contentIds).toEqual([id]);
      expect(manifest.nativeResolution).toEqual(asset.nativeResolution);
      expect(manifest.frames).toHaveLength(frameCount);
      for (const [index, frame] of manifest.frames.entries()) expect(frame).toMatchObject({ id: `${id}/idle/se/${index}`, direction: 'se', state: 'idle', index, durationMs: 250, pivot });
      expect(manifest.constraints.requireMotion).toBe(animated);
      expect(manifest.animation.states).toEqual({ idle: { frames: frameCount, fps: 4, loop: animated } });
      if (animated) expect(manifest.constraints).toMatchObject({ maxPivotDrift: 0, maxBoundingBoxDrift: 2 });
      expect(manifest.provenance).toEqual(asset.provenance); expect(manifest.review).toEqual(asset.review);
      expect(manifest.provenance.promptHash).toBe(sha256(manifest.prompt));
      expect(manifest.provenance.provider).toBe('codex-imagegen');
      expect(manifest.provenance.licenseNotes.length).toBeGreaterThan(0);
      const original = manifest.provenance.sourceRefs.find(path => isFactionOriginalSource(family, role, path));
      if (animated) await verifyScoutAnimationProvenance(manifest, catalog.palette);
      else {
        expect(original, `${id} needs its own retained original source, never a cache/approval copy`).toBeDefined();
        expect(manifest.referenceHashes).toContain(sha256(await retained(original!)));
      }
      if (isFactionNavalArtRole(role) || FACTION_SOURCE_KINDS[family] === 'batch') {
        const recordPath = original!.slice(0, -4) + '.json';
        const recordBytes = await retained(recordPath), record = JSON.parse(recordBytes.toString('utf8'));
        expect(manifest.provenance.sourceRefs).toContain(recordPath);
        expect(manifest.referenceHashes).toContain(sha256(recordBytes));
        expect(record).toMatchObject({ id, role, family, version: manifest.version, sourcePath: original,
          sourceHash: sha256(await retained(original!)), prompt: manifest.prompt, provider: manifest.provenance.provider,
          model: manifest.provenance.model, generatedAt: manifest.createdAt });
        expect(record.seed).toBe(manifest.seed ?? null);
        expect(manifest.processing).toEqual(expect.arrayContaining([expect.objectContaining({ tool: 'theandril-single-asset-extraction', version: '2' })]));
      }
      for (const path of [...manifest.provenance.sourceRefs, ...manifest.review!.evidencePaths]) {
        expect(path).not.toContain('/cache/'); expect(path).not.toContain('/rejected/');
        expect((await retained(path)).byteLength, `Retained provenance/evidence ${path}`).toBeGreaterThan(0);
      }
      expect(manifest.processing.map(step => step.tool)).toEqual(expect.arrayContaining([animated ? 'theandril-animation-source' : !isFactionNavalArtRole(role) && FACTION_SOURCE_KINDS[family] === 'sheet' ? 'theandril-faction-extraction' : 'theandril-single-asset-extraction', 'spritefusion-pixel-snapper', 'aseprite']));
      const framePath = manifest.frames[0]!.sourcePath;
      const frames = await Promise.all(manifest.frames.map(async (frame, index) => {
        expect(frame.sourcePath).toMatch(new RegExp(`^assets/art/approved/${id}/[a-f0-9]{64}/frame-${index}\\.png$`));
        return { id: frame.id, image: decodePng(await retained(frame.sourcePath)) };
      }));
      const approvedDirectory = framePath.slice(0, framePath.lastIndexOf('/'));
      const editable = await retained(`${approvedDirectory}/editable.aseprite`);
      expect(editable.byteLength).toBeGreaterThan(0);
      const validation = validateAsset(manifest, frames, catalog.palette);
      expect(validation.errors, id).toEqual([]); expect(validation.passed).toBe(true);
      expect(validation.inputHash).toBe(asset.review.inputHash);
      for (const [index, frame] of frames.entries()) {
        const packed = cropImage(atlasImages.get(asset.atlasId)!, asset.frames[index]!.frame);
        expect(sha256(packed.data), `${id}/${index} published atlas must preserve exact approved RGBA`).toBe(sha256(frame.image.data));
      }
      if (animated) {
        expect(new Set(frames.map(frame => sha256(frame.image.data))).size).toBe(4);
        // Actual reviewed Snapper outputs end at y53; the separately retained
        // pre-Snapper source frames above end at y54. Never conflate the stages.
        expect(validation.metrics.map(metric => metric.bounds)).toEqual([
          { x: 14, y: 8, w: 41, h: 46 }, { x: 12, y: 8, w: 42, h: 46 }, { x: 12, y: 8, w: 43, h: 46 }, { x: 12, y: 8, w: 43, h: 46 },
        ]);
        for (const metric of validation.metrics) {
          const first = validation.metrics[0]!.bounds!;
          for (const key of ['x', 'y', 'w', 'h'] as const) expect(Math.abs(metric.bounds![key] - first[key])).toBeLessThanOrEqual(2);
        }
        const exportedPng = await retained(`${approvedDirectory}/aseprite/sprite.png`), exportedJson = await retained(`${approvedDirectory}/aseprite/sprite.json`);
        expect(manifest.processing).toContainEqual(expect.objectContaining({ tool: 'aseprite', inputHash: sha256(editable), outputHash: cacheKey([sha256(exportedPng), sha256(exportedJson)]) }));
        const exported = JSON.parse(exportedJson.toString('utf8')) as { frames: { frame: { x: number; y: number; w: number; h: number }; filename: string; duration: number }[]; meta: { frameTags: unknown[] } };
        expect(exported.frames).toHaveLength(4); expect(exported.meta.frameTags).toEqual([expect.objectContaining({ name: 'idle', from: 0, to: 3, direction: 'forward' })]);
        const sheet = decodePng(exportedPng);
        for (const [index, frame] of exported.frames.entries()) {
          expect(frame).toMatchObject({ filename: `sprite/idle/${index}`, duration: 250 });
          expect(sha256(cropImage(sheet, frame.frame).data)).toBe(sha256(frames[index]!.image.data));
        }
      }
    }
    expect(animatedCount).toBe(1); expect(staticCount).toBe(431);
  });

  it('has distinct frame hashes and does not implement cultures as identical pixel patterns with renamed colors', () => {
    const allHashes = new Set<string>();
    for (const role of expectedRoles) {
      const partitions = new Set<string>();
      for (const family of FACTION_ART_FAMILIES) {
        const id = factionArtId(role, `faction.${family}`)!;
        const asset = catalog.assets.find(asset => asset.id === id);
        if (!asset) throw new Error(`Missing approved runtime artwork: ${id}`);
        const image = cropImage(atlasImages.get(asset.atlasId)!, asset.frames[0]!.frame);
        for (const frame of asset.frames) {
          const pose = cropImage(atlasImages.get(asset.atlasId)!, frame.frame), hash = `${pose.width}x${pose.height}:${sha256(pose.data)}`;
          expect(allHashes.has(hash), `${frame.id} duplicates another approved faction frame`).toBe(false); allHashes.add(hash);
        }
        const partition = colorPartitionHash(image);
        expect(partitions.has(partition), `${role}: a culture is only a palette permutation of another`).toBe(false); partitions.add(partition);
      }
      expect(partitions.size).toBe(FACTION_ART_FAMILIES.length);
    }
    expect(allHashes.size).toBe(FACTION_ART_IDS.length + 3);
  });
});

it('the palette-permutation check ignores color names but detects changed silhouette/layout', () => {
  const image = { width: 2, height: 2, data: new Uint8Array([180, 0, 0, 255, 0, 140, 0, 255, 0, 0, 0, 0, 180, 0, 0, 255]) };
  const recolored = { ...image, data: new Uint8Array([0, 0, 120, 255, 250, 200, 0, 255, 0, 0, 0, 0, 0, 0, 120, 255]) };
  expect(colorPartitionHash(image)).toBe(colorPartitionHash(recolored));
  recolored.data.set([0, 0, 120, 255], 8);
  expect(colorPartitionHash(image)).not.toBe(colorPartitionHash(recolored));
});
