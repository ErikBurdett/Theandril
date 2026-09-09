import { describe, expect, it } from 'vitest';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { applyCommand, applyCommandForVersion, createArmyFormation, deserializeGame, getObservation, serializeGame, serializeGameForVersion, type GameCommand } from './index';

function readyAssault(version: 16 | 17 = 17) {
  let state = conquestCampaign();
  const town = state.settlements[CONQUEST_FIXTURE.settlementId]!;
  state.nextId = 1000;
  for (const [id, count] of [['army.100', 12], ['army.200', 4], ['army.300', 9]] as const) {
    state.armies[id] = {
      id, name: id, factionId: town.factionId, cell: town.cell, movement: 0,
      formations: Array.from({ length: count }, (_, i) => createArmyFormation(i ? `army.${state.nextId++}` : id, 'unit.scout'))
        .sort((a, b) => a.id < b.id ? -1 : 1),
    };
  }
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGameForVersion(state, version));
  const factionId = state.turnOwnerId;
  const commands: GameCommand[] = [
    { type: 'declareWar', factionId, targetFactionId: town.factionId },
    { type: 'besiege', factionId, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: town.id },
    { type: 'endTurn', factionId },
  ];
  for (const command of commands) {
    expect(applyCommandForVersion(state, command, version), JSON.stringify(command)).toMatchObject({ ok: true });
    state = deserializeGame(serializeGameForVersion(state, version));
  }
  return state;
}

describe('pending assault save validation', () => {
  it('rejects an omitted lower-ID garrison even when a resealed defenderId prioritizes the wrong contingent', () => {
    const ready = readyAssault(), factionId = ready.turnOwnerId;
    const command = { type: 'assault' as const, factionId, settlementId: CONQUEST_FIXTURE.settlementId };
    expect(getObservation(ready, factionId).sieges[0]).toHaveProperty('battleDefense.engagedFormations', 16);
    const normal = deserializeGame(serializeGame(ready));
    expect(applyCommand(normal, command)).toMatchObject({ ok: true });
    expect(normal.battle).toMatchObject({ settlementId: CONQUEST_FIXTURE.settlementId, defenderIds: ['army.100', 'army.200'] });
    expect(normal.battle!.combat.defender).toHaveLength(16);
    expect(serializeGame(deserializeGame(serializeGame(normal)))).toBe(serializeGame(normal));
    expect(() => deserializeGame(serializeGameForVersion(normal, 16))).toThrow('Invalid save: battle omitted a defending army');

    // Obtain all battle snapshots from the real assault command, not forged rosters.
    const state = deserializeGame(serializeGame(ready));
    const omitted = state.armies['army.100']!;
    delete state.armies[omitted.id];
    refreshAuthoredSight(state);
    expect(applyCommand(state, command)).toMatchObject({ ok: true });
    expect(state.battle).toMatchObject({ defenderId: 'army.200', defenderIds: ['army.200', 'army.300'] });
    expect(state.battle!.combat.defender).toHaveLength(13);
    expect(() => deserializeGame(serializeGame(state))).not.toThrow();
    state.armies[omitted.id] = omitted;
    refreshAuthoredSight(state);
    expect(() => deserializeGame(serializeGame(state))).toThrow('Invalid save: battle omitted a defending army');

    // A field target is meaningful; an assault's representative must not select reserves.
    state.battle!.defenderId = 'army.300';
    expect(() => deserializeGame(serializeGame(state))).toThrow('Invalid save: battle omitted a defending army');
  });

  it('retains rule-16 pending assault round-trips but rejects resealed garrison omissions', () => {
    const state = readyAssault(16), factionId = state.turnOwnerId;
    const omitted = state.armies['army.100']!;
    delete state.armies[omitted.id];
    refreshAuthoredSight(state);
    expect(applyCommandForVersion(state, { type: 'assault', factionId, settlementId: CONQUEST_FIXTURE.settlementId }, 16)).toMatchObject({ ok: true });
    expect(state.battle).toMatchObject({ settlementId: CONQUEST_FIXTURE.settlementId, defenderId: 'army.200', defenderIds: ['army.200', 'army.300'], rulesVersion: 10 });
    expect(state.battle!.combat.defender).toHaveLength(13);
    const saved = serializeGameForVersion(state, 16);
    expect(JSON.parse(saved).version).toBe(16);
    expect(serializeGameForVersion(deserializeGame(saved), 16)).toBe(saved);

    state.armies[omitted.id] = omitted;
    refreshAuthoredSight(state);
    expect(() => deserializeGame(serializeGameForVersion(state, 16))).toThrow('Invalid save: battle omitted a defending army');
    state.battle!.defenderId = 'army.300';
    expect(() => deserializeGame(serializeGameForVersion(state, 16))).toThrow('Invalid save: battle omitted a defending army');
  });

  it('retains the rule-16 twenty-formation assault limit without mutating a refused command', () => {
    const state = readyAssault(16), factionId = state.turnOwnerId;
    const before = serializeGameForVersion(state, 16);
    expect(applyCommandForVersion(state, { type: 'assault', factionId, settlementId: CONQUEST_FIXTURE.settlementId }, 16)).toEqual({
      ok: false, error: 'An assault supports at most twenty defending formations.', events: [],
    });
    expect(serializeGameForVersion(state, 16)).toBe(before);
  });
});
