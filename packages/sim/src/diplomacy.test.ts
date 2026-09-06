import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { checksum } from '@theandril/content';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { applyCommand, createGame, deserializeGame, getObservation, replayGame, serializeGame, stateHash } from './index';
import { evaluatePeaceOffer, getDiplomacyObservation, previewPeace, recordWar, type DiplomacyState } from './diplomacy';
import type { GameCommand, GameState } from './types';

const whitePeace = { offerCoin: 0, requestCoin: 0, truceTurns: 10 };
function wartime(): GameState {
  const state = borderBattleCampaign();
  const result = applyCommand(state, { type: 'declareWar', factionId: state.factions[0]!.id, targetFactionId: state.factions[1]!.id });
  expect(result.ok).toBe(true);
  return state;
}
function propose(state: GameState, offerCoin = 0, requestCoin = 0, truceTurns = 10): void {
  expect(applyCommand(state, { type: 'proposePeace', factionId: state.factions[0]!.id, targetFactionId: state.factions[1]!.id, terms: { offerCoin, requestCoin, truceTurns } }).ok).toBe(true);
}
function respond(state: GameState, accept = true): void {
  const offer = state.diplomacy.offers[0]!;
  expect(applyCommand(state, { type: 'respondPeace', factionId: offer.recipientId, offerId: offer.id, accept }).ok).toBe(true);
}
function endTurn(state: GameState): void { expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }).ok).toBe(true); }

describe('negotiated peace', () => {
  it('transfers coin once on acceptance, ends war and enforces a saved binding truce', () => {
    const state = wartime();
    const [a, b] = state.factions;
    const initial = state.factions.map(faction => faction.treasury);
    propose(state, 20);
    expect(state.factions.map(faction => faction.treasury)).toEqual(initial);
    const offerId = state.diplomacy.offers[0]!.id;
    respond(state);
    expect(a!.treasury).toBe(initial[0]! - 20);
    expect(b!.treasury).toBe(initial[1]! + 20);
    expect(state.wars).toEqual([]);
    const treatyHash = stateHash(state);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(treatyHash);
    expect(applyCommand(state, { type: 'respondPeace', factionId: b!.id, offerId, accept: true }).ok).toBe(false);
    expect(applyCommand(state, { type: 'declareWar', factionId: a!.id, targetFactionId: b!.id }).error).toMatch(/binding peace/i);
    expect(stateHash(state)).toBe(treatyHash);
  });

  it('checks both budgets atomically after an offer and cannot silently clip a transfer', () => {
    const state = wartime();
    propose(state, 40);
    state.factions[0]!.treasury = 0;
    const offer = state.diplomacy.offers[0]!;
    const hash = stateHash(state);
    expect(applyCommand(state, { type: 'respondPeace', factionId: offer.recipientId, offerId: offer.id, accept: true }).error).toMatch(/fund/);
    expect(stateHash(state)).toBe(hash);
    const recipientView = getObservation(state, offer.recipientId);
    expect(recipientView.diplomacy.offers[0]!.acceptanceBlocker).toMatch(/fund/);
    expect(evaluatePeaceOffer(recipientView, recipientView.diplomacy.offers[0]!).band).toBe('unlikely');
    state.factions[0]!.treasury = 50;
    state.factions[1]!.treasury = 1_000_000_000;
    const capped = stateHash(state);
    expect(applyCommand(state, { type: 'respondPeace', factionId: offer.recipientId, offerId: offer.id, accept: true }).error).toMatch(/limit/);
    expect(stateHash(state)).toBe(capped);
    respond(state, false);
    expect(state.wars).toHaveLength(1);
  });

  it('supports requested reparations and preserves total coin for arbitrary legal payments', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 60 }), fc.boolean(), (coin, requested) => {
      const state = wartime();
      const original = state.factions.map(faction => faction.treasury);
      propose(state, requested ? 0 : coin, requested ? coin : 0);
      respond(state);
      expect(state.factions[0]!.treasury).toBe(original[0]! + (requested ? coin : -coin));
      expect(state.factions.reduce((sum, faction) => sum + faction.treasury, 0)).toBe(original.reduce((sum, value) => sum + value, 0));
      expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    }), { numRuns: 40 });
  });

  it('rejects malformed, foreign, duplicate and same-turn replacement offers without mutation', () => {
    const state = wartime();
    const [a, b] = state.factions;
    const bad: unknown[] = [
      { type: 'proposePeace', factionId: a!.id, targetFactionId: b!.id, terms: { ...whitePeace, offerCoin: 1, requestCoin: 1 } },
      { type: 'proposePeace', factionId: a!.id, targetFactionId: b!.id, terms: { ...whitePeace, offerCoin: -1 } },
      { type: 'proposePeace', factionId: a!.id, targetFactionId: b!.id, terms: { ...whitePeace, truceTurns: 4 } },
      { type: 'proposePeace', factionId: a!.id, targetFactionId: a!.id, terms: whitePeace },
    ];
    for (const command of bad) { const hash = stateHash(state); expect(applyCommand(state, command).ok).toBe(false); expect(stateHash(state)).toBe(hash); }
    propose(state);
    const offer = state.diplomacy.offers[0]!;
    const hash = stateHash(state);
    expect(applyCommand(state, { type: 'respondPeace', factionId: a!.id, offerId: offer.id, accept: true }).ok).toBe(false);
    expect(applyCommand(state, { type: 'proposePeace', factionId: b!.id, targetFactionId: a!.id, terms: whitePeace }).ok).toBe(false);
    expect(stateHash(state)).toBe(hash);
    respond(state, false);
    expect(applyCommand(state, { type: 'proposePeace', factionId: a!.id, targetFactionId: b!.id, terms: whitePeace }).error).toMatch(/one peace proposal/i);
  });

  it('expires unanswered offers without moving money and expires treaties without resuming war', () => {
    const state = wartime();
    propose(state, 10);
    endTurn(state); endTurn(state);
    expect(state.diplomacy.offers).toHaveLength(1);
    endTurn(state);
    expect(state.diplomacy.offers).toEqual([]);
    expect(state.events.some(event => event.type === 'peace_offer_expired')).toBe(true);
    propose(state, 0, 0, 5);
    respond(state);
    for (let i = 0; i < 4; i++) endTurn(state);
    expect(state.diplomacy.treaties).toHaveLength(1);
    endTurn(state);
    expect(state.diplomacy.treaties).toEqual([]);
    expect(state.wars).toEqual([]);
    expect(applyCommand(state, { type: 'declareWar', factionId: state.factions[0]!.id, targetFactionId: state.factions[1]!.id }).ok).toBe(true);
  });

  it('replays proposal, midpoint offer save, acceptance and truce expiry exactly', () => {
    const state = wartime();
    const initial = serializeGame(state);
    const commands: GameCommand[] = [{ type: 'proposePeace', factionId: state.factions[0]!.id, targetFactionId: state.factions[1]!.id, terms: whitePeace }];
    expect(applyCommand(state, commands[0]).ok).toBe(true);
    const middle = deserializeGame(serializeGame(state));
    const offer = state.diplomacy.offers[0]!;
    const accept: GameCommand = { type: 'respondPeace', factionId: offer.recipientId, offerId: offer.id, accept: true };
    commands.push(accept);
    expect(applyCommand(state, accept).ok).toBe(true);
    expect(applyCommand(middle, accept).ok).toBe(true);
    for (let i = 0; i < 11; i++) { const command: GameCommand = { type: 'endTurn', factionId: state.turnOwnerId }; commands.push(command); expect(applyCommand(state, command).ok).toBe(true); expect(applyCommand(middle, command).ok).toBe(true); }
    expect(stateHash(state)).toBe(stateHash(middle));
    expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
  });

  it('keeps unrelated diplomacy private and returns detached participant records', () => {
    const state = createGame({ seed: 20260905, size: 'tiny', factionCount: 3 });
    const [a, b, observer] = state.factions;
    state.wars.push([a!.id, b!.id]); recordWar(state, a!.id, b!.id);
    propose(state, 10);
    expect(getDiplomacyObservation(state, observer!.id)).toEqual({ offers: [], treaties: [], relations: [] });
    const own = getDiplomacyObservation(state, a!.id);
    own.offers[0]!.terms.offerCoin = 999;
    own.relations[0]!.parties[0] = 'faction.forged';
    expect(state.diplomacy.offers[0]!.terms.offerCoin).toBe(10);
    expect(state.diplomacy.relations[0]!.parties[0]).toBe(a!.id);
    respond(state);
    expect(getObservation(state, a!.id).factions.some(faction => faction.id === b!.id)).toBe(true);
  });

  it('gives qualitative full-package assessments without mutating state or exposing exact weights', () => {
    const state = wartime();
    const [a, b] = state.factions;
    const hash = stateHash(state);
    expect(previewPeace(state, a!.id, b!.id, whitePeace).band).not.toBe('likely');
    const funded = previewPeace(state, a!.id, b!.id, { ...whitePeace, offerCoin: 40 });
    expect(funded.band).toBe('likely');
    expect(funded.reasons.join(' ')).toMatch(/payment/);
    expect(Object.keys(funded).sort()).toEqual(['band', 'objections', 'reasons']);
    expect(stateHash(state)).toBe(hash);
    propose(state, 40);
    const offer = state.diplomacy.offers[0]!;
    expect(evaluatePeaceOffer(getObservation(state, b!.id), offer)).toEqual(funded);
  });

  it('rejects corrupt diplomatic references and lifetimes even with a recomputed checksum', () => {
    const state = wartime(); propose(state, 10);
    const tamper = (change: (diplomacy: DiplomacyState) => void): void => {
      const raw = JSON.parse(serializeGame(state)) as { stateChecksum: string; state: { diplomacy: DiplomacyState } };
      change(raw.state.diplomacy); raw.stateChecksum = checksum(JSON.stringify(raw.state));
      expect(() => deserializeGame(JSON.stringify(raw))).toThrow();
    };
    tamper(diplomacy => { diplomacy.offers[0]!.recipientId = 'faction.missing'; });
    tamper(diplomacy => { diplomacy.offers[0]!.expiresTurn++; });
    tamper(diplomacy => { diplomacy.offers[0]!.id = 'offer.999999'; });
    tamper(diplomacy => { diplomacy.offers.push(diplomacy.offers[0]!); });
    tamper(diplomacy => { diplomacy.relations = []; });
    tamper(diplomacy => { diplomacy.relations[0]!.warStartedTurn = null; });
  });
});
