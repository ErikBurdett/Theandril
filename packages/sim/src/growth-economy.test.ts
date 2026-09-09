import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, getObservation, serializeGame } from './index';
import { foundingCoinCost, settlementCivicUpkeep, settlementFoodConsumption, settlementGrowthFood } from './growth-economy';

describe('uncapped growth economy', () => {
  it('increases establishment, food and recurring civic costs beyond the previous development limits', () => {
    for (const population of [20, 21, 50, 200, 1000]) {
      expect(settlementGrowthFood(population + 1)).toBeGreaterThan(settlementGrowthFood(population));
      expect(settlementFoodConsumption(population + 1)).toBeGreaterThan(settlementFoodConsumption(population));
      expect(settlementCivicUpkeep(population, 38, 9).total).toBeGreaterThan(0);
    }
    for (const count of [0, 4, 6, 8, 40, 1000]) expect(foundingCoinCost(count + 1)).toBeGreaterThan(foundingCoinCost(count));
    expect(settlementCivicUpkeep(20, 49, 10).total).toBeGreaterThan(settlementCivicUpkeep(20, 37, 9).total);
    expect(foundingCoinCost(0)).toBe(0);
  });
  it('keeps historical food and free founding arithmetic exactly and only bounds machine integer overflow', () => {
    for (const population of [1, 7, 20]) {
      expect(settlementGrowthFood(population, 15)).toBe(12 * population);
      expect(settlementFoodConsumption(population, 15)).toBe(2 * population);
      expect(settlementCivicUpkeep(population, 37, 8, 15).total).toBe(0);
    }
    expect(foundingCoinCost(100, 15)).toBe(0);
    expect(settlementGrowthFood(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
  });
});


describe('canonical ongoing coin forecast', () => {
  it('reports actual income/upkeep and queued obligations without changing state', () => {
    const state = createGame({ seed: 17, size: 'tiny', factionCount: 1, pace: 'epic' }), factionId = state.turnOwnerId;
    expect(applyCommand(state, { type: 'found', factionId, armyId: 'army.1', name: 'Accounted hearth' }).ok).toBe(true);
    const town = Object.values(state.settlements)[0]!;
    expect(applyCommand(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'unit.guard' }).ok).toBe(true);
    const before = serializeGame(state), view = getObservation(state, factionId), economy = view.growth!.economy;
    expect(serializeGame(state)).toBe(before);
    expect(economy.income).toBeGreaterThan(0); expect(economy.upkeep).toBeGreaterThan(0);
    expect(economy.net).toBe(economy.income - economy.upkeep); expect(economy.queuedUpkeep).toBe(2);
    expect(applyCommand(state, { type: 'endTurn', factionId }).ok).toBe(true);
    expect(town.queue).toHaveLength(1);
    expect(state.factions[0]!.treasury - view.treasury).toBe(economy.net);
  });
});
