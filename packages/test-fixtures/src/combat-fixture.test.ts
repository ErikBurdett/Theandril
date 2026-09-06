import { expect, test } from 'vitest';
import { UNITS } from '@theandril/content';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, deserializeGame, getObservation, replayGame, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { borderBattleCampaign } from './combat-fixture';

function combatants(state: GameState) {
  const player = Object.values(state.armies).find(army => army.name === 'Ashen Vanguard');
  const enemy = Object.values(state.armies).find(army => army.name === 'Reedbound Watch');
  if (!player || !enemy) throw new Error('Missing authored border guards.');
  return { player, enemy };
}

test('border fixture is deterministic, save-valid and reveals only local contact', () => {
  const state = borderBattleCampaign();
  const { player, enemy } = combatants(state);
  const guard = UNITS.find(unit => unit.id === 'unit.guard')!;
  expect(state.turn).toBe(1);
  expect(state.world.seed).toBe(20260905);
  expect(state.world.starts).toEqual([488, 1052]);
  expect({ playerId: player.id, playerCell: player.cell, enemyId: enemy.id, enemyCell: enemy.cell })
    .toEqual({ playerId: 'army.2', playerCell: 489, enemyId: 'army.4', enemyCell: 537 });
  expect(neighbors(player.cell, state.world.width, state.world.height)).toContain(enemy.cell);
  expect(Object.values(state.settlements).map(town => town.cell).sort((a, b) => a - b)).toEqual([488, 1052]);
  expect(Object.values(state.settlements).some(town => town.cell === player.cell || town.cell === enemy.cell)).toBe(false);
  expect([player.formations[0]!.strength, enemy.formations[0]!.strength]).toEqual([guard.strength, guard.strength]);
  expect([player.formations[0]!.morale, enemy.formations[0]!.morale, player.formations[0]!.fatigue, enemy.formations[0]!.fatigue]).toEqual([guard.morale, guard.morale, 0, 0]);
  expect(state.wars).toEqual([]);
  expect(state.battle).toBeNull();
  expect(state.battleReports).toEqual([]);
  const view = getObservation(state, state.turnOwnerId);
  expect(view.armies.some(army => army.id === enemy.id)).toBe(true);
  expect(view.factions.some(faction => faction.id === enemy.factionId)).toBe(true);
  expect(view.cells.find(cell => cell.cell === enemy.cell)?.visible).toBe(true);
  for (const explored of Object.values(state.explored)) expect(explored.size).toBeLessThan(state.world.terrain.length / 4);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  expect(stateHash(borderBattleCampaign())).toBe(stateHash(state));
});

test('human commands declare war, attack, issue a tactical order and finish the saved battle', () => {
  const state = borderBattleCampaign();
  const initial = serializeGame(state);
  const { player, enemy } = combatants(state);
  const commands: GameCommand[] = [
    { type: 'declareWar', factionId: player.factionId, targetFactionId: enemy.factionId },
    { type: 'attack', factionId: player.factionId, armyId: player.id, targetArmyId: enemy.id },
    { type: 'battleOrder', factionId: player.factionId, order: 'advance' },
  ];
  for (const command of commands) {
    const result = applyCommand(state, command);
    expect(result, JSON.stringify(command)).toMatchObject({ ok: true });
  }
  expect(state.battle?.combat.round).toBe(1);
  const restored = deserializeGame(serializeGame(state));
  const auto: GameCommand = { type: 'autoResolveBattle', factionId: player.factionId };
  for (const campaign of [state, restored]) {
    expect(applyCommand(campaign, auto)).toMatchObject({ ok: true });
    expect(campaign.battle).toBeNull();
    expect(campaign.battleReports).toHaveLength(1);
    expect(campaign.battleReports[0]!.combat.result).toBeDefined();
    expect(campaign.battleReports[0]!.combat.round).toBeLessThanOrEqual(12);
    expect(stateHash(deserializeGame(serializeGame(campaign)))).toBe(stateHash(campaign));
  }
  expect(stateHash(restored)).toBe(stateHash(state));
  expect(stateHash(replayGame(initial, [...commands, auto]))).toBe(stateHash(state));
});
