import { afterEach, expect, test, vi } from 'vitest';
import * as mapgen from '@theandril/mapgen';
import { createGame, getObservation, stateHash } from '@theandril/sim';
import { navalCampaign } from '../../test-fixtures/src/naval-fixture';
import { createNavigation, MAX_FRONTIER_NODES } from './navigation';

// Frozen pre-optimization algorithm captured directly from navigation.ts before
// this change. Its independent limits, order and counters are a behavioral oracle;
// do not rewrite it to match future optimization changes.
import { hexDistance, isPassable, neighbors, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import { getMovementQuery, type Observation } from '@theandril/sim';

type ObservedArmy = Observation['armies'][number];
const HISTORICAL_MAX_FRONTIER_NODES = 8192;
const MAX_ARMY_FRONTIER_NODES = 1024;
const costOf = (terrain: number): number => terrain === 2 || terrain === 3 ? 2 : 1;

/** Shared per-plan knowledge and work budget. Never reads a canonical world or hidden occupants. */
function createHistoricalNavigation(view: Observation) {
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const occupied = new Set([...view.armies, ...view.settlements].filter(entity => entity.factionId !== view.factionId).map(entity => entity.cell));
  // A batch can reveal previously remembered enemies between proposals. Prove each immediate
  // journey through currently visible ground, so those revelations cannot invalidate its cost.
  const travelView = { ...view, cells: view.cells.filter(cell => cell.visible) };
  const gains = new Map<string, number>();
  let expandedNodes = 0;
  const canEnter = (army: ObservedArmy, cell: number): boolean => {
    const known = cells.get(cell);
    return Boolean(known && !army.carrierId && !occupied.has(cell) && (army.domain === 'naval'
      ? known.terrain === TERRAIN.water && (known.waterDepth === WATER_DEPTH.shallow || known.waterDepth === WATER_DEPTH.deep && army.canEnterDeepWater)
      : isPassable(known.terrain)));
  };
  const informationGain = (cell: number, sight: number): number => {
    const key = cell + ':' + sight;
    const cached = gains.get(key); if (cached !== undefined) return cached;
    const row = Math.floor(cell / view.width); const column = cell % view.width;
    let gain = 0;
    for (let y = Math.max(0, row - sight); y <= Math.min(view.height - 1, row + sight); y++) {
      for (let x = Math.max(0, column - sight); x <= Math.min(view.width - 1, column + sight); x++) {
        const next = y * view.width + x;
        if (!cells.has(next) && hexDistance(cell, next, view.width) <= sight) gain++;
      }
    }
    gains.set(key, gain); return gain;
  };
  const frontierStep = (army: ObservedArmy, claimed: Set<number>): number | undefined => {
    // Integer edge costs permit deterministic cost buckets without an unbounded sorted frontier.
    const costs = new Map([[army.cell, 0]]); const parents = new Map<number, number>();
    const buckets: number[][] = [[army.cell]];
    let localNodes = 0;
    for (let distance = 0; distance < buckets.length; distance++) for (const cell of buckets[distance] ?? []) {
      if (costs.get(cell) !== distance) continue;
      if (expandedNodes >= HISTORICAL_MAX_FRONTIER_NODES || localNodes >= MAX_ARMY_FRONTIER_NODES) return undefined;
      expandedNodes++; localNodes++;
      if (cell !== army.cell && neighbors(cell, view.width, view.height).some(next => !cells.has(next))) {
        const path: number[] = []; let cursor = cell;
        while (cursor !== army.cell) { path.push(cursor); cursor = parents.get(cursor)!; }
        path.reverse();
        return path.filter(next => (costs.get(next) ?? Infinity) <= army.movement && !claimed.has(next)).at(-1);
      }
      for (const next of neighbors(cell, view.width, view.height)) {
        if (!canEnter(army, next)) continue;
        const cost = distance + costOf(cells.get(next)!.terrain);
        if (cost >= (costs.get(next) ?? Infinity)) continue;
        costs.set(next, cost); parents.set(next, cell); (buckets[cost] ??= []).push(next);
      }
    }
    return undefined;
  };
  return {
    get expandedNodes() { return expandedNodes; },
    informationGain,
    destination(army: ObservedArmy, sight: number, claimed: Set<number>, strategicScore?: (cell: number) => number): number | undefined {
      if (army.carrierId || army.movementBlocker) return undefined;
      const range = getMovementQuery(travelView, army.id).reachable.filter(item => canEnter(army, item.cell) && !claimed.has(item.cell));
      const candidates = range.map(item => ({ ...item, gain: informationGain(item.cell, sight), strategic: strategicScore?.(item.cell) ?? 0 }));
      // Stable per-army tie breaking spreads scouts without changing their objective each turn.
      let salt = 0; for (let i = 0; i < army.id.length; i++) salt = Math.imul(salt, 31) + army.id.charCodeAt(i) | 0;
      const tie = (cell: number): number => (Math.imul(cell + 1, 1103515245) ^ salt) >>> 0;
      candidates.sort((a, b) => (b.strategic + b.gain * 100) - (a.strategic + a.gain * 100) || b.cost - a.cost || tie(a.cell) - tie(b.cell) || a.cell - b.cell);
      const best = candidates[0];
      if (!best) return undefined;
      if (strategicScore || best.gain > 0) return best.cell;
      const step = frontierStep(army, claimed);
      if (range.some(item => item.cell === step)) return step;
      // The long frontier path may extend outside current sight; approach it by a proved step.
      if (step !== undefined) return candidates.sort((a, b) => hexDistance(a.cell, step, view.width) - hexDistance(b.cell, step, view.width) || a.cost - b.cost || a.cell - b.cell)[0]?.cell;
      return undefined;
    },
  };
}

afterEach(() => vi.restoreAllMocks());

function compareSequence(view: Observation, attempts: { army: ObservedArmy; sight: number; strategic?: (cell: number) => number }[]) {
  const before = JSON.stringify(view), current = createNavigation(view), historical = createHistoricalNavigation(view);
  const claimed = new Set<number>(), destinations: (number | undefined)[] = [], counts: number[] = [];
  for (const [index, attempt] of attempts.entries()) {
    const a: number[] = [], b: number[] = [];
    const actual = current.destination(attempt.army, attempt.sight, claimed, attempt.strategic ? cell => { a.push(cell); return attempt.strategic!(cell); } : undefined);
    const expected = historical.destination(attempt.army, attempt.sight, claimed, attempt.strategic ? cell => { b.push(cell); return attempt.strategic!(cell); } : undefined);
    expect(actual, `destination at attempt ${index}`).toBe(expected);
    expect(a).toEqual(b);
    expect(current.expandedNodes, `node counter at attempt ${index}`).toBe(historical.expandedNodes);
    expect(current.informationGain(attempt.army.cell, attempt.sight)).toBe(historical.informationGain(attempt.army.cell, attempt.sight));
    destinations.push(actual); counts.push(current.expandedNodes);
    // Later attempts have different reservations; no whole-result memo is valid.
    if (actual !== undefined) claimed.add(actual);
    if (index % 3 === 2) claimed.clear();
  }
  expect(JSON.stringify(view)).toBe(before);
  return { destinations, counts };
}

/** An observation-only topology fixture, not an authored campaign outcome.
 * The complete army shape comes from the real read model; only its observed
 * location and the finite known/visible grid are varied to isolate searches. */
function gridView(width: number, height: number, origin: number,
  known = (_cell: number) => true, terrain = (_cell: number) => 1, visible = (_cell: number) => true): Observation {
  const base = getObservation(createGame({ seed: 74, size: 'tiny', factionCount: 2 }), 'faction.ashen_compact');
  const scout = base.armies.find(army => army.factionId === base.factionId && army.unitId === 'unit.scout')!;
  return { ...base, width, height, armies: [{ ...scout, cell: origin, movement: 3 }], settlements: [], routes: [], sieges: [],
    cells: Array.from({ length: width * height }, (_, cell) => cell).filter(known).map(cell => {
      const relief = terrain(cell);
      return { cell, terrain: relief, biome: relief === 0 ? 0 : 1, waterDepth: relief === 0 ? 1 : 0, fertility: 50, visible: visible(cell) };
    }) };
}

test.each([74, 99, 748291])('matches genuine generated observations and changing destination reservations for seed%i', seed => {
  const state = createGame({ seed, size: 'tiny', factionCount: 4 }), hash = stateHash(state);
  const view = getObservation(state, state.turnOwnerId), own = view.armies.filter(army => army.factionId === view.factionId);
  const attempts = Array.from({ length: 4 }, () => own.map(army => ({ army, sight: army.sight }))).flat();
  expect(compareSequence(view, attempts).destinations.some(cell => cell !== undefined)).toBe(true);
  expect(stateHash(state)).toBe(hash);
});

test('preserves land, coastal and ocean entry distinctions, occupied hexes and blocked or carried armies', () => {
  const state = navalCampaign(), hash = stateHash(state), view = getObservation(state, state.turnOwnerId);
  // Two otherwise identical ship observations isolate capability in the shared
  // cache; an entry cached for a coastal hull must not grant or remove deep access.
  const fleet = view.armies.find(army => army.factionId === view.factionId && army.domain === 'naval')!;
  view.armies.push({ ...fleet, id: 'army.800', canEnterDeepWater: true }, { ...fleet, id: 'army.801', carrierId: fleet.id }, { ...fleet, id: 'army.802', movementBlocker: 'Await an actual order.' });
  const own = view.armies.filter(army => army.factionId === view.factionId);
  const attempts = [...own, ...[...own].reverse()].map(army => ({ army, sight: army.sight, strategic: (cell: number) => -hexDistance(cell, 786, view.width) * 100 }));
  const { destinations } = compareSequence(view, attempts);
  for (const [index, attempt] of attempts.entries()) {
    if (attempt.army.carrierId || attempt.army.movementBlocker) expect(destinations[index]).toBeUndefined();
    if (destinations[index] !== undefined) expect(view.armies.filter(army => army.factionId !== view.factionId).map(army => army.cell)).not.toContain(destinations[index]);
  }
  expect(stateHash(state)).toBe(hash);
});

test.each([0, 23, 24, 47, 12 * 24, 12 * 24 + 1, 23 * 24, 24 * 24 - 1])('retains edge/parity/frontier ordering from origin%i', origin => {
  const width = 24, height = 24;
  const known = (cell: number) => hexDistance(origin, cell, width) <= 9;
  const visible = (cell: number) => hexDistance(origin, cell, width) <= 3;
  const view = gridView(width, height, origin, known, cell => cell === origin ? 1 : cell % 17 === 0 ? 4 : cell % 11 === 0 ? 0 : cell % 3 === 0 ? 3 : cell % 5 === 0 ? 2 : 1, visible);
  const army = view.armies[0]!;
  const { counts } = compareSequence(view, [
    { army, sight: 3 }, { army, sight: 4 }, { army, sight: 0 },
    { army, sight: 3, strategic: cell => cell % 7 }, { army, sight: 3, strategic: () => 0 },
  ]);
  expect(counts[0]).toBeGreaterThan(0);
});

test('keeps each1024-node army budget and the cumulative8192-node budget, even for repeated cached searches', () => {
  const width = 96, origin = 32 * width + 48;
  const view = gridView(width, 64, origin, undefined, undefined, cell => hexDistance(origin, cell, width) <= 3);
  const army = view.armies[0]!;
  const { destinations, counts } = compareSequence(view, Array.from({ length: 10 }, () => ({ army, sight: 0 })));
  expect(destinations).toEqual(Array.from({ length: 10 }, () => undefined));
  expect(counts).toEqual([1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192, 8192, 8192]);
  expect(counts.at(-1)).toBe(MAX_FRONTIER_NODES);
});

test('reuses topology only after real expansion, without skipping counters or eager whole-world neighbor work', () => {
  const width = 96, origin = 32 * width + 48;
  const view = gridView(width, 64, origin, undefined, undefined, cell => hexDistance(origin, cell, width) <= 3), army = view.armies[0]!;
  const calls = vi.spyOn(mapgen, 'neighbors');
  getMovementQuery({ ...view, cells: view.cells.filter(cell => cell.visible) }, army.id);
  const rangeCalls = calls.mock.calls.length;
  calls.mockClear();
  const navigation = createNavigation(view);
  expect(calls).not.toHaveBeenCalled();
  navigation.destination(army, 0, new Set());
  expect(navigation.expandedNodes).toBe(1024);
  expect(calls).toHaveBeenCalledTimes(rangeCalls + 1024);
  calls.mockClear();
  navigation.destination(army, 0, new Set());
  expect(navigation.expandedNodes).toBe(2048);
  expect(calls).toHaveBeenCalledTimes(rangeCalls);
});

test('retains oracle decisions when probes fill the bounded entry cache and later armies enter new regions', () => {
  const width = 192, height = 128, origin = 24 * width + 24;
  const view = gridView(width, height, origin);
  const template = view.armies[0]!;
  view.armies = Array.from({ length: 10 }, (_, index) => ({ ...template, id: `army.${900 + index}`, cell: (24 + Math.floor(index / 4) * 40) * width + 24 + (index % 4) * 44 }));
  const { counts } = compareSequence(view, view.armies.map(army => ({ army, sight: 0 })));
  expect(counts.at(-1)).toBe(MAX_FRONTIER_NODES);
});
