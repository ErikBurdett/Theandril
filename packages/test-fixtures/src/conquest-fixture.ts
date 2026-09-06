import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { deserializeGame, serializeGame, type GameState } from '@theandril/sim';
import { borderBattleCampaign } from './combat-fixture';

export const CONQUEST_FIXTURE = {
  playerArmyId: 'army.2', settlementId: 'settlement.6',
  playerFactionId: 'faction.ashen_compact', enemyFactionId: 'faction.reedbound_council',
  playerArmyName: 'Ashen Vanguard', settlementName: 'Reedwatch',
} as const;

function reveal(state: GameState, factionId: string, origin: number, radius: number): void {
  const explored = state.explored[factionId];
  if (!explored) throw new Error('Conquest fixture has no faction exploration.');
  const seen = new Set([origin]);
  let frontier = [origin];
  for (let ring = 0; ring < radius; ring++) {
    const next: number[] = [];
    for (const cell of frontier) for (const adjacent of neighbors(cell, state.world.width, state.world.height)) {
      if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); }
    }
    frontier = next;
  }
  for (const cell of seen) explored.add(cell);
}

/** Authored peaceful siege scenario; all conquest, diplomacy and aftermath use actual commands. */
export function conquestCampaign(): GameState {
  const state = borderBattleCampaign();
  const player = state.armies[CONQUEST_FIXTURE.playerArmyId];
  const town = state.settlements[CONQUEST_FIXTURE.settlementId];
  const home = Object.values(state.settlements).find(settlement => settlement.factionId === state.turnOwnerId);
  if (!player || !town || !home) throw new Error('Conquest fixture is missing its border-campaign entities.');
  const candidates = [player.cell, ...neighbors(player.cell, state.world.width, state.world.height)]
    .filter(cell => isPassable(state.world.terrain[cell]!) && cell !== home.cell);
  let deployment: { army: number; town: number } | undefined;
  for (const cell of candidates) {
    const target = neighbors(cell, state.world.width, state.world.height).find(target =>
      isPassable(state.world.terrain[target]!) && hexDistance(home.cell, target, state.world.width) >= 3);
    if (target !== undefined) { deployment = { army: cell, town: target }; break; }
  }
  if (!deployment) throw new Error('Conquest fixture cannot place adjacent forces with legal town spacing.');
  player.cell = deployment.army;
  town.cell = deployment.town;
  town.name = CONQUEST_FIXTURE.settlementName;
  town.population = 2;
  town.buildings = ['building.granary', 'building.workshop'];
  // The target is defended by real siege militia; no roaming enemy can interrupt the browser scenario.
  for (const army of Object.values(state.armies)) if (army.factionId !== state.turnOwnerId) delete state.armies[army.id];
  reveal(state, player.factionId, player.cell, 2);
  for (const settlement of Object.values(state.settlements)) reveal(state, settlement.factionId, settlement.cell, 3);
  return deserializeGame(serializeGame(state));
}
