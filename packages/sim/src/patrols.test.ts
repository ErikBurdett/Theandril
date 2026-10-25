import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { neighbors } from '@theandril/mapgen';
import { applyRecordedCommand, createArchive, replayArchive } from '../../chronicle/src';
import { applyCommand, applyCommandForVersion, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { advancePatrols, MAX_PATROL_ROUTE_ATTEMPTS, MAX_PATROLS_PER_FACTION, observePatrols, patrolStateSchema, validatePatrols } from './patrols';
import { advanceTheaters } from './theaters';
import { theaterCampaign } from '../../test-fixtures/src/theater-fixture';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { indexes } from './visibility';
import { relocateArmy } from './warfare';

const issue = (state: GameState, command: GameCommand) => {
  const result = applyCommand(state, command); expect(result, JSON.stringify(command)).toMatchObject({ ok: true }); return result;
};
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
const config = (state: GameState, armyId = Object.values(state.armies).filter(army => army.factionId === state.turnOwnerId).map(army => army.id).sort()[0]!) => ({ type: 'setPatrol' as const, factionId: state.turnOwnerId, armyId, firstCell: 495, secondCell: 497, enabled: true });
const run = (state: GameState) => { const events: Parameters<typeof advancePatrols>[1] = []; advancePatrols(state, events); return events; };
const reject = (state: GameState, command: unknown) => {
  const before = serializeGame(state); expect(applyCommand(state, command).ok).toBe(false); expect(serializeGame(state)).toBe(before);
};
function addObservedRival(state: GameState) {
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: state.factions[1]!.id, name: 'Observed rival guard', cell: 502, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
  refreshAuthoredSight(state);
}

describe('saved two-point land patrols', () => {
  it('configures without moving, alternates ordinary paid movement, and never starts two short legs in one phase', () => {
    const state = theaterCampaign(1), command = config(state), army = state.armies[command.armyId]!;
    const nextId = state.nextId, movement = army.movement;
    issue(state, command);
    expect(army.cell).toBe(495); expect(army.movement).toBe(movement); expect(state.routes).toEqual({}); expect(state.nextId).toBe(nextId);
    expect(state.patrols[0]).toMatchObject({ target: 'second', lastAttemptTurn: null, lastError: null });
    end(state); expect(army.cell).toBe(497); expect(army.movement).toBe(movement - 2);
    expect(state.patrols[0]).toMatchObject({ target: 'first', lastAttemptTurn: state.turn, lastError: null });
    const before = serializeGame(state); run(state); expect(serializeGame(state)).toBe(before);
    end(state); expect(army.cell).toBe(495); expect(state.patrols[0]!.target).toBe('second');
  });

  it('rejects invalid, unknown, duplicate and foreign assignments atomically', () => {
    const state = theaterCampaign(1), command = config(state);
    for (const edit of [{ firstCell: -1 }, { secondCell: 1.5 }, { secondCell: command.firstCell }, { secondCell: 349999 }, { armyId: 'army.missing' }, { factionId: state.factions[1]!.id }, { enabled: 'yes' }, { unknown: true }]) reject(state, { ...command, ...edit });
    state.explored[command.factionId]!.delete(1000);
    reject(state, { ...command, secondCell: 1000 });
    issue(state, command); issue(state, { ...command, secondCell: 498 });
    expect(state.patrols).toHaveLength(1); expect(state.patrols[0]!.secondCell).toBe(498);
    reject(state, { type: 'setPatrolEnabled', factionId: state.factions[1]!.id, armyId: command.armyId, enabled: false });
    reject(state, { type: 'clearPatrol', factionId: state.factions[1]!.id, armyId: command.armyId });
  });

  it('refuses hulls, caravans and embarked companies without testing hidden geography', () => {
    for (const unitId of ['unit.colonist', 'unit.transport'] as const) {
      const state = theaterCampaign(1), command = config(state), army = state.armies[command.armyId]!;
      army.formations = [createArmyFormation(army.id, unitId)];
      // Domain eligibility is independent of an authored hull's current ground.
      expect(applyCommand(state, command).error).toContain('combat land army ashore');
      expect(state.patrols).toEqual([]);
    }
    const state = theaterCampaign(1), command = config(state);
    state.transports[command.armyId] = 'army.authored-carrier';
    expect(applyCommand(state, command).error).toContain('combat land army ashore');
    expect(state.patrols).toEqual([]);
  });

  it('retains an in-flight route when paused, cleared or reconfigured and resumes only through explicit enable', () => {
    const state = theaterCampaign(1), command = { ...config(state), secondCell: 510 };
    issue(state, command); end(state);
    const route = structuredClone(state.routes[command.armyId]); expect(route).toBeDefined();
    issue(state, { type: 'setPatrolEnabled', factionId: command.factionId, armyId: command.armyId, enabled: false });
    expect(state.routes[command.armyId]).toEqual(route);
    expect(observePatrols(state, command.factionId)[0]).toMatchObject({ status: 'paused' });
    for (let turns = 0; state.routes[command.armyId] && turns < 10; turns++) end(state);
    expect(state.armies[command.armyId]!.cell).toBe(510);
    end(state); expect(state.armies[command.armyId]!.cell).toBe(510);
    issue(state, { type: 'setPatrolEnabled', factionId: command.factionId, armyId: command.armyId, enabled: true });
    end(state); expect(state.armies[command.armyId]!.cell).not.toBe(510);
    const returning = structuredClone(state.routes[command.armyId]);
    issue(state, { ...command, secondCell: 520 }); expect(state.routes[command.armyId]).toEqual(returning);
    issue(state, { type: 'clearPatrol', factionId: command.factionId, armyId: command.armyId });
    expect(state.routes[command.armyId]).toEqual(returning); expect(state.patrols).toEqual([]);
  });

  it('can pause at war through a public saved policy while ordinary patrols continue, without silently resuming after peace', () => {
    const state = theaterCampaign(2), ids = Object.keys(state.armies).sort(), owner = state.turnOwnerId, rival = state.factions[1]!.id;
    addObservedRival(state); // Authored contact enables an ordinary declaration of war.
    const archive = createArchive(state, { mode: 'player', coverage: 'from-save' });
    const record = (command: GameCommand) => { const result = applyRecordedCommand(state, archive, command); expect(result, `${command.type}: ${result.error ?? ''}`).toMatchObject({ ok: true }); return result; };
    record({ ...config(state, ids[0]!), pauseOnWar: true });
    record(config(state, ids[1]!));
    expect(state.patrols.find(patrol => patrol.armyId === ids[1])?.pauseOnWar).toBe(false);
    record({ type: 'endTurn', factionId: owner });
    const before = { ...state.patrols.find(patrol => patrol.armyId === ids[0])! };
    record({ type: 'declareWar', factionId: owner, targetFactionId: rival });
    const result = record({ type: 'endTurn', factionId: owner });
    const stopped = state.patrols.find(patrol => patrol.armyId === ids[0])!;
    expect(stopped).toEqual({ ...before, enabled: false, lastError: null });
    expect(state.armies[ids[0]!]!.cell).toBe(497); expect(state.armies[ids[1]!]!.cell).toBe(495);
    expect(result.events.filter(event => event.type === 'patrol_paused_for_war')).toHaveLength(1);
    expect(getObservation(state, owner).events.some(event => event.type === 'patrol_paused_for_war')).toBe(true);
    expect(getObservation(state, rival).events.some(event => event.type === 'patrol_paused_for_war')).toBe(false);
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
    expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
    // Explicitly resuming during war does not override the selected policy.
    record({ type: 'setPatrolEnabled', factionId: owner, armyId: ids[0]!, enabled: true });
    record({ type: 'endTurn', factionId: owner }); expect(stopped.enabled).toBe(false);
    record({ type: 'proposePeace', factionId: owner, targetFactionId: rival, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 5 } });
    record({ type: 'respondPeace', factionId: rival, offerId: state.diplomacy.offers[0]!.id, accept: true });
    record({ type: 'endTurn', factionId: owner }); expect(stopped.enabled).toBe(false); expect(state.armies[ids[0]!]!.cell).toBe(497);
    record({ type: 'setPatrolEnabled', factionId: owner, armyId: ids[0]!, enabled: true });
    record({ type: 'endTurn', factionId: owner }); expect(state.armies[ids[0]!]!.cell).toBe(495);
    expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
  });

  it('a war policy pause preserves every active or paused travel field and requires an explicit saved boolean', () => {
    const state = theaterCampaign(2), ids = Object.keys(state.armies).sort(), owner = state.turnOwnerId;
    addObservedRival(state);
    for (const armyId of ids) issue(state, { ...config(state, armyId), secondCell: 510, pauseOnWar: true });
    end(state);
    state.routes[ids[1]!]!.status = 'paused'; state.routes[ids[1]!]!.pauseReason = 'Authored direct interruption.';
    issue(state, { type: 'declareWar', factionId: owner, targetFactionId: state.factions[1]!.id });
    const routes = structuredClone(state.routes), before = structuredClone(state.patrols);
    expect(run(state).filter(event => event.type === 'patrol_paused_for_war')).toHaveLength(2);
    expect(state.routes).toEqual(routes);
    expect(state.patrols).toEqual(before.map(patrol => ({ ...patrol, enabled: false, lastError: null })));
    expect(run(state).filter(event => event.type === 'patrol_paused_for_war')).toEqual([]);
    const { pauseOnWar: _policy, ...missing } = state.patrols[0]!;
    expect(patrolStateSchema.safeParse([missing]).success).toBe(false);
    expect(patrolStateSchema.safeParse([{ ...state.patrols[0], pauseOnWar: 'yes' }]).success).toBe(false);
  });

  it('gives active/paused direct travel and standing postings priority without rewriting their state', () => {
    const state = theaterCampaign(3), ids = Object.keys(state.armies).sort();
    for (const id of ids) issue(state, config(state, id));
    issue(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: ids[0]!, target: 510 });
    issue(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: ids[1]!, target: 520 });
    state.routes[ids[1]!]!.status = 'paused'; state.routes[ids[1]!]!.pauseReason = 'Authored direct interruption.';
    issue(state, { type: 'setPosting', factionId: state.turnOwnerId, armyId: ids[2]!, cell: 495, mode: 'hold' });
    const routes = structuredClone(state.routes); run(state);
    expect(state.routes).toEqual(routes); expect(state.patrols.every(patrol => patrol.lastAttemptTurn === null)).toBe(true);
    const observed = observePatrols(state, state.turnOwnerId);
    expect(observed.find(patrol => patrol.armyId === ids[0])).toMatchObject({ status: 'traveling', blocker: 'Existing travel takes priority until it finishes.' });
    expect(observed.find(patrol => patrol.armyId === ids[1])).toMatchObject({ status: 'waiting', blocker: 'Authored direct interruption.' });
    expect(observed.find(patrol => patrol.armyId === ids[2])?.blocker).toContain('posting takes priority');
  });

  it('waits for an ordinary stationary character mission without spending a route attempt', () => {
    const state = theaterCampaign(1), command = config(state), army = state.armies[command.armyId]!, town = Object.values(state.settlements)[0]!;
    relocateArmy(state, army, town.cell);
    const characterId = `character.${state.nextId}`;
    issue(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: town.id, definitionId: 'character.engineer' });
    issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId, armyId: army.id });
    issue(state, command);
    army.formations[0]!.strength = 1; // Authored damage gives the ordinary refit mission work.
    issue(state, { type: 'startCharacterMission', factionId: state.turnOwnerId, characterId, missionId: 'mission.refit' });
    run(state);
    expect(state.patrols[0]!.lastAttemptTurn).toBeNull(); expect(state.routes[army.id]).toBeUndefined();
    expect(observePatrols(state, state.turnOwnerId)[0]?.blocker).toContain('character mission');
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
  });

  it('keeps a transported patrol saveable and waits ashore without commandeering its fleet', () => {
    const state = navalCampaign({ enemyFleet: false }), army = state.armies[NAVAL_FIXTURE.cargoId]!;
    // Authored military cargo replaces this fixture's founding caravan; boarding is real.
    army.formations = army.formations.filter(formation => formation.unitId === 'unit.guard');
    const command = { type: 'setPatrol' as const, factionId: state.turnOwnerId, armyId: army.id, firstCell: NAVAL_FIXTURE.homeCell, secondCell: NAVAL_FIXTURE.homeCell - 1, enabled: true };
    issue(state, command);
    issue(state, { type: 'embarkArmy', factionId: state.turnOwnerId, armyId: army.id, fleetId: NAVAL_FIXTURE.fleetId });
    run(state); expect(state.patrols[0]!.lastAttemptTurn).toBeNull(); expect(state.routes).toEqual({});
    expect(observePatrols(state, state.turnOwnerId)[0]?.blocker).toContain('aboard a fleet');
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
    end(state);
    issue(state, { type: 'disembarkArmy', factionId: state.turnOwnerId, armyId: army.id, target: NAVAL_FIXTURE.homeCell });
    end(state); expect(army.cell).toBe(command.secondCell);
  });

  it('leaves an ordinary maintained siege in place until the player lifts it', () => {
    const state = conquestCampaign(), army = state.armies[CONQUEST_FIXTURE.playerArmyId]!;
    const archive = createArchive(state, { mode: 'player', coverage: 'from-save' });
    const record = (command: GameCommand) => expect(applyRecordedCommand(state, archive, command)).toMatchObject({ ok: true });
    record({ type: 'setPatrol', factionId: state.turnOwnerId, armyId: army.id, firstCell: army.cell, secondCell: state.settlements[CONQUEST_FIXTURE.settlementId]!.cell, enabled: true });
    record({ type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: CONQUEST_FIXTURE.enemyFactionId });
    record({ type: 'besiege', factionId: state.turnOwnerId, armyId: army.id, settlementId: CONQUEST_FIXTURE.settlementId });
    const siege = structuredClone(state.sieges[CONQUEST_FIXTURE.settlementId]); run(state);
    expect(state.sieges[CONQUEST_FIXTURE.settlementId]).toEqual(siege); expect(state.patrols[0]!.lastAttemptTurn).toBeNull();
    expect(observePatrols(state, state.turnOwnerId)[0]?.blocker).toContain('maintaining a siege');
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
    expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
  });

  it('bounds failed route attempts per realm and rotates past inaccessible low IDs without same-turn retries', () => {
    const state = theaterCampaign(20), ids = Object.keys(state.armies).sort();
    for (const cell of neighbors(500, state.world.width, state.world.height)) { state.world.terrain[cell] = 0; state.world.waterDepth[cell] = 1; }
    refreshAuthoredSight(state);
    for (const id of ids) issue(state, { ...config(state, id), secondCell: 500 });
    run(state);
    const first = state.patrols.filter(patrol => patrol.lastAttemptTurn === state.turn);
    expect(first).toHaveLength(MAX_PATROL_ROUTE_ATTEMPTS); expect(first.every(patrol => patrol.lastError)).toBe(true);
    const before = serializeGame(state); run(state); expect(serializeGame(state)).toBe(before);
    state.turn++; run(state);
    const second = state.patrols.filter(patrol => patrol.lastAttemptTurn === state.turn);
    expect(second).toHaveLength(MAX_PATROL_ROUTE_ATTEMPTS);
    expect(second.some(patrol => !first.includes(patrol))).toBe(true);
    expect(new Set([...first, ...second].map(patrol => patrol.armyId)).size).toBe(16);
    const waiting = first[0]!;
    issue(state, { type: 'setPatrolEnabled', factionId: waiting.factionId, armyId: waiting.armyId, enabled: true });
    expect(waiting.lastError).toBeNull();
    expect(waiting.lastAttemptTurn).toBe(state.turn - 1);
  });

  it('gives each realm its own route allowance', () => {
    const state = theaterCampaign(20), ids = Object.keys(state.armies).sort(), foreign = state.factions[1]!.id;
    for (const id of ids.slice(10)) state.armies[id]!.factionId = foreign;
    state.explored[foreign] = new Set(state.world.terrain.keys()); refreshAuthoredSight(state);
    for (const id of ids) issue(state, { ...config(state, id), factionId: state.armies[id]!.factionId });
    run(state);
    for (const faction of state.factions) expect(state.patrols.filter(patrol => patrol.factionId === faction.id && patrol.lastAttemptTurn === state.turn)).toHaveLength(MAX_PATROL_ROUTE_ATTEMPTS);
  });

  it('enforces the per-realm limit while permitting updates and preserves canonical ordering', () => {
    const state = theaterCampaign(MAX_PATROLS_PER_FACTION + 1), ids = Object.keys(state.armies).sort();
    for (const id of ids.slice(0, MAX_PATROLS_PER_FACTION).reverse()) issue(state, config(state, id));
    expect(state.patrols.map(patrol => patrol.armyId)).toEqual(ids.slice(0, MAX_PATROLS_PER_FACTION));
    reject(state, config(state, ids.at(-1)!));
    issue(state, { ...config(state, ids[0]!), enabled: false });
    expect(state.patrols).toHaveLength(MAX_PATROLS_PER_FACTION); validatePatrols(state);
  });

  it('does not attack an observed hostile endpoint or leak a hidden army through reports', () => {
    const state = theaterCampaign(1), command = config(state), enemyId = `army.${state.nextId++}`;
    state.armies[enemyId] = { id: enemyId, factionId: state.factions[1]!.id, name: 'Observed rival', cell: 497, movement: 3, formations: [createArmyFormation(enemyId, 'unit.guard')] };
    state.wars = [[state.turnOwnerId, state.factions[1]!.id]]; refreshAuthoredSight(state);
    issue(state, command); run(state);
    expect(state.battle).toBeNull(); expect(state.armies[command.armyId]!.cell).toBe(495); expect(state.patrols[0]!.lastError).toBeTruthy();
    expect(observePatrols(state, state.factions[1]!.id)).toEqual([]);
    const quiet = theaterCampaign(1), mirror = deserializeGame(serializeGame(quiet));
    const hiddenId = `army.${mirror.nextId++}`;
    mirror.armies[hiddenId] = { id: hiddenId, factionId: mirror.factions[1]!.id, name: 'Secret rival', cell: 1000, movement: 3, formations: [createArmyFormation(hiddenId, 'unit.guard')] };
    refreshAuthoredSight(mirror); expect(indexes(mirror).visible.get(mirror.turnOwnerId)?.has(1000)).toBe(false);
    issue(quiet, config(quiet)); issue(mirror, config(mirror));
    expect(observePatrols(mirror, mirror.turnOwnerId)).toEqual(observePatrols(quiet, quiet.turnOwnerId));
    expect(run(mirror)).toEqual(run(quiet)); expect(mirror.patrols).toEqual(quiet.patrols);
  });

  it('pauses ordinary travel after a newly sighted enemy and does not automatically resume it', () => {
    const state = theaterCampaign(1), command = { ...config(state), secondCell: 520 }, enemyId = `army.${state.nextId++}`;
    state.armies[enemyId] = { id: enemyId, factionId: state.factions[1]!.id, name: 'Hidden rival', cell: 505, movement: 3, formations: [createArmyFormation(enemyId, 'unit.guard')] };
    state.wars = [[state.turnOwnerId, state.factions[1]!.id]]; refreshAuthoredSight(state);
    expect(indexes(state).visible.get(state.turnOwnerId)?.has(505)).toBe(false);
    issue(state, command);
    for (let i = 0; i < 8 && state.routes[command.armyId]?.status !== 'paused'; i++) end(state);
    expect(state.routes[command.armyId]?.status).toBe('paused'); expect(state.battle).toBeNull();
    const route = structuredClone(state.routes[command.armyId]), before = state.armies[command.armyId]!.cell;
    end(state); expect(state.armies[command.armyId]!.cell).toBe(before); expect(state.routes[command.armyId]).toEqual(route);
    expect(observePatrols(state, state.turnOwnerId)[0]?.status).toBe('waiting');
    expect(state.patrols[0]!.lastError).toBeNull();
  });

  it('returns detached private observations and keeps lost/captured army boundaries saveable until cleanup', () => {
    const state = theaterCampaign(2), ids = Object.keys(state.armies).sort();
    for (const id of ids) issue(state, config(state, id));
    const view = getObservation(state, state.turnOwnerId).patrols!;
    view[0]!.firstCell = 1; expect(state.patrols[0]!.firstCell).toBe(495);
    expect(getObservation(state, state.factions[1]!.id).patrols).toEqual([]);
    delete state.armies[ids[0]!]; state.armies[ids[1]!]!.factionId = state.factions[1]!.id;
    validatePatrols(state);
    expect(observePatrols(state, state.turnOwnerId).every(patrol => patrol.blocker === 'The patrol army is no longer available.')).toBe(true);
    expect(run(state).filter(event => event.type === 'patrol_lost')).toHaveLength(2); expect(state.patrols).toEqual([]);
  });

  it('keeps enabled patrols above theater delegation and returns paused members to their watch', () => {
    const state = theaterCampaign(1), command = config(state);
    issue(state, { type: 'setTheater', factionId: state.turnOwnerId, name: 'Watch', settlementIds: Object.keys(state.settlements).sort(), armyIds: [command.armyId], reserveCell: 500, guardsPerSettlement: 1, enabled: true });
    issue(state, command);
    advanceTheaters(state, []); expect(state.routes[command.armyId]).toBeUndefined();
    expect(getObservation(state, state.turnOwnerId).theaters![0]!.members[0]).toMatchObject({ status: 'overridden' });
    issue(state, { type: 'setPatrolEnabled', factionId: state.turnOwnerId, armyId: command.armyId, enabled: false });
    advanceTheaters(state, []); expect(state.routes[command.armyId]).toBeDefined();
  });

  it('preserves actual commands, paused state and deterministic continuation through saves and replay', () => {
    const state = theaterCampaign(1), command = config(state), archive = createArchive(state, { mode: 'player', coverage: 'from-save' });
    const record = (command: GameCommand) => { expect(applyRecordedCommand(state, archive, command).ok).toBe(true); };
    record(command); record({ type: 'endTurn', factionId: state.turnOwnerId });
    record({ type: 'setPatrolEnabled', factionId: state.turnOwnerId, armyId: command.armyId, enabled: false });
    const save = serializeGame(state), restored = deserializeGame(save);
    expect(serializeGame(restored)).toBe(save); expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
    record({ type: 'setPatrolEnabled', factionId: state.turnOwnerId, armyId: command.armyId, enabled: true });
    record({ type: 'endTurn', factionId: state.turnOwnerId });
    issue(restored, { type: 'setPatrolEnabled', factionId: state.turnOwnerId, armyId: command.armyId, enabled: true }); end(restored);
    expect(stateHash(restored)).toBe(stateHash(state)); expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
  });

  it('rejects historical commands and malformed patrol saves rather than dropping their intent', () => {
    const state = theaterCampaign(1), command = config(state);
    expect(applyCommandForVersion(state, command, 34).ok).toBe(false);
    issue(state, command); const patrol = state.patrols[0]!;
    expect(patrolStateSchema.safeParse([{ ...patrol, unexpected: true }]).success).toBe(false);
    for (const edit of [{ secondCell: patrol.firstCell }, { lastAttemptTurn: state.turn + 1 }, { lastError: 'Invented failure', lastAttemptTurn: null }, { factionId: 'faction.missing' }]) {
      state.patrols = [{ ...patrol, ...edit }]; expect(() => validatePatrols(state)).toThrow();
    }
    state.patrols = [patrol, { ...patrol }]; expect(() => validatePatrols(state)).toThrow('unique and sorted');
  });

  it('keeps allocation deterministic across army insertion order and saved continuation', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 16 }), count => {
      const state = theaterCampaign(count);
      for (const id of Object.keys(state.armies)) issue(state, config(state, id));
      const mirror = deserializeGame(serializeGame(state)); mirror.armies = Object.fromEntries(Object.entries(mirror.armies).reverse());
      end(state); end(mirror); expect(stateHash(state)).toBe(stateHash(mirror));
      const loaded = deserializeGame(serializeGame(state)); end(state); end(loaded); expect(stateHash(state)).toBe(stateHash(loaded));
    }), { numRuns: 10 });
  });
});
