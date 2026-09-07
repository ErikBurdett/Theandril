import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FACTIONS, FACTION_ECOLOGIES, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, UNITS } from '@theandril/content';
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
  it('renders every selectable culture and exact positive and negative affinity descriptions', () => {
    const html = renderToStaticMarkup(createElement(FactionSelection, { value: 'faction.iron_covenant', onChange: () => undefined }));
    for (const faction of FACTIONS) expect(html).toContain(faction.name);
    expect(html).toContain('value="faction.iron_covenant" selected=""');
    expect(html).toContain('−1'); expect(html).toContain('+1 industry'); expect(html).toContain('Cultivation traditions');
  });
  it('uses all twelve real profiles, signed ecology and shared-unit AI weights without borrowing another culture', () => {
    expect(FACTIONS).toHaveLength(12);
    for (const faction of FACTIONS) {
      const html = renderToStaticMarkup(createElement(FactionSelection, { value: faction.id, onChange: () => undefined }));
      expect(html.match(/<option /g)).toHaveLength(12);
      expect(html).toContain(`data-definition-id="${faction.id}"`);
      // Check prose through the same HTML escaping as React's text nodes.
      expect(html).toContain(renderToStaticMarkup(createElement('p', { className: 'faction-profile' }, FACTION_PROFILES[faction.id]!.description)));
      for (const affinity of FACTION_ECOLOGIES[faction.id]!.affinities) expect(html).toContain(yieldText(affinity.yields));
      for (const [unitId, weight] of Object.entries(FACTION_RECRUITMENT_WEIGHTS[faction.id]!)) {
        expect(html).toContain(UNITS.find(unit => unit.id === unitId)!.name);
        expect(html).toContain(`weight ${weight}`);
      }
      expect(html).toContain('relative AI preferences, not recruitment restrictions or cost bonuses');
    }
  });
  it('shows the actual owned realm definition in a collapsed economy reference, even when its seat name differs', () => {
    const game = createGame({ seed: 17, size: 'tiny', pace: 'short', factionCount: 2, factionDefinitionId: 'faction.sable_steppe' });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Camp witness' }).ok).toBe(true);
    const view = getObservation(game, game.turnOwnerId);
    view.factions.find(faction => faction.id === view.factionId)!.name = 'Renamed assembly';
    const html = renderToStaticMarkup(createElement(SettlementLand, { view, settlementId: view.land.settlements[0]!.settlementId, busy: false, selectCell: () => undefined, issue: () => undefined }));
    expect(html).toContain('<details class="realm-culture" data-testid="realm-culture"><summary>Culture &amp; economy · Renamed assembly');
    expect(html).toContain('data-definition-id="faction.sable_steppe"');
    expect(html).toContain('Prefers cavalry'); expect(html).toContain('weight 4');
    expect(html).not.toContain(FACTION_PROFILES['faction.ashen_compact']!.description);
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
