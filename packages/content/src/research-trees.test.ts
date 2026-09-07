import { expect, test } from 'vitest';
import { BUILDINGS, FACTIONS, FACTION_ECOLOGIES, IMPROVEMENTS, TECHNOLOGIES, technologyBranch, technologiesForRules, improvementsForRules, improvementSchema, validateEcologyContent, validateProgressionContent } from './index';

test('research branches have real gates, independent knowledge costs and reachable effects', () => {
  expect(technologiesForRules(7).map(item => item.id)).toEqual(TECHNOLOGIES.slice(0, 2).map(item => item.id));
  expect(technologiesForRules(10)).toEqual(TECHNOLOGIES.slice(0, 4));
  expect(technologiesForRules(11)).toHaveLength(10);
  expect(improvementsForRules(10)).toEqual(IMPROVEMENTS.slice(0, 5));
  expect(improvementsForRules(11)).toHaveLength(10);
  expect(new Set(TECHNOLOGIES.map(technologyBranch))).toEqual(new Set(['craft', 'civic', 'navigation', 'stewardship']));
  for (const technology of TECHNOLOGIES.slice(4)) {
    expect(technology.introducedInRules).toBe(11);
    expect(technology.knowledgeCost).toBeGreaterThan(0);
    expect(technology.borderGrowthBonus || IMPROVEMENTS.some(item => item.requiredTechnologies?.includes(technology.id)), technology.id).toBeTruthy();
  }
  expect(() => validateProgressionContent(new Set(BUILDINGS.map(item => item.id)))).not.toThrow();
});

test('research-gated land construction rejects invented, duplicate and future requirements', () => {
  const first = IMPROVEMENTS[0]!, advanced = IMPROVEMENTS[5]!, factions = new Set(FACTIONS.map(item => item.id));
  expect(improvementSchema.safeParse({ ...advanced, requiredTechnologies: ['technology.stewardship', 'technology.stewardship'] }).success).toBe(false);
  expect(() => validateEcologyContent(factions, FACTION_ECOLOGIES, [{ ...advanced, requiredTechnologies: ['technology.unknown'] }])).toThrow('Unknown improvement technology');
  expect(() => validateEcologyContent(factions, FACTION_ECOLOGIES, [{ ...first, requiredTechnologies: ['technology.stewardship'] }])).toThrow('future research');
  expect(() => validateProgressionContent(new Set(BUILDINGS.map(item => item.id)), TECHNOLOGIES.map(item => item.id === 'technology.cinder_masonry' ? { ...item, requires: ['technology.stewardship'] } : item))).toThrow('future rules');
});
