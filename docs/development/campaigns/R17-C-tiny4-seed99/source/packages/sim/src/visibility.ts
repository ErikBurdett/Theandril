import { neighbors } from '@theandril/mapgen';
import { armySight } from './army-composition';
import type { GameState } from './types';
import { observeLandCell, refreshLandKnowledge } from './territory';
import { rulesVersion } from './rules';
import { rememberRoadCell } from './roads';

export interface SpatialIndex {
  armies: Map<number, Set<string>>;
  settlements: Map<number, string>;
  visible: Map<string, Map<number, number>>;
}

const cache = new WeakMap<GameState, SpatialIndex>();

/** Visits only a source's bounded local hex disk, never the global tile array. */
export function cellsWithin(state: GameState, origin: number, radius: number): number[] {
  const visited = new Set([origin]);
  let frontier = [origin];
  for (let distance = 0; distance < radius; distance++) {
    const next: number[] = [];
    for (const cell of frontier) {
      for (const adjacent of neighbors(cell, state.world.width, state.world.height)) {
        if (!visited.has(adjacent)) { visited.add(adjacent); next.push(adjacent); }
      }
    }
    frontier = next;
  }
  return [...visited];
}

function changeSight(state: GameState, index: SpatialIndex, factionId: string, cell: number, radius: number, delta: 1 | -1): void {
  const visible = index.visible.get(factionId);
  const explored = state.explored[factionId];
  if (!visible || !explored) throw new Error('Missing faction visibility');
  for (const seen of cellsWithin(state, cell, radius)) {
    const count = (visible.get(seen) ?? 0) + delta;
    if (count > 0) visible.set(seen, count);
    else visible.delete(seen);
    if (delta > 0) explored.add(seen);
  }
}

export function rebuildIndexes(state: GameState): SpatialIndex {
  const index: SpatialIndex = {
    armies: new Map(), settlements: new Map(),
    visible: new Map(state.factions.map(faction => [faction.id, new Map()])),
  };
  for (const army of Object.values(state.armies)) {
    if (state.transports[army.id]) continue;
    const occupants = index.armies.get(army.cell) ?? new Set<string>();
    occupants.add(army.id); index.armies.set(army.cell, occupants);
    changeSight(state, index, army.factionId, army.cell, armySight(army), 1);
  }
  for (const settlement of Object.values(state.settlements)) {
    index.settlements.set(settlement.cell, settlement.id);
    changeSight(state, index, settlement.factionId, settlement.cell, 3, 1);
    if (claimSightEnabled(state)) for (const cell of state.land.settlements[settlement.id]?.claimed ?? []) changeSight(state, index, settlement.factionId, cell, 1, 1);
  }
  cache.set(state, index);
  return index;
}

export function indexes(state: GameState): SpatialIndex {
  return cache.get(state) ?? rebuildIndexes(state);
}

export function updateSight(state: GameState, factionId: string, cell: number, radius: number, delta: 1 | -1): void {
  changeSight(state, indexes(state), factionId, cell, radius, delta);
  if (delta > 0 && rulesVersion(state) >= 9) for (const seen of cellsWithin(state, cell, radius)) observeLandCell(state, factionId, seen, true);
  if (delta > 0 && rulesVersion(state) >= 12) for (const seen of cellsWithin(state, cell, radius)) rememberRoadCell(state, factionId, seen);
}

/** Migrated saves retain their original sight until a successful modern action. */
export function claimSightEnabled(state: GameState): boolean {
  return rulesVersion(state) >= 16 && state.land.visibilityVersion === 1;
}

/** Command-bound transition only. Loading and querying must never call this. */
export function upgradeLandVisibility(state: GameState): void {
  if (rulesVersion(state) < 16 || state.land.visibilityVersion === 1) return;
  state.land.visibilityVersion = 1;
  const index = rebuildIndexes(state);
  for (const faction of state.factions) {
    const visible = index.visible.get(faction.id)!;
    refreshLandKnowledge(state, faction.id, visible);
    for (const cell of visible.keys()) rememberRoadCell(state, faction.id, cell);
  }
}
