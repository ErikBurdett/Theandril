import { expect, test } from 'vitest';
import { applyCommand, getObservation, type CaptureOption } from '@theandril/sim';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { chooseCaptureOption, planTurn, planTurnWithReasons } from './index';

test('AI invests a visible enemy town and maintains its siege until a legal assault', () => {
  const state = conquestCampaign();
  const first = planTurnWithReasons(getObservation(state, state.turnOwnerId));
  expect(first.commands.some(command => command.type === 'declareWar')).toBe(true);
  expect(first.commands.some(command => command.type === 'besiege' && command.settlementId === CONQUEST_FIXTURE.settlementId)).toBe(true);
  for (const command of first.commands) expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
  const held = getObservation(state, state.turnOwnerId);
  expect(held.sieges[0]?.canAssault).toBe(false);
  expect(planTurn(held).some(command => (command.type === 'move' || command.type === 'moveTo') && command.armyId === CONQUEST_FIXTURE.playerArmyId)).toBe(false);
  let assaulted = false;
  for (let turn = 0; turn < 5 && !assaulted; turn++) {
    expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true);
    const observed = getObservation(state, state.turnOwnerId);
    const plan = planTurn(observed);
    for (const command of plan) {
      expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
      if (command.type === 'assault') { expect(observed.sieges[0]!.defenses).toBe(0); assaulted = true; break; }
    }
  }
  expect(assaulted).toBe(true);
  expect(state.battle?.settlementId).toBe(CONQUEST_FIXTURE.settlementId);
  for (const command of planTurn(getObservation(state, state.turnOwnerId))) expect(applyCommand(state, command).ok).toBe(true);
  expect(state.pendingCapture?.settlementId, JSON.stringify(state.battleReports.at(-1))).toBe(CONQUEST_FIXTURE.settlementId);
  const capture = planTurn(getObservation(state, state.turnOwnerId));
  expect(capture[0]).toMatchObject({ type: 'resolveCapture', outcome: 'occupy' });
  expect(applyCommand(state, capture[0]).ok).toBe(true);
  expect(state.settlements[CONQUEST_FIXTURE.settlementId]!.factionId).toBe(state.turnOwnerId);
});

test('AI advances toward a nearby visible settlement before establishing its siege', () => {
  const state = conquestCampaign();
  const army = state.armies[CONQUEST_FIXTURE.playerArmyId]!;
  const town = state.settlements[CONQUEST_FIXTURE.settlementId]!;
  const stepBack = neighbors(army.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && hexDistance(cell, town.cell, state.world.width) === 2 && !Object.values(state.settlements).some(town => town.cell === cell));
  if (stepBack === undefined) throw new Error('Conquest fixture needs an approach hex.');
  expect(applyCommand(state, { type: 'move', factionId: state.turnOwnerId, armyId: army.id, target: stepBack }).ok).toBe(true);
  const plan = planTurn(getObservation(state, state.turnOwnerId));
  const movement = plan.find(command => command.type === 'moveTo' && command.armyId === army.id);
  expect(movement?.type).toBe('moveTo');
  if (movement?.type !== 'moveTo') throw new Error('Missing invasion movement.');
  expect(hexDistance(movement.target, town.cell, state.world.width)).toBe(1);
  for (const command of plan) expect(applyCommand(state, command).ok).toBe(true);
});

test('AI respects visible third-party blockades without reading their private siege details', () => {
  const state = conquestCampaign();
  const view = getObservation(state, state.turnOwnerId);
  expect(view.sieges).toEqual([]);
  view.visibleSiegeSettlementIds = [CONQUEST_FIXTURE.settlementId];
  const plan = planTurn(view);
  expect(plan.some(command => command.type === 'besiege' && command.settlementId === CONQUEST_FIXTURE.settlementId)).toBe(false);
});

test('AI only chooses supplied capture options and weighs recovery against treasury pressure', () => {
  const state = conquestCampaign();
  const view = getObservation(state, state.turnOwnerId);
  const occupy: CaptureOption = { outcome: 'occupy', label: 'Occupy', description: 'Keep the settlement.', coinGain: 0, populationLoss: 0, buildingsLost: 0, devastation: 20, occupationTurns: 3, recipientFactionId: view.factionId };
  const sack: CaptureOption = { outcome: 'sack', label: 'Sack', description: 'Take wealth and leave devastation.', coinGain: 40, populationLoss: 1, buildingsLost: 1, devastation: 60, occupationTurns: 5, recipientFactionId: view.factionId };
  view.pendingCapture = { settlementId: CONQUEST_FIXTURE.settlementId, armyId: CONQUEST_FIXTURE.playerArmyId, factionId: view.factionId, previousOwnerId: CONQUEST_FIXTURE.enemyFactionId, options: [sack, occupy] };
  expect(chooseCaptureOption(view)?.outcome).toBe('occupy');
  expect(chooseCaptureOption({ ...view, treasury: 0 })?.outcome).toBe('sack');
  const plan = planTurnWithReasons(view);
  expect(plan.commands).toEqual([{ type: 'resolveCapture', factionId: view.factionId, settlementId: CONQUEST_FIXTURE.settlementId, outcome: 'occupy' }]);
  expect(plan.reasons.join(' ')).toContain('occupation');
  view.pendingCapture.options = [sack];
  expect(chooseCaptureOption(view)?.outcome).toBe('sack');
});

test('AI lifts a hopeless siege and keeps exhausted field guards from attacking', () => {
  const state = conquestCampaign();
  for (const command of planTurn(getObservation(state, state.turnOwnerId))) expect(applyCommand(state, command).ok).toBe(true);
  const view = getObservation(state, state.turnOwnerId);
  view.armies = view.armies.map(army => ({ ...army, morale: 10 }));
  expect(planTurn(view)[0]).toMatchObject({ type: 'liftSiege', settlementId: CONQUEST_FIXTURE.settlementId });
  view.sieges = [];
  expect(planTurn(view).some(command => ['attack', 'besiege'].includes(command.type))).toBe(false);
});
