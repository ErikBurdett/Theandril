import { describe, expect, it } from 'vitest';
import { ARCANE_DISCOVERIES, DEVELOPMENT_NODES } from '@theandril/content';
import { characterBattleCampaign } from '../../test-fixtures/src/character-fixture';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, deserializeGame, getBattleScene, getObservation, serializeGame, stateHash, type BattlePresentation, type GameCommand, type GameState } from './index';
import { chooseBattleOrder } from './combat';
import { battleDevelopmentEffects } from './combat/development-snapshot';
import { isHull } from './combat/individual';

const own = 'faction.ashen_compact', enemy = 'faction.reedbound_council';
function issue(state: GameState, command: GameCommand, packets?: BattlePresentation[]) {
  const result = applyCommand(state, command, undefined, packets ? packet => packets.push(packet) : undefined);
  expect(result, `${command.type}: ${result.error ?? ''}`).toMatchObject({ ok: true });
}
const restored = (state: GameState) => { const result = deserializeGame(serializeGame(state)); expect(stateHash(result)).toBe(stateHash(state)); return result; };
function begin(state: GameState) {
  issue(state, { type: 'declareWar', factionId: own, targetFactionId: enemy });
  issue(state, { type: 'attack', factionId: own, armyId: 'army.2', targetArmyId: 'army.4' });
  expect(state.battle!.rulesVersion).toBe(10);
}
function casterCampaign() {
  const state = characterBattleCampaign(), hearth = state.settlements['settlement.5']!;
  state.factions[0]!.treasury = 2000; state.factions[0]!.knowledge = 300;
  issue(state, { type: 'queue', factionId: own, settlementId: hearth.id, itemId: 'building.archive' });
  for (let turn = 0; turn < 25 && !hearth.buildings.includes('building.archive'); turn++) issue(state, { type: 'endTurn', factionId: own });
  expect(hearth.buildings).toContain('building.archive');
  const casterId = `character.${state.nextId}`;
  issue(state, { type: 'recruitCharacter', factionId: own, settlementId: hearth.id, definitionId: 'character.waykeeper' });
  issue(state, { type: 'assignCharacter', factionId: own, characterId: casterId, armyId: 'army.2' });
  for (const discovery of ARCANE_DISCOVERIES) issue(state, { type: 'researchArcane', factionId: own, discoveryId: discovery.id });
  begin(state);
  for (const source of state.battle!.abilityState!.sources.filter(source => source.armyId === 'army.2')) issue(state, { type: 'setBattleAbilityAuto', factionId: own, battleId: state.battle!.id, sourceId: source.sourceId, abilityId: source.abilityId, automatic: false });
  return { state: restored(state), casterId };
}
function expectDeathConservation(packet: BattlePresentation) {
  const living = new Set(packet.before.soldiers!.map(item => item.id));
  for (const event of packet.events) for (const id of event.killedSoldierIds ?? []) expect(living.delete(id), `duplicate or nonexistent death ${id}`).toBe(true);
  expect([...living].sort()).toEqual(packet.after.soldiers!.map(item => item.id).sort());
  for (const formation of packet.after.formations) if (!isHull(formation.unitId)) expect(formation.members).toHaveLength(formation.strength);
}

describe('individual battles across the campaign boundary', () => {
  it('observations and scene snapshots detach soldier positions, identities and development history', () => {
    const state = characterBattleCampaign(); begin(state);
    const original = stateHash(state), view = getObservation(state, own), scene = getBattleScene(state, state.battle!);
    expect(scene.soldiers!.length).toBe([...state.battle!.combat.attacker, ...state.battle!.combat.defender].reduce((sum, formation) => sum + formation.strength, 0));
    view.battle!.combat.attacker[0]!.members!.pop(); view.battle!.combat.attacker[0]!.position!.forward = 4;
    view.battle!.developmentSnapshots![0]!.trainingIds.push('training.field_habits');
    scene.formations[0]!.members!.pop(); scene.formations[0]!.position!.forward = 3;
    scene.soldiers![0]!.x = 999;
    expect(stateHash(state)).toBe(original);
    restored(state);
  });

  it('rejects forged individual identities outside the actual entering company and incomplete modern state', () => {
    const initial = characterBattleCampaign(); begin(initial);
    for (const mutate of [
      (state: GameState) => { const formation = state.battle!.combat.attacker.find(item => item.strength < item.maxStrength)!; formation.members![formation.members!.length - 1] = formation.maxStrength - 1; },
      (state: GameState) => { delete state.battle!.combat.attacker[0]!.members; },
      (state: GameState) => { state.battle!.combat.attacker[0]!.members![1] = state.battle!.combat.attacker[0]!.members![0]!; },
      (state: GameState) => { state.battle!.developmentSnapshots!.pop(); },
    ]) {
      const forged = restored(initial); mutate(forged);
      expect(() => deserializeGame(serializeGame(forged))).toThrow();
    }
  });

  it('paid ward and damaging spells preserve exact individual losses and save both pending and completed combat', () => {
    let { state } = casterCampaign(); const casterId = Object.values(state.characters).find(item => item.definitionId === 'character.waykeeper')!.id;
    const friend = state.battle!.combat.attacker[0]!.id, victim = state.battle!.combat.defender[0]!.id;
    const packets: BattlePresentation[] = [];
    const use = (abilityId: string, targetId: string): GameCommand => ({ type: 'useBattleAbility', factionId: own, battleId: state.battle!.id, sourceId: casterId, abilityId, targetId });
    issue(state, use('spell.bound_ward', friend), packets);
    expect(packets[0]!.before.soldiers).toEqual(packets[0]!.after.soldiers); expect(packets[0]!.after.formations.find(item => item.id === friend)!.ward).toBe(8);
    state = restored(state);
    issue(state, { type: 'battleOrder', factionId: own, order: 'brace' }, packets);
    issue(state, use('spell.cinder_thread', victim), packets);
    const fire = packets.at(-1)!;
    expect(fire.events.some(event => event.abilityId === 'spell.cinder_thread' && event.killedSoldierIds!.length > 0)).toBe(true);
    expectDeathConservation(fire); state = restored(state);
    issue(state, { type: 'autoResolveBattle', factionId: own }, packets);
    expectDeathConservation(packets.at(-1)!); restored(state);
  });

  it('manual AI choices and autoresolve preserve identical combat, aftermath and earned company progress', () => {
    const state = characterBattleCampaign(); begin(state); const automatic = restored(state), packets: BattlePresentation[] = [];
    let manual = restored(state);
    while (manual.battle) {
      issue(manual, { type: 'battleOrder', factionId: own, order: chooseBattleOrder(manual.battle.combat, 'attacker') }, packets);
      manual = restored(manual);
    }
    issue(automatic, { type: 'autoResolveBattle', factionId: own });
    expect(manual.battleReports).toEqual(automatic.battleReports); expect(manual.armies).toEqual(automatic.armies); expect(manual.development).toEqual(automatic.development);
    packets.forEach(expectDeathConservation); restored(automatic);
  });

  it('real embarked troops stay out of the naval scene and receive no fighting-company experience', () => {
    const state = navalCampaign();
    issue(state, { type: 'embarkArmy', factionId: own, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
    const passengerIds = state.armies[NAVAL_FIXTURE.cargoId]!.formations.map(item => item.id);
    state.armies[NAVAL_FIXTURE.enemyFleetId]!.cell = NAVAL_FIXTURE.shallowCell;
    refreshAuthoredSight(state);
    const fight = restored(state); begin(fight);
    const scene = getBattleScene(fight, fight.battle!);
    expect(scene.domain).toBe('naval'); expect(scene.soldiers).toHaveLength(scene.formations.length);
    expect(scene.formations.every(item => isHull(item.unitId) && !passengerIds.includes(item.id))).toBe(true);
    expect(scene.characters.every(item => item.armyId !== NAVAL_FIXTURE.cargoId)).toBe(true);
    const packets: BattlePresentation[] = [];
    issue(fight, { type: 'autoResolveBattle', factionId: own }, packets);
    packets.forEach(expectDeathConservation);
    for (const id of passengerIds) expect(fight.development.formations[id]).toBeUndefined();
    restored(fight);
  });

  it('completed development snapshots retain a legal earned branch rather than accepting prerequisite-free stats', () => {
    const state = characterBattleCampaign(); begin(state); issue(state, { type: 'autoResolveBattle', factionId: own });
    // Recorded reports are sealed (frozen) history; forge a detached copy in its place.
    const forged = restored(state), report = structuredClone(forged.battleReports.at(-1)!), snapshot = report.developmentSnapshots![0]!;
    forged.battleReports[forged.battleReports.length - 1] = report;
    snapshot.trainingIds = ['training.breakthrough'];
    expect(() => battleDevelopmentEffects(snapshot)).toThrow('prerequisites');
    const effects = DEVELOPMENT_NODES.find(node => node.id === 'training.breakthrough')!.effects, formation = [...report.combat.attacker, ...report.combat.defender].find(item => item.id === snapshot.formationId)!;
    formation.attack += effects.attack; formation.initiative += effects.initiative;
    expect(() => deserializeGame(serializeGame(forged))).toThrow();
  });
});
