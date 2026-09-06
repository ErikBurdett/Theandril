import { describe, expect, it } from 'vitest';
import {
  BIOME_YIELDS, BUILDINGS, CAMPAIGN_PACES, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_NAMES, CHARACTER_SKILLS,
  COMMANDER_ABILITIES, DOCTRINES, FACTIONS, FACTION_ECOLOGIES, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, FACTION_ROSTERS,
  IMPROVEMENTS, INSTITUTIONS, LOCALIZATION, NATURAL_FEATURES, PROSPERITY_PROJECT, ROSTER_VERSION, TECHNOLOGIES, UNITS,
  characterName, checksum, factionRoster, validateFactionContent,
} from './index';

describe('twelve-culture roster and frozen introductory content', () => {
  it('preserves the independently captured whole schema-9 content checksum', () => {
    const oldNames = Object.fromEntries(Object.entries(CHARACTER_NAMES).slice(0, 6));
    const oldEcologies = Object.fromEntries(Object.entries(FACTION_ECOLOGIES).slice(0, 6));
    expect(checksum(JSON.stringify({
      BUILDINGS, UNITS, FACTIONS: FACTIONS.slice(0, 6), TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES,
      CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES: oldNames,
      BIOME_YIELDS, FACTION_ECOLOGIES: oldEcologies, IMPROVEMENTS, NATURAL_FEATURES,
    }))).toBe('9418e598');
  });

  it('keeps independent four/six/twelve rosters and explicit new stable IDs', () => {
    expect(ROSTER_VERSION).toBe(3);
    expect(Object.values(FACTION_ROSTERS).map(ids => ids.length)).toEqual([4, 6, 12]);
    expect(FACTIONS.slice(6).map(faction => faction.id)).toEqual([
      'faction.mire_courts', 'faction.saltwind_remnant', 'faction.wardhall_remnant',
      'faction.rimehorn_clans', 'faction.sable_steppe', 'faction.morrow_spore',
    ]);
    expect(factionRoster(1)).toEqual(FACTIONS.slice(0, 4)); expect(factionRoster(2)).toEqual(FACTIONS.slice(0, 6));
    const copy = factionRoster(3); copy.reverse(); expect(factionRoster(3)).toEqual(FACTIONS);
    expect(() => validateFactionContent(UNITS)).not.toThrow();
  });

  it('covers the shared actual military roster with bounded positive preferences and honest explanations', () => {
    const original = { 'unit.guard': 2, 'unit.spearman': 1, 'unit.scout': 1, 'unit.heavy_infantry': 1, 'unit.cavalry': 1 };
    for (const faction of FACTIONS.slice(0, 6)) expect(FACTION_RECRUITMENT_WEIGHTS[faction.id]).toEqual(original);
    const newWeights = FACTIONS.slice(6).map(faction => FACTION_RECRUITMENT_WEIGHTS[faction.id]!);
    expect(new Set(newWeights.map(value => JSON.stringify(value))).size).toBe(6);
    expect(FACTION_RECRUITMENT_WEIGHTS['faction.sable_steppe']!['unit.cavalry']).toBe(4);
    for (const faction of FACTIONS) {
      expect(FACTION_PROFILES[faction.id]!.description.length).toBeGreaterThan(40);
      expect(FACTION_PROFILES[faction.id]!.recruitmentRationale.length).toBeGreaterThan(40);
      expect(LOCALIZATION[faction.id + '.description']).toBe(FACTION_PROFILES[faction.id]!.description);
      expect(LOCALIZATION[faction.id + '.recruitmentRationale']).toBe(FACTION_PROFILES[faction.id]!.recruitmentRationale);
      expect(Object.values(FACTION_RECRUITMENT_WEIGHTS[faction.id]!).every(value => value >= 1 && value <= 8)).toBe(true);
      const names = Array.from({ length: 130 }, (_, i) => characterName(faction.id, i + 1));
      expect(new Set(names).size).toBe(names.length); expect(characterName(faction.id, 1)).toBe(names[0]);
    }
    expect(new Set(FACTIONS.map(faction => characterName(faction.id, 1))).size).toBe(12);
  });

  it('gives each new culture positive cultivation targets, signed drawbacks and a distinct complete ecology', () => {
    const expectedTargets = [[7, 8], [11], [1, 11], [3, 4], [6, 5], [2, 8]];
    for (const [i, faction] of FACTIONS.slice(6).entries()) {
      const ecology = FACTION_ECOLOGIES[faction.id]!;
      expect(ecology.terraformBiomeIds).toEqual(expectedTargets[i]);
      expect(ecology.affinities.some(affinity => Object.values(affinity.yields).some(value => value < 0))).toBe(true);
      for (const target of ecology.terraformBiomeIds) expect(ecology.affinities.some(affinity => affinity.biomeId === target && Object.values(affinity.yields).some(value => value > 0))).toBe(true);
    }
    const signatures = FACTIONS.map(faction => JSON.stringify(FACTION_ECOLOGIES[faction.id]!.affinities));
    expect(new Set(signatures).size).toBe(12);
  });

  it('rejects missing, unknown, zero, fractional or nonmilitary recruitment weights', () => {
    const faction = FACTIONS[6].id, weights = FACTION_RECRUITMENT_WEIGHTS[faction]!;
    for (const invalid of [0, -1, 1.5, 9, NaN]) expect(() => validateFactionContent(UNITS, { ...FACTION_RECRUITMENT_WEIGHTS, [faction]: { ...weights, 'unit.guard': invalid } })).toThrow('Invalid faction recruitment');
    expect(() => validateFactionContent(UNITS, {})).toThrow('exact roster');
    expect(() => validateFactionContent(UNITS, { ...FACTION_RECRUITMENT_WEIGHTS, 'faction.missing': weights })).toThrow('exact roster');
    expect(() => validateFactionContent(UNITS, FACTION_RECRUITMENT_WEIGHTS, {})).toThrow('exact roster');
    expect(() => validateFactionContent([...UNITS, { ...UNITS[1]!, id: 'unit.fake' }])).toThrow('actual land military roster');
  });
});
