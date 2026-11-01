import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { serializeGameForVersion } from './save';
import { legitimacyOf, legitimacyStanding, legitimacyUnrest, observeLegitimacy } from './legitimacy';
import { unrestPressures } from './unrest';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };

describe('rules 82: legitimacy', () => {
  it('reads a realm from its seat, its conquests, its offices and its oaths, weighs on every hearth’s unrest when weak or strong, is nothing under rules 81, and a v81 envelope loads unchanged', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions.find(item => item.id !== player)!.id;
    const town = Object.values(state.settlements).find(item => item.factionId === player)!;
    // A founded seat, no office, no oath: settled at two, and the lanes answer only their own pressures.
    expect(legitimacyOf(state, player)).toEqual({ level: 2, reasons: [`its seat, ${town.name}, is a hearth of its own founding`] });
    expect(legitimacyStanding(2)).toBe('settled');
    expect(legitimacyUnrest(state, player)).toEqual({ change: 0, pressure: null });
    expect(unrestPressures(state, town)).toEqual({ change: -1, pressures: [] });
    expect(getObservation(state, player).legitimacy).toEqual({ level: 2, standing: 'settled', reasons: [`its seat, ${town.name}, is a hearth of its own founding`], text: 'Legitimacy 2. Settled legitimacy: the lanes answer their own pressures.' });
    // An office held: strong at three, easing every hearth one more.
    state.factions.find(item => item.id === player)!.treasury = 5000;
    const before = new Set(Object.keys(state.characters));
    issue(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId: 'character.surveyor' });
    const surveyor = Object.values(state.characters).find(item => !before.has(item.id))!;
    issue(state, { type: 'holdOffice', factionId: player, officeId: 'office.keeper_of_the_roll', holderId: surveyor.id });
    expect(legitimacyOf(state, player)).toMatchObject({ level: 3 });
    expect(legitimacyOf(state, player).reasons).toContain('an office of the realm is held');
    expect(unrestPressures(state, town)).toEqual({ change: -2, pressures: ['strong legitimacy eases the lanes'] });
    expect(getObservation(state, player).legitimacy).toMatchObject({ level: 3, standing: 'strong' });
    // A patron's client loses one; the patron gains one.
    state.diplomacy.clients.push({ id: 'bond.test', patronId: rival, clientId: player, startedTurn: state.turn, expiresTurn: state.turn + 20, terms: { tributeCoin: 0, termTurns: 20 } } as GameState['diplomacy']['clients'][number]);
    expect(legitimacyOf(state, player)).toMatchObject({ level: 2 });
    expect(legitimacyOf(state, player).reasons).toContain('it answers to a patron');
    expect(legitimacyOf(state, rival)).toMatchObject({ level: 3 });
    expect(legitimacyOf(state, rival).reasons).toContain('a client answers to it');
    state.diplomacy.clients.pop();
    issue(state, { type: 'resignOffice', factionId: player, officeId: 'office.keeper_of_the_roll' });
    // A seat of another realm's founding and more conquered than founded: weak at zero, every hearth rising one more.
    town.founderFactionId = rival;
    expect(legitimacyOf(state, player)).toEqual({ level: 0, reasons: [`its seat, ${town.name}, is a hearth of another realm’s founding`, 'it holds more hearths of other realms’ founding (1) than of its own (0)'] });
    expect(unrestPressures(state, town)).toEqual({ change: 0, pressures: ['weak legitimacy'] });
    issue(state, { type: 'setTaxRate', factionId: player, rate: 'heavy' });
    expect(unrestPressures(state, town)).toEqual({ change: 4, pressures: ['heavy taxes', 'weak legitimacy'] });
    expect(getObservation(state, player).legitimacy).toMatchObject({ level: 0, standing: 'weak', text: 'Legitimacy 0. Weak legitimacy: every hearth’s unrest rises one more each turn.' });
    // The turn applies it; under rules 81 nothing of it exists.
    const sealed = serializeGame(state);
    issue(state, { type: 'endTurn', factionId: player });
    expect(state.unrest.find(item => item.settlementId === town.id)?.level).toBe(4);
    const older = deserializeGame(sealed);
    withRules(older, 81, () => {
      expect(observeLegitimacy(older, player)).toBeUndefined();
      expect(getObservation(older, player).legitimacy).toBeUndefined();
      expect(unrestPressures(older, older.settlements[town.id]!)).toEqual({ change: 3, pressures: ['heavy taxes'] });
      issue(older, { type: 'endTurn', factionId: player });
      expect(older.unrest.find(item => item.settlementId === town.id)?.level).toBe(3);
    });
    // The same round from the save is the same round; a v81 envelope loads unchanged under rules 82.
    const replayed = deserializeGame(sealed);
    issue(replayed, { type: 'endTurn', factionId: player });
    expect(stateHash(replayed)).toBe(stateHash(state));
    const v81 = serializeGameForVersion(deserializeGame(sealed), 81);
    expect(JSON.parse(v81)).toMatchObject({ version: 81, contentHash: CONTENT_HASH });
    expect(stateHash(deserializeGame(v81))).toBe(stateHash(deserializeGame(sealed)));
    expect(JSON.parse(serializeGame(deserializeGame(v81)))).toMatchObject({ version: 82 });
  });
});
