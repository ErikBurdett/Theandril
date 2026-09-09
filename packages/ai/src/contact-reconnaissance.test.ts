import { expect, test } from 'vitest';
import { hexDistance, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import { createGame, getMovementQuery, getObservation, type GameCommand, type Observation } from '@theandril/sim';
import { navalCampaign } from '../../test-fixtures/src/naval-fixture';
import { createNavigation } from './navigation';
import { coastalFoundingSite, planNaval } from './naval';
import { planTurn } from './index';

/** Detached observed geometry isolates role choices, not a funded game. The
 * unchanged generated contact tests exercise the actual paid campaign chain. */
function reconnaissanceView(naval: boolean, factionCount = 4): Observation {
  const state = naval ? navalCampaign({ enemyFleet: false }) : createGame({ seed: 74, size: 'tiny', factionCount: 1 });
  const base = getObservation(state, state.turnOwnerId), width = 384, height = 256, origin = 100 * width + 128;
  const army = base.armies.find(army => army.factionId === base.factionId && (naval ? army.domain === 'naval' && !army.transportCapacity : army.unitId === 'unit.scout'))!;
  return { ...base, width, height, factionCount, treasury: 0, knowledge: 0, settlements: [], productionOptions: [], routes: [], characters: [],
    armies: [{ ...army, cell: origin, movement: 6, canEnterDeepWater: naval }],
    cells: Array.from({ length: width * height }, (_, cell) => cell).filter(cell => hexDistance(origin, cell, width) <= 4)
      .map(cell => ({ cell, visible: true, fertility: 50, biome: 1,
        terrain: naval && cell !== origin - 4 ? TERRAIN.water : TERRAIN.plains,
        waterDepth: naval && cell !== origin - 4 ? WATER_DEPTH.deep : WATER_DEPTH.land })) };
}
function movement(commands: GameCommand[]) {
  return commands.find((command): command is Extract<GameCommand, { type: 'moveTo' }> => command.type === 'moveTo')!;
}

test.each([false, true])('sparse reconnaissance uses a public inward discovery bearing (naval: %s)', naval => {
  const view = reconnaissanceView(naval), original = structuredClone(view), army = view.armies[0]!;
  const commands = naval ? planNaval(view, 0).commands : planTurn(view);
  const move = movement(commands), center = Math.floor(view.height / 2) * view.width + Math.floor(view.width / 2);
  expect(move).toBeDefined();
  const navigation = createNavigation(view), reachable = getMovementQuery(view, army.id).reachable;
  const mostDiscovery = Math.max(...reachable.map(item => navigation.informationGain(item.cell, army.sight)));
  const inwardDiscovery = Math.min(...reachable.filter(item => navigation.informationGain(item.cell, army.sight) === mostDiscovery).map(item => hexDistance(item.cell, center, view.width)));
  expect(hexDistance(move.target, center, view.width)).toBe(inwardDiscovery);
  expect(navigation.informationGain(move.target, army.sight)).toBeGreaterThan(0);
  expect(getMovementQuery(view, army.id, move.target).preview).toMatchObject({ canMoveNow: true, action: 'move' });
  expect(naval ? planNaval(structuredClone(view), 0).commands : planTurn(structuredClone(view))).toEqual(commands);
  expect(view).toEqual(original);
});

test('an isolated caravan can plan a paid second maritime outlet without claiming uncertain seas are connected', () => {
  const state = navalCampaign({ enemyFleet: false }), view = getObservation(state, state.turnOwnerId);
  const width = 384, height = 256, origin = 100 * width + 128;
  const founder = view.armies.find(army => army.canFound)!;
  const home = view.settlements.find(town => town.factionId === view.factionId)!;
  const outside = origin + 30;
  Object.assign(view, { width, height, factionCount: 4, settlements: [{ ...home, cell: origin }],
    armies: [{ ...founder, cell: origin, movement: 3 }], productionOptions: [], routes: [],
    cells: Array.from({ length: width * height }, (_, cell) => cell)
      .filter(cell => hexDistance(origin, cell, width) <= 36 && cell !== origin + width * 2)
      .map(cell => ({ cell, fertility: 50, biome: 1, visible: true,
        terrain: cell === origin + width || cell === outside ? TERRAIN.water : TERRAIN.plains,
        waterDepth: cell === origin + width || cell === outside ? WATER_DEPTH.deep : WATER_DEPTH.land })) });
  const before = structuredClone(view), army = view.armies[0]!;
  const destination = coastalFoundingSite(view, army);
  expect(destination).not.toBeNull();
  expect(hexDistance(destination!, origin, width)).toBeGreaterThanOrEqual(12);
  expect(getMovementQuery(view, army.id, destination!).preview).toMatchObject({ action: 'move', canQueue: true, canMoveNow: false });
  expect(coastalFoundingSite(structuredClone(view), structuredClone(army))).toBe(destination);
  expect(view).toEqual(before);
});
