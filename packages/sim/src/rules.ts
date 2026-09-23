import type { GameState } from './types';

export type RulesVersion = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24;
const activeRules = new WeakMap<GameState, RulesVersion>();
export const rulesVersion = (state: GameState): RulesVersion => activeRules.get(state) ?? 24;
export const LEGACY_UNIT_IDS = new Set(['unit.colonist', 'unit.scout', 'unit.guard']);
/** Frozen IDs: checking today's catalog would permit resealed future content in old saves. */
export const PRE_SPECIALIST_UNIT_IDS = new Set(['unit.colonist', 'unit.scout', 'unit.guard', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry', 'unit.transport', 'unit.coastal_warship', 'unit.ocean_warship']);

/** Execution context only, never canonical state; historical records select their own rules. */
export function withRules<T>(state: GameState, version: RulesVersion, run: () => T): T {
  const previous = activeRules.get(state);
  activeRules.set(state, version);
  try { return run(); }
  finally { if (previous === undefined) activeRules.delete(state); else activeRules.set(state, previous); }
}
