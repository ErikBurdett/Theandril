import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, settlementYields, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_EVENTS_V_CONTENT_HASH, serializeGameForVersion } from './save';
import { TAX_COIN_PERCENT, taxBlocker, taxedCoin, taxRateOf, validateTaxes } from './taxes';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** Plays every realm's turn once. */
const endTurn = (state: GameState) => { const turn = state.turn; while (state.turn === turn) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true }); };

describe('rules 70: taxes', () => {
  it('takes three quarters, all or a quarter more of every hearth’s coin, mends or wears the lanes each turn, is observed and set once, and is validated', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    const town = Object.values(state.settlements).find(item => item.factionId === player)!;
    const steady = settlementYields(state, town);
    expect(taxRateOf(state, player)).toBe('steady');
    expect(getObservation(state, player).tax).toMatchObject({ rate: 'steady', coinPercent: 100, devastationDrift: 0 });
    expect(taxBlocker(state, player, 'steady')).toContain('already');
    expect(taxBlocker(state, state.factions.find(item => item.id !== player)!.id, 'heavy')).toBeNull();
    const heavy = issue(state, { type: 'setTaxRate', factionId: player, rate: 'heavy' });
    expect(heavy.events[0]).toMatchObject({ type: 'taxes_set', factionId: player });
    expect(heavy.events[0]!.message).toContain('sets heavy taxes');
    expect(state.taxes).toEqual([{ factionId: player, rate: 'heavy' }]);
    expect(settlementYields(state, town).coin).toBe(Math.floor(steady.coin * TAX_COIN_PERCENT.heavy / 100));
    expect(settlementYields(state, town).food).toBe(steady.food);
    expect(taxedCoin(state, player, 100)).toBe(125);
    expect(getObservation(state, player).tax).toMatchObject({ rate: 'heavy', coinPercent: 125, devastationDrift: 2 });
    expect(getObservation(state, state.factions.find(item => item.id !== player)!.id).tax).toMatchObject({ rate: 'steady' });
    // Heavy taxes wear the lanes: a hearth mending five a turn now mends three.
    town.devastation = 20;
    const coinBefore = state.factions.find(item => item.id === player)!.treasury;
    endTurn(state);
    expect(town.devastation).toBe(17);
    expect(state.factions.find(item => item.id === player)!.treasury).toBeGreaterThan(coinBefore - 1000);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // Lean taxes mend them faster and take less.
    issue(state, { type: 'setTaxRate', factionId: player, rate: 'lean' });
    expect(state.taxes).toEqual([{ factionId: player, rate: 'lean' }]);
    const untaxed = withRules(state, 69, () => settlementYields(state, town).coin);
    expect(settlementYields(state, town).coin).toBe(Math.floor(untaxed * TAX_COIN_PERCENT.lean / 100));
    endTurn(state);
    expect(town.devastation).toBe(10);
    // Steady again clears the record; a city-state keeps steady taxes; validation refuses disorder.
    issue(state, { type: 'setTaxRate', factionId: player, rate: 'steady' });
    expect(state.taxes).toEqual([]);
    expect(() => validateTaxes(state)).not.toThrow();
    const broken = structuredClone(state); broken.taxes = [{ factionId: 'faction.nowhere', rate: 'heavy' }];
    expect(() => validateTaxes(broken)).toThrow('unknown realm');
  });

  it('is nothing under rules 69, cannot be sealed under them once set, and a v69 envelope loads with steady taxes', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    withRules(state, 69, () => {
      expect(applyCommand(state, { type: 'setTaxRate', factionId: player, rate: 'heavy' }).error).toContain('not part of these rules');
      expect(getObservation(state, player).tax).toBeUndefined();
      expect(taxedCoin(state, player, 100)).toBe(100);
    });
    const sealed = serializeGameForVersion(state, 69);
    expect(JSON.parse(sealed)).toMatchObject({ version: 69, contentHash: PRE_EVENTS_V_CONTENT_HASH });
    expect(JSON.parse(sealed).state.taxes).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.taxes).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 77, contentHash: CONTENT_HASH });
    issue(state, { type: 'setTaxRate', factionId: player, rate: 'heavy' });
    expect(() => serializeGameForVersion(state, 69)).toThrow('taxes unavailable');
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
  });
});
