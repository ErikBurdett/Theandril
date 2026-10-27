import type { Observation } from '@theandril/sim';

export type LandCommissionFilter = 'all' | 'commissioned' | 'uncommissioned' | 'exhausted' | 'waiting';
export const LAND_COMMISSION_FILTERS: ReadonlyArray<{ value: LandCommissionFilter; label: string }> = [
  { value: 'all', label: 'All hearths' },
  { value: 'commissioned', label: 'With commissions' },
  { value: 'uncommissioned', label: 'Without commissions' },
  { value: 'exhausted', label: 'Zero allowance' },
  { value: 'waiting', label: 'Reported waits' },
];

type Policy = NonNullable<Observation['landPolicies']>[number];
export interface LandCommissionStatus {
  readonly settlementId: string;
  readonly policy: Readonly<Pick<Policy, 'improvementId' | 'allowance' | 'reserve' | 'blocker'>> | null;
}
export type LandCommissionIndex = ReadonlyMap<string, LandCommissionStatus>;

/** O(owned/observed towns + policies), using only supplied compact facts.
 * Undefined means this historical observation has no commission contract;
 * it must not be interpreted as an empty collection of modern commissions. */
export function buildLandCommissionIndex(view: Observation): LandCommissionIndex | undefined {
  if (view.landPolicies === undefined) return undefined;
  const result = new Map<string, LandCommissionStatus>();
  for (const town of view.settlements) if (town.factionId === view.factionId) {
    result.set(town.id, { settlementId: town.id, policy: null });
  }
  for (const policy of view.landPolicies) {
    if (policy.factionId !== view.factionId || !result.has(policy.settlementId)) continue;
    result.set(policy.settlementId, { settlementId: policy.settlementId, policy: {
      improvementId: policy.improvementId, allowance: policy.allowance, reserve: policy.reserve, blocker: policy.blocker,
    } });
  }
  return result;
}

export function matchesLandCommissionFilter(status: LandCommissionStatus, filter: LandCommissionFilter): boolean {
  switch (filter) {
    case 'all': return true;
    case 'commissioned': return status.policy !== null;
    case 'uncommissioned': return status.policy === null;
    case 'exhausted': return status.policy?.allowance === 0;
    case 'waiting': return status.policy !== null && status.policy.blocker !== null;
  }
}

/** A compact null blocker is not an affordability or suitable-land promise. */
export function filterLandCommissionEntries<T extends { id: string }>(entries: readonly T[], index: LandCommissionIndex | undefined, filter: LandCommissionFilter): readonly T[] {
  if (index === undefined || filter === 'all') return entries;
  return entries.filter(item => {
    const status = index.get(item.id);
    return status !== undefined && matchesLandCommissionFilter(status, filter);
  });
}

/** Counts overlap and use the search + production-filter cohort before paging. */
export function landCommissionCounts(ids: Iterable<string>, index: LandCommissionIndex | undefined): Record<LandCommissionFilter, number> {
  const counts: Record<LandCommissionFilter, number> = { all: 0, commissioned: 0, uncommissioned: 0, exhausted: 0, waiting: 0 };
  if (index === undefined) return counts;
  const seen = new Set<string>();
  for (const id of ids) {
    const status = index.get(id);
    if (!status || seen.has(id)) continue;
    seen.add(id);
    for (const filter of LAND_COMMISSION_FILTERS) if (matchesLandCommissionFilter(status, filter.value)) counts[filter.value]++;
  }
  return counts;
}
