import { UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, deserializeGame, serializeGame, type GameState } from '@theandril/sim';

/** Local authored-scenario sight only; this is never exposed as a runtime mutation API. */
function revealLocal(state: GameState, factionId: string, origin: number, radius: number): void {
  const explored = state.explored[factionId];
  if (!explored) throw new Error('Border fixture is missing faction exploration.');
  const visited = new Set([origin]);
  let frontier = [origin];
  for (let distance = 0; distance < radius; distance++) {
    const next: number[] = [];
    for (const cell of frontier) {
      for (const adjacent of neighbors(cell, state.world.width, state.world.height)) {
        if (!visited.has(adjacent)) { visited.add(adjacent); next.push(adjacent); }
      }
    }
    frontier = next;
  }
  for (const cell of visited) explored.add(cell);
}

/** A peaceful border encounter; subsequent war and battle outcomes use real campaign commands. */
export function borderBattleCampaign(): GameState {
  const state = createGame({ seed: 20260905, size: 'tiny', factionCount: 2 });
  const names = ['Ashen Hearth', 'Reedbound Hold'];
  for (const [index, faction] of state.factions.entries()) {
    const colonist = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'));
    if (!colonist) throw new Error('Border fixture has no founding caravan.');
    const result = applyCommand(state, { type: 'found', factionId: faction.id, armyId: colonist.id, name: names[index]! });
    if (!result.ok) throw new Error('Cannot found border fixture settlement: ' + result.error);
  }
  const guard = UNITS.find(unit => unit.id === 'unit.guard');
  if (!guard) throw new Error('Border fixture has no guard definition.');
  const armies = state.factions.map(faction => Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.scout')));
  const player = armies[0];
  const enemy = armies[1];
  if (!player || !enemy) throw new Error('Border fixture requires both starting scouts.');
  const towns = new Set(Object.values(state.settlements).map(town => town.cell));
  const land = (cell: number): boolean => isPassable(state.world.terrain[cell]!) && !towns.has(cell);
  const playerCell = neighbors(player.cell, state.world.width, state.world.height).find(land);
  if (playerCell === undefined) throw new Error('Border fixture has no player deployment hex.');
  const enemyCell = neighbors(playerCell, state.world.width, state.world.height).find(land);
  if (enemyCell === undefined) throw new Error('Border fixture has no adjacent enemy deployment hex.');
  for (const [army, cell, name] of [[player, playerCell, 'Ashen Vanguard'], [enemy, enemyCell, 'Reedbound Watch']] as const) {
    Object.assign(army, { cell, name, movement: guard.movement, formations: [createArmyFormation(army.id, guard.id)] });
    revealLocal(state, army.factionId, army.cell, guard.sight);
  }
  for (const town of Object.values(state.settlements)) revealLocal(state, town.factionId, town.cell, 3);
  // Validate the complete authored position and restore canonical spatial/visibility caches.
  return deserializeGame(serializeGame(state));
}
