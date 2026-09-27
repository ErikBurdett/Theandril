import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { refreshAuthoredSight } from './authored-land';

/** Explicit authored open-land garrison exercise; not an organically earned realm. */
export function theaterCampaign(count = 6): GameState {
  const state = createGame({ seed: 20260927, size: 'tiny', factionCount: 2, generatorVersion: 4 });
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.waterDepth.fill(0); state.world.fertility.fill(60);
  state.resources.deposits = {};
  state.armies = {}; state.factions[0]!.treasury = 100000;
  state.explored[state.turnOwnerId] = new Set(state.world.terrain.keys());
  for (const [cell, name] of [[500, 'West watch'], [510, 'East watch']] as const) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId: state.turnOwnerId, name: 'Authored founding caravan', cell, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
    refreshAuthoredSight(state);
    const result = applyCommand(state, { type: 'found', factionId: state.turnOwnerId, armyId: id, name });
    if (!result.ok) throw new Error(result.error);
  }
  for (let i = 0; i < count; i++) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId: state.turnOwnerId, name: `Watch company ${i + 1}`, cell: 495, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
  }
  refreshAuthoredSight(state);
  return deserializeGame(serializeGame(state));
}
