import { expect, test } from 'vitest';
import { BASE_LAND_MILITARY_UNIT_IDS, FACTIONS, FACTION_RECRUITMENT_WEIGHTS, LAND_MILITARY_UNIT_IDS } from '@theandril/content';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { planTurn } from './index';
import { recruitmentRoster } from './recruitment';
import { prosperityCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';

/** Authored equal forces/economy isolate choice, not an earned campaign or mocked read model. */
function equalRecruitmentCampaign(definitionId: string, coin = 1000): GameState {
  const game = prosperityCampaign(), owner = game.factions.find(faction => faction.id === game.turnOwnerId)!;
  const definition = FACTIONS.find(faction => faction.id === definitionId)!;
  owner.definitionId = definition.id; owner.name = definition.name; owner.color = definition.color; owner.knowledge = 0;
  for (const command of [
    { type: 'adoptInstitution' as const, factionId: owner.id, institutionId: 'institution.charter_compact' },
    { type: 'adoptDoctrine' as const, factionId: owner.id, doctrineId: 'doctrine.march_columns' },
  ]) expect(applyCommand(game, command).ok).toBe(true);
  const towns = Object.values(game.settlements).filter(town => town.factionId === owner.id).sort((a, b) => a.id < b.id ? -1 : 1);
  // One unfinished archive keeps Prosperity's savings reserve from confounding
  // the first two fully built towns' recruitment choices.
  towns[2]!.buildings = towns[2]!.buildings.filter(id => id !== 'building.archive');
  const army = Object.values(game.armies).find(army => army.factionId === owner.id)!;
  for (const other of Object.values(game.armies)) if (other.id !== army.id) delete game.armies[other.id];
  army.cell = towns[0]!.cell; army.movement = 0;
  army.formations = [...BASE_LAND_MILITARY_UNIT_IDS, 'unit.colonist'].map(unitId => createArmyFormation(`army.${game.nextId++}`, unitId));
  const specialistId = `army.${game.nextId++}`;
  game.armies[specialistId] = { ...army, id: specialistId, name: 'Specialist reserve', formations: LAND_MILITARY_UNIT_IDS.filter(id => !(BASE_LAND_MILITARY_UNIT_IDS as readonly string[]).includes(id)).map(unitId => createArmyFormation(`army.${game.nextId++}`, unitId)) };
  game.progression[owner.id]!.technologies = ['technology.cinder_masonry', 'technology.stewardship', 'technology.quarry_cranes', 'technology.surveyed_estates'].sort();
  owner.treasury = coin;
  refreshAuthoredSight(game);
  return deserializeGame(serializeGame(game));
}

test('original recruitment ordering stays exact, including unknown metadata fallback', () => {
  const original = ['unit.guard', 'unit.spearman', 'unit.scout', 'unit.heavy_infantry', 'unit.cavalry', 'unit.guard'];
  for (const id of [...FACTIONS.slice(0, 6).map(faction => faction.id), undefined, 'faction.unknown']) expect(recruitmentRoster(id).filter(unitId => (BASE_LAND_MILITARY_UNIT_IDS as readonly string[]).includes(unitId))).toEqual(original);
});

test('every culture retains every common military role with its declared preference weights', () => {
  for (const faction of FACTIONS) {
    const roster = recruitmentRoster(faction.id);
    expect(roster.slice(0, LAND_MILITARY_UNIT_IDS.length)).toEqual(LAND_MILITARY_UNIT_IDS);
    for (const id of LAND_MILITARY_UNIT_IDS) expect(roster.filter(value => value === id)).toHaveLength(FACTION_RECRUITMENT_WEIGHTS[faction.id]![id]);
  }
});

test.each([
  ['faction.ashen_compact', 'unit.guard'], ['faction.reedbound_council', 'unit.guard'],
  ['faction.cinder_march', 'unit.guard'], ['faction.glass_tide', 'unit.guard'],
  ['faction.iron_covenant', 'unit.guard'], ['faction.sepulchral_synod', 'unit.guard'],
  ['faction.mire_courts', 'unit.spearman'], ['faction.saltwind_remnant', 'unit.guard'],
  ['faction.wardhall_remnant', 'unit.spearman'], ['faction.rimehorn_clans', 'unit.guard'],
  ['faction.sable_steppe', 'unit.cavalry'], ['faction.morrow_spore', 'unit.scout'],
])('%s prefers %s from equally represented, equally legal common military roles', (definitionId, expected) => {
  const game = equalRecruitmentCampaign(definitionId), saved = serializeGame(game), view = getObservation(game, game.turnOwnerId);
  const beforeView = JSON.stringify(view), town = view.settlements.find(town => town.factionId === view.factionId)!;
  for (const unitId of LAND_MILITARY_UNIT_IDS) {
    expect(view.armies.flatMap(army => army.formations).filter(formation => formation.unitId === unitId)).toHaveLength(1);
    expect(view.productionOptions.find(option => option.settlementId === town.id && option.itemId === unitId)?.canQueue).toBe(true);
  }
  const plan = planTurn(view), mirror = deserializeGame(saved);
  expect(planTurn(getObservation(mirror, mirror.turnOwnerId))).toEqual(plan);
  expect(plan.find(command => command.type === 'queue' && command.settlementId === town.id)).toEqual({ type: 'queue', factionId: view.factionId, settlementId: town.id, itemId: expected });
  expect(JSON.stringify(view)).toBe(beforeView); expect(serializeGame(game)).toBe(saved);
  for (const command of plan) {
    const result = applyCommand(game, command);
    expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true);
    expect(applyCommand(mirror, command)).toEqual(result);
  }
  expect(stateHash(mirror)).toBe(stateHash(game));
});

test('a preferred cavalry recruit cannot bypass real treasury and town-production gates', () => {
  const poor = equalRecruitmentCampaign('faction.sable_steppe', 12), view = getObservation(poor, poor.turnOwnerId);
  const town = view.settlements.find(town => town.factionId === view.factionId)!;
  const cavalry = view.productionOptions.find(option => option.settlementId === town.id && option.itemId === 'unit.cavalry')!;
  expect(cavalry.canQueue).toBe(false); expect(cavalry.blocker).toBeTruthy();
  expect(view.productionOptions.find(option => option.settlementId === town.id && option.itemId === 'unit.spearman')!.canQueue).toBe(true);
  const plan = planTurn(view);
  expect(view.growth!.founding.coinCost).toBeGreaterThan(view.treasury);
  expect(plan.find(command => command.type === 'queue' && command.settlementId === town.id)).toBeUndefined(); // Save the existing caravan's actual founding fee before optional recruitment.
  for (const command of plan) expect(applyCommand(poor, command).ok, JSON.stringify(command)).toBe(true);

  const full = equalRecruitmentCampaign('faction.sable_steppe');
  for (let item = 0; item < 5; item++) expect(applyCommand(full, { type: 'queue', factionId: full.turnOwnerId, settlementId: town.id, itemId: 'unit.guard' }).ok).toBe(true);
  const checked = deserializeGame(serializeGame(full)), blocked = getObservation(checked, checked.turnOwnerId);
  expect(blocked.settlements.find(item => item.id === town.id)!.queue).toHaveLength(5);
  expect(blocked.productionOptions.filter(option => option.settlementId === town.id).every(option => !option.canQueue)).toBe(true);
  expect(planTurn(blocked).some(command => command.type === 'queue' && command.settlementId === town.id)).toBe(false);

  const empty = equalRecruitmentCampaign('faction.sable_steppe', 0), emptyView = getObservation(empty, empty.turnOwnerId), emptyHash = stateHash(empty);
  expect(planTurn(emptyView).some(command => command.type === 'queue')).toBe(false);
  expect(stateHash(empty)).toBe(emptyHash);
});

test.each(['unit.skirmisher', 'unit.arbalester', 'unit.halberdier', 'unit.lancer'])('AI recruits a missing %s through observed unlocks and the paid queue', unitId => {
  const game = equalRecruitmentCampaign('faction.ashen_compact');
  const specialistArmy = Object.values(game.armies).find(army => army.formations.some(item => item.unitId === unitId))!;
  specialistArmy.formations = specialistArmy.formations.filter(item => item.unitId !== unitId);
  const mirror = deserializeGame(serializeGame(game));
  const view = getObservation(game, game.turnOwnerId), plan = planTurn(view);
  const recruitment = plan.find(command => command.type === 'queue' && command.itemId === unitId);
  expect(recruitment).toBeDefined();
  expect(planTurn(getObservation(mirror, mirror.turnOwnerId))).toEqual(plan);
  for (const command of plan) {
    const result = applyCommand(game, command);
    expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true);
    expect(applyCommand(mirror, command)).toEqual(result);
  }
  for (let turn = 0; !Object.values(game.armies).some(army => army.factionId === game.turnOwnerId && army.formations.some(item => item.unitId === unitId)) && turn < 20; turn++) {
    const command = { type: 'endTurn' as const, factionId: game.turnOwnerId };
    const result = applyCommand(game, command); expect(result.ok).toBe(true);
    expect(applyCommand(mirror, command)).toEqual(result);
  }
  expect(Object.values(game.armies).filter(army => army.factionId === game.turnOwnerId).flatMap(army => army.formations).filter(item => item.unitId === unitId)).toHaveLength(1);
  expect(stateHash(mirror)).toBe(stateHash(game));
});

test.each(FACTIONS.slice(6))('$name recruits and combines legal armies with exact saved continuation', faction => {
  const game = createGame({ seed: 748291, size: 'tiny', factionCount: 1, factionDefinitionId: faction.id, pace: 'epic' });
  const recruited = new Set<string>(); let merges = 0;
  let mirror = deserializeGame(serializeGame(game));
  for (let round = 0; round < 100; round++) {
    const view = getObservation(game, game.turnOwnerId), before = serializeGame(game);
    const plan = planTurn(view);
    expect(planTurn(getObservation(mirror, mirror.turnOwnerId))).toEqual(plan);
    expect(serializeGame(game)).toBe(before);
    for (const command of [...plan, { type: 'endTurn' as const, factionId: game.turnOwnerId }]) {
      const result = applyCommand(game, command);
      expect(result.ok, `${round}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
      expect(applyCommand(mirror, command)).toEqual(result);
      if (command.type === 'queue' && command.itemId.startsWith('unit.')) recruited.add(command.itemId);
      if (command.type === 'mergeArmies') merges++;
    }
    if (round === 49) mirror = deserializeGame(serializeGame(game));
  }
  expect(recruited.size).toBeGreaterThanOrEqual(4);
  expect(merges).toBeGreaterThan(0);
  expect(stateHash(mirror)).toBe(stateHash(game));
  expect(game.factions[0]!.definitionId).toBe(faction.id);
});
