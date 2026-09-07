import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, stateHash } from '@theandril/sim';
import { characterCampaign } from '../../../packages/test-fixtures/src/character-fixture';
import { RealmNavigation, RealmRegistry, registryEntries, REGISTRY_PAGE_SIZE } from './realm-navigation';
import { SettlementProduction } from './naval';

describe('realm navigation presentation', () => {
  it('bounds the registry DOM while preserving all owned search results, stable sorting and observation purity', () => {
    const game = characterCampaign(100), view = getObservation(game, game.turnOwnerId), hash = stateHash(game);
    const before = JSON.stringify(view);
    const all = registryEntries(view, 'armies', '', 'all', 'id');
    expect(all).toHaveLength(100);
    expect(all.map(item => item.id)).toEqual(all.map(item => item.id).sort((a, b) => a.localeCompare(b)));
    const last = all.at(-1)!;
    expect(registryEntries(view, 'armies', last.id, 'all', 'name').map(item => item.id)).toContain(last.id);
    const html = renderToStaticMarkup(<RealmRegistry view={view} registry="armies" search="" force="all" selection={{}} select={() => { throw new Error('Rendering must not select or issue orders.'); }}/>);
    expect(html.match(/class="registry-item /g)).toHaveLength(REGISTRY_PAGE_SIZE);
    expect(html).toContain('Page 1 of 4');
    expect(JSON.stringify(view)).toBe(before); expect(stateHash(game)).toBe(hash);
  });

  it('does not admit an observed foreign army or town into any registry search', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const foreign = game.factions.find(faction => faction.id !== view.factionId)!.id;
    view.armies.push({ ...view.armies[0]!, id: 'foreign.secret', name: 'Foreign search target', factionId: foreign });
    expect(registryEntries(view, 'armies', 'Foreign search target', 'all', 'id')).toEqual([]);
    expect(registryEntries(view, 'settlements', '', 'all', 'id').every(item => item.factionId === view.factionId)).toBe(true);
  });

  it('uses one keyboard tablist and a real character action with a clearly named current selection', () => {
    const html = renderToStaticMarkup(<RealmNavigation registry="settlements" armyCount={100} townCount={40} characterCount={3} choose={() => {}} characters={() => {}} selectionName="Ashen Hearth" selectionKind="Selected settlement" showMap={() => {}} showOrders={() => {}}/>);
    expect(html.match(/role="tablist"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Characters &amp; agents"');
    expect(html).toContain('aria-selected="true" tabindex="0"');
    expect(html).toContain('Ashen Hearth'); expect(html).toContain('Show selected orders');
  });

  it('opens construction only; keeps actual recruitment costs, navy blockers and all command labels behind named categories', () => {
    const game = characterCampaign(), view = getObservation(game, game.turnOwnerId);
    const town = view.settlements.find(item => item.factionId === view.factionId)!;
    const html = renderToStaticMarkup(<SettlementProduction view={view} settlementId={town.id} busy={false} issue={() => { throw new Error('Rendering must not issue orders.'); }}/>);
    expect(html).toMatch(/<details[^>]*open=""[^>]*data-testid="production-building"/);
    expect(html).toMatch(/<details class="production-category" data-testid="production-land"/);
    expect(html).toMatch(/<details class="production-category" data-testid="production-naval"/);
    expect(html).toContain('Recruit fleet hulls'); expect(html).toContain('Recruit land forces');
    expect(html).toContain('aria-label="Recruit Charter transport"');
    expect(html).toContain('aria-label="Recruit Oath guard"');
    for (const option of view.productionOptions.filter(item => item.settlementId === town.id && item.blocker)) expect(html).toContain(option.blocker!.replaceAll('&', '&amp;').replaceAll("'", '&#x27;'));
  });
});
