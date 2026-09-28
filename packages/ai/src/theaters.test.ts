import { describe, expect, it } from 'vitest';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { neighbors } from '@theandril/mapgen';
import { createJournal, replayArchive } from '../../chronicle/src';
import { withRules } from '../../sim/src/rules';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { characterCampaign, CHARACTER_FIXTURE } from '../../test-fixtures/src/character-fixture';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { planTurnWithReasons } from './index';
import { heldTheaterArmyIds, MAX_THEATER_ADOPTION_ROUTE_QUERIES, planDefenseTheater } from './theaters';
import { planArcaneSurvey } from './arcane';
import { planCharacters } from './characters';
import { planNaval } from './naval';

const issue = (game: GameState, command: GameCommand) => expect(applyCommand(game, command), JSON.stringify(command)).toMatchObject({ ok: true });
const townIds = (game: GameState) => Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId).map(town => town.id).sort();

/** Explicit flat, partly explored fixture. Hearths are founded through ordinary
 * commands; the six field/guard containers are authored, not earned recruits. */
function defenseCampaign(): GameState {
  let game = createGame({ seed: 20260927, size: 'tiny', factionCount: 2, generatorVersion: 4 });
  const width = game.world.width, home = width * 12 + 12, frontier = width * 12 + 22, staging = width * 12 + 16;
  const hidden = width * 27 + 40;
  game.world.terrain.fill(1); game.world.biome.fill(7); game.world.fertility.fill(80); game.world.waterDepth.fill(0);
  game.resources.deposits = {};
  game.world.starts = [home, hidden];
  game.armies['army.1']!.cell = home; game.armies['army.2']!.cell = staging;
  game.armies['army.3']!.cell = hidden; game.armies['army.4']!.cell = hidden;
  game.explored[game.turnOwnerId] = new Set<number>();
  for (let y = 8; y <= 18; y++) for (let x = 8; x <= 28; x++) game.explored[game.turnOwnerId]!.add(y * width + x);
  const add = (unitId: string, cell: number, count = 1) => {
    const id = `army.${game.nextId++}`;
    game.armies[id] = { id, factionId: game.turnOwnerId, name: `Authored company ${id}`, cell, movement: 3,
      formations: Array.from({ length: count }, (_, index) => createArmyFormation(index ? `army.${game.nextId++}` : id, unitId)).sort((a, b) => a.id < b.id ? -1 : 1) };
    return id;
  };
  const founder = add('unit.colonist', frontier);
  add('unit.guard', staging, 3); add('unit.guard', staging, 2);
  for (let index = 0; index < 4; index++) add('unit.guard', staging);
  game.factions[0]!.treasury = 300; game.factions[0]!.knowledge = 0;
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  issue(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Home watch hearth' });
  issue(game, { type: 'found', factionId: game.turnOwnerId, armyId: founder, name: 'Frontier watch hearth' });
  return deserializeGame(serializeGame(game));
}

function armyCommands(commands: GameCommand[], held: ReadonlySet<string>, view: Observation): GameCommand[] {
  const characters = new Set(view.characters.filter(character => character.location?.kind === 'army' && held.has(character.location.armyId)).map(character => character.id));
  return commands.filter(command => 'armyId' in command && held.has(command.armyId)
    || 'sourceArmyId' in command && (held.has(command.sourceArmyId) || held.has(command.targetArmyId))
    || 'characterId' in command && characters.has(command.characterId));
}

function isolateHearth(game: GameState, cell: number): void {
  for (const next of neighbors(cell, game.world.width, game.world.height)) {
    game.world.terrain[next] = 0; game.world.biome[next] = 0; game.world.fertility[next] = 0; game.world.waterDepth[next] = 1;
  }
}

describe('observed defensive theater adoption', () => {
  it('declines island-only assignments and bounds route work even with more candidate hearths', () => {
    let game = defenseCampaign();
    const home = game.settlements[townIds(game)[0]!]!;
    // Additional owned hearths are explicitly authored scale, then strictly
    // loaded; real observed terrain and canonical previews reject each island.
    for (const [x, y] of [[6, 23], [18, 24], [30, 24], [40, 16]]) {
      const id = `settlement.${game.nextId++}`;
      game.settlements[id] = { ...structuredClone(home), id, name: `Authored island ${id}`, cell: y! * game.world.width + x! };
    }
    for (const id of townIds(game)) isolateHearth(game, game.settlements[id]!.cell);
    rebaseAuthoredLand(game); game = deserializeGame(serializeGame(game));
    const view = getObservation(game, game.turnOwnerId), before = stateHash(game), plan = planDefenseTheater(view);
    expect(plan.commands).toEqual([]);
    expect(plan.heldArmyIds.size).toBe(0);
    expect(plan.routeQueries).toBe(MAX_THEATER_ADOPTION_ROUTE_QUERIES);
    expect(plan.targetSearchExpandedNodes).toBeGreaterThan(0);
    expect(stateHash(game)).toBe(before);
  });

  it('chooses a reachable local hearth when the first stable-ID hearth is a visible island', () => {
    let game = defenseCampaign();
    const [island, reachable] = townIds(game);
    isolateHearth(game, game.settlements[island!]!.cell); rebaseAuthoredLand(game); game = deserializeGame(serializeGame(game));
    const view = getObservation(game, game.turnOwnerId), plan = planDefenseTheater(view), command = plan.commands[0];
    expect(command).toMatchObject({ type: 'setTheater', settlementIds: [reachable], reserveCell: game.settlements[reachable!]!.cell });
    if (command?.type !== 'setTheater') throw new Error('Expected reachable alternative');
    for (const id of command.armyIds) expect(getMovementPreview(view, id, command.reserveCell).canQueue).toBe(true);
    issue(game, command); issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
    expect(game.theaters[0]!.lastDispatches.length).toBeGreaterThan(0);
    expect(game.theaters[0]!.lastDispatches.every(dispatch => dispatch.accepted && dispatch.targetCell === command.reserveCell)).toBe(true);
  });

  it('does not invent a route across unknown fog or inspect changes beyond permitted sight', () => {
    const game = defenseCampaign(), owner = game.turnOwnerId, width = game.world.width;
    for (const army of Object.values(game.armies)) if (army.factionId === owner) army.cell = width * 12 + 40;
    game.explored[owner] = new Set(); refreshAuthoredSight(game);
    const view = getObservation(game, owner), plan = planDefenseTheater(view), hiddenCell = width * 12 + 33;
    expect(view.cells.some(cell => cell.cell === hiddenCell)).toBe(false);
    expect(plan.commands).toEqual([]); expect(plan.heldArmyIds.size).toBe(0);
    game.world.terrain[hiddenCell] = 0; game.world.biome[hiddenCell] = 0; game.world.fertility[hiddenCell] = 0; game.world.waterDepth[hiddenCell] = 1;
    const hiddenEnemy = Object.values(game.armies).find(army => army.factionId !== owner)!;
    expect(view.armies.some(army => army.id === hiddenEnemy.id)).toBe(false);
    hiddenEnemy.formations[0]!.strength = 1;
    const changed = getObservation(game, owner);
    expect(changed).toEqual(view); expect(planDefenseTheater(changed)).toEqual(plan);
  });

  it('allows an already stationed guard on an island without manufacturing a travel order', () => {
    let game = defenseCampaign();
    const home = game.settlements[townIds(game)[0]!]!;
    for (const army of Object.values(game.armies)) if (army.factionId === game.turnOwnerId && army.formations.length === 1 && army.formations[0]!.unitId === 'unit.guard') army.cell = home.cell;
    for (const id of townIds(game)) isolateHearth(game, game.settlements[id]!.cell);
    rebaseAuthoredLand(game); game = deserializeGame(serializeGame(game));
    const plan = planDefenseTheater(getObservation(game, game.turnOwnerId)), command = plan.commands[0];
    expect(command).toMatchObject({ type: 'setTheater', settlementIds: [home.id], reserveCell: home.cell });
    if (command?.type !== 'setTheater') throw new Error('Expected same-cell garrison');
    expect(command.armyIds.length).toBeGreaterThan(0);
    issue(game, command); issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
    expect(game.theaters[0]!.lastDispatches).toEqual([]);
    expect(getObservation(game, game.turnOwnerId).theaters![0]!.members.every(member => member.status === 'garrison')).toBe(true);
  });

  it('adopts two spare companies through an ordinary command without reusing them in the same complete plan', () => {
    const game = defenseCampaign(), view = getObservation(game, game.turnOwnerId), before = structuredClone(view);
    const result = planTurnWithReasons(view), command = result.commands.find(command => command.type === 'setTheater');
    expect(command).toMatchObject({ type: 'setTheater', name: 'Home watch', settlementIds: townIds(game), guardsPerSettlement: 1, reinforcementLimit: 1, enabled: true });
    if (command?.type !== 'setTheater') throw new Error('Expected real adoption');
    expect(command.armyIds).toHaveLength(2);
    const members = view.armies.filter(army => command.armyIds.includes(army.id));
    expect(members.every(army => army.formations.length === 1 && !army.canFound && army.unitId !== 'unit.scout')).toBe(true);
    expect(view.armies.filter(army => army.factionId === view.factionId && army.formations.length > 1).every(army => !command.armyIds.includes(army.id))).toBe(true);
    expect(armyCommands(result.commands, new Set(command.armyIds), view)).toEqual([]);
    expect(planTurnWithReasons(structuredClone(view))).toEqual(result);
    expect(view).toEqual(before);
    for (const proposed of result.commands) issue(game, proposed);
    expect(game.theaters).toHaveLength(1);
    expect(game.theaters[0]!.armyIds).toEqual(command.armyIds);
  });

  it('leaves theater routing to canonical turns and retains actual AI commands, save continuation and replay', () => {
    const game = defenseCampaign(), journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    const initial = planTurnWithReasons(getObservation(game, game.turnOwnerId));
    for (const command of initial.commands) expect(journal.record(game, command).ok).toBe(true);
    const ids = game.theaters[0]!.armyIds, held = new Set(ids);
    let mirror = deserializeGame(serializeGame(game)), dispatched = false;
    for (let turn = 0; turn < 6; turn++) {
      const view = getObservation(game, game.turnOwnerId), plan = planTurnWithReasons(view);
      expect(plan).toEqual(planTurnWithReasons(getObservation(mirror, mirror.turnOwnerId)));
      expect(plan.commands.some(command => command.type === 'setTheater')).toBe(false);
      expect(armyCommands(plan.commands, held, view)).toEqual([]);
      for (const command of [...plan.commands, { type: 'endTurn' as const, factionId: game.turnOwnerId }]) {
        const result = journal.record(game, command);
        expect(result.ok, result.error).toBe(true);
        expect(applyCommand(mirror, command)).toEqual(result);
      }
      dispatched ||= game.theaters[0]!.lastDispatches.some(dispatch => dispatch.accepted);
      expect(stateHash(mirror)).toBe(stateHash(game));
      if (turn === 2) mirror = deserializeGame(serializeGame(mirror));
    }
    expect(dispatched).toBe(true);
    expect(getObservation(game, game.turnOwnerId).theaters![0]!.hearths.every(hearth => hearth.stationed >= 1)).toBe(true);
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  it('keeps historical observations, scarce field armies and configured paused theaters out of automatic adoption', () => {
    const game = defenseCampaign(), view = getObservation(game, game.turnOwnerId);
    const historical = withRules(game, 32, () => getObservation(game, game.turnOwnerId));
    expect(historical.theaters).toBeUndefined();
    expect(planDefenseTheater(historical).commands).toEqual([]);
    expect(planDefenseTheater(historical).routeQueries).toBe(0);
    expect(planTurnWithReasons(historical).commands.some(command => command.type === 'setTheater')).toBe(false);
    const military = view.armies.filter(army => army.factionId === view.factionId && army.unitId !== 'unit.scout');
    expect(planDefenseTheater({ ...view, armies: military.slice(0, 2) }).commands).toEqual([]);
    const adoption = planDefenseTheater(view).commands[0]!;
    if (adoption.type !== 'setTheater') throw new Error('Expected adoption');
    issue(game, { ...adoption, enabled: false });
    const paused = getObservation(game, game.turnOwnerId);
    expect(planDefenseTheater(paused).commands).toEqual([]);
    expect(heldTheaterArmyIds(paused).size).toBe(0);
  });

  it('does not enroll posted companies and never reads unseen foreign forces', () => {
    const game = defenseCampaign(), factionId = game.turnOwnerId;
    const candidates = planDefenseTheater(getObservation(game, factionId)).commands[0]!;
    if (candidates.type !== 'setTheater') throw new Error('Expected adoption');
    for (const armyId of candidates.armyIds) issue(game, { type: 'setPosting', factionId, armyId, cell: game.armies[armyId]!.cell, mode: 'hold' });
    const view = getObservation(game, factionId), plan = planDefenseTheater(view);
    expect(plan.commands.every(command => command.type !== 'setTheater' || command.armyIds.every(id => !candidates.armyIds.includes(id)))).toBe(true);
    const enemy = Object.values(game.armies).find(army => army.factionId !== factionId)!;
    expect(view.armies.some(army => army.id === enemy.id)).toBe(false);
    enemy.formations[0]!.strength = 1;
    game.factions.find(faction => faction.id === enemy.factionId)!.treasury += 1000;
    const changed = getObservation(game, factionId);
    expect(changed).toEqual(view);
    expect(planDefenseTheater(changed)).toEqual(plan);
  });
});

describe('theater members remain reserved across actor planners', () => {
  it('keeps an attached engineer and an otherwise eligible paid survey with their theater', () => {
    const game = characterCampaign(), factionId = game.turnOwnerId, armyId = CHARACTER_FIXTURE.armyId;
    issue(game, { type: 'recruitCharacter', factionId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.engineer' });
    const character = Object.values(game.characters)[0]!;
    issue(game, { type: 'assignCharacter', factionId, characterId: character.id, armyId });
    const before = getObservation(game, factionId);
    expect(planCharacters(before, 100).commands.some(command => command.type === 'startCharacterMission')).toBe(true);
    const members = before.armies.filter(army => army.factionId === factionId && army.canAttack && !army.canFound).map(army => army.id);
    issue(game, { type: 'setTheater', factionId, name: 'Manual watch', settlementIds: [CHARACTER_FIXTURE.homeId], armyIds: members,
      reserveCell: game.armies[armyId]!.cell, guardsPerSettlement: 1, enabled: true });
    const view = getObservation(game, factionId);
    expect(planCharacters(view, 100).commands).toEqual([]);
    expect(armyCommands(planTurnWithReasons(view).commands, new Set(members), view)).toEqual([]);
    const surveyView = { ...view, turn: 6, treasury: 1000, arcaneSites: [] };
    expect(planArcaneSurvey({ ...surveyView, theaters: [] })).not.toBeNull();
    expect(planArcaneSurvey(surveyView)).toBeNull();
  });

  it('keeps an otherwise boardable land column out of naval embarkation planning', () => {
    let game = navalCampaign({ enemyFleet: false });
    const factionId = game.turnOwnerId;
    const cargo = game.armies[NAVAL_FIXTURE.cargoId]!;
    cargo.formations = cargo.formations.map(formation => ({ ...createArmyFormation(formation.id.replace('formation.', 'army.'), 'unit.guard') }));
    // A real observer at the far shore gives the naval planner a visible
    // foreign hearth; charted terrain alone is not an invasion objective.
    game.armies[NAVAL_FIXTURE.coastalId]!.cell = NAVAL_FIXTURE.landingWaterCell;
    refreshAuthoredSight(game); game = deserializeGame(serializeGame(game));
    issue(game, { type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
    const before = getObservation(game, factionId);
    expect(planNaval(before, 0).commands).toContainEqual({ type: 'embarkArmy', factionId, armyId: cargo.id, fleetId: NAVAL_FIXTURE.fleetId });
    issue(game, { type: 'setTheater', factionId, name: 'Shore watch', settlementIds: [NAVAL_FIXTURE.homeId], armyIds: [cargo.id], reserveCell: NAVAL_FIXTURE.homeCell, guardsPerSettlement: 1, enabled: true });
    const view = getObservation(game, factionId), plan = planNaval(view, 0);
    expect(plan.heldArmyIds.has(cargo.id)).toBe(true);
    expect(armyCommands(plan.commands, new Set([cargo.id]), view)).toEqual([]);
  });
});
