import { describe, expect, it } from 'vitest';
import {
  BIOME_YIELDS, BUILDINGS, CAMPAIGN_PACES, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_NAMES, CHARACTER_SKILLS,
  COMMANDER_ABILITIES, DOCTRINES, FACTIONS, FACTION_ECOLOGIES, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, FACTION_ROSTERS,
  IMPROVEMENTS, INSTITUTIONS, LOCALIZATION, NATURAL_FEATURES, PROSPERITY_PROJECT, ROSTER_VERSION, TECHNOLOGIES, UNITS,
  characterName, checksum, factionRoster, improvementsForRules, technologiesForRules, validateFactionContent,
} from './index';

describe('twenty-four cultures and frozen historical content', () => {
  it('preserves the genuine schema12 whole-pack seal, including all twelve original names and profiles', () => {
    const firstTwelve = <T>(record: Readonly<Record<string, T>>) => Object.fromEntries(Object.entries(record).slice(0, 12));
    expect(checksum(JSON.stringify({
      BUILDINGS, UNITS, FACTIONS: FACTIONS.slice(0, 12), TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES,
      CHARACTER_DEFINITIONS: CHARACTER_DEFINITIONS.slice(0, 3), CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES: firstTwelve(CHARACTER_NAMES),
      BIOME_YIELDS, FACTION_ECOLOGIES: firstTwelve(FACTION_ECOLOGIES), IMPROVEMENTS, NATURAL_FEATURES,
      FACTION_ROSTERS: { 1: FACTION_ROSTERS[1], 2: FACTION_ROSTERS[2], 3: FACTION_ROSTERS[3] },
      FACTION_PROFILES: firstTwelve(FACTION_PROFILES), FACTION_RECRUITMENT_WEIGHTS: firstTwelve(FACTION_RECRUITMENT_WEIGHTS),
    }))).toBe('3c54fb02');
  });
  it('preserves the independently captured whole schema-9 content checksum', () => {
    const oldNames = Object.fromEntries(Object.entries(CHARACTER_NAMES).slice(0, 6));
    const oldEcologies = Object.fromEntries(Object.entries(FACTION_ECOLOGIES).slice(0, 6));
    expect(checksum(JSON.stringify({
      BUILDINGS, UNITS, FACTIONS: FACTIONS.slice(0, 6), TECHNOLOGIES: technologiesForRules(9), INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES,
      CHARACTER_DEFINITIONS: CHARACTER_DEFINITIONS.slice(0, 3), CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES: oldNames,
      BIOME_YIELDS, FACTION_ECOLOGIES: oldEcologies, IMPROVEMENTS: improvementsForRules(9), NATURAL_FEATURES,
    }))).toBe('9418e598');
  });

  it('keeps independent four/six/twelve rosters and explicit new stable IDs', () => {
    expect(ROSTER_VERSION).toBe(4);
    expect(Object.values(FACTION_ROSTERS).map(ids => ids.length)).toEqual([4, 6, 12, 24]);
    expect(FACTIONS.slice(6, 12).map(faction => faction.id)).toEqual([
      'faction.mire_courts', 'faction.saltwind_remnant', 'faction.wardhall_remnant',
      'faction.rimehorn_clans', 'faction.sable_steppe', 'faction.morrow_spore',
    ]);
    expect(factionRoster(1)).toEqual(FACTIONS.slice(0, 4)); expect(factionRoster(2)).toEqual(FACTIONS.slice(0, 6));
    const copy = factionRoster(3); copy.reverse(); expect(factionRoster(3)).toEqual(FACTIONS.slice(0, 12));
    expect(factionRoster(4)).toEqual(FACTIONS);
    expect(FACTIONS).toHaveLength(24); expect(new Set(FACTIONS.map(faction => faction.id)).size).toBe(24);
    expect(FACTIONS[21]!.id).toBe('faction.vesper_court');
    expect(FACTIONS.some(faction => (faction.id as string) === 'faction.testament_union')).toBe(false);
    expect(() => validateFactionContent(UNITS)).not.toThrow();
  });

  it('covers the shared actual military roster with bounded positive preferences and honest explanations', () => {
    const original = { 'unit.guard': 2, 'unit.spearman': 1, 'unit.scout': 1, 'unit.heavy_infantry': 1, 'unit.cavalry': 1 };
    for (const faction of FACTIONS.slice(0, 6)) expect(FACTION_RECRUITMENT_WEIGHTS[faction.id]).toEqual(original);
    const newWeights = FACTIONS.slice(6, 12).map(faction => FACTION_RECRUITMENT_WEIGHTS[faction.id]!);
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
    expect(new Set(FACTIONS.map(faction => characterName(faction.id, 1))).size).toBe(24);
  });

  it('gives each new culture positive cultivation targets, signed drawbacks and a distinct complete ecology', () => {
    const expectedTargets = [[7, 8], [11], [1, 11], [3, 4], [6, 5], [2, 8]];
    for (const [i, faction] of FACTIONS.slice(6, 12).entries()) {
      const ecology = FACTION_ECOLOGIES[faction.id]!;
      expect(ecology.terraformBiomeIds).toEqual(expectedTargets[i]);
      expect(ecology.affinities.some(affinity => Object.values(affinity.yields).some(value => value < 0))).toBe(true);
      for (const target of ecology.terraformBiomeIds) expect(ecology.affinities.some(affinity => affinity.biomeId === target && Object.values(affinity.yields).some(value => value > 0))).toBe(true);
    }
    const signatures = FACTIONS.map(faction => JSON.stringify(FACTION_ECOLOGIES[faction.id]!.affinities));
    expect(new Set(signatures).size).toBe(24);
  });

  it('seals the adopted cohort’s exact modest ecology, paid recruitment weights and independent name pools', () => {
    const expected = [
      [[5, 11], [[5, 'industry', 1], [11, 'food', 1], [7, 'industry', -1], [3, 'food', -1]], [3, 4, 1, 1, 1]],
      [[6, 10], [[6, 'coin', 1], [10, 'knowledge', 1], [8, 'industry', -1], [7, 'coin', -1]], [2, 3, 2, 2, 3]],
      [[1, 11], [[1, 'knowledge', 1], [11, 'food', 1], [10, 'food', -1], [8, 'industry', -1]], [4, 2, 1, 2, 1]],
      [[6], [[9, 'industry', 1], [6, 'food', 1], [7, 'industry', -1], [8, 'coin', -1]], [1, 4, 4, 1, 1]],
      [[7, 1], [[7, 'industry', 1], [1, 'food', 1], [9, 'food', -1], [5, 'industry', -1]], [2, 4, 1, 4, 1]],
      [[5, 11], [[5, 'knowledge', 1], [11, 'coin', 1], [8, 'knowledge', -1], [10, 'coin', -1]], [2, 2, 3, 1, 2]],
      [[7], [[0, 'food', 1], [7, 'coin', 1], [3, 'food', -1], [5, 'industry', -1]], [3, 3, 1, 1, 2]],
      [[10, 6], [[10, 'knowledge', 1], [6, 'industry', 1], [7, 'food', -1], [8, 'knowledge', -1]], [3, 1, 2, 3, 1]],
      [[3, 11], [[3, 'industry', 1], [11, 'coin', 1], [7, 'industry', -1], [4, 'food', -1]], [4, 3, 1, 2, 1]],
      [[2, 3], [[2, 'knowledge', 1], [3, 'coin', 1], [5, 'food', -1], [10, 'coin', -1]], [1, 2, 1, 4, 3]],
      [[2, 6], [[2, 'food', 1], [6, 'coin', 1], [5, 'food', -1], [9, 'industry', -1]], [2, 3, 4, 1, 2]],
      [[10], [[9, 'knowledge', 1], [10, 'knowledge', 1], [8, 'knowledge', -1], [7, 'industry', -1]], [2, 1, 4, 2, 1]],
    ];
    for (const [index, faction] of FACTIONS.slice(12).entries()) {
      const ecology = FACTION_ECOLOGIES[faction.id]!, pool = CHARACTER_NAMES[faction.id]!;
      expect([ecology.terraformBiomeIds, ecology.affinities.flatMap(affinity => Object.entries(affinity.yields).filter(([, value]) => value !== 0).map(([key, value]) => [affinity.biomeId, key, value])), Object.values(FACTION_RECRUITMENT_WEIGHTS[faction.id]!)]).toEqual(expected[index]);
      expect(pool.given).toHaveLength(8); expect(pool.family).toHaveLength(8);
      expect(new Set(pool.given).size).toBe(8); expect(new Set(pool.family).size).toBe(8);
      for (const earlier of FACTIONS.slice(0, 12 + index)) {
        expect(pool.given).not.toEqual(CHARACTER_NAMES[earlier.id]!.given);
        expect(pool.family).not.toEqual(CHARACTER_NAMES[earlier.id]!.family);
      }
    }
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
