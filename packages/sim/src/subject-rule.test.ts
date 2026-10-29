import { describe, expect, it } from 'vitest';
import { CONQUEST_FIXTURE, subjectCampaign } from '../../test-fixtures/src/conquest-fixture';
import { applyCommand, applyCommandForVersion, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, subjectTerms, type GameCommand, type GameState } from './index';

const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId, townId = CONQUEST_FIXTURE.settlementId;
const command = (state: GameState, input: GameCommand) => expect(applyCommand(state, input), JSON.stringify(input)).toMatchObject({ ok: true });
/** The capital falls through ordinary war, siege, assault and auto-resolution. */
function fallen(state = subjectCampaign()): GameState {
  command(state, { type: 'declareWar', factionId: player, targetFactionId: rival });
  command(state, { type: 'besiege', factionId: player, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: townId });
  for (let turn = 0; turn < 3; turn++) command(state, { type: 'endTurn', factionId: player });
  command(state, { type: 'assault', factionId: player, settlementId: townId });
  command(state, { type: 'autoResolveBattle', factionId: player });
  expect(state.pendingCapture).toMatchObject({ settlementId: townId, factionId: player, previousOwnerId: rival, rulesVersion: 39 });
  return state;
}

describe('subject rule (rules 39)', () => {
  it('offers subject rule only for a fallen capital whose realm still has a hearth, and explains its absence', () => {
    const state = fallen();
    const view = getObservation(state, player);
    const terms = subjectTerms(state, rival);
    expect(terms).toEqual({ giftCoin: 0, tributeCoin: 6, termTurns: 30 });
    expect(view.pendingCapture?.options.map(option => option.outcome)).toEqual(['occupy', 'sack', 'raze', 'subject']);
    expect(view.pendingCapture?.options.at(-1)).toMatchObject({ outcome: 'subject', recipientFactionId: rival, coinGain: 0, populationLoss: 0, buildingsLost: 0, occupationTurns: 1 });
    expect(view.pendingCapture?.unavailable).toBeUndefined();
    // The rival sees no decision at all.
    expect(getObservation(state, rival).pendingCapture).toBeNull();
    // A fallen hearth that is not the capital explains the missing outcome.
    const provincial = subjectCampaign();
    provincial.land.capitals[rival] = Object.keys(provincial.settlements).find(id => provincial.settlements[id]!.factionId === rival && id !== townId)!;
    fallen(provincial);
    expect(getObservation(provincial, player).pendingCapture?.options.map(option => option.outcome)).toEqual(['occupy', 'sack', 'raze']);
    expect(getObservation(provincial, player).pendingCapture?.unavailable).toEqual([{ outcome: 'subject', reason: 'Only a fallen capital can bind its realm as a subject.' }]);
    expect(applyCommand(provincial, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'subject' })).toMatchObject({ ok: false, error: 'This capture outcome is not available.' });
  });

  it('returns the capital under an imposed peace and tribute, lifts the war, and survives save and replay', () => {
    const state = fallen();
    const before = state.factions.map(faction => faction.treasury);
    const result = applyCommand(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'subject' });
    expect(result).toMatchObject({ ok: true });
    expect(result.events.map(event => event.type)).toEqual(expect.arrayContaining(['settlement_captured', 'peace_accepted', 'client_accepted']));
    const town = state.settlements[townId]!;
    expect(town).toMatchObject({ factionId: rival, occupationTurns: 1, population: 2, queue: [] });
    expect(town.buildings).toEqual(['building.granary', 'building.workshop']);
    expect(state.wars).toEqual([]);
    expect(state.sieges[townId]).toBeUndefined();
    expect(state.pendingCapture).toBeNull();
    expect(state.diplomacy.clients).toEqual([{ id: expect.stringMatching(/^bond\./), patronId: player, clientId: rival, startedTurn: state.turn, expiresTurn: state.turn + 30, terms: { giftCoin: 0, tributeCoin: 6, termTurns: 30 }, missedTribute: 0 }]);
    expect(state.diplomacy.treaties).toEqual([expect.objectContaining({ parties: [player, rival], proposerId: player, expiresTurn: state.turn + 30, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 30 } })]);
    expect(state.factions.map(faction => faction.treasury)).toEqual(before);
    expect(state.land.capitals[rival]).toBe(townId);
    // The capturer's army keeps its position beside the returned capital.
    expect(state.armies[CONQUEST_FIXTURE.playerArmyId]!.cell).not.toBe(town.cell);
    // War is refused while the oath holds; tribute flows and the capital's hearths stand behind the patron.
    expect(applyCommand(state, { type: 'declareWar', factionId: player, targetFactionId: rival })).toMatchObject({ ok: false, error: 'Patron and client do not make war on each other. End the obligation first.' });
    const purse = state.factions.find(faction => faction.id === player)!.treasury, rivalPurse = state.factions.find(faction => faction.id === rival)!.treasury;
    command(state, { type: 'endTurn', factionId: player });
    expect(state.factions.find(faction => faction.id === player)!.treasury).toBeGreaterThanOrEqual(purse + 6 - 20);
    expect(state.factions.find(faction => faction.id === rival)!.treasury).toBeLessThanOrEqual(rivalPurse - 6 + 20);
    expect(getObservation(state, player).progression.unification?.pledged).toBe(2);
    const restored = deserializeGame(serializeGame(state));
    expect(stateHash(restored)).toBe(stateHash(state));
    // The realm may renounce early at the price of a breach, as any client may.
    expect(applyCommand(state, { type: 'renounceClient', factionId: rival })).toMatchObject({ ok: true });
    expect(state.diplomacy.clients).toEqual([]);
    expect(state.diplomacy.treaties).toEqual([]);
  });

  it('keeps the quoted decision out of historical rules while the sworn bond itself remains ordinary', () => {
    const state = fallen();
    expect(() => serializeGameForVersion(state, 38)).toThrow('capture decision unavailable');
    expect(() => applyCommandForVersion(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'occupy' }, 38)).toThrow('capture decision unavailable');
    expect(applyCommandForVersion(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'subject' }, 39)).toMatchObject({ ok: true });
    // Once sworn, the obligation is a rules-22 bond: a rules-38 reading is identical.
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 38)))).toBe(stateHash(state));
    // A rules-38 decision cannot quote subject rule even when the command schema would accept it.
    const older = subjectCampaign();
    fallen(older);
    older.pendingCapture!.rulesVersion = 16;
    older.pendingCapture!.options = older.pendingCapture!.options.filter(option => option.outcome !== 'subject');
    expect(applyCommand(older, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'subject' })).toMatchObject({ ok: false });
  });
});
