import { expect, test } from 'vitest';
import { RESOURCES, TECHNOLOGIES } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { planLand } from './land';
import { planTurn } from './index';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };

test.each(RESOURCES)('AI funds and works its first observed $name deposit, then sells only actual surplus', resource => {
  const state = createGame({ seed: 17, size: 'standard', factionCount: 1, pace: 'epic' }), factionId = state.turnOwnerId;
  const deposit = Number(Object.entries(state.resources.deposits).find(([cell, id]) => id === resource.id && neighbors(Number(cell), state.world.width, state.world.height).some(next => isPassable(state.world.terrain[next]!)))![0]);
  const center = neighbors(deposit, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
  // Relocate starting forces beside an actual generated deposit. Research and
  // funds are authored availability; ownership, workers, construction and sales
  // below always pass through real commands and exact public quotes.
  for (const army of Object.values(state.armies)) army.cell = center;
  refreshAuthoredSight(state);
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Resource witness' });
  state.progression[factionId]!.technologies = TECHNOLOGIES.map(item => item.id).sort();
  state.factions[0]!.treasury = 2000;
  const town = Object.values(state.settlements)[0]!, view = getObservation(state, factionId), summary = view.land.settlements[0]!;
  // A selected page with this productive site isolates actual material demand
  // while retaining every genuine quote and competing improvement option.
  summary.cells = summary.cells.filter(cell => cell.cell === deposit);
  expect(summary.cells).toHaveLength(1);
  const before = stateHash(state), plan = planLand(view, view.treasury);
  expect(stateHash(state)).toBe(before);
  expect(plan.commands).toContainEqual({ type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [deposit] });
  expect(plan.commands).toContainEqual({ type: 'improveTile', factionId, settlementId: town.id, cell: deposit, improvementId: resource.improvementId });
  const price = summary.cells[0]!.improvementOptions.find(option => option.improvementId === resource.improvementId)!.coinCost;
  for (const command of plan.commands) issue(state, command);
  expect(state.factions[0]!.treasury).toBe(view.treasury - price);
  const mirror = deserializeGame(serializeGame(state));
  const end = () => {
    const command = { type: 'endTurn', factionId } as const;
    expect(issue(mirror, command)).toEqual(issue(state, command));
    expect(stateHash(mirror)).toBe(stateHash(state));
  };
  while (state.land.settlements[town.id]!.work) end();
  end();
  expect(state.resources.stockpiles[factionId]![resource.id]).toBeGreaterThanOrEqual(resource.extraction);
  const market = { type: 'queue', factionId, settlementId: town.id, itemId: 'building.market' } as const;
  issue(state, market); issue(mirror, market);
  while (town.queue.length || (state.resources.stockpiles[factionId]![resource.id] ?? 0) <= 12) end();
  const observed = getObservation(state, factionId), amount = state.resources.stockpiles[factionId]![resource.id]!;
  const land = planLand(observed, observed.treasury);
  expect(land.commands.some(command => command.type === 'improveTile' && command.cell === deposit && command.improvementId !== resource.improvementId)).toBe(false);
  const sale = planTurn(observed).find(command => command.type === 'sellResource');
  expect(sale).toEqual({ type: 'sellResource', factionId, settlementId: town.id, resourceId: resource.id, amount: amount - 6 });
  const coin = state.factions[0]!.treasury;
  expect(issue(state, sale!)).toEqual(issue(mirror, sale!));
  expect(state.resources.stockpiles[factionId]![resource.id]).toBe(6);
  expect(state.factions[0]!.treasury).toBe(coin + (amount - 6) * resource.salePrice);
  expect(stateHash(mirror)).toBe(stateHash(state));
  expect(planTurn(getObservation(state, factionId)).some(command => command.type === 'sellResource')).toBe(false);
});
