import { z } from 'zod';
import { IMPROVEMENTS } from '@theandril/content';
import type { DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';

const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const coin = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const landPolicySchema = z.object({ settlementId: id, factionId: id, improvementId: id, allowance: coin, reserve: coin }).strict();
/** The finite world bounds policies; this is not an empire-development ceiling. */
export const landPolicyStateSchema = z.array(landPolicySchema).max(350_000);
export type LandPolicy = z.infer<typeof landPolicySchema>;
export const landPolicyCommandSchemas = [z.object({ type: z.literal('setLandPolicy'), factionId: id,
  settlementId: id, improvementId: id, allowance: coin, reserve: coin,
}).strict()] as const;
export type LandPolicyCommand = z.infer<typeof landPolicyCommandSchemas[number]>;
export interface ObservedLandPolicy extends LandPolicy { blocker: string | null }
export interface LandPolicyChoice { cell: number | null; coinCost: number | null; turns: number | null; blocker: string | null }

export function removeLandPolicy(state: GameState, settlementId: string, events: DomainEvent[], reason: 'manual' | 'lost' | 'revoked'): boolean {
  const index = state.landPolicies.findIndex(policy => policy.settlementId === settlementId);
  if (index < 0) return false;
  const policy = state.landPolicies[index]!; state.landPolicies.splice(index, 1);
  const town = state.settlements[settlementId];
  events.push({ turn: state.turn, factionId: policy.factionId, type: reason === 'lost' ? 'land_policy_lost' : 'land_policy_revoked',
    ...(town ? { cell: town.cell } : {}), message: reason === 'lost'
      ? `The land-work commission for ${settlementId} ended after settlement ownership changed.`
      : `${town?.name ?? settlementId} ended its land-work commission.${reason === 'manual' ? ' The direct land-work order took control.' : ' Existing paid work remains.'} No coin was refunded.` });
  return true;
}
export function assertNoLandPolicies(state: GameState): void {
  if (state.landPolicies.length) throw new Error('Historical rules cannot discard land policies.');
}
export function validateLandPolicies(state: GameState): void {
  landPolicyStateSchema.parse(state.landPolicies);
  const improvements = new Set(IMPROVEMENTS.filter(item => (item.introducedInRules ?? 9) <= rulesVersion(state)).map(item => item.id));
  for (const [index, policy] of state.landPolicies.entries()) {
    if (index && state.landPolicies[index - 1]!.settlementId >= policy.settlementId) throw new Error('Invalid save: land policies must be unique and sorted.');
    if (state.settlements[policy.settlementId]?.factionId !== policy.factionId || !state.land.settlements[policy.settlementId]) throw new Error('Invalid save: land policy no longer belongs to an owned settlement.');
    if (!improvements.has(policy.improvementId)) throw new Error('Invalid save: unknown land policy improvement.');
  }
}
