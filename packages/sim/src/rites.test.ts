import { describe, expect, it } from 'vitest';
import { checksum, STRATEGIC_RITES } from '@theandril/content';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, applyCommandForVersion, createArmyFormation, deserializeGame, getObservation, KINDLING_BURN, serializeGame, serializeGameForVersion, stateHash, type GameState } from './index';
import { rebuildIndexes } from './visibility';
import { isPassable, neighbors } from '@theandril/mapgen';

const RITE = 'rite.seam_warding', BREAKING = 'rite.ward_breaking', KINDLING = 'rite.seam_kindling', ASHGLASS = 'resource.ashglass';
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
    expect(view.rites).toHaveLength(STRATEGIC_RITES.length);
    expect(view.rites).toContainEqual({ characterId: caster.id, riteId: RITE, name: rite.name, description: rite.description, ashglassCost: 6, durationTurns: 10, settlementId: host.id, canPerform: true, blocker: null });
    expect(view.wards).toEqual([]);
    expect(view.sieges[0]).toMatchObject({ settlementId: host.id, defenses: 30 });
    expect(view.sieges[0]!.warded).toBeUndefined();
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: 'rite.unknown' })).toMatchObject({ ok: false, error: 'Unknown strategic rite.' });
    const result = applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: RITE });
    expect(result).toMatchObject({ ok: true });
    expect(result.events.map(event => event.factionId).sort()).toEqual([player, state.factions[1]!.id].sort());
    expect(state.resources.stockpiles[player]![ASHGLASS]).toBe(14);
    expect(state.wards).toEqual([{ settlementId: host.id, factionId: player, casterId: caster.id, riteId: RITE, startedTurn: state.turn, expiresTurn: state.turn + 10 }]);
    expect(getObservation(state, player).rites!.find(item => item.riteId === RITE)).toMatchObject({ canPerform: false, blocker: 'This hearth is already warded.' });
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

  /** Rules 41: the rival's own Rune caster rides with the besieging column. */
  function withBreaker(state: GameState): GameState {
    const rival = state.factions[1]!, hearth = Object.values(state.settlements).find(town => town.factionId === rival.id)!;
    rival.treasury += 200; state.resources.stockpiles[rival.id] = { ...state.resources.stockpiles[rival.id], [ASHGLASS]: 10 };
    expect(applyCommand(state, { type: 'recruitCharacter', factionId: rival.id, settlementId: hearth.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
    const breaker = Object.values(state.characters).find(item => item.factionId === rival.id && item.definitionId === 'character.waykeeper')!;
    breaker.aptitudes = { 'path.flame': 1, 'path.rune': 2 };
    breaker.location = { kind: 'army', armyId: Object.values(state.sieges)[0]!.armyId };
    state.arcaneResearch[rival.id] = [...new Set([...(state.arcaneResearch[rival.id] ?? []), 'arcane.rune_binding', 'arcane.unbinding'])];
    return deserializeGame(serializeGame(state));
  }

  it('is broken from the siege lines by a second-degree Rune caster, which jars the holder, and is refused otherwise (rules 41)', () => {
    let state = besieged(); const player = state.turnOwnerId, rival = state.factions[1]!.id;
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: casterOf(state).id, riteId: RITE })).toMatchObject({ ok: true });
    state = withBreaker(state);
    const host = hostOf(state), caster = casterOf(state), breaker = Object.values(state.characters).find(item => item.factionId === rival && item.definitionId === 'character.waykeeper')!;
    const attempt = () => applyCommand(state, { type: 'performRite', factionId: rival, characterId: breaker.id, riteId: BREAKING });
    const option = () => getObservation(state, rival).rites!.find(rite => rite.riteId === BREAKING && rite.characterId === breaker.id)!;
    expect(option()).toMatchObject({ settlementId: host.id, ashglassCost: 4, durationTurns: 0, canPerform: true, blocker: null });
    // The defender's own caster cannot break (it is lodged, not riding), and the rite is unknown to rules 40.
    expect(getObservation(state, player).rites!.find(rite => rite.riteId === BREAKING)).toMatchObject({ canPerform: false, settlementId: null });
    expect(applyCommandForVersion(state, { type: 'performRite', factionId: rival, characterId: breaker.id, riteId: BREAKING }, 40)).toMatchObject({ ok: false, error: 'Unknown strategic rite.' });
    const research = state.arcaneResearch[rival]!; state.arcaneResearch[rival] = research.filter(id => id !== 'arcane.unbinding');
    expect(attempt()).toMatchObject({ ok: false, error: 'The national arcane discovery is not researched.' });
    state.arcaneResearch[rival] = research;
    breaker.aptitudes = { 'path.rune': 1 };
    expect(attempt()).toMatchObject({ ok: false, error: 'This Waykeeper lacks the personal path for the rite.' });
    breaker.aptitudes = { 'path.flame': 1, 'path.rune': 2 };
    state.resources.stockpiles[rival]![ASHGLASS] = 3;
    expect(attempt()).toMatchObject({ ok: false, error: 'Requires 4 Ashglass in the realm stockpile.' });
    state.resources.stockpiles[rival]![ASHGLASS] = 10;
    const result = attempt();
    expect(result).toMatchObject({ ok: true });
    expect(result.events.map(event => [event.factionId, event.type])).toEqual([[rival, 'rite_performed'], [player, 'ward_ended']]);
    expect(result.events[1]!.message).toContain(`broken by ${breaker.name}`);
    expect(state.wards).toEqual([]);
    expect(state.resources.stockpiles[rival]![ASHGLASS]).toBe(6);
    expect(state.characters[caster.id]!.woundedTurns).toBe(2);
    expect(getObservation(state, rival).sieges[0]!.warded).toBeUndefined();
    // Nothing left to break; the jarred holder cannot ward again until it recovers.
    expect(attempt()).toMatchObject({ ok: false, error: 'The besieged hearth is not warded.' });
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: RITE })).toMatchObject({ ok: false, error: 'This caster must recover from wounds.' });
    endTurn(state);
    expect(state.sieges[host.id]).toMatchObject({ defenses: 20 });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // A rules-40 reading of this campaign is identical, and a v40 envelope migrates unchanged.
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 40)))).toBe(stateHash(state));
    const older = JSON.parse(serializeGameForVersion(state, 40));
    expect(older.version).toBe(40); expect(older.contentHash).toBe('ac80514d');
    expect(deserializeGame(JSON.stringify(older)).wards).toEqual([]);
  });

  it('kindles a hearth from a Flame seam so besiegers burn each turn while the walls still wear, is broken like a warding, and stays out of rules 41 (rules 42)', () => {
    let state = besieged(); const player = state.turnOwnerId, rival = state.factions[1]!.id, caster = casterOf(state), host = hostOf(state);
    caster.aptitudes = { 'path.flame': 2, 'path.rune': 1 };
    const column = state.armies[Object.values(state.sieges)[0]!.armyId]!, before = column.formations.map(formation => formation.strength);
    const option = () => getObservation(state, player).rites!.find(rite => rite.riteId === KINDLING)!;
    expect(option()).toMatchObject({ settlementId: host.id, ashglassCost: 6, durationTurns: 10, canPerform: true, blocker: null });
    expect(applyCommandForVersion(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: KINDLING }, 41)).toMatchObject({ ok: false, error: 'Unknown strategic rite.' });
    const research = state.arcaneResearch[player]!; state.arcaneResearch[player] = research.filter(id => id !== 'arcane.ember_projection');
    expect(option()).toMatchObject({ canPerform: false, blocker: 'The national arcane discovery is not researched.' });
    state.arcaneResearch[player] = research;
    const result = applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: KINDLING });
    expect(result).toMatchObject({ ok: true });
    expect(state.wards).toEqual([{ settlementId: host.id, factionId: player, casterId: caster.id, riteId: KINDLING, startedTurn: 1, expiresTurn: 11 }]);
    expect(state.resources.stockpiles[player]![ASHGLASS]).toBe(14);
    expect(getObservation(state, player).rites!.find(rite => rite.riteId === RITE)).toMatchObject({ canPerform: false, blocker: 'This hearth is already warded.' });
    expect(getObservation(state, rival).sieges[0]).toMatchObject({ kindled: true });
    expect(getObservation(state, rival).sieges[0]!.warded).toBeUndefined();
    // The works still wear the walls; the column burns, never below a fifth of its ranks.
    const turn = (): string[] => { const messages: string[] = []; const at = state.turn; while (state.turn === at) { const r = applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }); expect(r).toMatchObject({ ok: true }); messages.push(...r.events.filter(e => e.type === 'siege_burned').map(e => `${e.factionId}:${e.message}`)); } return messages; };
    const burned = turn();
    expect(state.sieges[host.id]).toMatchObject({ defenses: 20 });
    expect(column.formations.map(formation => formation.strength)).toEqual(before.map(strength => strength - KINDLING_BURN));
    expect(burned.map(line => line.split(':')[0]).sort()).toEqual([player, rival].sort());
    expect(burned[0]).toContain(`lost ${KINDLING_BURN * before.length} strength`);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // Ten turns of burning, then the term lapses and the column stops losing ranks.
    for (let i = 0; i < 20; i++) turn();
    expect(state.wards).toEqual([]);
    expect(column.formations.every(formation => formation.strength === before[0]! - 10 * KINDLING_BURN)).toBe(true);
    // A kindling is a ward: the rival's riding Rune caster breaks it.
    state.wards = []; state.resources.stockpiles[player]![ASHGLASS] = 20; caster.woundedTurns = 0;
    expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: KINDLING })).toMatchObject({ ok: true });
    state = withBreaker(state);
    const breaker = Object.values(state.characters).find(item => item.factionId === rival && item.definitionId === 'character.waykeeper')!;
    expect(applyCommand(state, { type: 'performRite', factionId: rival, characterId: breaker.id, riteId: BREAKING })).toMatchObject({ ok: true });
    expect(state.wards).toEqual([]);
    // A rules-41 reading is identical and a v41 envelope migrates unchanged.
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 41)))).toBe(stateHash(state));
    const older = JSON.parse(serializeGameForVersion(state, 41));
    expect(older.version).toBe(41); expect(older.contentHash).toBe('78df970c');
    expect(stateHash(deserializeGame(JSON.stringify(older)))).toBe(stateHash(state));
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
