import { describe, expect, it } from 'vitest';
import { CONTENT_HASH } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { rebuildIndexes } from './visibility';
import { withRules } from './rules';
import { PRE_KINDS_CONTENT_HASH, serializeGameForVersion } from './save';
import { arrangedFormations, deploymentBlocker, deploymentOf, frontRank, validateDeployments } from './deployment';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** The player's column with a scout, a cohort, pikes and outriders, and a rival company beside it. */
const column = () => {
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions.find(item => item.id !== player)!.id;
  const army = Object.values(state.armies).find(item => item.factionId === player)!;
  for (const unitId of ['unit.heavy_infantry', 'unit.spearman', 'unit.cavalry']) army.formations.push({ ...createArmyFormation(army.id, unitId), id: `formation.${state.nextId++}` });
  army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  const enemyId = `army.${state.nextId++}`;
  const beside = neighbors(army.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(item => item.cell !== cell) && Object.values(state.settlements).every(town => town.cell !== cell))!;
  state.armies[enemyId] = { id: enemyId, factionId: rival, name: 'Rival company', cell: beside, movement: 3, formations: [createArmyFormation(enemyId, 'unit.guard')] };
  rebuildIndexes(state); refreshAuthoredSight(state);
  army.movement = 2; // the cohort's pace, the slowest in the column
  return { state, player, rival, army, enemyId };
};
const unitOf = (state: GameState, armyId: string, formationId: string) => state.armies[armyId]!.formations.find(item => item.id === formationId)!.unitId;

describe('rules 75: army deployment', () => {
  it('draws the line up in canonical order, a shield wall by armor, pikes and skirmishers by reach, keeps the doctrine on the army, quotes the front rank, and places the chosen formations in the front rank of a real battle', () => {
    const { state, player, rival, army, enemyId } = column();
    expect(arrangedFormations(state, army).map(item => item.id)).toEqual(army.formations.map(item => item.id));
    expect(getObservation(state, player).armies.find(item => item.id === army.id)).toMatchObject({ doctrine: 'line', frontRank: army.formations.slice(0, 5).map(item => ({ 'unit.scout': 'Wayfinder', 'unit.heavy_infantry': 'Cinder plate cohort', 'unit.spearman': 'Ash pike company', 'unit.cavalry': 'Charter outriders' } as Record<string, string>)[item.unitId]) });
    expect(deploymentBlocker(state, player, army.id, 'line')).toContain('already');
    expect(deploymentBlocker(state, rival, army.id, 'shieldwall')).toContain('your own armies');
    const set = issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'shieldwall' });
    expect(set.events[0]).toMatchObject({ type: 'deployment_set', factionId: player, cell: army.cell });
    expect(set.events[0]!.message).toContain(`${army.name} will draw up as shield wall`);
    expect(army.deployment).toBe('shieldwall');
    expect(arrangedFormations(state, army).map(item => unitOf(state, army.id, item.id))).toEqual(['unit.heavy_infantry', 'unit.guard', 'unit.spearman', 'unit.cavalry', 'unit.scout'].filter(id => army.formations.some(item => item.unitId === id)));
    expect(frontRank(state, army)[0]).toBe('Cinder plate cohort');
    issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'pikes' });
    expect(arrangedFormations(state, army)[0]!.unitId).toBe('unit.spearman');
    issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'skirmish' });
    expect(arrangedFormations(state, army)[0]!.unitId).toBe('unit.scout');
    // Rules 76: cavalry wings put the mounted on the outer columns of each rank and the foot in the centre.
    issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'wings' });
    const wings = arrangedFormations(state, army).map(item => unitOf(state, army.id, item.id));
    expect(wings[0]).toBe('unit.cavalry');
    expect(wings.slice(1).every(id => id !== 'unit.cavalry')).toBe(true);
    expect(frontRank(state, army)[0]).toBe('Charter outriders');
    withRules(state, 75, () => { expect(deploymentOf(state, army)).toBe('line'); expect(applyCommand(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'wings' }).error).toContain('Cavalry wings are not part of these rules'); });
    expect(() => serializeGameForVersion(state, 75)).toThrow('cavalry wings unavailable');
    const noWings = structuredClone(state); noWings.armies[army.id]!.deployment = 'shieldwall';
    expect(JSON.parse(serializeGameForVersion(noWings, 75))).toMatchObject({ version: 75 });
    const forgedWings = JSON.parse(serializeGameForVersion(noWings, 75)) as { state: { armies: { id: string; deployment?: string }[] } };
    forgedWings.state.armies.find(item => item.id === army.id)!.deployment = 'wings';
    expect(() => deserializeGame(JSON.stringify(forgedWings))).toThrow();
    issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'skirmish' });
    expect(() => validateDeployments(state)).not.toThrow();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(deserializeGame(serializeGame(state)).armies[army.id]!.deployment).toBe('skirmish');
    // The line clears the doctrine; a fleet keeps none; an invalid doctrine is an invalid save.
    issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'line' });
    expect(army.deployment).toBeUndefined();
    const broken = structuredClone(state); (broken.armies[army.id] as { deployment?: string }).deployment = 'wedge';
    expect(() => validateDeployments(broken)).toThrow('not a doctrine');
    // A shield wall puts the cohort in the front rank of a real battle; the line puts the first formation by id there.
    issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'shieldwall' });
    issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival });
    issue(state, { type: 'attack', factionId: player, armyId: army.id, targetArmyId: enemyId });
    const battle = state.battle!;
    const cohort = army.formations.find(item => item.unitId === 'unit.heavy_infantry')!;
    expect(battle.combat.attacker.find(item => item.id === cohort.id)).toMatchObject({ row: 0, column: 0 });
    expect(battle.combat.attacker.filter(item => item.row === 0)).toHaveLength(Math.min(5, army.formations.length));
    expect(() => deploymentBlocker(state, player, army.id, 'pikes')).not.toThrow();
    expect(deploymentBlocker(state, player, army.id, 'pikes')).toContain('current battle');
  });

  it('is nothing under rules 74, cannot be sealed under them once set, and a v74 envelope loads with the line', () => {
    const { state, player, army } = column();
    withRules(state, 74, () => {
      expect(applyCommand(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'shieldwall' }).error).toContain('not part of these rules');
      expect(getObservation(state, player).armies.find(item => item.id === army.id)!.doctrine).toBe('line');
    });
    const sealed = serializeGameForVersion(state, 74);
    expect(JSON.parse(sealed)).toMatchObject({ version: 74, contentHash: PRE_KINDS_CONTENT_HASH });
    expect(JSON.parse(sealed).state.armies.every((item: { deployment?: string }) => item.deployment === undefined)).toBe(true);
    const loaded = deserializeGame(sealed);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 80, contentHash: CONTENT_HASH });
    issue(state, { type: 'setDeployment', factionId: player, armyId: army.id, deployment: 'shieldwall' });
    expect(() => serializeGameForVersion(state, 74)).toThrow('deployments unavailable');
    // A v74 envelope naming a doctrine is refused.
    const forged = JSON.parse(sealed) as { state: { armies: { deployment?: string }[] } };
    forged.state.armies[0]!.deployment = 'shieldwall';
    expect(() => deserializeGame(JSON.stringify(forged))).toThrow();
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
  });
});
