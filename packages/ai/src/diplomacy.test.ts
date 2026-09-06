import { expect, test } from 'vitest';
import { applyCommand, getObservation, type GameState } from '@theandril/sim';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { planTurn, planTurnWithReasons } from './index';

function wartime(turns = 0): GameState {
  const state = borderBattleCampaign();
  const targetFactionId = state.factions[1]!.id;
  expect(applyCommand(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId }).ok).toBe(true);
  for (let turn = 0; turn < turns; turn++) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
  return state;
}

test('AI seeks an affordable peace after a prolonged war without issuing contradictory attacks', () => {
  const state = wartime(8);
  const view = getObservation(state, state.turnOwnerId);
  const original = structuredClone(view);
  const plan = planTurnWithReasons(view);
  expect(plan.commands).toEqual([{ type: 'proposePeace', factionId: view.factionId, targetFactionId: state.factions[1]!.id, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } }]);
  expect(plan.reasons.join(' ')).toContain('8 turns of war');
  expect(view).toEqual(original);
  expect(applyCommand(state, plan.commands[0]).ok).toBe(true);
  expect(planTurn(getObservation(state, state.turnOwnerId)).some(command => command.type === 'proposePeace')).toBe(false);
});

test('AI responds using shared valuation and respects the resulting binding peace', () => {
  const state = wartime(8);
  const enemy = state.factions[1]!.id;
  expect(applyCommand(state, { type: 'proposePeace', factionId: enemy, targetFactionId: state.turnOwnerId, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } }).ok).toBe(true);
  const plan = planTurnWithReasons(getObservation(state, state.turnOwnerId));
  expect(plan.commands).toHaveLength(1);
  expect(plan.commands[0]).toMatchObject({ type: 'respondPeace', accept: true });
  expect(plan.reasons.join(' ')).toContain('prolonged war');
  expect(applyCommand(state, plan.commands[0]).ok).toBe(true);
  expect(state.wars).toEqual([]);
  const protectedPlan = planTurn(getObservation(state, state.turnOwnerId));
  expect(protectedPlan.some(command => ['declareWar', 'attack', 'besiege'].includes(command.type))).toBe(false);
  for (const command of protectedPlan) expect(applyCommand(state, command).ok).toBe(true);
});

test('AI rejects unaffordable reparations and retains the explanation', () => {
  const state = wartime();
  expect(applyCommand(state, { type: 'proposePeace', factionId: state.factions[1]!.id, targetFactionId: state.turnOwnerId, terms: { offerCoin: 0, requestCoin: 100, truceTurns: 10 } }).ok).toBe(true);
  const plan = planTurnWithReasons(getObservation(state, state.turnOwnerId));
  expect(plan.commands[0]).toMatchObject({ type: 'respondPeace', accept: false });
  expect(plan.reasons.join(' ')).toContain('no longer fund');
  expect(applyCommand(state, plan.commands[0]).ok).toBe(true);
  expect(state.wars).toHaveLength(1);
});

test('AI legally rejects a payment offer whose proposer spends the promised coin', () => {
  const state = wartime();
  const proposerId = state.turnOwnerId;
  const recipientId = state.factions[1]!.id;
  const town = Object.values(state.settlements).find(settlement => settlement.factionId === proposerId)!;
  expect(applyCommand(state, { type: 'proposePeace', factionId: proposerId, targetFactionId: recipientId, terms: { offerCoin: 40, requestCoin: 0, truceTurns: 10 } }).ok).toBe(true);
  expect(planTurn(getObservation(state, recipientId))[0]).toMatchObject({ type: 'respondPeace', accept: true });
  for (const itemId of ['building.granary', 'building.workshop', 'building.market']) {
    expect(applyCommand(state, { type: 'queue', factionId: proposerId, settlementId: town.id, itemId }).ok).toBe(true);
  }
  const treasuries = state.factions.map(faction => faction.treasury);
  expect(treasuries[0]).toBe(30);
  const view = getObservation(state, recipientId);
  expect(view.diplomacy.offers[0]?.acceptanceBlocker).toContain('no longer fund');
  const plan = planTurnWithReasons(view);
  expect(plan.commands).toHaveLength(1);
  expect(plan.commands[0]).toMatchObject({ type: 'respondPeace', accept: false });
  expect(plan.reasons.join(' ')).toContain('no longer fund');
  expect(applyCommand(state, plan.commands[0]).ok).toBe(true);
  expect(state.diplomacy.offers).toEqual([]);
  expect(state.wars).toHaveLength(1);
  expect(state.factions.map(faction => faction.treasury)).toEqual(treasuries);
  expect(planTurn(getObservation(state, recipientId)).some(command => command.type === 'respondPeace')).toBe(false);
});

test('AI preserves first-contact fighting and offers limited tribute for later exhaustion', () => {
  const state = wartime();
  expect(planTurn(getObservation(state, state.turnOwnerId)).some(command => command.type === 'proposePeace')).toBe(false);
  for (let turn = 0; turn < 3; turn++) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
  const view = getObservation(state, state.turnOwnerId);
  view.armies = view.armies.map(army => army.factionId === view.factionId ? { ...army, morale: 20 } : army);
  const offer = planTurn(view)[0];
  expect(offer?.type).toBe('proposePeace');
  if (offer?.type !== 'proposePeace') throw new Error('Missing recovery peace proposal.');
  expect(offer.terms.offerCoin).toBeGreaterThan(0);
  expect(offer.terms.offerCoin).toBeLessThanOrEqual(Math.floor((view.treasury - 8) / 4));
});
