import { describe, expect, it } from 'vitest';
import { patronageCampaign } from '../../test-fixtures/src/victory-fixture';
import { applyCommand, applyCommandForVersion, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, CHARTER_FOCI, CHARTER_CEILING_MIN, type GameState } from './index';
import { rebuildIndexes } from './visibility';

const spare = (state: GameState, factionId: string) => Object.values(state.settlements).filter(town => town.factionId === factionId && town.id !== state.land.capitals[factionId]).sort((a, b) => a.id < b.id ? -1 : 1)[0]!;
const landOf = (state: GameState, factionId: string, settlementId: string) => getObservation(state, factionId, { landDetails: { offset: 0, limit: 64 } }).land.settlements.find(town => town.settlementId === settlementId);

describe('cession between patron and client (rules 39)', () => {
  it('passes a hearth to the client with its people, buildings and land, ends standing orders and survives save and replay', () => {
    const state = patronageCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    const town = spare(state, player);
    expect(applyCommand(state, { type: 'setCharter', factionId: player, settlementId: town.id, focus: CHARTER_FOCI[0]!, ceiling: CHARTER_CEILING_MIN })).toMatchObject({ ok: true });
    expect(applyCommand(state, { type: 'queue', factionId: player, settlementId: town.id, itemId: 'building.granary' })).toMatchObject({ ok: true });
    const options = landOf(state, player, town.id)!.cession!;
    expect(options).toEqual([{ factionId: rival, name: state.factions[1]!.name, relation: 'client', blocker: null }]);
    const claimed = state.land.settlements[town.id]!.claimed.length, population = town.population, buildings = [...town.buildings];
    const before = state.factions.map(faction => faction.treasury);
    const result = applyCommand(state, { type: 'cedeSettlement', factionId: player, settlementId: town.id, recipientFactionId: rival });
    expect(result).toMatchObject({ ok: true });
    expect(result.events.map(event => event.type)).toEqual(expect.arrayContaining(['settlement_ceded', 'charter_lost']));
    expect(state.settlements[town.id]).toMatchObject({ factionId: rival, population, buildings, queue: [], occupationTurns: 0 });
    expect(state.land.settlements[town.id]!.claimed).toHaveLength(claimed);
    expect(state.charters.some(charter => charter.settlementId === town.id)).toBe(false);
    expect(state.factions.map(faction => faction.treasury)).toEqual(before);
    expect(state.land.capitals[player]).not.toBe(town.id);
    expect(state.diplomacy.clients).toHaveLength(1);
    // The new owner sees and rules the hearth; the giver no longer lists it.
    expect(landOf(state, rival, town.id)).toBeDefined();
    expect(getObservation(state, player).settlements.find(item => item.id === town.id)?.factionId).toBe(rival);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // The client may pass a hearth back to its patron the same way.
    const back = spare(state, rival);
    expect(landOf(state, rival, back.id)!.cession).toEqual([{ factionId: player, name: state.factions[0]!.name, relation: 'patron', blocker: null }]);
    expect(applyCommand(state, { type: 'cedeSettlement', factionId: rival, settlementId: back.id, recipientFactionId: player })).toMatchObject({ ok: true });
    expect(state.settlements[back.id]!.factionId).toBe(player);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('refuses the capital, unbound realms, occupied or besieged hearths, lodged officers and standing armies, and is absent from older rules', () => {
    const state = patronageCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    const capital = state.land.capitals[player]!, town = spare(state, player);
    expect(landOf(state, player, capital)!.cession).toEqual([{ factionId: rival, name: state.factions[1]!.name, relation: 'client', blocker: 'A realm keeps its capital.' }]);
    expect(applyCommand(state, { type: 'cedeSettlement', factionId: player, settlementId: capital, recipientFactionId: rival })).toMatchObject({ ok: false, error: 'A realm keeps its capital.' });
    expect(applyCommand(state, { type: 'cedeSettlement', factionId: player, settlementId: town.id, recipientFactionId: 'faction.nobody' })).toMatchObject({ ok: false, error: 'Choose a realm bound to you by an oath.' });
    expect(applyCommand(state, { type: 'cedeSettlement', factionId: rival, settlementId: town.id, recipientFactionId: player })).toMatchObject({ ok: false, error: 'You do not control that settlement.' });
    const army = Object.values(state.armies).find(item => item.factionId === player)!;
    const original = army.cell; army.cell = town.cell; rebuildIndexes(state);
    expect(applyCommand(state, { type: 'cedeSettlement', factionId: player, settlementId: town.id, recipientFactionId: rival })).toMatchObject({ ok: false, error: 'Armies must leave the hearth before it changes hands.' });
    army.cell = original; rebuildIndexes(state);
    expect(applyCommand(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId: 'character.surveyor' })).toMatchObject({ ok: true });
    expect(landOf(state, player, town.id)!.cession![0]!.blocker).toBe('Officers lodged in the hearth must leave first.');
    state.settlements[town.id]!.occupationTurns = 2;
    expect(applyCommand(state, { type: 'cedeSettlement', factionId: player, settlementId: town.id, recipientFactionId: rival })).toMatchObject({ ok: false, error: 'An occupied hearth cannot change hands.' });
    state.settlements[town.id]!.occupationTurns = 0;
    // Without any oath the option is not even listed.
    const unbound = patronageCampaign();
    expect(applyCommand(unbound, { type: 'releaseClient', factionId: unbound.turnOwnerId, clientId: unbound.factions[1]!.id })).toMatchObject({ ok: true });
    expect(landOf(unbound, unbound.turnOwnerId, spare(unbound, unbound.turnOwnerId).id)!.cession).toBeUndefined();
    expect(applyCommand(unbound, { type: 'cedeSettlement', factionId: unbound.turnOwnerId, settlementId: spare(unbound, unbound.turnOwnerId).id, recipientFactionId: unbound.factions[1]!.id })).toMatchObject({ ok: false, error: 'A hearth passes only between a patron and its client.' });
    // Historical rules never accept the command; a bonded world itself projects unchanged.
    expect(applyCommandForVersion(unbound, { type: 'cedeSettlement', factionId: unbound.turnOwnerId, settlementId: spare(unbound, unbound.turnOwnerId).id, recipientFactionId: unbound.factions[1]!.id }, 38)).toMatchObject({ ok: false, error: expect.stringContaining('Malformed command') });
    expect(stateHash(deserializeGame(serializeGameForVersion(unbound, 38)))).toBe(stateHash(unbound));
  });
});
