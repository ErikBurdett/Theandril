import { performance } from 'node:perf_hooks';
import { UNITS } from '@theandril/content';
import { isPassable, neighbors, type MapSize } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getMovementQuery, getObservation, MAX_PATH_NODES, serializeGame, stateHash, type GameCommand } from '@theandril/sim';

function distribution(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * 0.95)], maxMs: sorted.at(-1) };
}

/** Setup only: find a connected destination eighteen edges away, outside the timed work. */
function destination(origin: number, terrain: Uint8Array, width: number, height: number): number {
  const visited = new Set([origin]); const pending = [{ cell: origin, depth: 0 }];
  for (let index = 0; index < pending.length; index++) {
    const next = pending[index]!;
    if (next.depth === 18) return next.cell;
    for (const cell of neighbors(next.cell, width, height)) {
      if (visited.has(cell) || !isPassable(terrain[cell] ?? 0)) continue;
      visited.add(cell); pending.push({ cell, depth: next.depth + 1 });
    }
  }
  throw new Error('Movement benchmark lacks a connected long route.');
}

export function benchmarkMovement() {
  return (['huge', 'legendary'] satisfies MapSize[]).map(size => {
    let game = createGame({ seed: 20260905, size, factionCount: 2 });
    const player = game.turnOwnerId;
    const scout = Object.values(game.armies).find(army => army.factionId === player && army.formations.some(item => item.unitId === 'unit.scout'));
    if (!scout) throw new Error('No benchmark scout.');
    // Explicitly synthetic fully explored information, not an omniscient gameplay API.
    game.explored[player] = new Set(Array.from({ length: game.world.terrain.length }, (_, cell) => cell));
    game.factions[0]!.treasury = 1_000_000;
    game = deserializeGame(serializeGame(game));
    const target = destination(scout.cell, game.world.terrain, game.world.width, game.world.height);
    const observationStart = performance.now();
    const view = getObservation(game, player);
    const fullObservationMs = performance.now() - observationStart;
    const coldStart = performance.now();
    const cold = getMovementQuery(view, scout.id, target);
    const coldQueryMs = performance.now() - coldStart;
    if (!cold.preview?.canQueue) throw new Error('Movement benchmark route rejected: ' + cold.preview?.blocker);
    const ranges: number[] = []; const paths: number[] = [];
    for (let index = 0; index < 140; index++) {
      const start = performance.now(); getMovementQuery(view, scout.id);
      const rangeMs = performance.now() - start;
      const pathStart = performance.now();
      const next = getMovementQuery(view, scout.id, target);
      if (JSON.stringify(next) !== JSON.stringify(cold)) throw new Error('Movement preview is nondeterministic.');
      const pathMs = performance.now() - pathStart;
      if (index >= 20) { ranges.push(rangeMs); paths.push(pathMs); }
    }
    const longStart = performance.now();
    const capped = getMovementQuery(view, scout.id, game.world.starts[1]);
    const farQueryMs = performance.now() - longStart;
    if (cold.expandedNodes > MAX_PATH_NODES || capped.expandedNodes > MAX_PATH_NODES) throw new Error('Movement query exceeded the node budget.');

    // 512 queued guards exercise shared destination/stack pressure and saved travel.
    const guard = UNITS.find(unit => unit.id === 'unit.guard')!;
    const guards: string[] = [];
    for (let index = 0; index < 512; index++) {
      const id = `army.${game.nextId++}`; guards.push(id);
      game.armies[id] = { id, factionId: player, name: guard.name, cell: scout.cell, movement: guard.movement, formations: [createArmyFormation(id, guard.id)] };
    }
    game = deserializeGame(serializeGame(game));
    const queueStart = performance.now();
    for (const armyId of guards) {
      const result = applyCommand(game, { type: 'queueMovement', factionId: player, armyId, target });
      if (!result.ok) throw new Error('Queued workload rejected: ' + result.error);
    }
    const queue512Ms = performance.now() - queueStart;
    const saved = serializeGame(game); const mirror = deserializeGame(saved);
    const turnTimes: number[] = []; const travelTimes: number[] = []; const activeTravelTimes: number[] = [];
    for (let turn = 0; turn < 20; turn++) {
      let travelStart = 0; let travelMs = 0;
      const active = Object.values(game.routes).some(route => route.status === 'active');
      const command: GameCommand = { type: 'endTurn', factionId: player };
      const start = performance.now();
      const result = applyCommand(game, command, (phase, edge) => {
        if (phase === 'travel' && edge === 'start') travelStart = performance.now();
        if (phase === 'travel' && edge === 'end') travelMs += performance.now() - travelStart;
      });
      turnTimes.push(performance.now() - start); travelTimes.push(travelMs);
      if (active) activeTravelTimes.push(travelMs);
      if (!result.ok || JSON.stringify(applyCommand(mirror, command)) !== JSON.stringify(result)) throw new Error('Queued movement continuation diverged.');
      if (stateHash(game) !== stateHash(mirror)) throw new Error('Queued movement hash diverged.');
    }
    if (guards.some(id => game.armies[id]?.cell !== target) || Object.keys(game.routes).length) throw new Error('Queued benchmark did not finish all routes.');
    return { size, cells: game.world.terrain.length, explored: view.cells.length, fullObservationMs, coldQueryMs,
      range: distribution(ranges), route: distribution(paths), rangeCells: cold.reachable.length,
      pathCells: cold.preview.path.length, pathCost: cold.preview.cost, expandedNodes: cold.expandedNodes,
      farQueryMs, farQueryLimited: capped.limited, farQueryNodes: capped.expandedNodes,
      queuedArmies: guards.length, queue512Ms, fullEndTurn: distribution(turnTimes), travelPhase: distribution(travelTimes),
      activeTravelPhase: distribution(activeTravelTimes),
      savedRouteBytes: Buffer.byteLength(saved), resumedTurnsVerified: 20, finalHash: stateHash(game),
      note: 'Synthetic fully explored two-faction world, cached observation previews; 512 guards begin stacked and share an eighteen-edge destination. No hostile intervention or AI in this workload. Query timing includes result-equality check; end-turn timing excludes separate mirror/hash checks. Path limit is measured separately from successful local route. No archive/save time in turn timings.' };
  });
}
