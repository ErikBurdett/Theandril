import { describe, expect, it } from 'vitest';
import { FACTIONS } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { planLand } from './land';
import { withRules } from '../../sim/src/rules';

describe('shared-rule AI land development', () => {
  it.each(FACTIONS)('$name assigns workers and completes productive land works with exact continuation', culture => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 1, factionDefinitionId: culture.id, pace: 'epic' });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Cultivators’ Hearth' }).ok).toBe(true);
    game.factions[0]!.treasury = 300; // Authored budget for a bounded land-only planner scenario.
    const mirror = deserializeGame(serializeGame(game));
    let paidOrders = 0;
    for (let round = 0; round < 18; round++) {
      const view = getObservation(game, game.turnOwnerId), plan = planLand(view, Math.max(0, view.treasury - 24));
      expect(plan.commands.length).toBeLessThanOrEqual(9); expect(plan.coinSpent).toBeLessThanOrEqual(Math.max(0, view.treasury - 24));
      expect(planLand(getObservation(mirror, mirror.turnOwnerId), Math.max(0, view.treasury - 24))).toEqual(plan);
      for (const command of [...plan.commands, { type: 'endTurn' as const, factionId: game.turnOwnerId }]) {
        const result = applyCommand(game, command);
        expect(result, JSON.stringify(command)).toMatchObject({ ok: true }); expect(applyCommand(mirror, command)).toEqual(result);
        if (command.type === 'improveTile' || command.type === 'terraformTile') paidOrders++;
      }
      expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(mirror));
    }
    expect(paidOrders).toBeGreaterThan(0); expect(game.land.cultivation[game.turnOwnerId]).toBeGreaterThan(0);
    expect(Object.values(game.land.settlements).some(land => land.worked.length > 0)).toBe(true);
  });
  it('does not spend reserved coin or propose unaffordable work', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 1 });
    applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Thrifty Hearth' });
    const plan = planLand(getObservation(game, game.turnOwnerId), 0);
    expect(plan.coinSpent).toBe(0);
    expect(plan.commands.every(command => command.type === 'setWorkedTiles' || command.type === 'setWorkerPolicy')).toBe(true);
  });

  it('delegates simple hearths once, keeps their standing order, and preserves historical direct allocation', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 1 });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Delegated Hearth' }).ok).toBe(true);
    Object.values(game.settlements)[0]!.population = 8; // Authored full-employment planner branch.
    const view = getObservation(game, game.turnOwnerId), town = view.land.settlements[0]!;
    // A disclosed planner observation isolates the no-material strategic branch.
    for (const cell of town.cells) delete cell.resourceId;
    const first = planLand(view, 0);
    expect(first.commands).toEqual([{ type: 'setWorkerPolicy', factionId: view.factionId, settlementId: town.settlementId, focus: 'balanced' }]);
    const scarce = structuredClone(view);
    scarce.land.settlements[0]!.workerCapacity = 1;
    expect(planLand(scarce, 0).commands.map(command => command.type)).toEqual(['setWorkedTiles']);
    expect(applyCommand(game, first.commands[0]!).ok).toBe(true);
    const next = getObservation(game, game.turnOwnerId);
    for (const cell of next.land.settlements[0]!.cells) delete cell.resourceId;
    expect(planLand(next, 0).commands).toEqual([]);
    const old = withRules(game, 35, () => getObservation(game, game.turnOwnerId));
    expect(old.workerPolicies).toBeUndefined();
    old.land.settlements[0]!.worked = [];
    expect(planLand(old, 0).commands.map(command => command.type)).toEqual(['setWorkedTiles']);
  });

  it('returns delegated hearths to direct management for resource and incomplete-page decisions', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 1 });
    expect(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Materials Hearth' }).ok).toBe(true);
    const town = Object.values(game.settlements)[0]!;
    expect(applyCommand(game, { type: 'setWorkerPolicy', factionId: game.turnOwnerId, settlementId: town.id, focus: 'balanced' }).ok).toBe(true);
    for (const reason of ['resource', 'page'] as const) {
      const view = getObservation(game, game.turnOwnerId), land = view.land.settlements[0]!;
      for (const cell of land.cells) delete cell.resourceId;
      if (reason === 'resource') land.cells[0]!.resourceId = 'resource.iron';
      else land.cells = land.cells.filter(cell => cell.cell !== land.claimed[0]);
      const plan = planLand(view, 0);
      expect(plan.commands).toHaveLength(1);
      expect(plan.commands[0]).toMatchObject({ type: 'setWorkedTiles', settlementId: town.id });
      expect(plan.reasons.join(' ')).toContain('returns to direct worker management');
    }
    const view = getObservation(game, game.turnOwnerId);
    view.land.settlements[0]!.cells[0]!.resourceId = 'resource.iron';
    expect(applyCommand(game, planLand(view, 0).commands[0]!).ok).toBe(true);
    expect(game.workerPolicies).toEqual([]);
  });
});
