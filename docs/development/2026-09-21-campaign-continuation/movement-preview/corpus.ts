import { createGame, getObservation, type Observation } from '../../../../packages/sim/src/index';

export interface PreviewCase { name: string; view: Observation; armyId: string; target: number; append?: boolean }
/** Synthetic detached charts only; paid transport commands remain separate tests. */
export function previewCorpus(): PreviewCase[] {
  const game = createGame({ seed: 748291, size: 'tiny', factionCount: 2 }), source = getObservation(game, game.turnOwnerId);
  const army = source.armies.find(army => army.canAttack && army.factionId === source.factionId)!;
  const width = 64, origin = 32 * width + 16;
  const chart = (): Observation => ({ ...structuredClone(source), width, height: 64, settlements: [], routes: [], sieges: [], wars: [],
    armies: [{ ...structuredClone(army), cell: origin, movement: 5 }],
    cells: Array.from({ length: width * 64 }, (_, cell) => ({ cell, terrain: 1, biome: 1, waterDepth: 0, fertility: 70, visible: true })),
  });
  const cases: PreviewCase[] = [];
  const add = (name: string, view: Observation, target = origin + 15, append?: boolean) => cases.push({ name, view, armyId: army.id, target, append });
  for (const movement of [0, 2, 5, 9, 200]) { const view = chart(); view.armies[0]!.movement = movement; add(`range-${movement}-shared-budget`, view); }
  add('already-at-target', chart(), origin);
  add('invalid-target', chart(), width * 64);
  const weighted = chart(); for (const cell of weighted.cells) cell.terrain = cell.cell % 7 < 3 ? 2 : cell.cell % 11 < 4 ? 3 : 1;
  add('weighted-route', weighted);
  const roads = structuredClone(weighted); for (const cell of roads.cells) if (Math.floor(cell.cell / width) === 32) cell.roadMask = 9;
  add('road-route', roads);
  const fog = chart(); fog.cells = fog.cells.filter(cell => cell.cell % width !== 28); add('known-target-beyond-fog-gap', fog);
  const enemy = chart(); enemy.armies.push({ ...structuredClone(army), id: 'army.hostile', factionId: game.factions[1]!.id, cell: origin + 3 });
  add('peaceful-occupant', enemy, origin + 3);
  const war = structuredClone(enemy); war.wars = [game.factions[1]!.id]; add('hostile-attack', war, origin + 3); add('hostile-append-rejected', war, origin + 3, true); add('route-around-hostile', war);
  const mission = chart(); mission.armies[0]!.movementBlocker = 'Cancel the active character mission.'; add('mission-blocker', mission);
  const foreignArmy = chart(); foreignArmy.armies[0]!.factionId = game.factions[1]!.id; add('foreign-army', foreignArmy);
  const town = chart(); town.settlements = [{ id: 'settlement.foreign', factionId: game.factions[1]!.id, founderFactionId: game.factions[1]!.id, name: 'Foreign hearth', cell: origin + 3, population: 1, food: 0, buildings: [], queue: [], devastation: 0, occupationTurns: 0 }];
  add('foreign-settlement', town, origin + 3);
  const route = chart(); route.routes = [{ armyId: army.id, origin, waypoints: [origin + 4], path: [origin + 1, origin + 2, origin + 3, origin + 4], status: 'active', pauseReason: null, knownHostileIds: [] }];
  add('append-waypoint', route, origin + 8, true);
  const paused = structuredClone(route); paused.routes[0]!.status = 'paused'; paused.routes[0]!.pauseReason = 'Observed obstruction'; add('append-paused-waypoint', paused, origin + 8, true);
  const naval = chart(); naval.armies[0]!.domain = 'naval'; naval.armies[0]!.canEnterDeepWater = false;
  for (const cell of naval.cells) { cell.terrain = 0; cell.waterDepth = cell.cell % width < 23 ? 1 : 2; }
  add('coastal-shallow-preview', naval, origin + 4); add('coastal-deep-blocker', naval);
  const ocean = structuredClone(naval); ocean.armies[0]!.canEnterDeepWater = true; add('ocean-route', ocean);
  return cases;
}
