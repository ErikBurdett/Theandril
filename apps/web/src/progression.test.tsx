import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, getObservation, stateHash } from '@theandril/sim';
import { CampaignProgression, ResearchTree, researchDepths } from './progression';

function campaign() {
  const game = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace: 'standard' });
  game.factions[0]!.knowledge = 1000;
  return game;
}
function tree(game: ReturnType<typeof campaign>, blocked = false) {
  return renderToStaticMarkup(createElement(ResearchTree, { view: getObservation(game, game.turnOwnerId), blocked, issue: () => { throw new Error('Rendering issued an order.'); } }));
}
describe('authoritative research tree presentation', () => {
  it('lays out actual dependency depths independent of input order, without fabricating missing nodes', () => {
    const depths = researchDepths([{ id: 'leaf', requires: ['middle'] }, { id: 'middle', requires: ['root'] }, { id: 'root', requires: [] }, { id: 'isolated', requires: ['missing'] }]);
    expect(Object.fromEntries(depths)).toEqual({ root: 0, middle: 1, leaf: 2, isolated: 0 });
    expect(depths.has('missing')).toBe(false);
  });
  it('renders precisely the observed discoveries, current paced costs and named requirements without mutating state', () => {
    const game = campaign(), before = stateHash(game), view = getObservation(game, game.turnOwnerId), html = tree(game);
    expect(html.match(/data-testid="progression-technology\./g)).toHaveLength(view.progression.technologyChoices.length);
    for (const choice of view.progression.technologyChoices) {
      expect(html).toContain(`aria-label="Research ${choice.name}"`);
      expect(html).toContain(`${choice.knowledgeCost} knowledge`);
    }
    expect(html).toContain('400 knowledge');
    expect(html).toContain('aria-label="View prerequisite Coastal navigation"');
    expect(html).toContain('Coastal navigation · not researched');
    expect(html).toMatch(/<button class="primary wide" disabled=""[^>]*aria-label="Research Ocean navigation"/);
    expect(stateHash(game)).toBe(before);
  });
  it('changes a purchased root and its child only through the next authoritative observation', () => {
    const game = campaign();
    expect(applyCommand(game, { type: 'research', factionId: game.turnOwnerId, technologyId: 'technology.coastal_navigation' }).ok).toBe(true);
    const view = getObservation(game, game.turnOwnerId), html = tree(game);
    expect(view.progression.technologyChoices.find(choice => choice.id === 'technology.ocean_navigation')!.available).toBe(true);
    expect(html).toContain('Coastal navigation · researched');
    expect(html).toContain('data-testid="progression-technology.coastal_navigation" data-state="researched"');
    expect(html).toContain('data-testid="progression-technology.ocean_navigation" data-state="available"');
    expect(tree(game, true)).toMatch(/<button class="primary wide" disabled=""[^>]*aria-label="Research Ocean navigation"/);
  });
  it('keeps seven actual advancement and resource systems separate and exposes only real research branches', () => {
    const game = campaign(), view = getObservation(game, game.turnOwnerId);
    const html = renderToStaticMarkup(createElement(CampaignProgression, { view, busy: false, issue: () => undefined, locate: () => undefined, close: () => undefined }));
    expect(html.match(/role="tab" /g)).toHaveLength(7);
    for (const label of ['Technology', 'Arcane Theory', 'Institutions', 'Military doctrine', 'Development', 'Resources', 'Prosperity']) expect(html).toContain(`>${label}</button>`);
    expect(html).toContain('aria-label="Research branches"');
  });
  it('does not populate a historical or restricted observation from the current larger content catalog', () => {
    const game = campaign(), view = getObservation(game, game.turnOwnerId);
    view.progression.technologyChoices = view.progression.technologyChoices.filter(choice => choice.id === 'technology.cinder_masonry' || choice.id === 'technology.civic_accounts');
    const html = renderToStaticMarkup(createElement(ResearchTree, { view, blocked: false, issue: () => undefined }));
    expect(html.match(/data-testid="progression-technology\./g)).toHaveLength(2);
    expect(html).not.toContain('Seasonal stewardship');
    expect(html).not.toContain('Navigation');
    expect(html).not.toContain('Ocean navigation');
  });
});
