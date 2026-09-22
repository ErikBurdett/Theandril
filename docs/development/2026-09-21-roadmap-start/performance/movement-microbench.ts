import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { createGame, getMovementQuery, getObservation, type Observation } from '@theandril/sim';

interface MovementQueryCase { name: string; view: Observation; armyId: string; target?: number; append?: boolean }

/** Synthetic detached charts for exact path-query equivalence, not campaign pacing evidence. */
function movementQueryCorpus(): MovementQueryCase[] {
  const initial = createGame({ seed: 748291, size: 'tiny', factionCount: 2 });
  const source = getObservation(initial, initial.turnOwnerId);
  const guard = source.armies.find(army => army.factionId === source.factionId && army.canAttack)!;
  const width = 128, origin = 64 * width + 32;
  const chart = (): Observation => ({ ...structuredClone(source), width, height: 128, settlements: [], routes: [], sieges: [], wars: [],
    armies: [{ ...structuredClone(guard), cell: origin, movement: 5 }],
    cells: Array.from({ length: width * 128 }, (_, cell) => ({ cell, terrain: 1, biome: 1, waterDepth: 0, fertility: 75, visible: true })),
  });
  const cases: MovementQueryCase[] = [];
  const add = (name: string, view: Observation, target?: number, append?: boolean): void => { cases.push({ name, view, armyId: guard.id, target, append }); };
  const plain = chart();
  add('open-range', plain);
  add('equal-cost-ties', plain, origin + 18);
  add('already-there', plain, origin);
  add('unknown-destination', plain, width * 128);
  const weighted = chart();
  for (const cell of weighted.cells) cell.terrain = cell.cell % 7 < 3 ? 2 : cell.cell % 11 < 4 ? 3 : 1;
  add('weighted-route', weighted, origin + 20);
  const roads = structuredClone(weighted);
  for (const cell of roads.cells) if (Math.floor(cell.cell / width) === 64) cell.roadMask = 9;
  add('roads-over-weighted-terrain', roads, origin + 20);
  const exhausted = chart(); exhausted.armies[0]!.movement = 0;
  add('exhausted-army', exhausted, origin + 18);
  const finite = chart(); finite.armies[0]!.movement = 2;
  add('finite-range-frontier', finite, origin + 18);
  const disconnected = chart();
  for (const cell of disconnected.cells) if (cell.cell % width === 64) cell.terrain = 4;
  add('route-node-budget', disconnected, 64 * width + 100);
  const largeRange = chart(); largeRange.armies[0]!.movement = 200;
  add('range-shares-preview-node-budget', largeRange, origin + 18);
  const fog = chart(); fog.cells = fog.cells.filter(cell => cell.cell % width < 36);
  add('unseen-route-gap', fog, origin + 18);
  const enemy = chart();
  enemy.armies.push({ ...structuredClone(guard), id: 'army.enemy', factionId: initial.factions[1]!.id, cell: origin + 3 });
  add('peaceful-army-blocker', enemy, origin + 3);
  const war = structuredClone(enemy); war.wars = [initial.factions[1]!.id];
  add('attack-destination', war, origin + 3);
  add('route-around-enemy', war, origin + 8);
  add('cannot-append-attack', war, origin + 3, true);
  const town = chart();
  town.settlements.push({ id: 'settlement.enemy', factionId: initial.factions[1]!.id, founderFactionId: initial.factions[1]!.id,
    name: 'Closed town', cell: origin + 3, population: 1, food: 0, buildings: [], queue: [], devastation: 0, occupationTurns: 0 });
  add('settlement-blocker', town, origin + 3);
  add('route-around-settlement', town, origin + 8);
  const route = chart();
  route.routes = [{ armyId: guard.id, origin, waypoints: [origin + 4], path: [origin + 1, origin + 2, origin + 3, origin + 4],
    status: 'active', pauseReason: null, knownHostileIds: [] }];
  add('append-waypoint', route, origin + width * 3 + 4, true);
  const paused = structuredClone(route); paused.routes[0]!.status = 'paused'; paused.routes[0]!.pauseReason = 'Known obstruction';
  add('append-paused-route', paused, origin + 5, true);
  const naval = chart(); naval.armies[0]!.domain = 'naval'; naval.armies[0]!.canEnterDeepWater = false;
  for (const cell of naval.cells) { cell.terrain = 0; cell.waterDepth = cell.cell % width < 36 ? 1 : 2; }
  add('coastal-fleet-range', naval, origin + 3);
  add('coastal-fleet-deep-blocker', naval, origin + 8);
  const ocean = structuredClone(naval); ocean.armies[0]!.canEnterDeepWater = true;
  add('ocean-fleet-route', ocean, origin + 18);
  return cases;
}


const cases = movementQueryCorpus();
const measurements = cases.map(item => {
  const read = () => getMovementQuery(item.view, item.armyId, item.target, { append: item.append });
  const first = JSON.stringify(read());
  const samples: number[] = [];
  for (let sample = -10; sample < 40; sample++) {
    const start = performance.now();
    const result = read();
    const elapsed = performance.now() - start;
    if (JSON.stringify(result) !== first) throw new Error('Query changed between identical reads: ' + item.name);
    if (sample >= 0) samples.push(elapsed);
  }
  samples.sort((a, b) => a - b);
  const final = read();
  return { name: item.name, sha256: createHash('sha256').update(first).digest('hex'), expandedNodes: final.expandedNodes,
    reachable: final.reachable.length, path: final.preview?.path.length ?? null, limited: final.limited,
    medianMs: samples[Math.floor(samples.length / 2)], p95Ms: samples[Math.floor(samples.length * .95)] };
});
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model,
  note: 'Synthetic detached128x128 charts. Ten warmups and40 measured reads per case; setup, equality checks and hashing excluded. Exact entire-query SHA256 includes reachable cells/costs, path, blockers, actions and expanded-node budget. No elapsed campaign, rendering or archive workload.', measurements }, null, 2));
