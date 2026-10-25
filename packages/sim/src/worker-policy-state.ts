import { z } from 'zod';
import type { LandYield } from '@theandril/content';
import type { DomainEvent, GameState } from './types';

export const WORKER_POLICY_FOCI = ['balanced', 'food', 'industry', 'coin', 'knowledge'] as const;
export type WorkerPolicyFocus = typeof WORKER_POLICY_FOCI[number];
export const WORKER_POLICY_NAMES: Readonly<Record<WorkerPolicyFocus, string>> = {
  balanced: 'Balanced', food: 'Food', industry: 'Industry', coin: 'Coin', knowledge: 'Knowledge',
};
const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
export const workerPolicySchema = z.object({ settlementId: id, factionId: id, focus: z.enum(WORKER_POLICY_FOCI) }).strict();
/** Finite world capacity, not a policy or settlement gameplay ceiling. */
export const workerPolicyStateSchema = z.array(workerPolicySchema).max(350_000);
export type WorkerPolicy = z.infer<typeof workerPolicySchema>;
export const workerPolicyCommandSchemas = [z.object({ type: z.literal('setWorkerPolicy'), factionId: id,
  settlementId: id, focus: z.union([z.enum(WORKER_POLICY_FOCI), z.literal('none')]),
}).strict()] as const;
export type WorkerPolicyCommand = z.infer<typeof workerPolicyCommandSchemas[number]>;
export interface ObservedWorkerPolicy extends WorkerPolicy { blocker: string | null; assigned: number; capacity: number }

/** Named priorities are lexicographic: maximize that yield, then balanced value.
 * Resource extraction is a separate output and receives no hidden priority. */
export function workerPolicyScore(yields: LandYield, focus: WorkerPolicyFocus, needsFood: boolean): readonly [number, number] {
  const balanced = yields.food * (needsFood ? 5 : 2) + yields.industry * 3 + yields.coin + yields.knowledge * 2;
  return focus === 'balanced' ? [balanced, 0] : [yields[focus], balanced];
}

export function removeWorkerPolicy(state: GameState, settlementId: string, events: DomainEvent[], reason: 'manual' | 'lost' | 'revoked'): boolean {
  const index = state.workerPolicies.findIndex(policy => policy.settlementId === settlementId);
  if (index < 0) return false;
  const policy = state.workerPolicies[index]!; state.workerPolicies.splice(index, 1);
  const town = state.settlements[settlementId];
  events.push({ turn: state.turn, factionId: policy.factionId, type: reason === 'lost' ? 'worker_policy_lost' : 'worker_policy_revoked',
    ...(town ? { cell: town.cell } : {}), message: reason === 'lost'
      ? `Worker stewardship for ${settlementId} ended after settlement ownership changed.`
      : `${town?.name ?? settlementId} returned to manual worker assignments.${reason === 'manual' ? ' The direct worker order ended its standing policy.' : ' Existing assignments remain.'}` });
  return true;
}

export function assertNoWorkerPolicies(state: GameState): void {
  if (state.workerPolicies.length) throw new Error('Historical rules cannot discard worker policies.');
}

export function validateWorkerPolicies(state: GameState): void {
  workerPolicyStateSchema.parse(state.workerPolicies);
  for (const [index, policy] of state.workerPolicies.entries()) {
    if (index && state.workerPolicies[index - 1]!.settlementId >= policy.settlementId) throw new Error('Invalid save: worker policies must be unique and sorted.');
    if (state.settlements[policy.settlementId]?.factionId !== policy.factionId || !state.land.settlements[policy.settlementId]) throw new Error('Invalid save: worker policy no longer belongs to an owned settlement.');
  }
}
