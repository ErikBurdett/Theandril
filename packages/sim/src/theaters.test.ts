import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { advanceTheaters, MAX_THEATER_DISPATCHES } from './theaters';
import { theaterCampaign } from '../../test-fixtures/src/theater-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result, JSON.stringify(command)).toMatchObject({ ok: true }); return result; };
const config = (state: GameState) => ({ type: 'setTheater' as const, factionId: state.turnOwnerId, name: 'March watch', settlementIds: Object.keys(state.settlements).sort(), armyIds: Object.keys(state.armies).sort(), reserveCell: 495, guardsPerSettlement: 1, enabled: true });
const reject = (state: GameState, command: unknown) => { const before = serializeGame(state); expect(applyCommand(state, command).ok).toBe(false); expect(serializeGame(state)).toBe(before); };
const run = (state: GameState) => { const events: Parameters<typeof advanceTheaters>[1] = []; advanceTheaters(state, events); return events; };
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId });

describe('defensive theaters', () => {
  it('validates assignments atomically, has dedicated IDs and detached own-only observations', () => {
    const state = theaterCampaign(), command = config(state), nextId = state.nextId;
    for (const edit of [{ armyIds: [] }, { armyIds: ['army.missing'] }, { armyIds: [command.armyIds[0], command.armyIds[0]] }, { settlementIds: [] }, { settlementIds: ['settlement.missing'] }, { reserveCell: 349999 }, { guardsPerSettlement: 0 }, { guardsPerSettlement: 5 }, { name: '<bad>' }, { extra: true }]) reject(state, { ...command, ...edit });
    issue(state, command); expect(state.nextId).toBe(nextId); expect(state.theaters[0]!.id).toBe('theater.1'); expect(state.routes).toEqual({});
    reject(state, { ...command, name: 'Other' });
    reject(state, { type: 'deleteTheater', factionId: state.factions[1]!.id, theaterId: 'theater.1' });
    const observation = getObservation(state, state.turnOwnerId).theaters!;
    observation[0]!.armyIds.length = 0; observation[0]!.hearths[0]!.name = 'Changed';
    expect(state.theaters[0]!.armyIds).toHaveLength(6); expect(getObservation(state, state.factions[1]!.id).theaters).toEqual([]);
    issue(state, { ...command, theaterId: 'theater.1', armyIds: [] });
    expect(getObservation(state, state.turnOwnerId).theaters![0]!.blocker).toContain('No armies');
    issue(state, { type: 'deleteTheater', factionId: state.turnOwnerId, theaterId: 'theater.1' });
    issue(state, command); expect(state.theaters[0]!.id).toBe('theater.2');
  });

  it('fills garrison gaps, suppresses duplicate incoming orders, and gathers spare members at reserve', () => {
    const state = theaterCampaign(), command = config(state);
    state.armies[command.armyIds[2]!]!.cell = 496; refreshAuthoredSight(state);
    issue(state, command); run(state);
    const first = getObservation(state, state.turnOwnerId).theaters![0]!;
    expect(first.missingGuards).toBe(0); expect(first.hearths.map(row => row.stationed + row.incoming)).toEqual([1, 1]);
    expect(state.armies[command.armyIds[2]!]!.cell).toBe(495);
    const routes = structuredClone(state.routes); run(state); expect(state.routes).toEqual(routes);
    for (let i = 0; i < 8; i++) end(state);
    expect(getObservation(state, state.turnOwnerId).theaters![0]!.hearths.map(row => row.stationed)).toEqual([1, 1]);
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
  });

  it('never trades away a physical guard for an incoming promise and counts nonmembers without commanding them', () => {
    const state = theaterCampaign(), command = config(state), [guard, incoming, spare] = command.armyIds;
    state.armies[guard!]!.cell = 500; state.armies[incoming!]!.cell = 495; refreshAuthoredSight(state);
    issue(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: incoming!, target: 500 });
    issue(state, { ...command, armyIds: [guard!, spare!] }); run(state);
    expect(state.armies[guard!]!.cell).toBe(500); expect(state.routes[guard!]).toBeUndefined();
    expect(state.routes[spare!]?.waypoints.at(-1)).toBe(510);
    expect(state.routes[incoming!]?.waypoints.at(-1)).toBe(500);
    const observed = getObservation(state, state.turnOwnerId).theaters![0]!;
    expect(observed.hearths.find(row => row.cell === 500)).toMatchObject({ stationed: 1, incoming: 1, deficit: 0 });
  });

  it('respects paused and active direct travel, postings and individual detach; pause/delete leave travel intact', () => {
    const state = theaterCampaign(), command = config(state), [active, paused, posted] = command.armyIds;
    issue(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: active!, target: 520 });
    issue(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: paused!, target: 500 });
    state.routes[paused!]!.status = 'paused'; state.routes[paused!]!.pauseReason = 'Authored interrupted route.';
    issue(state, { type: 'setPosting', factionId: state.turnOwnerId, armyId: posted!, cell: 520, mode: 'hold' });
    issue(state, command); const routes = structuredClone(state.routes); run(state);
    expect(state.routes[active!]).toEqual(routes[active!]); expect(state.routes[paused!]).toEqual(routes[paused!]); expect(state.routes[posted!]).toBeUndefined();
    expect(getObservation(state, state.turnOwnerId).theaters![0]!.members.find(row => row.armyId === paused)?.blocker).toContain('Paused');
    issue(state, { ...command, theaterId: 'theater.1', armyIds: command.armyIds.filter(id => id !== active), enabled: false });
    const pausedRoutes = structuredClone(state.routes); run(state); expect(state.routes).toEqual(pausedRoutes);
    issue(state, { type: 'deleteTheater', factionId: state.turnOwnerId, theaterId: 'theater.1' }); expect(state.routes).toEqual(pausedRoutes);
  });

  it('does not count paused incoming promises, but a paused army already at a hearth defends it', () => {
    const state = theaterCampaign(), command = config(state), [army] = command.armyIds;
    issue(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: army!, target: 500 });
    state.routes[army!]!.status = 'paused'; state.routes[army!]!.pauseReason = 'Interrupted';
    issue(state, command); run(state);
    expect(getObservation(state, state.turnOwnerId).theaters![0]!.hearths.find(row => row.cell === 500)).toMatchObject({ incoming: 1, deficit: 0 });
    state.armies[army!]!.cell = 500; refreshAuthoredSight(state);
    expect(getObservation(state, state.turnOwnerId).theaters![0]!.hearths.find(row => row.cell === 500)?.stationed).toBe(1);
  });

  it('keeps captured hearths saveable without leaking their current facts and prunes lost members', () => {
    const state = theaterCampaign(), command = config(state); issue(state, command);
    const lost = state.settlements[command.settlementIds[0]!]!; lost.factionId = state.factions[1]!.id; lost.name = 'Hidden changed name';
    delete state.armies[command.armyIds[0]!]; run(state);
    const row = getObservation(state, state.turnOwnerId).theaters![0]!.hearths[0]!;
    expect(row).toMatchObject({ available: false, cell: null, name: lost.id });
    expect(state.theaters[0]!.armyIds).not.toContain(command.armyIds[0]);
    // Ownership's broader land state is authored separately; theater validation itself remains legal.
    expect(getObservation(state, state.turnOwnerId).theaters![0]!.members.some(row => row.armyId === command.armyIds[0])).toBe(false);
  });

  it('bounds failed routing and rotates destinations so an inaccessible hearth cannot starve a reachable one', () => {
    const state = theaterCampaign(100), command = config(state);
    for (const cell of neighbors(500, state.world.width, state.world.height)) { state.world.terrain[cell] = 0; state.world.waterDepth[cell] = 1; }
    refreshAuthoredSight(state); issue(state, command); run(state);
    const observed = getObservation(state, state.turnOwnerId).theaters![0]!;
    expect(observed.lastDispatches).toHaveLength(MAX_THEATER_DISPATCHES);
    expect(observed.lastDispatches.some(row => !row.accepted)).toBe(true);
    expect(observed.hearths.find(row => row.cell === 510)?.incoming).toBe(1);
    expect(Object.values(state.routes)).toHaveLength(1);
    const firstIds = observed.lastDispatches.map(row => row.armyId); state.turn++; run(state);
    expect(state.theaters[0]!.lastDispatches.map(row => row.armyId)).not.toEqual(firstIds);
  });

  it('never automatically attacks a known enemy at the reserve and preserves hidden-state independence', () => {
    const state = theaterCampaign(), command = config(state), armyId = command.armyIds[0]!;
    const enemyId = `army.${state.nextId++}`;
    state.armies[enemyId] = { id: enemyId, factionId: state.factions[1]!.id, name: 'Enemy', cell: 494, movement: 3, formations: [createArmyFormation(enemyId, 'unit.guard')] };
    state.wars = [[state.turnOwnerId, state.factions[1]!.id]]; refreshAuthoredSight(state);
    issue(state, { ...command, armyIds: [armyId], reserveCell: 494 });
    // Own nonmembers satisfy both garrisons; the only delegate tries reserve.
    state.armies[command.armyIds[1]!]!.cell = 500; state.armies[command.armyIds[2]!]!.cell = 510; refreshAuthoredSight(state);
    run(state); expect(state.battle).toBeNull(); expect(state.theaters[0]!.lastDispatches[0]?.accepted).toBe(false);
    expect(state.armies[armyId]!.cell).toBe(495);
  });

  it('has reproducible allocation and serialized continuation across stable insertion orders', () => {
    fc.assert(fc.property(fc.integer({ min: 3, max: 20 }), count => {
      const state = theaterCampaign(count); issue(state, config(state));
      const other = deserializeGame(serializeGame(state)); other.armies = Object.fromEntries(Object.entries(other.armies).reverse());
      end(state); end(other); expect(stateHash(state)).toBe(stateHash(other));
      const restored = deserializeGame(serializeGame(state)); end(state); end(restored); expect(stateHash(state)).toBe(stateHash(restored));
    }), { numRuns: 8 });
  });
});
