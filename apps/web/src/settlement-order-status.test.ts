import { describe, expect, it } from 'vitest';
import { getObservation, type Observation } from '@theandril/sim';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { buildSettlementOrderIndex, matchesSettlementOrderFilter, settlementOrderCounts, SETTLEMENT_ORDER_FILTERS } from './settlement-order-status';

function roster() {
  const game = theaterCampaign(2), view = getObservation(game, game.turnOwnerId);
  const town = view.settlements.find(item => item.factionId === view.factionId)!;
  // Explicit observation contract, not a claim of forty canonically earned towns.
  view.settlements = Array.from({ length: 40 }, (_, index) => ({ ...structuredClone(town),
    id: `town.${String(index).padStart(2, '0')}`, name: `Observed Hearth ${index}`, queue: [],
  }));
  view.charters = [];
  return view;
}
function charter(view: Observation, index: number, fields: Partial<Observation['charters'][number]> = {}): Observation['charters'][number] {
  return { settlementId: view.settlements[index]!.id, factionId: view.factionId, focus: 'wealth', ceiling: 24,
    itemId: 'building.market', itemName: 'Market', blocker: null, ...fields };
}

describe('owned settlement order presentation', () => {
  it('projects all forty towns using only supplied town/charter facts without mutating the observation', () => {
    const view = roster(); view.charters = [charter(view, 39)];
    const before = structuredClone(view);
    const guarded = new Proxy(view, { get(target, key, receiver) {
      if (!['settlements', 'charters', 'factionId'].includes(String(key))) throw new Error('Order projection must not inspect other game state.');
      return Reflect.get(target, key, receiver);
    } });
    const index = buildSettlementOrderIndex(guarded);
    expect(index.size).toBe(40);
    expect(index.get('town.39')).toEqual({ settlementId: 'town.39', queueLength: 0,
      charter: { focus: 'wealth', ceiling: 24, itemId: 'building.market', itemName: 'Market', blocker: null },
      noProduction: true, unchartered: false, waiting: false });
    expect(view).toEqual(before);
  });

  it('keeps empty queues, candidate work, missing charters and reported waiting as separate overlapping facts', () => {
    const view = roster();
    view.settlements[2]!.queue = [{ itemId: 'building.market', progress: 0 }];
    view.charters = [charter(view, 1), charter(view, 3, { itemId: null, itemName: null, blocker: 'Every building already stands at this hearth.' })];
    const index = buildSettlementOrderIndex(view);
    expect(index.get('town.00')).toMatchObject({ noProduction: true, unchartered: true, waiting: false });
    expect(index.get('town.01')).toMatchObject({ noProduction: true, unchartered: false, waiting: false });
    expect(index.get('town.02')).toMatchObject({ noProduction: false, unchartered: true, waiting: false });
    expect(index.get('town.03')).toMatchObject({ noProduction: true, unchartered: false, waiting: true });
    expect(SETTLEMENT_ORDER_FILTERS.map(filter => [filter.label, matchesSettlementOrderFilter(index.get('town.03')!, filter.value)]))
      .toEqual([['All hearths', true], ['No production', true], ['Without charters', false], ['Charters waiting', true]]);
  });

  it('honors a queued order even when supplied charter metadata contains a contradictory blocker', () => {
    const view = roster();
    view.settlements[0]!.queue = [{ itemId: 'building.market', progress: 1 }, { itemId: 'building.farm', progress: 0 }];
    view.charters = [charter(view, 0, { itemId: null, itemName: null, blocker: 'Exact reported budget reason.' })];
    expect(buildSettlementOrderIndex(view).get('town.00')).toMatchObject({ queueLength: 2, noProduction: false, unchartered: false, waiting: false,
      charter: { blocker: 'Exact reported budget reason.' } });
  });

  it('detaches scalar queue and charter data from later observation mutation', () => {
    const view = roster(); view.charters = [charter(view, 0)];
    const index = buildSettlementOrderIndex(view), snapshot = structuredClone(index.get('town.00'));
    expect(index.get('town.00')!.charter).not.toBe(view.charters[0]);
    view.settlements[0]!.queue.push({ itemId: 'building.market', progress: 0 });
    Object.assign(view.charters[0]!, { focus: 'muster', ceiling: 4, itemId: null, itemName: null, blocker: 'New exact reason.' });
    expect(index.get('town.00')).toEqual(snapshot);
    expect(buildSettlementOrderIndex(view).get('town.00')).toMatchObject({ queueLength: 1, noProduction: false, waiting: false,
      charter: { focus: 'muster', ceiling: 4, itemId: null, itemName: null, blocker: 'New exact reason.' } });
  });

  it('ignores foreign towns, mismatched charter owners and orphaned charters', () => {
    const view = roster();
    view.settlements.push({ ...structuredClone(view.settlements[0]!), id: 'foreign.town', factionId: 'foreign.realm' });
    view.charters = [charter(view, 0, { factionId: 'foreign.realm' }),
      charter(view, 0, { settlementId: 'foreign.town' }), charter(view, 0, { settlementId: 'missing.town' }), charter(view, 1)];
    const index = buildSettlementOrderIndex(view);
    expect(index.size).toBe(40); expect(index.has('foreign.town')).toBe(false); expect(index.has('missing.town')).toBe(false);
    expect(index.get('town.00')).toMatchObject({ charter: null, unchartered: true, waiting: false });
    expect(index.get('town.01')!.charter?.focus).toBe('wealth');
  });

  it('counts each known search-cohort town once and retains exact canonical reason text', () => {
    const view = roster();
    view.settlements[0]!.queue = [{ itemId: 'building.market', progress: 0 }];
    const reason = 'Nothing this charter builds costs 4 coin or less; raise the ceiling.';
    view.charters = [charter(view, 1, { ceiling: 4, itemId: null, itemName: null, blocker: reason }), charter(view, 39)];
    const index = buildSettlementOrderIndex(view);
    expect(settlementOrderCounts(['town.00', 'town.01', 'town.39', 'town.39', 'missing'], index))
      .toEqual({ all: 3, empty: 2, unchartered: 1, waiting: 1 });
    expect(settlementOrderCounts([], index)).toEqual({ all: 0, empty: 0, unchartered: 0, waiting: 0 });
    expect(index.get('town.01')!.charter!.blocker).toBe(reason);
    expect([...index.values()].filter(status => matchesSettlementOrderFilter(status, 'waiting')).map(status => status.settlementId))
      .toEqual(['town.01']);
  });
});
