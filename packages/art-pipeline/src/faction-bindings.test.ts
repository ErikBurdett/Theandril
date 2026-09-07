import { describe, expect, it } from 'vitest';
import { FACTION_ART_FAMILIES, FACTION_ART_IDS, FACTION_ART_ROLES, FACTION_LAND_ART_ROLES, FACTION_NAVAL_ART_ROLES, factionArtId } from './faction-art';
import { FACTION_SOURCE_KINDS, isFactionOriginalSource } from './faction-source';

describe('twelve authored culture bindings', () => {
  it('resolves each role exclusively from its exact definition ID', () => {
    expect(FACTION_ART_FAMILIES).toHaveLength(12);
    expect(FACTION_LAND_ART_ROLES).toHaveLength(15); expect(FACTION_NAVAL_ART_ROLES).toHaveLength(3);
    expect(FACTION_ART_IDS).toHaveLength(216);
    expect(new Set(FACTION_ART_IDS).size).toBe(FACTION_ART_FAMILIES.length * FACTION_ART_ROLES.length);
    for (const family of FACTION_ART_FAMILIES) for (const role of FACTION_ART_ROLES) {
      expect(factionArtId(role, `faction.${family}`)).toBe(`${role}.${family}`);
      expect(factionArtId(role, family)).toBeUndefined();
      expect(factionArtId(role, `seat.${family}`)).toBeUndefined();
    }
  });

  it('keeps old source layouts and new individual batches explicit without implying publication', () => {
    expect(Object.keys(FACTION_SOURCE_KINDS).sort()).toEqual([...FACTION_ART_FAMILIES].sort());
    expect(isFactionOriginalSource('ashen_compact', 'unit.guard', 'assets/art/source/factions/ashen_compact-v4.png')).toBe(true);
    expect(isFactionOriginalSource('iron_covenant', 'unit.guard', 'assets/art/source/slice12/unit.guard.iron_covenant-v1.png')).toBe(true);
    for (const family of FACTION_ART_FAMILIES.filter(family => FACTION_SOURCE_KINDS[family] === 'batch')) {
      const original = `assets/art/source/faction-expansion/cohort12/unit.guard.${family}-v1.png`;
      expect(isFactionOriginalSource(family, 'unit.guard', original)).toBe(true);
      expect(isFactionOriginalSource(family, 'unit.scout', original)).toBe(false);
      expect(isFactionOriginalSource(family, 'unit.guard', original.replace('cohort12/', '../'))).toBe(false);
      expect(isFactionOriginalSource(family, 'unit.guard', original.replace('source/faction-expansion', 'approved'))).toBe(false);
    }
  });

  it('registers naval originals for all twelve cultures without reclassifying any historical land sources', () => {
    for (const family of FACTION_ART_FAMILIES) for (const role of FACTION_NAVAL_ART_ROLES) {
      const id = `${role}.${family}`, original = `assets/art/source/faction-expansion/naval/${id}-v1.png`;
      expect(factionArtId(role, `faction.${family}`)).toBe(id);
      expect(isFactionOriginalSource(family, role, original)).toBe(true);
      for (const invalid of [original.replace('/naval/', '/cohort12/'), original.replace('/source/', '/approved/'), original.replace('-v1.png', '-v0.png'), `assets/art/source/factions/${family}-v4.png`, `assets/art/source/slice12/${id}-v1.png`]) expect(isFactionOriginalSource(family, role, invalid)).toBe(false);
    }
  });

  it('does not manufacture approved art for unknown roles or player-edited realm names', () => {
    for (const family of FACTION_ART_FAMILIES) {
      for (const role of ['character.mage', 'ui.portrait']) {
        expect(factionArtId(role, `faction.${family}`)).toBeUndefined();
      }
    }
    expect(factionArtId('unit.guard', 'Iron Covenant')).toBeUndefined();
    expect(factionArtId('unit.guard', 'Sepulchral Synod')).toBeUndefined();
    expect(factionArtId('unit.guard', 'faction.IRON_COVENANT')).toBeUndefined();
  });
});
