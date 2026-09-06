import { expect, test } from 'vitest';
import { BUILDINGS, CAMPAIGN_PACES, CONTENT_HASH, DOCTRINES, INSTITUTIONS, LOCALIZATION, PROSPERITY_PROJECT, TECHNOLOGIES, campaignPaceProfileSchema, campaignPaceSchema, checksum, doctrineSchema, technologySchema, validateContent, validateProgressionContent, unitSchema } from './index';
test('the starter pack has unique valid IDs, localization and bounded numeric parameters', () => {
  expect(validateContent()).toMatchObject({ buildings: 4, units: 6, factions: 4, technologies: 2, institutions: 2, doctrines: 2, projects: 1 });
});
test('content rejects malformed costs', () => {
  expect(unitSchema.safeParse({ id: 'unit.invalid', cost: -1 }).success).toBe(false);
});

test('progression definitions have distinct effects and localized original descriptions', () => {
  expect(TECHNOLOGIES.map(item => item.effects)).not.toEqual([TECHNOLOGIES[0]!.effects, TECHNOLOGIES[0]!.effects]);
  expect(INSTITUTIONS[0]!.effects.coin).toBeGreaterThan(0);
  expect(INSTITUTIONS[1]!.effects.food).toBeGreaterThan(0);
  expect(DOCTRINES[0]!.effects.armor).toBeGreaterThan(0);
  expect(DOCTRINES[1]!.effects.movement).toBeGreaterThan(0);
  for (const item of [...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES, PROSPERITY_PROJECT]) {
    expect(LOCALIZATION[item.id + '.description']).toBe(item.description);
  }
  expect(CONTENT_HASH).not.toBe('4dec81ae');
  expect(checksum(JSON.stringify(TECHNOLOGIES))).not.toBe(checksum(JSON.stringify(TECHNOLOGIES.map(item => ({ ...item, knowledgeCost: item.knowledgeCost + 1 })))));
});

test('progression rejects unknown references, duplicate IDs and prerequisite cycles', () => {
  const buildingIds = new Set(BUILDINGS.map(item => item.id));
  expect(() => validateProgressionContent(buildingIds, [{ ...TECHNOLOGIES[0]!, requires: ['technology.missing'] }])).toThrow('Unknown technology');
  expect(() => validateProgressionContent(buildingIds, [TECHNOLOGIES[0]!, TECHNOLOGIES[0]!])).toThrow('Duplicate progression');
  const cyclic = TECHNOLOGIES.map((item, index) => ({ ...item, requires: [TECHNOLOGIES[1 - index]!.id] }));
  expect(() => validateProgressionContent(buildingIds, cyclic)).toThrow('Cyclic');
  expect(() => validateProgressionContent(new Set())).toThrow('Unknown project building');
  expect(() => validateProgressionContent(buildingIds, TECHNOLOGIES, [], DOCTRINES)).toThrow('Unknown project institution');
});

test('progression numeric and shape bounds reject malformed proposed packs', () => {
  expect(technologySchema.safeParse({ ...TECHNOLOGIES[0], knowledgeCost: -1 }).success).toBe(false);
  expect(technologySchema.safeParse({ ...TECHNOLOGIES[0], effects: { ...TECHNOLOGIES[0]!.effects, industry: 1000 } }).success).toBe(false);
  expect(doctrineSchema.safeParse({ ...DOCTRINES[0], effects: { ...DOCTRINES[0]!.effects, hiddenOmniscience: true } }).success).toBe(false);
});

test('campaign paces scale late investment and public response windows, not early units or a turn gate', () => {
  expect(CAMPAIGN_PACES.short).toMatchObject({ civicKnowledgeCost: 40, projectCoinCost: 120, projectActiveTurns: 5 });
  let prior = CAMPAIGN_PACES.short;
  for (const pace of campaignPaceSchema.options) {
    const profile = CAMPAIGN_PACES[pace];
    expect(campaignPaceProfileSchema.safeParse(profile).success).toBe(true);
    expect(profile.projectCoinCost).toBeGreaterThanOrEqual(prior.projectCoinCost);
    expect(profile.projectActiveTurns).toBeGreaterThanOrEqual(prior.projectActiveTurns);
    expect(LOCALIZATION['pace.' + pace + '.name']).toBe(profile.name);
    expect(profile).not.toHaveProperty('minimumTurn');
    expect(profile).not.toHaveProperty('aiStrength');
    prior = profile;
  }
  expect(campaignPaceProfileSchema.safeParse({ ...CAMPAIGN_PACES.standard, projectCoinCost: -1 }).success).toBe(false);
  expect(PROSPERITY_PROJECT.description).not.toContain('five');
});
