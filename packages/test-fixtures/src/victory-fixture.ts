import { BUILDINGS } from '@theandril/content';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { applyCommandForVersion, createGame, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';

export const PROSPERITY_FIXTURE = { hostName: 'Ledger Hearth', hostId: 'settlement.5', seed: 20260905 } as const;

/** Shortest known land route to a legally separated new hearth; used only during scenario setup. */
function expansionRoute(state: GameState, origin: number): number[] {
  const parents = new Map<number, number | null>([[origin, null]]);
  const queue = [origin];
  for (let index = 0; index < queue.length; index++) {
    const cell = queue[index]!;
    if (Object.values(state.settlements).every(town => hexDistance(cell, town.cell, state.world.width) >= 4)) {
      const path: number[] = [];
      let next: number | null = cell;
      while (next !== null && next !== origin) { path.unshift(next); next = parents.get(next) ?? null; }
      return path;
    }
    for (const next of neighbors(cell, state.world.width, state.world.height)) {
      if (!parents.has(next) && isPassable(state.world.terrain[next]!) && hexDistance(next, origin, state.world.width) <= 12) {
        parents.set(next, cell); queue.push(next);
      }
    }
  }
  throw new Error('Prosperity fixture has no connected expansion route.');
}

/** Prepared infrastructure, not a fabricated victory: every later choice/project uses normal rules. */
export function prosperityCampaign(): GameState {
  const state = createGame({ seed: PROSPERITY_FIXTURE.seed, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4, rosterVersion: 3 });
  const issue = (command: GameCommand): void => {
    // Freeze authored setup before roads; subsequent gameplay uses current rules.
    const result = applyCommandForVersion(state, command, 11);
    if (!result.ok) throw new Error('Prosperity fixture command failed: ' + result.error);
  };
  const advance = (): void => issue({ type: 'endTurn', factionId: state.turnOwnerId });
  for (const faction of state.factions) {
    const army = Object.values(state.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'));
    if (!army) throw new Error('Prosperity fixture needs its founding caravans.');
    issue({ type: 'found', factionId: faction.id, armyId: army.id, name: faction.id === state.turnOwnerId ? PROSPERITY_FIXTURE.hostName : 'Reedbound Hold' });
  }
  const host = state.settlements[PROSPERITY_FIXTURE.hostId];
  if (!host) throw new Error('Prosperity fixture is missing its host.');
  for (const name of ['Kiln Ward', 'Commons Reach']) {
    issue({ type: 'queue', factionId: state.turnOwnerId, settlementId: host.id, itemId: 'unit.colonist' });
    let caravan = Object.values(state.armies).find(army => army.factionId === state.turnOwnerId && army.formations.some(item => item.unitId === 'unit.colonist'));
    for (let wait = 0; !caravan && wait < 8; wait++) {
      advance(); caravan = Object.values(state.armies).find(army => army.factionId === state.turnOwnerId && army.formations.some(item => item.unitId === 'unit.colonist'));
    }
    if (!caravan) throw new Error('Prosperity fixture could not recruit a caravan.');
    for (const target of expansionRoute(state, caravan.cell)) {
      const cost = state.world.terrain[target] === 2 || state.world.terrain[target] === 3 ? 2 : 1;
      if (caravan.movement < cost) advance();
      issue({ type: 'move', factionId: state.turnOwnerId, armyId: caravan.id, target });
    }
    if (caravan.movement < 1) advance();
    issue({ type: 'found', factionId: state.turnOwnerId, armyId: caravan.id, name });
  }
  for (const town of Object.values(state.settlements)) if (town.factionId === state.turnOwnerId) town.buildings = BUILDINGS.filter(building => !building.coastalOnly).map(building => building.id);
  const player = state.factions.find(faction => faction.id === state.turnOwnerId)!;
  player.treasury = 300; player.knowledge = 64;
  // Only readiness is authored. Technology, institutions, doctrines, projects and victory stay untouched.
  return deserializeGame(serializeGame(state));
}
