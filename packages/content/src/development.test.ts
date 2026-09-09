import { describe, expect, it } from 'vitest';
import { BUILDINGS, DOCTRINES, INSTITUTIONS, TECHNOLOGIES } from './index';
import { CHARACTER_DEFINITIONS, CHARACTER_SKILLS, LEGACY_CHARACTER_DEFINITIONS, characterDefinitionsForRules, characterSkillsForRules, validateCharacterContent } from './characters';
import { RESOURCES } from './resources';
import { FACTIONS } from './factions';
import { ADVANCED_CHARACTER_SKILLS, DEVELOPMENT_NODES, FORMATION_TRAINING, HEARTH_DEVELOPMENTS, FACTION_TRADITIONS, validateDevelopmentContent } from './development';

const references = { buildings: new Set(BUILDINGS.map(item => item.id)), technologies: new Set(TECHNOLOGIES.map(item => item.id)), institutions: new Set(INSTITUTIONS.map(item => item.id)), doctrines: new Set(DOCTRINES.map(item => item.id)), resources: new Set(RESOURCES.map(item => item.id)) };
describe('distinct development content', () => {
  it('has paid branching company, civic and tradition graphs with every strategic material consumed', () => {
    validateDevelopmentContent(references);
    expect([FORMATION_TRAINING.length, HEARTH_DEVELOPMENTS.length, FACTION_TRADITIONS.length]).toEqual([8, 9, 8]);
    expect(new Set(DEVELOPMENT_NODES.map(item => item.id)).size).toBe(25);
    expect(new Set(DEVELOPMENT_NODES.flatMap(item => Object.keys(item.resourceCosts ?? {})))).toEqual(references.resources);
    for (const node of DEVELOPMENT_NODES) {
      expect(node.progressCost).toBeGreaterThan(0); expect(node.coinCost).toBeGreaterThan(0);
      expect(Object.values(node.effects).some(Boolean)).toBe(true);
    }
    expect(FORMATION_TRAINING.filter(item => item.exclusiveGroup === 'company_method')).toHaveLength(3);
    expect(HEARTH_DEVELOPMENTS.filter(item => item.exclusiveGroup === 'hearth_specialization')).toHaveLength(3);
    expect(FACTION_TRADITIONS.every(item => item.requiredInstitution || item.requiredDoctrine)).toBe(true);
  });
  it('rejects foreign-scope edges, future/cyclic stages, unknown materials and inappropriate effects', () => {
    const replace = (id: string, values: Partial<typeof DEVELOPMENT_NODES[number]>) => DEVELOPMENT_NODES.map(item => item.id === id ? { ...item, ...values } : item);
    expect(() => validateDevelopmentContent(references, replace('training.field_habits', { requiresAll: ['training.breakthrough'] }))).toThrow('cyclic');
    expect(() => validateDevelopmentContent(references, replace('training.breakthrough', { requiresAll: ['hearth.common_store'] }))).toThrow('incompatible');
    expect(() => validateDevelopmentContent(references, replace('training.breakthrough', { resourceCosts: { 'resource.unknown': 3 } }))).toThrow('material');
    expect(() => validateDevelopmentContent(references, replace('training.breakthrough', { effects: { ...FORMATION_TRAINING[0]!.effects, food: 4 } }))).toThrow('settlement yields');
    expect(() => validateDevelopmentContent(references, replace('hearth.common_store', { effects: { ...HEARTH_DEVELOPMENTS[0]!.effects, attack: 4 } }))).toThrow('formation stats');
    expect(() => validateDevelopmentContent(references, [...DEVELOPMENT_NODES, DEVELOPMENT_NODES[0]!])).toThrow('Duplicate');
  });
  it('adds six earned officer continuations while preserving the exact old definition projection', () => {
    validateCharacterContent(new Set(FACTIONS.map(faction => faction.id)));
    expect(ADVANCED_CHARACTER_SKILLS).toHaveLength(6); expect(CHARACTER_SKILLS).toHaveLength(17);
    expect(characterSkillsForRules(15)).toHaveLength(11);
    expect(characterDefinitionsForRules(15)).toEqual(LEGACY_CHARACTER_DEFINITIONS);
    for (const old of LEGACY_CHARACTER_DEFINITIONS) {
      const current = CHARACTER_DEFINITIONS.find(item => item.id === old.id)!;
      expect({ ...current, skillIds: current.skillIds.filter(id => !ADVANCED_CHARACTER_SKILLS.some(skill => skill.id === id)) }).toEqual(old);
    }
    expect(ADVANCED_CHARACTER_SKILLS.every(skill => skill.introducedInRules === 16 && skill.requiresAll.length && skill.experienceCost >= 24)).toBe(true);
    expect(CHARACTER_SKILLS.filter(skill => !ADVANCED_CHARACTER_SKILLS.includes(skill)).every(skill => !Object.hasOwn(skill, 'introducedInRules'))).toBe(true);
  });
});
