import { describe, expect, it } from 'vitest';
import { checksum, STRATEGIC_RITES } from '@theandril/content';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, applyCommandForVersion, createArmyFormation, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, type GameState } from './index';
import { rebuildIndexes } from './visibility';
import { isPassable, neighbors } from '@theandril/mapgen';

const RITE = 'rite.seam_warding', ASHGLASS = 'resource.ashglass';
const casterOf = (state: GameState) => Object.values(state.characters).find(character => character.factionId === state.turnOwnerId && character.definitionId === 'character.waykeeper')!;
const hostOf = (state: GameState) => Object.values(state.settlements).find(town => town.factionId === state.turnOwnerId)!;
/** The brink fixture with ashglass drawn and a rival column camped at the host's gate. */
function besieged(): GameState {
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id, host = hostOf(state);
  state.resources.stockpiles[player]![ASHGLASS] = 20;
  const gate = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: rival, name: 'Reed column', cell: gate, movement: 3, formations: [createArmyFormation(id, 'unit.guard'), createArmyFormation(`army.${state.nextId++}`, 'unit.guard')] };
  rebuildIndexes(state); refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: id, settlementId: host.id })).toMatchObject({ ok: true });
  return deserializeGame(serializeGame(state));
}
/** Plays every realm's turn once. */
const endTurn = (state: GameState) => { const turn = state.turn; while (state.turn === turn) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true }); };

describe('seam warding (rules 40)', () => {
  it('is offered only to a lodged, gifted caster at a hearth holding the seam, costs ashglass, and holds the walls through a siege', () => {
    const state = besieged(), player = state.turnOwnerId, caster = casterOf(state), host = hostOf(state);
    const rite = STRATEGIC_RITES.find(item => item.id === RITE)!;
    const view = getObservation(state, player);
    expect(view.rites).toEqual([{ characterId: caster.id, riteId: RITE, name: rite.name, description: rite.description, ashglassCost: 6, durationTurns: 10, settlementId: host.id, canPerform: true, blocker: null }]);
    expect(view.wards).toEqual([]);
    expect(view.sieges[0]).toMatchObject({ settlementId: host.id, defenses: 30 });
    expect(view.sieges[0]!.warded).toBeUndefined();
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: 'rite.unknown' })).toMatchObject({ ok: false, error: 'Unknown strategic rite.' });
    const result = applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: RITE });
    expect(result).toMatchObject({ ok: true });
    expect(result.events.map(event => event.factionId).sort()).toEqual([player, state.factions[1]!.id].sort());
    expect(state.resources.stockpiles[player]![ASHGLASS]).toBe(14);
    expect(state.wards).toEqual([{ settlementId: host.id, factionId: player, casterId: caster.id, riteId: RITE, startedTurn: state.turn, expiresTurn: state.turn + 10 }]);
    expect(getObservation(state, player).rites![0]).toMatchObject({ canPerform: false, blocker: 'This hearth is already warded.' });
    expect(getObservation(state, state.factions[1]!.id).sieges[0]).toMatchObject({ warded: true });
    expect(getObservation(state, state.factions[1]!.id).wards).toEqual([]);
    for (let turn = 0; turn < 3; turn++) endTurn(state);
    expect(state.sieges[host.id]).toMatchObject({ defenses: 30 });
    expect(getObservation(state, player).wards![0]).toMatchObject({ settlementName: host.name, riteName: rite.name, remainingTurns: 7 });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // Ten turns of works are held; a ward with no turns remaining lapses before the next works.
    for (let turn = 0; turn < 7; turn++) endTurn(state);
    expect(state.sieges[host.id]).toMatchObject({ defenses: 30 });
    expect(getObservation(state, player).wards![0]).toMatchObject({ remainingTurns: 0 });
    endTurn(state);
    expect(state.wards).toEqual([]);
    expect(state.sieges[host.id]?.defenses ?? 0).toBeLessThan(30);
  });

  it('ends when its caster leaves the hearth or the seam is lost, and without a ward the works wear the walls down', () => {
    const state = besieged(), player = state.turnOwnerId, caster = casterOf(state), host = hostOf(state);
    endTurn(state);
    expect(state.sieges[host.id]).toMatchObject({ defenses: 20 });
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: RITE })).toMatchObject({ ok: true });
    endTurn(state);
    expect(state.sieges[host.id]).toMatchObject({ defenses: 20 });
    // The caster rides out: the next turn dissolves the ward before the walls are tested.
    const army = Object.values(state.armies).find(item => item.factionId === player && item.cell === host.cell) ?? (() => { const first = Object.values(state.armies).find(item => item.factionId === player)!; first.cell = host.cell; rebuildIndexes(state); refreshAuthoredSight(state); return first; })();
    expect(applyCommand(state, { type: 'assignCharacter', factionId: player, characterId: caster.id, armyId: army.id })).toMatchObject({ ok: true });
    const events: string[] = [];
    while (!events.length) { const result = applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }); expect(result).toMatchObject({ ok: true }); events.push(...result.events.filter(event => event.type === 'ward_ended').map(event => event.message)); }
    expect(events[0]).toContain('no longer stands lodged');
    while (state.turnOwnerId !== player) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true });
    expect(state.wards).toEqual([]);
    expect(state.sieges[host.id]).toMatchObject({ defenses: 10 });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('refuses the unresearched, the ungifted, the unlodged, the unheld and the unpaid, and stays out of older rules', () => {
    const state = besieged(), player = state.turnOwnerId, caster = casterOf(state), host = hostOf(state);
    const attempt = () => applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: RITE });
    state.resources.stockpiles[player]![ASHGLASS] = 5;
    expect(attempt()).toMatchObject({ ok: false, error: 'Requires 6 Ashglass in the realm stockpile.' });
    state.resources.stockpiles[player]![ASHGLASS] = 20;
    const research = state.arcaneResearch[player]!;
    state.arcaneResearch[player] = research.filter(id => id !== 'arcane.rune_binding');
    expect(attempt()).toMatchObject({ ok: false, error: 'The national arcane discovery is not researched.' });
    state.arcaneResearch[player] = research;
    const aptitudes = caster.aptitudes!; caster.aptitudes = { 'path.flame': 2 };
    expect(attempt()).toMatchObject({ ok: false, error: 'This Waykeeper lacks the personal path for the rite.' });
    caster.aptitudes = aptitudes;
    caster.woundedTurns = 1;
    expect(attempt()).toMatchObject({ ok: false, error: 'This caster must recover from wounds.' });
    caster.woundedTurns = 0;
    const land = state.land.settlements[host.id]!, rune = getObservation(state, player).arcaneSites.find(site => site.pathId === 'path.rune')!;
    const claimed = land.claimed; land.claimed = claimed.filter(cell => cell !== rune.cell);
    expect(attempt()).toMatchObject({ ok: false, error: 'This hearth’s borders hold no surveyed seam of the rite’s path.' });
    land.claimed = claimed;
    // A rules-39 reading of the unwarded brink is identical; a ward cannot enter it.
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 39)))).toBe(stateHash(state));
    expect(applyCommandForVersion(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: RITE }, 39)).toMatchObject({ ok: false, error: expect.stringContaining('Malformed command') });
    expect(attempt()).toMatchObject({ ok: true });
    expect(() => serializeGameForVersion(state, 39)).toThrow('warded');
    expect(() => applyCommandForVersion(state, { type: 'endTurn', factionId: player }, 39)).toThrow('warded');
    // A rules-39 envelope migrates with no wards.
    const older = JSON.parse(serializeGameForVersion(besieged(), 39));
    expect(older.version).toBe(39); expect(older.contentHash).toBe('03ac0328'); expect(older.state.wards).toBeUndefined();
    const migrated = deserializeGame(JSON.stringify(older));
    expect(migrated.wards).toEqual([]);
    expect(stateHash(migrated)).toBe(stateHash(besieged()));
    void checksum;
  });
});
