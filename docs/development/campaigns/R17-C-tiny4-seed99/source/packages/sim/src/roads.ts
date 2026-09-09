import { z } from 'zod';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import type { CommandResult, DomainEvent, GameState, Settlement } from './types';
import { indexes } from './visibility';
import { rulesVersion } from './rules';

const id = z.string().regex(/^[a-z][a-z0-9_.-]*$/).max(100);
const cell = z.number().int().min(0).max(349_999);
const cellKey = z.string().regex(/^(0|[1-9][0-9]{0,5})$/);
const masks = z.record(cellKey, z.number().int().min(1).max(63));
export const roadProjectSchema = z.object({ settlementId: id, targetId: id, factionId: id, path: z.array(cell).min(2).max(129), completed: z.number().int().min(0).max(128), progress: z.number().int().min(0).max(3) }).strict();
export const roadStateSchema = z.object({ edges: masks, projects: z.record(id, roadProjectSchema), known: z.record(id, masks) }).strict();
export type RoadProject = z.infer<typeof roadProjectSchema>;
export type RoadState = z.infer<typeof roadStateSchema>;
export interface RoadObservation { settlementId: string; targetId: string; targetName: string; completed: number; length: number; progress: number; required: number; nextCell: number | null; nextSegmentBuilt?: boolean; coinCost: number; canAccelerate: boolean; blocker: string | null }
export const accelerateRoadSchema = z.object({ type: z.literal('accelerateRoad'), factionId: id, settlementId: id }).strict();
export const emptyRoadState = (factions: readonly string[]): RoadState => ({ edges: {}, projects: {}, known: Object.fromEntries(factions.map(id => [id, {}])) });

/** Fixed compass bits, including at map boundaries (neighbors() omits invalid directions). */
export function roadDirection(from: number, to: number, width: number): number {
  const x = from % width, y = Math.floor(from / width), tx = to % width, ty = Math.floor(to / width), east = x + (y & 1);
  if (ty === y) return tx === x + 1 ? 0 : tx === x - 1 ? 3 : -1;
  if (ty === y + 1) return tx === east ? 1 : tx === east - 1 ? 2 : -1;
  if (ty === y - 1) return tx === east - 1 ? 4 : tx === east ? 5 : -1;
  return -1;
}
export function hasRoadEdge(from: number, to: number, width: number, mask: number): boolean {
  const direction = roadDirection(from, to, width);
  return direction >= 0 && (mask & (1 << direction)) !== 0;
}
export function roadMovementCost(state: GameState, from: number, to: number): number {
  return rulesVersion(state) >= 12 && hasRoadEdge(from, to, state.world.width, state.roads.edges[from] ?? 0) ? 1 : state.world.terrain[to] === 2 || state.world.terrain[to] === 3 ? 2 : 1;
}
export function rememberRoadCell(state: GameState, factionId: string, cell: number): void {
  const known = state.roads.known[factionId];
  if (!known) throw new Error('Unknown road observer.');
  const mask = state.roads.edges[cell];
  if (mask) known[cell] = mask; else delete known[cell];
}
function emit(state: GameState, project: RoadProject, type: string, message: string): DomainEvent {
  return { turn: state.turn, factionId: project.factionId, type, message, cell: project.path[Math.min(project.completed + 1, project.path.length - 1)]! };
}
function requirement(state: GameState, project: RoadProject): number {
  const target = project.path[project.completed + 1];
  return target === undefined ? 0 : state.world.terrain[target] === 3 ? 4 : state.world.terrain[target] === 2 ? 3 : 2;
}
function workBlocker(state: GameState, project: RoadProject): string | null {
  const town = state.settlements[project.settlementId], target = state.settlements[project.targetId];
  if (!town || !target || town.factionId !== project.factionId || target.factionId !== project.factionId) return 'Both endpoints must belong to your realm.';
  if (project.completed === project.path.length - 1) return 'This road connection is complete.';
  if (state.sieges[town.id] || state.sieges[target.id]) return 'Road work pauses while either settlement is besieged.';
  if (town.occupationTurns || target.occupationTurns) return 'Road work pauses during occupation.';
  const from = project.path[project.completed]!, to = project.path[project.completed + 1]!;
  const index = indexes(state), visible = index.visible.get(project.factionId);
  if (!visible?.has(from) || !visible.has(to)) return 'Escort the road workers: both ends of the next segment must be in sight.';
  for (const cell of [from, to]) {
    const owner = state.land.known[project.factionId]?.[cell]?.factionId;
    if (owner && owner !== project.factionId) return 'Road workers cannot build through a foreign claim.';
    if ([...(index.armies.get(cell) ?? [])].some(id => state.armies[id]?.factionId !== project.factionId)) return 'A foreign army blocks the road work front.';
  }
  return null;
}
export function observeRoads(state: GameState, factionId: string): RoadObservation[] {
  const treasury = state.factions.find(faction => faction.id === factionId)?.treasury ?? 0;
  return Object.values(state.roads.projects).filter(project => project.factionId === factionId).sort((a, b) => a.settlementId < b.settlementId ? -1 : 1).map(project => {
    const required = requirement(state, project), length = project.path.length - 1;
    const from = project.path[project.completed]!, next = project.path[project.completed + 1];
    // A paused remote work front must not disclose somebody else's unseen road.
    const nextSegmentBuilt = next !== undefined && hasRoadEdge(from, next, state.world.width, state.roads.known[factionId]?.[from] ?? 0);
    const coinCost = required && !nextSegmentBuilt ? (required - project.progress) * (6 + Math.floor(length / 8)) : 0;
    const blocker = state.victory ? 'This campaign has ended.' : state.battle || state.pendingCapture ? 'Resolve the battle or capture first.' : workBlocker(state, project) ?? (nextSegmentBuilt ? 'This segment is already built. Workers will follow it at no charge next active turn.' : treasury < coinCost ? 'Not enough treasury coin for this road segment.' : null);
    return { settlementId: project.settlementId, targetId: project.targetId, targetName: state.settlements[project.targetId]?.name ?? 'Former settlement', completed: project.completed, length, progress: project.progress, required, nextCell: next ?? null, nextSegmentBuilt, coinCost, canAccelerate: blocker === null, blocker };
  });
}
function finishSegment(state: GameState, project: RoadProject, emitted: DomainEvent[], reused = false): void {
  const from = project.path[project.completed]!, to = project.path[project.completed + 1]!, direction = roadDirection(from, to, state.world.width);
  state.roads.edges[from] = (state.roads.edges[from] ?? 0) | (1 << direction);
  state.roads.edges[to] = (state.roads.edges[to] ?? 0) | (1 << ((direction + 3) % 6));
  project.completed++; project.progress = 0;
  for (const faction of state.factions) for (const cell of [from, to]) if (indexes(state).visible.get(faction.id)?.has(cell)) rememberRoadCell(state, faction.id, cell);
  emitted.push({ ...emit(state, project, project.completed === project.path.length - 1 ? 'road_completed' : reused ? 'road_segment_reused' : 'road_segment_built', `${state.settlements[project.settlementId]?.name ?? 'Road workers'}: road to ${state.settlements[project.targetId]?.name ?? 'the former settlement'} has ${project.completed}/${project.path.length - 1} completed segments.${reused ? ' Workers followed an existing segment at no charge.' : ''}`), cell: to });
}
export function accelerateRoad(state: GameState, factionId: string, settlementId: string): CommandResult {
  const project = state.roads.projects[settlementId];
  if (!project || project.factionId !== factionId || state.settlements[settlementId]?.factionId !== factionId) return { ok: false, error: 'You do not control an active road project at that settlement.', events: [] };
  const quote = observeRoads(state, factionId).find(item => item.settlementId === settlementId)!;
  if (!quote.canAccelerate) return { ok: false, error: quote.blocker!, events: [] };
  state.factions.find(faction => faction.id === factionId)!.treasury -= quote.coinCost;
  const events = [emit(state, project, 'road_accelerated', `${quote.coinCost} treasury coin (crowns) hired workers to finish the next road segment.`)];
  finishSegment(state, project, events);
  return { ok: true, events };
}

const serial = (town: Settlement): number => Number(town.id.slice('settlement.'.length));
/** At most 4,096 charted nodes and eight nearby endpoint candidates per attempt. */
function planConnection(state: GameState, town: Settlement, towns: readonly Settlement[], emitted: DomainEvent[]): void {
  if (state.roads.projects[town.id]) return;
  const targets = towns.filter(other => serial(other) < serial(town) && hexDistance(town.cell, other.cell, state.world.width) <= 96).sort((a, b) => hexDistance(town.cell, a.cell, state.world.width) - hexDistance(town.cell, b.cell, state.world.width) || serial(a) - serial(b)).slice(0, 8);
  if (!targets.length) return;
  const destinations = new Map(targets.map(target => [target.cell, target]));
  const queue = [town.cell], parents = new Map<number, number>([[town.cell, -1]]), distances = new Map([[town.cell, 0]]), known = state.explored[town.factionId];
  for (let head = 0; head < queue.length && head < 4096; head++) {
    const current = queue[head]!, target = destinations.get(current);
    if (target) {
      const path = [current]; let cursor = current;
      while (cursor !== town.cell) { cursor = parents.get(cursor)!; path.push(cursor); }
      path.reverse();
      const project: RoadProject = { settlementId: town.id, targetId: target.id, factionId: town.factionId, path, completed: 0, progress: 0 };
      state.roads.projects[town.id] = project;
      emitted.push(emit(state, project, 'road_planned', `${town.name} began a ${path.length - 1}-segment road connection to ${target.name}.`));
      return;
    }
    if (distances.get(current)! >= 128) continue;
    for (const next of neighbors(current, state.world.width, state.world.height)) {
      if (parents.size >= 4096) break;
      const owner = state.land.known[town.factionId]?.[next]?.factionId;
      if (parents.has(next) || !known?.has(next) || !isPassable(state.world.terrain[next]!) || owner && owner !== town.factionId) continue;
      parents.set(next, current); distances.set(next, distances.get(current)! + 1); queue.push(next);
    }
  }
}
/** Sparse infrastructure survives lost endpoints; unfinished projects do not. */
export function reconcileRoads(state: GameState): void {
  for (const [id, project] of Object.entries(state.roads.projects)) if (state.settlements[id]?.factionId !== project.factionId || state.settlements[project.targetId]?.factionId !== project.factionId) delete state.roads.projects[id];
}
export function advanceRoads(state: GameState, emitted: DomainEvent[]): void {
  if (rulesVersion(state) < 12) return;
  reconcileRoads(state);
  const byFaction = new Map<string, Settlement[]>();
  for (const town of Object.values(state.settlements)) { const towns = byFaction.get(town.factionId) ?? []; towns.push(town); byFaction.set(town.factionId, towns); }
  for (const faction of state.factions) {
    const towns = (byFaction.get(faction.id) ?? []).sort((a, b) => serial(a) - serial(b));
    // Only one unconnected town is surveyed per realm per round, with stable rotation.
    const eligible = towns.filter(town => !state.roads.projects[town.id] && !state.sieges[town.id] && !town.occupationTurns);
    const selected = eligible.length ? eligible[(state.turn - 1) % eligible.length] : undefined;
    if (selected) planConnection(state, selected, towns, emitted);
  }
  for (const project of Object.values(state.roads.projects).sort((a, b) => a.settlementId < b.settlementId ? -1 : 1)) {
    if (workBlocker(state, project)) continue;
    const from = project.path[project.completed]!, to = project.path[project.completed + 1]!;
    if (hasRoadEdge(from, to, state.world.width, state.roads.edges[from] ?? 0)) { finishSegment(state, project, emitted, true); continue; }
    project.progress++;
    if (project.progress >= requirement(state, project)) finishSegment(state, project, emitted);
  }
}

export function validateRoads(state: GameState, visibleByFaction: ReadonlyMap<string, ReadonlySet<number>>): void {
  const fail = (ok: boolean, message: string) => { if (!ok) throw new Error('Invalid roads: ' + message); };
  const count = state.world.terrain.length, factionIds = state.factions.map(faction => faction.id);
  fail(Object.keys(state.roads.known).length === factionIds.length && factionIds.every(id => Object.hasOwn(state.roads.known, id)), 'observer ownership');
  for (const [key, mask] of Object.entries(state.roads.edges)) {
    const from = Number(key); fail(from < count && isPassable(state.world.terrain[from]!), 'road cell is not passable land');
    let checked = 0;
    for (const to of neighbors(from, state.world.width, state.world.height)) {
      const bit = 1 << roadDirection(from, to, state.world.width);
      if (!(mask & bit)) continue;
      checked |= bit;
      fail(isPassable(state.world.terrain[to]!) && hasRoadEdge(to, from, state.world.width, state.roads.edges[to] ?? 0), 'asymmetric or impassable edge');
    }
    fail(checked === mask, 'edge leaves the world');
  }
  for (const [id, project] of Object.entries(state.roads.projects)) {
    fail(id === project.settlementId && state.settlements[id]?.factionId === project.factionId && state.settlements[project.targetId]?.factionId === project.factionId, 'project endpoints');
    fail(project.path[0] === state.settlements[id]?.cell && project.path.at(-1) === state.settlements[project.targetId]?.cell && new Set(project.path).size === project.path.length, 'project path endpoints or cycle');
    fail(project.completed < project.path.length && (project.completed === project.path.length - 1 ? project.progress === 0 : project.progress < requirement(state, project)), 'project progress');
    project.path.forEach((cell, index) => {
      fail(cell < count && isPassable(state.world.terrain[cell]!) && Boolean(state.explored[project.factionId]?.has(cell)), 'unexplored or impassable route');
      if (index) fail(neighbors(project.path[index - 1]!, state.world.width, state.world.height).includes(cell), 'disconnected route');
      if (index && index <= project.completed) fail(hasRoadEdge(project.path[index - 1]!, cell, state.world.width, state.roads.edges[project.path[index - 1]!] ?? 0), 'completed segment missing');
    });
  }
  for (const factionId of factionIds) {
    const known = state.roads.known[factionId]!;
    for (const [key, mask] of Object.entries(known)) fail(Boolean(state.explored[factionId]?.has(Number(key))) && (mask & (state.roads.edges[key] ?? 0)) === mask, 'impossible remembered road');
    for (const cell of visibleByFaction.get(factionId) ?? []) fail((known[cell] ?? 0) === (state.roads.edges[cell] ?? 0), 'visible road memory differs');
  }
}
