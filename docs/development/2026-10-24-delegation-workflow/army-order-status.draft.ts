/** Prepared UI projection only. No application module imports this draft. */
import type { Observation } from '../../../packages/sim/src';

export type ArmyOrderFilter = 'all' | 'standing' | 'waiting' | 'paused-patrols';
type Posting = Observation['postings'][number];
type Patrol = NonNullable<Observation['patrols']>[number];
type Route = Observation['routes'][number];
export interface ArmyOrderStatus {
  readonly armyId: string;
  readonly posting: Readonly<Pick<Posting, 'mode' | 'cell' | 'arrived' | 'blocker'>> | null;
  readonly patrol: Readonly<Pick<Patrol, 'enabled' | 'targetCell' | 'status' | 'blocker'>> | null;
  readonly route: Readonly<Pick<Route, 'status' | 'pauseReason'> & { targetCell: number }> | null;
  readonly standing: boolean;
  readonly waiting: boolean;
  readonly pausedPatrol: boolean;
}

/** Only supplied own facts enter this presentation index. No geography, route
 * search, attention priorities or command eligibility is inferred here. */
export function buildArmyOrderIndex(view: Observation): ReadonlyMap<string, ArmyOrderStatus> {
  const result = new Map<string, ArmyOrderStatus>();
  for (const army of view.armies) if (army.factionId === view.factionId) result.set(army.id, {
    armyId: army.id, posting: null, patrol: null, route: null, standing: false, waiting: false, pausedPatrol: false,
  });
  for (const posting of view.postings) {
    const previous = result.get(posting.armyId);
    if (!previous || posting.factionId !== view.factionId) continue;
    result.set(posting.armyId, { ...previous,
      posting: { mode: posting.mode, cell: posting.cell, arrived: posting.arrived, blocker: posting.blocker },
      standing: true, waiting: previous.waiting || posting.blocker !== null,
    });
  }
  for (const patrol of view.patrols ?? []) {
    const previous = result.get(patrol.armyId);
    if (!previous || patrol.factionId !== view.factionId) continue;
    result.set(patrol.armyId, { ...previous,
      patrol: { enabled: patrol.enabled, targetCell: patrol.targetCell, status: patrol.status, blocker: patrol.blocker },
      standing: true, waiting: previous.waiting || (patrol.enabled && patrol.status === 'waiting'), pausedPatrol: !patrol.enabled,
    });
  }
  for (const route of view.routes) {
    const previous = result.get(route.armyId);
    if (!previous) continue;
    result.set(route.armyId, { ...previous,
      route: { status: route.status, pauseReason: route.pauseReason, targetCell: route.waypoints[route.waypoints.length - 1]! },
      waiting: previous.waiting || route.status === 'paused',
    });
  }
  return result;
}

export function matchesArmyOrderFilter(status: ArmyOrderStatus, filter: ArmyOrderFilter): boolean {
  switch (filter) {
    case 'all': return true;
    case 'standing': return status.standing;
    case 'waiting': return status.waiting;
    case 'paused-patrols': return status.pausedPatrol;
  }
}

/** Counts compose with existing search/domain filtering before pagination. */
export function armyOrderCounts(ids: Iterable<string>, index: ReadonlyMap<string, ArmyOrderStatus>): Record<ArmyOrderFilter, number> {
  const counts: Record<ArmyOrderFilter, number> = { all: 0, standing: 0, waiting: 0, 'paused-patrols': 0 };
  const seen = new Set<string>();
  for (const id of ids) {
    const status = index.get(id);
    if (!status || seen.has(id)) continue;
    seen.add(id); counts.all++;
    if (status.standing) counts.standing++;
    if (status.waiting) counts.waiting++;
    if (status.pausedPatrol) counts['paused-patrols']++;
  }
  return counts;
}
