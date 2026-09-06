import type { GameState } from './types';

export type RulesVersion = 4 | 5 | 6 | 7 | 8 | 9 | 10;
const activeRules = new WeakMap<GameState, RulesVersion>();
export const rulesVersion = (state: GameState): RulesVersion => activeRules.get(state) ?? 10;
export const LEGACY_UNIT_IDS = new Set(['unit.colonist', 'unit.scout', 'unit.guard']);

/** Execution context only, never canonical state; historical records select their own rules. */
export function withRules<T>(state: GameState, version: RulesVersion, run: () => T): T {
  const previous = activeRules.get(state);
  activeRules.set(state, version);
  try { return run(); }
  finally { if (previous === undefined) activeRules.delete(state); else activeRules.set(state, previous); }
}
