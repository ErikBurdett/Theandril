import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { applyCommand, getObservation } from '@theandril/sim';
import { borderBattleCampaign } from '../../../packages/test-fixtures/src/combat-fixture';
import { BattlefieldPanel, describeBattleEvent } from './battle';
import { ArcaneResearch } from './magic';

function battleView() {
  const state = borderBattleCampaign(), factionId = state.turnOwnerId;
  expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: state.factions[1]!.id }).ok).toBe(true);
  expect(applyCommand(state, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' }).ok).toBe(true);
  return getObservation(state, factionId);
}
describe('authoritative battlefield controls', () => {
  it('starts at a decision, exposes real automatic policies and preserves accessible formation tables', () => {
    const view = battleView(), commands: unknown[] = [];
    const html = renderToStaticMarkup(createElement(BattlefieldPanel, { view, busy: false, error: false, replay: false, issue: command => commands.push(command), setScene: () => undefined, keepReview: () => undefined, closeReview: () => undefined }));
    expect(html).toContain('Watch battle'); expect(html).toContain('Paused for your orders.');
    expect(html).toContain('Auto-resolve battle'); expect(html).toContain('Step one battle round');
    expect(html).toContain('Attacking formations'); expect(html).toContain('Defending formations');
    expect(html).toContain('Inspect formation or officer');
    expect(html).not.toContain('RIGHT LINE'); expect(html).not.toContain('LEFT LINE');
    expect(view.battleAbilities.length).toBeGreaterThan(0);
    for (const ability of view.battleAbilities) { expect(html).toContain(ability.name); expect(ability.automatic).toBe(true); }
    expect(commands).toEqual([]);
  });
  it('labels national Arcane Theory separately from personal aptitude and uses real blockers', () => {
    const view = getObservation(borderBattleCampaign(), 'faction.ashen_compact');
    const html = renderToStaticMarkup(createElement(ArcaneResearch, { view, blocked: false, issue: () => undefined }));
    expect(view.arcaneResearch.choices).toHaveLength(2);
    expect(html).toContain('national discoveries, personal practitioners');
    for (const choice of view.arcaneResearch.choices) { expect(html).toContain(choice.name); expect(html).toContain(`${choice.knowledgeCost} knowledge`); expect(html).toContain(choice.blocker!); }
    expect(html).toContain('No living Waykeeper appointed.');
  });
  it('describes typed actual deltas, never inferring attacks from legacy prose', () => {
    const scene = battleView().battleScene!;
    const source = scene.formations[0]!, target = scene.formations[1]!;
    const text = describeBattleEvent({ sequence: 0, round: 1, type: 'attack', sourceId: source.id, sourceKind: 'formation', targetIds: [target.id], attackKind: 'projectile', abilityId: null, changes: [{ formationId: target.id, strengthDelta: -7, moraleDelta: -2, fatigueDelta: 0, wardDelta: 0 }], winner: null, reason: null }, scene);
    expect(text).toContain('fires on'); expect(text).toContain('7 strength lost');
  });
});
