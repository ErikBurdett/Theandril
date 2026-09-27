import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BUILDINGS } from '@theandril/content';
import { MAX_PRODUCTION_TEMPLATE_ITEMS } from '@theandril/persistence';
import { applyCommand, getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { MAX_GROUP_PRODUCTION_SETTLEMENTS, MAX_PRODUCTION_SEQUENCE_ITEMS, type GroupProductionResult } from './protocol';
import { completeProductionHearths, GroupProductionOrders, GroupProductionResults, groupProductionRequest, productionSequenceValid } from './group-production';

describe('group production editor', () => {
  it('snapshots only owned selected hearths in bounded stable order and preserves the authored sequence', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const town = view.settlements.find(item => item.factionId === view.factionId)!;
    view.settlements = Array.from({ length: 140 }, (_, index) => ({ ...town, id: `hearth.${String(index).padStart(3, '0')}` })).reverse();
    view.settlements.push({ ...town, id: 'foreign', factionId: 'foreign-realm' });
    const selected = new Set([...view.settlements.map(item => item.id), 'lost']);
    const itemIds = ['unit.guard', 'building.workshop', 'unit.guard'];
    const before = JSON.stringify(view), hash = stateHash(game);
    const request = groupProductionRequest(view, selected, itemIds)!;
    expect(request.settlementIds).toEqual(Array.from({ length: MAX_GROUP_PRODUCTION_SETTLEMENTS }, (_, index) => `hearth.${String(index).padStart(3, '0')}`));
    expect(request.itemIds).toEqual(itemIds); expect(request.itemIds).not.toBe(itemIds);
    expect(request.factionId).toBe(view.factionId);
    itemIds.pop(); selected.clear();
    expect(request.itemIds).toEqual(['unit.guard', 'building.workshop', 'unit.guard']);
    expect(request.settlementIds).toHaveLength(MAX_GROUP_PRODUCTION_SETTLEMENTS);
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('keeps editor/template bounds aligned while leaving canonical availability to queue commands', () => {
    expect(MAX_PRODUCTION_SEQUENCE_ITEMS).toBe(MAX_PRODUCTION_TEMPLATE_ITEMS);
    expect(productionSequenceValid(Array(MAX_PRODUCTION_SEQUENCE_ITEMS).fill('unit.guard'))).toBe(true);
    expect(productionSequenceValid(['building.harbor', 'unit.transport'])).toBe(true);
    for (const items of [[], Array(MAX_PRODUCTION_SEQUENCE_ITEMS + 1).fill('unit.guard'), ['unknown.item'], ['building.granary', 'building.granary']]) expect(productionSequenceValid(items)).toBe(false);
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const town = view.settlements.find(item => item.factionId === view.factionId)!;
    view.treasury = 0;
    expect(groupProductionRequest(view, new Set([town.id]), ['unit.guard'])).toEqual({ factionId: view.factionId, settlementIds: [town.id], itemIds: ['unit.guard'] });
    expect(groupProductionRequest(view, new Set(['lost']), ['unit.guard'])).toBeUndefined();
    expect(groupProductionRequest(view, new Set([town.id]), [])).toBeUndefined();
  });

  it('keeps a hearth with a real paid prefix selected after canonical budget refusal', () => {
    const game = characterCampaign(), first = getObservation(game, game.turnOwnerId);
    const town = first.settlements.find(item => item.factionId === first.factionId)!;
    const choices = first.productionOptions.filter(option => option.settlementId === town.id && option.kind === 'building' && option.canQueue).slice(0, 2);
    expect(choices).toHaveLength(2);
    const itemIds = choices.map(option => option.itemId);
    const firstCost = BUILDINGS.find(item => item.id === itemIds[0])!.coinCost;
    game.factions.find(item => item.id === first.factionId)!.treasury = firstCost;
    const view = getObservation(game, game.turnOwnerId), hash = stateHash(game);
    const request = groupProductionRequest(view, new Set([town.id]), itemIds)!;
    const row: GroupProductionResult = { settlementId: town.id, orders: [] };
    for (const itemId of request.itemIds) {
      const result = applyCommand(game, { type: 'queue', factionId: view.factionId, settlementId: town.id, itemId });
      row.orders.push({ itemId, accepted: result.ok, ...(!result.ok ? { message: result.error } : {}) });
      if (!result.ok) break;
    }
    expect(row.orders.map(order => order.accepted)).toEqual([true, false]);
    expect(game.settlements[town.id]!.queue.at(-1)?.itemId).toBe(itemIds[0]);
    expect(getObservation(game, game.turnOwnerId).treasury).toBe(0);
    expect(stateHash(game)).not.toBe(hash);
    expect(completeProductionHearths([row], itemIds)).toEqual(new Set());
  });

  it('clears only complete matching sequences and explains paid prefixes and skipped items', () => {
    const itemIds = ['unit.guard', 'building.workshop', 'unit.guard'];
    const rows = [
      { settlementId: 'complete', name: 'Complete hearth', orders: itemIds.map(itemId => ({ itemId, accepted: true })) },
      { settlementId: 'partial', name: 'Partial hearth', orders: [{ itemId: 'unit.guard', accepted: true }, { itemId: 'building.workshop', accepted: false, message: 'Insufficient coin.' }] },
    ];
    expect(completeProductionHearths(rows, itemIds)).toEqual(new Set(['complete']));
    expect(completeProductionHearths([{ settlementId: 'short', orders: [{ itemId: 'unit.guard', accepted: true }] }], itemIds)).toEqual(new Set());
    expect(completeProductionHearths([{ settlementId: 'wrong', orders: [{ itemId: 'building.workshop', accepted: true }] }], ['unit.guard'])).toEqual(new Set());
    const html = renderToStaticMarkup(<GroupProductionResults result={{ rows, itemIds }}/>);
    expect(html).toContain('1 hearth complete · 1 partial or refused. 4 orders accepted · 1 refused.');
    expect(html).toContain('Paid and queued'); expect(html).toContain('Refused: Insufficient coin.');
    expect(html).toContain('1 later item was not attempted.');
    expect(html).toContain('Partial and refused hearths remain selected.');
    expect(html).toContain('Nothing is retried automatically.');
  });

  it('starts empty and collapsed with explicit shared-budget, prerequisite and queue consequences', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const town = view.settlements.find(item => item.factionId === view.factionId)!;
    town.queue = [{ itemId: 'unit.guard', progress: 0 }];
    const issue = vi.fn(async () => []), accepted = vi.fn(), pending = vi.fn();
    const html = renderToStaticMarkup(<GroupProductionOrders view={view} selected={new Set([town.id])} busy issue={issue} accepted={accepted} onPendingChange={pending}/>);
    expect(html).toContain('<summary>Production sequences</summary>'); expect(html).not.toContain(' open=');
    expect(html).toContain('No projects in this sequence yet.');
    expect(html).toContain(`Treasury: ${view.treasury} coin.`);
    expect(html).toContain('Existing queues: 1 project across 1 selected hearth. Those orders come first.');
    expect(html).toContain('spend coin immediately'); expect(html).toContain('no rollback or automatic retry');
    expect(html).toContain('a queued prerequisite cannot unlock a later project immediately');
    expect(html).toContain('<button class="primary" disabled="">Apply production (1)</button>');
    expect(html).toContain('<summary>Production templates</summary>');
    expect(issue).not.toHaveBeenCalled(); expect(accepted).not.toHaveBeenCalled(); expect(pending).not.toHaveBeenCalled();
  });
});
