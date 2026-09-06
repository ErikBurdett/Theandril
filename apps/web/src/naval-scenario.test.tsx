import { describe, expect, it } from 'vitest';
import { applyCommand, createArmyFormation, deserializeGame, getMovementQuery, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { navalCampaign, NAVAL_FIXTURE as N } from '../../../packages/test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../../packages/test-fixtures/src/authored-land';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); expect(result, command.type).toMatchObject({ ok: true }); }

describe('canonical preflight for playable naval UI scenarios', () => {
  it('queues the actual eight-step voyage and lands passengers only after the fleet has movement', () => {
    let state = navalCampaign({ enemyFleet: false });
    const factionId = state.turnOwnerId;
    issue(state, { type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
    expect(getMovementQuery(getObservation(state, factionId), N.fleetId, N.deepCell).preview?.blocker).toContain('Ocean navigation');
    issue(state, { type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
    const plan = getMovementQuery(getObservation(state, factionId), N.fleetId, N.landingWaterCell).preview!;
    expect(plan.canQueue).toBe(true); expect(plan.path).toHaveLength(8);
    issue(state, { type: 'queueMovement', factionId, armyId: N.fleetId, target: N.landingWaterCell });
    const hash = stateHash(state); state = deserializeGame(serializeGame(state)); expect(stateHash(state)).toBe(hash);
    for (let round = 0; round < 5 && (state.armies[N.fleetId]!.cell !== N.landingWaterCell || state.armies[N.fleetId]!.movement < 1); round++) issue(state, { type: 'endTurn', factionId });
    expect(state.armies[N.fleetId]!.cell).toBe(N.landingWaterCell);
    expect(state.armies[N.cargoId]!.cell).toBe(N.landingWaterCell);
    issue(state, { type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.landingCell });
    expect(state.armies[N.cargoId]).toMatchObject({ cell: N.landingCell, movement: 0 });
  });

  it('the doomed-carrier browser fixture produces real passenger losses through the combat kernel', () => {
    let state = navalCampaign();
    for (const formation of state.armies[N.fleetId]!.formations) { formation.strength = 4; formation.morale = 30; }
    const enemy = state.armies[N.enemyFleetId]!; enemy.cell = N.shallowCell;
    enemy.formations = Array.from({ length: 6 }, () => createArmyFormation(`army.${state.nextId++}`, 'unit.coastal_warship')).sort((a, b) => a.id < b.id ? -1 : 1);
    refreshAuthoredSight(state);
    state = deserializeGame(serializeGame(state));
    const factionId = state.turnOwnerId;
    issue(state, { type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
    issue(state, { type: 'declareWar', factionId, targetFactionId: state.factions[1]!.id });
    issue(state, { type: 'attack', factionId, armyId: N.fleetId, targetArmyId: N.enemyFleetId });
    expect(state.battle?.combat.attacker).toHaveLength(3);
    state = deserializeGame(serializeGame(state));
    issue(state, { type: 'battleOrder', factionId, order: 'brace' });
    if (state.battle) issue(state, { type: 'autoResolveBattle', factionId });
    expect(state.battleReports.at(-1)!.transportAftermath).toEqual([expect.objectContaining({ armyId: N.cargoId, outcome: 'lost' })]);
  });
});
