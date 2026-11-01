import { describe, expect, it } from 'vitest';
import { CONTENT_HASH, OFFICES, officeDefinition } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, settlementYields, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_OFFICES_CONTENT_HASH, serializeGameForVersion } from './save';
import { captureSettlementCharacters } from './characters';
import { heldOffice, holdBlocker, officeYields, validateOffices } from './offices';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** The fixture's player realm with a surveyor and an engineer sitting in its hearth. */
const realm = () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const faction = state.factions.find(item => item.id === player)!; faction.treasury = 5000;
  const town = Object.values(state.settlements).find(item => item.factionId === player)!;
  const appoint = (definitionId: string) => { const before = new Set(Object.keys(state.characters)); issue(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId }); return Object.values(state.characters).find(item => !before.has(item.id))!; };
  const surveyor = appoint('character.surveyor'), engineer = appoint('character.engineer');
  return { state, player, faction, town, surveyor, engineer, appoint };
};
const roll = 'office.keeper_of_the_roll', works = 'office.master_of_works';

describe('rules 65: offices of the realm', () => {
  it('seats a character of the office’s role in the hearth they sit in, pays the hearth while they hold it, keeps them from the road, and is resigned or vacated by death', () => {
    const { state, player, town, surveyor, engineer } = realm();
    const office = officeDefinition(roll)!;
    expect(holdBlocker(state, player, works, surveyor.id)).toContain('of the engineer role');
    expect(holdBlocker(state, player, 'office.nowhere', surveyor.id)).toContain('office of the realm');
    const before = settlementYields(state, town);
    const held = issue(state, { type: 'holdOffice', factionId: player, officeId: roll, holderId: surveyor.id });
    expect(held.events[0]).toMatchObject({ type: 'office_held', factionId: player, cell: town.cell });
    expect(held.events[0]!.message).toContain(`${surveyor.name} takes office as ${office.name} at ${town.name}: +2 coin`);
    expect(state.offices).toEqual([{ id: `${roll}.${player}`, officeId: roll, factionId: player, characterId: surveyor.id, sinceTurn: state.turn }]);
    expect(heldOffice(state, surveyor.id)).toMatchObject({ officeId: roll });
    expect(officeYields(state, town.id)).toEqual({ food: 0, industry: 0, coin: 2, knowledge: 0 });
    const after = settlementYields(state, town);
    expect(after.coin).toBeGreaterThan(before.coin);
    expect(after.food).toBe(before.food);
    const observed = getObservation(state, player).offices!;
    expect(observed).toHaveLength(OFFICES.length);
    expect(observed.find(item => item.officeId === roll)).toMatchObject({ name: office.name, role: 'surveyor', yields: office.yields, holderCharacterId: surveyor.id, holderName: surveyor.name, settlementId: town.id, settlementName: town.name, sinceTurn: state.turn });
    expect(observed.find(item => item.officeId === works)).toMatchObject({ holderCharacterId: null, holderName: null, settlementId: null });
    expect(getObservation(state, state.factions.find(item => item.id !== player)!.id).offices!.every(item => item.holderCharacterId === null)).toBe(true);
    // Once each; one office per character; the road waits.
    const second = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.surveyor' && item.id !== surveyor.id) ?? (() => { const r = applyCommand(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId: 'character.surveyor' }); expect(r.ok).toBe(true); return Object.values(state.characters).find(item => item.definitionId === 'character.surveyor' && item.id !== surveyor.id && item.factionId === player)!; })();
    expect(applyCommand(state, { type: 'holdOffice', factionId: player, officeId: roll, holderId: second.id }).error).toContain('Someone holds that office already');
    expect(holdBlocker(state, player, works, engineer.id)).toBeNull();
    const view = getObservation(state, player).characters.find(item => item.id === surveyor.id)!;
    for (const option of view.assignmentOptions) { expect(option.canAssign).toBe(false); expect(option.blocker).toContain('resign it before riding'); }
    const army = Object.values(state.armies).find(item => item.factionId === player && item.cell === town.cell);
    if (army) expect(applyCommand(state, { type: 'assignCharacter', factionId: player, characterId: surveyor.id, armyId: army.id }).error).toContain('holds an office');
    expect(() => validateOffices(state)).not.toThrow();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // Resigned: vacant, the hearth paid no more.
    const resigned = issue(state, { type: 'resignOffice', factionId: player, officeId: roll });
    expect(resigned.events[0]).toMatchObject({ type: 'office_resigned' });
    expect(resigned.events[0]!.message).toContain(`${surveyor.name} resigns as ${office.name}`);
    expect(state.offices).toEqual([]);
    expect(applyCommand(state, { type: 'resignOffice', factionId: player, officeId: roll }).error).toContain('Nobody holds');
    expect(settlementYields(state, town)).toEqual(before);
    // Death vacates.
    issue(state, { type: 'holdOffice', factionId: player, officeId: works, holderId: engineer.id });
    const events: Parameters<typeof captureSettlementCharacters>[2] = [];
    captureSettlementCharacters(state, town.id, events);
    expect(state.characters[engineer.id]!.dead).toBe(true);
    expect(state.offices).toEqual([]);
    expect(events.find(event => event.type === 'office_vacated')!.message).toContain(`${officeDefinition(works)!.name} is vacant: ${engineer.name} held it`);
    expect(holdBlocker(state, player, works, engineer.id)).toContain('dead');
    // A record held by someone who could not hold it is an invalid save.
    const broken = structuredClone(state);
    broken.offices = [{ id: `${works}.${player}`, officeId: works, factionId: player, characterId: engineer.id, sinceTurn: state.turn }];
    expect(() => validateOffices(broken)).toThrow('nobody who could hold it');
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
  });

  it('is nothing under rules 64, cannot be sealed under them once held, and a v64 envelope loads with none', () => {
    const { state, player, town, surveyor } = realm();
    withRules(state, 64, () => {
      expect(applyCommand(state, { type: 'holdOffice', factionId: player, officeId: roll, holderId: surveyor.id }).error).toContain('not part of these rules');
      expect(getObservation(state, player).offices).toBeUndefined();
      expect(officeYields(state, town.id)).toEqual({ food: 0, industry: 0, coin: 0, knowledge: 0 });
      expect(heldOffice(state, surveyor.id)).toBeUndefined();
    });
    const sealed = serializeGameForVersion(state, 64);
    expect(JSON.parse(sealed)).toMatchObject({ version: 64, contentHash: PRE_OFFICES_CONTENT_HASH });
    expect(JSON.parse(sealed).state.offices).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.offices).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 73, contentHash: CONTENT_HASH });
    issue(state, { type: 'holdOffice', factionId: player, officeId: roll, holderId: surveyor.id });
    expect(() => serializeGameForVersion(state, 64)).toThrow('offices unavailable');
    const whole = createGame({ seed: 20260905, size: 'standard', factionCount: 12 });
    expect(whole.offices).toEqual([]);
  });
});
