import { deriveWaterDepth } from '@theandril/mapgen';
import { createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { rebaseAuthoredLand } from './authored-land';

/** Authored two-island geography ONLY. Starting troops, coin, knowledge and progression
 * are unmodified new-game values; the remote island begins outside ordinary sight.
 * This fixture proves the expedition policy, not the quality of procedural geography. */
export function overseasCampaign(): GameState {
  const state = createGame({ seed: 20260906, size: 'tiny', factionCount: 1, pace: 'epic', generatorVersion: 4 });
  const world = state.world;
  world.terrain.fill(0); world.biome.fill(0); world.fertility.fill(0);
  for (const [left, right, top, bottom] of [[6, 12, 12, 18], [25, 35, 8, 24]]) {
    for (let y = top!; y <= bottom!; y++) for (let x = left!; x <= right!; x++) {
      const cell = y * world.width + x;
      world.terrain[cell] = 1; world.biome[cell] = 1; world.fertility[cell] = 65;
    }
  }
  world.waterDepth = deriveWaterDepth(world.width, world.height, world.terrain);
  const home = 16 * world.width + 12;
  world.starts = [home];
  for (const army of Object.values(state.armies)) army.cell = home;
  state.explored[state.turnOwnerId] = new Set();
  rebaseAuthoredLand(state);
  return deserializeGame(serializeGame(state));
}
