import { describe, expect, it } from 'vitest';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { withRules } from '../../sim/src/rules';
import { roadDirection } from '../../sim/src/roads';
import { applyCommand, createArmyFormation, deserializeGame, getMovementQuery, getObservation, replayGame, serializeGame, stateHash, type Army, type GameCommand, type GameState } from '@theandril/sim';
import { planTurn } from './index';
import { planNaval } from './naval';

function issue(state: GameState, command: GameCommand): void {
  expect(applyCommand(state, command), JSON.stringify(command)).toMatchObject({ ok: true });
}

/** Authored wounded stack, no injected plans or command outcomes. */
function stack(state: GameState, enemy: Army, unitId: string, sizes: number[]): void {
  const ids = sizes.map((_, index) => index ? `army.${state.nextId++}` : enemy.id);
  for (const [index, size] of sizes.entries()) {
    const id = ids[index]!;
    state.armies[id] = { ...enemy, id, formations: Array.from({ length: size }, (_, formation) => ({
      ...createArmyFormation(formation ? `army.${state.nextId++}` : id, unitId), strength: 1, morale: 1,
    })).sort((a, b) => a.id < b.id ? -1 : 1) };
  }
}

function ready(state: GameState, war = true): GameState {
  state.factions[0]!.treasury = 0; state.factions[0]!.knowledge = 0;
  refreshAuthoredSight(state);
  const checked = deserializeGame(serializeGame(state));
  if (war) issue(checked, { type: 'declareWar', factionId: checked.turnOwnerId, targetFactionId: checked.factions[1]!.id });
  return checked;
}

function field(sizes = Array.from({ length: 21 }, () => 1), war = true): GameState {
  const state = borderBattleCampaign(), enemy = state.armies['army.4']!;
  stack(state, enemy, 'unit.scout', sizes);
  return ready(state, war);
}

function naval(sizes = Array.from({ length: 21 }, () => 1)): GameState {
  const state = navalCampaign(), enemy = state.armies[NAVAL_FIXTURE.enemyFleetId]!;
  for (const army of Object.values(state.armies)) if (army.factionId === state.turnOwnerId && army.id !== NAVAL_FIXTURE.coastalId) delete state.armies[army.id];
  state.characters = {};
  enemy.cell = 830;
  stack(state, enemy, 'unit.coastal_warship', sizes);
  return ready(state);
}

function siege(): GameState {
  const state = conquestCampaign(), town = state.settlements[CONQUEST_FIXTURE.settlementId]!, army = state.armies['army.2']!;
  const enemy: Army = { id: 'army.4', factionId: town.factionId, name: 'Authored garrison', cell: town.cell, movement: 3, formations: [] };
  stack(state, enemy, 'unit.scout', Array.from({ length: 21 }, () => 1));
  army.formations = Array.from({ length: 12 }, (_, index) => createArmyFormation(index ? `army.${state.nextId++}` : army.id, 'unit.guard')).sort((a, b) => a.id < b.id ? -1 : 1);
  return ready(state);
}

describe('AI defending-contingent consumers', () => {
  it('executes a query-approved field attack against 21 formations using an unchanged detached observation', () => {
    const state = field(), initial = serializeGame(state), view = getObservation(state, state.turnOwnerId), detached = structuredClone(view);
    const target = state.armies['army.4']!.cell;
    expect(getMovementQuery(view, 'army.2', target).preview).toMatchObject({ action: 'attack', canMoveNow: true });
    const commands = planTurn(view);
    expect(commands).toContainEqual(expect.objectContaining({ type: 'attack', armyId: 'army.2' }));
    expect(planTurn(structuredClone(view))).toEqual(commands);
    expect(view).toEqual(detached); expect(serializeGame(state)).toBe(initial);
    for (const command of commands) {
      issue(state, command);
      expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    }
    expect(state.battle?.combat.defender).toHaveLength(20);
    expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
  });

  it('executes a query-approved naval attack against 21 hulls through the whole turn planner', () => {
    const state = naval(), initial = serializeGame(state), view = getObservation(state, state.turnOwnerId), detached = structuredClone(view);
    expect(getMovementQuery(view, NAVAL_FIXTURE.coastalId, 830).preview).toMatchObject({ action: 'attack', canMoveNow: true });
    expect(planNaval(view, 0).interrupts).toBe(true);
    const commands = planTurn(view);
    expect(commands).toContainEqual(expect.objectContaining({ type: 'attack', armyId: NAVAL_FIXTURE.coastalId }));
    expect(view).toEqual(detached); expect(serializeGame(state)).toBe(initial);
    for (const command of commands) {
      issue(state, command);
      expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    }
    expect(state.battle).toMatchObject({ domain: 'naval' });
    expect(state.battle?.combat.defender).toHaveLength(20);
    expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
  });

  it('declares war on a contestable oversized stack before asking a fresh observation to authorize attack', () => {
    const state = field(undefined, false), view = getObservation(state, state.turnOwnerId), target = state.armies['army.4']!.cell;
    expect(getMovementQuery(view, 'army.2', target).preview?.canMoveNow).toBe(false);
    const first = planTurn(view);
    expect(first).toContainEqual(expect.objectContaining({ type: 'declareWar' }));
    expect(first.some(command => command.type === 'attack')).toBe(false);
    for (const command of first) issue(state, command);
    const next = getObservation(state, state.turnOwnerId);
    expect(getMovementQuery(next, 'army.2', target).preview?.canMoveNow).toBe(true);
    const second = planTurn(next);
    expect(second).toContainEqual(expect.objectContaining({ type: 'attack' }));
    for (const command of second) issue(state, command);
    expect(state.battle?.combat.defender).toHaveLength(20);
  });

  it('uses the real one-movement road quote rather than re-pricing a contingent attack as forest travel', () => {
    let state = field();
    const origin = state.armies['army.2']!.cell, target = state.armies['army.4']!.cell;
    state.armies['army.2']!.movement = 1;
    state.world.terrain[target] = 2;
    // Authored completed road, with actual memory refreshed below. No cost waiver.
    for (const [from, to] of [[origin, target], [target, origin]] as const) state.roads.edges[from] = 1 << roadDirection(from, to, state.world.width);
    refreshAuthoredSight(state); state = deserializeGame(serializeGame(state));
    const view = getObservation(state, state.turnOwnerId);
    expect(getMovementQuery(view, 'army.2', target).preview).toMatchObject({ canMoveNow: true, action: 'attack', cost: 1 });
    const commands = planTurn(view);
    expect(commands).toContainEqual(expect.objectContaining({ type: 'attack', armyId: 'army.2' }));
    for (const command of commands) issue(state, command);
    expect(state.battle?.combat.defender).toHaveLength(20);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('naval target selection skips a query-blocked old oversized stack rather than abandoning another legal target', () => {
    let state = naval();
    const enemy = state.armies['army.4']!, id = `army.${state.nextId++}`;
    state.armies[id] = { ...enemy, id, cell: 877, formations: [{ ...createArmyFormation(id, 'unit.coastal_warship'), strength: 1, morale: 1 }] };
    refreshAuthoredSight(state); state = deserializeGame(serializeGame(state));
    const view = withRules(state, 16, () => getObservation(state, state.turnOwnerId));
    expect(getMovementQuery(view, NAVAL_FIXTURE.coastalId, 830).preview?.canMoveNow).toBe(false);
    expect(getMovementQuery(view, NAVAL_FIXTURE.coastalId, 877).preview?.canMoveNow).toBe(true);
    const plan = planNaval(view, 0);
    expect(plan.commands).toContainEqual({ type: 'attack', factionId: view.factionId, armyId: NAVAL_FIXTURE.coastalId, targetArmyId: id });
    withRules(state, 16, () => { for (const command of plan.commands) issue(state, command); });
    expect(state.battle?.defenderIds).toEqual([id]);
  });

  const theaters = [
    { name: 'field', create: field, armyId: 'army.2' },
    { name: 'naval', create: naval, armyId: NAVAL_FIXTURE.coastalId },
  ];

  it.each(theaters)('$name plans accept mixed whole-container contingents and leave reserves intact', ({ create, armyId }) => {
    const state = create([12, 9, 8]), initial = serializeGame(state), view = getObservation(state, state.turnOwnerId);
    const commands = planTurn(view), attack = commands.find(command => command.type === 'attack');
    expect(attack).toMatchObject({ armyId });
    if (attack?.type !== 'attack') throw new Error('Expected a real contingent attack.');
    const expected = view.armies.find(army => army.id === attack.targetArmyId)!.battleDefense!;
    expect(expected.reserveFormations).toBeGreaterThan(0);
    for (const command of commands) issue(state, command);
    expect(state.battle?.combat.defender).toHaveLength(expected.engagedFormations);
    const reserveIds = view.armies.filter(army => army.cell === state.battle!.defenderCell && !state.battle!.defenderIds.includes(army.id)).map(army => army.id);
    const originals = reserveIds.map(id => structuredClone(state.armies[id]));
    expect(originals.flatMap(army => army!.formations)).toHaveLength(expected.reserveFormations);
    const resolve: GameCommand = { type: 'autoResolveBattle', factionId: state.turnOwnerId };
    issue(state, resolve);
    expect(reserveIds.map(id => state.armies[id])).toEqual(originals);
    expect(state.armies[armyId]?.cell).toBe(view.armies.find(army => army.id === armyId)!.cell);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    expect(stateHash(replayGame(initial, [...commands, resolve]))).toBe(stateHash(state));
  });

  it.each(theaters)('$name cannot discount a strong strategic reserve to make an attack affordable', ({ create, armyId }) => {
    let state = create();
    const enemy = Object.values(state.armies).filter(army => army.factionId !== state.turnOwnerId).sort((a, b) => a.id < b.id ? -1 : 1).at(-1)!;
    enemy.formations[0]!.strength = 20;
    state.armies[armyId]!.formations[0]!.strength = 30;
    state = deserializeGame(serializeGame(state));
    const view = getObservation(state, state.turnOwnerId), target = view.armies.find(army => army.factionId !== state.turnOwnerId)!;
    expect(target.battleDefense).toMatchObject({ engagedStrength: 20, reserveStrength: 20 });
    expect(getMovementQuery(view, armyId, target.cell).preview?.canMoveNow).toBe(true);
    expect(planTurn(view).some(command => command.type === 'attack')).toBe(false);
  });

  it.each(theaters)('$name keeps old no-preview observations and rule-16 guards conservative', ({ create, armyId }) => {
    const state = create(), before = stateHash(state);
    for (const view of [getObservation(state, state.turnOwnerId), withRules(state, 16, () => getObservation(state, state.turnOwnerId))]) {
      for (const army of view.armies) delete army.battleDefense;
      const enemy = view.armies.find(army => army.factionId !== state.turnOwnerId)!;
      expect(getMovementQuery(view, armyId, enemy.cell).preview?.canMoveNow).toBe(false);
      expect(planTurn(view).some(command => command.type === 'attack')).toBe(false);
    }
    expect(stateHash(state)).toBe(before);
  });

  it.each(theaters)('$name decisions cannot read hidden reinforcements or foreign treasury', ({ create, armyId }) => {
    const state = create(), factionId = state.turnOwnerId, view = getObservation(state, factionId), commands = planTurn(view);
    const visible = new Set(view.cells.filter(cell => cell.visible).map(cell => cell.cell));
    const enemy = state.armies['army.4']!, naval = armyId === NAVAL_FIXTURE.coastalId;
    const hidden = state.world.terrain.findIndex((terrain, cell) => !visible.has(cell)
      && (naval ? terrain === 0 && state.world.waterDepth[cell] === 1 : terrain > 0 && terrain < 4)
      && !Object.values(state.settlements).some(town => town.cell === cell));
    expect(hidden).toBeGreaterThanOrEqual(0);
    const id = `army.${state.nextId++}`;
    state.armies[id] = { ...enemy, id, cell: hidden, movement: 1, formations: [createArmyFormation(id, enemy.formations[0]!.unitId)] };
    state.factions[1]!.treasury = 123456;
    refreshAuthoredSight(state);
    const checked = deserializeGame(serializeGame(state)), changed = getObservation(checked, factionId);
    expect(changed.armies.some(army => army.id === id)).toBe(false);
    expect(planTurn(changed)).toEqual(commands);
    expect(getMovementQuery(changed, armyId, enemy.cell)).toEqual(getMovementQuery(view, armyId, enemy.cell));
  });

  it.each(theaters)('$name honors a movement-query blocker even with a valid contingent preview', ({ create, armyId }) => {
    const state = create(), view = getObservation(state, state.turnOwnerId), own = view.armies.find(army => army.id === armyId)!;
    // Detached movement capabilities are supplied by simulation, not inferred from frontage.
    own.movementBlocker = 'Cancel the active character mission before moving this army.';
    const enemy = view.armies.find(army => army.factionId !== state.turnOwnerId)!;
    expect(enemy.battleDefense).toBeDefined();
    expect(getMovementQuery(view, armyId, enemy.cell).preview?.canMoveNow).toBe(false);
    expect(planTurn(view).some(command => command.type === 'attack')).toBe(false);
  });

  it('uses the canonical siege assault quote for 21 garrison formations without capturing through reserves', () => {
    const state = siege(), initial = serializeGame(state), factionId = state.turnOwnerId, commands: GameCommand[] = [];
    const run = (command: GameCommand) => { issue(state, command); commands.push(command); expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state)); };
    const first = planTurn(getObservation(state, factionId));
    expect(first).toContainEqual({ type: 'besiege', factionId, armyId: 'army.2', settlementId: CONQUEST_FIXTURE.settlementId });
    for (const command of first) run(command);
    // One actual refresh makes assault movement available; no defense outcome is injected.
    run({ type: 'endTurn', factionId });
    const view = getObservation(state, factionId), quote = view.sieges[0]!;
    expect(quote).toMatchObject({ canAssault: true, battleDefense: { engagedFormations: 20, reserveFormations: 1 } });
    const historical = withRules(state, 16, () => getObservation(state, factionId));
    expect(historical.sieges[0]).toMatchObject({ canAssault: false });
    expect(planTurn(historical).some(command => command.type === 'assault')).toBe(false);
    const attack = planTurn(view);
    expect(attack).toEqual([{ type: 'assault', factionId, settlementId: quote.settlementId }]);
    for (const command of attack) run(command);
    expect(state.battle?.combat.defender).toHaveLength(20);
    const reserve = Object.values(state.armies).find(army => army.cell === state.battle!.defenderCell && !state.battle!.defenderIds.includes(army.id))!;
    const reserveBefore = structuredClone(reserve);
    run({ type: 'autoResolveBattle', factionId });
    expect(state.armies[reserve.id]).toEqual(reserveBefore);
    expect(state.pendingCapture).toBeNull();
    expect(state.settlements[quote.settlementId]!.factionId).not.toBe(factionId);
    expect(stateHash(replayGame(initial, commands))).toBe(stateHash(state));
  });

  it('siege policy budgets against the complete observed garrison rather than the engaged preview', () => {
    const state = siege(), factionId = state.turnOwnerId;
    issue(state, { type: 'besiege', factionId, armyId: 'army.2', settlementId: CONQUEST_FIXTURE.settlementId });
    issue(state, { type: 'endTurn', factionId });
    const view = getObservation(state, factionId), quote = view.sieges[0]!, army = view.armies.find(army => army.id === 'army.2')!;
    expect(quote.canAssault).toBe(true); expect(quote.defenses).toBeGreaterThan(0);
    // A detached consumer contrast: both observations include the same permitted
    // contingent. Only the full threat changes; no fake command is ever applied.
    army.strength = quote.battleDefense!.engagedStrength * 3;
    expect(army.strength).toBeLessThan(quote.defenderStrength * 3);
    expect(planTurn(view).some(command => command.type === 'assault')).toBe(false);
    quote.defenderStrength = quote.battleDefense!.engagedStrength;
    expect(planTurn(view)).toContainEqual({ type: 'assault', factionId, settlementId: quote.settlementId });
  });
});
