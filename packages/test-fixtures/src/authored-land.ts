import { emptyLandState, initializeSettlementLand, refreshLandKnowledge, type GameState } from '@theandril/sim';
import { rebuildIndexes } from '../../sim/src/visibility';

/** Authored setup only: explicitly seed knowledge after moving scenario entities. */
export function refreshAuthoredSight(state: GameState): void {
  const index = rebuildIndexes(state);
  for (const faction of state.factions) refreshLandKnowledge(state, faction.id, index.visible.get(faction.id) ?? new Map());
}

/** Authored setup only, never a save-loader repair or a runtime campaign action. */
export function rebaseAuthoredLand(state: GameState): void {
  state.land = emptyLandState(state.factions.map(faction => faction.id));
  for (const town of Object.values(state.settlements).sort((a, b) => a.id < b.id ? -1 : 1)) initializeSettlementLand(state, town);
  refreshAuthoredSight(state);
}
