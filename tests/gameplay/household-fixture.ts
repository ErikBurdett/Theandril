import { applyCommand, createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, type GameCommand, type GameState } from '../../packages/sim/src/index';
import { rebaseAuthoredLand } from '../../packages/test-fixtures/src/authored-land';

function issue(game: GameState, command: GameCommand) {
  const result = applyCommand(game, command);
  if (!result.ok) throw new Error(`Household fixture ${command.type}: ${result.error}`);
}

/** Authored food reserve, not naturally earned growth. Founding, queueing,
 * assignment and the later test's growth turn are normal simulation commands. */
export function growingHouseholdCampaign(): GameState {
  const game = createGame({ seed: 17, size: 'tiny', factionCount: 2 });
  const factionId = game.turnOwnerId;
  issue(game, { type: 'found', factionId, armyId: 'army.1', name: 'Growing hearth' });
  const home = Object.values(game.settlements).find(town => town.factionId === factionId)!;
  const land = getSettlementLandObservation(game, factionId, home.id)!;
  const cell = land.cells.find(cell => cell.canWork)!;
  issue(game, { type: 'setWorkedTiles', factionId, settlementId: home.id, cells: [cell.cell] });
  for (let index = 0; index < 3; index++) issue(game, { type: 'queue', factionId, settlementId: home.id, itemId: 'unit.guard' });
  home.food = getObservation(game, factionId).growth!.settlements[0]!.foodRequired;
  return deserializeGame(serializeGame(game));
}

/** Synthetic 2/10/40-town ownership and population. Only the last stable ID
 * has spare labor; all queues and manual assignments use real paid commands. */
export function householdScaleCampaign(count: 2 | 10 | 40): GameState {
  const game = createGame({ seed: 20260905, size: 'small', factionCount: count });
  for (const faction of game.factions) {
    const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'))!;
    issue(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: `Hearth ${faction.id}` });
  }
  const towns = Object.values(game.settlements).sort((a, b) => a.id < b.id ? -1 : 1);
  for (const town of towns) town.factionId = game.turnOwnerId;
  for (const army of Object.values(game.armies)) if (army.factionId !== game.turnOwnerId) delete game.armies[army.id];
  game.factions[0]!.treasury = 10_000;
  rebaseAuthoredLand(game);
  for (const town of towns) {
    const land = getSettlementLandObservation(game, game.turnOwnerId, town.id)!;
    const cell = land.cells.find(cell => cell.canWork);
    if (!cell) throw new Error(`Household fixture has no assignable tile for ${town.id}`);
    issue(game, { type: 'setWorkedTiles', factionId: game.turnOwnerId, settlementId: town.id, cells: [cell.cell] });
    issue(game, { type: 'queue', factionId: game.turnOwnerId, settlementId: town.id, itemId: 'unit.guard' });
  }
  towns.at(-1)!.population = 2;
  return deserializeGame(serializeGame(game));
}
