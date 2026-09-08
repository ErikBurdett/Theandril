import { expect, test } from 'vitest';
import { applyCommand, createGame, getMovementQuery, getObservation, stateHash } from '@theandril/sim';
import { hexDistance } from '@theandril/mapgen';
import { createNavigation, MAX_FRONTIER_NODES } from './navigation';

test('exploration scores the destination sight footprint, not its already-known immediate neighbors', () => {
  const state = createGame({ seed: 748291, size: 'standard', factionCount: 4, pace: 'long' });
  const view = getObservation(state, state.turnOwnerId);
  const scout = view.armies.find(army => army.unitId === 'unit.scout')!;
  const nav = createNavigation(view);
  const destination = nav.destination(scout, 4, new Set());
  expect(destination).toBeDefined();
  expect(nav.informationGain(destination!, 4)).toBeGreaterThan(0);
  expect(hexDistance(scout.cell, destination!, view.width)).toBeGreaterThan(1);
  const preview = getMovementQuery(view, scout.id, destination).preview;
  expect(preview).toMatchObject({ canMoveNow: true, action: 'move' });
  const before = state.explored[state.turnOwnerId]!.size;
  expect(applyCommand(state, { type: 'moveTo', factionId: view.factionId, armyId: scout.id, target: destination! }).ok).toBe(true);
  expect(state.explored[state.turnOwnerId]!.size).toBeGreaterThan(before);
});

test('navigation is detached, repeatable, movement-cost-aware and bounded across a whole faction plan', () => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 1 });
  const hash = stateHash(state); const view = getObservation(state, state.turnOwnerId);
  const scout = view.armies.find(army => army.unitId === 'unit.scout')!;
  const first = createNavigation(view).destination(scout, 4, new Set());
  expect(createNavigation(structuredClone(view)).destination(scout, 4, new Set())).toBe(first);
  expect(stateHash(state)).toBe(hash);
  const forestView = { ...view, armies: view.armies.map(army => ({ ...army, movement: 1 })), cells: view.cells.map(cell => ({ ...cell, terrain: 2 })) };
  const nav = createNavigation(forestView);
  expect(nav.destination(forestView.armies.find(army => army.id === scout.id)!, 4, new Set())).toBeUndefined();
  expect(nav.expandedNodes).toBeLessThanOrEqual(MAX_FRONTIER_NODES);
});

test('a public discovery bearing only breaks equal information gain, never replaces the frontier objective', () => {
  const state = createGame({ seed: 748291, size: 'standard', factionCount: 4, pace: 'long' });
  const view = getObservation(state, state.turnOwnerId), original = structuredClone(view), hash = stateHash(state);
  const scout = view.armies.find(army => army.unitId === 'unit.scout')!;
  const center = Math.floor(view.height / 2) * view.width + Math.floor(view.width / 2);
  const bearing = (cell: number) => -hexDistance(cell, center, view.width);
  const baseline = createNavigation(view), directed = createNavigation(view);
  const ordinary = baseline.destination(scout, scout.sight, new Set())!;
  const destination = directed.destination(scout, scout.sight, new Set(), undefined, bearing)!;
  expect(destination).toBeDefined();
  expect(directed.informationGain(destination, scout.sight)).toBe(baseline.informationGain(ordinary, scout.sight));
  expect(bearing(destination)).toBeGreaterThanOrEqual(bearing(ordinary));
  expect(createNavigation(structuredClone(view)).destination(scout, scout.sight, new Set(), undefined, bearing)).toBe(destination);
  expect(view).toEqual(original); expect(stateHash(state)).toBe(hash);
});
