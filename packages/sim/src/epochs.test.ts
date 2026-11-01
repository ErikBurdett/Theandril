import { describe, expect, it } from 'vitest';
import { EPOCHS, HEARTH_EVENTS } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign, prosperityCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { serializeGameForVersion } from './save';
import { epochConditionHolds, epochId, epochIndex, observeEpoch } from './epochs';
import { hearthEventConditionHolds } from './hearth-events';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); return result; };
/** One end of turn resolves this fixture's turn; the ages that begin in it, as every realm reads them. */
const endRound = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId }).events.filter(event => event.type === 'epoch_begun').map(event => `${event.factionId}:${event.message}`);

describe('rules 49: campaign epochs', () => {
  it('reads the age from the world, enters every age whose condition holds as the world meets them, tells every realm as it happens, and never goes back', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    expect(epochId(state)).toBe('epoch.fracture');
    expect(observeEpoch(state)).toMatchObject({ id: 'epoch.fracture', name: 'The Age of Fracture', index: 0, count: EPOCHS.length });
    // Two realms with two hearths: the Age of Roads waits for four hearths or the pace's turn; the seam is already found, so the Age of Seams is ready behind it.
    expect(epochConditionHolds(state, EPOCHS[1]!)).toBe(false);
    expect(epochConditionHolds(state, EPOCHS[2]!)).toBe(true);
    expect(endRound(state)).toEqual([]);
    expect(epochId(state)).toBe('epoch.fracture');
    state.turn = 11; // the turn before the Short pace's Age of Roads
    expect(epochId(state)).toBe('epoch.fracture');
    // The close of turn 11 opens turn 12: the Age of Roads begins and, with the seam found, the Age of Seams behind it, each announced to every realm, in order.
    const begun = endRound(state);
    expect(epochId(state)).toBe('epoch.seams');
    expect(begun).toHaveLength(state.factions.length * 2);
    expect(begun.slice(0, state.factions.length).every(entry => entry.includes('The Age of Roads begins'))).toBe(true);
    expect(begun.slice(state.factions.length).every(entry => entry.includes('The Age of Seams begins'))).toBe(true);
    expect(endRound(state)).toEqual([]);
    expect(getObservation(state, player).epoch).toMatchObject({ id: 'epoch.seams', index: 2 });
    // A public bid opens the last age; the hearth founded or razed never counts down.
    const view = getObservation(state, player);
    const attunement = view.progression.attunement!;
    expect(attunement.blockers).toEqual([]);
    const bid = issue(state, { type: 'startAttunement', factionId: player, settlementId: attunement.eligibleSettlementIds[0]!, characterId: attunement.casters.find(caster => caster.qualified)!.characterId });
    expect(epochId(state)).toBe('epoch.bids');
    // The command that opened the bid announces the age it brought, to every realm.
    expect(bid.events.filter(event => event.type === 'epoch_begun').map(event => event.factionId).sort()).toEqual(state.factions.map(faction => faction.id).sort());
    expect(bid.events.find(event => event.type === 'epoch_begun')!.message).toContain('The Age of Bids begins');
    expect(endRound(state)).toEqual([]);
    expect(epochIndex(state)).toBe(3);
    // Nothing under historical rules.
    const historical = attunementCampaign();
    withRules(historical, 48, () => { historical.turn = 30; expect(endRound(historical)).toEqual([]); expect(getObservation(historical, player).epoch).toBeUndefined(); expect(epochIndex(historical)).toBe(0); });
  });

  it('counts hearths ever founded, so a razed hearth leaves the age where it was', () => {
    const state = prosperityCampaign();
    const realms = state.factions.length, hearths = Object.keys(state.settlements).length;
    expect(EPOCHS[1]!.condition).toMatchObject({ kind: 'hearths', perRealm: 2 });
    const before = epochConditionHolds(state, EPOCHS[1]!);
    // Turn a hearth into a ruin: the count of hearths and ruins is unchanged, and so is the age.
    const [id, town] = Object.entries(state.settlements)[0]!;
    state.ruins[id] = { id, name: town.name, cell: town.cell, founderFactionId: town.founderFactionId, razedByFactionId: town.factionId, turn: state.turn };
    delete state.settlements[id];
    expect(Object.keys(state.settlements).length + Object.keys(state.ruins).length).toBe(hearths);
    expect(epochConditionHolds(state, EPOCHS[1]!)).toBe(before);
    expect(realms).toBeGreaterThan(0);
  });

  it('gates the events of the ages, and the events of earlier catalogues name no age', () => {
    const state = attunementCampaign(), host = Object.values(state.settlements).find(town => town.factionId === state.turnOwnerId)!;
    const aged = HEARTH_EVENTS.filter(event => event.epoch);
    expect(aged.map(event => event.id)).toEqual(['event.toll_dispute', 'event.road_wardens', 'event.glass_rumours', 'event.seam_pilgrims', 'event.bid_fever', 'event.wagers_on_the_future', 'event.long_peace', 'event.glass_pedlar', 'event.rumours_of_the_bid', 'event.seam_lights', 'event.peace_fair', 'event.old_debts', 'event.glassblowers_guild']);
    expect(HEARTH_EVENTS.filter(event => event.sinceRules < 49).every(event => !event.epoch)).toBe(true);
    const rumours = HEARTH_EVENTS.find(event => event.id === 'event.glass_rumours')!, toll = HEARTH_EVENTS.find(event => event.id === 'event.toll_dispute')!;
    expect(hearthEventConditionHolds(state, rumours, host.id)).toBe(false);
    expect(hearthEventConditionHolds(state, toll, host.id)).toBe(false);
    state.turn = 12; // the Age of Roads, and with the seam found, the Age of Seams
    expect(hearthEventConditionHolds(state, toll, host.id)).toBe(true);
    expect(hearthEventConditionHolds(state, rumours, host.id)).toBe(true);
  });

  it('needs no field in the save: a v48 envelope loads to the same state and reads the same age', () => {
    const state = prosperityCampaign();
    state.turn = 60;
    expect(epochId(state)).toBe('epoch.seams'); // the Short pace's turns for the Ages of Roads and of Seams have both passed
    const loaded = deserializeGame(serializeGame(state));
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(epochId(loaded)).toBe('epoch.seams');
    const older = deserializeGame(serializeGameForVersion(state, 48));
    expect(stateHash(older)).toBe(stateHash(state));
    expect(epochId(older)).toBe('epoch.seams');
    expect(JSON.parse(serializeGame(older)).state.epoch).toBeUndefined();
  });
});
