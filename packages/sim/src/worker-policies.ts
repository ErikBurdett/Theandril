import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { allocatePolicyWorkers, settlementWorkerCapacity, workerAllocationBlocker } from './territory';
import { removeWorkerPolicy, WORKER_POLICY_NAMES, type ObservedWorkerPolicy, type WorkerPolicyCommand } from './worker-policy-state';
export * from './worker-policy-state';

export function setWorkerPolicy(state: GameState, command: WorkerPolicyCommand): CommandResult {
  const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
  if (rulesVersion(state) < 36) return fail('Worker stewardship requires current campaign rules.');
  const town = state.settlements[command.settlementId];
  if (!town || town.factionId !== command.factionId || !state.land.settlements[town.id]) return fail('You do not control that settlement and its territory.');
  const events: DomainEvent[] = [];
  if (command.focus === 'none') {
    if (!removeWorkerPolicy(state, town.id, events, 'revoked')) return fail('This settlement has no worker policy.');
  } else {
    const policy = { settlementId: town.id, factionId: town.factionId, focus: command.focus };
    const index = state.workerPolicies.findIndex(item => item.settlementId === town.id);
    if (index < 0) { state.workerPolicies.push(policy); state.workerPolicies.sort((a, b) => a.settlementId < b.settlementId ? -1 : 1); }
    else state.workerPolicies[index] = policy;
    events.push({ turn: state.turn, factionId: town.factionId, cell: town.cell, type: 'worker_policy_set',
      message: `${town.name} adopted ${WORKER_POLICY_NAMES[policy.focus]} worker stewardship. Claimed land is reassigned now when available, then after each turn for the following harvest.` });
    allocatePolicyWorkers(state, [policy], events);
  }
  return { ok: true, events };
}

/** Policies read only their own actual claims; all town changes finish first. */
export function advanceWorkerPolicies(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 36 || !state.workerPolicies.length) return;
  allocatePolicyWorkers(state, state.workerPolicies, events);
}

/** O(policies), no tile scoring or production/land quotes in the summary. */
export function observeWorkerPolicies(state: GameState, factionId: string): ObservedWorkerPolicy[] {
  return state.workerPolicies.filter(policy => policy.factionId === factionId && state.settlements[policy.settlementId]?.factionId === factionId)
    .map(policy => {
      const town = state.settlements[policy.settlementId]!, land = state.land.settlements[town.id]!;
      return { ...policy, blocker: workerAllocationBlocker(state, town), assigned: land.worked.length, capacity: settlementWorkerCapacity(town, rulesVersion(state)) };
    });
}
