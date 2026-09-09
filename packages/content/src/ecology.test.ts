import { expect, test } from 'vitest';
import { BIOME, FEATURE, TERRAIN, WATER_DEPTH } from '../../mapgen/src/index';
import { BIOME_YIELDS, CHARACTER_NAMES, FACTIONS, FACTION_ECOLOGIES, IMPROVEMENTS, LOCALIZATION, NATURAL_FEATURES, checksum, factionEcologySchema, improvementSchema, landYieldSchema, validateEcologyContent } from './index';

const factionIds = new Set<string>(FACTIONS.map(item => item.id));
test('twenty-four ecologies cover the exact faction catalogue without altering original factions or naming pools', () => {
  // Sealed raw pre-ecology values; no claim that the dirty worktree was a commit.
  expect(checksum(JSON.stringify(FACTIONS.slice(0, 4)))).toBe('8c0b2c55');
  expect(checksum(JSON.stringify(Object.fromEntries(Object.entries(CHARACTER_NAMES).slice(0, 4))))).toBe('35e973fa');
  expect(FACTIONS.slice(4, 6).map(item => item.id)).toEqual(['faction.iron_covenant', 'faction.sepulchral_synod']);
  expect(Object.keys(FACTION_ECOLOGIES)).toEqual(FACTIONS.map(item => item.id));
  expect(() => validateEcologyContent(factionIds)).not.toThrow();
  for (const ecology of Object.values(FACTION_ECOLOGIES)) {
    expect(ecology.terraformBiomeIds.every(biome => biome !== BIOME.ocean && biome !== BIOME.alpine)).toBe(true);
    expect(ecology.affinities.some(item => Object.values(item.yields).some(value => value > 0))).toBe(true);
    expect(ecology.affinities.some(item => Object.values(item.yields).some(value => value < 0))).toBe(true);
  }
  expect(FACTION_ECOLOGIES['faction.glass_tide']!.terraformBiomeIds).toEqual([BIOME.chalkland]);
  expect(FACTION_ECOLOGIES['faction.iron_covenant']!.terraformBiomeIds).toEqual([BIOME.taiga]);
  expect(FACTION_ECOLOGIES['faction.sepulchral_synod']!.terraformBiomeIds).toEqual([BIOME.chalkland, BIOME.desert]);
});

test('dependency-free biome and feature numbers cover actual geography and all new descriptions are localized', () => {
  expect(Object.keys(BIOME_YIELDS).map(Number)).toEqual(Object.values(BIOME));
  expect(NATURAL_FEATURES.map(item => item.feature)).toEqual(Object.values(FEATURE));
  for (const item of [...NATURAL_FEATURES, ...IMPROVEMENTS]) {
    expect(LOCALIZATION[item.id + '.name']).toBe(item.name);
    expect(LOCALIZATION[item.id + '.description']).toBe(item.description);
  }
  for (const definition of IMPROVEMENTS) for (const site of definition.sites) {
    expect(site.terrainIds.every(id => Object.values(TERRAIN).some(value => value === id))).toBe(true);
    expect(site.biomeIds?.every(id => Object.values(BIOME).some(value => value === id)) ?? true).toBe(true);
    expect(site.waterDepthIds?.every(id => Object.values(WATER_DEPTH).some(value => value === id)) ?? true).toBe(true);
  }
});

test('original five paid improvements retain exact costs; general works expose real signed tradeoffs', () => {
  expect(IMPROVEMENTS.slice(0, 5).map(item => [item.id, item.coinCost, item.turns])).toEqual([
    ['improvement.terraced_fields', 18, 2], ['improvement.managed_woodlot', 24, 3], ['improvement.quarry', 28, 3], ['improvement.reedworks', 22, 2], ['improvement.shore_fishery', 24, 2],
  ]);
  for (const improvement of IMPROVEMENTS.filter(item => !item.requiredResourceId)) {
    expect(improvement.featureModifiers.some(item => Object.values(item.yields).some(value => value > 0))).toBe(true);
    expect(improvement.featureModifiers.some(item => Object.values(item.yields).some(value => value < 0))).toBe(true);
  }
  expect(IMPROVEMENTS[2]!.yields.food).toBe(-1);
  expect(IMPROVEMENTS[4]!.sites).toEqual([{ terrainIds: [TERRAIN.water], biomeIds: [BIOME.ocean], waterDepthIds: [WATER_DEPTH.shallow] }]);
  expect(NATURAL_FEATURES.find(item => item.feature === FEATURE.waterlogging)!.yields.industry).toBe(-1);
});

test('ecology schemas reject invented references, conflicting flags, impossible sites and duplicate contributions', () => {
  const first = IMPROVEMENTS[0]!, ecology = FACTION_ECOLOGIES['faction.ashen_compact']!;
  expect(() => validateEcologyContent(new Set())).toThrow('Unknown ecology faction');
  expect(() => validateEcologyContent(factionIds, {})).toThrow('Missing faction ecology');
  expect(() => validateEcologyContent(factionIds, FACTION_ECOLOGIES, [first, first])).toThrow('Duplicate ecology content');
  expect(() => validateEcologyContent(factionIds, FACTION_ECOLOGIES, IMPROVEMENTS, NATURAL_FEATURES.slice(1))).toThrow('seven geography');
  expect(() => validateEcologyContent(factionIds, FACTION_ECOLOGIES, [{ ...first, sites: [{ terrainIds: [0, 1], biomeIds: [0], waterDepthIds: [0] }] }])).toThrow('Impossible improvement');
  expect(() => validateEcologyContent(factionIds, { ...FACTION_ECOLOGIES, [ecology.factionId]: { ...ecology, terraformBiomeIds: [9] } })).toThrow('alpine');
  expect(improvementSchema.safeParse({ ...first, sites: [{ terrainIds: [1], requiredFeatures: 1, forbiddenFeatures: 1 }] }).success).toBe(false);
  expect(improvementSchema.safeParse({ ...first, sites: [{ terrainIds: [1], requiredFeatures: 128 }] }).success).toBe(false);
  expect(improvementSchema.safeParse({ ...first, featureModifiers: [first.featureModifiers[0], first.featureModifiers[0]] }).success).toBe(false);
  expect(improvementSchema.safeParse({ ...first, coinCost: -1 }).success).toBe(false);
  expect(factionEcologySchema.safeParse({ ...ecology, terraformBiomeIds: [0] }).success).toBe(false);
  expect(factionEcologySchema.safeParse({ ...ecology, affinities: [ecology.affinities[0], ecology.affinities[0]] }).success).toBe(false);
  expect(landYieldSchema.safeParse({ food: -11, industry: 0, coin: 0, knowledge: 0 }).success).toBe(false);
});
