import { expect, test } from 'vitest';
import { BUILDINGS } from '@theandril/content';
import { deriveWaterDepth, isPassable, LAKE_BIT, neighbors, WATER_DEPTH } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { overseasCampaign } from '../../test-fixtures/src/overseas-fixture';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { planTurnWithReasons } from './index';
import { coastalReconnaissanceUseful, hasNavalOpportunity, navalResearchChoice, planNaval } from './naval';
import { planProgression } from './progression';

function issue(state: GameState, command: GameCommand) {
  const result = applyCommand(state, command);
  expect(result.ok, `Turn ${state.turn}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
  return result;
}

test('partial-fog island start earns navigation, harbor, transport and settlers then founds across deep water', () => {
  const game = overseasCampaign();
  const original = createGame({ seed: 20260906, size: 'tiny', factionCount: 1, pace: 'epic', generatorVersion: 4 });
  expect(game.factions).toEqual(original.factions);
  expect(game.progression).toEqual(original.progression);
  expect(getObservation(game, game.turnOwnerId).cells.some(cell => cell.terrain !== 0 && cell.cell % game.world.width >= 25)).toBe(false);
  const starting = serializeGame(game), trace: { command: GameCommand; result: ReturnType<typeof issue> }[] = [];
  let mirror: GameState | undefined, crossed = false, colony = false;
  const stages = new Set<string>();
  const submit = (command: GameCommand) => {
    const result = issue(game, command); trace.push({ command, result });
    if (mirror) expect(issue(mirror, command)).toEqual(result);
    if (command.type === 'research') stages.add(command.technologyId);
    if (command.type === 'queue') stages.add(command.itemId);
    if (command.type === 'embarkArmy') stages.add(command.type);
    if (command.type === 'disembarkArmy') {
      stages.add(command.type);
      expect(command.target % game.world.width).toBeGreaterThanOrEqual(25);
    }
    if (command.type === 'found' && result.events.some(event => event.cell !== undefined && event.cell % game.world.width >= 25)) colony = true;
    crossed ||= Object.values(game.transports).some(id => game.world.waterDepth[game.armies[id]!.cell] === WATER_DEPTH.deep);
    if (!mirror && Object.keys(game.transports).length) mirror = deserializeGame(serializeGame(game));
  };
  for (let round = 0; round < 100 && !colony; round++) {
    const view = getObservation(game, game.turnOwnerId), before = structuredClone(view);
    const plan = planTurnWithReasons(view);
    expect(planTurnWithReasons(structuredClone(view))).toEqual(plan);
    expect(view).toEqual(before);
    for (const command of plan.commands) submit(command);
    if (!colony) submit({ type: 'endTurn', factionId: game.turnOwnerId });
  }
  expect([...stages]).toEqual(expect.arrayContaining(['technology.coastal_navigation', 'technology.ocean_navigation', 'building.harbor', 'unit.transport', 'unit.colonist', 'embarkArmy', 'disembarkArmy']));
  expect({ crossed, colony }).toEqual({ crossed: true, colony: true });
  expect(mirror && stateHash(mirror)).toBe(stateHash(game));
  const replay = deserializeGame(starting);
  for (const item of trace) expect(issue(replay, item.command)).toEqual(item.result);
  expect(serializeGame(replay)).toBe(serializeGame(game));
});

test('a single coastal hearth may initiate navigation; a remote colonist does not suppress port recruitment', () => {
  const game = overseasCampaign();
  issue(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Departure hearth' });
  expect(hasNavalOpportunity(getObservation(game, game.turnOwnerId))).toBe(true);
  const prepared = navalCampaign({ enemyFleet: false });
  prepared.armies[NAVAL_FIXTURE.cargoId]!.cell = 15 * prepared.world.width + 30;
  refreshAuthoredSight(prepared);
  const view = getObservation(prepared, prepared.turnOwnerId);
  const plan = planNaval(view, 100);
  expect(plan.commands).toContainEqual({ type: 'queue', factionId: prepared.turnOwnerId, settlementId: NAVAL_FIXTURE.homeId, itemId: 'unit.colonist' });
  for (const command of plan.commands) issue(prepared, command);
});

test('an empty transport charts visible water toward unknown frontier without imaginary passengers', () => {
  const game = navalCampaign({ enemyFleet: false });
  delete game.armies[NAVAL_FIXTURE.cargoId];
  game.explored[game.turnOwnerId] = new Set();
  refreshAuthoredSight(game);
  const view = getObservation(game, game.turnOwnerId), before = structuredClone(view);
  const plan = planNaval(view, 0);
  expect(plan.commands.some(command => command.type === 'moveTo' && command.armyId === NAVAL_FIXTURE.fleetId)).toBe(true);
  expect(plan.commands.some(command => command.type === 'embarkArmy')).toBe(false);
  expect(view).toEqual(before);
  for (const command of plan.commands) issue(game, command);
  expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
});

test('an embarked founding expedition does not suppress a separately paid overland caravan', () => {
  const game = navalCampaign({ enemyFleet: false });
  // Authored developed port isolates the recruitment priority after basic buildings.
  game.settlements[NAVAL_FIXTURE.homeId]!.buildings = BUILDINGS.map(building => building.id);
  issue(game, { type: 'embarkArmy', factionId: game.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
  const view = getObservation(game, game.turnOwnerId), before = structuredClone(view);
  const plan = planTurnWithReasons(view);
  const caravans = plan.commands.filter(command => command.type === 'queue' && command.itemId === 'unit.colonist');
  expect(caravans).toHaveLength(1);
  expect(view).toEqual(before);
  const treasury = game.factions.find(faction => faction.id === game.turnOwnerId)!.treasury;
  for (const command of plan.commands) issue(game, command);
  expect(game.factions.find(faction => faction.id === game.turnOwnerId)!.treasury).toBeLessThan(treasury);
  expect(game.transports[NAVAL_FIXTURE.cargoId]).toBe(NAVAL_FIXTURE.fleetId);
  expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
});

test('observed freshwater lakes do not masquerade as ocean ports or justify ocean investment', () => {
  const game = overseasCampaign();
  issue(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Lake policy trial' });
  const view = getObservation(game, game.turnOwnerId);
  expect(hasNavalOpportunity(view)).toBe(true);
  // Explicit filtered read-model policy input; no canonical hydrology is forged.
  for (const cell of view.cells) if (cell.terrain === 0) cell.hydrology = LAKE_BIT | 1;
  expect(hasNavalOpportunity(view)).toBe(false);
  expect(planNaval(view, 1000).commands).toEqual([]);
});

test('a paid ferry reserves unaffordable Ocean knowledge rather than repeatedly buying cheaper competing techniques', () => {
  const game = navalCampaign({ enemyFleet: false });
  issue(game, { type: 'research', factionId: game.turnOwnerId, technologyId: 'technology.cinder_masonry' });
  // Authored near-threshold balance isolates saving; the eventual research still
  // spends actual knowledge gained through ordinary town turns.
  game.factions.find(faction => faction.id === game.turnOwnerId)!.knowledge = 79;
  let view = getObservation(game, game.turnOwnerId);
  expect(view.progression.technologyChoices.some(choice => choice.available && choice.knowledgeCost < 80)).toBe(true);
  expect(navalResearchChoice(view)).toMatchObject({ id: 'technology.ocean_navigation', available: false, knowledgeCost: 80 });
  expect(planProgression(view).commands.some(command => command.type === 'research')).toBe(false);
  expect(planNaval(view, 0).commands.some(command => command.type === 'research')).toBe(false);
  issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
  view = getObservation(game, game.turnOwnerId);
  const command = planNaval(view, 0).commands.find(command => command.type === 'research');
  expect(command).toEqual({ type: 'research', factionId: game.turnOwnerId, technologyId: 'technology.ocean_navigation' });
  const knowledge = view.knowledge;
  issue(game, command!);
  expect(game.factions.find(faction => faction.id === game.turnOwnerId)!.knowledge).toBe(knowledge - 80);
  expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
});

test('an extra coastal reconnaissance hull needs a broad public theater or an actually observed navy', () => {
  const game = navalCampaign({ enemyFleet: false }), view = getObservation(game, game.turnOwnerId);
  expect(coastalReconnaissanceUseful(view)).toBe(false);
  // This helper deliberately reads setup scale, not hidden terrain, starts or faction IDs.
  expect(coastalReconnaissanceUseful({ ...view, width: 512, height: 384, factionCount: 32 })).toBe(true);
  const ownFleet = view.armies.find(army => army.domain === 'naval')!;
  expect(coastalReconnaissanceUseful({ ...view, armies: [...view.armies, { ...ownFleet, factionId: 'faction.observed' }] })).toBe(true);
  const plan = planNaval(view, 1000);
  expect(plan.commands.some(command => command.type === 'queue' && command.itemId === 'unit.coastal_warship')).toBe(false);
});

test('an immediately legal landing is not lost to the bounded long-distance shoreline sample', () => {
  let game = navalCampaign({ enemyFleet: false });
  const { world } = game, landing = 405, berth = 404;
  // Explicit authored coast complexity outside the existing towns and sailing corridor.
  // These actual cells make the distant objective list exceed its256 candidate budget.
  for (let y = 0; y < world.height; y++) if (y <= 6 || y >= 25) for (let x = 0; x < world.width; x += 2) {
    const cell = y * world.width + x; world.terrain[cell] = 1; world.biome[cell] = 1; world.fertility[cell] = 65;
  }
  const shores = () => Array.from(world.terrain.keys()).filter(cell => isPassable(world.terrain[cell]!)
    && neighbors(cell, world.width, world.height).some(next => world.terrain[next] === 0));
  // Keep the sole adjacent landing deliberately between sampled distant objectives.
  if (shores().indexOf(landing) % Math.ceil(shores().length / 256) === 0) {
    world.terrain[3] = 1; world.biome[3] = 1; world.fertility[3] = 65;
  }
  world.waterDepth = deriveWaterDepth(world.width, world.height, world.terrain);
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  issue(game, { type: 'research', factionId: game.turnOwnerId, technologyId: 'technology.ocean_navigation' });
  issue(game, { type: 'embarkArmy', factionId: game.turnOwnerId, armyId: NAVAL_FIXTURE.cargoId, fleetId: NAVAL_FIXTURE.fleetId });
  issue(game, { type: 'queueMovement', factionId: game.turnOwnerId, armyId: NAVAL_FIXTURE.fleetId, target: berth });
  for (let turn = 0; turn < 10 && game.armies[NAVAL_FIXTURE.fleetId]!.cell !== berth; turn++) issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
  expect(game.armies[NAVAL_FIXTURE.fleetId]!.cell).toBe(berth);
  issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
  const view = getObservation(game, game.turnOwnerId), cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const longRange = view.cells.filter(cell => isPassable(cell.terrain) && neighbors(cell.cell, view.width, view.height).some(next => cells.get(next)?.terrain === 0));
  expect(longRange.length).toBeGreaterThan(256);
  expect(longRange.filter((_, index) => index % Math.ceil(longRange.length / 256) === 0).some(cell => cell.cell === landing)).toBe(false);
  const cargo = view.armies.find(army => army.id === NAVAL_FIXTURE.cargoId)!;
  expect(cargo.disembarkOptions.filter(option => option.canDisembark).map(option => option.cell)).toEqual([landing]);
  const before = structuredClone(view), plan = planNaval(view, 0);
  expect(plan.commands).toContainEqual({ type: 'disembarkArmy', factionId: game.turnOwnerId, armyId: cargo.id, target: landing });
  expect(view).toEqual(before);
  for (const command of plan.commands) issue(game, command);
  expect(game.armies[cargo.id]!.cell).toBe(landing);
  expect(game.transports[cargo.id]).toBeUndefined();
  expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
});
