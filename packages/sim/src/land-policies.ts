import { IMPROVEMENTS } from '@theandril/content';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { commissionBlocker, executeLandPolicies } from './territory';
import { removeLandPolicy, type LandPolicyCommand, type ObservedLandPolicy } from './land-policy-state';
export * from './land-policy-state';

export function setLandPolicy(state: GameState, command: LandPolicyCommand): CommandResult {
  const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
  if (rulesVersion(state) < 37) return fail('Land-work commissions require current campaign rules.');
  const town = state.settlements[command.settlementId];
  if (!town || town.factionId !== command.factionId || !state.land.settlements[town.id]) return fail('You do not control that settlement and its territory.');
  const events: DomainEvent[] = [];
  if (command.improvementId === 'none') {
    if (!removeLandPolicy(state, town.id, events, 'revoked')) return fail('This settlement has no land-work commission.');
  } else {
    const improvement = IMPROVEMENTS.find(item => item.id === command.improvementId && (item.introducedInRules ?? 9) <= rulesVersion(state));
    if (!improvement) return fail('Unknown improvement for this land-work commission.');
    const policy = { settlementId: town.id, factionId: town.factionId, improvementId: improvement.id, allowance: command.allowance, reserve: command.reserve };
    const index = state.landPolicies.findIndex(item => item.settlementId === town.id);
    if (index < 0) { state.landPolicies.push(policy); state.landPolicies.sort((a, b) => a.settlementId < b.settlementId ? -1 : 1); }
    else state.landPolicies[index] = policy;
    events.push({ turn: state.turn, factionId: town.factionId, cell: town.cell, type: 'land_policy_set',
      message: `${town.name} commissioned ${improvement.name} on suitable worked land with ${policy.allowance} coin remaining allowance and a ${policy.reserve} coin treasury reserve. The allowance is not escrowed.` });
    executeLandPolicies(state, [policy], events);
  }
  return { ok: true, events };
}
export function advanceLandPolicies(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 37 || !state.landPolicies.length) return;
  executeLandPolicies(state, state.landPolicies, events);
}
/** Summary cost is O(policies): no tile scan or candidate quote construction. */
export function observeLandPolicies(state: GameState, factionId: string): ObservedLandPolicy[] {
  return state.landPolicies.filter(policy => policy.factionId === factionId && state.settlements[policy.settlementId]?.factionId === factionId)
    .map(policy => ({ ...policy, blocker: commissionBlocker(state, policy) }));
}
