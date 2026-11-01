import { expect, test } from 'vitest';
import { crisisDefinition } from '@theandril/content';
import { applyCommand, getObservation, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { planCrisis, remainingToll } from './crises';
import { planTurnWithReasons } from './index';

/** The fixture at the turn before the Short pace's Age of Roads; its close brings an age and a crisis. */
const inCrisis = (): GameState => {
  const state = attunementCampaign(); state.turn = 11;
  const result = applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId });
  if (!result.ok) throw new Error(result.error);
  return state;
};

test('a realm shelters its hearths when the toll still to come outweighs the price it can pay, and otherwise endures', () => {
  const state = inCrisis(), player = state.turnOwnerId;
  const me = state.factions.find(faction => faction.id === player)!;
  me.treasury = 1000;
  const view = getObservation(state, player), crisis = view.crisis!;
  expect(crisisDefinition(crisis.crisisId)).toBeDefined();
  const toll = remainingToll(view);
  expect(toll).toBeGreaterThan(0);
  // Priced below the toll still to come, the shelter is bought; priced above it, the realm endures.
  expect(planCrisis({ ...view, crisis: { ...crisis, shelterCost: Math.ceil(toll) + 1 } })).toBeNull();
  if (crisis.shelterCost >= toll) view.crisis = { ...crisis, shelterCost: Math.floor(toll) - 1 };
  const plan = planCrisis(view)!;
  expect(plan.commands).toEqual([{ type: 'shelterFromCrisis', factionId: player, crisisId: crisis.id }]);
  expect(plan.coinSpent).toBe(view.crisis!.shelterCost);
  expect(plan.reasons[0]).toContain(crisis.name);
  // The whole turn carries the shelter, and it is legal.
  const turn = planTurnWithReasons(view);
  expect(turn.commands[0]).toEqual(plan.commands[0]); // first in the batch: nothing can spend its coin first
  const copy = structuredClone(state);
  expect(applyCommand(copy, plan.commands[0]!).ok).toBe(true);
  // The catalogue's own quote on this fixture: the price is below the toll of a realm with the coin.
  expect(planCrisis(getObservation(state, player))).not.toBeNull();
  // Not worth it when the term is nearly over; not possible when the purse is short; never twice.
  expect(planCrisis({ ...view, crisis: { ...crisis, turnsLeft: 0 } })).toBeNull();
  expect(planCrisis({ ...view, treasury: crisis.shelterCost - 1, crisis: { ...crisis, shelterBlocker: 'Requires more coin.' } })).toBeNull();
  expect(planCrisis({ ...view, crisis: { ...crisis, sheltered: true, shelterBlocker: 'The realm’s hearths are already sheltered.' } })).toBeNull();
  expect(planCrisis({ ...view, crisis: undefined })).toBeNull();
});
