import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, deserializeGame, getSettlementLandObservation, serializeGame, type GameState } from '@theandril/sim';
import { rebaseAuthoredLand, refreshAuthoredSight } from './authored-land';
import { matureCampaign } from './index';

/** Synthetic ownership/population, not earned conquest. Land purchases use real commands. */
export function empireLandCampaign(size: 'huge' | 'legendary', fullyExplored = false): GameState {
  const game = matureCampaign(size), owner = game.turnOwnerId;
  const towns = Object.values(game.settlements).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const centers = new Set(towns.map(town => town.cell));
  const occupied = new Map(Object.values(game.armies).map(army => [army.cell, army.factionId]));
  const destinations = new Map<number, number>();
  for (const army of Object.values(game.armies)) {
    if (army.factionId === owner || !centers.has(army.cell)) continue;
    let target = destinations.get(army.cell);
    if (target === undefined) {
      target = neighbors(army.cell, game.world.width, game.world.height).find(cell => !centers.has(cell)
        && isPassable(game.world.terrain[cell]!) && (!occupied.has(cell) || occupied.get(cell) === army.factionId));
      if (target === undefined) throw new Error('Empire fixture has no legal former-garrison destination.');
      destinations.set(army.cell, target); occupied.set(target, army.factionId);
    }
    army.cell = target;
  }
  for (const town of towns) { town.factionId = owner; town.population = 8; town.food = 1_000; }
  rebaseAuthoredLand(game);
  for (const town of towns) {
    // Purchase the connected radius ring by ring using newly quoted legal options.
    for (let count = 0; count < 30; count++) {
      const detail = getSettlementLandObservation(game, owner, town.id);
      const target = detail?.cells.find(cell => cell.claim.canStart);
      if (!target) break;
      const result = applyCommand(game, { type: 'claimCell', factionId: owner, settlementId: town.id, cell: target.cell });
      if (!result.ok) throw new Error(result.error);
    }
    const detail = getSettlementLandObservation(game, owner, town.id);
    const workers = detail?.cells.filter(cell => cell.canWork).slice(0, 6).map(cell => cell.cell) ?? [];
    const result = applyCommand(game, { type: 'setWorkedTiles', factionId: owner, settlementId: town.id, cells: workers });
    if (!result.ok) throw new Error(result.error);
  }
  if (fullyExplored) game.explored[owner] = new Set(Array.from({ length: game.world.terrain.length }, (_, cell) => cell));
  refreshAuthoredSight(game);
  return deserializeGame(serializeGame(game));
}
