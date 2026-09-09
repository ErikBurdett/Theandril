import { expect, test } from 'vitest';
import { deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { empireLandCampaign } from './empire-land-fixture';

test.each([['huge', 32], ['legendary', 40]] as const)('%s empire funds every paid border and preserves all%i idle hearths', (size, count) => {
  const state = empireLandCampaign(size), view = getObservation(state, state.turnOwnerId, { landDetails: 'none' });
  expect(view.land.settlements).toHaveLength(count);
  expect(view.land.settlements.every(land => land.claimed.length === 37 && land.cells.length === 0)).toBe(true);
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  expect(towns.filter(town => !town.queue.length && view.productionOptions.some(option => option.settlementId === town.id && option.canQueue))).toHaveLength(count);
  expect(view.treasury).toBeGreaterThan(0);
  expect(view.treasury).toBeLessThan(count * 10_000);
  if (size === 'legendary') expect(view.armies.filter(army => army.factionId === view.factionId)).toHaveLength(100);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});
