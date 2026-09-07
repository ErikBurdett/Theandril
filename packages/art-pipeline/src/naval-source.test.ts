import { afterEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { FACTION_ART_FAMILIES, FACTION_NAVAL_ART_ROLES } from './faction-art';
import { factionExpansionBatchSchema, type FactionExpansionBatch } from './faction-source';
import { decodePng, encodePng, paletteSchema, parseAssetManifest, sha256 } from './index';
import { factionFrameContract } from '../../../scripts/art-factions';
import { prepareFactionExpansion } from '../../../scripts/art-faction-expansion';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
const palette = paletteSchema.parse({ id: 'test.palette', version: 1, colors: ['#000000', '#ffffff'] });
function source(index: number, family: typeof FACTION_ART_FAMILIES[number], role: typeof FACTION_NAVAL_ART_ROLES[number]) {
  // Thirty-six distinct synthetic silhouette fixtures, never production artwork.
  const image = { width: 96, height: 96, data: new Uint8Array(96 * 96 * 4) };
  for (let y = 24; y < 70; y++) for (let x = 24; x < 32 + index; x++) image.data.set([255, 255, 255, 255], (y * 96 + x) * 4);
  const bytes = encodePng(image), id = `${role}.${family}`;
  const record: FactionExpansionBatch['sources'][number] = { id, role, family, version: 1,
    sourcePath: `assets/art/source/faction-expansion/naval/${id}-v1.png`, sourceHash: sha256(bytes),
    prompt: 'Synthetic naval source-contract test fixture, not generated art or an approval.', provider: 'codex-imagegen', model: 'not-exposed-by-tool',
    seed: null, generatedAt: '2026-09-06T17:00:00.000Z', referenceHashes: [],
  };
  return { bytes, record };
}
const sources = FACTION_ART_FAMILIES.flatMap((family, i) => FACTION_NAVAL_ART_ROLES.map((role, j) => source(i * 3 + j, family, role)));
const batch: FactionExpansionBatch = { schemaVersion: 1, batchId: 'naval', sources: sources.map(item => item.record) };

describe('twelve-culture static naval source contract', () => {
  it('accepts all36 unique original identities while preserving land source routes', () => {
    expect(factionExpansionBatchSchema.parse(batch).sources).toHaveLength(36);
    for (const role of FACTION_NAVAL_ART_ROLES) expect(factionFrameContract(role)).toEqual({ native: 96, pivot: [48, 80], maxHeight: 78, centered: false, type: 'unit' });
    expect(factionFrameContract('unit.guard')).toEqual({ native: 64, pivot: [32, 56], maxHeight: 48, centered: false, type: 'unit' });
    expect(factionFrameContract('unit.cavalry')).toEqual({ native: 96, pivot: [48, 80], maxHeight: 78, centered: false, type: 'unit' });
    const first = batch.sources[0]!;
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [first, first] })).toThrow('Duplicate source');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [{ ...first, sourceHash: '0'.repeat(64) }, { ...batch.sources[1], sourceHash: '0'.repeat(64) }] })).toThrow('Duplicate source sourceHash');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, batchId: 'cohort12', sources: [{ ...first, sourcePath: first.sourcePath.replace('/naval/', '/cohort12/') }] })).toThrow('dedicated naval batch');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [{ ...first, sourcePath: 'assets/art/source/factions/ashen_compact-v4.png' }] })).toThrow('Unregistered original source');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [{ ...first, role: 'unit.guard', id: 'unit.guard.ashen_compact' }] })).toThrow('Unregistered expansion');
    expect(() => factionExpansionBatchSchema.parse({ ...batch, sources: [{ ...first, id: 'unit.transport.other_family' }] })).toThrow('Unregistered expansion');
  });

  it('prepares exact96px static briefs for all12 families without approval or touching historical inputs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'theandril-naval-source-')); roots.push(root);
    const put = async (path: string, value: string | Uint8Array) => { await mkdir(dirname(join(root, path)), { recursive: true }); await writeFile(join(root, path), value); };
    await put('assets/palettes/theandril-master.json', JSON.stringify(palette));
    await put('assets/art/source/faction-expansion/naval/generation.json', JSON.stringify(batch));
    for (const item of sources) await put(item.record.sourcePath, item.bytes);
    const untouched = ['assets/art/source/factions/ashen_compact-v4.png', 'assets/art/briefs/unit.guard.ashen_compact.json', 'assets/art/approved/unit.guard.ashen_compact.json'];
    for (const path of untouched) await put(path, 'Retained historical sentinel');
    const options = { repoRoot: root, batchId: 'naval', write: true };
    const prepared = await prepareFactionExpansion(options);
    expect(prepared).toHaveLength(36);
    for (const result of prepared) {
      expect(result.approved).toBe(false); expect(result.createdPaths).toHaveLength(4);
      const manifest = parseAssetManifest(JSON.parse(await readFile(join(root, result.briefPath), 'utf8')));
      expect(manifest.status).toBe('BRIEF_READY'); expect(manifest.review).toBeNull(); expect(manifest.validation).toBeNull();
      expect(manifest.contentIds).toEqual([result.id]); expect(manifest.nativeResolution).toEqual({ width: 96, height: 96 });
      expect(manifest.frames).toEqual([{ id: `${result.id}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: [48, 80], sourcePath: result.nativePath }]);
      expect(manifest.animation.states).toEqual({ idle: { frames: 1, fps: 4, loop: false } });
      const native = decodePng(await readFile(join(root, result.nativePath)));
      expect(native.width).toBe(96); expect(native.height).toBe(96);
      for (let x = 0; x < 96; x++) expect(native.data[((80 * 96) + x) * 4 + 3]).toBe(0);
      expect(manifest.referenceHashes).toContain(result.sourceHash);
      expect(manifest.processing[0]!.outputHash).toBe(result.nativeHash);
    }
    expect((await prepareFactionExpansion(options)).every(result => result.createdPaths.length === 0 && !result.replacedBrief)).toBe(true);
    for (const path of untouched) expect(await readFile(join(root, path), 'utf8')).toBe('Retained historical sentinel');
  });
});
