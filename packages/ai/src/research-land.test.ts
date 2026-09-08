import { expect, test } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, refreshLandKnowledge, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { isPassable, naturalFeatures, neighbors } from '@theandril/mapgen';
import { cellsWithin, rebuildIndexes } from '../../sim/src/visibility';
import { planProgression } from './progression';
import { planLand } from './land';
import { planTurn } from './index';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); }
function scene() {
  const state = createGame({ seed: 20260906, size: 'tiny', factionCount: 1, pace: 'epic', generatorVersion: 4 });
  for (const cell of cellsWithin(state, state.armies['army.1']!.cell, 3)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
  }
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Waterwork trial' });
  state.factions[0]!.knowledge = 500; state.factions[0]!.treasury = 500;
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.cinder_masonry' });
  return deserializeGame(serializeGame(state));
}

test('AI studies observed wetland opportunities through real prerequisite commands without overspending', () => {
  const state = scene(), factionId = state.turnOwnerId, hash = stateHash(state);
  const first = planProgression(getObservation(state, factionId));
  expect(first.commands.find(command => command.type === 'research')).toEqual({ type: 'research', factionId, technologyId: 'technology.stewardship' });
  expect(stateHash(state)).toBe(hash);
  issue(state, first.commands.find(command => command.type === 'research')!);
  const next = planProgression(getObservation(state, factionId));
  expect(next.commands.find(command => command.type === 'research')).toEqual({ type: 'research', factionId, technologyId: 'technology.waterworks' });
  issue(state, next.commands.find(command => command.type === 'research')!);
  expect(state.factions[0]!.knowledge).toBe(500 - 24 - 36 - 64);
  state.factions[0]!.knowledge = 0;
  expect(planTurn(getObservation(state, factionId)).some(command => command.type === 'research')).toBe(false);
});

test('AI may replace a worked reedwork with a genuinely better researched polder but never an equal or worse site', () => {
  const state = scene(), factionId = state.turnOwnerId, town = Object.values(state.settlements)[0]!;
  const target = getObservation(state, factionId).land.settlements[0]!.cells.find(cell => cell.canWork)!.cell;
  const end: GameCommand = { type: 'endTurn', factionId };
  issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [target] });
  issue(state, { type: 'improveTile', factionId, settlementId: town.id, cell: target, improvementId: 'improvement.reedworks' });
  issue(state, end); issue(state, end);
  const selected = () => {
    const view = getObservation(state, factionId);
    // Restrict to a real observed site to isolate the replacement decision.
    view.land.settlements[0]!.cells = view.land.settlements[0]!.cells.filter(cell => cell.cell === target);
    return view;
  };
  expect(planLand(selected(), 200).commands.some(command => command.type === 'improveTile')).toBe(false);
  for (const technologyId of ['technology.stewardship', 'technology.waterworks']) issue(state, { type: 'research', factionId, technologyId });
  const plan = planLand(selected(), 200), upgrade = plan.commands.find(command => command.type === 'improveTile');
  expect(upgrade).toEqual({ type: 'improveTile', factionId, settlementId: town.id, cell: target, improvementId: 'improvement.polder' });
  expect(plan.coinSpent).toBeGreaterThan(0); expect(planLand(selected(), plan.coinSpent - 1).commands.some(command => command.type === 'improveTile')).toBe(false);
  issue(state, upgrade!);
  const mirror = deserializeGame(serializeGame(state));
  for (let turn = 0; turn < 4; turn++) { issue(state, end); issue(mirror, end); }
  expect(stateHash(mirror)).toBe(stateHash(state));
  expect(planLand(selected(), 200).commands.some(command => command.type === 'improveTile')).toBe(false);
});

test('missing detailed land quotes never cause invented research opportunities or worker-removal orders', () => {
  const state = scene(), factionId = state.turnOwnerId;
  const town = Object.values(state.settlements)[0]!, target = getObservation(state, factionId).land.settlements[0]!.cells.find(cell => cell.canWork)!.cell;
  issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [target] });
  const view = getObservation(state, factionId, { landDetails: 'none' });
  expect(planProgression(view).commands.some(command => command.type === 'research')).toBe(false);
  expect(planLand(view, 200).commands).toEqual([]);
});

test('food demand cannot repeatedly demolish paid spring gardens and oreworks on the same real ore-and-spring hex', () => {
  const state = createGame({ seed: 74, size: 'small', factionCount: 12, pace: 'epic', generatorVersion: 4 });
  const factionId = state.turnOwnerId, target = 22593;
  expect(state.world.terrain[target]).toBe(3); expect(state.world.biome[target]).toBe(6);
  expect(naturalFeatures(state.world, target)).toBe(3);
  // Only the local starting position and budget are authored. Geography, features,
  // founding, technology purchases and both completed improvements are real rules.
  const origin = neighbors(target, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
  state.armies['army.1']!.cell = origin; state.armies['army.2']!.cell = origin; rebuildIndexes(state);
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Spring and seam' });
  const town = Object.values(state.settlements)[0]!;
  state.factions[0]!.treasury = 1000; state.factions[0]!.knowledge = 1000;
  for (const technologyId of ['technology.cinder_masonry', 'technology.stewardship', 'technology.quarry_cranes']) issue(state, { type: 'research', factionId, technologyId });
  issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [target] });
  const expected = {
    'improvement.spring_garden': { food: 5, industry: 0, coin: 2, knowledge: 0 },
    'improvement.oreworks': { food: 1, industry: 6, coin: 0, knowledge: 0 },
  };
  const utility = (yields: { food: number; industry: number; coin: number; knowledge: number }, foodWeight: number) => yields.food * foodWeight + yields.industry * 3 + yields.coin + yields.knowledge * 2;
  expect(utility(expected['improvement.oreworks'], 2) - utility(expected['improvement.spring_garden'], 2)).toBe(8);
  expect(utility(expected['improvement.spring_garden'], 5) - utility(expected['improvement.oreworks'], 5)).toBe(4);
  for (const improvementId of ['improvement.spring_garden', 'improvement.oreworks'] as const) {
    issue(state, { type: 'improveTile', factionId, settlementId: town.id, cell: target, improvementId });
    while (state.land.settlements[town.id]!.work) issue(state, { type: 'endTurn', factionId });
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
    const before = stateHash(state);
    for (const hungry of [false, true, false, true]) {
      const view = getObservation(state, factionId);
      const selected = view.land.settlements.find(land => land.settlementId === town.id)!;
      selected.cells = selected.cells.filter(cell => cell.cell === target);
      expect(selected.cells[0]!.yields.total).toEqual(expected[improvementId]);
      const observedTown = view.settlements.find(item => item.id === town.id)!;
      observedTown.food = hungry ? 0 : observedTown.population * 8;
      // Restrict only the detailed town query, not its genuine legal option quotes.
      expect(planLand(view, 500).commands.some(command => command.type === 'improveTile')).toBe(false);
    }
    expect(stateHash(state)).toBe(before);
  }
});

test('deep water blocking an otherwise incomplete border is not invented survey-estates research demand', () => {
  const state = scene(), factionId = state.turnOwnerId;
  issue(state, { type: 'research', factionId, technologyId: 'technology.stewardship' });
  // An authored island settlement has the ordinary radius-two capacity, but its
  // only unclaimed frontier is deep ocean. Validate that real state before planning.
  const town = Object.values(state.settlements)[0]!, claimed = state.land.settlements[town.id]!.claimed;
  town.population = 3;
  for (const cell of cellsWithin(state, town.cell, 2).filter(cell => !claimed.includes(cell))) {
    state.world.terrain[cell] = 0; state.world.biome[cell] = 0; state.world.waterDepth[cell] = 2; state.world.fertility[cell] = 0;
  }
  const index = rebuildIndexes(state); refreshLandKnowledge(state, factionId, index.visible.get(factionId)!);
  const resumed = deserializeGame(serializeGame(state)), view = getObservation(resumed, factionId), land = view.land.settlements[0]!;
  expect(land.claimed.length).toBeLessThan(land.claimCapacity);
  expect(land.borderExpansion).toMatchObject({ nextCell: null, rate: 0 });
  // Isolate this available branch from unrelated legal wetland research choices.
  view.progression.technologyChoices = view.progression.technologyChoices.filter(choice => choice.id === 'technology.surveyed_estates');
  expect(view.progression.technologyChoices[0]!.available).toBe(true);
  expect(planProgression(view).commands.some(command => command.type === 'research')).toBe(false);
});
