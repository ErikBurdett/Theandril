import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, armyStrength, createArmyFormation, deserializeGame, getObservation, replayGame, serializeGame, stateHash, type Army, type CampaignBattle, type GameCommand, type GameState } from './index';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { rebuildIndexes } from './visibility';
import { autoResolveBattle } from './combat';

const factionId = 'faction.ashen_compact'; const rival = 'faction.reedbound_council';
const end: GameCommand = { type: 'endTurn', factionId };
const war: GameCommand = { type: 'declareWar', factionId, targetFactionId: rival };
const attack: GameCommand = { type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' };
const auto: GameCommand = { type: 'autoResolveBattle', factionId };
const issue = (state: GameState, command: GameCommand): void => { expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true }); };
function reinforce(state: GameState, armyId: string, unitId: string): void {
  const army = state.armies[armyId]!; const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: army.factionId, name: 'Reinforcement', cell: army.cell, movement: 0, formations: [createArmyFormation(id, unitId)] };
  rebuildIndexes(state);
  issue(state, { type: 'mergeArmies', factionId: army.factionId, sourceArmyId: id, targetArmyId: armyId });
}
function mixed(): GameState {
  const state = borderBattleCampaign();
  reinforce(state, 'army.2', 'unit.scout'); reinforce(state, 'army.2', 'unit.heavy_infantry');
  reinforce(state, 'army.4', 'unit.spearman'); reinforce(state, 'army.4', 'unit.cavalry');
  issue(state, end); return deserializeGame(serializeGame(state));
}

describe('mixed campaign forces use the real formation battlefield', () => {
  it('removes a destroyed formation without deleting the surviving army or leaving its scouting vision behind', () => {
    const state = borderBattleCampaign();
    reinforce(state, 'army.2', 'unit.scout');
    const army = state.armies['army.2']!;
    const scout = army.formations.find(item => item.unitId === 'unit.scout')!;
    scout.strength = 1;
    issue(state, end); issue(state, war); issue(state, attack); issue(state, auto);
    expect(state.armies['army.2']).toBeDefined();
    expect(army.formations.map(item => item.id)).not.toContain(scout.id);
    expect(state.events.some(event => event.type === 'formation_destroyed' && event.message.includes(scout.id))).toBe(true);
    expect(state.battleReports.at(-1)?.formationAftermath.find(item => item.formationId === scout.id)?.strength).toBe(0);
    const resumed = deserializeGame(serializeGame(state));
    expect(stateHash(resumed)).toBe(stateHash(state));
    expect(getObservation(resumed, factionId).cells).toEqual(getObservation(state, factionId).cells);
  });
  it('deploys all formations, saves mid-battle, and persists exact per-formation casualties and army movement', () => {
    const state = mixed(); const initial = serializeGame(state);
    const commands: GameCommand[] = [war, attack, { type: 'battleOrder', factionId, order: 'brace' }];
    for (const command of commands) issue(state, command);
    const pending = state.battle!;
    expect(pending.combat.attacker).toHaveLength(3); expect(pending.combat.defender).toHaveLength(3);
    expect(pending.formationBindings).toHaveLength(6);
    expect(new Set([...pending.combat.attacker, ...pending.combat.defender].map(item => item.unitId)).size).toBe(5);
    expect(state.armies['army.2']!.movement).toBe(0); expect(state.armies['army.4']!.movement).toBe(0);
    const engine = autoResolveBattle(pending.combat);
    const resumed = deserializeGame(serializeGame(state));
    issue(state, auto); issue(resumed, auto);
    expect(stateHash(resumed)).toBe(stateHash(state));
    expect(stateHash(replayGame(initial, [...commands, auto]))).toBe(stateHash(state));
    const report = state.battleReports.at(-1)!;
    expect(report.combat).toEqual(engine);
    expect(report.aftermath).toHaveLength(2); expect(report.formationAftermath).toHaveLength(6);
    for (const binding of report.formationBindings) {
      const surviving = state.armies[binding.armyId!]!.formations.find(item => item.id === binding.formationId)?.strength ?? 0;
      expect(report.formationAftermath.find(item => item.formationId === binding.formationId)?.strength).toBe(surviving);
    }
    for (const ending of report.aftermath) expect(ending.strength).toBe(state.armies[ending.armyId] ? armyStrength(state.armies[ending.armyId]!) : 0);
    expect(report.formationAftermath.reduce((sum, item) => sum + item.strength, 0)).toBeLessThan(report.formationStrengths.reduce((sum, item) => sum + item.strength, 0));
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('retreats each mixed container once, preserving its roster identities and shared cell', () => {
    const state = mixed(); const ids = state.armies['army.2']!.formations.map(item => item.id);
    issue(state, war); issue(state, attack);
    const result = applyCommand(state, { type: 'battleOrder', factionId, order: 'withdraw' }); expect(result.ok).toBe(true);
    expect(result.events.filter(event => event.type === 'army_retreated' && event.factionId === factionId)).toHaveLength(1);
    const army = state.armies['army.2']!;
    expect(army.formations.map(item => item.id)).toEqual(ids);
    expect(state.battleReports.at(-1)?.aftermath.find(item => item.armyId === army.id)).toMatchObject({ outcome: 'retreated', cell: army.cell, strength: armyStrength(army) });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('rejects a stacked target over twelve total formations without omitting any defenders', () => {
    const state = borderBattleCampaign();
    for (let i = 0; i < 11; i++) reinforce(state, 'army.4', 'unit.guard');
    const defender = state.armies['army.4']!; const id = `army.${state.nextId++}`;
    state.armies[id] = { ...defender, id, formations: [createArmyFormation(id, 'unit.scout')] };
    rebuildIndexes(state); issue(state, end); issue(state, war);
    const before = stateHash(state);
    expect(applyCommand(state, attack)).toMatchObject({ ok: false, error: 'This field battle supports at most twelve defending formations.' });
    expect(stateHash(state)).toBe(before);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(before);
  });

  it('keeps mixed siege forces locked against reorganization and uses the same fortified militia engine', () => {
    const state = conquestCampaign(); reinforce(state, CONQUEST_FIXTURE.playerArmyId, 'unit.spearman');
    issue(state, end); issue(state, war);
    issue(state, { type: 'besiege', factionId, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId });
    const army = state.armies[CONQUEST_FIXTURE.playerArmyId]!; const before = stateHash(state);
    expect(applyCommand(state, { type: 'splitArmy', factionId, armyId: army.id, formationIds: [army.formations[0]!.id] }).ok).toBe(false);
    expect(stateHash(state)).toBe(before);
    for (let i = 0; i < 3; i++) issue(state, end);
    issue(state, { type: 'assault', factionId, settlementId: CONQUEST_FIXTURE.settlementId });
    expect(state.battle?.combat.attacker).toHaveLength(2); expect(state.battle?.combat.defender).toHaveLength(1);
    expect(state.battle?.formationBindings.some(item => item.armyId === null)).toBe(true);
    const resumed = deserializeGame(serializeGame(state));
    issue(state, auto); issue(resumed, auto);
    expect(stateHash(state)).toBe(stateHash(resumed)); expect(state.pendingCapture).not.toBeNull();
  });

  it.each(['missing-binding', 'wrong-army', 'omitted-roster', 'entering-strength', 'wrong-side'] as const)('rejects invalid pending composition after a checksum is recomputed: %s', mutation => {
    const state = mixed(); issue(state, war); issue(state, attack);
    const save = JSON.parse(serializeGame(state)) as { state: { battle: CampaignBattle; armies: Army[] }; stateChecksum: string };
    const battle = save.state.battle;
    if (mutation === 'missing-binding') battle.formationBindings.pop();
    if (mutation === 'wrong-army') battle.formationBindings[0]!.armyId = battle.formationBindings[0]!.armyId === 'army.4' ? 'army.2' : 'army.4';
    if (mutation === 'omitted-roster') save.state.armies.find(item => item.id === 'army.2')!.formations.pop();
    if (mutation === 'entering-strength') battle.formationStrengths[0]!.strength--;
    if (mutation === 'wrong-side') battle.attackerId = battle.defenderId;
    save.stateChecksum = checksum(JSON.stringify(save.state));
    expect(() => deserializeGame(JSON.stringify(save))).toThrow();
  });
});
