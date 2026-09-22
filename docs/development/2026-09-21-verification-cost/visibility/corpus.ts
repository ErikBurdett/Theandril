import { createHash } from 'node:crypto';
import { createGame, serializeGame, type GameState } from '../../../../packages/sim/src/index';
import { indexes, updateSight } from '../../../../packages/sim/src/visibility';
import { withRules, type RulesVersion } from '../../../../packages/sim/src/rules';

export const versions = [4, 8, 9, 11, 12, 15, 16, 17] as const;
export const cases = [
  { name: 'corner-zero', origin: 0, radius: 0 },
  { name: 'corner-three', origin: 0, radius: 3 },
  { name: 'edge-two', origin: 47, radius: 2 },
  { name: 'interior-three', origin: 748, radius: 3 },
] as const;
// Pure visibility lifecycle fixtures: generated modern geography, selected
// historical update gates. These are not earned campaigns or old save fixtures.
export function makeGame(): GameState { return createGame({ seed: 20260905, size: 'tiny', factionCount: 4 }); }
export function capture(game: GameState): object {
  const index = indexes(game);
  return {
    visible: [...index.visible].map(([owner, cells]) => [owner, [...cells].sort(([a], [b]) => a - b)]),
    explored: Object.entries(game.explored).map(([owner, cells]) => [owner, [...cells].sort((a, b) => a - b)]),
    land: game.land.known, roads: game.roads.known,
  };
}
export const digest = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function lifecycle(version: RulesVersion, origin: number, radius: number): string[] {
  const game = makeGame(), owner = game.turnOwnerId;
  const snapshots = [digest(capture(game))];
  withRules(game, version, () => {
    // Two overlapping sources, departure of one, and final departure. Visibility
    // counters must not disappear early, and remembered/explored cells must stay.
    for (const delta of [1, 1, -1, -1] as const) {
      updateSight(game, owner, origin, radius, delta);
      snapshots.push(digest(capture(game)));
    }
  });
  snapshots.push(digest(serializeGame(game)));
  return snapshots;
}
