import { describe, expect, it } from 'vitest';
import { FACTIONS } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { planLand } from './land';

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
    expect(plan.coinSpent).toBe(0); expect(plan.commands.every(command => command.type === 'setWorkedTiles')).toBe(true);
  });
});
