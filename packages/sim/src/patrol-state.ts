import { z } from 'zod';
import type { GameState } from './types';

/** Pure save shapes: do not import the movement/simulation graph here. */
export const MAX_PATROLS = 8192;
export const MAX_PATROLS_PER_FACTION = 128;
export const MAX_PATROL_ROUTE_ATTEMPTS = 8;
const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const cell = z.number().int().min(0).max(349_999);
const config = { factionId: id, armyId: id, firstCell: cell, secondCell: cell, enabled: z.boolean() };
export const patrolCommandSchemas = [
  z.object({ type: z.literal('setPatrol'), ...config, pauseOnWar: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('setPatrolEnabled'), factionId: id, armyId: id, enabled: z.boolean() }).strict(),
  z.object({ type: z.literal('clearPatrol'), factionId: id, armyId: id }).strict(),
] as const;
export type PatrolCommand = z.infer<typeof patrolCommandSchemas[number]>;
export const patrolSchema = z.object({ ...config, pauseOnWar: z.boolean(), target: z.enum(['first', 'second']),
  lastAttemptTurn: z.number().int().min(1).max(1_000_000).nullable(),
  lastError: z.string().min(1).max(1000).nullable(),
}).strict();
export const patrolStateSchema = z.array(patrolSchema).max(MAX_PATROLS);
export type Patrol = z.infer<typeof patrolSchema>;
export interface ObservedPatrol extends Patrol {
  targetCell: number;
  status: 'paused' | 'traveling' | 'waiting' | 'overridden' | 'ready';
  blocker: string | null;
}
export const observedPatrolSchema = patrolSchema.extend({ targetCell: cell,
  status: z.enum(['paused', 'traveling', 'waiting', 'overridden', 'ready']),
  blocker: z.string().min(1).max(1000).nullable(),
}).strict();

export function validatePatrols(state: GameState): void {
  const assert = (condition: unknown, message: string) => { if (!condition) throw new Error('Invalid save: patrol ' + message); };
  patrolStateSchema.parse(state.patrols);
  const factions = new Set(state.factions.map(faction => faction.id)), counts = new Map<string, number>();
  const cells = state.world.width * state.world.height;
  for (const [index, patrol] of state.patrols.entries()) {
    assert(!index || state.patrols[index - 1]!.armyId < patrol.armyId, 'army records must be unique and sorted.');
    assert(factions.has(patrol.factionId), 'owner does not exist.');
    counts.set(patrol.factionId, (counts.get(patrol.factionId) ?? 0) + 1);
    assert(counts.get(patrol.factionId)! <= MAX_PATROLS_PER_FACTION, 'realm exceeds its patrol limit.');
    assert(patrol.firstCell !== patrol.secondCell, 'endpoints must be distinct.');
    assert([patrol.firstCell, patrol.secondCell].every(cell => cell < cells && state.explored[patrol.factionId]?.has(cell)), 'endpoints must be explored world hexes.');
    assert(patrol.lastAttemptTurn === null ? patrol.lastError === null : patrol.lastAttemptTurn <= state.turn, 'attempt turn is invalid.');
    // Loss, transfer and composition changes can occur between allocation phases.
    // Keep that accepted command boundary saveable; allocation prunes lost armies.
  }
}

export function assertNoPatrols(state: GameState): void {
  if (state.patrols.length) throw new Error('Historical rules cannot discard army patrols.');
}
