import { expect, test } from 'vitest';
import { BUILDINGS } from '@theandril/content';
import { applyCommand, createArmyFormation, createGame, getObservation, getSettlementLandObservation, refreshLandKnowledge, serializeGame, deserializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { rebuildIndexes } from '../../sim/src/visibility';
import { planTurn } from './index';
import { planLand } from './land';
import { settlementSpacing } from './expansion';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); }
function scene(count: number, factionCount = 1) {
  const state = createGame({ seed: 17, size: 'tiny', factionCount, pace: 'epic', generatorVersion: 4 }), factionId = state.turnOwnerId;
  // A resource-free physical clearing and caravans are authored to isolate the
  // settlement-count decision; each hearth is established by its real paid order.
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(80); state.world.waterDepth.fill(0);
  state.resources.deposits = {};
  state.factions[0]!.treasury = 20_000;
  for (let index = 0; index < count; index++) {
    const id = index === 0 ? 'army.1' : `army.${state.nextId++}`, cell = (10 + Math.floor(index / 4) * 9) * state.world.width + 10 + index % 4 * 9;
    state.armies[id] = { id, factionId, name: 'Founding witness', cell, movement: 2, formations: [createArmyFormation(id, 'unit.colonist')] };
    const visible = rebuildIndexes(state); refreshLandKnowledge(state, factionId, visible.visible.get(factionId)!);
    const before = state.factions[0]!.treasury, quote = getObservation(state, factionId).growth!.founding.coinCost;
    issue(state, { type: 'found', factionId, armyId: id, name: `Witness ${index}` });
    expect(state.factions[0]!.treasury).toBe(before - quote);
  }
  return deserializeGame(serializeGame(state));
}

test.each([4, 6, 8])('an affordable realm with%s hearths recruits and pays for another caravan instead of obeying the old count target', count => {
  const state = scene(count), view = getObservation(state, state.turnOwnerId);
  // Preserve the genuine caravan quotes; suppress unrelated choices to isolate
  // recruitment preference without inventing a permissive production option.
  view.productionOptions = view.productionOptions.filter(option => option.itemId === 'unit.colonist');
  const before = stateHash(state), plan = planTurn(view);
  expect(stateHash(state)).toBe(before);
  const recruit = plan.find(command => command.type === 'queue' && command.itemId === 'unit.colonist');
  expect(recruit).toBeDefined();
  issue(state, recruit!);
  const after = getObservation(state, state.turnOwnerId);
  expect(after.settlements.some(town => town.queue.some(order => order.itemId === 'unit.colonist'))).toBe(true);
  expect(state.factions[0]!.treasury).toBeLessThan(view.treasury);
});

test('an isolated realm saves below the expedition threshold and releases the purse for a real paid caravan', () => {
  const state = scene(1, 2), factionId = state.turnOwnerId, town = Object.values(state.settlements)[0]!;
  town.buildings = BUILDINGS.filter(building => !building.coastalOnly).map(building => building.id);
  state.factions[0]!.treasury = 40;
  const first = getObservation(state, factionId);
  expect(first.factions).toHaveLength(1);
  expect(first.growth!.founding.coinCost + 16 + first.growth!.founding.additionalUpkeep * 6 + 24).toBeGreaterThan(first.treasury);
  expect(first.productionOptions.some(option => option.itemId === 'unit.guard' && option.canQueue)).toBe(true);
  for (const command of planTurn(first)) issue(state, command);
  expect(state.factions[0]!.treasury).toBe(40);
  expect(town.queue).toEqual([]);
  let recruited = false;
  issue(state, { type: 'endTurn', factionId });
  for (let turn = 0; turn < 12 && !recruited; turn++) {
    for (const command of planTurn(getObservation(state, factionId))) {
      issue(state, command);
      if (command.type === 'queue' && command.itemId === 'unit.colonist') recruited = true;
    }
    if (!recruited) issue(state, { type: 'endTurn', factionId });
  }
  expect(recruited).toBe(true);
  expect(town.queue.some(order => order.itemId === 'unit.colonist')).toBe(true);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('preferred settlement spacing changes with observed fertility and neighboring development', () => {
  const state = scene(1), base = getObservation(state, state.turnOwnerId), cell = base.cells.find(item => !item.settlementId)!.cell;
  const fertile = structuredClone(base), poor = structuredClone(base), sprawling = structuredClone(base);
  fertile.cells.find(item => item.cell === cell)!.fertility = 90;
  poor.cells.find(item => item.cell === cell)!.fertility = 10;
  sprawling.land.settlements[0]!.claimed = Array.from({ length: 127 }, (_, index) => index);
  expect(settlementSpacing(poor, cell)).toBeGreaterThan(settlementSpacing(fertile, cell));
  expect(settlementSpacing(sprawling, cell)).toBeGreaterThan(settlementSpacing(base, cell));
  expect(settlementSpacing(fertile, cell)).toBeGreaterThanOrEqual(3);
});

test('a partial page never removes existing workers outside its quoted window', () => {
  const state = scene(1), town = Object.values(state.settlements)[0]!;
  town.population = 8;
  const cells = state.land.settlements[town.id]!.claimed.filter(cell => cell !== town.cell);
  issue(state, { type: 'setWorkedTiles', factionId: state.turnOwnerId, settlementId: town.id, cells });
  const view = getObservation(state, state.turnOwnerId);
  const page = getSettlementLandObservation(state, state.turnOwnerId, town.id, { offset: 0, limit: 2 })!;
  view.land.settlements = [page];
  const plan = planLand(view, 0);
  const workers = plan.commands.find(command => command.type === 'setWorkedTiles');
  if (workers?.type === 'setWorkedTiles') {
    expect(cells.every(cell => workers.cells.includes(cell))).toBe(true);
    issue(state, workers);
  }
  expect(state.land.settlements[town.id]!.worked).toEqual(cells);
});

test('rotating town review advances a sprawling hearth page on its next visit', () => {
  const state = scene(2), factionId = state.turnOwnerId, town = Object.values(state.settlements)[0]!;
  while (state.land.settlements[town.id]!.claimed.length < 80) {
    const cell = getSettlementLandObservation(state, factionId, town.id)!.borderExpansion.nextCell!;
    issue(state, { type: 'claimCell', factionId, settlementId: town.id, cell });
  }
  const first = getObservation(state, factionId, { landDetails: { offset: 0, limit: 1 } }).land.settlements.find(land => land.settlementId === town.id)!;
  const nextVisit = getObservation(state, factionId, { landDetails: { offset: 2, limit: 1 } }).land.settlements.find(land => land.settlementId === town.id)!;
  expect(first.cellWindow!.offset).toBe(0);
  expect(nextVisit.cellWindow!.offset).toBe(64);
  expect(nextVisit.cells.some(cell => !first.cells.some(prior => prior.cell === cell.cell))).toBe(true);
});
