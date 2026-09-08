import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FACTION_ART_FAMILIES, FACTION_ART_IDS, FACTION_ART_ROLES, FACTION_LAND_ART_ROLES, FACTION_NAVAL_ART_ROLES, factionArtId } from './faction-art';
import { FACTION_SOURCE_KINDS, isFactionOriginalSource } from './faction-source';

describe('twenty-four authored culture bindings', () => {
  it('resolves each role exclusively from its exact definition ID', () => {
    expect(FACTION_ART_FAMILIES).toHaveLength(24);
    expect(FACTION_LAND_ART_ROLES).toHaveLength(15); expect(FACTION_NAVAL_ART_ROLES).toHaveLength(3);
    expect(FACTION_ART_ROLES).toHaveLength(18);
    expect(new Set(FACTION_ART_ROLES).size).toBe(18);
    expect(new Set(FACTION_ART_FAMILIES).size).toBe(24);
    expect(FACTION_ART_IDS).toHaveLength(432);
    expect(new Set(FACTION_ART_IDS).size).toBe(FACTION_ART_FAMILIES.length * FACTION_ART_ROLES.length);
    for (const family of FACTION_ART_FAMILIES) for (const role of FACTION_ART_ROLES) {
      expect(factionArtId(role, `faction.${family}`)).toBe(`${role}.${family}`);
      expect(factionArtId(role, family)).toBeUndefined();
      expect(factionArtId(role, `seat.${family}`)).toBeUndefined();
    }
  });

  it('retains the twelve historical identities and registers exactly the adopted next twelve directions', () => {
    expect(FACTION_ART_FAMILIES.slice(0, 12)).toEqual(['ashen_compact', 'reedbound_council', 'cinder_march', 'glass_tide', 'iron_covenant', 'sepulchral_synod', 'mire_courts', 'saltwind_remnant', 'wardhall_remnant', 'rimehorn_clans', 'sable_steppe', 'morrow_spore']);
    const directions = JSON.parse(readFileSync(new URL('../../../assets/art/source/faction-expansion/cohort24-art-direction.json', import.meta.url), 'utf8')) as { designs: { family: string }[] };
    expect(FACTION_ART_FAMILIES.slice(12)).toEqual(directions.designs.map(design => design.family));
    expect(FACTION_ART_FAMILIES).not.toContain('testament_union');
    expect(Object.fromEntries(FACTION_ART_FAMILIES.slice(0, 12).map(family => [family, FACTION_SOURCE_KINDS[family]]))).toEqual({
      ashen_compact: 'sheet', reedbound_council: 'sheet', cinder_march: 'sheet', glass_tide: 'sheet',
      iron_covenant: 'slice12', sepulchral_synod: 'slice12', mire_courts: 'batch', saltwind_remnant: 'batch',
      wardhall_remnant: 'batch', rimehorn_clans: 'batch', sable_steppe: 'batch', morrow_spore: 'batch',
    });
    for (const family of FACTION_ART_FAMILIES.slice(12)) expect(FACTION_SOURCE_KINDS[family]).toBe('batch');
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
      expect(isFactionOriginalSource(family, 'unit.guard', original.replace('/cohort12/', '/naval/'))).toBe(false);
    }
  });

  it('registers naval originals for all twenty-four cultures without reclassifying any historical land sources', () => {
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
