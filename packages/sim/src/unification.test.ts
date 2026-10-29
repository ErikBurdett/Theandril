import { describe, expect, it } from 'vitest';
import { CAMPAIGN_PACES, UNIFICATION_VICTORY } from '@theandril/content';
import { unificationCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, applyCommandForVersion, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, type GameState } from './index';

const endTurn = (state: GameState) => expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true });
const bid = (state: GameState) => state.projects.find(project => project.projectId === UNIFICATION_VICTORY.id);
const window = CAMPAIGN_PACES.short.projectActiveTurns;

describe('Unification victory (rules 19)', () => {
  it('opens a public bid at the capital and wins after holding the majority through the window', () => {
    const state = unificationCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    expect(getObservation(state, player).progression.unification).toMatchObject({ held: 8, total: 9, minimum: 8, blockers: [] });
    expect(getObservation(state, rival).progression.unification!.blockers).toEqual(expect.arrayContaining([expect.stringContaining('more than two thirds')]));
    endTurn(state);
    expect(bid(state)).toMatchObject({ factionId: player, settlementId: state.land.capitals[player], status: 'active', progress: 0, requiredTurns: window });
    // The bid and its location are public to rivals.
    expect(getObservation(state, rival).projects.some(project => project.projectId === UNIFICATION_VICTORY.id && project.factionId === player)).toBe(true);
    endTurn(state);
    const resumed = deserializeGame(serializeGame(state));
    expect(stateHash(resumed)).toBe(stateHash(state));
    for (let turn = 1; turn < window; turn++) { endTurn(state); endTurn(resumed); }
    expect(state.victory).toMatchObject({ path: 'unification', factionId: player, projectId: bid(state)!.id });
    expect(stateHash(resumed)).toBe(stateHash(state));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('ends the bid when the realm loses its majority or its capital', () => {
    const lost = unificationCampaign(), rival = lost.factions[1]!.id;
    endTurn(lost);
    for (const town of Object.values(lost.settlements).filter(town => town.factionId === lost.turnOwnerId && town.id !== lost.land.capitals[lost.turnOwnerId]).slice(0, 3)) town.factionId = rival;
    endTurn(lost);
    expect(bid(lost)).toMatchObject({ status: 'cancelled', statusReason: 'The realm no longer holds two thirds of the world’s hearths; the unification bid ended.' });
    expect(lost.victory).toBeNull();

    const fallen = unificationCampaign();
    endTurn(fallen);
    fallen.settlements[bid(fallen)!.settlementId]!.factionId = fallen.factions[1]!.id;
    endTurn(fallen);
    expect(bid(fallen)).toMatchObject({ status: 'cancelled', statusReason: 'The host capital fell; the unification bid ended.' });
  });

  it('is absent from historical rules and refused by older envelopes', () => {
    const state = unificationCampaign();
    expect(applyCommandForVersion(state, { type: 'endTurn', factionId: state.turnOwnerId }, 18)).toMatchObject({ ok: true });
    expect(bid(state)).toBeUndefined();
    // A bid-free rules-18 envelope loads into rules 19 unchanged.
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 18)))).toBe(stateHash(state));
    endTurn(state);
    expect(bid(state)).toBeDefined();
    expect(() => serializeGameForVersion(state, 18)).toThrow('unification bid');
    expect(() => applyCommandForVersion(state, { type: 'endTurn', factionId: state.turnOwnerId }, 18)).toThrow('Historical rules cannot execute unification bids.');
  });
});

describe('a bid lost to politics (rules 22 pledges, rules 39 counterplay)', () => {
  it('ends when a client whose pledged hearths carried the bid renounces its oath', () => {
    const state = unificationCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    // Six own hearths of nine are not two thirds; three pledged by a client are.
    for (const town of Object.values(state.settlements).filter(town => town.factionId === player && town.id !== state.land.capitals[player]).slice(0, 2)) town.factionId = rival;
    refreshAuthoredSight(state);
    state.factions[0]!.treasury = 200;
    expect(getObservation(state, player).progression.unification!.blockers).toEqual(expect.arrayContaining([expect.stringContaining('more than two thirds')]));
    expect(applyCommand(state, { type: 'proposeClient', factionId: player, targetFactionId: rival, terms: { giftCoin: 40, tributeCoin: 2, termTurns: 20 } })).toMatchObject({ ok: true });
    const offer = state.diplomacy.clientOffers[0]!;
    expect(applyCommand(state, { type: 'respondClient', factionId: rival, offerId: offer.id, accept: true })).toMatchObject({ ok: true });
    expect(getObservation(state, player).progression.unification).toMatchObject({ own: 6, pledged: 3, held: 9, total: 9, blockers: [] });
    endTurn(state);
    expect(bid(state)).toMatchObject({ factionId: player, status: 'active', progress: 0 });
    // The client withdraws its hearths; the bid survives only until the round closes.
    expect(applyCommand(state, { type: 'renounceClient', factionId: rival })).toMatchObject({ ok: true });
    expect(bid(state)).toMatchObject({ status: 'active' });
    endTurn(state);
    expect(bid(state)).toMatchObject({ status: 'cancelled', statusReason: 'The realm no longer holds two thirds of the world’s hearths; the unification bid ended.' });
    expect(state.victory).toBeNull();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });
});
