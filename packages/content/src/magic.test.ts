import { expect, test } from 'vitest';
import { ARCANE_DISCOVERIES, BATTLE_SPELLS, BUILDINGS, CHARACTER_DEFINITIONS, INNATE_BATTLE_ABILITIES, LOCALIZATION, MAGIC_PATHS, MAX_CASTER_STRAIN, validateContent, validateMagicContent } from './index';

test('magic registries describe actual paid research, personal paths and bounded battle effects', () => {
  expect(validateContent()).toMatchObject({ arcaneDiscoveries: 3, battleSpells: 3, magicPaths: 2, innateBattleAbilities: 1 });
  expect(CHARACTER_DEFINITIONS.find(item => item.role === 'waykeeper')).toMatchObject({ coinCost: 40, upkeep: 3, leadership: { attack: 0, armor: 0 }, skillIds: [], missionIds: [] });
  expect(BATTLE_SPELLS.map(item => item.kind)).toEqual(['damage', 'counter', 'ward']);
  expect(BATTLE_SPELLS.every(item => item.strainCost > 0 && item.strainCost <= MAX_CASTER_STRAIN && item.uses >= 1 && item.uses <= 2)).toBe(true);
  for (const item of [...ARCANE_DISCOVERIES, ...BATTLE_SPELLS, ...MAGIC_PATHS, ...INNATE_BATTLE_ABILITIES]) {
    expect(LOCALIZATION[item.id + '.name']).toBe(item.name); expect(LOCALIZATION[item.id + '.description']).toBe(item.description);
  }
});
test('magic rejects broken personal/national relationships and duplicated discovery references', () => {
  const characters = new Set(CHARACTER_DEFINITIONS.map(item => item.id)), buildings = new Set(BUILDINGS.map(item => item.id));
  expect(() => validateMagicContent(characters, buildings, [...ARCANE_DISCOVERIES, ARCANE_DISCOVERIES[0]!])).toThrow('Duplicate');
  expect(() => validateMagicContent(characters, buildings, ARCANE_DISCOVERIES, BATTLE_SPELLS.map(item => ({ ...item, pathId: 'path.missing' })))).toThrow();
  expect(() => validateMagicContent(characters, buildings, ARCANE_DISCOVERIES, BATTLE_SPELLS.map(item => ({ ...item, strainCost: 0 })))).toThrow();
  expect(() => validateMagicContent(characters, buildings, ARCANE_DISCOVERIES, BATTLE_SPELLS.map(item => ({ ...item, discoveryId: 'technology.cinder_masonry' })))).toThrow();
});
