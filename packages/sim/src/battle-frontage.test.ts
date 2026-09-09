import { describe, expect, it } from 'vitest';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from './index';

function field(count: number) {
  let state = borderBattleCampaign();
  const defender = state.armies['army.4']!;
  defender.formations = [{ ...createArmyFormation(defender.id, 'unit.scout'), strength: 1, morale: 1 }];
  for (let i = 1; i < count; i++) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { ...defender, id, formations: [{ ...createArmyFormation(id, 'unit.scout'), strength: 1, morale: 1 }] };
  }
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  return state;
}

describe('bounded defending contingents', () => {
  it('prioritizes a later-sorting target without splitting larger reserves or involving their officer', () => {
    let state = borderBattleCampaign();
    const enemy = state.armies['army.4']!, cell = enemy.cell, factionId = state.turnOwnerId;
    const make = (id: string, count: number, from: number) => ({
      ...enemy, id, formations: Array.from({ length: count }, (_, i) => ({
        ...createArmyFormation(i ? `army.${from + i}` : id, 'unit.scout'), strength: 1, morale: 1,
      })).sort((a, b) => a.id < b.id ? -1 : 1),
    });
    state.nextId = 10000;
    state.armies[enemy.id] = make(enemy.id, 12, 4100);
    state.armies['army.8000'] = make('army.8000', 4, 8100);
    state.armies['army.9000'] = make('army.9000', 9, 9100);
    const home = Object.values(state.settlements).find(town => town.factionId === enemy.factionId)!;
    state.factions.find(faction => faction.id === enemy.factionId)!.treasury = 500;
    state.armies[enemy.id]!.cell = home.cell;
    refreshAuthoredSight(state);
    expect(applyCommand(state, { type: 'recruitCharacter', factionId: enemy.factionId, settlementId: home.id, definitionId: 'character.marshal' }).ok).toBe(true);
    const officer = Object.values(state.characters).find(character => character.factionId === enemy.factionId)!;
    expect(applyCommand(state, { type: 'assignCharacter', factionId: enemy.factionId, characterId: officer.id, armyId: enemy.id }).ok).toBe(true);
    state.armies[enemy.id]!.cell = cell;
    refreshAuthoredSight(state);
    state = deserializeGame(serializeGame(state));
    expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: enemy.factionId }).ok).toBe(true);
    const reserveBefore = structuredClone(state.armies[enemy.id]), officerBefore = structuredClone(state.characters[officer.id]);
    expect(applyCommand(state, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.9000' }).ok).toBe(true);
    expect(state.battle!.defenderIds).toEqual(['army.8000', 'army.9000']);
    expect(state.battle!.combat.defender).toHaveLength(4 + 9);
    expect(state.battle!.characterSnapshots.some(character => character.characterId === officer.id)).toBe(false);
    state = deserializeGame(serializeGame(state));
    expect(applyCommand(state, { type: 'autoResolveBattle', factionId }).ok).toBe(true);
    expect(state.armies[enemy.id]).toEqual(reserveBefore);
    expect(state.characters[officer.id]).toEqual(officerBefore);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('rejects a self-consistent but wrong pending contingent after a save is resealed', () => {
    const state = field(21), factionId = state.turnOwnerId;
    const omitted = Object.values(state.armies).filter(army => army.factionId !== factionId && army.id !== 'army.4').sort((a, b) => a.id < b.id ? -1 : 1)[0]!;
    delete state.armies[omitted.id]; refreshAuthoredSight(state);
    expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: omitted.factionId }).ok).toBe(true);
    expect(applyCommand(state, { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' }).ok).toBe(true);
    expect(() => deserializeGame(serializeGame(state))).not.toThrow();
    // The battle itself came from the real engine. Restore a lower-ID defender so
    // the recorded contingent now disagrees with canonical whole-stack selection.
    state.armies[omitted.id] = omitted;
    expect(() => deserializeGame(serializeGame(state))).toThrow('Invalid save: battle omitted a defending army');
  });

  it.each([20, 21, 200])('keeps %s defending companies attackable with an unchanged tactical budget', count => {
    const state = field(count), factionId = state.turnOwnerId;
    expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: state.armies['army.4']!.factionId }).ok).toBe(true);
    const initial = serializeGame(state), command = { type: 'attack' as const, factionId, armyId: 'army.2', targetArmyId: 'army.4' };
    expect(applyCommand(state, command).ok).toBe(true);
    expect(state.battle!.combat.defender).toHaveLength(Math.min(count, 20));
    const saved = serializeGame(state);
    expect(serializeGame(deserializeGame(saved))).toBe(saved);
    const replay = deserializeGame(initial);
    expect(applyCommand(replay, command).ok).toBe(true);
    expect(stateHash(replay)).toBe(stateHash(state));
  });

  it('keeps fleet reserves separate from participating hulls and carried land troops', () => {
    let state = navalCampaign();
    const factionId = state.turnOwnerId, enemy = state.armies[NAVAL_FIXTURE.enemyFleetId]!;
    enemy.cell = NAVAL_FIXTURE.shallowCell;
    enemy.formations[0]!.strength = 1; enemy.formations[0]!.morale = 1;
    for (let i = 1; i < 21; i++) {
      const id = `army.${state.nextId++}`;
      state.armies[id] = { ...enemy, id, formations: [{ ...createArmyFormation(id, 'unit.coastal_warship'), strength: 1, morale: 1 }] };
    }
    refreshAuthoredSight(state);
    state = deserializeGame(serializeGame(state));
    expect(applyCommand(state, { type: 'embarkArmy', factionId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId }).ok).toBe(true);
    expect(applyCommand(state, { type: 'declareWar', factionId, targetFactionId: enemy.factionId }).ok).toBe(true);
    const before = structuredClone(state.armies);
    expect(applyCommand(state, { type: 'attack', factionId, armyId: NAVAL_FIXTURE.fleetId, targetArmyId: enemy.id }).ok).toBe(true);
    expect(state.battle!.domain).toBe('naval');
    expect(state.battle!.combat.defender).toHaveLength(20);
    const reserve = Object.values(state.armies).find(army => army.cell === enemy.cell && !state.battle!.defenderIds.includes(army.id))!;
    expect(state.battle!.formationBindings.every(binding => binding.armyId !== NAVAL_FIXTURE.cargoId)).toBe(true);
    state = deserializeGame(serializeGame(state));
    expect(applyCommand(state, { type: 'autoResolveBattle', factionId }).ok).toBe(true);
    expect(state.armies[reserve.id]).toEqual(before[reserve.id]);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('exposes the same committed and reserve strength before a human or AI attacks', () => {
    const state = field(21), before = stateHash(state);
    const view = getObservation(state, state.turnOwnerId);
    expect(view.armies.find(army => army.id === 'army.4')).toHaveProperty('battleDefense', {
      engagedFormations: 20, engagedStrength: 20, reserveFormations: 1, reserveStrength: 1,
    });
    expect(stateHash(state)).toBe(before);
  });

  it('keeps a settlement contested until its remaining garrison is actually defeated', () => {
    let state = conquestCampaign();
    const town = state.settlements[CONQUEST_FIXTURE.settlementId]!, factionId = state.turnOwnerId;
    const attackers = state.armies[CONQUEST_FIXTURE.playerArmyId]!;
    attackers.formations = Array.from({ length: 12 }, (_, i) => createArmyFormation(i === 0 ? attackers.id : `army.${state.nextId++}`, 'unit.guard')).sort((a, b) => a.id < b.id ? -1 : 1);
    for (let i = 0; i < 21; i++) {
      const id = `army.${state.nextId++}`;
      state.armies[id] = { id, name: `Reserve ${i}`, factionId: town.factionId, cell: town.cell, movement: 0, formations: [{ ...createArmyFormation(id, 'unit.scout'), strength: 1, morale: 1 }] };
    }
    refreshAuthoredSight(state);
    state = deserializeGame(serializeGame(state));
    const issue = (command: GameCommand) => expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
    issue({ type: 'declareWar', factionId, targetFactionId: town.factionId });
    issue({ type: 'besiege', factionId, armyId: attackers.id, settlementId: town.id });
    for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId });
    expect(getObservation(state, factionId).sieges[0]).toHaveProperty('battleDefense.reserveFormations', 1);
    issue({ type: 'assault', factionId, settlementId: town.id });
    expect(state.battle!.combat.defender).toHaveLength(20);
    state = deserializeGame(serializeGame(state));
    issue({ type: 'autoResolveBattle', factionId });
    expect(state.battleReports.at(-1)!.combat.result!.winner).toBe('attacker');
    expect(state.pendingCapture).toBeNull();
    expect(Object.values(state.armies).filter(army => army.cell === town.cell)).toHaveLength(1);
    state = deserializeGame(serializeGame(state));
    issue({ type: 'endTurn', factionId });
    issue({ type: 'assault', factionId, settlementId: town.id });
    expect(state.battle!.combat.defender).toHaveLength(1);
    issue({ type: 'autoResolveBattle', factionId });
    expect(state.pendingCapture?.settlementId).toBe(town.id);
    issue({ type: 'resolveCapture', factionId, settlementId: town.id, outcome: 'occupy' });
    expect(state.settlements[town.id]!.factionId).toBe(factionId);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('engages twenty of twenty-one formations without changing or advancing through reserves', () => {
    let state = field(21);
    const factionId = state.turnOwnerId;
    const issue = (command: GameCommand) => expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
    issue({ type: 'declareWar', factionId, targetFactionId: state.armies['army.4']!.factionId });
    const before = structuredClone(state.armies);
    issue({ type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' });
    expect(state.battle!.combat.defender).toHaveLength(20);
    const reserve = Object.values(state.armies).filter(army => army.cell === state.battle!.defenderCell && !state.battle!.defenderIds.includes(army.id));
    expect(reserve).toHaveLength(1);
    const reserveId = reserve[0]!.id, origin = state.armies['army.2']!.cell;
    expect(reserve[0]).toEqual(before[reserveId]);
    const saved = serializeGame(state);
    state = deserializeGame(saved);
    expect(serializeGame(state)).toBe(saved);
    issue({ type: 'autoResolveBattle', factionId });
    expect(state.battleReports.at(-1)!.combat.result!.winner).toBe('attacker');
    expect(state.armies[reserveId]).toEqual(before[reserveId]);
    expect(state.armies['army.2']!.cell).toBe(origin);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(getObservation(state, factionId).armies.some(army => army.id === reserveId)).toBe(true);
  });
});
