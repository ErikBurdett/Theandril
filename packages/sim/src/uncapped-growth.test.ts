import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash } from './index';
import { cellsWithin, indexes, rebuildIndexes } from './visibility';
import { applyLandCommand, refreshLandKnowledge, validateLand } from './territory';
import { settlementGrowthFood } from './growth-economy';
import { withRules } from './rules';
import type { GameCommand, GameState } from './types';

function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result;
}
function scene() {
  const state = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace: 'epic', generatorVersion: 4 });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, 14)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.fertility[cell] = 80; state.world.waterDepth[cell] = 0;
    if (state.resources) delete state.resources.deposits[cell]; // This test authors a resource-free physical clearing.
  }
  const factionId = state.turnOwnerId;
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Growing commons' });
  state.factions[0]!.treasury = 200_000;
  return { state, factionId, town: Object.values(state.settlements)[0]! };
}
function buyClaims(state: GameState, count: number) {
  const town = Object.values(state.settlements)[0]!, factionId = town.factionId;
  while (state.land.settlements[town.id]!.claimed.length < count) {
    const summary = getSettlementLandObservation(state, factionId, town.id)!;
    const cell = summary.borderExpansion.nextCell;
    expect(cell).not.toBeNull();
    const quote = getSettlementLandObservation(state, factionId, town.id, { offset: 0, cell: cell! })!.cells.find(item => item.cell === cell)!.claim;
    expect(quote.canStart, quote.blocker ?? '').toBe(true);
    const before = state.factions[0]!.treasury;
    issue(state, { type: 'claimCell', factionId, settlementId: town.id, cell: cell! });
    expect(state.factions[0]!.treasury).toBe(before - quote.coinCost);
  }
}

describe('uncapped hearth development', () => {
  it('buys connected land beyond37, exposes every option through bounded pages, and reloads exact sight and road memory', () => {
    const { state, factionId, town } = scene();
    buyClaims(state, 140);
    const summary = getSettlementLandObservation(state, factionId, town.id)!;
    expect(summary.claimCapacity).toBeNull(); expect(summary.claimed).toHaveLength(140); expect(summary.claimRadius).toBeGreaterThan(3);
    const before = serializeGame(state), visibleBefore = [...indexes(state).visible.get(factionId)!.keys()].sort((a, b) => a - b);
    const cells = new Set<number>();
    for (let offset = 0; offset < summary.cellWindow!.total; offset += 64) {
      const page = getSettlementLandObservation(state, factionId, town.id, { offset })!;
      expect(page.cells.length).toBeLessThanOrEqual(64);
      for (const cell of page.cells) cells.add(cell.cell);
    }
    expect(summary.claimed.every(cell => cells.has(cell))).toBe(true);
    expect(cells.size).toBe(summary.cellWindow!.total);
    const far = summary.claimed.at(-1)!;
    expect(getSettlementLandObservation(state, factionId, town.id, { offset: 0, cell: far })!.cells.some(cell => cell.cell === far)).toBe(true);
    expect(getSettlementLandObservation(state, state.factions[1]!.id, town.id, { offset: Number.MAX_SAFE_INTEGER })).toBeNull();
    expect(serializeGame(state)).toBe(before);
    const mirror = deserializeGame(before);
    expect(stateHash(mirror)).toBe(stateHash(state));
    expect([...indexes(mirror).visible.get(factionId)!.keys()].sort((a, b) => a - b)).toEqual(visibleBefore);
    const rebuilt = rebuildIndexes(state);
    expect([...rebuilt.visible.get(factionId)!.keys()].sort((a, b) => a - b)).toEqual(visibleBefore);
    validateLand(state);
    for (let turn = 0; turn < 3; turn++) {
      const command = { type: 'endTurn', factionId } as const;
      expect(issue(state, command)).toEqual(issue(mirror, command));
      expect(stateHash(state)).toBe(stateHash(mirror));
    }
  });
  it('supports more than six paid productive workers and grows from20 to21 through stored food, with rising upkeep', () => {
    const { state, factionId, town } = scene();
    town.population = 20; // A mature authored starting point; growth and investment below use real commands.
    buyClaims(state, 61);
    const workers = state.land.settlements[town.id]!.claimed.filter(cell => cell !== town.cell).slice(0, 20);
    issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: workers });
    expect(getSettlementLandObservation(state, factionId, town.id)!.workerCapacity).toBe(20);
    const beforeGrowth = getObservation(state, factionId).growth!.settlements[0]!;
    expect(beforeGrowth.foodRequired).toBe(settlementGrowthFood(20));
    for (const cell of workers.slice(0, 5)) {
      issue(state, { type: 'improveTile', factionId, settlementId: town.id, cell, improvementId: 'improvement.terraced_fields' });
      while (state.land.settlements[town.id]!.work) issue(state, { type: 'endTurn', factionId });
    }
    const mirror = deserializeGame(serializeGame(state));
    for (let turn = 0; town.population <= 20 && turn < 100; turn++) {
      const command = { type: 'endTurn', factionId } as const; issue(state, command); issue(mirror, command);
      expect(stateHash(mirror)).toBe(stateHash(state));
    }
    expect(town.population).toBeGreaterThan(20);
    expect(getObservation(state, factionId).growth!.settlements[0]!.foodRequired).toBeGreaterThan(beforeGrowth.foodRequired);
    expect(state.land.settlements[town.id]!.worked).toHaveLength(20);
    expect(() => deserializeGame(serializeGame(state))).not.toThrow();
  });
  it('preserves historical reach and worker refusals while modern hidden probes never inspect remote ownership', () => {
    const { state, factionId, town } = scene();
    const frontier = getSettlementLandObservation(state, factionId, town.id)!.borderExpansion.nextCell!;
    const command = { type: 'claimCell', factionId, settlementId: town.id, cell: frontier } as const;
    expect(withRules(state, 15, () => applyLandCommand(state, command))).toMatch(/reach/);
    const remote = state.armies['army.3']!.cell;
    expect(indexes(state).visible.get(factionId)!.has(remote)).toBe(false);
    state.explored[factionId]!.add(remote);
    const probe = { ...command, cell: remote }, before = stateHash(state);
    const first = applyLandCommand(state, probe);
    expect(first).toMatch(/observed/); expect(stateHash(state)).toBe(before);
    issue(state, { type: 'found', factionId: state.factions[1]!.id, armyId: 'army.3', name: 'Hidden hearth' });
    const afterFounding = stateHash(state);
    expect(afterFounding).not.toBe(before);
    expect(applyLandCommand(state, probe)).toBe(first); expect(stateHash(state)).toBe(afterFounding);
    refreshLandKnowledge(state, factionId, indexes(state).visible.get(factionId)!);
  });
});
