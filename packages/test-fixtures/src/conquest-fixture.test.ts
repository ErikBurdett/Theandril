import { expect, test } from 'vitest';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, deserializeGame, getObservation, replayGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { conquestCampaign, CONQUEST_FIXTURE } from './conquest-fixture';

test('conquest scenario has a peaceful visible town with local fog and no roaming defender', () => {
  const state = conquestCampaign();
  const guard = state.armies[CONQUEST_FIXTURE.playerArmyId]!;
  const town = state.settlements[CONQUEST_FIXTURE.settlementId]!;
  const home = Object.values(state.settlements).find(settlement => settlement.factionId === state.turnOwnerId)!;
  expect(town.name).toBe('Reedwatch');
  expect(hexDistance(guard.cell, town.cell, state.world.width)).toBe(1);
  expect(hexDistance(home.cell, town.cell, state.world.width)).toBeGreaterThanOrEqual(3);
  expect(Object.values(state.armies).filter(army => army.factionId !== state.turnOwnerId)).toHaveLength(0);
  expect(state.wars).toEqual([]);
  expect(state.sieges).toEqual({});
  expect(state.battle).toBeNull();
  expect(state.pendingCapture).toBeNull();
  expect(getObservation(state, state.turnOwnerId).settlements.some(settlement => settlement.id === town.id)).toBe(true);
  for (const explored of Object.values(state.explored)) expect(explored.size).toBeLessThan(state.world.terrain.length / 4);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  expect(stateHash(conquestCampaign())).toBe(stateHash(state));
});

test('conquest fixture uses real siege, assault and occupation commands with save/replay parity', () => {
  const state = conquestCampaign();
  const initial = serializeGame(state);
  const factionId = state.turnOwnerId;
  const commands: GameCommand[] = [
    { type: 'declareWar', factionId, targetFactionId: CONQUEST_FIXTURE.enemyFactionId },
    { type: 'besiege', factionId, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId },
  ];
  for (const command of commands) expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
  const continued = deserializeGame(serializeGame(state));
  const tail: GameCommand[] = [
    ...Array.from({ length: 3 }, (): GameCommand => ({ type: 'endTurn', factionId })),
    { type: 'assault', factionId, settlementId: CONQUEST_FIXTURE.settlementId },
    { type: 'autoResolveBattle', factionId },
  ];
  for (const campaign of [state, continued]) {
    for (const command of tail) expect(applyCommand(campaign, command), JSON.stringify(command)).toMatchObject({ ok: true });
    expect(campaign.pendingCapture?.settlementId).toBe(CONQUEST_FIXTURE.settlementId);
    expect(stateHash(deserializeGame(serializeGame(campaign)))).toBe(stateHash(campaign));
  }
  const occupy: GameCommand = { type: 'resolveCapture', factionId, settlementId: CONQUEST_FIXTURE.settlementId, outcome: 'occupy' };
  for (const campaign of [state, continued]) {
    expect(applyCommand(campaign, occupy)).toMatchObject({ ok: true });
    expect(campaign.settlements[CONQUEST_FIXTURE.settlementId]!.factionId).toBe(factionId);
    expect(campaign.settlements[CONQUEST_FIXTURE.settlementId]!.occupationTurns).toBeGreaterThan(0);
    expect(campaign.pendingCapture).toBeNull();
    expect(stateHash(deserializeGame(serializeGame(campaign)))).toBe(stateHash(campaign));
  }
  expect(stateHash(continued)).toBe(stateHash(state));
  expect(stateHash(replayGame(initial, [...commands, ...tail, occupy]))).toBe(stateHash(state));
});
