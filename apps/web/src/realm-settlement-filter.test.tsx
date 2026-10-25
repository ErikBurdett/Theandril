import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { buildSettlementOrderIndex, matchesSettlementOrderFilter, settlementOrderCounts } from './settlement-order-status';
import { RealmRegistry, registryEntries, REGISTRY_PAGE_SIZE, SettlementOrderDetails } from './realm-navigation';
import { GroupCharterOrders } from './group-charters';
import { addGroupSelection } from './group-postings';

const forbidden = () => { throw new Error('Registry presentation must not issue commands or navigate.'); };
function fixture() {
  const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
  const town = view.settlements.find(item => item.factionId === view.factionId)!;
  // Presentation-only directory. Real command/save coverage is in the production journey.
  view.settlements = Array.from({ length: 40 }, (_, index) => ({ ...town,
    id: `town.${String(index).padStart(2, '0')}`, name: `Hearth ${String(index).padStart(2, '0')}`,
    queue: index < 10 ? [{ itemId: 'building.granary', progress: 0 }] : [],
  }));
  view.settlements.push({ ...town, id: 'foreign', name: 'Foreign hearth', factionId: 'other' });
  view.charters = view.settlements.slice(20, 40).map((item, index) => ({
    settlementId: item.id, factionId: view.factionId, focus: 'wealth', ceiling: 24,
    itemId: index < 10 ? 'building.market' : null, itemName: index < 10 ? 'Market' : null,
    blocker: index < 10 ? null : 'Every building already stands at this hearth.',
  }));
  return { game, view };
}

describe('settlement registry order filters', () => {
  it('renders exact overlapping cohort counts and only one page without mutating observation or campaign', () => {
    const { game, view } = fixture(), before = structuredClone(view), hash = stateHash(game);
    const html = renderToStaticMarkup(<RealmRegistry view={view} registry="settlements" search="" force="naval" selection={{}} select={forbidden}/>);
    expect(html).toContain('All hearths (40)'); expect(html).toContain('No production (30)');
    expect(html).toContain('Without charters (20)'); expect(html).toContain('Charters waiting (10)');
    expect(html).toContain('Page 1 of 2'); expect(html.match(/class="registry-item /g)).toHaveLength(REGISTRY_PAGE_SIZE);
    expect(html).toContain('Counts overlap'); expect(html).toContain('not guaranteed purchases');
    expect(html).not.toContain('Foreign hearth'); expect(html).not.toContain('Army orders');
    expect(view).toEqual(before); expect(stateHash(game)).toBe(hash);
  });

  it('composes search with own policy facts and finds a last-page waiting hearth before pagination', () => {
    const { view } = fixture(), index = buildSettlementOrderIndex(view);
    const entries = registryEntries(view, 'settlements', 'Hearth 3', 'naval', 'name');
    expect(settlementOrderCounts(entries.map(item => item.id), index)).toEqual({ all: 10, empty: 10, unchartered: 0, waiting: 10 });
    const waiting = registryEntries(view, 'settlements', 'town.39', 'all', 'id').filter(item => matchesSettlementOrderFilter(index.get(item.id)!, 'waiting'));
    expect(waiting.map(item => item.id)).toEqual(['town.39']);
    const html = renderToStaticMarkup(<RealmRegistry view={view} registry="settlements" search="town.39" force="all" selection={{}} select={forbidden}/>);
    expect(html).toContain('All hearths (1)'); expect(html).toContain('Charters waiting (1)'); expect(html).not.toContain('Registry pages');
  });

  it('explains queue precedence and next candidates separately from exact canonical waiting reasons', () => {
    const { view } = fixture(), index = buildSettlementOrderIndex(view);
    expect(renderToStaticMarkup(<SettlementOrderDetails status={index.get('town.00')}/>)).toContain('Direct orders · No charter');
    expect(renderToStaticMarkup(<SettlementOrderDetails status={index.get('town.20')}/>)).toContain('Next candidate: Market.');
    expect(renderToStaticMarkup(<SettlementOrderDetails status={index.get('town.39')}/>)).toContain('Every building already stands at this hearth.');
    // Contradictory transport fields may not describe a queued hearth as a promised purchase.
    const status = { ...index.get('town.20')!, queueLength: 1 };
    const queued = renderToStaticMarkup(<SettlementOrderDetails status={status}/>);
    expect(queued).toContain('Current queue comes first.'); expect(queued).not.toContain('Next candidate');
    expect(renderToStaticMarkup(<SettlementOrderDetails status={undefined}/>)).toBe('');
  });

  it('retains checked hearths outside a matching cohort and disables the filter under the shared lock', () => {
    const { view } = fixture(), matching = new Set(['town.39']);
    const checked = addGroupSelection(new Set(['town.00']), [...matching]);
    const html = renderToStaticMarkup(<GroupCharterOrders view={view} selected={checked} matching={matching} busy={false} issue={async () => forbidden()} selectMatching={forbidden} clearSelection={forbidden} accepted={forbidden}/>);
    expect(html).toContain('2 hearths selected'); expect(html).toContain('1 outside this filter');
    const locked = renderToStaticMarkup(<RealmRegistry view={view} registry="settlements" search="" force="all" selection={{}} select={forbidden} busy onGroupCharter={async () => forbidden()}/>);
    expect(locked).toContain('Settlement orders<select disabled="">');
    expect(locked.match(/type="checkbox" aria-label="[^"]+" disabled=""/g)).toHaveLength(REGISTRY_PAGE_SIZE);
    const armies = renderToStaticMarkup(<RealmRegistry view={view} registry="armies" search="" force="all" selection={{}} select={forbidden}/>);
    expect(armies).not.toContain('Settlement orders');
  });
});
