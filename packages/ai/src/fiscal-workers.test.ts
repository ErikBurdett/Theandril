import { expect, test } from 'vitest';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { prosperityCampaign } from '../../test-fixtures/src/victory-fixture';
import { planLand } from './land';

function scene() {
  const game = prosperityCampaign();
  game.factions[0]!.treasury = 80; // Prepared infrastructure, but the real project is not funded.
  return game;
}

test('idle developed towns fund the observed project instead of prioritizing unused industry', () => {
  const game = scene(), view = getObservation(game, game.turnOwnerId);
  const land = view.land.settlements[0]!, town = view.settlements.find(town => town.id === land.settlementId)!;
  const choices = land.cells.filter(cell => cell.claimed && cell.canWork).slice(0, 2);
  expect(choices).toHaveLength(2);
  // Two detached, hypothetical yield quotes isolate allocation policy, not tile rules.
  land.cells = choices; land.workerCapacity = 1; land.worked = [];
  choices[0]!.yields.total = { food: 2, industry: 4, coin: 0, knowledge: 0 };
  choices[1]!.yields.total = { food: 2, industry: 0, coin: 2, knowledge: 0 };
  const selected = () => planLand(view, 0).commands.find(command => command.type === 'setWorkedTiles' && command.settlementId === town.id);
  const untouched = structuredClone(view);
  expect(selected()).toMatchObject({ cells: [choices[1]!.cell] });
  expect(view).toEqual(untouched);
  const queuedThisPlan = new Set([town.id]);
  expect(planLand(view, 0, queuedThisPlan).commands.find(command => command.type === 'setWorkedTiles' && command.settlementId === town.id)).toMatchObject({ cells: [choices[0]!.cell] });
  expect([...queuedThisPlan]).toEqual([town.id]);
  const originalFood = town.food;
  town.food = 0;
  choices[0]!.yields.total = { food: 4, industry: 0, coin: 0, knowledge: 0 };
  choices[1]!.yields.total = { food: 0, industry: 0, coin: 4, knowledge: 0 };
  expect(selected()).toMatchObject({ cells: [choices[0]!.cell] }); // Hungry towns still prefer the food supply.
  town.food = originalFood;
  choices[0]!.yields.total = structuredClone(untouched.land.settlements[0]!.cells[0]!.yields.total);
  choices[1]!.yields.total = structuredClone(untouched.land.settlements[0]!.cells[1]!.yields.total);
  town.queue = [{ itemId: 'unit.guard', progress: 0 }];
  expect(selected()).toMatchObject({ cells: [choices[0]!.cell] }); // Actual production still values industry.
  town.queue = []; view.treasury = view.progression.project.coinCost;
  expect(selected()).toMatchObject({ cells: [choices[0]!.cell] }); // No financing goal once funded.
  view.treasury = 80;
  view.settlements.find(other => other.factionId === view.factionId && other.id !== town.id)!.buildings = [];
  expect(selected()).toMatchObject({ cells: [choices[0]!.cell] }); // Do not abandon the initial development phase.
});

test('fiscal worker orders use real claimed options and preserve exact save continuation without spending', () => {
  const game = scene(), mirror = deserializeGame(serializeGame(game));
  const original = stateHash(game), view = getObservation(game, game.turnOwnerId), detached = structuredClone(view);
  const plan = planLand(view, 0);
  expect(plan.coinSpent).toBe(0); expect(plan.commands.length).toBeGreaterThan(0);
  expect(plan.commands.every(command => command.type === 'setWorkedTiles')).toBe(true);
  expect(view).toEqual(detached); expect(stateHash(game)).toBe(original);
  for (const command of [...plan.commands, { type: 'endTurn' as const, factionId: game.turnOwnerId }]) {
    const result = applyCommand(game, command);
    expect(result.ok, result.error).toBe(true); expect(applyCommand(mirror, command)).toEqual(result);
  }
  expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(mirror));
});
