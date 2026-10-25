import { applyCommand, createGame, deserializeGame, serializeGame, type GameCommand } from '@theandril/sim';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';

/** Authored open land and initial placement, not a played conquest. All orders
 * use canonical commands and the resulting import crosses strict save loading. */
export function postingTargetsScene(kind: 'moving' | 'posting' | 'muster') {
  let game = createGame({ generatorVersion: 4, seed: 17, size: 'tiny', factionCount: 1, pace: 'standard' });
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.waterDepth.fill(0); game.world.fertility.fill(60);
  game.resources.deposits = {};
  const factionId = game.turnOwnerId, armyId = 'army.2', hearthCell = 490;
  Object.assign(game.armies['army.1']!, { cell: hearthCell });
  Object.assign(game.armies[armyId]!, { cell: 500, name: 'Target scouts' });
  game.explored[factionId] = new Set(game.world.terrain.keys());
  game.factions[0]!.treasury = 2000;
  refreshAuthoredSight(game);
  const issue = (command: GameCommand) => {
    const result = applyCommand(game, command);
    if (!result.ok) throw new Error(`Invalid authored posting-target setup: ${result.error}`);
  };
  issue({ type: 'found', factionId, armyId: 'army.1', name: 'Target Hearth' });
  const settlementId = Object.values(game.settlements).find(town => town.cell === hearthCell)!.id;
  if (kind === 'posting') {
    issue({ type: 'setPosting', factionId, armyId, cell: 0, mode: 'hold' });
    issue({ type: 'queueMovement', factionId, armyId, target: 514 });
    if (!game.routes[armyId]) throw new Error('The authored posting case must retain an unfinished ordinary route.');
  }
  if (kind === 'muster') issue({ type: 'setMuster', factionId, settlementId, cell: 0 });
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  return { game, factionId, armyId, settlementId, hearthCell, initialCell: game.armies[armyId]!.cell };
}
