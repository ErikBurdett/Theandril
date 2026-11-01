import { describe, expect, it } from 'vitest';
import { CONTENT_HASH, CRISES, crisisDefinition, HEARTH_EVENTS } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_CRISES_CONTENT_HASH, serializeGameForVersion } from './save';
import { advanceCrises, observeCrisis, shelterBlocker, validateCrises } from './crises';
import { epochId } from './epochs';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); return result; };
const endRound = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId }).events;
/** The fixture at the turn before the Short pace's Age of Roads; the close of that turn brings the age and its crisis. */
const onTheBrink = (): GameState => { const state = attunementCampaign(); state.turn = 11; return state; };

describe('rules 53: crises of the ages', () => {
  it('comes with an age, drawn from the seed the same way every time, announced to every realm, and quoted to each with its own shelter price', () => {
    const state = onTheBrink(), player = state.turnOwnerId;
    expect(state.crises).toEqual({ active: null, past: [] });
    expect(getObservation(state, player).crisis).toBeUndefined();
    const events = endRound(state);
    // Roads and Seams begin together on this fixture; the Seams crisis replaces the Roads one in the same resolution.
    expect(epochId(state)).toBe('epoch.seams');
    const begun = events.filter(event => event.type === 'crisis_begun');
    expect(begun).toHaveLength(state.factions.length * 2);
    expect(events.filter(event => event.type === 'crisis_ended')).toHaveLength(state.factions.length);
    const active = state.crises.active!;
    const crisis = crisisDefinition(active.crisisId)!;
    expect(crisis.epoch).toBe('epoch.seams');
    expect(active).toMatchObject({ startedTurn: state.turn, endsTurn: state.turn + crisis.turns, sheltered: [] });
    expect(state.crises.past).toHaveLength(1);
    expect(crisisDefinition(state.crises.past[0]!.crisisId)!.epoch).toBe('epoch.roads');
    expect(begun.at(-1)!.message).toContain(crisis.name);
    // Rules 54: the first crisis offered its event to every realm with a hearth; the slot it took kept the second crisis's event away.
    const roadsEvent = HEARTH_EVENTS.find(item => item.condition === 'crisis' && item.crisis === state.crises.past[0]!.crisisId)!;
    const offers = events.filter(event => event.type === 'hearth_event_offered');
    expect(offers.map(event => event.factionId).sort()).toEqual(state.factions.filter(faction => Object.values(state.settlements).some(town => town.factionId === faction.id)).map(faction => faction.id).sort());
    expect(offers.every(event => event.message.startsWith(roadsEvent.name) && event.message.includes(`with ${crisisDefinition(state.crises.past[0]!.crisisId)!.name}`))).toBe(true);
    expect(state.hearthEvents.pending.every(item => item.templateId === roadsEvent.id && item.id.endsWith('.crisis') && item.turn === state.turn)).toBe(true);
    expect(getObservation(state, player).hearthEvents!.map(item => item.name)).toEqual([roadsEvent.name]);
    // The same seed draws the same crises.
    const again = onTheBrink(); endRound(again);
    expect(again.crises).toEqual(state.crises);
    const hearths = Object.values(state.settlements).filter(town => town.factionId === player).length;
    expect(getObservation(state, player).crisis).toMatchObject({ id: active.id, crisisId: crisis.id, name: crisis.name, turnsLeft: crisis.turns, hearths, sheltered: false, shelterCost: crisis.shelterCoinPerHearth * hearths });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(() => serializeGameForVersion(state, 52)).toThrow('unavailable in historical rules');
    const answered = structuredClone(state); answered.hearthEvents.pending = [];
    expect(() => serializeGameForVersion(answered, 52)).toThrow('crises unavailable');
    expect(() => validateCrises(state)).not.toThrow();
    const broken = structuredClone(state); broken.crises.active!.crisisId = 'crisis.nowhere';
    expect(() => validateCrises(broken)).toThrow('unknown crisis');
  });

  it('takes its toll of every unsheltered hearth each turn, passes sheltered hearths by, and ends with its term', () => {
    const state = onTheBrink(), player = state.turnOwnerId, other = state.factions.find(faction => faction.id !== player)!;
    endRound(state);
    const active = state.crises.active!, crisis = crisisDefinition(active.crisisId)!;
    const mine = Object.values(state.settlements).filter(town => town.factionId === player), theirs = Object.values(state.settlements).filter(town => town.factionId === other.id);
    const me = state.factions.find(faction => faction.id === player)!;
    // Shelter: refused without the coin, paid once, then the realm is quoted as sheltered.
    me.treasury = crisis.shelterCoinPerHearth * mine.length - 1;
    expect(shelterBlocker(state, player)).toContain('Requires');
    expect(applyCommand(state, { type: 'shelterFromCrisis', factionId: player, crisisId: active.id }).ok).toBe(false);
    expect(applyCommand(state, { type: 'shelterFromCrisis', factionId: player, crisisId: 'crisis.none' }).error).toContain('not the one that stands');
    me.treasury = 500;
    const sheltered = issue(state, { type: 'shelterFromCrisis', factionId: player, crisisId: active.id });
    expect(me.treasury).toBe(500 - crisis.shelterCoinPerHearth * mine.length);
    expect(sheltered.events.map(event => event.type)).toEqual(['crisis_sheltered']);
    expect(state.crises.active!.sheltered).toEqual([player]);
    expect(getObservation(state, player).crisis).toMatchObject({ sheltered: true, shelterBlocker: 'The realm’s hearths are already sheltered.' });
    expect(applyCommand(state, { type: 'shelterFromCrisis', factionId: player, crisisId: active.id }).ok).toBe(false);
    // The toll, in isolation: sheltered hearths keep their stores, the others pay.
    for (const town of [...mine, ...theirs]) { town.food = 20; town.devastation = 0; }
    me.treasury = 100; other.treasury = 100; me.knowledge = 100; other.knowledge = 100;
    const events: Parameters<typeof advanceCrises>[1] = [];
    advanceCrises(state, events);
    expect(events).toEqual([]);
    for (const town of mine) expect([town.food, town.devastation]).toEqual([20, 0]);
    for (const town of theirs) expect([town.food, town.devastation]).toEqual([20 - crisis.blight.food, crisis.blight.devastation]);
    expect([me.treasury, me.knowledge]).toEqual([100, 100]);
    expect([other.treasury, other.knowledge]).toEqual([100 - crisis.blight.coin * theirs.length, 100 - crisis.blight.knowledge * theirs.length]);
    // The term runs out: the crisis is past, every realm told, and nothing more is taken.
    state.turn = active.endsTurn;
    advanceCrises(state, events);
    expect(state.crises.active).toBeNull();
    expect(state.crises.past.at(-1)).toMatchObject({ id: active.id, crisisId: crisis.id, endedTurn: active.endsTurn });
    expect(events.filter(event => event.type === 'crisis_ended')).toHaveLength(state.factions.length);
    expect(observeCrisis(state, player)).toBeUndefined();
    expect(shelterBlocker(state, player)).toBe('No crisis stands.');
    for (const town of theirs) town.food = 20;
    advanceCrises(state, events);
    for (const town of theirs) expect(town.food).toBe(20);
  });

  it('is absent from older rules and envelopes, and a v52 envelope loads with none', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    withRules(state, 52, () => {
      state.turn = 11;
      expect(endRound(state).filter(event => event.type === 'crisis_begun')).toEqual([]);
      expect(state.crises.active).toBeNull();
      expect(getObservation(state, player).crisis).toBeUndefined();
      expect(applyCommand(state, { type: 'shelterFromCrisis', factionId: player, crisisId: 'crisis.1.1' }).error).toContain('not part of these rules');
    });
    const fresh = attunementCampaign();
    const sealed = serializeGameForVersion(fresh, 52);
    expect(JSON.parse(sealed)).toMatchObject({ version: 52, contentHash: PRE_CRISES_CONTENT_HASH });
    expect(JSON.parse(sealed).state.crises).toBeUndefined();
    const older = deserializeGame(sealed);
    expect(older.crises).toEqual({ active: null, past: [] });
    expect(stateHash(older)).toBe(stateHash(fresh));
    expect(JSON.parse(serializeGame(older))).toMatchObject({ version: 54, contentHash: CONTENT_HASH });
    expect(CRISES.every(crisis => crisis.sinceRules === 53)).toBe(true);
  });
});
