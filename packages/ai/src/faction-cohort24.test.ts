import { expect, test } from 'vitest';
import { FACTIONS, LAND_MILITARY_UNIT_IDS, UNITS } from '@theandril/content';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { prosperityCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { planTurn } from './index';

/** Authored equal infrastructure/forces isolate preferences, not earned development.
 * Every proposed order, payment and subsequent troop completion uses real rules. */
function equalForces(definitionId: string, coins = 1000): GameState {
  const game = prosperityCampaign(), owner = game.factions.find(faction => faction.id === game.turnOwnerId)!;
  const definition = FACTIONS.find(faction => faction.id === definitionId)!;
  game.rosterVersion = 4;
  owner.definitionId = definition.id; owner.name = definition.name; owner.color = definition.color; owner.knowledge = 0;
  for (const command of [
    { type: 'adoptInstitution' as const, factionId: owner.id, institutionId: 'institution.charter_compact' },
    { type: 'adoptDoctrine' as const, factionId: owner.id, doctrineId: 'doctrine.march_columns' },
  ]) expect(applyCommand(game, command).ok).toBe(true);
  const towns = Object.values(game.settlements).filter(town => town.factionId === owner.id).sort((a, b) => a.id < b.id ? -1 : 1);
  towns[2]!.buildings = towns[2]!.buildings.filter(id => id !== 'building.archive');
  const army = Object.values(game.armies).find(army => army.factionId === owner.id)!;
  for (const other of Object.values(game.armies)) if (other.id !== army.id) delete game.armies[other.id];
  army.cell = towns[0]!.cell; army.movement = 0;
  army.formations = [...LAND_MILITARY_UNIT_IDS, 'unit.colonist'].map(unitId => createArmyFormation(`army.${game.nextId++}`, unitId));
  owner.treasury = coins;
  refreshAuthoredSight(game);
  return deserializeGame(serializeGame(game));
}

const preferences = [
  ['faction.cistern_assembly', 'unit.spearman', 'unit.guard'], ['faction.unsealed_companies', 'unit.spearman', 'unit.cavalry'],
  ['faction.lantern_hospices', 'unit.guard', 'unit.guard'], ['faction.cairnwing_concord', 'unit.spearman', 'unit.scout'],
  ['faction.red_sluice', 'unit.spearman', 'unit.heavy_infantry'], ['faction.velvet_meridian', 'unit.scout', 'unit.guard'],
  ['faction.brine_choir', 'unit.guard', 'unit.spearman'], ['faction.emberwake_convocation', 'unit.guard', 'unit.heavy_infantry'],
  ['faction.underhush_exchange', 'unit.guard', 'unit.spearman'], ['faction.vesper_court', 'unit.heavy_infantry', 'unit.cavalry'],
  ['faction.manytrack_moot', 'unit.scout', 'unit.spearman'], ['faction.margin_observance', 'unit.scout', 'unit.guard'],
] as const;

test.each(preferences)('%s pays for %s then %s from equal legal forces, with real saved completion', (definitionId, expected, second) => {
  const game = equalForces(definitionId), saved = serializeGame(game), view = getObservation(game, game.turnOwnerId), viewBefore = JSON.stringify(view);
  const firstTown = view.settlements.find(town => town.factionId === view.factionId)!;
  for (const unitId of LAND_MILITARY_UNIT_IDS) {
    expect(view.armies.flatMap(army => army.formations).filter(formation => formation.unitId === unitId)).toHaveLength(1);
    expect(view.productionOptions.find(option => option.settlementId === firstTown.id && option.itemId === unitId)?.canQueue).toBe(true);
  }
  const plan = planTurn(view), mirror = deserializeGame(saved);
  expect(planTurn(getObservation(mirror, mirror.turnOwnerId))).toEqual(plan);
  expect(JSON.stringify(view)).toBe(viewBefore); expect(serializeGame(game)).toBe(saved);
  expect(plan.find(command => command.type === 'queue' && command.settlementId === firstTown.id)).toMatchObject({ itemId: expected });
  const militaryQueues = plan.filter((command): command is Extract<GameCommand, { type: 'queue' }> => command.type === 'queue' && LAND_MILITARY_UNIT_IDS.some(id => id === command.itemId));
  expect(militaryQueues.slice(0, 2).map(command => command.itemId)).toEqual([expected, second]);
  const originalFormationIds = new Set(Object.values(game.armies).flatMap(army => army.formations.map(formation => formation.id)));
  const issue = (command: GameCommand) => {
    const coin = game.factions.find(faction => faction.id === view.factionId)!.treasury;
    const result = applyCommand(game, command);
    expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true);
    expect(applyCommand(mirror, command)).toEqual(result);
    if (command.type === 'queue' && command.itemId.startsWith('unit.')) expect(game.factions.find(faction => faction.id === view.factionId)!.treasury).toBe(coin - UNITS.find(unit => unit.id === command.itemId)!.coinCost);
    expect(serializeGame(mirror)).toBe(serializeGame(game));
  };
  for (const command of plan) issue(command);
  for (let turn = 0; turn < 12 && militaryQueues.some(command => game.settlements[command.settlementId]!.queue.some(order => order.itemId === command.itemId)); turn++) issue({ type: 'endTurn', factionId: game.turnOwnerId });
  const added = Object.values(game.armies).flatMap(army => army.formations).filter(formation => !originalFormationIds.has(formation.id));
  expect(added.some(formation => formation.unitId === expected)).toBe(true);
  expect(added.some(formation => formation.unitId === second)).toBe(true);
  expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
});

test('Vesper’s expensive preferences do not override the real treasury gate', () => {
  const game = equalForces('faction.vesper_court', 12), view = getObservation(game, game.turnOwnerId), before = serializeGame(game);
  const firstTown = view.settlements.find(town => town.factionId === view.factionId)!;
  for (const itemId of ['unit.heavy_infantry', 'unit.cavalry']) expect(view.productionOptions.find(option => option.settlementId === firstTown.id && option.itemId === itemId)?.canQueue).toBe(false);
  const plan = planTurn(view);
  expect(plan.find(command => command.type === 'queue' && command.settlementId === firstTown.id)).toMatchObject({ itemId: 'unit.spearman' });
  expect(serializeGame(game)).toBe(before);
  for (const command of plan) expect(applyCommand(game, command).ok, JSON.stringify(command)).toBe(true);
  expect(game.factions.find(faction => faction.id === game.turnOwnerId)!.treasury).toBeGreaterThanOrEqual(0);
});
