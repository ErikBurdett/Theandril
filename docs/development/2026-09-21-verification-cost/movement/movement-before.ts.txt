import { z } from 'zod';
import { armyCanAttack, armySight } from './army-composition';
import { selectDefendingArmies } from './battle-frontage';
import { hexDistance, neighbors, neighborsInto } from '@theandril/mapgen';
import type { Army, CommandResult, DomainEvent, GameState, Observation } from './types';
import { cellsWithin, indexes, updateSight } from './visibility';
import { startCampaignBattle } from './warfare';
import { rulesVersion } from './rules';
import { hasRoadEdge, roadMovementCost } from './roads';
import { armyHasCharacterMission } from './characters';
import { armyDomain, armyTerrainBlocker, carriedArmyBlocker, fleetCanEnterDeepWater, moveFleetCargo, travelTerrainBlocker } from './naval';

export const MAX_ROUTE_CELLS = 256;
export const MAX_WAYPOINTS = 8;
export const MAX_PATH_NODES = 4096;
const cell = z.number().int().min(0).max(349_999);
const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
export const movementRouteSchema = z.object({ armyId: id, origin: cell, waypoints: z.array(cell).min(1).max(MAX_WAYPOINTS), path: z.array(cell).min(1).max(MAX_ROUTE_CELLS), status: z.enum(['active', 'paused']), pauseReason: z.string().min(1).max(300).nullable(), knownHostileIds: z.array(id).max(4096) }).strict();
export type MovementRoute = z.infer<typeof movementRouteSchema>;
export interface MovementPreview { target: number; path: number[]; cost: number; action: 'move' | 'attack' | 'besiege' | 'blocked'; canMoveNow: boolean; canQueue: boolean; blocker: string | null; limited: boolean; expandedNodes: number }
export interface MovementQuery { reachable: { cell: number; cost: number }[]; preview: MovementPreview | null; limited: boolean; expandedNodes: number }
interface Knowledge {
  stepCost(from: number, to: number): number;
  legacy: boolean;
  battleLimit: number;
  defendingFormations(armies: Army[]): number;
  terrainBlocker(cell: number): string | null;
  width: number; height: number; factionId: string; army: Army | undefined; wars: Set<string>;
  terrain(cell: number): number | undefined; armies(cell: number): Army[]; townOwner(cell: number): string | undefined;
  route: MovementRoute | undefined; strategicBlocker: string | null; besieging: boolean;
}
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const stepCost = (terrain: number): number => terrain === 2 || terrain === 3 ? 2 : 1;
const compareId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const formationCount = (armies: Army[]): number => armies.reduce((sum, army) => sum + army.formations.length, 0);
const blocked = (state: GameState): string | null => state.victory ? 'This campaign has ended in victory.' : state.battle ? 'Resolve the pending battle first.' : state.pendingCapture ? 'Resolve the settlement capture first.' : null;

/** Index one detached observation once, not once for every hovered hex. */
const observed = new WeakMap<Observation, { terrain: Map<number, number>; roads: Map<number, number>; depths: Map<number, number>; armies: Map<number, Army[]>; towns: Map<number, string>; defenses: Map<string, number> }>();
function observedKnowledge(view: Observation, armyId: string): Knowledge {
  let known = observed.get(view);
  if (!known) {
    known = { terrain: new Map(view.cells.map(item => [item.cell, item.terrain])), roads: new Map(view.cells.filter(item => item.roadMask).map(item => [item.cell, item.roadMask!])), depths: new Map(view.cells.map(item => [item.cell, item.waterDepth])), armies: new Map(), towns: new Map(view.settlements.map(town => [town.cell, town.factionId])), defenses: new Map(view.armies.flatMap(army => army.battleDefense ? [[army.id, army.battleDefense.engagedFormations] as const] : [])) };
    for (const army of view.armies) { if (army.carrierId) continue; const occupants = known.armies.get(army.cell) ?? []; occupants.push(army); known.armies.set(army.cell, occupants); }
    observed.set(view, known);
  }
  const index = known;
  const army = view.armies.find(army => army.id === armyId && army.factionId === view.factionId);
  return { legacy: false, battleLimit: 20, terrainBlocker: cell => travelTerrainBlocker(army?.domain ?? 'land', army?.canEnterDeepWater ?? false, index.terrain.get(cell) ?? 0, index.depths.get(cell) ?? 0), width: view.width, height: view.height, factionId: view.factionId, army, wars: new Set(view.wars),
    // Click travel targets the first stable ID. Only the canonical preview permits
    // a smaller contingent; historical/no-preview observations retain the full cap.
    defendingFormations: armies => index.defenses.get([...armies].sort(compareId)[0]?.id ?? '') ?? formationCount(armies),
    stepCost: (from, to) => hasRoadEdge(from, to, view.width, index.roads.get(from) ?? 0) ? 1 : stepCost(index.terrain.get(to) ?? 0),
    terrain: cell => index.terrain.get(cell), armies: cell => index.armies.get(cell) ?? [], townOwner: cell => index.towns.get(cell), route: view.routes.find(route => route.armyId === armyId),
    strategicBlocker: view.victory ? 'This campaign has ended in victory.' : view.battle ? 'Resolve the pending battle first.' : view.pendingCapture ? 'Resolve the settlement capture first.' : view.armies.find(army => army.id === armyId)?.movementBlocker ?? null,
    besieging: view.sieges.some(siege => siege.armyId === armyId),
  };
}
function canonicalKnowledge(state: GameState, factionId: string, armyId: string): Knowledge {
  const index = indexes(state); const visible = index.visible.get(factionId); const army = state.armies[armyId];
  return { legacy: rulesVersion(state) < 6, battleLimit: rulesVersion(state) < 8 ? 12 : 20, terrainBlocker: cell => army ? armyTerrainBlocker(state, army, cell) : 'Unknown army.', width: state.world.width, height: state.world.height, factionId, army: army?.factionId === factionId ? army : undefined,
    defendingFormations: armies => formationCount(rulesVersion(state) >= 17 ? selectDefendingArmies(armies, [...armies].sort(compareId)[0]?.id) : armies),
    wars: new Set(state.wars.filter(pair => pair.includes(factionId)).map(pair => pair[0] === factionId ? pair[1] : pair[0])),
    terrain: cell => state.explored[factionId]?.has(cell) ? state.world.terrain[cell] : undefined,
    stepCost: (from, to) => rulesVersion(state) >= 12 && hasRoadEdge(from, to, state.world.width, state.roads.known[factionId]?.[from] ?? 0) ? 1 : stepCost(state.world.terrain[to] ?? 0),
    armies: cell => visible?.has(cell) ? [...(index.armies.get(cell) ?? [])].map(id => state.armies[id]).filter((army): army is Army => Boolean(army)) : [],
    townOwner: cell => visible?.has(cell) ? state.settlements[index.settlements.get(cell) ?? '']?.factionId : undefined,
    route: state.routes[armyId], strategicBlocker: blocked(state) ?? carriedArmyBlocker(state, armyId) ?? (armyHasCharacterMission(state, armyId) ? 'Cancel the active character mission before moving this army.' : null), besieging: Object.values(state.sieges).some(siege => siege.armyId === armyId),
  };
}
function mayEnter(knowledge: Knowledge, cell: number, attackTarget?: number): boolean {
  const terrain = knowledge.terrain(cell);
  if (terrain === undefined || knowledge.terrainBlocker(cell)) return false;
  const owner = knowledge.townOwner(cell);
  if (owner && owner !== knowledge.factionId) return false;
  return !knowledge.armies(cell).some(army => army.factionId !== knowledge.factionId) || cell === attackTarget;
}
interface SearchNode { cell: number; cost: number; priority: number }
class Heap {
  private entries: SearchNode[] = [];
  private before(a: SearchNode, b: SearchNode): boolean { return a.priority < b.priority || a.priority === b.priority && (a.cost < b.cost || a.cost === b.cost && a.cell < b.cell); }
  push(node: SearchNode): void { const data = this.entries; data.push(node); let index = data.length - 1; while (index > 0) { const parent = Math.floor((index - 1) / 2); if (!this.before(node, data[parent]!)) break; data[index] = data[parent]!; index = parent; } data[index] = node; }
  pop(): SearchNode | undefined { const data = this.entries; const head = data[0]; const tail = data.pop(); if (!data.length || !tail) return head; let index = 0; while (index * 2 + 1 < data.length) { let child = index * 2 + 1; if (child + 1 < data.length && this.before(data[child + 1]!, data[child]!)) child++; if (!this.before(data[child]!, tail)) break; data[index] = data[child]!; index = child; } data[index] = tail; return head; }
}
function search(knowledge: Knowledge, origin: number, target: number | undefined, budget: { remaining: number }, maxCost = Infinity, attackTarget?: number) {
  const open = new Heap(); const costs = new Map([[origin, 0]]);
  // Range-only searches never reconstruct a path. They still visit and charge
  // every original node, but need no predecessor tree or per-node neighbor array.
  const parents = target === undefined ? undefined : new Map<number, number>();
  const adjacentCells: number[] = [];
  open.push({ cell: origin, cost: 0, priority: target === undefined ? 0 : hexDistance(origin, target, knowledge.width) });
  let reached = false; let limited = false;
  while (true) {
    const node = open.pop(); if (!node) break;
    if (node.cost !== costs.get(node.cell)) continue;
    if (budget.remaining <= 0) { limited = true; break; }
    budget.remaining--;
    if (node.cell === target) { reached = true; break; }
    // Terrain and road edges cost at least one. A spent range or an already
    // cheaper arrival cannot improve, regardless of terrain or occupants.
    // Keep charging/popping the same nodes so query limits and tie order agree.
    if (node.cost >= maxCost) continue;
    for (const adjacent of neighborsInto(node.cell, knowledge.width, knowledge.height, adjacentCells)) {
      const priorCost = costs.get(adjacent) ?? Infinity;
      if (node.cost + 1 >= priorCost) continue;
      if (!mayEnter(knowledge, adjacent, attackTarget)) continue;
      const cost = node.cost + knowledge.stepCost(node.cell, adjacent);
      if (cost > maxCost || cost >= priorCost) continue;
      costs.set(adjacent, cost); parents?.set(adjacent, node.cell);
      open.push({ cell: adjacent, cost, priority: cost + (target === undefined ? 0 : hexDistance(adjacent, target, knowledge.width)) });
    }
  }
  const path: number[] = [];
  if (reached && target !== undefined) {
    let cursor = target;
    while (cursor !== origin) { path.unshift(cursor); const parent = parents?.get(cursor); if (parent === undefined) throw new Error('Broken path predecessor'); cursor = parent; if (path.length > MAX_ROUTE_CELLS) return { path: [], cost: 0, costs, limited: true, reached: false }; }
  }
  return { path, cost: target === undefined ? 0 : costs.get(target) ?? 0, costs, limited, reached };
}
function plannedWaypoints(knowledge: Knowledge, target: number, append: boolean): number[] {
  const waypoints = [...(append ? knowledge.route?.waypoints ?? [] : []), target];
  while (waypoints[0] === knowledge.army?.cell) waypoints.shift();
  return waypoints;
}
function preview(knowledge: Knowledge, target: number, append = false, budget = { remaining: MAX_PATH_NODES }): MovementPreview {
  const initialBudget = budget.remaining;
  const base: MovementPreview = { target, path: [], cost: 0, action: 'blocked', canMoveNow: false, canQueue: false, blocker: null, limited: false, expandedNodes: 0 };
  const deny = (blocker: string): MovementPreview => ({ ...base, blocker, expandedNodes: initialBudget - budget.remaining });
  const army = knowledge.army;
  if (!army) return deny('You do not control that army.');
  if (knowledge.strategicBlocker) return deny(knowledge.strategicBlocker);
  if (knowledge.besieging) return deny('Lift this army’s siege before moving it.');
  if (!Number.isSafeInteger(target) || target < 0 || target >= knowledge.width * knowledge.height || knowledge.terrain(target) === undefined) return deny('Choose a known destination within the explored world.');
  const terrainBlocker = knowledge.terrainBlocker(target);
  if (terrainBlocker) return deny(terrainBlocker);
  const townOwner = knowledge.townOwner(target);
  if (townOwner && townOwner !== knowledge.factionId) return { ...deny(knowledge.wars.has(townOwner) ? 'Besiege this settlement and assault its defenses; travel cannot bypass a garrison.' : 'This settlement belongs to another faction. Declare war before a siege.'), action: 'besiege' };
  const enemies = knowledge.armies(target).filter(other => other.factionId !== knowledge.factionId).sort(compareId);
  const enemy = enemies[0];
  if (enemy && !knowledge.wars.has(enemy.factionId)) return deny('Declare war before attacking this faction.');
  if (enemy && !armyCanAttack(army)) return deny('Hearth caravans cannot initiate attacks.');
  if (knowledge.defendingFormations(enemies) > knowledge.battleLimit) return deny(knowledge.battleLimit === 20 ? 'This field battle supports at most twenty defending formations.' : knowledge.legacy ? 'This field battle supports at most twelve defending armies.' : 'This field battle supports at most twelve defending formations.');
  if (append && enemy) return deny('Queued travel cannot include an automatic attack.');
  const waypoints = plannedWaypoints(knowledge, target, append);
  if (waypoints.length > MAX_WAYPOINTS) return deny('A travel order supports at most eight waypoints.');
  if (waypoints.some((cell, i) => i > 0 && cell === waypoints[i - 1])) return deny('Choose a different next waypoint.');
  const path: number[] = []; let cost = 0; let origin = army.cell;
  for (const waypoint of waypoints) {
    const result = search(knowledge, origin, waypoint, budget, Infinity, enemy ? target : undefined);
    if (!result.reached) return { ...deny(result.limited ? 'The bounded route search reached its limit. Choose a closer waypoint.' : 'No safe route is known through explored terrain.'), limited: result.limited };
    path.push(...result.path); cost += result.cost; origin = waypoint;
    if (path.length > MAX_ROUTE_CELLS) return { ...deny('The route exceeds 256 hexes. Choose a closer destination.'), limited: true };
  }
  if (!path.length) return deny('This army is already at the destination.');
  const canMoveNow = cost <= army.movement && !(append && knowledge.route?.status === 'paused');
  return { ...base, path, cost, action: enemy ? 'attack' : 'move', canMoveNow, canQueue: !enemy, blocker: canMoveNow ? null : enemy ? 'Not enough movement remains to reach and attack this enemy this turn.' : 'Queue this route to continue travel over later turns.', expandedNodes: initialBudget - budget.remaining };
}
function queryRange(knowledge: Knowledge, budget: { remaining: number }) {
  const army = knowledge.army;
  return army && !knowledge.strategicBlocker && !knowledge.besieging ? search(knowledge, army.cell, undefined, budget, army.movement) : null;
}

/** The full query's exact target preview without publishing its reachable overlay.
 * Range search still consumes the same shared node budget before route planning. */
export function getMovementPreview(view: Observation, armyId: string, target: number, options?: { append?: boolean }): MovementPreview {
  const knowledge = observedKnowledge(view, armyId), budget = { remaining: MAX_PATH_NODES };
  queryRange(knowledge, budget);
  return preview(knowledge, target, options?.append, budget);
}

/** Pure, bounded routing over permitted observations; no unseen world lookup is possible. */
export function getMovementQuery(view: Observation, armyId: string, target?: number, options?: { append?: boolean }): MovementQuery {
  const knowledge = observedKnowledge(view, armyId); const army = knowledge.army;
  const budget = { remaining: MAX_PATH_NODES };
  const range = queryRange(knowledge, budget);
  const reachable = new Map(range?.costs ?? []);
  if (army && armyCanAttack(army) && range) for (const [cell, cost] of range.costs) for (const next of neighbors(cell, knowledge.width, knowledge.height)) {
    const enemies = knowledge.armies(next).filter(other => other.factionId !== knowledge.factionId);
    const owner = knowledge.townOwner(next); const terrain = knowledge.terrain(next);
    if (terrain === undefined || knowledge.terrainBlocker(next) || owner && owner !== knowledge.factionId || !enemies.length || knowledge.defendingFormations(enemies) > knowledge.battleLimit || enemies.some(other => !knowledge.wars.has(other.factionId))) continue;
    const attackCost = cost + knowledge.stepCost(cell, next);
    if (attackCost <= army.movement && attackCost < (reachable.get(next) ?? Infinity)) reachable.set(next, attackCost);
  }
  const targetPreview = target === undefined ? null : preview(knowledge, target, options?.append, budget);
  return { reachable: [...reachable].filter(([cell]) => cell !== army?.cell).map(([cell, cost]) => ({ cell, cost })).sort((a, b) => a.cell - b.cell), preview: targetPreview, limited: Boolean(range?.limited || targetPreview?.limited), expandedNodes: MAX_PATH_NODES - budget.remaining };
}
function localHostiles(state: GameState, army: Army): string[] {
  const index = indexes(state); const enemies = new Set(state.wars.filter(pair => pair.includes(army.factionId)).flat().filter(id => id !== army.factionId)); const ids: string[] = [];
  for (const cell of cellsWithin(state, army.cell, armySight(army))) {
    for (const id of index.armies.get(cell) ?? []) if (enemies.has(state.armies[id]?.factionId ?? '')) ids.push(id);
    const town = state.settlements[index.settlements.get(cell) ?? '']; if (town && enemies.has(town.factionId)) ids.push(town.id);
  }
  return ids.sort();
}
function notice(state: GameState, army: Army, type: string, message: string): DomainEvent { return { turn: state.turn, factionId: army.factionId, type, message, cell: army.cell }; }
export function pauseMovement(state: GameState, armyId: string, reason: string, events: DomainEvent[]): void {
  const route = state.routes[armyId]; const army = state.armies[armyId];
  if (!route || !army || route.status === 'paused' && route.pauseReason === reason) return;
  route.status = 'paused'; route.pauseReason = reason;
  events.push(notice(state, army, 'movement_paused', `${army.name} paused its travel: ${reason}`));
}
function stepObjection(state: GameState, army: Army, target: number): string | null {
  const carried = carriedArmyBlocker(state, army.id); if (carried) return carried;
  if (armyHasCharacterMission(state, army.id)) return 'Cancel the active character mission before moving this army.';
  if (!neighbors(army.cell, state.world.width, state.world.height).includes(target)) return 'The army was displaced from its planned route.';
  const index = indexes(state);
  if (!index.visible.get(army.factionId)?.has(target)) return 'The next step is not currently visible.';
  const terrainBlocker = armyTerrainBlocker(state, army, target); if (terrainBlocker) return terrainBlocker;
  if ([...(index.armies.get(target) ?? [])].some(id => state.armies[id]?.factionId !== army.factionId)) return 'Another faction now blocks the next step.';
  const town = state.settlements[index.settlements.get(target) ?? ''];
  if (town && town.factionId !== army.factionId) return 'Another faction now controls the next settlement.';
  if (Object.values(state.sieges).some(siege => siege.armyId === army.id)) return 'This army is maintaining a siege.';
  return null;
}
/** Uses the same movement cost and notification text as the legacy adjacent command. */
function takeStep(state: GameState, army: Army, target: number, events: DomainEvent[]): void {
  const index = indexes(state); const sight = armySight(army);
  updateSight(state, army.factionId, army.cell, sight, -1); index.armies.get(army.cell)?.delete(army.id);
  army.movement -= roadMovementCost(state, army.cell, target); army.cell = target;
  moveFleetCargo(state, army.id);
  const occupants = index.armies.get(target) ?? new Set<string>(); occupants.add(army.id); index.armies.set(target, occupants);
  updateSight(state, army.factionId, target, sight, 1);
  events.push(notice(state, army, 'army_moved', `${army.name} explored hex ${army.cell}.`));
}
function followRoute(state: GameState, route: MovementRoute, events: DomainEvent[]): void {
  const army = state.armies[route.armyId]; if (!army || route.status !== 'active') return;
  while (route.path.length && army.movement > 0) {
    const known = new Set(route.knownHostileIds); const hostiles = localHostiles(state, army);
    if (hostiles.some(id => !known.has(id))) { pauseMovement(state, army.id, 'New hostile forces or a hostile settlement were sighted nearby.', events); return; }
    const target = route.path[0]!; const objection = stepObjection(state, army, target);
    if (objection) { pauseMovement(state, army.id, objection, events); return; }
    const nextTown = indexes(state).settlements.get(target);
    if (nextTown && state.sieges[nextTown]) { pauseMovement(state, army.id, 'The next settlement is under blockade.', events); return; }
    if (army.movement < roadMovementCost(state, army.cell, target)) break;
    takeStep(state, army, target, events); route.origin = army.cell; route.path.shift();
    while (route.waypoints[0] === army.cell) route.waypoints.shift();
    if (route.path.length && localHostiles(state, army).some(id => !known.has(id))) { pauseMovement(state, army.id, 'New hostile forces or a hostile settlement were sighted nearby.', events); return; }
  }
  if (!route.path.length) { delete state.routes[army.id]; events.push(notice(state, army, 'movement_completed', `${army.name} reached its final travel destination.`)); }
}
export function moveTo(state: GameState, factionId: string, armyId: string, target: number): CommandResult {
  const knowledge = canonicalKnowledge(state, factionId, armyId); const plan = preview(knowledge, target); const army = knowledge.army;
  if (!army || !plan.canMoveNow) return fail(plan.blocker ?? 'This move cannot be completed this turn.');
  const events: DomainEvent[] = []; delete state.routes[armyId];
  const knownHostiles = new Set(localHostiles(state, army));
  if (plan.action === 'attack') for (const enemy of knowledge.armies(target)) knownHostiles.add(enemy.id);
  for (const [index, next] of plan.path.entries()) {
    if (localHostiles(state, army).some(id => !knownHostiles.has(id))) { events.push(notice(state, army, 'movement_interrupted', `${army.name} stopped after sighting a new nearby hostile force or settlement.`)); break; }
    if (plan.action === 'attack' && index === plan.path.length - 1) {
      const enemy = canonicalKnowledge(state, factionId, armyId).armies(next).filter(other => other.factionId !== factionId).sort(compareId)[0];
      if (!enemy) { events.push(notice(state, army, 'movement_interrupted', 'The selected enemy is no longer a valid attack target.')); break; }
      const result = startCampaignBattle(state, factionId, armyId, enemy.id);
      if (!result.ok) { events.push(notice(state, army, 'movement_interrupted', 'The attack route is no longer safe; review the visible battlefield.')); break; }
      events.push(...result.events); break;
    }
    const objection = stepObjection(state, army, next);
    if (objection) { events.push(notice(state, army, 'movement_interrupted', `${army.name} stopped: ${objection}`)); break; }
    takeStep(state, army, next, events);
  }
  return { ok: true, events };
}
export function queueMovement(state: GameState, factionId: string, armyId: string, target: number, append = false): CommandResult {
  const knowledge = canonicalKnowledge(state, factionId, armyId); const plan = preview(knowledge, target, append); const army = knowledge.army;
  if (!army || !plan.canQueue) return fail(plan.blocker ?? 'This destination cannot be queued safely.');
  const hostiles = localHostiles(state, army);
  if (hostiles.length > 4096) return fail('Too many nearby hostile forces to maintain a safe travel order.');
  const previous = state.routes[armyId];
  const route: MovementRoute = { armyId, origin: army.cell, waypoints: plannedWaypoints(knowledge, target, append), path: [...plan.path], status: append && previous?.status === 'paused' ? 'paused' : 'active', pauseReason: append && previous?.status === 'paused' ? previous.pauseReason : null, knownHostileIds: hostiles };
  state.routes[armyId] = route;
  const events = [notice(state, army, 'movement_queued', `${army.name} ${append ? 'extended its travel order' : 'planned travel'} to hex ${target}, across ${plan.path.length} hexes.`)];
  followRoute(state, route, events); return { ok: true, events };
}
export function cancelMovement(state: GameState, factionId: string, armyId: string): CommandResult {
  const army = state.armies[armyId];
  if (!army || army.factionId !== factionId) return fail('You do not control that army.');
  if (!state.routes[armyId]) return fail('This army has no travel order.');
  delete state.routes[armyId]; return { ok: true, events: [notice(state, army, 'movement_cancelled', `${army.name} cancelled its travel order.`)] };
}
export function resumeMovement(state: GameState, factionId: string, armyId: string): CommandResult {
  const knowledge = canonicalKnowledge(state, factionId, armyId); const army = knowledge.army; const route = knowledge.route;
  if (!army) return fail('You do not control that army.');
  if (!route || route.status !== 'paused') return fail('This army has no paused travel order.');
  const remaining = route.waypoints.filter((cell, index) => index !== 0 || cell !== army.cell);
  if (!remaining.length) return cancelMovement(state, factionId, armyId);
  const target = remaining.at(-1)!; knowledge.route = { ...route, waypoints: remaining.slice(0, -1), status: 'active' };
  const plan = preview(knowledge, target, true);
  if (!plan.canQueue) return fail(plan.blocker ?? 'No safe route is currently known.');
  const hostiles = localHostiles(state, army);
  if (hostiles.length > 4096) return fail('Too many nearby hostile forces to maintain a safe travel order.');
  route.origin = army.cell; route.path = plan.path; route.waypoints = remaining; route.status = 'active'; route.pauseReason = null; route.knownHostileIds = hostiles;
  const events = [notice(state, army, 'movement_resumed', `${army.name} resumed its travel order after reviewing current conditions.`)];
  followRoute(state, route, events); return { ok: true, events };
}
export function advanceMovement(state: GameState, events: DomainEvent[]): void {
  for (const armyId of Object.keys(state.routes).sort()) {
    const route = state.routes[armyId]; if (!route) continue;
    if (!state.armies[armyId]) { delete state.routes[armyId]; continue; }
    followRoute(state, route, events);
  }
}
export function reconcileMovement(state: GameState, events: DomainEvent[], affectedArmyIds: string[]): void {
  for (const armyId of [...new Set(affectedArmyIds)].sort()) {
    const army = state.armies[armyId]; const route = state.routes[armyId];
    if (!army) { delete state.routes[armyId]; continue; }
    if (state.battle && (state.battle.attackerId === armyId || state.battle.defenderIds.includes(armyId))) pauseMovement(state, armyId, 'The army is engaged in battle.', events);
    else if (route && army.cell !== route.origin) pauseMovement(state, armyId, 'The army was displaced from its planned route.', events);
  }
}
export function validateMovement(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: ' + message); };
  for (const [armyId, route] of Object.entries(state.routes)) {
    const army = state.armies[armyId]; assert(army && route.armyId === armyId, 'travel order references an unknown army'); if (!army) continue;
    assert(route.status === 'active' ? route.pauseReason === null && route.origin === army.cell : route.pauseReason !== null, 'travel status and origin disagree');
    // A paused plan retains its original geography after a coastal hull joins a fleet.
    // Resuming replans against current capability; active routes still require deep access.
    const ocean = route.status === 'paused' || fleetCanEnterDeepWater(state, army);
    let cursor = route.origin; let waypoint = 0;
    assert(state.explored[army.factionId]?.has(cursor), 'travel origin must be explored');
    for (const next of route.path) {
      assert(neighbors(cursor, state.world.width, state.world.height).includes(next) && !travelTerrainBlocker(armyDomain(army), ocean, state.world.terrain[next] ?? 0, state.world.waterDepth[next] ?? 0) && state.explored[army.factionId]?.has(next), 'travel route must be contiguous explored terrain permitted to the army domain');
      cursor = next; if (route.waypoints[waypoint] === next) waypoint++;
    }
    assert(waypoint === route.waypoints.length && route.path.at(-1) === route.waypoints.at(-1), 'travel waypoints differ from the saved route');
    assert(route.knownHostileIds.every((id, i) => /^(army|settlement)\.[1-9][0-9]*$/.test(id) && Number(id.slice(id.indexOf('.') + 1)) < state.nextId && (i === 0 || id > (route.knownHostileIds[i - 1] ?? ''))), 'invalid remembered travel hostiles');
    if (state.battle && (state.battle.attackerId === armyId || state.battle.defenderIds.includes(armyId))) assert(route.status === 'paused', 'combat participant cannot keep active travel');
  }
}
