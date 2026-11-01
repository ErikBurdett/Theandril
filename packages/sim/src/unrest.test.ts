import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, settlementYields, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_EVENTS_V_CONTENT_HASH, serializeGameForVersion } from './save';
import { advanceUnrest, RIOT_DEVASTATION, UNREST_HALVING, UNREST_RIOT, unrestOf, unrestPressures, validateUnrest } from './unrest';

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
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 79, contentHash: CONTENT_HASH });
    state.unrest = [{ settlementId: town.id, level: 3 }];
    expect(() => serializeGameForVersion(state, 70)).toThrow('unrest unavailable');
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
  });
});
