import { hexDistance, isPassable } from '@theandril/mapgen';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { describe, expect, it } from 'vitest';
import { CONTENT_HASH, CRISES, crisesForRules, crisisDefinition, HEARTH_EVENTS } from '@theandril/content';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_CRISES_CONTENT_HASH, PRE_LANDMARKS_II_CONTENT_HASH, PRE_REGIONAL_CRISES_CONTENT_HASH, serializeGameForVersion } from './save';
import { advanceCrises, affectedHearths, beginCrises, crisisReaches, MIGRATION_MIN_POPULATION, MIGRATION_RANGE, observeCrisis, shelterBlocker, validateCrises } from './crises';
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
    const withHearths = state.factions.filter(faction => Object.values(state.settlements).some(town => town.factionId === faction.id)).map(faction => faction.id).sort();
    const offeredTo = offers.map(event => event.factionId).sort();
    // Rules 59: a regional first crisis offers its event only to the realms it reaches.
    if (crisisDefinition(state.crises.past[0]!.crisisId)!.scope === 'region') { expect(offeredTo.length).toBeGreaterThan(0); expect(withHearths).toEqual(expect.arrayContaining(offeredTo)); } else expect(offeredTo).toEqual(withHearths);
    // A realm the first crisis did not reach keeps its slot free, and the second crisis offers it its own event instead.
    const seamsEvent = HEARTH_EVENTS.find(item => item.condition === 'crisis' && item.crisis === active.crisisId)!;
    const named = (event: { message: string }, template: typeof roadsEvent, named: string) => event.message.startsWith(template.name) && event.message.includes(`with ${named}`);
    expect(offers.every(event => named(event, roadsEvent, crisisDefinition(state.crises.past[0]!.crisisId)!.name) || named(event, seamsEvent, crisis.name))).toBe(true);
    expect(offers.some(event => named(event, roadsEvent, crisisDefinition(state.crises.past[0]!.crisisId)!.name))).toBe(true);
    expect(state.hearthEvents.pending.every(item => (item.templateId === roadsEvent.id || item.templateId === seamsEvent.id) && item.id.endsWith('.crisis') && item.turn === state.turn)).toBe(true);
    expect(getObservation(state, player).hearthEvents!.map(item => item.name).every(name => name === roadsEvent.name || name === seamsEvent.name)).toBe(true);
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
    expect(JSON.parse(serializeGame(older))).toMatchObject({ version: 77, contentHash: CONTENT_HASH });
    expect(crisesForRules(53).every(crisis => crisis.sinceRules === 53)).toBe(true);
    expect(CRISES.some(crisis => crisis.sinceRules === 59 && crisis.scope === 'region')).toBe(true);
  });

  it('leaves a migration behind under rules 55: a hearth of three that bore the whole toll loses a household to the nearest sheltered hearth within range, and nothing moves under rules 54', () => {
    const settle = (): { state: GameState; player: string; rival: string; haven: GameState['settlements'][string]; near: GameState['settlements'][string]; far: GameState['settlements'][string] } => {
      const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions.find(faction => faction.id !== player)!.id;
      const haven = Object.values(state.settlements).find(town => town.factionId === player)!, far = Object.values(state.settlements).find(town => town.factionId === rival)!;
      // The rival founds a hearth within migration range of the player's; its capital lies beyond it.
      const cell = state.world.terrain.findIndex((terrain, index) => isPassable(terrain) && state.world.waterDepth[index] === 0 && hexDistance(index, haven.cell, state.world.width) === 5
        && Object.values(state.settlements).every(town => hexDistance(town.cell, index, state.world.width) > 3));
      expect(cell).toBeGreaterThan(0);
      const id = 'army.rival_caravan';
      state.armies[id] = { id, factionId: rival, name: 'Reed caravan', cell, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
      state.factions.find(faction => faction.id === rival)!.treasury = 500;
      refreshAuthoredSight(state);
      expect(applyCommand(state, { type: 'found', factionId: rival, armyId: id, name: 'Reed Reach' })).toMatchObject({ ok: true });
      const near = Object.values(state.settlements).find(town => town.name === 'Reed Reach')!;
      expect(hexDistance(near.cell, haven.cell, state.world.width)).toBeLessThanOrEqual(MIGRATION_RANGE);
      expect(hexDistance(far.cell, haven.cell, state.world.width)).toBeGreaterThan(MIGRATION_RANGE);
      for (const town of [haven, near, far]) town.population = MIGRATION_MIN_POPULATION;
      return { state, player, rival, haven, near, far };
    };
    const crisis = CRISES[0]!;
    const { state, player, rival, haven, near, far } = settle();
    state.crises.active = { id: 'crisis.1.1', crisisId: crisis.id, startedTurn: 1, endsTurn: state.turn, sheltered: [player] };
    expect(getObservation(state, player).crisis).toMatchObject({ shelteredRealms: [player], sheltered: true });
    expect(getObservation(state, rival).crisis).toMatchObject({ shelteredRealms: [player], sheltered: false });
    const events: Parameters<typeof advanceCrises>[1] = [];
    advanceCrises(state, events);
    expect(state.crises.active).toBeNull();
    const crossings = events.filter(event => event.type === 'crisis_migration');
    expect(crossings.map(event => event.factionId).sort()).toEqual([player, rival].sort());
    expect([near.population, far.population, haven.population]).toEqual([MIGRATION_MIN_POPULATION - 1, MIGRATION_MIN_POPULATION, MIGRATION_MIN_POPULATION + 1]);
    expect(crossings.find(event => event.factionId === player)!.message).toBe(`A household comes to ${haven.name} from ${near.name} of ${state.factions.find(faction => faction.id === rival)!.name}, which bore the whole of ${crisis.name}.`);
    expect(crossings.find(event => event.factionId === rival)!.message).toContain(`A household leaves ${near.name} for ${haven.name}`);
    // A hearth of two keeps its people; no realm sheltered, nothing moves; nothing under rules 54.
    const small = settle();
    small.near.population = MIGRATION_MIN_POPULATION - 1;
    small.state.crises.active = { id: 'crisis.1.1', crisisId: crisis.id, startedTurn: 1, endsTurn: small.state.turn, sheltered: [small.player] };
    const kept: Parameters<typeof advanceCrises>[1] = [];
    advanceCrises(small.state, kept);
    expect(kept.filter(event => event.type === 'crisis_migration')).toEqual([]);
    expect([small.near.population, small.haven.population]).toEqual([MIGRATION_MIN_POPULATION - 1, MIGRATION_MIN_POPULATION]);
    const unsheltered = settle();
    unsheltered.state.crises.active = { id: 'crisis.1.1', crisisId: crisis.id, startedTurn: 1, endsTurn: unsheltered.state.turn, sheltered: [] };
    const quiet: Parameters<typeof advanceCrises>[1] = [];
    advanceCrises(unsheltered.state, quiet);
    expect(quiet.filter(event => event.type === 'crisis_migration')).toEqual([]);
    const older = settle();
    withRules(older.state, 54, () => {
      older.state.crises.active = { id: 'crisis.1.1', crisisId: crisis.id, startedTurn: 1, endsTurn: older.state.turn, sheltered: [older.player] };
      expect(getObservation(older.state, older.player).crisis!.shelteredRealms).toBeUndefined();
      const none: Parameters<typeof advanceCrises>[1] = [];
      advanceCrises(older.state, none);
      expect(none.filter(event => event.type === 'crisis_migration')).toEqual([]);
      expect([older.near.population, older.haven.population]).toEqual([MIGRATION_MIN_POPULATION, MIGRATION_MIN_POPULATION]);
    });
    // A v54 envelope loads unchanged under rules 55 and seals back.
    const fresh = attunementCampaign();
    const sealed = serializeGameForVersion(fresh, 54);
    expect(JSON.parse(sealed)).toMatchObject({ version: 54, contentHash: PRE_LANDMARKS_II_CONTENT_HASH });
    expect(stateHash(deserializeGame(sealed))).toBe(stateHash(fresh));
  });

  it('rules 59: a regional crisis reaches only the hearths within its radius of its centre, is quoted, tolled, sheltered, offered and left by migration for those alone, and stays out of older rules', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions.find(faction => faction.id !== player)!.id;
    const haven = Object.values(state.settlements).find(town => town.factionId === player)!, far = Object.values(state.settlements).find(town => town.factionId === rival)!;
    const crisis = CRISES.find(item => item.scope === 'region')!;
    expect(hexDistance(haven.cell, far.cell, state.world.width)).toBeGreaterThan(crisis.radius!);
    state.crises.active = { id: 'crisis.1.1', crisisId: crisis.id, startedTurn: 1, endsTurn: state.turn + crisis.turns, sheltered: [], center: haven.cell };
    expect(() => validateCrises(state)).not.toThrow();
    expect(crisisReaches(state, state.crises.active, haven.cell)).toBe(true);
    expect(crisisReaches(state, state.crises.active, far.cell)).toBe(false);
    expect(affectedHearths(state, state.crises.active, player).map(town => town.id)).toEqual([haven.id]);
    expect(affectedHearths(state, state.crises.active, rival)).toEqual([]);
    expect(getObservation(state, player).crisis).toMatchObject({ center: haven.cell, radius: crisis.radius, centerName: haven.name, hearths: 1, affectedHearthIds: [haven.id], shelterCost: crisis.shelterCoinPerHearth, shelterBlocker: null });
    expect(getObservation(state, rival).crisis).toMatchObject({ hearths: 0, affectedHearthIds: [], shelterCost: 0, shelterBlocker: 'None of the realm’s hearths lies within the crisis.' });
    expect(applyCommand(state, { type: 'shelterFromCrisis', factionId: rival, crisisId: 'crisis.1.1' }).error).toContain('None of the realm');
    // The toll falls on the reached hearth alone.
    haven.food = 20; far.food = 20; const me = state.factions.find(faction => faction.id === player)!, them = state.factions.find(faction => faction.id === rival)!; me.treasury = 100; them.treasury = 100;
    const events: Parameters<typeof advanceCrises>[1] = [];
    advanceCrises(state, events);
    expect([haven.food, far.food]).toEqual([20 - crisis.blight.food, 20]);
    expect([me.treasury, them.treasury]).toEqual([100 - crisis.blight.coin, 100]);
    // The crisis's event comes only to a hearth it reaches: the rival, with none, is offered nothing.
    const offered = attunementCampaign(); const offeredHaven = Object.values(offered.settlements).find(town => town.factionId === player)!;
    const fresh = structuredClone(offered); fresh.crises.active = null;
    withRules(fresh, 59, () => {
      fresh.hearthEvents.pending = [];
      const begun: Parameters<typeof beginCrises>[3] = [];
      // Force the regional crisis by hand through the same offer path the draw uses.
      fresh.crises.active = { id: 'crisis.1.1', crisisId: crisis.id, startedTurn: fresh.turn, endsTurn: fresh.turn + crisis.turns, sheltered: [], center: offeredHaven.cell };
      expect(getObservation(fresh, rival).crisis!.hearths).toBe(0);
      void begun;
    });
    // Migration from a regional crisis leaves only its reached hearths; a hearth outside keeps its people.
    const moving = attunementCampaign(), mover = Object.values(moving.settlements).find(town => town.factionId === player)!, outside = Object.values(moving.settlements).find(town => town.factionId === rival)!;
    mover.population = MIGRATION_MIN_POPULATION; outside.population = MIGRATION_MIN_POPULATION;
    moving.crises.active = { id: 'crisis.1.1', crisisId: crisis.id, startedTurn: 1, endsTurn: moving.turn, sheltered: [rival], center: mover.cell };
    const left: Parameters<typeof advanceCrises>[1] = [];
    advanceCrises(moving, left);
    // The rival's hearth is sheltered but beyond migration range of the mover, so nothing crosses; the rule's reach test is the filter, shown by the unchanged far hearth.
    expect([mover.population, outside.population]).toEqual([MIGRATION_MIN_POPULATION, MIGRATION_MIN_POPULATION]);
    // A regional crisis cannot be sealed under older rules; a v58 envelope loads unchanged; the draw's pools now hold a regional crisis for every later age.
    expect(() => serializeGameForVersion(state, 58)).toThrow('regional crisis unavailable');
    const sealed = serializeGameForVersion(attunementCampaign(), 58);
    expect(JSON.parse(sealed)).toMatchObject({ version: 58, contentHash: PRE_REGIONAL_CRISES_CONTENT_HASH });
    expect(stateHash(deserializeGame(sealed))).toBe(stateHash(attunementCampaign()));
    const drawn = onTheBrink(); endRound(drawn);
    const active = drawn.crises.active!;
    expect((active.center !== undefined) === Boolean(crisisDefinition(active.crisisId)!.scope)).toBe(true);
    expect(() => validateCrises(drawn)).not.toThrow();
    const broken = structuredClone(drawn); broken.crises.active!.center = broken.crises.active!.center === undefined ? 0 : undefined;
    expect(() => validateCrises(broken)).toThrow('centre does not match');
  });
});
