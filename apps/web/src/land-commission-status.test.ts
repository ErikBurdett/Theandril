import { describe, expect, it } from 'vitest';
import { getObservation, type Observation } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { buildLandCommissionIndex, filterLandCommissionEntries, landCommissionCounts, matchesLandCommissionFilter } from './land-commission-status';
import { buildSettlementOrderIndex, matchesSettlementOrderFilter, settlementOrderCounts } from './settlement-order-status';

function roster() {
  const game = theaterCampaign(2), view = getObservation(game, game.turnOwnerId);
  const town = view.settlements.find(item => item.factionId === view.factionId)!;
  // An explicit observation fixture, not canonically earned forty-hearth growth.
  view.settlements = Array.from({ length: 40 }, (_, index) => ({ ...structuredClone(town),
    id: `town.${String(index).padStart(2, '0')}`, name: `Observed Hearth ${index}`, queue: [],
  }));
  view.landPolicies = []; view.charters = [];
  return view;
}
function policy(view: Observation, index: number, fields: Partial<NonNullable<Observation['landPolicies']>[number]> = {}) {
  return { settlementId: view.settlements[index]!.id, factionId: view.factionId,
    improvementId: 'improvement.terraced_fields', allowance: 100, reserve: 10, blocker: null, ...fields };
}

describe('owned land commission presentation', () => {
  it('indexes every owned hearth using only compact supplied fields without mutating the observation', () => {
    const view = roster(); view.landPolicies = [policy(view, 39)];
    const before = structuredClone(view);
    const guarded = new Proxy(view, { get(target, key, receiver) {
      if (!['settlements', 'landPolicies', 'factionId'].includes(String(key))) throw new Error('Commission projection must not query land, treasury or prices.');
      return Reflect.get(target, key, receiver);
    } });
    const index = buildLandCommissionIndex(guarded)!;
    expect(index.size).toBe(40);
    expect(index.get('town.00')).toEqual({ settlementId: 'town.00', policy: null });
    expect(index.get('town.39')).toEqual({ settlementId: 'town.39', policy: {
      improvementId: 'improvement.terraced_fields', allowance: 100, reserve: 10, blocker: null,
    } });
    expect(view).toEqual(before);
  });

  it('keeps zero allowances and reported waits independent, including paid work and null blockers', () => {
    const view = roster(); view.landPolicies = [
      policy(view, 0, { allowance: 0, blocker: 'Existing paid land work must finish first.' }),
      policy(view, 1, { allowance: 0 }),
      policy(view, 2, { blocker: 'The treasury is at or below the 10 coin reserve.' }),
      policy(view, 3, { allowance: 1 }),
    ];
    const index = buildLandCommissionIndex(view)!;
    expect(matchesLandCommissionFilter(index.get('town.00')!, 'exhausted')).toBe(true);
    expect(matchesLandCommissionFilter(index.get('town.00')!, 'waiting')).toBe(true);
    expect(matchesLandCommissionFilter(index.get('town.01')!, 'exhausted')).toBe(true);
    expect(matchesLandCommissionFilter(index.get('town.01')!, 'waiting')).toBe(false);
    expect(matchesLandCommissionFilter(index.get('town.02')!, 'exhausted')).toBe(false);
    expect(matchesLandCommissionFilter(index.get('town.02')!, 'waiting')).toBe(true);
    // One coin need not afford the next job. This selector must not invent that quote.
    expect(matchesLandCommissionFilter(index.get('town.03')!, 'waiting')).toBe(false);
    expect(landCommissionCounts(view.settlements.map(town => town.id), index))
      .toEqual({ all: 40, commissioned: 4, uncommissioned: 36, exhausted: 2, waiting: 2 });
  });

  it('ignores foreign, mismatched and orphaned policy metadata and detaches retained facts', () => {
    const view = roster();
    view.settlements.push({ ...view.settlements[0]!, id: 'foreign.town', factionId: 'foreign.realm' });
    view.landPolicies = [policy(view, 0, { factionId: 'foreign.realm' }), policy(view, 0, { settlementId: 'foreign.town' }),
      policy(view, 0, { settlementId: 'missing.town' }), policy(view, 39, { blocker: 'Exact reported reason.' })];
    const index = buildLandCommissionIndex(view)!;
    expect(index.size).toBe(40); expect(index.has('foreign.town')).toBe(false); expect(index.has('missing.town')).toBe(false);
    expect(index.get('town.00')!.policy).toBeNull();
    expect(index.get('town.39')!.policy).not.toBe(view.landPolicies[3]);
    view.landPolicies[3]!.allowance = 0; view.landPolicies[3]!.blocker = null;
    expect(index.get('town.39')!.policy).toMatchObject({ allowance: 100, blocker: 'Exact reported reason.' });
    expect(buildLandCommissionIndex(view)!.get('town.39')!.policy).toMatchObject({ allowance: 0, blocker: null });
  });

  it('does not misclassify historical absence as uncommissioned or apply a stale filter', () => {
    const view = roster(); delete view.landPolicies;
    const index = buildLandCommissionIndex(view);
    expect(index).toBeUndefined();
    for (const filter of ['commissioned', 'uncommissioned', 'exhausted', 'waiting'] as const) {
      expect(filterLandCommissionEntries(view.settlements, index, filter)).toBe(view.settlements);
    }
    expect(landCommissionCounts(view.settlements.map(town => town.id), index))
      .toEqual({ all: 0, commissioned: 0, uncommissioned: 0, exhausted: 0, waiting: 0 });
    view.landPolicies = [];
    expect(landCommissionCounts(view.settlements.map(town => town.id), buildLandCommissionIndex(view)).uncommissioned).toBe(40);
  });

  it('counts unique cohort ids, preserves cohort order, and excludes unknown ids from selected filters', () => {
    const view = roster(); view.landPolicies = [policy(view, 1, { allowance: 0 }), policy(view, 39)];
    const index = buildLandCommissionIndex(view);
    expect(landCommissionCounts(['town.39', 'town.01', 'town.01', 'town.02', 'missing'], index))
      .toEqual({ all: 3, commissioned: 2, uncommissioned: 1, exhausted: 1, waiting: 0 });
    const cohort = [{ id: 'town.39' }, { id: 'missing' }, { id: 'town.02' }, { id: 'town.01' }];
    expect(filterLandCommissionEntries(cohort, index, 'commissioned').map(item => item.id)).toEqual(['town.39', 'town.01']);
    expect(filterLandCommissionEntries(cohort, index, 'uncommissioned').map(item => item.id)).toEqual(['town.02']);
    expect(filterLandCommissionEntries(cohort, index, 'all')).toBe(cohort);
  });

  it('composes commission counts after production filtering without changing production counts', () => {
    const view = roster();
    view.settlements[0]!.queue = [{ itemId: 'building.market', progress: 0 }];
    view.landPolicies = [policy(view, 0, { allowance: 0 }), policy(view, 1, { allowance: 0 }), policy(view, 39)];
    const searchCohort = view.settlements.filter(town => ['town.00', 'town.01', 'town.02'].includes(town.id));
    const orders = buildSettlementOrderIndex(view), land = buildLandCommissionIndex(view);
    const counts = settlementOrderCounts(searchCohort.map(town => town.id), orders);
    const noProduction = searchCohort.filter(town => matchesSettlementOrderFilter(orders.get(town.id)!, 'empty'));
    expect(landCommissionCounts(noProduction.map(town => town.id), land))
      .toEqual({ all: 2, commissioned: 1, uncommissioned: 1, exhausted: 1, waiting: 0 });
    expect(filterLandCommissionEntries(noProduction, land, 'exhausted').map(town => town.id)).toEqual(['town.01']);
    expect(settlementOrderCounts(searchCohort.map(town => town.id), orders)).toEqual(counts);
    expect(counts).toEqual({ all: 3, empty: 2, unchartered: 3, waiting: 0 });
  });
});
