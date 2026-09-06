import { expect, test } from 'vitest';
import { applyCommand, getObservation, serializeGame, deserializeGame, stateHash } from '@theandril/sim';
import { matureCampaign } from './index';
test('mature stress fixture has real armies and stable save/resolution at Huge scale', () => {
  const state = matureCampaign('huge');
  expect(Object.keys(state.armies)).toHaveLength(1500);
  expect(state.factions).toHaveLength(32);
  expect(state.world.terrain).toHaveLength(196608);
  const restored = deserializeGame(serializeGame(state));
  for (const campaign of [state, restored]) {
    const treasury = campaign.factions[0]!.treasury;
    expect(applyCommand(campaign, { type: 'endTurn', factionId: campaign.turnOwnerId }).ok).toBe(true);
    expect(campaign.factions[0]!.treasury).toBeLessThan(treasury);
    expect(getObservation(campaign, campaign.turnOwnerId).armies.length).toBeGreaterThan(40);
  }
  expect(stateHash(restored)).toBe(stateHash(state));
});
