import { createArmyFormation } from './army-composition';
import { describe, expect, it } from 'vitest';
import { checksum, UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { rebaseAuthoredLand } from '../../test-fixtures/src/authored-land';
import { applyCommand, createGame, deserializeGame, getObservation, replayGame, serializeGame, stateHash, validateEndTurn } from './index';
import type { CampaignBattle, GameCommand, GameState } from './index';
import { chooseBattleOrder } from './combat';
import { rebuildIndexes } from './visibility';
import { recordWar } from './diplomacy';

const player = 'faction.ashen_compact';
const rival = 'faction.reedbound_council';
const war: GameCommand = { type: 'declareWar', factionId: player, targetFactionId: rival };
const attack: GameCommand = { type: 'attack', factionId: player, armyId: 'army.2', targetArmyId: 'army.4' };
const auto: GameCommand = { type: 'autoResolveBattle', factionId: player };
const endTurn: GameCommand = { type: 'endTurn', factionId: player };
const checked = (state: GameState, command: GameCommand) => expect(applyCommand(state, command)).toMatchObject({ ok: true });

function begin(state = borderBattleCampaign()): GameState {
  checked(state, war); checked(state, attack);
  return state;
}

function invalid(state: GameState, command: unknown): void {
  const before = stateHash(state);
  expect(applyCommand(state, command).ok).toBe(false);
  expect(stateHash(state)).toBe(before);
}

interface BattleSave { stateChecksum: string; state: { battle: CampaignBattle | null; battleReports: CampaignBattle[]; wars: [string, string][]; armies: GameState['armies'][string][] } }

describe('field battles in the campaign', () => {
  it('requires explicit war, visible adjacency, ownership and movement before committing a battle', () => {
    const state = borderBattleCampaign();
    invalid(state, attack);
    invalid(state, { ...war, targetFactionId: player });
    invalid(state, { ...war, targetFactionId: 'faction.missing' });
    invalid(state, { type: 'attack', factionId: rival, armyId: 'army.2', targetArmyId: 'army.4' });
    invalid(state, { ...auto });
    checked(state, war);
    invalid(state, war);
    const attacker = state.armies['army.2'];
    if (!attacker) throw new Error('Missing attacker');
    attacker.movement = 0;
    invalid(state, attack);
    attacker.movement = 3;
    checked(state, attack);
    expect(state.armies['army.2']?.movement).toBe(0);
    expect(state.armies['army.4']?.movement).toBe(0);
    expect(state.battle?.combat.attacker[0]?.unitId).toBe('unit.guard');
    expect(state.battle?.defenderIds).toEqual(['army.4']);
  });

  it('forbids hidden targets and founding caravans initiating attacks', () => {
    const hidden = createGame({ seed: 42, size: 'tiny', factionCount: 2 });
    invalid(hidden, war);
    invalid(hidden, attack);
    const state = borderBattleCampaign();
    const attacker = state.armies['army.2'];
    const caravan = UNITS.find(unit => unit.canFound);
    if (!attacker || !caravan) throw new Error('Missing fixture definitions');
    Object.assign(attacker, { formations: [createArmyFormation(attacker.id, caravan.id)], movement: caravan.movement });
    rebuildIndexes(state);
    checked(state, war);
    invalid(state, attack);
  });

  it('blocks strategic actions and prevents AI from resolving a human battle', () => {
    const state = begin();
    invalid(state, endTurn);
    invalid(state, { type: 'queue', factionId: player, settlementId: 'settlement.5', itemId: 'unit.guard' });
    invalid(state, { type: 'move', factionId: player, armyId: 'army.2', target: 490 });
    invalid(state, { type: 'autoResolveBattle', factionId: rival });
    invalid(state, { type: 'battleOrder', factionId: player, order: 'annihilate' });
    expect(validateEndTurn(state, endTurn).ok).toBe(false);
  });

  it('allows the human defender to choose orders after an AI attack', () => {
    const state = borderBattleCampaign();
    checked(state, war);
    checked(state, { type: 'attack', factionId: rival, armyId: 'army.4', targetArmyId: 'army.2' });
    invalid(state, { type: 'battleOrder', factionId: rival, order: 'advance' });
    checked(state, { type: 'battleOrder', factionId: player, order: 'brace' });
    expect(state.battle?.combat.log[0]).toMatch(/defender brace/);
    checked(state, auto);
    expect(state.battle).toBeNull();
  });

  it('includes every defending army and rejects unsupported stacks atomically', () => {
    const state = borderBattleCampaign();
    const defender = state.armies['army.4'];
    if (!defender) throw new Error('Missing defender');
    const id = `army.${state.nextId++}`;
    state.armies[id] = { ...defender, id, formations: [createArmyFormation(id, defender.formations[0]!.unitId)] };
    rebuildIndexes(state);
    checked(state, war); checked(state, attack);
    expect(state.battle?.defenderIds).toEqual(['army.4', id].sort());
    expect(state.battle?.combat.defender).toHaveLength(2);
    expect(state.battle?.combat.defender.map(unit => unit.row * 5 + unit.column)).toEqual([0, 1]);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    const crowded = borderBattleCampaign();
    const guard = crowded.armies['army.4'];
    if (!guard) throw new Error('Missing defender');
    for (let index = 0; index < 20; index++) {
      const id = `army.${crowded.nextId++}`;
      crowded.armies[id] = { ...guard, id, formations: [createArmyFormation(id, guard.formations[0]!.unitId)] };
    }
    rebuildIndexes(crowded);
    checked(crowded, war);
    invalid(crowded, attack);
  });

  it('preserves exact manual/autoresolve parity and mid-battle save/replay', () => {
    const state = begin();
    const initial = serializeGame(state);
    const manual = deserializeGame(initial);
    checked(state, auto);
    const commands: GameCommand[] = [];
    while (manual.battle) {
      const command: GameCommand = { type: 'battleOrder', factionId: player, order: chooseBattleOrder(manual.battle.combat, 'attacker') };
      checked(manual, command); commands.push(command);
      const resumed = deserializeGame(serializeGame(manual));
      expect(stateHash(resumed)).toBe(stateHash(manual));
    }
    // Tactical round notifications differ from the one-command autoresolve log.
    expect(manual.battleReports).toEqual(state.battleReports);
    expect(manual.armies).toEqual(state.armies);
    expect(stateHash(replayGame(initial, commands))).toBe(stateHash(manual));
    expect(stateHash(replayGame(initial, [auto]))).toBe(stateHash(state));
  });

  it('applies ordered retreat, persistent fatigue/morale and exact wounded-army casualties', () => {
    const state = borderBattleCampaign();
    const attacker = state.armies['army.2'];
    if (!attacker) throw new Error('Missing attacker');
    attacker.formations[0]!.strength = 40;
    begin(state);
    // Isolate unprotected pursuit; the separate ward test covers protected retreat.
    checked(state, { type: 'setBattleAbilityAuto', factionId: player, battleId: state.battle!.id, sourceId: attacker.formations[0]!.id, abilityId: 'ability.set_shields', automatic: false });
    checked(state, { type: 'battleOrder', factionId: player, order: 'withdraw' });
    const report = state.battleReports[0];
    expect(report?.initialStrengths.find(army => army.armyId === attacker.id)?.strength).toBe(40);
    const ending = report?.aftermath.find(army => army.armyId === attacker.id);
    expect(ending?.outcome).toBe('retreated');
    expect(ending?.cell).not.toBe(report?.attackerCell);
    expect(ending?.strength).toBeLessThan(40);
    expect(state.armies[attacker.id]?.formations[0]?.fatigue).toBeGreaterThan(0);
    const fatigue = state.armies[attacker.id]?.formations[0]?.fatigue ?? 0;
    checked(state, endTurn);
    expect(state.armies[attacker.id]?.formations[0]?.fatigue).toBe(Math.max(0, fatigue - 15));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('routes low-morale defenders and advances winners only into vacated legal cells', () => {
    const state = borderBattleCampaign();
    const defender = state.armies['army.2'];
    if (!defender) throw new Error('Missing defender');
    defender.formations[0]!.morale = 5;
    const destination = defender.cell;
    checked(state, war);
    checked(state, { type: 'attack', factionId: rival, armyId: 'army.4', targetArmyId: 'army.2' });
    checked(state, { type: 'battleOrder', factionId: player, order: 'advance' });
    // Modern guard drill can absorb the first blow; routing still follows real damage.
    for (let round = 0; state.battle && round < 8; round++) checked(state, { type: 'battleOrder', factionId: player, order: 'advance' });
    expect(state.battle).toBeNull();
    expect(state.battleReports[0]?.combat.result?.reason).toBe('morale rout');
    expect(state.armies['army.4']?.cell).toBe(destination);
    expect(state.armies['army.2']?.cell).not.toBe(destination);
    expect(state.armies['army.2']?.formations[0]?.morale).toBe(1);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('moves both sides away after mutual withdrawal', () => {
    const state = borderBattleCampaign();
    const defender = state.armies['army.4'];
    if (!defender) throw new Error('Missing defender');
    defender.formations[0]!.morale = 5;
    begin(state);
    checked(state, { type: 'battleOrder', factionId: player, order: 'withdraw' });
    expect(state.battleReports[0]?.combat.result).toEqual({ winner: 'draw', reason: 'mutual withdrawal' });
    expect(state.battleReports[0]?.aftermath.every(army => army.outcome === 'retreated')).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('uses strategic defender terrain in the shared tactical damage rules', () => {
    const plain = borderBattleCampaign();
    const hills = borderBattleCampaign();
    const target = plain.armies['army.4']?.cell;
    if (target === undefined) throw new Error('Missing defender');
    plain.world.terrain[target] = 1; hills.world.terrain[target] = 3;
    for (const state of [plain, hills]) {
      begin(state);
      checked(state, { type: 'battleOrder', factionId: player, order: 'advance' });
      checked(state, { type: 'battleOrder', factionId: player, order: 'advance' });
    }
    expect(hills.battle?.combat.defender[0]?.strength).toBeGreaterThan(plain.battle?.combat.defender[0]?.strength ?? 0);
  });

  it('destroys trapped retreaters and records actual strategic survivors', () => {
    const state = borderBattleCampaign();
    const attacker = state.armies['army.2'];
    const defender = state.armies['army.4'];
    if (!attacker || !defender) throw new Error('Missing armies');
    const occupied = new Set([...Object.values(state.settlements).map(town => town.cell), defender.cell]);
    for (const cell of neighbors(attacker.cell, state.world.width, state.world.height)) {
      if (!isPassable(state.world.terrain[cell] ?? 0) || cell === defender.cell) continue;
      if (occupied.has(cell)) {
        const town = Object.values(state.settlements).find(town => town.cell === cell);
        if (town) town.factionId = rival;
      } else {
        const id = `army.${state.nextId++}`;
        state.armies[id] = { ...defender, id, cell, formations: [createArmyFormation(id, defender.formations[0]!.unitId)] };
      }
    }
    rebaseAuthoredLand(state);
    begin(state);
    checked(state, { type: 'battleOrder', factionId: player, order: 'withdraw' });
    expect(state.armies[attacker.id]).toBeUndefined();
    expect(state.battleReports[0]?.combat.attacker[0]?.strength).toBeGreaterThan(0);
    expect(state.battleReports[0]?.aftermath.find(army => army.armyId === attacker.id)).toEqual({ armyId: attacker.id, strength: 0, cell: null, outcome: 'destroyed' });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('keeps pending battles and reports out of unrelated faction observations', () => {
    const state = createGame({ seed: 42, size: 'tiny', factionCount: 3 });
    const attacker = state.armies['army.2'];
    const defender = state.armies['army.4'];
    if (!attacker || !defender) throw new Error('Missing scouts');
    const target = neighbors(attacker.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0));
    if (target === undefined) throw new Error('Missing encounter terrain');
    defender.cell = target;
    rebuildIndexes(state);
    begin(state);
    const unrelated = state.factions[2]?.id ?? '';
    expect(getObservation(state, unrelated).battle).toBeNull();
    expect(getObservation(state, unrelated).wars).toEqual([]);
    const view = getObservation(state, player);
    if (view.battle?.combat.attacker[0]) view.battle.combat.attacker[0].strength = 999;
    expect(state.battle?.combat.attacker[0]?.strength).not.toBe(999);
    checked(state, auto);
    expect(getObservation(state, unrelated).battleReports).toEqual([]);
    expect(getObservation(state, unrelated).events.some(event => event.type === 'battle_finished')).toBe(false);
  });
});

describe('battle save invariants', () => {
  it('preserves canonical wars when generated faction IDs share prefixes', () => {
    const state = createGame({ seed: 1, size: 'tiny', factionCount: 8, generatorVersion: 3, rosterVersion: 1 });
    state.wars = [['faction.ashen_compact', rival], ['faction.ashen_compact.5', rival]];
    for (const pair of state.wars) recordWar(state, pair[0], pair[1]);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  const tamper: [string, (save: BattleSave) => void][] = [
    ['pending completed result', save => { if (save.state.battle) save.state.battle.combat.result = { winner: 'attacker', reason: 'forged' }; }],
    ['missing war', save => { save.state.wars = []; }],
    ['reverse war', save => { if (save.state.wars[0]) save.state.wars[0].reverse(); }],
    ['unknown participant', save => { if (save.state.battle) save.state.battle.attackerId = 'army.999'; }],
    ['extra combat power', save => { if (save.state.battle?.combat.attacker[0]) save.state.battle.combat.attacker[0].attack++; }],
    ['false initial strength', save => { if (save.state.battle?.initialStrengths[0]) save.state.battle.initialStrengths[0].strength--; }],
    ['wrong battle seed', save => { if (save.state.battle) save.state.battle.combat.seed++; }],
    ['wrong terrain', save => { if (save.state.battle) save.state.battle.combat.terrain = 4; }],
    ['unspent movement', save => { if (save.state.armies[0]) save.state.armies[0].movement = 2; }],
    ['false defender list', save => { if (save.state.battle) save.state.battle.defenderIds = ['army.2']; }],
  ];
  it.each(tamper)('rejects %s even with a recomputed checksum', (_label, mutate) => {
    const save: BattleSave = JSON.parse(serializeGame(begin()));
    mutate(save);
    save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });

  it('rejects corrupt completed report aftermath but accepts references to removed armies', () => {
    const state = begin();
    checked(state, auto);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    const save: BattleSave = JSON.parse(serializeGame(state));
    const outcome = save.state.battleReports[0]?.aftermath[0];
    if (!outcome) throw new Error('Missing aftermath');
    outcome.strength = 999;
    save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow(/aftermath/);
  });
});
