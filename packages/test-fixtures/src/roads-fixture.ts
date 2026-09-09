import { deriveBiomes, deriveWaterDepth } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { rebuildIndexes, updateSight } from '../../sim/src/visibility';

/** Authored hill corridor: roads are built by ordinary turns/orders, never injected. */
export function roadsCampaign(): GameState {
  const game = createGame({ seed: 74, size: 'tiny', factionCount: 1, generatorVersion: 4 });
  const start = 492, destination = 498, world = game.world;
  game.resources.deposits = {}; // This fixture replaces the entire physical geography with resource-free authored land/water.
  world.terrain.fill(3); world.fertility.fill(50);
  world.biome = deriveBiomes(world.seed, world.width, world.height, world.terrain, 4);
  world.waterDepth = deriveWaterDepth(world.width, world.height, world.terrain);
  world.starts = [start];
  for (const army of Object.values(game.armies)) army.cell = start;
  game.explored[game.turnOwnerId] = new Set(); rebuildIndexes(game);
  const issue = (command: GameCommand) => { const result = applyCommand(game, command); if (!result.ok) throw new Error('Road fixture: ' + result.error); };
  issue({ type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Old Hearth' });
  const id = `army.${game.nextId++}`;
  game.armies[id] = { id, factionId: game.turnOwnerId, name: 'Road founders', cell: destination, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
  updateSight(game, game.turnOwnerId, destination, 3, 1); rebuildIndexes(game);
  issue({ type: 'found', factionId: game.turnOwnerId, armyId: id, name: 'High Crossing' });
  for (let turn = 0; !Object.keys(game.roads.projects).length && turn < 4; turn++) issue({ type: 'endTurn', factionId: game.turnOwnerId });
  if (!Object.keys(game.roads.projects).length) throw new Error('Road fixture failed to survey connection.');
  return deserializeGame(serializeGame(game));
}
