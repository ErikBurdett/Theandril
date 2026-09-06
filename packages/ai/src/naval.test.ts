import { expect, test } from 'vitest';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { UNITS } from '@theandril/content';
import { hexDistance, WATER_DEPTH } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { planTurn } from './index';
import { createNavigation } from './navigation';
import { hasNavalOpportunity, planNaval } from './naval';

function issue(state: GameState, command: GameCommand): ReturnType<typeof applyCommand> {
  const result = applyCommand(state, command);
  expect(result.ok, `Turn${state.turn}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
  return result;
}
function round(state: GameState): void { issue(state, { type: 'endTurn', factionId: state.turnOwnerId }); }

test('whole AI really loads, crosses deep ocean, lands and founds without reboarding or rejected commands; saved voyage matches', () => {
  const state = navalCampaign({ enemyFleet: false });
  let mirror: GameState | undefined, boarded = false, sailedDeep = false, landed = false, founded = false;
  const initialFormations = state.armies[NAVAL_FIXTURE.cargoId]!.formations.map(item => item.id);
  for (let turn = 0; turn < 16 && !founded; turn++) {
    const view = getObservation(state, state.turnOwnerId), detached = structuredClone(view);
    const plan = planTurn(view);
    expect(planTurn(structuredClone(view))).toEqual(plan);
    expect(view).toEqual(detached);
    expect(plan.length).toBeLessThanOrEqual(128);
    for (const command of plan) {
      const result = issue(state, command);
      if (mirror) expect(issue(mirror, command)).toEqual(result);
      if (command.type === 'embarkArmy') { expect(landed).toBe(false); boarded = true; }
      if (command.type === 'disembarkArmy') {
        landed = true;
        expect(hexDistance(command.target, NAVAL_FIXTURE.homeCell, state.world.width)).toBeGreaterThanOrEqual(4);
        expect(command.target % state.world.width).toBeGreaterThanOrEqual(21); // The other authored island, not a shore shortcut.
        expect(state.armies[command.armyId]!.formations.map(item => item.id)).toEqual(initialFormations);
      }
      if (command.type === 'found' && command.armyId === NAVAL_FIXTURE.cargoId) founded = true;
      if (state.transports[NAVAL_FIXTURE.cargoId] && state.world.waterDepth[state.armies[NAVAL_FIXTURE.fleetId]!.cell] === WATER_DEPTH.deep) sailedDeep = true;
    }
    const saved = deserializeGame(serializeGame(state));
    expect(stateHash(saved)).toBe(stateHash(state));
    if (mirror) expect(stateHash(mirror)).toBe(stateHash(state));
    if (boarded && !mirror) mirror = saved;
    if (!founded) { round(state); if (mirror) round(mirror); }
  }
  expect({ boarded, sailedDeep, landed, founded }).toEqual({ boarded: true, sailedDeep: true, landed: true, founded: true });
  expect(mirror && stateHash(mirror)).toBe(stateHash(state));
});

test('a maritime opening pays for navigation, one harbor and a real transport before embarking', () => {
  let state = navalCampaign({ enemyFleet: false });
  delete state.armies[NAVAL_FIXTURE.fleetId]; delete state.armies[NAVAL_FIXTURE.coastalId];
  state.settlements[NAVAL_FIXTURE.homeId]!.buildings = ['building.granary', 'building.workshop'];
  state.progression[state.turnOwnerId]!.technologies = [];
  state.factions[0]!.knowledge = 100;
  const colonist = `army.${state.nextId++}`;
  state.armies[colonist] = { id: colonist, factionId: state.turnOwnerId, name: 'West-bank settlers', cell: 485, movement: 3, formations: [createArmyFormation(colonist, 'unit.colonist')] };
  state = deserializeGame(serializeGame(state));
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: colonist, name: 'West-bank hearth' });
  const queued: string[] = [], researched: string[] = [];
  let boarded = false;
  for (let turn = 0; turn < 18 && !boarded; turn++) {
    const view = getObservation(state, state.turnOwnerId), plan = planNaval(view, 100);
    expect(plan.coinSpent).toBeLessThanOrEqual(100);
    for (const command of plan.commands) {
      if (command.type === 'queue') {
        expect(view.productionOptions.find(option => option.itemId === command.itemId && option.settlementId === command.settlementId)?.canQueue).toBe(true);
        queued.push(command.itemId);
      }
      if (command.type === 'research') researched.push(command.technologyId);
      issue(state, command); boarded ||= command.type === 'embarkArmy';
    }
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    if (!boarded) round(state);
  }
  expect(researched).toContain('technology.coastal_navigation');
  expect(queued.filter(id => id === 'building.harbor')).toHaveLength(1);
  expect(queued.filter(id => id === 'unit.transport')).toHaveLength(1);
  expect(boarded).toBe(true);
  expect(Object.values(state.armies).some(army => army.formations.some(item => item.unitId === 'unit.transport'))).toBe(true);
});

test('a twenty-formation expedition gathers three paid transport formations instead of overloading one hull', () => {
  let state = navalCampaign({ enemyFleet: false });
  state.armies[NAVAL_FIXTURE.fleetId]!.formations = state.armies[NAVAL_FIXTURE.fleetId]!.formations.slice(0, 1);
  const cargo = state.armies[NAVAL_FIXTURE.cargoId]!;
  while (cargo.formations.length < 20) cargo.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.guard'));
  cargo.formations.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  cargo.movement = 1; // Deliberately over-command, still a legal recoverable army, not a free twenty-company commander.
  state = deserializeGame(serializeGame(state));
  let paidTransports = 0, merged = 0, boarded = false;
  for (let turn = 0; turn < 18 && !boarded; turn++) {
    for (const command of planNaval(getObservation(state, state.turnOwnerId), 100).commands) {
      issue(state, command);
      if (command.type === 'queue' && command.itemId === 'unit.transport') paidTransports++;
      if (command.type === 'mergeArmies') merged++;
      boarded ||= command.type === 'embarkArmy' && command.armyId === cargo.id;
    }
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    if (!boarded) round(state);
  }
  expect(paidTransports).toBe(2); expect(merged).toBe(2); expect(boarded).toBe(true);
  const view = getObservation(state, state.turnOwnerId), fleet = view.armies.find(army => army.id === state.transports[cargo.id])!;
  expect(fleet.transportUsed).toBe(20); expect(fleet.transportCapacity).toBe(24);
  expect(state.armies[cargo.id]!.formations).toHaveLength(20);
});

test('paid advancement and ocean research share one observed knowledge budget', () => {
  const state = navalCampaign({ enemyFleet: false });
  state.factions[0]!.knowledge = 80;
  const view = getObservation(state, state.turnOwnerId), commands = planTurn(view);
  const research = commands.filter(command => command.type === 'research');
  expect(research.map(command => command.technologyId)).toEqual(['technology.cinder_masonry']);
  expect(research.reduce((sum, command) => sum + view.progression.technologyChoices.find(choice => choice.id === command.technologyId)!.knowledgeCost, 0)).toBeLessThanOrEqual(80);
  for (const command of commands) issue(state, command);
});

test('three co-located hull containers never reuse a consumed merge ID or scatter waiting passengers', () => {
  const state = navalCampaign({ enemyFleet: false }), fleet = state.armies[NAVAL_FIXTURE.fleetId]!;
  for (let index = 0; index < 2; index++) issue(state, { type: 'splitArmy', factionId: state.turnOwnerId, armyId: fleet.id, formationIds: [fleet.formations.at(-1)!.id] });
  const plan = planNaval(getObservation(state, state.turnOwnerId), 0);
  expect(plan.commands.filter(command => command.type === 'mergeArmies')).toHaveLength(1);
  expect(plan.heldArmyIds.has(NAVAL_FIXTURE.cargoId)).toBe(true);
  for (const command of plan.commands) issue(state, command);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('fleets fight visible weaker fleets through normal naval combat, never target land armies', () => {
  let state = navalCampaign();
  state.armies[NAVAL_FIXTURE.enemyFleetId]!.cell = 830;
  refreshAuthoredSight(state);
  state.armies[NAVAL_FIXTURE.enemyFleetId]!.formations[0]!.strength = 20;
  state = deserializeGame(serializeGame(state));
  issue(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: state.factions[1]!.id });
  const plan = planNaval(getObservation(state, state.turnOwnerId), 0);
  expect(plan.interrupts).toBe(true);
  expect(plan.commands.at(-1)).toEqual({ type: 'attack', factionId: state.turnOwnerId, armyId: NAVAL_FIXTURE.coastalId, targetArmyId: NAVAL_FIXTURE.enemyFleetId });
  for (const command of plan.commands) issue(state, command);
  expect(state.battle?.domain).toBe('naval');
  issue(state, { type: 'autoResolveBattle', factionId: state.turnOwnerId });
  expect(state.battleReports.at(-1)?.domain).toBe('naval');
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('hidden fleet changes cannot affect plans, input is detached, and inland starts buy no speculative navy', () => {
  const first = navalCampaign(), second = deserializeGame(serializeGame(first));
  second.armies[NAVAL_FIXTURE.enemyFleetId]!.formations[0]!.strength = 1;
  const view = getObservation(first, first.turnOwnerId), altered = getObservation(second, second.turnOwnerId);
  expect(view.armies.some(army => army.id === NAVAL_FIXTURE.enemyFleetId)).toBe(false);
  expect(altered).toEqual(view);
  expect(planNaval(altered, 100).commands).toEqual(planNaval(view, 100).commands);
  const start = createGame({ seed: 74, size: 'tiny', factionCount: 1 }), startingView = getObservation(start, start.turnOwnerId);
  expect(hasNavalOpportunity(startingView)).toBe(false);
  expect(planNaval(startingView, 1_000_000).commands).toEqual([]);
});

test('shared navigation respects sea hull restrictions and cannot give carried troops independent movement', () => {
  const state = navalCampaign({ enemyFleet: false });
  issue(state, { type: 'embarkArmy', factionId: state.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
  const view = getObservation(state, state.turnOwnerId), nav = createNavigation(view);
  const cargo = view.armies.find(army => army.id === NAVAL_FIXTURE.cargoId)!;
  expect(nav.destination(cargo, 2, new Set(), cell => cell)).toBeUndefined();
  const galley = view.armies.find(army => army.id === NAVAL_FIXTURE.coastalId)!;
  const target = nav.destination(galley, 4, new Set(), cell => -hexDistance(cell, NAVAL_FIXTURE.deepCell, view.width) * 100);
  expect(target).toBeDefined();
  expect(state.world.waterDepth[target!]).toBe(WATER_DEPTH.shallow);
  expect(state.world.terrain[target!]).toBe(0);
  const passengerIds = new Set(cargo.formations.map(formation => formation.id));
  expect(planTurn(view).some(command => 'armyId' in command && command.armyId === cargo.id && command.type !== 'disembarkArmy')).toBe(false);
  expect(cargo.formations.filter(formation => UNITS.find(unit => unit.id === formation.unitId)?.canFound).map(formation => passengerIds.has(formation.id))).toEqual([true]);
});
