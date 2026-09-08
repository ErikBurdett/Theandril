import { describe, expect, it } from 'vitest';
import { FACTION_ART_FAMILIES, FACTION_LAND_ART_ROLES, FACTION_NAVAL_ART_ROLES, type FactionArtFamily, type FactionArtRole } from './faction-art';
import { FACTION_SOURCE_KINDS, factionExpansionBatchSchema, type FactionExpansionBatch } from './faction-source';

/** Synthetic provenance-schema fixtures only: these hashes do not claim PNG generation. */
const source = (family: FactionArtFamily, role: FactionArtRole, batchId: string, index: number): FactionExpansionBatch['sources'][number] => ({
  id: `${role}.${family}`, family, role, version: 1,
  sourcePath: `assets/art/source/faction-expansion/${batchId}/${role}.${family}-v1.png`,
  sourceHash: index.toString(16).padStart(64, '0'), prompt: 'Synthetic identity validation only, not an original image or approval.',
  provider: 'codex-imagegen', model: 'not-exposed-by-tool', seed: null,
  generatedAt: '2026-09-07T00:00:00.000Z', referenceHashes: [],
});

describe('twenty-four-culture individual source routing', () => {
  it('accepts all 72 unique hull originals in the existing dedicated naval batch', () => {
    const sources = FACTION_ART_FAMILIES.flatMap((family, familyIndex) => FACTION_NAVAL_ART_ROLES.map((role, roleIndex) => source(family, role, 'naval', familyIndex * 3 + roleIndex)));
    expect(sources).toHaveLength(72);
    expect(factionExpansionBatchSchema.parse({ schemaVersion: 1, batchId: 'naval', sources }).sources).toEqual(sources);
  });

  it('accepts four new land kits per batch without altering the 90-source bound', () => {
    const sources = FACTION_ART_FAMILIES.slice(12, 16).flatMap((family, familyIndex) => FACTION_LAND_ART_ROLES.map((role, roleIndex) => source(family, role, 'wellroads', familyIndex * 15 + roleIndex)));
    expect(sources).toHaveLength(60);
    expect(factionExpansionBatchSchema.parse({ schemaVersion: 1, batchId: 'wellroads', sources }).sources).toEqual(sources);
    const all = FACTION_ART_FAMILIES.filter(family => FACTION_SOURCE_KINDS[family] === 'batch').flatMap((family, familyIndex) => FACTION_LAND_ART_ROLES.map((role, roleIndex) => source(family, role, 'bounded', familyIndex * 15 + roleIndex)));
    expect(factionExpansionBatchSchema.safeParse({ schemaVersion: 1, batchId: 'bounded', sources: all.slice(0, 90) }).success).toBe(true);
    expect(factionExpansionBatchSchema.safeParse({ schemaVersion: 1, batchId: 'bounded', sources: all.slice(0, 91) }).success).toBe(false);
  });

  it('requires one independent original per role, rejecting duplicate IDs, paths and pixel hashes', () => {
    const first = source('cistern_assembly', 'unit.guard', 'wellroads', 1);
    const second = source('cistern_assembly', 'unit.scout', 'wellroads', 2);
    for (const key of ['id', 'sourcePath', 'sourceHash'] as const) {
      expect(() => factionExpansionBatchSchema.parse({ schemaVersion: 1, batchId: 'wellroads', sources: [first, { ...second, [key]: first[key] }] })).toThrow(`Duplicate source ${key}`);
    }
  });

  it('rejects cross-role, cross-culture, reserved-naval, old-sheet and unregistered substitutions', () => {
    const guard = source('unsealed_companies', 'unit.guard', 'wellroads', 1);
    const invalid = [
      { ...guard, family: 'cistern_assembly' }, { ...guard, role: 'unit.scout' },
      { ...guard, family: 'ashen_compact', id: 'unit.guard.ashen_compact' },
      { ...guard, family: 'testament_union', id: 'unit.guard.testament_union' },
      { ...guard, sourcePath: guard.sourcePath.replace('/wellroads/', '/naval/') },
      { ...guard, sourcePath: guard.sourcePath.replace('/wellroads/', '/../') },
      { ...guard, sourcePath: guard.sourcePath.replace('/source/', '/approved/') },
    ];
    for (const item of invalid) expect(factionExpansionBatchSchema.safeParse({ schemaVersion: 1, batchId: 'wellroads', sources: [item] }).success).toBe(false);
    expect(factionExpansionBatchSchema.safeParse({ schemaVersion: 1, batchId: 'naval', sources: [source('cistern_assembly', 'unit.guard', 'naval', 1)] }).success).toBe(false);
    expect(factionExpansionBatchSchema.safeParse({ schemaVersion: 1, batchId: 'wellroads', sources: [source('cistern_assembly', 'unit.transport', 'wellroads', 1)] }).success).toBe(false);
  });
});
