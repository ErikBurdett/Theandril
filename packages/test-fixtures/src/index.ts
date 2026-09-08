import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { UNITS } from '@theandril/content';

export { navalCampaign, NAVAL_FIXTURE } from './naval-fixture';

/** Synthetic mature starting position; subsequent turns use the unmodified rules and AI. */
export function matureCampaign(size: 'huge' | 'legendary'): GameState {
  const count = size === 'huge' ? 32 : 40;
  const totalArmies = size === 'huge' ? 1500 : 4000;
  const state = createGame({ seed: 20260905, size, factionCount: count, generatorVersion: 4 });
  for (const faction of state.factions) {
    const colonist = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'));
    if (!colonist) throw new Error('Fixture has no caravan');
    const result = applyCommand(state, { type: 'found', factionId: faction.id, armyId: colonist.id, name: faction.name + ' Hold' });
    if (!result.ok) throw new Error(result.error);
    faction.treasury = 100_000;
  }
  const guard = UNITS.find(unit => unit.id === 'unit.guard');
  if (!guard) throw new Error('Fixture has no guard definition');
  const initialArmyCount = Object.keys(state.armies).length;
  for (let i = initialArmyCount; i < totalArmies; i++) {
    const factionIndex = i % count;
    const faction = state.factions[factionIndex]!;
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId: faction.id, name: guard.name, cell: state.world.starts[factionIndex]!, movement: guard.movement, formations: [createArmyFormation(id, guard.id)] };
  }
  // Test setup crosses the same validated snapshot boundary as scenario imports and restores caches.
  return deserializeGame(serializeGame(state));
}
