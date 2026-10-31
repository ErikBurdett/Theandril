import { expect, test } from 'vitest';
import { applyCommand, createGame, getObservation, type GameState } from '@theandril/sim';
import { answerAlliance, proposeAlliance, protectedFactions } from './diplomacy';
import { planTurnWithReasons } from './index';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';

/** Four realms, every pair of the three true realms in sight of one another. */
const scene = (): GameState => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 });
  for (const faction of state.factions) faction.treasury = 200;
  const realms = state.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id);
  const anchor = Object.values(state.armies).find(army => army.factionId === realms[0])!.cell;
  realms.slice(1).forEach((id, index) => { Object.values(state.armies).find(army => army.factionId === id)!.cell = anchor + index + 1; });
  refreshAuthoredSight(state);
  return state;
};

test('rules 50: a realm at war accepts an alliance, a realm at peace or bound by oath refuses, allies are never attacked, and a realm pressed by war without an ally courts the strongest free realm every ten turns', () => {
  const state = scene(), [a, b, c] = state.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
  expect(applyCommand(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 30 })).toMatchObject({ ok: true });
  const offer = state.alliances.offers[0]!;
  // At peace and no weaker than the proposer: the offer is refused; at war, or facing more hearths, it is accepted.
  const view = getObservation(state, b);
  expect(view.factions.map(faction => faction.id)).toContain(a);
  expect(answerAlliance(view)!.commands[0]).toMatchObject({ type: 'respondAlliance', offerId: offer.id, accept: false }); // at peace
  const pressed = answerAlliance({ ...view, wars: [c] })!;
  expect(pressed.commands[0]).toMatchObject({ type: 'respondAlliance', offerId: offer.id, accept: true });
  expect(pressed.reasons[0]).toContain('Accept');
  const sworn = { ...view, wars: [c], diplomacy: { ...view.diplomacy, clients: [{ id: 'bond.1', patronId: c, clientId: b, startedTurn: 1, expiresTurn: 40, terms: { giftCoin: 0, tributeCoin: 3, termTurns: 39 }, missedTribute: 0 }] } } as typeof view;
  expect(answerAlliance(sworn)!.commands[0]).toMatchObject({ accept: false });
  // The whole turn answers the offer first and nothing else.
  expect(planTurnWithReasons({ ...view, wars: [c] }).commands).toEqual([{ type: 'respondAlliance', factionId: b, offerId: offer.id, accept: true }]);
  expect(applyCommand(state, { type: 'respondAlliance', factionId: b, offerId: offer.id, accept: true })).toMatchObject({ ok: true });
  // Allies are protected: never attacked, never besieged, never made an objective.
  expect(protectedFactions(getObservation(state, a)).has(b)).toBe(true);
  expect(protectedFactions(getObservation(state, b)).has(a)).toBe(true);
  expect(protectedFactions(getObservation(state, c)).has(a)).toBe(false);
  // A realm at war courts the strongest known free realm on its turn of the cycle; allies, enemies, city-states and bound realms are passed over.
  const warring = getObservation(state, c), seat = warring.factions.findIndex(faction => faction.id === c);
  const turn = [...Array(10).keys()].map(offset => warring.turn + offset).find(candidate => (candidate + seat + 5) % 10 === 0)!;
  expect(proposeAlliance({ ...warring, turn })).toBeNull(); // at peace
  // Every free realm it knows holds the same hearths in sight, so the lowest id is courted.
  const free = warring.factions.map(faction => faction.id).filter(id => id !== c && id !== a && !id.startsWith('citystate.')).sort()[0]!;
  // Only a realm pressed by its war courts: the enemy's companies in sight outweigh its own.
  expect(proposeAlliance({ ...warring, turn, wars: [a] })).toBeNull();
  const beset = { ...warring, turn, wars: [a], armies: warring.armies.map(army => army.factionId === a ? { ...army, strength: army.strength + 500 } : army) };
  const courting = proposeAlliance(beset)!;
  expect(courting.commands[0]).toMatchObject({ type: 'proposeAlliance', factionId: c, targetFactionId: free, termTurns: 30 });
  expect(proposeAlliance({ ...beset, turn: turn + 1 })).toBeNull();
  expect(applyCommand(state, courting.commands[0]!)).toMatchObject({ ok: true });
});
