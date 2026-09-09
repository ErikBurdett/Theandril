import { expect, test } from 'vitest';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { UNITS } from '@theandril/content';
import { hexDistance, neighbors, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { planTurn } from './index';
import { planCharacters } from './characters';
import { createNavigation } from './navigation';
import { coastalFoundingSite, hasNavalOpportunity, needsNavalInvestment, navalResearchChoice, planNaval } from './naval';
import { createSeaKnowledge } from './sea-knowledge';

function issue(state: GameState, command: GameCommand): ReturnType<typeof applyCommand> {
  const result = applyCommand(state, command);
  expect(result.ok, `Turn${state.turn}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
  return result;
}
function round(state: GameState): void { issue(state, { type: 'endTurn', factionId: state.turnOwnerId }); }

test('unrelated global ID allocation cannot redirect the same observed ocean scout, and two scouts reserve distinct destinations', () => {
  let state = navalCampaign({ enemyFleet: false });
  // Authored ocean-scout deployment isolates navigation from recruitment pacing.
  // Real fog, paid research, movement quotes and every sailing command remain authoritative.
  for (const army of Object.values(state.armies)) if (army.id !== NAVAL_FIXTURE.coastalId) delete state.armies[army.id];
  const fleet = state.armies[NAVAL_FIXTURE.coastalId]!;
  fleet.cell = NAVAL_FIXTURE.deepCell; fleet.movement = 5;
  fleet.formations = [createArmyFormation(fleet.id, 'unit.ocean_warship')];
  state.explored[state.turnOwnerId] = new Set();
  refreshAuthoredSight(state);
  // Research before validation grants the actual hull's legal deep-water capability.
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.ocean_navigation' });
  state = deserializeGame(serializeGame(state));
  const view = getObservation(state, state.turnOwnerId), before = serializeGame(state);
  const move = planNaval(view, 0).commands.find((command): command is Extract<GameCommand, { type: 'moveTo' }> => command.type === 'moveTo' && command.armyId === fleet.id);
  expect(move).toBeDefined();
  for (const serial of [100, 999, 10000]) {
    const renamed = deserializeGame(before), old = renamed.armies[fleet.id]!;
    delete renamed.armies[fleet.id]; old.id = `army.${serial}`; renamed.armies[old.id] = old; renamed.nextId = serial + 1;
    const checked = deserializeGame(serializeGame(renamed));
    const other = planNaval(getObservation(checked, checked.turnOwnerId), 0).commands.find(command => command.type === 'moveTo' && command.armyId === old.id);
    expect(other).toMatchObject({ target: move!.target });
    expect(applyCommand(checked, other!).ok).toBe(true);
  }
  expect(serializeGame(state)).toBe(before);
  const twinId = `army.${state.nextId++}`;
  state.armies[twinId] = { ...state.armies[fleet.id]!, id: twinId, cell: NAVAL_FIXTURE.deepCell + 1, formations: [createArmyFormation(twinId, 'unit.ocean_warship')] };
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const moves = planNaval(getObservation(state, state.turnOwnerId), 0).commands.filter((command): command is Extract<GameCommand, { type: 'moveTo' }> => command.type === 'moveTo');
  expect(moves).toHaveLength(2); expect(new Set(moves.map(command => command.target)).size).toBe(2);
  for (const command of moves) issue(state, command);
});

test.each([false, true])('optional appointments and generic reserves cannot consume the first ocean scout quote (missing founder: %s)', missingFounder => {
  let state = navalCampaign();
  const factionId = state.turnOwnerId;
  state.armies[NAVAL_FIXTURE.enemyFleetId]!.cell = NAVAL_FIXTURE.shallowCell;
  // Deliberately leave normal economic building and (optionally) caravan needs.
  // Their generic reserve must not underfund the same legally quoted ship.
  state.settlements[NAVAL_FIXTURE.homeId]!.buildings = ['building.harbor', 'building.workshop'];
  if (missingFounder) state.armies[NAVAL_FIXTURE.cargoId]!.formations = state.armies[NAVAL_FIXTURE.cargoId]!.formations.map(formation => formation.unitId === 'unit.colonist' ? { ...createArmyFormation(NAVAL_FIXTURE.cargoId, 'unit.guard'), id: formation.id } : formation);
  const guardId = `army.${state.nextId++}`;
  state.armies[guardId] = { id: guardId, factionId, name: 'Harbor watch', cell: NAVAL_FIXTURE.homeCell, movement: 3, formations: [createArmyFormation(guardId, 'unit.guard')] };
  issue(state, { type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  issue(state, { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' });
  issue(state, { type: 'assignCharacter', factionId, characterId: NAVAL_FIXTURE.marshalId, armyId: guardId });
  state.factions[0]!.treasury = 48; state.factions[0]!.knowledge = 0;
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const view = getObservation(state, factionId);
  expect(planCharacters(view, 48).commands.some(command => command.type === 'recruitCharacter')).toBe(true);
  const quote = view.productionOptions.find(option => option.itemId === 'unit.ocean_warship' && option.settlementId === NAVAL_FIXTURE.homeId);
  expect(quote?.canQueue).toBe(true);
  const plan = planTurn(view), mirror = deserializeGame(serializeGame(state));
  expect(plan).toContainEqual({ type: 'queue', factionId, settlementId: NAVAL_FIXTURE.homeId, itemId: 'unit.ocean_warship' });
  expect(plan.some(command => command.type === 'recruitCharacter')).toBe(false);
  for (const command of plan) { issue(state, command); issue(mirror, command); }
  expect(state.factions[0]!.treasury).toBe(0);
  for (let turn = 0; turn < 20 && state.settlements[NAVAL_FIXTURE.homeId]!.queue.length; turn++) { round(state); round(mirror); }
  expect(getObservation(state, factionId).armies.some(army => army.factionId === factionId && army.unitId === 'unit.ocean_warship')).toBe(true);
  expect(stateHash(mirror)).toBe(stateHash(state));
});

test('a funded open-sea harbor can buy ocean research from spare knowledge before any passenger charter', () => {
  let state = navalCampaign();
  const factionId = state.turnOwnerId;
  delete state.armies[NAVAL_FIXTURE.fleetId]; delete state.armies[NAVAL_FIXTURE.coastalId];
  state.armies[NAVAL_FIXTURE.enemyFleetId]!.cell = NAVAL_FIXTURE.shallowCell;
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const view = getObservation(state, factionId);
  // A possible scout does not reserve the grand strategy's knowledge purse.
  expect(navalResearchChoice(view)).toBeUndefined();
  expect(planNaval(view, 100, { knowledgeBudget: 79 }).commands.some(command => command.type === 'research')).toBe(false);
  const plan = planNaval(view, 100, { knowledgeBudget: 80 });
  expect(plan.commands).toContainEqual({ type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  expect(plan.commands.some(command => command.type === 'queue' && command.itemId === 'unit.ocean_warship')).toBe(false); // Wait for refreshed prerequisite quotes.
  const before = state.factions[0]!.knowledge;
  for (const command of plan.commands) issue(state, command);
  expect(state.factions[0]!.knowledge).toBe(before - 80);
  expect(state.progression[factionId]!.technologies).toContain('technology.ocean_navigation');
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

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

test('ocean reconnaissance is paid before foreign naval contact, then its temporary funding need ends', () => {
  const state = navalCampaign({ enemyFleet: false });
  delete state.armies[NAVAL_FIXTURE.coastalId]; // Explicit hull setup; paid replacement below is real production.
  refreshAuthoredSight(state);
  issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.ocean_navigation' });
  issue(state, { type: 'embarkArmy', factionId: state.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
  const view = getObservation(state, state.turnOwnerId), original = structuredClone(view);
  expect(view.armies.some(army => army.factionId !== view.factionId && army.domain === 'naval')).toBe(false);
  expect(needsNavalInvestment(view)).toBe(true);
  expect(planNaval(view, 47).commands.some(command => command.type === 'queue' && command.itemId === 'unit.ocean_warship')).toBe(false);
  const plan = planNaval(view, 48);
  expect(plan.coinSpent).toBe(48);
  expect(plan.commands).toContainEqual({ type: 'queue', factionId: view.factionId, settlementId: NAVAL_FIXTURE.homeId, itemId: 'unit.ocean_warship' });
  expect(view).toEqual(original);
  for (const command of plan.commands) issue(state, command);
  for (let turn = 0; turn < 20 && state.settlements[NAVAL_FIXTURE.homeId]!.queue.length; turn++) round(state);
  const ready = getObservation(state, state.turnOwnerId);
  expect(ready.armies.some(army => army.factionId === state.turnOwnerId && army.formations.some(formation => formation.unitId === 'unit.ocean_warship'))).toBe(true);
  expect(needsNavalInvestment(ready)).toBe(false);
  expect(planNaval(ready, 1000).commands.some(command => command.type === 'queue' && command.itemId === 'unit.ocean_warship')).toBe(false);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('unknown remote hull connectivity neither supplies a local charter nor funds unlimited replacements', () => {
  for (const remoteHulls of [3, 7]) {
    // Authored deployment isolates policy uncertainty. The geography and normal
    // current sight stay real; no hidden canonical component enters the planner.
    let state = navalCampaign({ enemyFleet: false });
    const ferry = state.armies[NAVAL_FIXTURE.fleetId]!;
    ferry.cell = 16 * state.world.width + 31; // Legal shallows at the far island's eastern coast.
    while (ferry.formations.length < remoteHulls) ferry.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.transport'));
    ferry.formations.sort((a, b) => a.id < b.id ? -1 : 1);
    state.explored[state.turnOwnerId] = new Set();
    refreshAuthoredSight(state);
    state = deserializeGame(serializeGame(state));
    const view = getObservation(state, state.turnOwnerId), before = structuredClone(view);
    const launch = view.productionOptions.find(option => option.settlementId === NAVAL_FIXTURE.homeId && option.itemId === 'unit.transport')!.launchCell;
    expect(launch).not.toBeNull(); expect(launch).toBeDefined();
    const knowledge = createSeaKnowledge(view);
    expect(knowledge.basinRelation(launch!, ferry.cell)).toBe('unknown');
    expect(knowledge.basinStatus(launch!)).toBe('unknown');
    const held = new Set([NAVAL_FIXTURE.fleetId, NAVAL_FIXTURE.coastalId]);
    const plan = planNaval(view, 24, { heldArmyIds: held });
    const charter = { type: 'queue', factionId: state.turnOwnerId, settlementId: NAVAL_FIXTURE.homeId, itemId: 'unit.transport' } as const;
    if (remoteHulls === 3) {
      expect(needsNavalInvestment(view)).toBe(true);
      expect(plan.commands).toContainEqual(charter); expect(plan.coinSpent).toBe(24);
      const mirror = deserializeGame(serializeGame(state));
      const result = issue(state, charter); expect(issue(mirror, charter)).toEqual(result);
      expect(serializeGame(mirror)).toBe(serializeGame(state));
      expect(state.factions[0]!.treasury).toBe(before.treasury - 24);
    } else {
      // Seven remote transports plus the existing local galley reach the
      // conservative eight-hull investment ceiling. No fictitious connection.
      expect(needsNavalInvestment(view)).toBe(false);
      expect(plan.commands.some(command => command.type === 'queue' && UNITS.find(unit => unit.id === command.itemId)?.movementDomain === 'naval')).toBe(false);
    }
    expect(view).toEqual(before); expect(held).toEqual(new Set([NAVAL_FIXTURE.fleetId, NAVAL_FIXTURE.coastalId]));
  }
});

test('only proven enclosure diverts a founder toward a replacement port, not an unknown chart boundary', () => {
  // Synthetic public chart isolates the proof decision without granting knowledge
  // to a canonical campaign: one inland berth and a separately charted edge sea.
  const state = navalCampaign({ enemyFleet: false }), base = getObservation(state, state.turnOwnerId);
  const width = 16, height = 12, townCell = 65, berth = 66, missingShore = 67;
  const town = { ...base.settlements.find(town => town.factionId === base.factionId)!, cell: townCell };
  const founder = { ...base.armies.find(army => army.canFound)!, cell: 135 };
  const template = base.cells[0]!;
  const cells = Array.from({ length: width * height }, (_, cell) => ({ ...template, cell,
    terrain: cell === berth || cell % width === width - 1 ? TERRAIN.water : TERRAIN.plains,
    waterDepth: cell === berth || cell % width === width - 1 ? WATER_DEPTH.shallow : WATER_DEPTH.land,
    hydrology: 0, settlementId: cell === townCell ? town.id : null, factionId: null }));
  const view = { ...base, width, height, cells: cells.filter(cell => cell.cell !== missingShore),
    settlements: [town], armies: [founder], productionOptions: [] };
  const before = structuredClone(view), unknown = createSeaKnowledge(view);
  expect(unknown.basinStatus(berth)).toBe('unknown');
  expect(unknown.basinStatus(width - 1)).toBe('open');
  expect(coastalFoundingSite(view, founder)).toBeNull();
  expect(view).toEqual(before);
  const complete = { ...view, cells }, proof = createSeaKnowledge(complete);
  expect(proof.basinStatus(berth)).toBe('enclosed');
  const replacement = coastalFoundingSite(complete, founder);
  expect(replacement).not.toBeNull();
  expect(neighbors(replacement!, width, height).some(cell => proof.basinStatus(cell) === 'open')).toBe(true);
});
