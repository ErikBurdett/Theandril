import { expect, test } from 'vitest';
import { BUILDINGS, CAMPAIGN_PACES, CONTENT_HASH, DOCTRINES, INSTITUTIONS, LOCALIZATION, PROSPERITY_PROJECT, TECHNOLOGIES, UNITS, buildingSchema, campaignPaceProfileSchema, campaignPaceSchema, checksum, doctrineSchema, technologySchema, validateContent, validateProductionContent, validateProgressionContent, unitSchema } from './index';
test('the starter pack has unique valid IDs, localization and bounded numeric parameters', () => {
  expect(validateContent()).toMatchObject({ buildings: 5, units: 9, factions: 4, technologies: 4, institutions: 2, doctrines: 2, projects: 1 });
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
  const cyclic = TECHNOLOGIES.slice(0, 2).map((item, index) => ({ ...item, requires: [TECHNOLOGIES[1 - index]!.id] }));
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

test('naval additions preserve the six original units, four buildings and two technologies byte-for-byte', () => {
  // Frozen production/progression subset from pre-naval commit cb068f8 (save7 pack9442246b).
  expect(checksum(JSON.stringify({ BUILDINGS: BUILDINGS.slice(0, 4), UNITS: UNITS.slice(0, 6), TECHNOLOGIES: TECHNOLOGIES.slice(0, 2) }))).toBe('62a13dc2');
  for (const unit of UNITS.slice(0, 6)) {
    expect(unit).not.toHaveProperty('naval');
    expect(unit).not.toHaveProperty('movementDomain');
    expect(unitSchema.parse(unit)).toEqual(unit);
  }
  expect(CONTENT_HASH).not.toBe('9442246b');
});

test('transport, coastal escort and ocean escort have distinct useful data-driven capabilities', () => {
  const ships = UNITS.filter(unit => unit.movementDomain === 'naval');
  expect(ships.map(unit => unit.id)).toEqual(['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship']);
  const [transport, coastal, ocean] = ships;
  expect(transport!.naval).toEqual({ transportCapacity: 8, oceanCapable: true });
  expect(coastal!.naval).toEqual({ transportCapacity: 0, oceanCapable: false });
  expect(ocean!.naval).toEqual({ transportCapacity: 0, oceanCapable: true });
  expect(coastal!.movement).toBeGreaterThan(ocean!.movement);
  expect(ocean!.attack).toBeGreaterThan(coastal!.attack);
  expect(coastal!.attack).toBeGreaterThan(transport!.attack);
  expect(ocean!.upkeep).toBeGreaterThan(coastal!.upkeep);
  for (const unit of ships) {
    expect(unit.canFound).toBe(false);
    expect(unit.requiredBuildings).toEqual(['building.harbor']);
    expect(unit.requiredTechnologies).toContain('technology.coastal_navigation');
    expect(LOCALIZATION[unit.id + '.description']).toBe(unit.description);
  }
  expect(ocean!.requiredTechnologies).toContain('technology.ocean_navigation');
  expect(transport!.requiredTechnologies).not.toContain('technology.ocean_navigation');
});

test('coastal construction and deep access are practical research unlocks, not free passive income', () => {
  expect(BUILDINGS.find(item => item.id === 'building.harbor')).toMatchObject({ coastalOnly: true, requiredTechnologies: ['technology.coastal_navigation'] });
  const coastal = TECHNOLOGIES.find(item => item.id === 'technology.coastal_navigation')!;
  const ocean = TECHNOLOGIES.find(item => item.id === 'technology.ocean_navigation')!;
  expect(coastal.requires).toEqual([]);
  expect(ocean.requires).toEqual([coastal.id]);
  expect(coastal.knowledgeCost).toBe(30);
  expect(ocean.knowledgeCost).toBe(80);
  for (const tech of [coastal, ocean]) expect(Object.values(tech.effects).every(value => value === 0)).toBe(true);
  expect(() => validateProductionContent()).not.toThrow();
});

test('production rejects missing references, duplicate prerequisites and impossible naval declarations', () => {
  const transport = UNITS.find(item => item.id === 'unit.transport')!;
  const harbor = BUILDINGS.find(item => item.id === 'building.harbor')!;
  expect(() => validateProductionContent(BUILDINGS, [{ ...transport, requiredTechnologies: ['technology.missing'] }])).toThrow('Unknown production technology');
  expect(() => validateProductionContent([{ ...harbor, requiredTechnologies: ['technology.missing'] }], [])).toThrow('Unknown production technology');
  expect(() => validateProductionContent(BUILDINGS, [{ ...transport, requiredBuildings: ['building.missing'] }])).toThrow('Unknown recruitment building');
  expect(() => validateProductionContent(BUILDINGS, [{ ...transport, requiredBuildings: ['building.market'] }])).toThrow('coastal infrastructure');
  expect(() => validateProductionContent(BUILDINGS, [transport, transport])).toThrow('Duplicate production ID');
  expect(unitSchema.safeParse({ ...transport, requiredTechnologies: ['technology.coastal_navigation', 'technology.coastal_navigation'] }).success).toBe(false);
  expect(buildingSchema.safeParse({ ...harbor, requiredTechnologies: ['technology.coastal_navigation', 'technology.coastal_navigation'] }).success).toBe(false);
  expect(unitSchema.safeParse({ ...transport, movementDomain: 'land' }).success).toBe(false);
  expect(unitSchema.safeParse({ ...UNITS[0], movementDomain: 'naval' }).success).toBe(false);
  expect(unitSchema.safeParse({ ...transport, canFound: true }).success).toBe(false);
  for (const capacity of [-1, 0.5, 25, NaN]) expect(unitSchema.safeParse({ ...transport, naval: { ...transport.naval, transportCapacity: capacity } }).success).toBe(false);
});
