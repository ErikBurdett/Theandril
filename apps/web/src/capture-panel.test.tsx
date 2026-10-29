import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, getObservation, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { CONQUEST_FIXTURE, subjectCampaign } from '../../../packages/test-fixtures/src/conquest-fixture';
import { CapturePanel } from './siege';

const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId;
function fallen(state = subjectCampaign()): GameState {
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); };
  issue({ type: 'declareWar', factionId: player, targetFactionId: rival });
  issue({ type: 'besiege', factionId: player, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId });
  for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId: player });
  issue({ type: 'assault', factionId: player, settlementId: CONQUEST_FIXTURE.settlementId });
  issue({ type: 'autoResolveBattle', factionId: player });
  return state;
}
const render = (state: GameState) => renderToStaticMarkup(createElement(CapturePanel, { view: getObservation(state, player), busy: false, issue: () => { throw new Error('Rendering issued an order.'); } }));

describe('capture panel subject rule (rules 39)', () => {
  it('offers the subject outcome with its quoted obligation and names the governing realm', () => {
    const state = fallen(), before = stateHash(state), html = render(state);
    expect(html).toContain('aria-label="Make subject realm"');
    expect(html).toContain('bind the realm as your subject');
    expect(html).toContain('6 coin tribute each turn');
    expect(html).toContain('Governing faction: Reedbound Council');
    expect(html).not.toContain('Subject rule is not on offer');
    expect(stateHash(state)).toBe(before);
  });
  it('explains why subject rule is missing for a provincial hearth', () => {
    const state = subjectCampaign();
    state.land.capitals[rival] = Object.keys(state.settlements).find(id => state.settlements[id]!.factionId === rival && id !== CONQUEST_FIXTURE.settlementId)!;
    const html = render(fallen(state));
    expect(html).not.toContain('aria-label="Make subject realm"');
    expect(html).toContain('data-testid="capture-unavailable-subject"');
    expect(html).toContain('Only a fallen capital can bind its realm as a subject.');
  });
});
