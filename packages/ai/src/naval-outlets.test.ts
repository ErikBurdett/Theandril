import { expect, test } from 'vitest';
import { deriveWaterDepth, hexDistance, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { navalCampaign } from '../../test-fixtures/src/naval-fixture';
import { coastalFoundingSite, needsNavalInvestment, oceanScoutReserve, planNaval } from './naval';
import { planTurn } from './index';

function issue(state: GameState, command: GameCommand): void {
  const result = applyCommand(state, command);
  expect(result.ok, `${JSON.stringify(command)}: ${result.error}`).toBe(true);
}

test('a paid second harbor remains the outlet commitment when a third coastal town becomes available', () => {
  let state = createGame({ seed: 748291, size: 'standard', factionCount: 4 });
  const factionId = state.turnOwnerId;
  state.factions[0]!.treasury = 10000; state.factions[0]!.knowledge = 500;
  issue(state, { type: 'research', factionId, technologyId: 'technology.coastal_navigation' });
  // Generated geography, explicit founder placement and first completed harbor.
  // All three towns and the second harbor use paid ordinary commands.
  const townIds: string[] = [];
  for (const cell of [24354, 28202, 32050]) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId, cell, name: `Outlet expedition ${cell}`, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
    refreshAuthoredSight(state);
    issue(state, { type: 'found', factionId, armyId: id, name: `Outlet ${cell}` });
    const town = Object.values(state.settlements).find(town => town.cell === cell)!;
    townIds.push(town.id);
    if (townIds.length === 1) town.buildings.push('building.harbor');
    if (townIds.length === 2) {
      const before = state.factions[0]!.treasury;
      issue(state, { type: 'queue', factionId, settlementId: town.id, itemId: 'building.harbor' });
      expect(state.factions[0]!.treasury).toBe(before - 20);
    }
  }
  state = deserializeGame(serializeGame(state));
  const view = getObservation(state, factionId), original = structuredClone(view), mirror = deserializeGame(serializeGame(state));
  expect(view.factions).toHaveLength(1);
  expect(view.productionOptions.find(option => option.settlementId === townIds[2] && option.itemId === 'building.harbor')?.canQueue).toBe(true);
  const plan = planNaval(view, 1000);
  expect(plan.commands.some(command => command.type === 'queue' && command.itemId === 'building.harbor')).toBe(false);
  expect(needsNavalInvestment(view)).toBe(false);
  expect(planNaval(getObservation(mirror, factionId), 1000).commands).toEqual(plan.commands);
  for (const command of plan.commands) { issue(state, command); issue(mirror, command); }
  const committed = Object.values(state.settlements).filter(town => town.factionId === factionId && (town.buildings.includes('building.harbor') || town.queue.some(order => order.itemId === 'building.harbor')));
  expect(committed.map(town => town.id).sort()).toEqual(townIds.slice(0, 2).sort());
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(mirror));
  expect(view).toEqual(original);
});

function founderView(founderCount: number, radius: number, factionCount: number): Observation {
  const state = navalCampaign({ enemyFleet: false }), base = getObservation(state, state.turnOwnerId);
  const width = 384, height = 256, origin = 100 * width + 128;
  const founder = base.armies.find(army => army.canFound)!, town = base.settlements.find(town => town.factionId === base.factionId)!;
  return { ...base, width, height, factionCount, factions: base.factions.filter(faction => faction.id === base.factionId), treasury: 0, knowledge: 0,
    settlements: [{ ...town, cell: origin }], productionOptions: [], routes: [], characters: [],
    armies: Array.from({ length: founderCount }, (_, index) => ({ ...founder, id: `army.outlet.${index}`, cell: origin, movement: 0 })),
    cells: Array.from({ length: width * height }, (_, cell) => cell).filter(cell => hexDistance(origin, cell, width) <= radius)
      .map(cell => ({ cell, visible: true, fertility: 50, biome: 1, terrain: cell > origin ? TERRAIN.water : TERRAIN.plains,
        waterDepth: cell > origin ? WATER_DEPTH.deep : WATER_DEPTH.land })) };
}

test.each([4, 24])('naval geography work stays bounded as waiting founder count grows (%i faction seats)', factionCount => {
  for (const radius of [4, 8]) {
    const counts = [1, 8, 32, 128].map(founders => {
      const view = founderView(founders, radius, factionCount), original = structuredClone(view);
      let observedCellReads = 0;
      view.cells = new Proxy(view.cells, { get(target, key, receiver) {
        if (typeof key === 'string' && /^\d+$/.test(key)) observedCellReads++;
        return Reflect.get(target, key, receiver);
      } });
      const plan = planNaval(view, 0);
      expect(plan.commands).toEqual([]);
      const reads = observedCellReads;
      expect(view).toEqual(original);
      return { founders, cells: view.cells.length, reads };
    });
    console.info(JSON.stringify({ probe: 'aggregate-observed-cell-reads', factionCount, radius, counts }));
    for (const count of counts.slice(1)) expect(count.reads).toBeLessThanOrEqual(counts[0]!.reads + count.cells);
  }
});

/** Authored Standard chart with a known enclosed home berth, a separate partly
 * charted deep basin and a land corridor. Not a generated-world contact gate. */
function sparseOutletCampaign() {
  let state = createGame({ seed: 748291, size: 'standard', factionCount: 4, generatorVersion: 4, pace: 'short' });
  const factionId = state.turnOwnerId, width = state.world.width, origin = 100 * width + 128, destination = origin + 29;
  state.resources.deposits = {};
  state.world.terrain.fill(TERRAIN.plains); state.world.biome.fill(1); state.world.fertility.fill(65); state.world.hydrology.fill(0);
  state.world.terrain[origin + width] = TERRAIN.water;
  for (let y = 97; y <= 105; y++) for (let x = 158; x <= 167; x++) state.world.terrain[y * width + x] = TERRAIN.water;
  for (let cell = 0; cell < state.world.terrain.length; cell++) if (state.world.terrain[cell] === TERRAIN.water) {
    state.world.biome[cell] = 0; state.world.fertility[cell] = 0;
  }
  state.world.waterDepth = deriveWaterDepth(width, state.world.height, state.world.terrain);
  for (const army of Object.values(state.armies)) if (army.factionId === factionId) army.cell = origin;
  state.world.starts[0] = origin;
  state.explored[factionId] = new Set(Array.from({ length: width * state.world.height }, (_, cell) => cell)
    .filter(cell => hexDistance(origin, cell, width) <= 33));
  state.factions[0]!.treasury = 10000; state.factions[0]!.knowledge = 500;
  refreshAuthoredSight(state);
  issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Inner Quay' });
  issue(state, { type: 'research', factionId, technologyId: 'technology.coastal_navigation' });
  issue(state, { type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  const home = Object.values(state.settlements)[0]!;
  home.buildings.push('building.harbor');
  const founderId = `army.${state.nextId++}`;
  state.armies[founderId] = { id: founderId, factionId, cell: origin, name: 'Second outlet caravan', movement: 3, formations: [createArmyFormation(founderId, 'unit.colonist')] };
  const fleetId = `army.${state.nextId++}`;
  state.armies[fleetId] = { id: fleetId, factionId, cell: origin + width, name: 'Home basin scout', movement: 4, formations: [createArmyFormation(fleetId, 'unit.ocean_warship')] };
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  return { state, factionId, founderId, fleetId, origin, destination };
}

test('second-outlet ocean scout keeps its own paid reserve, releases it while queued and when its quote is blocked', () => {
  const fixture = sparseOutletCampaign(), { state, factionId, founderId, destination } = fixture;
  state.armies[founderId]!.cell = destination;
  refreshAuthoredSight(state);
  issue(state, { type: 'found', factionId, armyId: founderId, name: 'Outer Quay' });
  const outlet = Object.values(state.settlements).find(town => town.cell === destination)!;
  outlet.buildings.push('building.harbor');
  refreshAuthoredSight(state);
  const checked = deserializeGame(serializeGame(state));
  const before = getObservation(checked, factionId), mirror = deserializeGame(serializeGame(checked));
  expect(before.factions).toHaveLength(1);
  expect(before.armies.some(army => army.unitId === 'unit.ocean_warship')).toBe(true);
  expect(oceanScoutReserve(before)).toBe(48);
  const command = planNaval(before, 48).commands.find(command => command.type === 'queue');
  expect(command).toEqual({ type: 'queue', factionId, settlementId: outlet.id, itemId: 'unit.ocean_warship' });
  const purse = checked.factions[0]!.treasury;
  issue(checked, command!); issue(mirror, command!);
  expect(checked.factions[0]!.treasury).toBe(purse - 48);
  expect(oceanScoutReserve(getObservation(checked, factionId))).toBe(0);
  expect(stateHash(deserializeGame(serializeGame(checked)))).toBe(stateHash(mirror));
  // A separate saved branch blocks the real local quote with five paid orders.
  // The home basin's operating scout must not reserve another one.
  const blocked = deserializeGame(serializeGame(state));
  for (let order = 0; order < 5; order++) issue(blocked, { type: 'queue', factionId, settlementId: outlet.id, itemId: 'unit.colonist' });
  const blockedView = getObservation(blocked, factionId);
  expect(blockedView.productionOptions.find(option => option.settlementId === outlet.id && option.itemId === 'unit.ocean_warship')).toMatchObject({ canQueue: false, blocker: 'The production queue is full (five items).' });
  expect(oceanScoutReserve(blockedView)).toBe(0);
});

test('an outlet caravan keeps its saved land route through a nearby ferry and reaches paid founding', () => {
  const { state, factionId, founderId, fleetId, origin } = sparseOutletCampaign();
  // A real nearby transport makes accidental cargo reassignment observable.
  state.armies[fleetId]!.formations = [createArmyFormation(fleetId, 'unit.transport')];
  refreshAuthoredSight(state);
  const initial = getObservation(state, factionId), founder = initial.armies.find(army => army.id === founderId)!;
  const target = coastalFoundingSite(initial, founder);
  expect(target).not.toBeNull(); expect(target).not.toBe(origin);
  issue(state, { type: 'queueMovement', factionId, armyId: founderId, target: target! });
  let mirror = deserializeGame(serializeGame(state));
  expect(mirror.routes[founderId]?.waypoints.at(-1)).toBe(target);
  let arrived = false;
  for (let turn = 0; turn < 20 && !arrived; turn++) {
    const view = getObservation(state, factionId), route = state.routes[founderId];
    const planned = planTurn(view);
    if (route?.status === 'active') {
      expect(planned.some(command => 'armyId' in command && command.armyId === founderId)).toBe(false);
      expect(coastalFoundingSite(view, view.armies.find(army => army.id === founderId)!)).toBe(target);
    }
    expect(planNaval(view, 0).commands.some(command => command.type === 'embarkArmy' && command.armyId === founderId)).toBe(false);
    // Other economic proposals are intentionally not part of this route test.
    issue(state, { type: 'endTurn', factionId }); issue(mirror, { type: 'endTurn', factionId });
    expect(stateHash(state)).toBe(stateHash(mirror));
    arrived = state.armies[founderId]?.cell === target;
    if (turn === 3) mirror = deserializeGame(serializeGame(mirror));
  }
  expect(arrived).toBe(true);
  const founding = planTurn(getObservation(state, factionId)).find(command => command.type === 'found' && command.armyId === founderId);
  expect(founding).toBeDefined();
  const purse = state.factions[0]!.treasury;
  issue(state, founding!); issue(mirror, founding!);
  expect(state.factions[0]!.treasury).toBeLessThan(purse);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(mirror));
});
