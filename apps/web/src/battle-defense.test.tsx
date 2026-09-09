import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { applyCommand, getObservation } from '@theandril/sim';
import { borderBattleCampaign } from '../../../packages/test-fixtures/src/combat-fixture';
import { conquestCampaign, CONQUEST_FIXTURE as C } from '../../../packages/test-fixtures/src/conquest-fixture';
import { AttackOrders } from './warfare';
import { SiegeOrders } from './siege';

const noOrder = () => { throw new Error('Rendering an attack preview must never issue an order.'); };
describe('canonical defending-contingent presentation', () => {
  it('shows the canonical defending contingent and reserves beside an existing siege assault control', () => {
    const state = conquestCampaign(), factionId = state.turnOwnerId;
    expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: state.settlements[C.settlementId]!.factionId }).ok).toBe(true);
    expect(applyCommand(state, { type: 'besiege', factionId, armyId: C.playerArmyId, settlementId: C.settlementId }).ok).toBe(true);
    const view = getObservation(state, factionId), siege = view.sieges[0]!;
    siege.battleDefense = { engagedFormations: 12, engagedStrength: 193, reserveFormations: 1, reserveStrength: 17 };
    const before = JSON.stringify(view);
    const html = renderToStaticMarkup(createElement(SiegeOrders, { army: view.armies.find(army => army.id === C.playerArmyId)!, view, busy: false, issue: noOrder }));
    expect(html).toContain('Assault settlement');
    expect(html).toContain('Committed defense: 12 formations · 193 strength');
    expect(html).toContain('Reserves: 1 formation · 17 strength');
    expect(html).toContain('must be defeated before advancing or capturing this location');
    expect(JSON.stringify(view)).toBe(before);
  });

  it('shows exact committed and reserve values beside attack controls without claiming all defenders will fight', () => {
    const state = borderBattleCampaign(), view = getObservation(state, state.turnOwnerId);
    const army = view.armies.find(army => army.id === 'army.2')!, target = view.armies.find(army => army.id === 'army.4')!;
    // Deliberately non-derived read-model quote: presentation must not reconstruct
    // a contingent from the nearby army list or enforce a client formation cap.
    target.battleDefense = { engagedFormations: 7, engagedStrength: 113, reserveFormations: 3, reserveStrength: 29 };
    const before = JSON.stringify(view);
    const html = renderToStaticMarkup(createElement(AttackOrders, { army, view, busy: false, issue: noOrder, terrain: () => 1 }));
    expect(html).toContain('Committed defense: 7 formations · 113 strength');
    expect(html).toContain('Reserves: 3 formations · 29 strength');
    expect(html).toContain('Whole armies fight together. Reserves defend in later engagements');
    expect(html).not.toContain('The battle includes every defending');
    expect(JSON.stringify(view)).toBe(before);
  });
});
