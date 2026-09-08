import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { deriveBiomes, deriveWaterDepth } from '@theandril/mapgen';
import { createArchive, applyRecordedCommand, replayArchive } from '../../chronicle/src/index';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getMovementQuery, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { hasRoadEdge, observeRoads, reconcileRoads, roadDirection } from './roads';
import { roadsCampaign } from '../../test-fixtures/src/roads-fixture';
import { indexes, rebuildIndexes, updateSight } from './visibility';

const issue = (game: GameState, command: GameCommand) => { const result = applyCommand(game, command); expect(result.ok, result.error).toBe(true); return result; };
const end = (game: GameState) => issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
/** Only the initial geography/army placement is authored. Founding, roads and
 * all subsequent sight changes cross the ordinary command/save boundaries. */
function observedRoadCampaign(scoutCell = 688): GameState {
  const game = createGame({ seed: 74, size: 'tiny', factionCount: 2, generatorVersion: 4 });
  const { world } = game;
  world.terrain.fill(3); world.fertility.fill(50);
  world.biome = deriveBiomes(world.seed, world.width, world.height, world.terrain, 4);
  world.waterDepth = deriveWaterDepth(world.width, world.height, world.terrain);
  world.starts = [492, 1016];
  for (const [index, faction] of game.factions.entries()) {
    game.explored[faction.id] = new Set();
    for (const army of Object.values(game.armies).filter(army => army.factionId === faction.id)) army.cell = world.starts[index]!;
  }
  game.armies['army.4']!.cell = scoutCell;
  rebuildIndexes(game);
  for (const [index, faction] of game.factions.entries()) issue(game, { type: 'found', factionId: faction.id, armyId: `army.${index * 2 + 1}`, name: index ? 'Distant Witness' : 'Old Hearth' });
  const id = `army.${game.nextId++}`;
  game.armies[id] = { id, factionId: game.turnOwnerId, name: 'Road founders', cell: 498, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
  indexes(game).armies.set(498, new Set([id])); updateSight(game, game.turnOwnerId, 498, 3, 1);
  issue(game, { type: 'found', factionId: game.turnOwnerId, armyId: id, name: 'High Crossing' });
  for (let turn = 0; !Object.keys(game.roads.projects).length && turn < 4; turn++) end(game);
  expect(Object.values(game.roads.projects)).toHaveLength(1);
  return deserializeGame(serializeGame(game));
}
describe('settlement road construction', () => {
  it('builds an actual continuous hill connection over time and survives a saved continuation', () => {
    const game = roadsCampaign(), project = Object.values(game.roads.projects)[0]!;
    expect(project.path).toHaveLength(7); expect(project.completed).toBe(0); expect(project.progress).toBe(1);
    const mirrored = deserializeGame(serializeGame(game));
    for (let turn = 0; turn < 24; turn++) { end(game); end(mirrored); }
    expect(project.completed).toBe(6); expect(project.progress).toBe(0);
    for (let i = 1; i < project.path.length; i++) expect(hasRoadEdge(project.path[i - 1]!, project.path[i]!, game.world.width, game.roads.edges[project.path[i - 1]!]!)).toBe(true);
    expect(stateHash(game)).toBe(stateHash(mirrored)); expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    expect(observeRoads(game, game.turnOwnerId)[0]).toMatchObject({ completed: 6, length: 6, nextCell: null, canAccelerate: false });
  });
  it('quotes and charges exactly the remaining work, records it, and replays the paid segment', () => {
    const game = roadsCampaign(), quote = observeRoads(game, game.turnOwnerId)[0]!, before = game.factions[0]!.treasury;
    expect(quote).toMatchObject({ progress: 1, required: 4, coinCost: 18, canAccelerate: true });
    const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
    const result = applyRecordedCommand(game, archive, { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: quote.settlementId });
    expect(result.ok).toBe(true); expect(game.factions[0]!.treasury).toBe(before - 18);
    expect(game.roads.projects[quote.settlementId]).toMatchObject({ completed: 1, progress: 0 });
    expect(result.events.map(event => event.type)).toEqual(['road_accelerated', 'road_segment_built']);
    expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  });
  it('refuses malformed, unfunded and foreign project orders without mutation', () => {
    const game = roadsCampaign(), project = Object.values(game.roads.projects)[0]!;
    game.factions[0]!.treasury = 0;
    for (const command of [
      { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId },
      { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: 'settlement.999' },
      { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId, coinCost: 0 },
    ]) { const before = serializeGame(game); expect(applyCommand(game, command).ok).toBe(false); expect(serializeGame(game)).toBe(before); }
  });
  it('pauses during occupation and resumes without consuming paused work', () => {
    const game = roadsCampaign(), project = Object.values(game.roads.projects)[0]!, initial = project.progress;
    game.settlements[project.settlementId]!.occupationTurns = 2;
    expect(observeRoads(game, game.turnOwnerId)[0]?.blocker).toMatch(/occupation/);
    end(game); end(game); expect(project.progress).toBe(initial);
    end(game); expect(project.progress).toBe(initial + 1);
  });
  it('only shows remembered road edges outside sight, refreshing them when a scout returns', () => {
    const game = observedRoadCampaign(), observerId = game.factions[1]!.id, project = Object.values(game.roads.projects)[0]!;
    const cell = project.path[0]!, next = project.path[1]!, bit = 1 << roadDirection(cell, next, game.world.width);
    const rememberedCell = (state: GameState) => getObservation(state, observerId).cells.find(item => item.cell === cell);
    expect(rememberedCell(game)).toMatchObject({ visible: true });
    issue(game, { type: 'move', factionId: observerId, armyId: 'army.4', target: 736 });
    expect(indexes(game).visible.get(observerId)?.has(cell)).toBe(false);
    expect(indexes(game).visible.get(observerId)?.has(next)).toBe(false);
    expect(rememberedCell(game)).toMatchObject({ visible: false });
    expect(rememberedCell(game)?.roadMask).toBeUndefined();
    const mirror = deserializeGame(serializeGame(game));
    const build: GameCommand = { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId };
    expect(issue(game, build)).toEqual(issue(mirror, build));
    expect(game.roads.edges[cell]).toBe(bit);
    for (const state of [game, mirror, deserializeGame(serializeGame(game))]) {
      const before = stateHash(state);
      expect(rememberedCell(state)).toMatchObject({ visible: false });
      expect(rememberedCell(state)?.roadMask).toBeUndefined();
      expect(getObservation(state, observerId).roads).toEqual([]);
      expect(getObservation(state, observerId).events.some(event => event.type.startsWith('road_'))).toBe(false);
      expect(stateHash(state)).toBe(before);
    }
    const returnOrder: GameCommand = { type: 'move', factionId: observerId, armyId: 'army.4', target: 688 };
    expect(issue(game, returnOrder)).toEqual(issue(mirror, returnOrder));
    expect(rememberedCell(game)).toMatchObject({ visible: true, roadMask: bit });
    expect(stateHash(game)).toBe(stateHash(mirror));
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });
  it('pauses for a foreign army at the work front without spending coin or progress, then resumes', () => {
    const game = observedRoadCampaign(497), project = Object.values(game.roads.projects)[0]!, observerId = game.factions[1]!.id;
    const quote = () => observeRoads(game, game.turnOwnerId)[0]!;
    expect(game.wars).toEqual([]);
    expect(quote()).toMatchObject({ canAccelerate: false, progress: 0 });
    expect(quote().blocker).toMatch(/foreign army/);
    const before = serializeGame(game), treasury = game.factions[0]!.treasury;
    const order: GameCommand = { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId };
    expect(applyCommand(game, order)).toMatchObject({ ok: false, error: 'A foreign army blocks the road work front.', events: [] });
    expect(serializeGame(game)).toBe(before); expect(game.factions[0]!.treasury).toBe(treasury);
    const mirror = deserializeGame(before);
    for (let turn = 0; turn < 3; turn++) {
      expect(end(game)).toEqual(end(mirror));
      expect(project).toMatchObject({ completed: 0, progress: 0 });
      expect(game.roads.edges).toEqual({});
    }
    const departure: GameCommand = { type: 'move', factionId: observerId, armyId: 'army.4', target: 545 };
    expect(issue(game, departure)).toEqual(issue(mirror, departure));
    expect(quote().canAccelerate).toBe(true);
    const cost = quote().coinCost, funds = game.factions[0]!.treasury;
    expect(issue(game, order)).toEqual(issue(mirror, order));
    expect(game.factions[0]!.treasury).toBe(funds - cost);
    expect(project).toMatchObject({ completed: 1, progress: 0 });
    expect(stateHash(game)).toBe(stateHash(mirror)); expect(game.wars).toEqual([]);
    expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
  });
  it('uses the same completed edge benefit for preview, direct movement and queued travel', () => {
    const game = roadsCampaign(), project = Object.values(game.roads.projects)[0]!;
    for (let turn = 0; turn < 24; turn++) end(game);
    const scout = game.armies['army.2']!, target = project.path[1]!;
    expect(getMovementQuery(getObservation(game, game.turnOwnerId), scout.id, target).preview).toMatchObject({ cost: 5, canMoveNow: true });
    const mirrored = deserializeGame(serializeGame(game)), movement = scout.movement;
    issue(game, { type: 'moveTo', factionId: game.turnOwnerId, armyId: scout.id, target });
    issue(mirrored, { type: 'queueMovement', factionId: mirrored.turnOwnerId, armyId: scout.id, target });
    expect(scout.cell).toBe(target); expect(scout.movement).toBe(movement - 5); expect(mirrored.armies[scout.id]?.cell).toBe(target); expect(mirrored.armies[scout.id]?.movement).toBe(scout.movement);
    end(game); const adjacent = project.path[2]!; const before = scout.movement;
    issue(game, { type: 'move', factionId: game.turnOwnerId, armyId: scout.id, target: adjacent }); expect(scout.movement).toBe(before - 1);
  });
  it('keeps completed physical roads but cancels projects when an endpoint is razed', () => {
    const game = roadsCampaign(), project = Object.values(game.roads.projects)[0]!;
    issue(game, { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId });
    const edges = structuredClone(game.roads.edges);
    delete game.settlements[project.targetId]; reconcileRoads(game);
    expect(game.roads.projects).toEqual({}); expect(game.roads.edges).toEqual(edges);
  });
  it('rejects checksum-valid asymmetric roads, impossible remembered roads and invalid work', () => {
    const game = roadsCampaign(), project = Object.values(game.roads.projects)[0]!;
    issue(game, { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId });
    for (const mutate of [
      (state: GameState) => { delete state.roads.edges[project.path[0]!]; },
      (state: GameState) => { state.roads.projects[project.settlementId]!.progress = 4; },
      (state: GameState) => { state.roads.known[game.turnOwnerId]![0] = 63; },
    ]) {
      const raw = JSON.parse(serializeGame(game)) as { stateChecksum: string; state: GameState };
      mutate(raw.state);
      raw.stateChecksum = checksum(JSON.stringify(raw.state));
      expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/roads|progress/);
    }
  });
  it('does not let rebuilding indexes repair corrupted visible road memory', () => {
    const game = roadsCampaign(), project = Object.values(game.roads.projects)[0]!;
    issue(game, { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId });
    game.roads.known[game.turnOwnerId] = {}; rebuildIndexes(game);
    expect(() => deserializeGame(serializeGame(game))).toThrow(/visible road memory/);
  });
});
