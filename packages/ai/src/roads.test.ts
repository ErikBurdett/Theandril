import { expect, test } from 'vitest';
import { applyCommand, getObservation } from '@theandril/sim';
import { overseasCampaign } from '../../test-fixtures/src/overseas-fixture';
import { navalCampaign } from '../../test-fixtures/src/naval-fixture';
import { planRoadAcceleration } from './roads';
import { planTurn } from './index';

test('one optional road proposal uses exact quotes and ownership, never spends a protected budget', () => {
  const game = overseasCampaign();
  expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Hearth' }).ok).toBe(true);
  const view = getObservation(game, game.turnOwnerId), town = view.settlements[0]!;
  // Explicit read-model policy fixture: command/routing rules have separate sim tests.
  view.settlements.push({ ...town, id: 'settlement.900', name: 'Road destination' });
  view.roads = [{ settlementId: town.id, targetId: 'settlement.900', targetName: 'Road destination', completed: 0, length: 5, progress: 1, required: 3, nextCell: town.cell + 1, coinCost: 12, canAccelerate: true, blocker: null }];
  const original = structuredClone(view);
  expect(planRoadAcceleration(view, 11).command).toBeNull();
  expect(planRoadAcceleration(view, 12)).toMatchObject({ command: { type: 'accelerateRoad', factionId: view.factionId, settlementId: town.id }, coinSpent: 12 });
  expect(view).toEqual(original);
  view.roads[0]!.canAccelerate = false;
  expect(planRoadAcceleration(view, 1000).command).toBeNull();
  view.roads[0]!.canAccelerate = true; view.settlements[1]!.factionId = 'faction.unseen';
  expect(planRoadAcceleration(view, 1000).command).toBeNull();
});

test('a current-sight road quote is ordered before boarding or marching can remove its worker sight', () => {
  const game = navalCampaign({ enemyFleet: false }), view = getObservation(game, game.turnOwnerId), town = view.settlements.find(town => town.factionId === view.factionId)!;
  // Pure order-policy input: the sim tests exercise completed road edges/costs. This
  // quoted work front deliberately shares a turn with real transport proposals.
  view.characters = []; view.characterRecruitment = [];
  view.settlements.push({ ...town, id: 'settlement.900', name: 'Road destination' });
  view.roads = [{ settlementId: town.id, targetId: 'settlement.900', targetName: 'Road destination', completed: 0, length: 5, progress: 1, required: 3, nextCell: town.cell + 1, coinCost: 12, canAccelerate: true, blocker: null }];
  const plan = planTurn(view);
  expect(plan[0]).toEqual({ type: 'accelerateRoad', factionId: view.factionId, settlementId: town.id });
  expect(plan.some(command => command.type === 'embarkArmy' || command.type === 'moveTo')).toBe(true);
  expect(plan.filter(command => command.type === 'accelerateRoad')).toHaveLength(1);
});
