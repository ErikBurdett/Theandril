import { describe, expect, it } from 'vitest';
import { applyCommand, getObservation, type BattlePresentation } from '@theandril/sim';
import { borderBattleCampaign } from '../../../packages/test-fixtures/src/combat-fixture';
import { BattlePresentationMailbox } from './battle-transfer';

function witnessed(): BattlePresentation {
  const game = borderBattleCampaign(), factionId = game.turnOwnerId;
  expect(applyCommand(game, { type: 'declareWar', factionId, targetFactionId: game.factions[1]!.id }).ok).toBe(true);
  expect(applyCommand(game, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' }).ok).toBe(true);
  const view = getObservation(game, factionId);
  expect(view.battleScene).toBeTruthy();
  return { battleId: view.battle!.id, before: view.battleScene!, after: view.battleScene!, events: [] };
}
describe('transient seat-participant battle transfer boundary', () => {
  it('requires both actual participant identity and an allowed observed battle/report', () => {
    const packet = witnessed(), box = new BattlePresentationMailbox();
    box.capture(packet, 'faction.unobserved');
    expect(box.take({ battle: { id: packet.battleId }, battleReports: [] })).toBeUndefined();
    box.capture(packet, packet.before.formations[0]!.factionId);
    expect(box.take({ battle: null, battleReports: [] })).toBeUndefined();
    box.capture(packet, packet.before.formations[0]!.factionId);
    expect(box.take({ battle: null, battleReports: [{ id: packet.battleId }] })?.packet).toEqual(packet);
    expect(box.take({ battle: null, battleReports: [{ id: packet.battleId }] })).toBeUndefined();
  });
  it('retains at most one packet, clears at reset and uses transient monotonic revisions', () => {
    const packet = witnessed(), box = new BattlePresentationMailbox(), factionId = packet.before.formations[0]!.factionId;
    box.capture(packet, factionId); box.capture(packet, factionId);
    const view = { battle: { id: packet.battleId }, battleReports: [] };
    expect(box.take(view)?.revision).toBe(2);
    box.capture(packet, factionId); box.reset(); expect(box.take(view)).toBeUndefined();
    box.capture(packet, factionId); expect(box.take(view)?.revision).toBe(4);
  });
});
