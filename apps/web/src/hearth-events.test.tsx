import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getObservation, stateHash, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../../packages/test-fixtures/src/victory-fixture';
import { HearthEvents } from './hearth-events';

function offered(): GameState {
  const state = attunementCampaign(), player = state.turnOwnerId, host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.hearthEvents.pending = [{ id: `event.${state.nextId++}`, factionId: player, settlementId: host.id, templateId: 'event.bumper_harvest', turn: state.turn, expiresTurn: state.turn + 5 }];
  return state;
}
const render = (state: GameState) => renderToStaticMarkup(createElement(HearthEvents, { view: getObservation(state, state.turnOwnerId), busy: false, issue: () => { throw new Error('Rendering issued an order.'); } }));

describe('hearth events panel (rules 46)', () => {
  it('names the hearth, tells the story, quotes every answer and renders nothing when there is no event', () => {
    const state = offered(), before = stateHash(state), html = render(state);
    expect(html).toContain('A heavy harvest');
    expect(html).toContain('Glasswatch');
    expect(html).toContain('aria-label="Fill the granary: A heavy harvest at Glasswatch"');
    expect(html).toContain('aria-label="Sell the surplus: A heavy harvest at Glasswatch"');
    expect(html).toContain('+12 stored food');
    expect(html).toContain('+40 coin');
    expect(html).toContain('fill the granary is taken');
    expect(stateHash(state)).toBe(before);
    state.hearthEvents.pending = [];
    expect(render(state)).toBe('');
  });
});
