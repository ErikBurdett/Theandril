import { expect, test } from 'vitest';
import { CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_NAMES, CHARACTER_SKILLS, COMMANDER_ABILITIES, FACTIONS, LOCALIZATION, characterDefinitionSchema, characterMissionSchema, characterName, validateCharacterContent, validateContent } from './index';

const factions = new Set(FACTIONS.map(item => item.id));
test('character content has real distinct roles, effects and localized names and descriptions', () => {
  expect(validateContent()).toMatchObject({ characterRoles: 4, characterMissions: 3, characterSkills: 17, commanderAbilities: 1 });
  expect(CHARACTER_DEFINITIONS.map(item => item.role)).toEqual(['marshal', 'surveyor', 'engineer', 'waykeeper']);
  expect(CHARACTER_MISSIONS.map(item => item.kind)).toEqual(['survey', 'refit', 'sabotage']);
  expect(CHARACTER_MISSIONS.find(item => item.kind === 'sabotage')?.failureChance).toBeGreaterThan(0);
  for (const item of [...CHARACTER_DEFINITIONS, ...CHARACTER_MISSIONS, ...CHARACTER_SKILLS, ...COMMANDER_ABILITIES]) {
    expect(LOCALIZATION[item.id + '.name']).toBe(item.name);
    expect(LOCALIZATION[item.id + '.description']).toBe(item.description);
  }
});
test('branching skill trees have attainable prerequisites, unchanged old specializations and real command ceilings', () => {
  const muster = CHARACTER_SKILLS.find(skill => skill.id === 'skill.muster_rolls')!;
  const orders = CHARACTER_SKILLS.find(skill => skill.id === 'skill.field_orders')!;
  expect(muster.requiresAny).toEqual(['skill.steadfast', 'skill.decisive']);
  expect(orders.requiresAll).toEqual([muster.id]);
  expect(16 + muster.commandCapacityBonus + orders.commandCapacityBonus).toBe(20);
  const changed = (id: string, values: Partial<typeof muster>) => CHARACTER_SKILLS.map(skill => skill.id === id ? { ...skill, ...values } : skill);
  expect(() => validateCharacterContent(factions, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, changed(muster.id, { requiresAny: [], requiresAll: ['skill.steadfast', 'skill.decisive'] }))).toThrow('Unreachable');
  expect(() => validateCharacterContent(factions, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, changed(muster.id, { requiresAny: [orders.id] }))).toThrow('cyclic');
  expect(() => validateCharacterContent(factions, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, changed(muster.id, { requiresAny: ['skill.fieldcraft'] }))).toThrow('incompatible');
});
test('character packs reject broken, duplicate and role-incompatible references', () => {
  expect(() => validateCharacterContent(factions, [...CHARACTER_DEFINITIONS, CHARACTER_DEFINITIONS[0]!])).toThrow('Duplicate character');
  expect(() => validateCharacterContent(factions, [{ ...CHARACTER_DEFINITIONS[0]!, missionIds: ['mission.missing'] }])).toThrow('Unknown character mission');
  expect(() => validateCharacterContent(factions, [{ ...CHARACTER_DEFINITIONS[0]!, skillIds: ['skill.siegecraft'] }])).toThrow('incompatible character skill');
  expect(() => validateCharacterContent(factions, [{ ...CHARACTER_DEFINITIONS[0]!, skillIds: ['skill.steadfast', 'skill.steadfast'] }])).toThrow('Duplicate character capability');
  expect(() => validateCharacterContent(factions, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, [])).toThrow('Rally');
  expect(characterMissionSchema.safeParse({ ...CHARACTER_MISSIONS[0], radius: 200 }).success).toBe(false);
  expect(characterDefinitionSchema.safeParse({ ...CHARACTER_DEFINITIONS[0], hiddenTreasury: 100 }).success).toBe(false);
});
test('culture-specific names are deterministic, bounded, unique over recruitment serials and validated', () => {
  for (const faction of factions) {
    const names = Array.from({ length: 300 }, (_, index) => characterName(faction, index + 1));
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(Array.from({ length: 300 }, (_, index) => characterName(faction, index + 1)));
    expect(names.every(name => name.length <= 80)).toBe(true);
  }
  expect(() => characterName('faction.missing', 1)).toThrow('Invalid');
  expect(() => characterName('faction.ashen_compact', 0)).toThrow('Invalid');
  expect(() => validateCharacterContent(factions, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, {})).toThrow('Missing character');
  expect(() => validateCharacterContent(new Set(), CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES)).toThrow('Unknown character naming');
});
