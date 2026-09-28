import { describe, expect, it } from 'vitest';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameState } from './index';
import { advanceTheaters } from './theaters';
import { theaterCampaign } from '../../test-fixtures/src/theater-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';

function campaign(limit = 2) {
  const state = theaterCampaign(6), factionId = state.turnOwnerId, ids = Object.keys(state.armies).sort();
  state.armies[ids[0]!]!.cell = 500; state.armies[ids[1]!]!.cell = 510;
  const enemyId = `army.${state.nextId++}`;
  state.armies[enemyId] = { id: enemyId, factionId: state.factions[1]!.id, name: 'Authored visible raiders', cell: 501, movement: 3, formations: [createArmyFormation(enemyId, 'unit.guard')] };
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: state.factions[1]!.id }).ok).toBe(true);
  const command = { type: 'setTheater' as const, factionId, name: 'Responsive watch', settlementIds: Object.keys(state.settlements).sort(), armyIds: ids,
    reserveCell: 495, guardsPerSettlement: 1, reinforcementLimit: limit, enabled: true };
  expect(applyCommand(state, command)).toMatchObject({ ok: true });
  return { state, ids, enemyId, command };
}
const run = (state: GameState) => advanceTheaters(state, []);
const west = (state: GameState) => getObservation(state, state.turnOwnerId).theaters![0]!.hearths.find(row => row.cell === 500)!;

describe('threat-responsive theater reinforcement', () => {
  it('reinforces a fully staffed threatened hearth without stripping another physical garrison or direct orders', () => {
    const { state, ids } = campaign();
    expect(applyCommand(state, { type: 'setPosting', factionId: state.turnOwnerId, armyId: ids[2]!, cell: 495, mode: 'hold' }).ok).toBe(true);
    expect(applyCommand(state, { type: 'queueMovement', factionId: state.turnOwnerId, armyId: ids[3]!, target: 520 }).ok).toBe(true);
    state.routes[ids[3]!]!.status = 'paused'; state.routes[ids[3]!]!.pauseReason = 'Authored interrupted direct order.';
    const direct = structuredClone(state.routes[ids[3]!]!);
    expect(west(state)).toMatchObject({ required: 2, deficit: 1, reinforcement: { visibleEnemies: 1, extraGuards: 1 } });
    run(state);
    expect(state.armies[ids[0]!]!.cell).toBe(500); expect(state.armies[ids[1]!]!.cell).toBe(510);
    expect(state.routes[ids[2]!]).toBeUndefined(); expect(state.routes[ids[3]!]).toEqual(direct);
    expect(west(state)).toMatchObject({ stationed: 1, incoming: 1, required: 2, deficit: 0 });
    const routes = structuredClone(state.routes); run(state); expect(state.routes).toEqual(routes);
    expect(state.battle).toBeNull();
  });

  it('holds the extra guard target through one quiet allocation, then permits surplus to return to reserve', () => {
    const { state, ids, enemyId } = campaign(); run(state);
    const dispatched = state.theaters[0]!.lastDispatches.find(row => row.accepted && row.targetCell === 500)!;
    state.armies[dispatched.armyId]!.cell = 500; state.armies[dispatched.armyId]!.movement = 3; delete state.routes[dispatched.armyId];
    state.armies[enemyId]!.cell = 1200; refreshAuthoredSight(state);
    state.turn++; run(state);
    expect(west(state)).toMatchObject({ required: 2, stationed: 2, reinforcement: { visibleEnemies: 0, extraGuards: 1 } });
    expect(state.routes[dispatched.armyId]).toBeUndefined();
    state.turn++; run(state);
    expect(west(state).required).toBe(1);
    expect([ids[0]!, dispatched.armyId].some(id => state.routes[id]?.waypoints.at(-1) === 495 || state.armies[id]!.cell === 495)).toBe(true);
    expect(west(state).stationed).toBe(1);
  });

  it('is opt-in and counts only visible wartime combat land armies within three hexes', () => {
    const { state, enemyId, command } = campaign(0); run(state); expect(west(state).required).toBe(1);
    expect(applyCommand(state, { ...command, theaterId: state.theaters[0]!.id, reinforcementLimit: 4 }).ok).toBe(true);
    state.wars = []; expect(west(state).required).toBe(1);
    state.wars = [[state.turnOwnerId, state.factions[1]!.id]];
    state.armies[enemyId]!.formations = [createArmyFormation(enemyId, 'unit.colonist')]; expect(west(state).required).toBe(1);
    state.armies[enemyId]!.formations = [createArmyFormation(enemyId, 'unit.guard')];
    state.armies[enemyId]!.cell = 1200; refreshAuthoredSight(state);
    const before = getObservation(state, state.turnOwnerId).theaters;
    expect(getObservation(state, state.turnOwnerId).armies.some(army => army.id === enemyId)).toBe(false);
    const hiddenTwin = deserializeGame(serializeGame(state));
    state.armies[enemyId]!.name = 'Hidden renamed force'; state.armies[enemyId]!.formations[0]!.strength = 1;
    expect(getObservation(state, state.turnOwnerId).theaters).toEqual(before);
    run(state); run(hiddenTwin); expect(west(state).required).toBe(1);
    expect(state.routes).toEqual(hiddenTwin.routes); expect(state.theaters).toEqual(hiddenTwin.theaters);
  });

  it('caps demand, preserves the quiet hold through saves, and clamps it when explicitly lowering or disabling policy', () => {
    const { state, enemyId, command } = campaign(2);
    for (let i = 0; i < 5; i++) { const id = `army.${state.nextId++}`; state.armies[id] = { ...structuredClone(state.armies[enemyId]!), id, formations: [createArmyFormation(id, 'unit.guard')] }; }
    refreshAuthoredSight(state); run(state);
    expect(west(state)).toMatchObject({ required: 3, reinforcement: { visibleEnemies: 6, extraGuards: 2 } });
    const restored = deserializeGame(serializeGame(state));
    expect(stateHash(restored)).toBe(stateHash(state));
    for (const game of [state, restored]) {
      for (const army of Object.values(game.armies)) if (army.factionId !== game.turnOwnerId) army.cell = 1200;
      refreshAuthoredSight(game); game.turn++; run(game);
    }
    expect(stateHash(restored)).toBe(stateHash(state)); expect(west(state).required).toBe(3);
    expect(applyCommand(state, { ...command, theaterId: state.theaters[0]!.id, reinforcementLimit: 1 }).ok).toBe(true);
    expect(west(state).required).toBe(2);
    expect(applyCommand(state, { ...command, theaterId: state.theaters[0]!.id, enabled: false }).ok).toBe(true);
    expect(state.theaters[0]!.reinforcementHolds).toEqual([]); expect(west(state).required).toBe(1);
  });
});
