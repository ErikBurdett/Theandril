import { expect, test } from 'vitest';
import { deriveWaterDepth, hexDistance, LAKE_BIT, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { hasNavalOpportunity, planNaval } from './naval';
import { planDepot } from './supply';

function issue(state: GameState, command: GameCommand): void {
  const result = applyCommand(state, command);
  expect(result.ok, `Turn ${state.turn}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
}
function round(state: GameState): void { issue(state, { type: 'endTurn', factionId: state.turnOwnerId }); }
function stores(state: GameState) {
  return getObservation(state, state.turnOwnerId).supply.find(item => item.armyId === NAVAL_FIXTURE.fleetId)!.fleetProvisions!;
}
function supplyCampaign(): GameState {
  const state = navalCampaign({ enemyFleet: false });
  delete state.armies[NAVAL_FIXTURE.coastalId];
  delete state.armies[NAVAL_FIXTURE.cargoId];
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.ocean_navigation' });
  const fleet = state.armies[NAVAL_FIXTURE.fleetId]!;
  fleet.cell = 28 * state.world.width + 15;
  fleet.formations = [createArmyFormation(fleet.id, 'unit.ocean_warship')];
  refreshAuthoredSight(state);
  return deserializeGame(serializeGame(state));
}

test('a depleted fleet returns by legal observed steps, refills at harbor supply, and resumes sailing with a saved mirror', () => {
  const state = supplyCampaign(), fleetId = NAVAL_FIXTURE.fleetId;
  // Retain the known return corridor and a real unexplored eastern frontier,
  // so replenishment has a reconnaissance job to resume after reaching home.
  state.explored[state.turnOwnerId] = new Set([...state.explored[state.turnOwnerId]!].filter(cell => cell % state.world.width < 19));
  refreshAuthoredSight(state);
  for (let turn = 0; turn < 5; turn++) round(state);
  expect(stores(state)).toMatchObject({ remaining: 3, capacity: 8, refilling: false });
  const mirror = deserializeGame(serializeGame(state));
  let returning = false, refilled = false, resumed = false;
  const initialStrength = state.armies[fleetId]!.formations[0]!.strength;
  for (let turn = 0; turn < 10 && !resumed; turn++) {
    const view = getObservation(state, state.turnOwnerId), detached = structuredClone(view);
    const plan = planNaval(view, 0);
    expect(planNaval(structuredClone(view), 0)).toEqual(plan);
    expect(view).toEqual(detached);
    returning ||= plan.reasons.some(reason => reason.includes('return through charted water to harbor supply'));
    resumed ||= refilled && plan.commands.some(command => command.type === 'moveTo' && command.armyId === fleetId);
    for (const command of plan.commands) { issue(state, command); issue(mirror, command); }
    round(state); round(mirror);
    refilled ||= returning && stores(state).remaining === stores(state).capacity;
    expect(state.armies[fleetId]!.formations[0]!.strength).toBe(initialStrength);
    expect(stateHash(state)).toBe(stateHash(mirror));
  }
  expect({ returning, refilled, resumed }).toEqual({ returning: true, refilled: true, resumed: true });
});

test('a fleet holds within harbor reach until its stores refill, reserving its waiting passengers', () => {
  const state = navalCampaign({ enemyFleet: false });
  const view = getObservation(state, state.turnOwnerId);
  const supply = view.supply.find(item => item.armyId === NAVAL_FIXTURE.fleetId)!;
  // Isolate the intra-turn observation immediately after returning to the berth.
  supply.fleetProvisions = { remaining: 1, capacity: 8, refilling: true };
  const plan = planNaval(view, 0);
  expect(plan.commands.some(command => command.type === 'embarkArmy' && command.fleetId === NAVAL_FIXTURE.fleetId)).toBe(false);
  expect(plan.commands.some(command => command.type === 'moveTo' && command.armyId === NAVAL_FIXTURE.fleetId)).toBe(false);
  expect(plan.heldArmyIds.has(NAVAL_FIXTURE.cargoId)).toBe(true);
  expect(plan.reasons.some(reason => reason.includes('refill 1/8 provision turns'))).toBe(true);
});

test('an immediate safe expedition landing precedes an empty carrier returning for stores', () => {
  const state = navalCampaign({ enemyFleet: false });
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.ocean_navigation' });
  issue(state, { type: 'embarkArmy', factionId: state.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
  // Explicit authored arrival; live boarding, six provision turns, disembarkation
  // quotes and the final landing remain ordinary canonical rules.
  const arrival = 24 * state.world.width + 20;
  state.armies[NAVAL_FIXTURE.fleetId]!.cell = arrival;
  state.armies[NAVAL_FIXTURE.cargoId]!.cell = arrival;
  refreshAuthoredSight(state);
  for (let turn = 0; turn < 6; turn++) round(state);
  const plan = planNaval(getObservation(state, state.turnOwnerId), 0);
  const landing = plan.commands.find(command => command.type === 'disembarkArmy' && command.armyId === NAVAL_FIXTURE.cargoId);
  expect(landing).toBeDefined();
  expect(stores(state).remaining).toBe(2);
  for (const command of plan.commands) issue(state, command);
  expect(state.transports[NAVAL_FIXTURE.cargoId]).toBeUndefined();
  expect(hexDistance(state.armies[NAVAL_FIXTURE.cargoId]!.cell, NAVAL_FIXTURE.homeCell, state.world.width)).toBeGreaterThanOrEqual(4);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('a depleted expedition funds a real harbor at its new coastal foothold before optional hulls', () => {
  const state = supplyCampaign(), factionId = state.turnOwnerId, width = state.world.width;
  const founderId = `army.${state.nextId++}`, colonyCell = 24 * width + 21;
  state.armies[founderId] = { id: founderId, factionId, name: 'Staging colony', cell: colonyCell, movement: 3,
    formations: [createArmyFormation(founderId, 'unit.colonist')] };
  state.armies[NAVAL_FIXTURE.fleetId]!.cell = colonyCell - 1;
  refreshAuthoredSight(state);
  issue(state, { type: 'found', factionId, armyId: founderId, name: 'Outer staging quay' });
  round(state);
  const colony = Object.values(state.settlements).find(town => town.cell === colonyCell)!;
  const view = getObservation(state, factionId), purse = state.factions[0]!.treasury;
  expect(stores(state)).toMatchObject({ remaining: 7, refilling: false });
  const plan = planNaval(view, 20);
  expect(plan.commands).toContainEqual({ type: 'queue', factionId, settlementId: colony.id, itemId: 'building.harbor' });
  expect(plan.coinSpent).toBe(20);
  for (const command of plan.commands) issue(state, command);
  expect(state.factions[0]!.treasury).toBe(purse - 20);
  expect(colony.queue[0]?.itemId).toBe('building.harbor');
});

test('an exhausted fleet never proposes building a land depot at sea', () => {
  const state = supplyCampaign();
  const fleet = state.armies[NAVAL_FIXTURE.fleetId]!, departure = fleet.cell;
  fleet.cell = NAVAL_FIXTURE.enemyFleetCell;
  refreshAuthoredSight(state);
  issue(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: state.factions[1]!.id });
  fleet.cell = departure;
  refreshAuthoredSight(state);
  for (let turn = 0; turn < 9; turn++) round(state);
  const view = getObservation(state, state.turnOwnerId);
  expect(view.supply.find(item => item.armyId === NAVAL_FIXTURE.fleetId)?.supplied).toBe(false);
  expect(planDepot(view, new Set())).toBeNull();
});

test('freshwater classification still permits an existing hull to return through observed supplied water', () => {
  const state = supplyCampaign();
  for (let turn = 0; turn < 5; turn++) round(state);
  const view = getObservation(state, state.turnOwnerId);
  // A detached policy probe changes only the observed basin classification;
  // every route and command is checked against the same real water geometry.
  view.cells = view.cells.map(cell => cell.terrain === TERRAIN.water ? { ...cell, hydrology: LAKE_BIT | 1 } : cell);
  expect(hasNavalOpportunity(view)).toBe(false);
  const original = structuredClone(view), plan = planNaval(view, 0);
  expect(plan.reasons.some(reason => reason.includes('return through charted water to harbor supply'))).toBe(true);
  expect(plan.commands.some(command => command.type === 'moveTo' && command.armyId === NAVAL_FIXTURE.fleetId)).toBe(true);
  for (const command of plan.commands) issue(state, command);
  expect(view).toEqual(original);
});

test('historical observations without fleet provisions retain their existing naval choices', () => {
  const state = supplyCampaign();
  for (let turn = 0; turn < 5; turn++) round(state);
  const modern = getObservation(state, state.turnOwnerId), historical = structuredClone(modern);
  for (const item of historical.supply) delete item.fleetProvisions;
  expect(planNaval(modern, 0).reasons.some(reason => reason.includes('return through charted water to harbor supply'))).toBe(true);
  expect(planNaval(historical, 0).commands).toEqual([]); // Fully charted water has no remaining historical patrol objective.
});

test('a coastal galley skips nearer deep-water supply and returns along its reachable shallow shore', () => {
  const state = navalCampaign({ enemyFleet: false }), fleet = state.armies[NAVAL_FIXTURE.fleetId]!;
  delete state.armies[NAVAL_FIXTURE.coastalId]; delete state.armies[NAVAL_FIXTURE.cargoId];
  // Join the authored islands into a U-shaped bay. The nearest supply is deep;
  // the galley must take the longer, legal shallow shoreline around the head.
  for (let x = 13; x < 21; x++) {
    const cell = 8 * state.world.width + x;
    state.world.terrain[cell] = TERRAIN.plains; state.world.biome[cell] = 1; state.world.fertility[cell] = 65;
  }
  state.world.waterDepth = deriveWaterDepth(state.world.width, state.world.height, state.world.terrain);
  fleet.formations = [createArmyFormation(fleet.id, 'unit.coastal_warship')]; fleet.provisions = 1; fleet.cell = 691;
  refreshAuthoredSight(state);
  const checked = deserializeGame(serializeGame(state)), view = getObservation(checked, checked.turnOwnerId);
  const nearest = view.suppliedCells.filter(cell => checked.world.terrain[cell] === TERRAIN.water)
    .sort((a, b) => hexDistance(fleet.cell, a, view.width) - hexDistance(fleet.cell, b, view.width) || a - b).slice(0, 2);
  expect(nearest).toEqual([687, 735]);
  expect(nearest.every(cell => checked.world.waterDepth[cell] === WATER_DEPTH.deep)).toBe(true);
  expect(getMovementPreview(view, fleet.id, 638)).toMatchObject({ canQueue: true, action: 'move' });
  const plan = planNaval(view, 0);
  expect(plan.reasons.some(reason => reason.includes('return through charted water to harbor supply'))).toBe(true);
  expect(plan.commands.some(command => command.type === 'moveTo' && command.armyId === fleet.id)).toBe(true);
  for (const command of plan.commands) issue(checked, command);
  expect(checked.world.waterDepth[checked.armies[fleet.id]!.cell]).toBe(WATER_DEPTH.shallow);
});
