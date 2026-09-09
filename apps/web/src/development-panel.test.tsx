import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getObservation, stateHash } from '@theandril/sim';
import { getDevelopmentEntity } from '../../../packages/sim/src/development';
import { characterCampaign, CHARACTER_FIXTURE } from '../../../packages/test-fixtures/src/character-fixture';
import { DevelopmentPanel, DevelopmentTree, developmentStatus } from './development-panel';

describe('development graph presentation', () => {
  it('shows distinct earned currencies, exact materials, effects and linked blockers from canonical quotes', () => {
    const state = characterCampaign(), factionId = state.turnOwnerId, army = state.armies[CHARACTER_FIXTURE.armyId]!;
    const targets = [{ scope: 'formation' as const, entityId: army.formations[0]!.id }, { scope: 'hearth' as const, entityId: CHARACTER_FIXTURE.homeId }, { scope: 'faction' as const, entityId: factionId }];
    const hash = stateHash(state);
    for (const target of targets) {
      const entity = getDevelopmentEntity(state, factionId, target)!;
      const html = renderToStaticMarkup(createElement(DevelopmentTree, { entity, factionId, busy: false, issue: () => { throw new Error('Inspection issued an order.'); } }));
      expect(html).toContain(entity.currency); expect(html).toContain('Development upkeep');
      for (const choice of entity.choices) {
        expect(html).toContain(`data-testid="development-${choice.id}"`);
        expect(html).toContain(`aria-label="Acquire ${choice.name}"`);
        for (const required of [...choice.requiresAll, ...choice.requiresAny]) expect(html).toContain(`aria-label="Inspect prerequisite ${entity.choices.find(item => item.id === required)!.name}"`);
      }
      if (target.scope === 'formation') { expect(html).toContain('Ironstone'); expect(html).toContain('Heartwood'); expect(html).toContain('battle experience'); }
      if (target.scope === 'hearth') { expect(html).toContain('civic points'); expect(html).toContain('Ashglass'); }
      if (target.scope === 'faction') expect(html).toContain('influence');
    }
    expect(stateHash(state)).toBe(hash);
  });
  it('pages a hundred armies without making the last company inaccessible or expanding a tree per company', () => {
    const state = characterCampaign(100), view = getObservation(state, state.turnOwnerId), last = view.armies.filter(army => army.factionId === view.factionId).at(-1)!;
    const focus = { scope: 'formation' as const, entityId: last.formations[0]!.id }, detail = getDevelopmentEntity(state, view.factionId, focus)!;
    const html = renderToStaticMarkup(createElement(DevelopmentPanel, { view, detail, initialFocus: focus, pending: false, error: null, busy: false, request: () => {}, issue: () => {} }));
    expect(html).toContain('100 records'); expect(html).toContain('Next development subjects');
    expect(html.match(/data-testid="development-tree"/g)).toHaveLength(1);
    expect(html).toContain(`Formation in ${last.name}`); expect(html).toContain(last.formations[0]!.id);
    expect(html.match(/<strong>/g)?.length).toBeLessThanOrEqual(20);
  });
  it('labels acquired dormant infrastructure and permanent exclusions without inventing affordability', () => {
    const state = characterCampaign(), hearth = state.settlements[CHARACTER_FIXTURE.homeId]!;
    state.development.hearths[hearth.id] = { civicPoints: 0, nodeIds: ['hearth.common_store', 'hearth.granary_rotations'] };
    const entity = getDevelopmentEntity(state, state.turnOwnerId, { scope: 'hearth', entityId: hearth.id })!;
    expect(developmentStatus(entity.choices.find(item => item.id === 'hearth.common_store')!, entity.choices)).toBe('Dormant');
    expect(developmentStatus(entity.choices.find(item => item.id === 'hearth.kiln_guilds')!, entity.choices)).toBe('Excluded');
    expect(entity.choices.every(item => !item.available)).toBe(true);
  });
});
