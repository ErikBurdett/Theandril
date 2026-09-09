import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getSettlementLandObservation, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { refreshAuthoredSight } from './authored-land';

const issue = (state: GameState, command: GameCommand) => {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Resource fixture rejected ${command.type}: ${result.error}`);
};

/** Generated ecology, deposits, population and funds. Only the starting forces
 * are relocated; founding, market construction and all later orders are paid. */
export function grainResourceCampaign() {
  const state = createGame({ seed: 17, size: 'tiny', factionCount: 1, pace: 'epic' });
  const entry = Object.entries(state.resources.deposits).find(([cell, id]) => id === 'resource.grain' && neighbors(Number(cell), state.world.width, state.world.height).some(next => isPassable(state.world.terrain[next]!)));
  if (!entry) throw new Error('Generated seed17 has no accessible grain deposit.');
  const deposit = Number(entry[0]);
  const center = neighbors(deposit, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
  for (const army of Object.values(state.armies)) army.cell = center;
  refreshAuthoredSight(state);
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Grain witness' });
  const town = Object.values(state.settlements)[0]!;
  const beforeMarket = state.factions[0]!.treasury;
  issue(state, { type: 'queue', factionId: state.turnOwnerId, settlementId: town.id, itemId: 'building.market' });
  const marketCost = beforeMarket - state.factions[0]!.treasury;
  for (let turn = 0; turn < 50 && !town.buildings.includes('building.market'); turn++) issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
  if (!town.buildings.includes('building.market') || marketCost <= 0) throw new Error('Paid market did not complete.');
  const quote = getSettlementLandObservation(state, state.turnOwnerId, town.id)!.cells.find(cell => cell.cell === deposit)!.improvementOptions.find(option => option.improvementId === 'improvement.grange')!;
  if (!quote.canStart) throw new Error(`Generated grain works are unavailable: ${quote.blocker}`);
  return { state: deserializeGame(serializeGame(state)), deposit, townId: town.id, townName: town.name, marketCost, quote };
}

/** Two settlements are genuinely founded. The player's starting scout is then
 * authored beside the foreign hearth to establish actual local contact/sight. */
export function politicalOverviewCampaign() {
  const state = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace: 'epic' });
  for (const [index, faction] of state.factions.entries()) {
    const caravan = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
    issue(state, { type: 'found', factionId: faction.id, armyId: caravan.id, name: index ? 'Reed witness' : 'Ash witness' });
  }
  const foreign = Object.values(state.settlements).find(town => town.factionId !== state.turnOwnerId)!;
  const scout = Object.values(state.armies).find(army => army.factionId === state.turnOwnerId)!;
  const occupied = new Set(Object.values(state.armies).filter(army => army.id !== scout.id).map(army => army.cell));
  const approach = neighbors(foreign.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !occupied.has(cell));
  if (approach === undefined) throw new Error('No legal unoccupied approach to the foreign hearth.');
  scout.cell = approach;
  refreshAuthoredSight(state);
  return deserializeGame(serializeGame(state));
}
