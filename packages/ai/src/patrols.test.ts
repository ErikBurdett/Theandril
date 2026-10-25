import { describe, expect, it } from 'vitest';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { createJournal, replayArchive } from '../../chronicle/src';
import { withRules } from '../../sim/src/rules';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { characterCampaign, CHARACTER_FIXTURE } from '../../test-fixtures/src/character-fixture';
import { planTurnWithReasons } from './index';
import { MAX_PATROL_ADOPTION_ROUTE_QUERIES, planPatrol } from './patrols';
import { heldDelegatedArmyIds, planDefenseTheater } from './theaters';
import { planCharacters } from './characters';

const issue = (game: GameState, command: GameCommand) => expect(applyCommand(game, command), JSON.stringify(command)).toMatchObject({ ok: true });

/** Authored open-land realm: two ordinary founded hearths, two field armies,
 * four spare guards, one scout and a foreign seat outside explored ground. */
function patrolCampaign(): GameState {
  let game = createGame({ seed: 20261024, size: 'tiny', factionCount: 2, generatorVersion: 4 });
  const width = game.world.width, home = width * 12 + 12, frontier = home + 6, staging = width * 15 + 15;
  const hidden = width * 27 + 40;
  game.world.terrain.fill(1); game.world.biome.fill(7); game.world.fertility.fill(80); game.world.waterDepth.fill(0);
  game.resources.deposits = {}; game.world.starts = [home, hidden];
  game.armies['army.1']!.cell = home; game.armies['army.2']!.cell = staging;
  game.armies['army.3']!.cell = hidden; game.armies['army.4']!.cell = hidden;
  game.explored[game.turnOwnerId] = new Set<number>();
  for (let y = 8; y <= 22; y++) for (let x = 8; x <= 24; x++) game.explored[game.turnOwnerId]!.add(y * width + x);
  const add = (unitId: string, cell: number, count = 1) => {
    const id = `army.${game.nextId++}`;
    game.armies[id] = { id, factionId: game.turnOwnerId, name: `Authored patrol company ${id}`, cell, movement: 3,
      formations: Array.from({ length: count }, (_, index) => createArmyFormation(index ? `army.${game.nextId++}` : id, unitId)).sort((a, b) => a.id < b.id ? -1 : 1) };
    return id;
  };
  const founder = add('unit.colonist', frontier);
  add('unit.guard', staging, 3); add('unit.guard', staging, 2);
  for (let i = 0; i < 4; i++) add('unit.guard', staging);
  game.factions[0]!.treasury = 300; game.factions[0]!.knowledge = 0;
  refreshAuthoredSight(game); game = deserializeGame(serializeGame(game));
  issue(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'West patrol hearth' });
  issue(game, { type: 'found', factionId: game.turnOwnerId, armyId: founder, name: 'East patrol hearth' });
  return deserializeGame(serializeGame(game));
}

function actorCommands(commands: GameCommand[], ids: ReadonlySet<string>, view: Observation) {
  const characters = new Set(view.characters.filter(character => character.location?.kind === 'army' && ids.has(character.location.armyId)).map(character => character.id));
  return commands.filter(command => 'armyId' in command && ids.has(command.armyId)
    || 'sourceArmyId' in command && (ids.has(command.sourceArmyId) || ids.has(command.targetArmyId))
    || 'characterId' in command && characters.has(command.characterId));
}

describe('bounded observed home patrol adoption', () => {
  it('proposes one reachable circuit without reusing a field army or changing its observation', () => {
    const game = patrolCampaign(), view = getObservation(game, game.turnOwnerId), before = structuredClone(view), hash = stateHash(game);
    const plan = planPatrol(view), command = plan.commands[0];
    expect(command).toMatchObject({ type: 'setPatrol', enabled: true, pauseOnWar: false });
    if (command?.type !== 'setPatrol') throw new Error('Expected a patrol command.');
    const army = view.armies.find(army => army.id === command.armyId)!;
    expect(army.formations).toHaveLength(1); expect(army.unitId).toBe('unit.guard');
    expect([command.firstCell, command.secondCell].sort((a, b) => a - b)).toEqual(view.settlements.filter(town => town.factionId === view.factionId).map(town => town.cell).sort((a, b) => a - b));
    expect(plan.routeQueries).toBe(2); expect(plan.targetSearchExpandedNodes).toBeGreaterThan(0);
    expect(plan.heldArmyIds.has(army.id)).toBe(true);
    expect(planPatrol(structuredClone(view))).toEqual(plan);
    expect(view).toEqual(before); expect(stateHash(game)).toBe(hash);
    issue(game, command);
    expect(game.patrols).toHaveLength(1);
  });

  it('allocates theater guards before a distinct patrol and reserves all of them throughout the complete AI plan', () => {
    const game = patrolCampaign(), view = getObservation(game, game.turnOwnerId), plan = planTurnWithReasons(view);
    const patrol = plan.commands.find(command => command.type === 'setPatrol');
    const theater = plan.commands.find(command => command.type === 'setTheater');
    expect(patrol).toBeDefined(); expect(theater).toBeDefined();
    if (patrol?.type !== 'setPatrol' || theater?.type !== 'setTheater') throw new Error('Expected independent delegations.');
    expect(theater.armyIds).not.toContain(patrol.armyId);
    const held = new Set([...theater.armyIds, patrol.armyId]);
    expect(actorCommands(plan.commands, held, view)).toEqual([patrol]);
    for (const command of plan.commands) issue(game, command);
    const continuing = getObservation(game, game.turnOwnerId);
    expect(heldDelegatedArmyIds(continuing)).toEqual(held);
    expect(actorCommands(planTurnWithReasons(continuing).commands, held, continuing)).toEqual([]);
  });

  it('continues the actual patrol across save reload and exact recorded replay', () => {
    const game = patrolCampaign(), journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    const first = planPatrol(getObservation(game, game.turnOwnerId)).commands[0]!;
    if (first.type !== 'setPatrol') throw new Error('Expected adoption.');
    expect(journal.record(game, first).ok).toBe(true);
    const patrolName = game.armies[first.armyId]!.name;
    let mirror = deserializeGame(serializeGame(game));
    const visited = new Set<number>();
    for (let i = 0; i < 10; i++) {
      const view = getObservation(game, game.turnOwnerId), plan = planTurnWithReasons(view);
      expect(plan).toEqual(planTurnWithReasons(getObservation(mirror, mirror.turnOwnerId)));
      expect(plan.commands.some(command => command.type === 'setPatrol')).toBe(false);
      expect(actorCommands(plan.commands, new Set([first.armyId]), view)).toEqual([]);
      for (const command of [...plan.commands, { type: 'endTurn' as const, factionId: game.turnOwnerId }]) {
        const result = journal.record(game, command);
        expect(result.ok, result.error).toBe(true); expect(applyCommand(mirror, command)).toEqual(result);
        // Arrival can immediately begin the next leg within the same End turn.
        // Retain this army's actual movement events, not only its final cell.
        for (const event of result.events) if (event.type === 'army_moved' && event.cell !== undefined
          && event.message === `${patrolName} explored hex ${event.cell}.`) visited.add(event.cell);
      }
      visited.add(game.armies[first.armyId]!.cell);
      expect(stateHash(mirror)).toBe(stateHash(game));
      if (i === 4) mirror = deserializeGame(serializeGame(mirror));
    }
    expect(visited.has(first.firstCell)).toBe(true); expect(visited.has(first.secondCell)).toBe(true);
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  it('honors an explicit player war-pause choice after persistent adoption and preserves the released company through save and replay', () => {
    let game = patrolCampaign();
    const factionId = game.turnOwnerId, targetFactionId = game.factions[1]!.id;
    // Contact is authored before the journal; adoption and war use public commands.
    game.armies['army.4']!.cell = Object.values(game.settlements)[0]!.cell + 1;
    refreshAuthoredSight(game); game = deserializeGame(serializeGame(game));
    const journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    const patrol = planPatrol(getObservation(game, factionId)).commands[0]!;
    if (patrol.type !== 'setPatrol') throw new Error('Expected peacetime adoption.');
    expect(patrol.pauseOnWar).toBe(false);
    // The player may replace the AI's persistent policy through the same public command.
    for (const command of [patrol, { ...patrol, pauseOnWar: true }, { type: 'declareWar' as const, factionId, targetFactionId }, { type: 'endTurn' as const, factionId }]) {
      const result = journal.record(game, command);
      expect(result.ok, result.error).toBe(true);
    }
    const view = getObservation(game, factionId), held = new Set([patrol.armyId]);
    expect(view.patrols).toEqual([expect.objectContaining({ armyId: patrol.armyId, enabled: false, pauseOnWar: true })]);
    expect(heldDelegatedArmyIds(view).has(patrol.armyId)).toBe(false);
    expect(planPatrol(view).commands).toEqual([]);
    const wartime = planTurnWithReasons(view);
    expect(actorCommands(wartime.commands, held, view).length).toBeGreaterThan(0);
    expect(wartime.commands.some(command => command.type === 'setPatrol')).toBe(false);
    const reloaded = deserializeGame(serializeGame(game));
    expect(planTurnWithReasons(getObservation(reloaded, factionId))).toEqual(wartime);
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
    for (const command of wartime.commands) {
      const result = journal.record(game, command);
      expect(result.ok, result.error).toBe(true);
      expect(applyCommand(reloaded, command)).toEqual(result);
    }
    expect(stateHash(reloaded)).toBe(stateHash(game));
    expect(stateHash(replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  it('retains historical behavior and declines wars, scarce forces, remote hearths and configured paused patrols', () => {
    const game = patrolCampaign(), view = getObservation(game, game.turnOwnerId);
    const historical = withRules(game, 34, () => getObservation(game, game.turnOwnerId));
    expect(historical.patrols).toBeUndefined();
    expect(planPatrol(historical).commands).toEqual([]); expect(planPatrol(historical).routeQueries).toBe(0);
    expect(planTurnWithReasons(historical).commands.some(command => command.type === 'setPatrol')).toBe(false);
    expect(planPatrol({ ...view, wars: [game.factions[1]!.id] }).commands).toEqual([]);
    const guards = view.armies.filter(army => army.unitId === 'unit.guard');
    expect(planPatrol({ ...view, armies: guards.slice(0, 2) }).commands).toEqual([]);
    expect(planPatrol({ ...view, settlements: view.settlements.map((town, i) => ({ ...town, cell: 100 + i * 100 })) }).routeQueries).toBe(0);
    const command = planPatrol(view).commands[0]!;
    if (command.type !== 'setPatrol') throw new Error('Expected adoption.');
    issue(game, { ...command, enabled: false });
    const paused = getObservation(game, game.turnOwnerId);
    expect(planPatrol(paused).commands).toEqual([]); expect(planPatrol(paused).routeQueries).toBe(0);
    expect(heldDelegatedArmyIds(paused).has(command.armyId)).toBe(false);
    expect(planDefenseTheater(paused).commands.every(order => order.type !== 'setTheater' || !order.armyIds.includes(command.armyId))).toBe(true);
  });

  it('does not reuse companies committed to a route, posting or paused theater', () => {
    const game = patrolCampaign(), view = getObservation(game, game.turnOwnerId);
    const singles = view.armies.filter(army => army.unitId === 'unit.guard' && army.formations.length === 1).sort((a, b) => a.id < b.id ? -1 : 1);
    const town = view.settlements.find(town => town.factionId === view.factionId)!;
    issue(game, { type: 'queueMovement', factionId: view.factionId, armyId: singles[0]!.id, target: town.cell });
    issue(game, { type: 'setPosting', factionId: view.factionId, armyId: singles[1]!.id, cell: town.cell, mode: 'hold' });
    issue(game, { type: 'setTheater', factionId: view.factionId, name: 'Paused reserves', armyIds: singles.slice(2).map(army => army.id), settlementIds: [town.id], reserveCell: town.cell, guardsPerSettlement: 1, enabled: false });
    const plan = planPatrol(getObservation(game, game.turnOwnerId));
    expect(plan.commands).toEqual([]); expect(plan.routeQueries).toBe(0);
  });

  it('caps route attempts over four nearby island hearths and two candidate companies', () => {
    let game = patrolCampaign();
    const towns = Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId);
    for (const original of towns) {
      const id = `settlement.${game.nextId++}`;
      game.settlements[id] = { ...structuredClone(original), id, cell: original.cell + game.world.width * 6, name: `Authored southern ${original.name}` };
    }
    for (const town of Object.values(game.settlements)) for (const cell of neighbors(town.cell, game.world.width, game.world.height)) {
      game.world.terrain[cell] = 0; game.world.biome[cell] = 0; game.world.fertility[cell] = 0; game.world.waterDepth[cell] = 1;
    }
    rebaseAuthoredLand(game); game = deserializeGame(serializeGame(game));
    const plan = planPatrol(getObservation(game, game.turnOwnerId));
    expect(plan.commands).toEqual([]); expect(plan.routeQueries).toBe(MAX_PATROL_ADOPTION_ROUTE_QUERIES);
    expect(plan.targetSearchExpandedNodes).toBeGreaterThan(0);
  });

  it('has identical proposals when unseen terrain and foreign forces change', () => {
    const game = patrolCampaign(), owner = game.turnOwnerId, view = getObservation(game, owner), plan = planPatrol(view);
    const hidden = game.world.width * 26 + 41;
    expect(view.cells.some(cell => cell.cell === hidden)).toBe(false);
    game.world.terrain[hidden] = 0; game.world.biome[hidden] = 0; game.world.fertility[hidden] = 0; game.world.waterDepth[hidden] = 1;
    const enemy = Object.values(game.armies).find(army => army.factionId !== owner)!;
    expect(view.armies.some(army => army.id === enemy.id)).toBe(false);
    enemy.formations[0]!.strength = 1;
    const changed = getObservation(game, owner);
    expect(changed).toEqual(view); expect(planPatrol(changed)).toEqual(plan);
  });

  it('reserves an enabled patrol from specialist missions without rewriting its saved policy', () => {
    const game = characterCampaign(), factionId = game.turnOwnerId, armyId = CHARACTER_FIXTURE.armyId;
    issue(game, { type: 'recruitCharacter', factionId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.engineer' });
    const character = Object.values(game.characters)[0]!;
    issue(game, { type: 'assignCharacter', factionId, characterId: character.id, armyId });
    expect(planCharacters(getObservation(game, factionId), 100).commands.some(command => command.type === 'startCharacterMission')).toBe(true);
    const army = game.armies[armyId]!;
    issue(game, { type: 'setPatrol', factionId, armyId, firstCell: army.cell, secondCell: army.cell + 1, enabled: true });
    const view = getObservation(game, factionId), before = serializeGame(game);
    expect(actorCommands(planCharacters(view, 100).commands, new Set([armyId]), view)).toEqual([]);
    expect(actorCommands(planTurnWithReasons(view).commands, new Set([armyId]), view)).toEqual([]);
    expect(serializeGame(game)).toBe(before);
  });
});
