import { describe, expect, it } from 'vitest';
import { FACTION_ART_FAMILIES, FACTION_ART_IDS, FACTION_ART_ROLES, factionArtId } from './faction-art';
import { FACTION_SOURCE_KINDS, isFactionOriginalSource } from './faction-source';

describe('twelve authored culture bindings', () => {
  it('resolves each role exclusively from its exact definition ID', () => {
    expect(FACTION_ART_FAMILIES).toHaveLength(12);
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

  it('does not manufacture approved art for ships, unknown roles or player-edited realm names', () => {
    for (const family of FACTION_ART_FAMILIES) {
      for (const role of ['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship', 'character.mage', 'ui.portrait']) {
        expect(factionArtId(role, `faction.${family}`)).toBeUndefined();
      }
    }
    expect(factionArtId('unit.guard', 'Iron Covenant')).toBeUndefined();
    expect(factionArtId('unit.guard', 'Sepulchral Synod')).toBeUndefined();
    expect(factionArtId('unit.guard', 'faction.IRON_COVENANT')).toBeUndefined();
  });
});
