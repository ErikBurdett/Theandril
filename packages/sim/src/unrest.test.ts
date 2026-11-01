import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, settlementYields, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_EVENTS_V_CONTENT_HASH, serializeGameForVersion } from './save';
import { advanceUnrest, restorationOf, RIOT_DEVASTATION, UNREST_HALVING, UNREST_RIOT, unrestOf, unrestPressures, validateUnrest } from './unrest';
import { CONQUEST_FIXTURE, subjectCampaign } from '../../test-fixtures/src/conquest-fixture';
import { indexes } from './visibility';
import { isPassable, neighbors } from '@theandril/mapgen';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** Plays every realm's turn once. */
const endTurn = (state: GameState) => { const turn = state.turn; while (state.turn === turn) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true }); };

describe('rules 71: unrest in the hearths', () => {
  it('rises under heavy taxes, occupation and deep scars, falls otherwise and faster under lean taxes, halves the industry at fifty, riots at a hundred, and is observed with its pressures', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    const town = Object.values(state.settlements).find(item => item.factionId === player)!;
    expect(unrestOf(state, town.id)).toBe(0);
    expect(unrestPressures(state, town)).toEqual({ change: -1, pressures: [] });
    issue(state, { type: 'setTaxRate', factionId: player, rate: 'heavy' });
    expect(unrestPressures(state, town)).toEqual({ change: 3, pressures: ['heavy taxes'] });
    town.occupationTurns = 2; town.devastation = 60;
    expect(unrestPressures(state, town)).toEqual({ change: 6, pressures: ['heavy taxes', 'occupation', 'devastation'] });
    endTurn(state);
    expect(unrestOf(state, town.id)).toBe(6);
    expect(state.unrest).toEqual([{ settlementId: town.id, level: 6 }]);
    expect(getObservation(state, player).unrest).toContainEqual({ settlementId: town.id, level: 6, pressures: ['heavy taxes', 'occupation', 'devastation'], halved: false });
    expect(getObservation(state, state.factions.find(item => item.id !== player)!.id).unrest!.every(item => item.settlementId !== town.id)).toBe(true);
    // At fifty the industry is halved.
    const whole = settlementYields(state, town).industry;
    state.unrest = [{ settlementId: town.id, level: UNREST_HALVING }];
    expect(settlementYields(state, town).industry).toBe(Math.floor(whole / 2));
    expect(getObservation(state, player).unrest!.find(item => item.settlementId === town.id)!.halved).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // At a hundred the hearth riots: a household leaves, the lanes take ten, the unrest falls to fifty.
    state.unrest = [{ settlementId: town.id, level: UNREST_RIOT - 1 }];
    town.population = 4; town.devastation = 20; town.occupationTurns = 0;
    const events: Parameters<typeof advanceUnrest>[2] = [];
    advanceUnrest(state, town, events);
    expect(events[0]).toMatchObject({ type: 'riot', factionId: player, cell: town.cell });
    expect(events[0]!.message).toContain(`${town.name} riots: a household leaves, the lanes take ${RIOT_DEVASTATION} devastation`);
    expect(town.population).toBe(3);
    expect(town.devastation).toBe(30);
    expect(unrestOf(state, town.id)).toBe(UNREST_HALVING);
    // Lean taxes ease the lanes three a turn; the record clears at zero; a besieged hearth stands still.
    issue(state, { type: 'setTaxRate', factionId: player, rate: 'lean' });
    expect(unrestPressures(state, town)).toEqual({ change: -3, pressures: ['lean taxes ease the lanes'] });
    state.unrest = [{ settlementId: town.id, level: 2 }];
    advanceUnrest(state, town, []);
    expect(state.unrest).toEqual([]);
    state.unrest = [{ settlementId: town.id, level: 9 }];
    state.sieges[town.id] = { settlementId: town.id, armyId: 'army.999', factionId: state.factions.find(item => item.id !== player)!.id, defenses: 30, startedTurn: state.turn } as GameState['sieges'][string];
    advanceUnrest(state, town, []);
    expect(unrestOf(state, town.id)).toBe(9);
    delete state.sieges[town.id];
    expect(() => validateUnrest(state)).not.toThrow();
    const broken = structuredClone(state); broken.unrest = [{ settlementId: 'settlement.999', level: 5 }];
    expect(() => validateUnrest(broken)).toThrow('unknown hearth');
  });

  it('is nothing under rules 70, cannot be sealed under them once it stands, and a v70 envelope loads with none', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    const town = Object.values(state.settlements).find(item => item.factionId === player)!;
    withRules(state, 70, () => {
      issue(state, { type: 'setTaxRate', factionId: player, rate: 'heavy' });
      advanceUnrest(state, town, []);
      expect(state.unrest).toEqual([]);
      expect(unrestOf(state, town.id)).toBe(0);
      expect(getObservation(state, player).unrest).toBeUndefined();
      issue(state, { type: 'setTaxRate', factionId: player, rate: 'steady' });
    });
    const sealed = serializeGameForVersion(state, 70);
    expect(JSON.parse(sealed)).toMatchObject({ version: 70, contentHash: PRE_EVENTS_V_CONTENT_HASH });
    expect(JSON.parse(sealed).state.unrest).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.unrest).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 80, contentHash: CONTENT_HASH });
    state.unrest = [{ settlementId: town.id, level: 3 }];
    expect(() => serializeGameForVersion(state, 70)).toThrow('unrest unavailable');
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
  });

  it('rules 80: a conquered hearth with no garrison returns to its founder instead of rioting, a garrison, the capital or a fallen founder holds it, and rules 79 riots as before', () => {
    const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId, townId = CONQUEST_FIXTURE.settlementId, armyId = CONQUEST_FIXTURE.playerArmyId;
    let state = subjectCampaign();
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'besiege', factionId: player, armyId, settlementId: townId });
    for (let turn = 0; turn < 3; turn++) issue(state, { type: 'endTurn', factionId: player });
    issue(state, { type: 'assault', factionId: player, settlementId: townId }); issue(state, { type: 'autoResolveBattle', factionId: player });
    issue(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'occupy' });
    const town = state.settlements[townId]!;
    expect(town).toMatchObject({ factionId: player, founderFactionId: rival });
    // The garrison holds the hearth: it riots as any hearth does and stays the holder's.
    state.unrest = [{ settlementId: townId, level: UNREST_RIOT - 1 }];
    expect(restorationOf(state, town)).toBeNull();
    expect(getObservation(state, player).unrest!.find(item => item.settlementId === townId)).toMatchObject({ rising: 'Reedbound Council', garrisoned: true });
    const events: Parameters<typeof advanceUnrest>[2] = [];
    advanceUnrest(state, town, events);
    expect(events[0]).toMatchObject({ type: 'riot', factionId: player });
    expect(town.factionId).toBe(player);
    // The garrison marches out; the holder's hearth is read as one that may rise for its founder.
    issue(state, { type: 'endTurn', factionId: player });
    const away = neighbors(town.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !indexes(state).settlements.get(cell))!;
    issue(state, { type: 'moveTo', factionId: player, armyId, target: away });
    expect(indexes(state).armies.get(town.cell)?.size ?? 0).toBe(0);
    expect(restorationOf(state, town)?.id).toBe(rival);
    expect(getObservation(state, player).unrest!.find(item => item.settlementId === townId)).toMatchObject({ rising: 'Reedbound Council', garrisoned: false });
    expect(getObservation(state, rival).unrest!.every(item => item.settlementId !== townId)).toBe(true);
    // The holder's capital never rises, and a founder with no hearth left has nothing to rise for.
    const capital = state.land.capitals[player] ?? null; state.land.capitals[player] = townId;
    expect(restorationOf(state, town)).toBeNull(); state.land.capitals[player] = capital;
    withRules(state, 79, () => expect(restorationOf(state, town)).toBeNull());
    const reedfold = Object.values(state.settlements).find(item => item.factionId === rival)!;
    reedfold.factionId = player; expect(restorationOf(state, town)).toBeNull(); reedfold.factionId = rival;
    // At a hundred the hearth returns to its founder with its people, buildings and land; the occupation ends, the lanes take ten and the unrest clears.
    state.unrest = [{ settlementId: townId, level: UNREST_RIOT - 1 }];
    const population = town.population, buildings = [...town.buildings], devastation = town.devastation, name = town.name;
    const sealed = serializeGame(state);
    const round = issue(state, { type: 'endTurn', factionId: player });
    const restorations = round.events.filter(item => item.type === 'restoration');
    expect(restorations.map(item => item.factionId).sort()).toEqual([player, rival].sort());
    expect(restorations[0]!.message).toContain(`${name} rises for Reedbound Council`);
    expect(round.events.some(item => item.type === 'riot')).toBe(false);
    expect(town).toMatchObject({ factionId: rival, founderFactionId: rival, buildings, devastation: Math.max(0, devastation - 5) + RIOT_DEVASTATION, occupationTurns: 0, queue: [] });
    expect(town.population).toBeGreaterThanOrEqual(population);
    expect(state.unrest).toEqual([]);
    expect(state.land.settlements[townId]).toBeDefined();
    expect(getObservation(state, rival).settlements.find(item => item.id === townId)).toMatchObject({ factionId: rival, food: town.food });
    expect(getObservation(state, player).settlements.find(item => item.id === townId)).toMatchObject({ factionId: rival, food: 0 });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // The same turn from a save is the same turn; under rules 79 the hearth riots and stays.
    const replayed = deserializeGame(sealed);
    issue(replayed, { type: 'endTurn', factionId: player });
    expect(stateHash(replayed)).toBe(stateHash(state));
    const older = deserializeGame(sealed);
    withRules(older, 79, () => { const olderRound = issue(older, { type: 'endTurn', factionId: player }); expect(olderRound.events.some(item => item.type === 'riot')).toBe(true); expect(olderRound.events.some(item => item.type === 'restoration')).toBe(false); expect(older.settlements[townId]!.factionId).toBe(player); });
    // A v79 envelope loads unchanged under rules 80.
    state = deserializeGame(sealed);
    const v79 = serializeGameForVersion(state, 79);
    expect(JSON.parse(v79)).toMatchObject({ version: 79, contentHash: CONTENT_HASH });
    expect(stateHash(deserializeGame(v79))).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(deserializeGame(v79)))).toMatchObject({ version: 80 });
  });
});
