import { expect, test } from 'vitest';
import { ATTUNEMENT_VICTORY, CITY_STATES, cityStatesForRules, cityStateTradeForRules, OFFICES, officesForRules, validateOfficeContent, NOTABLE_CHARACTERS, notableCharactersForRules, validateNotableCharacterContent, RELICS, validateRelicContent, CITY_STATE_TRADE, validateCityStateTradeContent, CRISES, crisesForRules, validateCrisisContent, EPOCHS, validateEpochContent, LANDMARK_KINDS, landmarkKindsForRules, validateLandmarkContent, HEARTH_EVENTS, hearthEventsForRules, validateHearthEventContent, SCHEMA43_ATTUNEMENT_VICTORY, SCHEMA43_CAMPAIGN_PACES, SCHEMA44_ATTUNEMENT_VICTORY, BUILDINGS, CAMPAIGN_PACES, CONTENT_HASH, SCHEMA17_CAMPAIGN_PACES, SCHEMA20_CAMPAIGN_PACES, SCHEMA20_UNIFICATION_VICTORY, SCHEMA21_CAMPAIGN_PACES, magicPackForRules, contentPackHash, DOCTRINES, INSTITUTIONS, LOCALIZATION, PROSPERITY_PROJECT, TECHNOLOGIES, UNITS, buildingSchema, campaignPaceProfileSchema, campaignPaceSchema, checksum, doctrineSchema, technologySchema, validateContent, validateProductionContent, validateProgressionContent, unitSchema } from './index';
test('the starter pack has unique valid IDs, localization and bounded numeric parameters', () => {
  expect(validateContent()).toMatchObject({ buildings: 5, units: 13, factions: 24, technologies: 10, institutions: 2, doctrines: 2, projects: 1, improvements: 18, resources: 8, developmentNodes: 25, naturalFeatures: 7 });
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

test('the rules 17, 18 and 19–20 packs keep their exact seals so older saves still load', () => {
  expect(contentPackHash(SCHEMA17_CAMPAIGN_PACES, null, false, magicPackForRules(17), false, undefined, false, false, false, false, false, false, false, false)).toBe('b79c78ed');
  expect(contentPackHash(SCHEMA20_CAMPAIGN_PACES, null, false, magicPackForRules(18), false, undefined, false, false, false, false, false, false, false, false)).toBe('98b97bba');
  expect(contentPackHash(SCHEMA20_CAMPAIGN_PACES, SCHEMA20_UNIFICATION_VICTORY, false, magicPackForRules(20), false, undefined, false, false, false, false, false, false, false, false)).toBe('3127e431');
  expect(contentPackHash(SCHEMA21_CAMPAIGN_PACES, undefined, cityStatesForRules(21), magicPackForRules(21), false, undefined, false, false, false, false, false, false, false, false)).toBe('f70d99d5');
  expect(contentPackHash(SCHEMA43_CAMPAIGN_PACES, undefined, cityStatesForRules(23), magicPackForRules(23), false, undefined, false, false, false, false, false, false, false, false)).toBe('f4076f55');
  // Rules 24–37 content, before rules 38 added Attunement and path deepening.
  expect(contentPackHash(SCHEMA43_CAMPAIGN_PACES, undefined, cityStatesForRules(37), magicPackForRules(37), false, undefined, false, false, false, false, false, false, false, false)).toBe('015468d1');
  // Rules 38–39 content, before rules 40 added strategic rites.
  expect(contentPackHash(SCHEMA43_CAMPAIGN_PACES, undefined, cityStatesForRules(39), magicPackForRules(39), true, SCHEMA43_ATTUNEMENT_VICTORY, false, false, false, false, false, false, false, false)).toBe('03ac0328');
  // Rules 40 content, before rules 41 added the ward-breaking counter-rite.
  expect(contentPackHash(SCHEMA43_CAMPAIGN_PACES, undefined, cityStatesForRules(40), magicPackForRules(40), true, SCHEMA43_ATTUNEMENT_VICTORY, false, false, false, false, false, false, false, false)).toBe('ac80514d');
  // Rules 41 content, before rules 42 added the Flame kindling rite.
  expect(contentPackHash(SCHEMA43_CAMPAIGN_PACES, undefined, cityStatesForRules(41), magicPackForRules(41), true, SCHEMA43_ATTUNEMENT_VICTORY, false, false, false, false, false, false, false, false)).toBe('78df970c');
  // Rules 42–43 content, before rules 44 re-priced Attunement and the Epic Hearth Exchange.
  expect(contentPackHash(SCHEMA43_CAMPAIGN_PACES, undefined, cityStatesForRules(43), magicPackForRules(43), true, SCHEMA43_ATTUNEMENT_VICTORY, false, false, false, false, false, false, false, false)).toBe('f738e917');
  // Rules 44 content, before rules 45 re-priced Attunement once AI realms guarded their seam hearths.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(44), magicPackForRules(44), true, SCHEMA44_ATTUNEMENT_VICTORY, false, false, false, false, false, false, false, false)).toBe('88b0823d');
  expect(SCHEMA44_ATTUNEMENT_VICTORY.knowledgeCost).toEqual({ short: 60, standard: 3600, long: 6000, epic: 9600 });
  expect(ATTUNEMENT_VICTORY.knowledgeCost).toEqual({ short: 60, standard: 7200, long: 12_000, epic: 18_000 });
  // Rules 45 content, before rules 46 added hearth events; the current pack seals them.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(45), magicPackForRules(45), true, ATTUNEMENT_VICTORY, false, false, false, false, false, false, false, false)).toBe('1f0c41ca');
  // Rules 46 content, the first eight hearth events, before rules 47 added sixteen more; the current pack seals all twenty-four.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(46), magicPackForRules(46), true, ATTUNEMENT_VICTORY, hearthEventsForRules(46), false, false, false, false, false, false, false)).toBe('8a737501');
  expect(CONTENT_HASH).not.toBe('1f0c41ca');
  expect(CONTENT_HASH).not.toBe('8a737501');
  // Rules 47 content, twenty-four events, before rules 48 added the chains; the current pack seals all thirty-three.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(47), magicPackForRules(47), true, ATTUNEMENT_VICTORY, hearthEventsForRules(47), false, false, false, false, false, false, false)).toBe('c1e05b8e');
  expect(CONTENT_HASH).not.toBe('c1e05b8e');
  // Rules 48 content, thirty-three events and no ages, before rules 49 added the ages; the current pack seals the ages and thirty-nine events.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(48), magicPackForRules(48), true, ATTUNEMENT_VICTORY, hearthEventsForRules(48), false, false, false, false, false, false, false)).toBe('4847de40');
  expect(CONTENT_HASH).not.toBe('4847de40');
  expect(EPOCHS.map(epoch => epoch.id)).toEqual(['epoch.fracture', 'epoch.roads', 'epoch.seams', 'epoch.bids']);
  expect(() => validateEpochContent()).not.toThrow();
  expect(() => validateEpochContent([EPOCHS[1]!, EPOCHS[0]!])).toThrow('first epoch is the start');
  expect(() => validateEpochContent([EPOCHS[0]!, EPOCHS[0]!])).toThrow('Duplicate epoch ID');
  expect(hearthEventsForRules(49)).toHaveLength(39);
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, epoch: 'epoch.roads' }])).toThrow('names no age');
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, sinceRules: 49, epoch: 'epoch.nowhere' }])).toThrow('names an age of the catalogue');
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, sinceRules: 49, epoch: 'epoch.fracture' }])).toThrow('first age gates nothing');
  // Rules 49 and 50 content, before rules 51 added the landmarks; the current pack seals twelve kinds.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(50), magicPackForRules(50), true, ATTUNEMENT_VICTORY, hearthEventsForRules(50), EPOCHS, false, false, false, false, false, false)).toBe('5b9864d4');
  expect(CONTENT_HASH).not.toBe('5b9864d4');
  expect(() => validateLandmarkContent()).not.toThrow();
  expect(() => validateLandmarkContent([LANDMARK_KINDS[0]!, LANDMARK_KINDS[0]!])).toThrow('Duplicate landmark ID');
  expect(() => validateLandmarkContent([{ ...LANDMARK_KINDS[0]!, yields: { food: 0, industry: 0, coin: 0, knowledge: 0 } }])).toThrow('yields something');
  expect(() => validateLandmarkContent(LANDMARK_KINDS.filter(kind => !kind.terrains.includes(2)))).toThrow('No landmark fits');
  // Rules 51 content, thirty-nine events and the landmarks, before rules 52 added the landmark events; the current pack seals forty-five.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(51), magicPackForRules(51), true, ATTUNEMENT_VICTORY, hearthEventsForRules(51), EPOCHS, landmarkKindsForRules(51), false, false, false, false, false)).toBe('33f583e9');
  expect(CONTENT_HASH).not.toBe('33f583e9');
  expect(hearthEventsForRules(51)).toHaveLength(39);
  expect(hearthEventsForRules(52)).toHaveLength(45);
  expect(hearthEventsForRules(52).filter(event => event.condition === 'landmark')).toHaveLength(5);
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, condition: 'landmark' }])).toThrow('rules 52 or later');
  // Rules 52 content, forty-five events and the landmarks, before rules 53 added the crises; the current pack seals six crises.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(52), magicPackForRules(52), true, ATTUNEMENT_VICTORY, hearthEventsForRules(52), EPOCHS, landmarkKindsForRules(52), false, false, false, false, false)).toBe('d76aa9bb');
  expect(CONTENT_HASH).not.toBe('d76aa9bb');
  // Rules 57 and 58 content, before rules 59 added the regional crises and their events.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(58), magicPackForRules(58), true, ATTUNEMENT_VICTORY, hearthEventsForRules(58), EPOCHS, landmarkKindsForRules(58), crisesForRules(58), false, false, false, false)).toBe('0eed2d1a');
  expect(CONTENT_HASH).not.toBe('0eed2d1a');
  expect(crisesForRules(58)).toHaveLength(6);
  expect(CRISES).toHaveLength(9);
  expect(CRISES.filter(crisis => crisis.scope === 'region').map(crisis => crisis.epoch)).toEqual(['epoch.roads', 'epoch.seams', 'epoch.bids']);
  expect(() => validateCrisisContent([{ ...CRISES[0]!, radius: 10 }])).toThrow('names its radius');
  expect(() => validateCrisisContent([{ ...CRISES[0]!, scope: 'region' }])).toThrow('names its radius');
  expect(() => validateCrisisContent([{ ...CRISES[0]!, scope: 'region', radius: 10 }])).toThrow('rules 59 or later');
  expect(hearthEventsForRules(58)).toHaveLength(57);
  // Rules 59 content, before rules 60 added the city-states' trade goods.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(59), magicPackForRules(59), true, ATTUNEMENT_VICTORY, hearthEventsForRules(59), EPOCHS, landmarkKindsForRules(59), crisesForRules(59), false, false, false, false)).toBe('b48e6615');
  expect(CONTENT_HASH).not.toBe('b48e6615');
  expect(CITY_STATE_TRADE).toHaveLength(48);
  expect(cityStateTradeForRules(68)).toHaveLength(24);
  expect(CITY_STATES).toHaveLength(48);
  expect(cityStatesForRules(68)).toHaveLength(24);
  expect(cityStatesForRules(68).every(item => !item.sinceRules)).toBe(true);
  expect(cityStatesForRules(69).filter(item => item.sinceRules === 69)).toHaveLength(24);
  expect(new Set(cityStatesForRules(69).filter(item => item.sinceRules === 69).map(item => item.cultureId)).size).toBe(24);
  expect(() => validateCityStateTradeContent([{ ...CITY_STATE_TRADE[47]!, sinceRules: 60 }])).toThrow('no earlier than its city-state');
  expect(() => validateCityStateTradeContent()).not.toThrow();
  expect(() => validateCityStateTradeContent([CITY_STATE_TRADE[0]!, CITY_STATE_TRADE[0]!])).toThrow('Duplicate city-state trade');
  expect(() => validateCityStateTradeContent([{ ...CITY_STATE_TRADE[0]!, resourceId: 'resource.nowhere' }])).toThrow('names a resource of the catalogue');
  expect(() => validateCityStateTradeContent(CITY_STATE_TRADE.slice(1))).toThrow('Every city-state trades in a good');
  // Rules 60 and 61 content, sixty events, before rules 62 added fifteen more.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(61), magicPackForRules(61), true, ATTUNEMENT_VICTORY, hearthEventsForRules(61), EPOCHS, landmarkKindsForRules(61), crisesForRules(61), cityStateTradeForRules(61), false, false, false)).toBe('acd39799');
  expect(CONTENT_HASH).not.toBe('acd39799');
  expect(hearthEventsForRules(61)).toHaveLength(60);
  expect(hearthEventsForRules(62)).toHaveLength(75);
  expect(hearthEventsForRules(62).filter(event => event.sinceRules === 62 && event.condition === 'chained')).toHaveLength(1);
  expect(hearthEventsForRules(65)).toHaveLength(75);
  expect(hearthEventsForRules(66)).toHaveLength(90);
  expect(hearthEventsForRules(66).filter(event => event.sinceRules === 66 && event.condition === 'chained')).toHaveLength(1);
  expect(hearthEventsForRules(66).filter(event => event.sinceRules === 66).every(event => !event.choices[0]!.followUp)).toBe(true);
  expect(hearthEventsForRules(72)).toHaveLength(90);
  expect(hearthEventsForRules(73)).toHaveLength(105);
  expect(hearthEventsForRules(73).filter(event => event.sinceRules === 73 && event.condition === 'chained')).toHaveLength(1);
  expect(hearthEventsForRules(73).filter(event => event.sinceRules === 73).every(event => !event.choices[0]!.followUp)).toBe(true);
  expect(hearthEventsForRules(74)).toHaveLength(120);
  expect(hearthEventsForRules(74).filter(event => event.sinceRules === 74 && event.condition === 'chained')).toHaveLength(1);
  expect(hearthEventsForRules(74).filter(event => event.sinceRules === 74).every(event => !event.choices[0]!.followUp)).toBe(true);
  expect(HEARTH_EVENTS).toHaveLength(120);
  // Rules 62 content, before rules 63 added the relics.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(62), magicPackForRules(62), true, ATTUNEMENT_VICTORY, hearthEventsForRules(62), EPOCHS, landmarkKindsForRules(62), crisesForRules(62), cityStateTradeForRules(62), false, false, false)).toBe('85443208');
  expect(CONTENT_HASH).not.toBe('85443208');
  expect(RELICS).toHaveLength(24);
  expect(() => validateRelicContent()).not.toThrow();
  expect(() => validateRelicContent([RELICS[0]!, RELICS[0]!])).toThrow('Duplicate relic ID');
  expect(() => validateRelicContent([{ ...RELICS[0]!, leadership: { attack: 0, armor: 0 } }])).toThrow('leads somewhere');
  expect(() => validateRelicContent(RELICS.slice(1))).toThrow('Every landmark kind keeps a relic');
  // Rules 63 content, before rules 64 added the notable characters.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(63), magicPackForRules(63), true, ATTUNEMENT_VICTORY, hearthEventsForRules(63), EPOCHS, landmarkKindsForRules(63), crisesForRules(63), cityStateTradeForRules(63), RELICS, false, false)).toBe('513decf2');
  expect(CONTENT_HASH).not.toBe('513decf2');
  expect(NOTABLE_CHARACTERS).toHaveLength(24);
  expect(notableCharactersForRules(63)).toEqual([]);
  expect(notableCharactersForRules(64)).toHaveLength(24);
  expect(new Set(NOTABLE_CHARACTERS.map(item => item.factionId)).size).toBe(24);
  expect(() => validateNotableCharacterContent()).not.toThrow();
  expect(() => validateNotableCharacterContent([NOTABLE_CHARACTERS[0]!, NOTABLE_CHARACTERS[0]!])).toThrow('Duplicate notable character ID');
  expect(() => validateNotableCharacterContent([{ ...NOTABLE_CHARACTERS[0]!, skillId: 'skill.fieldcraft' }])).toThrow('specialization of its role');
  expect(() => validateNotableCharacterContent([{ ...NOTABLE_CHARACTERS[0]!, factionId: 'faction.nowhere' }])).toThrow('culture of the roster');
  expect(() => validateNotableCharacterContent(NOTABLE_CHARACTERS.slice(1))).toThrow('Every culture has a notable character');
  // Rules 64 content, before rules 65 added the offices.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(64), magicPackForRules(64), true, ATTUNEMENT_VICTORY, hearthEventsForRules(64), EPOCHS, landmarkKindsForRules(64), crisesForRules(64), cityStateTradeForRules(64), RELICS, NOTABLE_CHARACTERS, false)).toBe('7bcec806');
  expect(CONTENT_HASH).not.toBe('7bcec806');
  expect(OFFICES).toHaveLength(4);
  expect(officesForRules(64)).toEqual([]);
  expect(new Set(OFFICES.map(item => item.role)).size).toBe(4);
  expect(() => validateOfficeContent()).not.toThrow();
  expect(() => validateOfficeContent([OFFICES[0]!, OFFICES[0]!])).toThrow('Duplicate office ID');
  expect(() => validateOfficeContent([{ ...OFFICES[0]!, yields: { food: 0, industry: 0, coin: 0, knowledge: 0 } }])).toThrow('yields something');
  expect(() => validateOfficeContent(OFFICES.slice(1))).toThrow('Every role keeps one office');
  // Rules 67 and 68 content, twenty-four city-states, before rules 69 added the second roster.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(68), magicPackForRules(68), true, ATTUNEMENT_VICTORY, hearthEventsForRules(68), EPOCHS, landmarkKindsForRules(68), crisesForRules(68), cityStateTradeForRules(68), RELICS, NOTABLE_CHARACTERS, OFFICES)).toBe('1bd6624e');
  expect(CONTENT_HASH).not.toBe('1bd6624e');
  // Rules 69 through 72 content, ninety events and forty-eight city-states, before rules 73 added fifteen more events.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(72), magicPackForRules(72), true, ATTUNEMENT_VICTORY, hearthEventsForRules(72), EPOCHS, landmarkKindsForRules(72), crisesForRules(72), cityStateTradeForRules(72), RELICS, NOTABLE_CHARACTERS, OFFICES)).toBe('d1205eae');
  expect(CONTENT_HASH).not.toBe('d1205eae');
  // Rules 73 content, one hundred and five events, before rules 74 added fifteen more.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(73), magicPackForRules(73), true, ATTUNEMENT_VICTORY, hearthEventsForRules(73), EPOCHS, landmarkKindsForRules(73), crisesForRules(73), cityStateTradeForRules(73), RELICS, NOTABLE_CHARACTERS, OFFICES)).toBe('4c666e0d');
  expect(CONTENT_HASH).not.toBe('4c666e0d');
  // Rules 65 content, seventy-five events, before rules 66 added fifteen more.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(65), magicPackForRules(65), true, ATTUNEMENT_VICTORY, hearthEventsForRules(65), EPOCHS, landmarkKindsForRules(65), crisesForRules(65), cityStateTradeForRules(65), RELICS, NOTABLE_CHARACTERS, OFFICES)).toBe('cf5b6321');
  expect(CONTENT_HASH).not.toBe('cf5b6321');
  expect(() => validateCrisisContent()).not.toThrow();
  expect(() => validateCrisisContent([CRISES[0]!, CRISES[0]!])).toThrow('Duplicate crisis ID');
  expect(() => validateCrisisContent([{ ...CRISES[0]!, epoch: 'epoch.fracture' }])).toThrow('first age brings no crisis');
  expect(() => validateCrisisContent([{ ...CRISES[0]!, blight: { food: 0, coin: 0, knowledge: 0, devastation: 0 } }])).toThrow('takes something');
  expect(() => validateCrisisContent(CRISES.filter(crisis => crisis.epoch !== 'epoch.bids'))).toThrow('Every age after the first has a crisis');
  // Rules 53 content, forty-five events and the crises, before rules 54 added the crisis events; the current pack seals fifty-one.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(53), magicPackForRules(53), true, ATTUNEMENT_VICTORY, hearthEventsForRules(53), EPOCHS, landmarkKindsForRules(53), crisesForRules(53), false, false, false, false)).toBe('d50775cf');
  expect(CONTENT_HASH).not.toBe('d50775cf');
  expect(hearthEventsForRules(53)).toHaveLength(45);
  expect(hearthEventsForRules(54)).toHaveLength(51);
  expect(hearthEventsForRules(54).filter(event => event.crisis)).toHaveLength(6);
  expect(crisesForRules(54).every(crisis => hearthEventsForRules(54).some(event => event.crisis === crisis.id && event.condition === 'crisis'))).toBe(true);
  expect(CRISES.every(crisis => HEARTH_EVENTS.some(event => event.crisis === crisis.id && event.condition === 'crisis'))).toBe(true);
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, sinceRules: 54, condition: 'crisis' }])).toThrow('names its crisis');
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, crisis: 'crisis.grey_winter' }])).toThrow('names no crisis');
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, sinceRules: 54, condition: 'crisis', crisis: 'crisis.nowhere' }])).toThrow('names a crisis of the catalogue');
  // Rules 54 through 56 content, fifty-one events and twelve landmarks, before rules 57 added twelve more landmarks and six more events.
  expect(contentPackHash(CAMPAIGN_PACES, undefined, cityStatesForRules(56), magicPackForRules(56), true, ATTUNEMENT_VICTORY, hearthEventsForRules(56), EPOCHS, landmarkKindsForRules(56), crisesForRules(56), false, false, false, false)).toBe('7cad9f6e');
  expect(CONTENT_HASH).not.toBe('7cad9f6e');
  expect(landmarkKindsForRules(56)).toHaveLength(12);
  expect(LANDMARK_KINDS).toHaveLength(24);
  expect(hearthEventsForRules(56)).toHaveLength(51);
  expect(hearthEventsForRules(57).filter(event => event.condition === 'landmark')).toHaveLength(10);
  expect(hearthEventsForRules(45)).toEqual([]);
  expect(hearthEventsForRules(46)).toHaveLength(8);
  expect(hearthEventsForRules(47)).toHaveLength(24);
  expect(hearthEventsForRules(48)).toHaveLength(33);
  expect(hearthEventsForRules(48).every(event => !event.epoch)).toBe(true);
  expect(hearthEventsForRules(47).every(event => event.condition !== 'chained' && event.choices.every(choice => !choice.followUp))).toBe(true);
  const rising = HEARTH_EVENTS.find(event => event.id === 'event.river_rising')!;
  expect(() => validateHearthEventContent([{ ...rising, sinceRules: 47 }, ...HEARTH_EVENTS.filter(event => event.condition === 'chained')])).toThrow('schedules no follow-up');
  expect(() => validateHearthEventContent([{ ...rising, choices: rising.choices.map(choice => ({ ...choice, followUp: { templateId: 'event.kiln_fire', afterTurns: 2 } })) }, HEARTH_EVENTS[1]!])).toThrow('is a chained event');
  expect(() => validateHearthEventContent([HEARTH_EVENTS.find(event => event.id === 'event.levees_hold')!])).toThrow('reached by some follow-up');
  expect(hearthEventsForRules(46).every(event => event.choices.every(choice => !('ashglass' in choice.effects) && !('garrison' in choice.effects)))).toBe(true);
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, choices: HEARTH_EVENTS[0]!.choices.map(choice => ({ ...choice, effects: { ...choice.effects, ashglass: 2 } })) }])).toThrow('no rules 47 effect');
  expect(() => validateHearthEventContent()).not.toThrow();
  expect(() => validateHearthEventContent([HEARTH_EVENTS[0]!, HEARTH_EVENTS[0]!])).toThrow('Duplicate hearth event ID');
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, text: 'No hearth named.' }])).toThrow('names its hearth');
  expect(() => validateHearthEventContent([{ ...HEARTH_EVENTS[0]!, choices: HEARTH_EVENTS[0]!.choices.map(choice => ({ ...choice, effects: { food: 0, coin: 0, knowledge: 0, population: 0, devastation: 0 } })) }])).toThrow('changes something');
  expect(CAMPAIGN_PACES.epic.projectCoinCost).toBe(44_000);
  expect(CONTENT_HASH).toBe(contentPackHash());
  expect(new Set([CONTENT_HASH, 'b79c78ed', '98b97bba', '3127e431', 'f70d99d5', 'f4076f55', '015468d1', '03ac0328', 'ac80514d', '78df970c']).size).toBe(10);
});
