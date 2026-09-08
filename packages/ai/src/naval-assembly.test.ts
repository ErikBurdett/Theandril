import { expect, test } from 'vitest';
import { UNITS } from '@theandril/content';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { needsNavalInvestment, planNaval } from './naval';

function issue(state: GameState, command: GameCommand): ReturnType<typeof applyCommand> {
  const result = applyCommand(state, command);
  expect(result.ok, `Turn ${state.turn}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
  return result;
}

/** Funded, charted fixture, not proof of an earned generated-world opening. Only the
 * remote hull placements and oversized initial cargo are authored. Caller-reserved
 * fleet IDs model the planner composition boundary, not invented canonical missions. */
function assemblyCampaign(): { state: GameState; remoteIds: string[] } {
  let state = navalCampaign({ enemyFleet: false });
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.ocean_navigation' });
  const remoteIds: string[] = [];
  const source = state.armies[NAVAL_FIXTURE.fleetId]!;
  for (const cell of [state.world.width - 1, state.world.width * state.world.height - 1]) {
    const id = `army.${state.nextId}`;
    issue(state, { type: 'splitArmy', factionId: state.turnOwnerId, armyId: source.id,
      formationIds: [source.formations.at(-1)!.id], name: 'Reserved remote ferry' });
    state.armies[id]!.cell = cell;
    remoteIds.push(id);
  }
  const cargo = state.armies[NAVAL_FIXTURE.cargoId]!;
  while (cargo.formations.length < 20) cargo.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.guard'));
  cargo.formations.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  cargo.movement = 1; // Legal over-command recovery state; no free commander or capacity bonus.
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  return { state, remoteIds };
}

test('remote reserved hulls do not replace two paid local hulls for a twenty-formation expedition', () => {
  const { state, remoteIds } = assemblyCampaign();
  const factionId = state.turnOwnerId, heldArmyIds = new Set(remoteIds);
  const remote = remoteIds.map(id => ({ id, cell: state.armies[id]!.cell, formations: state.armies[id]!.formations.map(formation => formation.id) }));
  const passengerIds = state.armies[NAVAL_FIXTURE.cargoId]!.formations.map(formation => formation.id);
  const localHullId = state.armies[NAVAL_FIXTURE.fleetId]!.formations[0]!.id;
  const transport = UNITS.find(unit => unit.id === 'unit.transport')!;
  const initialView = getObservation(state, factionId);
  expect(initialView.armies.filter(army => army.factionId === factionId).flatMap(army => army.formations)
    .filter(formation => formation.unitId === transport.id)).toHaveLength(3);
  expect(initialView.armies.find(army => army.id === NAVAL_FIXTURE.fleetId)!.transportCapacity).toBe(8);
  expect(needsNavalInvestment(initialView)).toBe(true);
  expect(planNaval(initialView, 100, { heldArmyIds }).commands).toContainEqual({
    type: 'queue', factionId, settlementId: NAVAL_FIXTURE.homeId, itemId: transport.id,
  });

  let mirror = deserializeGame(serializeGame(state));
  let paidHulls = 0, completedHulls = 0, mergedLocalHulls = 0, boarded = false, resumedAssembly = false;
  const preserve = (): void => {
    expect(state.armies[NAVAL_FIXTURE.cargoId]!.formations.map(formation => formation.id)).toEqual(passengerIds);
    for (const original of remote) {
      expect(state.armies[original.id]!.cell).toBe(original.cell);
      expect(state.armies[original.id]!.formations.map(formation => formation.id)).toEqual(original.formations);
    }
    expect(serializeGame(mirror)).toBe(serializeGame(state));
  };
  const execute = (command: GameCommand): void => {
    const beforeCoin = state.factions.find(faction => faction.id === factionId)!.treasury;
    const result = issue(state, command);
    expect(issue(mirror, command)).toEqual(result);
    if (command.type === 'queue' && command.itemId === transport.id) {
      paidHulls++;
      expect(command.settlementId).toBe(NAVAL_FIXTURE.homeId);
      expect(beforeCoin - state.factions.find(faction => faction.id === factionId)!.treasury).toBe(transport.coinCost);
    }
    completedHulls += result.events.filter(event => event.type === 'unit_recruited'
      && event.factionId === factionId && event.message === `${NAVAL_FIXTURE.homeName} completed ${transport.name}.`).length;
    if (command.type === 'mergeArmies') {
      expect(remoteIds).not.toContain(command.sourceArmyId);
      expect(remoteIds).not.toContain(command.targetArmyId);
      mergedLocalHulls++;
    }
    if (command.type === 'embarkArmy' && command.armyId === NAVAL_FIXTURE.cargoId) boarded = true;
    preserve();
  };

  for (let round = 0; round < 18 && !boarded; round++) {
    const view = getObservation(state, factionId), detached = structuredClone(view);
    const plan = planNaval(view, 100, { heldArmyIds });
    expect(planNaval(structuredClone(view), 100, { heldArmyIds })).toEqual(plan);
    expect(view).toEqual(detached);
    expect([...heldArmyIds]).toEqual(remoteIds);
    expect(plan.heldArmyIds.has(NAVAL_FIXTURE.cargoId)).toBe(true);
    expect(plan.coinSpent).toBeLessThanOrEqual(100);
    for (const command of plan.commands) execute(command);
    if (!boarded) execute({ type: 'endTurn', factionId });
    const saved = serializeGame(state);
    expect(stateHash(deserializeGame(saved))).toBe(stateHash(state));
    if (!resumedAssembly && !boarded && state.settlements[NAVAL_FIXTURE.homeId]!.queue.some(order => order.itemId === transport.id && order.progress > 0)) {
      mirror = deserializeGame(saved);
      resumedAssembly = true;
    }
  }

  expect({ paidHulls, completedHulls, mergedLocalHulls, boarded, resumedAssembly })
    .toEqual({ paidHulls: 2, completedHulls: 2, mergedLocalHulls: 2, boarded: true, resumedAssembly: true });
  const finalView = getObservation(state, factionId);
  const carrier = finalView.armies.find(army => army.id === state.transports[NAVAL_FIXTURE.cargoId])!;
  expect(carrier.transportUsed).toBe(20);
  expect(carrier.transportCapacity).toBe(24);
  expect(carrier.formations.map(formation => formation.id)).toContain(localHullId);
  expect(carrier.formations.filter(formation => formation.unitId === transport.id)).toHaveLength(3);
  expect(finalView.armies.filter(army => army.factionId === factionId).flatMap(army => army.formations)
    .filter(formation => formation.unitId === transport.id)).toHaveLength(5);
  expect(finalView.armies.filter(army => army.domain === 'naval').every(army => army.transportUsed <= army.transportCapacity)).toBe(true);
  preserve();
});
