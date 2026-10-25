import type { Observation } from '@theandril/sim';

export type SettlementOrderFilter = 'all' | 'empty' | 'unchartered' | 'waiting';
export const SETTLEMENT_ORDER_FILTERS: ReadonlyArray<{ value: SettlementOrderFilter; label: string }> = [
  { value: 'all', label: 'All hearths' },
  { value: 'empty', label: 'No production' },
  { value: 'unchartered', label: 'Without charters' },
  { value: 'waiting', label: 'Charters waiting' },
];

type Charter = Observation['charters'][number];
export interface SettlementOrderStatus {
  readonly settlementId: string;
  readonly queueLength: number;
  readonly charter: Readonly<Pick<Charter, 'focus' | 'ceiling' | 'itemId' | 'itemName' | 'blocker'>> | null;
  readonly noProduction: boolean;
  readonly unchartered: boolean;
  readonly waiting: boolean;
}

/** Detached, already-observed own facts only. A candidate is not a purchase
 * promise, and a reported blocker is not necessarily a problem to repair. */
export function buildSettlementOrderIndex(view: Observation): ReadonlyMap<string, SettlementOrderStatus> {
  const result = new Map<string, SettlementOrderStatus>();
  for (const town of view.settlements) if (town.factionId === view.factionId) result.set(town.id, {
    settlementId: town.id, queueLength: town.queue.length, charter: null,
    noProduction: town.queue.length === 0, unchartered: true, waiting: false,
  });
  for (const charter of view.charters) {
    const previous = result.get(charter.settlementId);
    if (!previous || charter.factionId !== view.factionId) continue;
    result.set(charter.settlementId, { ...previous,
      charter: { focus: charter.focus, ceiling: charter.ceiling, itemId: charter.itemId, itemName: charter.itemName, blocker: charter.blocker },
      unchartered: false, waiting: previous.noProduction && charter.blocker !== null,
    });
  }
  return result;
}

export function matchesSettlementOrderFilter(status: SettlementOrderStatus, filter: SettlementOrderFilter): boolean {
  switch (filter) {
    case 'all': return true;
    case 'empty': return status.noProduction;
    case 'unchartered': return status.unchartered;
    case 'waiting': return status.waiting;
  }
}

/** Overlapping counts compose with the supplied search cohort before paging. */
export function settlementOrderCounts(ids: Iterable<string>, index: ReadonlyMap<string, SettlementOrderStatus>): Record<SettlementOrderFilter, number> {
  const counts: Record<SettlementOrderFilter, number> = { all: 0, empty: 0, unchartered: 0, waiting: 0 };
  const seen = new Set<string>();
  for (const id of ids) {
    const status = index.get(id);
    if (!status || seen.has(id)) continue;
    seen.add(id); counts.all++;
    if (status.noProduction) counts.empty++;
    if (status.unchartered) counts.unchartered++;
    if (status.waiting) counts.waiting++;
  }
  return counts;
}
