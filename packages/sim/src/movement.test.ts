import { createArmyFormation } from './army-composition';
import { describe, expect, it } from 'vitest';
import { rebaseAuthoredLand } from '../../test-fixtures/src/authored-land';
import { checksum, UNITS } from '@theandril/content';
import { deriveBiomes } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getMovementQuery, getObservation, MAX_PATH_NODES, replayGame, serializeGame, stateHash } from './index';
import type { GameCommand, GameState, MovementRoute } from './index';
import { rebuildIndexes } from './visibility';
import { recordWar } from './diplomacy';

const factionId = 'faction.ashen_compact'; const rival = 'faction.reedbound_council'; const armyId = 'army.2';
const end: GameCommand = { type: 'endTurn', factionId };
const issue = (state: GameState, command: GameCommand): void => { expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true }); };
const reject = (state: GameState, command: unknown): void => { const hash = stateHash(state); expect(applyCommand(state, command).ok).toBe(false); expect(stateHash(state)).toBe(hash); };
function field(war = false): GameState {
  const state = createGame({ seed: 88, size: 'tiny', factionCount: 2, pace: 'short' });
  state.world.terrain.fill(1); state.world.waterDepth.fill(0); state.world.fertility.fill(75); state.world.biome = deriveBiomes(state.world.seed, state.world.width, state.world.height, state.world.terrain, state.world.generatorVersion);
  delete state.armies['army.1']; delete state.armies['army.3'];
  const guard = UNITS.find(unit => unit.id === 'unit.guard')!;
  for (const [id, cell] of [[armyId, 100], ['army.4', 1500]] as const) Object.assign(state.armies[id]!, { formations: [createArmyFormation(id, guard.id)], name: guard.name, movement: guard.movement, cell });
  state.explored[factionId] = new Set(state.world.terrain.keys());
  if (war) { state.wars = [[factionId, rival]]; recordWar(state, factionId, rival); }
  rebuildIndexes(state); return deserializeGame(serializeGame(state));
}
const queue = (target: number, append?: boolean): GameCommand => ({ type: 'queueMovement', factionId, armyId, target, ...(append === undefined ? {} : { append }) });

describe('bounded observation movement and immediate travel', () => {
  it('matches multi-hex movement costs and exploration to the exact adjacent command sequence', () => {
    const state = field(); const initial = serializeGame(state); const view = getObservation(state, factionId);
    const query = getMovementQuery(view, armyId, 103);
    expect(query.preview).toMatchObject({ path: [101, 102, 103], cost: 3, canMoveNow: true, action: 'move' });
    expect(query.reachable).toContainEqual({ cell: 103, cost: 3 }); expect(query.expandedNodes).toBeLessThanOrEqual(MAX_PATH_NODES);
    const mirrored = deserializeGame(initial);
    for (const target of query.preview!.path) issue(mirrored, { type: 'move', factionId, armyId, target });
    issue(state, { type: 'moveTo', factionId, armyId, target: 103 });
    expect(stateHash(state)).toBe(stateHash(mirrored));
    const before = stateHash(state); query.reachable.length = 0; query.preview!.path.length = 0; expect(stateHash(state)).toBe(before);
  });

  it('rejects unaffordable, malformed, impassable, unknown and enemy-owned orders atomically', () => {
    const state = field();
    reject(state, { type: 'moveTo', factionId, armyId, target: 110 });
    reject(state, { type: 'moveTo', factionId: rival, armyId, target: 101 });
    reject(state, { ...queue(110), waiveCost: true }); reject(state, queue(99999));
    reject(state, { type: 'cancelMovement', factionId, armyId }); reject(state, { type: 'resumeMovement', factionId, armyId });
    state.world.terrain[101] = 0;
    reject(state, { type: 'moveTo', factionId, armyId, target: 101 });
    expect(getMovementQuery(getObservation(state, factionId), armyId, 101).preview?.canQueue).toBe(false);
    state.explored[factionId]?.delete(1200);
    reject(state, queue(1200));
  });

  it('uses weighted paths and stable tie breaking without consulting hidden occupants', () => {
    const first = field(); first.world.terrain[101] = 2;
    const second = deserializeGame(serializeGame(first)); second.armies['army.4']!.cell = 109; rebuildIndexes(second);
    const before = getMovementQuery(getObservation(first, factionId), armyId, 110);
    const after = getMovementQuery(getObservation(second, factionId), armyId, 110);
    expect(before).toEqual(after); expect(before.preview?.path).toEqual(getMovementQuery(getObservation(first, factionId), armyId, 110).preview?.path);
    expect(before.expandedNodes).toBeLessThanOrEqual(MAX_PATH_NODES);
  });

  it('approaches a visible hostile then starts the real field battle, without automatic war', () => {
    const state = field(); state.armies['army.4']!.cell = 103;
    // An allied observer reveals the selected target beyond the moving guard's own sight.
    const scout = UNITS.find(unit => unit.id === 'unit.scout')!; const id = `army.${state.nextId++}`;
    state.armies[id] = { ...state.armies[armyId]!, id, cell: 55, movement: scout.movement, formations: [createArmyFormation(id, scout.id)] };
    rebuildIndexes(state);
    reject(state, { type: 'moveTo', factionId, armyId, target: 103 });
    issue(state, { type: 'declareWar', factionId, targetFactionId: rival });
    const query = getMovementQuery(getObservation(state, factionId), armyId, 103);
    expect(query.preview).toMatchObject({ action: 'attack', canMoveNow: true, cost: 3 }); expect(query.reachable).toContainEqual({ cell: 103, cost: 3 });
    reject(state, queue(103));
    issue(state, { type: 'moveTo', factionId, armyId, target: 103 });
    expect(state.armies[armyId]?.cell).toBe(102); expect(state.battle).toMatchObject({ attackerId: armyId, defenderId: 'army.4', attackerCell: 102, defenderCell: 103 });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('cannot enter a hostile settlement through click travel or bypass its siege', () => {
    const state = field(true); state.armies['army.4']!.cell = 102;
    const id = `settlement.${state.nextId++}`;
    state.settlements[id] = { id, factionId: rival, founderFactionId: rival, name: 'Closed hearth', cell: 102, population: 1, food: 0, buildings: [], queue: [], devastation: 0, occupationTurns: 0 };
    rebuildIndexes(state);
    expect(getMovementQuery(getObservation(state, factionId), armyId, 102).preview).toMatchObject({ action: 'besiege', canMoveNow: false, canQueue: false });
    reject(state, { type: 'moveTo', factionId, armyId, target: 102 }); reject(state, queue(102));
    expect(state.battle).toBeNull(); expect(state.sieges).toEqual({});
  });
});

describe('persistent queued travel and interruptions', () => {
  it('spends current movement then resumes saved steps on later turns with replay parity', () => {
    const state = field(); const initial = serializeGame(state); const commands: GameCommand[] = [queue(110), end, end, end];
    issue(state, commands[0]!); expect(state.armies[armyId]).toMatchObject({ cell: 103, movement: 0 });
    expect(state.routes[armyId]).toMatchObject({ origin: 103, waypoints: [110], path: [104, 105, 106, 107, 108, 109, 110], status: 'active' });
    const resumed = deserializeGame(serializeGame(state));
    for (const command of commands.slice(1)) { issue(state, command); issue(resumed, command); }
    expect(state.armies[armyId]?.cell).toBe(110); expect(state.routes[armyId]).toBeUndefined();
    expect(stateHash(state)).toBe(stateHash(resumed)); expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
  });

  it('appends waypoints, rejects duplicates, keeps route records private and supports cancellation', () => {
    const state = field(); issue(state, queue(110)); issue(state, queue(116, true));
    expect(state.routes[armyId]?.waypoints).toEqual([110, 116]); reject(state, queue(116, true));
    expect(getMovementQuery(getObservation(state, factionId), armyId, 118, { append: true }).preview?.path.at(-1)).toBe(118);
    expect(getObservation(state, rival).routes).toEqual([]);
    const observation = getObservation(state, factionId); const hash = stateHash(state); observation.routes[0]!.path.length = 0; expect(stateHash(state)).toBe(hash);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(hash);
    issue(state, { type: 'cancelMovement', factionId, armyId }); expect(state.routes[armyId]).toBeUndefined();
  });

  it('pauses immediately when new local hostiles become visible, even on the last movement point', () => {
    const state = field(true); state.armies['army.4']!.cell = 108; rebuildIndexes(state);
    issue(state, queue(110)); expect(state.routes[armyId]?.status).toBe('active'); issue(state, end);
    expect(state.armies[armyId]).toMatchObject({ cell: 106, movement: 0 });
    expect(state.routes[armyId]).toMatchObject({ status: 'paused', origin: 106 }); expect(state.events.some(event => event.type === 'movement_paused')).toBe(true);
    const held = state.armies[armyId]!.cell; issue(state, end); expect(state.armies[armyId]!.cell).toBe(held);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    issue(state, { type: 'resumeMovement', factionId, armyId });
    expect(state.armies[armyId]!.cell).not.toBe(108); // Resume replans around the observed enemy; it never attacks automatically.
    expect(state.battle).toBeNull();
  });

  it('revalidates occupation after another faction acts rather than marching through it', () => {
    const state = field(); issue(state, queue(110));
    state.armies['army.4']!.cell = 104; rebuildIndexes(state);
    const initial = serializeGame(state); issue(state, end);
    expect(state.armies[armyId]?.cell).toBe(103); expect(state.routes[armyId]).toMatchObject({ status: 'paused', pauseReason: 'Another faction now blocks the next step.' });
    expect(stateHash(replayGame(initial, [end]))).toBe(stateHash(state));
  });

  it('pauses for a newly imposed friendly-town blockade even when the enemy was already known', () => {
    const state = field(true); state.armies['army.4']!.cell = 105;
    const id = `settlement.${state.nextId++}`;
    state.settlements[id] = { id, factionId, founderFactionId: factionId, name: 'Road hearth', cell: 104, population: 1, food: 0, buildings: [], queue: [], devastation: 0, occupationTurns: 0 };
    rebaseAuthoredLand(state); issue(state, queue(104));
    if (state.routes[armyId]?.status === 'paused') issue(state, { type: 'resumeMovement', factionId, armyId });
    expect(state.routes[armyId]?.status).toBe('active');
    issue(state, { type: 'besiege', factionId: rival, armyId: 'army.4', settlementId: id });
    issue(state, end);
    expect(state.armies[armyId]?.cell).toBe(103); expect(state.routes[armyId]?.pauseReason).toBe('The next settlement is under blockade.');
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('rejects an unsaveable hostile-memory overflow before accepting a queued order', () => {
    const state = field(true); state.armies['army.4']!.cell = 102;
    for (let count = 0; count < 4096; count++) { const id = `army.${state.nextId++}`; state.armies[id] = { ...state.armies['army.4']!, id, formations: [createArmyFormation(id, 'unit.guard')] }; }
    rebuildIndexes(state);
    reject(state, queue(110)); expect(state.routes).toEqual({});
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('pauses an attacked traveler and preserves a retreat-displaced route for explicit resumption', () => {
    const state = field(true); issue(state, queue(110));
    state.armies['army.4']!.cell = 104; rebuildIndexes(state);
    issue(state, { type: 'attack', factionId: rival, armyId: 'army.4', targetArmyId: armyId });
    expect(state.routes[armyId]).toMatchObject({ status: 'paused', pauseReason: 'The army is engaged in battle.' });
    issue(state, { type: 'battleOrder', factionId, order: 'withdraw' });
    const army = state.armies[armyId]; expect(army).toBeDefined(); expect(army?.cell).not.toBe(103);
    expect(state.routes[armyId]?.status).toBe('paused'); expect(state.routes[armyId]?.origin).toBe(103);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('lets a successful manual step replace a route without changing legacy move notifications', () => {
    const state = field(); state.armies[armyId]!.movement = 0; issue(state, queue(110));
    state.armies[armyId]!.movement = 3;
    issue(state, { type: 'move', factionId, armyId, target: 101 });
    expect(state.routes[armyId]).toBeUndefined(); expect(state.events.at(-1)?.type).toBe('army_moved');
  });
});

describe('strict saved routes', () => {
  interface Save { state: { routes: MovementRoute[]; world: { biome: number[]; generatorVersion: number } }; stateChecksum: string }
  it.each([
    ['unknown army', (save: Save) => { save.state.routes[0]!.armyId = 'army.99999'; }],
    ['nonadjacent step', (save: Save) => { save.state.routes[0]!.path[0] = 1400; }],
    ['wrong waypoint', (save: Save) => { save.state.routes[0]!.waypoints[0] = 1200; }],
    ['invalid active origin', (save: Save) => { save.state.routes[0]!.origin = 104; }],
    ['missing pause reason', (save: Save) => { save.state.routes[0]!.status = 'paused'; }],
    ['unknown biome', (save: Save) => { save.state.world.biome[0] = 90; }],
    ['water biome on land', (save: Save) => { save.state.world.biome[100] = 0; }],
    ['wrong biome dimensions', (save: Save) => { save.state.world.biome.pop(); }],
    ['unknown generator', (save: Save) => { save.state.world.generatorVersion = 99; }],
  ] as const)('rejects %s even when the checksum is recomputed', (_name, mutate) => {
    const state = field(); issue(state, queue(110)); const save: Save = JSON.parse(serializeGame(state)); mutate(save); save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });
});
