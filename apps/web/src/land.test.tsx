import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FACTIONS } from '@theandril/content';
import { applyCommand, createGame, getObservation } from '@theandril/sim';
import { FactionSelection, SettlementLand, yieldText } from './land';

function campaign() {
  const game = createGame({ seed: 17, size: 'tiny', pace: 'short', factionCount: 2 });
  expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Worked hearth' }).ok).toBe(true);
  return game;
}
describe('authoritative settlement land controls', () => {
  it('labels signed bonuses and penalties without hiding zero totals behind an invented formula', () => {
    expect(yieldText({ food: -1, industry: 3, coin: 0, knowledge: 1 })).toBe('−1 food, +3 industry, +1 knowledge');
    expect(yieldText({ food: 0, industry: 0, coin: 0, knowledge: 0 })).toBe('No change');
  });
  it('renders all six selectable cultures and exact positive and negative affinity descriptions', () => {
    const html = renderToStaticMarkup(createElement(FactionSelection, { value: 'faction.iron_covenant', onChange: () => undefined }));
    for (const faction of FACTIONS) expect(html).toContain(faction.name);
    expect(html).toContain('value="faction.iron_covenant" selected=""');
    expect(html).toContain('−1'); expect(html).toContain('+1 industry'); expect(html).toContain('Cultivation traditions');
  });
  it('uses quoted costs and explains colony/capital independently, including insufficient funds', () => {
    const game = campaign(), view = getObservation(game, game.turnOwnerId), town = view.land.settlements[0]!;
    const cell = town.cells.find(item => item.cell !== view.settlements[0]!.cell)!;
    const html = renderToStaticMarkup(createElement(SettlementLand, { view, settlementId: town.settlementId, selectedCell: cell.cell, busy: false, selectCell: () => undefined, issue: () => undefined }));
    expect(html).toContain('colony · Capital'); expect(html).toContain('0 / 1 assigned workers');
    expect(html).toContain('Yield breakdown per worked turn'); expect(html).toContain('Faction affinity');
    for (const option of cell.improvementOptions) expect(html).toContain(`${option.coinCost} coin upfront · ${option.turns} turns`);
    expect(html).toContain('Select tiles'); expect(html).not.toContain('Designate capital');
    game.factions[0]!.treasury = 0;
    const poor = renderToStaticMarkup(createElement(SettlementLand, { view: getObservation(game, game.turnOwnerId), settlementId: town.settlementId, selectedCell: cell.cell, busy: false, selectCell: () => undefined, issue: () => undefined }));
    expect(poor).toMatch(/<button disabled="">Build /);
  });
  it('does not expose another settlement or fabricate options for an unobserved selected tile', () => {
    const game = campaign(), view = getObservation(game, game.turnOwnerId), town = view.land.settlements[0]!;
    const html = renderToStaticMarkup(createElement(SettlementLand, { view, settlementId: town.settlementId, selectedCell: 999999, busy: false, selectCell: () => undefined, issue: () => undefined }));
    expect(html).toContain('outside this settlement’s known land options'); expect(html).not.toContain('Build Terraced');
    expect(renderToStaticMarkup(createElement(SettlementLand, { view, settlementId: 'foreign.missing', busy: false, selectCell: () => undefined, issue: () => undefined }))).toBe('');
  });
  it('keeps summary totals during lazy loading without showing stale quotes or an outside-territory refusal', () => {
    const game = campaign(), view = getObservation(game, game.turnOwnerId), town = view.land.settlements[0]!;
    const html = renderToStaticMarkup(createElement(SettlementLand, { view, settlementId: town.settlementId, selectedCell: town.cells[0]!.cell, busy: false, selectCell: () => undefined, issue: () => undefined, stateHash: 'current', query: async () => ({ settlementId: town.settlementId, town, hash: 'current' }) }));
    expect(html).toContain('colony · Capital'); expect(html).toContain('assigned workers');
    expect(html).toContain('Loading current land details'); expect(html).toContain('data-query-state="loading"');
    expect(html).not.toContain('outside this settlement'); expect(html).not.toContain('Yield breakdown per worked turn');
    expect(html).not.toContain('Build Terraced'); expect(html).toContain('<button type="button" disabled="" aria-expanded="false">Select tiles');
  });
});
