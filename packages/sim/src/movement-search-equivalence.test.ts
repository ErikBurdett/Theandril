import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createGame, getMovementQuery, getObservation, MAX_PATH_NODES, type Observation } from './index';

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


// Captured before cost pruning on 2026-09-21, Node22.23.2. These fingerprints
// include all reachable costs, path ties, blockers, action flags and node counts.
// Original movement.ts SHA256:1921dc7560b362fae0d91b9f734799e163eef67302a43f613b4fcec894d0c60e.
const baseline: Record<string, string> = {
  "open-range": "9d31086ed9cdcbe8e408ecce8c59c00790c9c6867ae1ca1f15f50df804076e8d",
  "equal-cost-ties": "79312a83689f13110f8b7e28398cd1f768e4ddcf039937c197182253177bd17c",
  "already-there": "cc4b9f759f196401aa300aa45270fed09a255d9b901e0ecafa4ce4c7ddf0bfd4",
  "unknown-destination": "b65e2e94c7ad39d275339e3f8b57ccc487b84992fe3e4f591244fb5b5b7f4ab9",
  "weighted-route": "f91689801183ae696b99739eaedf2541ca0d7ab51ada0b117f9db61c4dd77d17",
  "roads-over-weighted-terrain": "0dcf99046e9f0013adbe91f4a006bd6f58f552d7a7d730c0d983bb9ed1adc6f1",
  "exhausted-army": "660e1d04175065cb6eb70c310acce5349dd44e7dad67b1a69f1df65537ead4e5",
  "finite-range-frontier": "049483e533757458899c59d15f16c3c1c594a28790307822980f77880047eadb",
  "route-node-budget": "f461bb2f4936c7f30bf0cb9641851fbea3a402c6f094bfb68ff2991502b07f8b",
  "range-shares-preview-node-budget": "df0d97ecbcddaa30ab954980cb2339b73938260d7bf0912284306f40e9e5ef37",
  "unseen-route-gap": "234bc431099680a68f897df6abff5a4f87b690c36c760afe2191b69a3b81b550",
  "peaceful-army-blocker": "a75c11f6d2556e2db8aecf312cfb0e6457ba9eb4ba6d7a7a3516d9779db996ae",
  "attack-destination": "157bb4ad83007710fc7e778986ce2b43b5daf1246ae5fff2261f874e05914d27",
  "route-around-enemy": "0c12712edf0adcc2e1c35b3aa6f4150b3c8921abebe37f8c94e67d56106c0c8a",
  "cannot-append-attack": "c9b4f0c9d8a960f4bba41b62f5b7931a91eaad805bab54abaf98bc172cb3481d",
  "settlement-blocker": "391f216fe259509f04c37c95daa9530b575bc958e28f51ce939b130fd1342a0f",
  "route-around-settlement": "a0bd38233a9872afdcffc8e1e290b36d39427a882f498105e3d61382d93a9819",
  "append-waypoint": "ae81db3ab90d95b217e4bd267dd2a01d66054ef9b5c7567631ed17115181a005",
  "append-paused-route": "ddfae7cb0f9f0e5aecdc1067ba7800ecc58b0a873fd7bf5f80568d7f60b2f21d",
  "coastal-fleet-range": "651bcf7b0d2dfb21b2b1b8ce0b0b0d512702e67ad6afb5781ff31a7ca09ddd8f",
  "coastal-fleet-deep-blocker": "021658bc366f0a44fd9df0b42f1e7f7dd23eee62689a2cc0ec829838bd11e30b",
  "ocean-fleet-route": "79312a83689f13110f8b7e28398cd1f768e4ddcf039937c197182253177bd17c"
};
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe('cost-pruned movement retains the historical search result', () => {
  const cases = movementQueryCorpus();
  it.each(cases)('$name preserves the entire query and shared node budget', item => {
    const query = getMovementQuery(item.view, item.armyId, item.target, { append: item.append });
    expect(query.expandedNodes).toBeLessThanOrEqual(MAX_PATH_NODES);
    expect(digest(query)).toBe(baseline[item.name]);
    expect(digest(getMovementQuery(structuredClone(item.view), item.armyId, item.target, { append: item.append }))).toBe(baseline[item.name]);
  });

  it('does not retain mutable army capabilities or caller-owned result arrays across queries', () => {
    const item = cases.find(item => item.name === 'equal-cost-ties')!;
    const view = structuredClone(item.view);
    const query = getMovementQuery(view, item.armyId, item.target);
    query.reachable[0]!.cost = -1;
    query.preview!.path.length = 0;
    expect(digest(getMovementQuery(view, item.armyId, item.target))).toBe(baseline[item.name]);
    for (const movement of [0, 2, 9]) {
      view.armies[0]!.movement = movement;
      expect(getMovementQuery(view, item.armyId, item.target)).toEqual(getMovementQuery(structuredClone(view), item.armyId, item.target));
    }
    view.armies[0]!.movementBlocker = 'Cancel the active character mission.';
    expect(getMovementQuery(view, item.armyId, item.target)).toMatchObject({ reachable: [], expandedNodes: 0, preview: { blocker: 'Cancel the active character mission.' } });
  });
});
