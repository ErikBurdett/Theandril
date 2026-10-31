import { expect, test } from 'vitest';
import { HEARTH_EVENTS } from '@theandril/content';
import { applyCommand, getObservation, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { planHearthEvents, valueHearthEventChoice } from './hearth-events';
import { planTurnWithReasons } from './index';

const offer = (state: GameState, templateId: string): string => {
  const player = state.turnOwnerId, host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const id = `event.${state.nextId++}`;
  state.hearthEvents.pending = [{ id, factionId: player, settlementId: host.id, templateId, turn: state.turn, expiresTurn: state.turn + 5 }];
  return id;
};

test('rules 46: the AI answers a hearth event by the quoted value of its effects, with the whole turn, and the order is legal', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const harvest = HEARTH_EVENTS.find(item => item.id === 'event.bumper_harvest')!;
  const id = offer(state, harvest.id);
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  host.food = 30;
  let view = getObservation(state, player);
  const event = view.hearthEvents!.find(item => item.id === id)!;
  // A well-fed hearth sells the surplus; a hungry one fills the granary.
  expect(valueHearthEventChoice(view, event, event.choices[1]!)).toBeGreaterThan(valueHearthEventChoice(view, event, event.choices[0]!));
  const plan = planHearthEvents(view)!;
  expect(plan.commands).toEqual([{ type: 'resolveHearthEvent', factionId: player, eventId: id, choiceId: 'sell_the_surplus' }]);
  expect(plan.reasons[0]).toContain('sell the surplus');
  host.food = 2;
  view = getObservation(state, player);
  expect(planHearthEvents(view)!.commands[0]).toMatchObject({ choiceId: 'fill_the_granary' });
  const turn = planTurnWithReasons(view);
  // The answer closes the turn's orders, so nothing planned on the hearth's stores is unsettled by it.
  expect(turn.commands.at(-1)).toEqual({ type: 'resolveHearthEvent', factionId: player, eventId: id, choiceId: 'fill_the_granary' });
  expect(applyCommand(state, turn.commands.at(-1)!)).toMatchObject({ ok: true });
  expect(host.food).toBe(14);
  expect(planHearthEvents(getObservation(state, player))).toBeNull();
  // Devastation and population weigh: refugees are taken in, a collapse is rebuilt when the coin is there.
  offer(state, 'event.road_refugees');
  expect(planHearthEvents(getObservation(state, player))!.commands[0]).toMatchObject({ choiceId: 'take_them_in' });
  // Rules 48: an answer is worth its own effects and the best the follow-up can then be answered for, discounted: the levees are raised, the sickness is closed in the lanes.
  offer(state, 'event.river_rising');
  expect(planHearthEvents(getObservation(state, player))!.commands[0]).toMatchObject({ choiceId: 'raise_the_levees' });
  offer(state, 'event.sickness_in_the_lanes');
  expect(planHearthEvents(getObservation(state, player))!.commands[0]).toMatchObject({ choiceId: 'close_the_lanes' });
  offer(state, 'event.old_quarter_collapse');
  host.devastation = 20;
  expect(planHearthEvents(getObservation(state, player))!.commands[0]).toMatchObject({ choiceId: 'clear_the_rubble' });
  host.devastation = 40;
  expect(planHearthEvents(getObservation(state, player))!.commands[0]).toMatchObject({ choiceId: 'rebuild_it' });
});
