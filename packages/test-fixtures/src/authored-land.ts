import { arcaneSites, emptyLandState, initializeSettlementLand, refreshLandKnowledge, type GameState } from '@theandril/sim';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { cellsWithin, rebuildIndexes } from '../../sim/src/visibility';
import { getLandIndex } from '../../sim/src/territory';
import { rememberRoadCell, reconcileRoads } from '../../sim/src/roads';

/** Authored setup only: explicitly seed knowledge after moving scenario entities. */
export function refreshAuthoredSight(state: GameState): void {
  const index = rebuildIndexes(state);
  state.roads.known = Object.fromEntries(state.factions.map(faction => [faction.id, state.roads.known[faction.id] ?? {}]));
  reconcileRoads(state);
  for (const faction of state.factions) refreshLandKnowledge(state, faction.id, index.visible.get(faction.id) ?? new Map());
  for (const faction of state.factions) for (const cell of index.visible.get(faction.id)?.keys() ?? []) rememberRoadCell(state, faction.id, cell);
}

/** Authored setup only, never a save-loader repair or a runtime campaign action. */
export function rebaseAuthoredLand(state: GameState): void {
  state.land = emptyLandState(state.factions.map(faction => faction.id));
  for (const town of Object.values(state.settlements).sort((a, b) => a.id < b.id ? -1 : 1)) initializeSettlementLand(state, town);
  refreshAuthoredSight(state);
}

/** Authored setup only: the state a realm reaches by paying to survey an arcane
 * seam and holding the ground it lies on. The survey command, its cost and the
 * claim itself are proved by ordinary commands in the sim's own tests; scenes
 * that only need the resulting capability say so here instead of replaying it. */
export function holdSurveyedSeam(state: GameState, factionId: string, pathId?: string): number {
  const town = Object.values(state.settlements).find(item => item.factionId === factionId);
  if (!town) throw new Error('A surveyed seam needs a hearth to hold it.');
  const land = state.land.settlements[town.id];
  if (!land) throw new Error('A surveyed seam needs settled land.');
  const candidates = arcaneSites(state.world).filter(site => !pathId || site.pathId === pathId);
  if (!candidates.length) throw new Error('This world holds no seam of that path.');
  const seam = candidates.reduce((closest, site) =>
    hexDistance(site.cell, town.cell, state.world.width) < hexDistance(closest.cell, town.cell, state.world.width) ? site : closest);
  // Borders reach the seam the way they would in play: one connected step at a
  // time along the shortest passable ground, each claimed hex seen. The survey
  // command and its cost are proved by ordinary commands in the sim's own tests.
  const claimed = new Set(land.claimed);
  const taken = new Set(Object.entries(state.land.settlements).flatMap(([id, other]) => id === town.id ? [] : other.claimed));
  if (!claimed.has(seam.cell)) {
    const parents = new Map<number, number | null>([...claimed].map(cell => [cell, null]));
    const queue = [...claimed].sort((a, b) => a - b);
    let reached = false;
    for (let index = 0; index < queue.length && !reached; index++) {
      for (const next of neighbors(queue[index]!, state.world.width, state.world.height)) {
        if (parents.has(next) || !isPassable(state.world.terrain[next] ?? 0) || taken.has(next)) continue;
        parents.set(next, queue[index]!); queue.push(next);
        if (next === seam.cell) { reached = true; break; }
      }
    }
    if (!reached) throw new Error('No connected ground reaches this arcane seam.');
    for (let cell: number | null = seam.cell; cell !== null && !claimed.has(cell); cell = parents.get(cell) ?? null) claimed.add(cell);
  }
  land.claimed = [...claimed].sort((a, b) => a - b);
  // The land index is the engine's own map of who holds each hex; an authored
  // claim keeps it in step exactly as the claim command does.
  const index = getLandIndex(state);
  for (const cell of land.claimed) if (!index.has(cell)) index.set(cell, town.id);
  for (const claim of land.claimed) for (const cell of cellsWithin(state, claim, 1)) state.explored[factionId]?.add(cell);
  refreshAuthoredSight(state);
  const surveys = state.arcaneSurveys[factionId] ?? (state.arcaneSurveys[factionId] = []);
  if (!surveys.includes(seam.cell)) { surveys.push(seam.cell); surveys.sort((a, b) => a - b); }
  return seam.cell;
}
