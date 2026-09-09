import { expect, test } from 'vitest';
import { RESOURCES, RESOURCE_IMPROVEMENTS, checksum } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { createResources, resourceObservation, settlementResourceYield } from './resources';
import { rebuildIndexes } from './visibility';

const issue = (game: GameState, command: GameCommand) => { const result = applyCommand(game, command); expect(result.ok, result.error).toBe(true); return result; };
function grainHearth() {
  const game = createGame({ seed: 17, size: 'tiny', factionCount: 1, pace: 'epic' });
  const deposit = Number(Object.entries(game.resources.deposits).find(([cell, id]) => id === 'resource.grain' && neighbors(Number(cell), game.world.width, game.world.height).some(next => isPassable(game.world.terrain[next]!)))![0]);
  const center = neighbors(deposit, game.world.width, game.world.height).find(cell => isPassable(game.world.terrain[cell]!))!;
  // The fixture relocates the two starting forces beside a genuine generated
  // deposit. Its terrain, resource layer and all subsequent spending are real.
  for (const army of Object.values(game.armies)) army.cell = center;
  rebuildIndexes(game);
  const factionId = game.turnOwnerId;
  issue(game, { type: 'found', factionId, armyId: 'army.1', name: 'Grain witness' });
  const town = Object.values(game.settlements)[0]!;
  return { game, deposit, town, factionId };
}
test('resource generation is deterministic, seed-sensitive and bound to suitable physical ecology', () => {
  const a = createGame({ seed: 17, size: 'standard', factionCount: 4 }), b = createGame({ seed: 18, size: 'standard', factionCount: 4 });
  expect(createResources(a.world, a.factions.map(f => f.id))).toEqual(a.resources);
  expect(checksum(JSON.stringify(a.resources.deposits))).not.toBe(checksum(JSON.stringify(b.resources.deposits)));
  expect(Object.keys(a.resources.deposits).length).toBeGreaterThan(100);
  expect(new Set(Object.values(a.resources.deposits)).size).toBe(8);
  for (const [cell, id] of Object.entries(a.resources.deposits)) {
    const definition = RESOURCES.find(item => item.id === id)!;
    expect(definition.terrainIds).toContain(a.world.terrain[Number(cell)]);
    if (definition.biomeIds) expect(definition.biomeIds).toContain(a.world.biome[Number(cell)]);
    expect(a.world.waterDepth[Number(cell)]).not.toBe(2);
  }
  expect(RESOURCE_IMPROVEMENTS).toHaveLength(8);
});
test('completed paid extraction needs a worker; save continuation and market contracts preserve actual stocks', () => {
  const { game, deposit, town, factionId } = grainHearth();
  const land = getSettlementLandObservation(game, factionId, town.id)!;
  expect(land.claimed).toContain(deposit);
  expect(land.cells.find(cell => cell.cell === deposit)?.resourceId).toBe('resource.grain');
  const coin = game.factions[0]!.treasury;
  issue(game, { type: 'improveTile', factionId, settlementId: town.id, cell: deposit, improvementId: 'improvement.grange' });
  const quote = land.cells.find(cell => cell.cell === deposit)!.improvementOptions.find(item => item.improvementId === 'improvement.grange')!;
  expect(game.factions[0]!.treasury).toBe(coin - quote.coinCost);
  const end = () => issue(game, { type: 'endTurn', factionId });
  while (game.land.settlements[town.id]!.work) end();
  end(); expect(game.resources.stockpiles[factionId]?.['resource.grain'] ?? 0).toBe(0);
  issue(game, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [deposit] });
  expect(settlementResourceYield(game, town)).toEqual({ 'resource.grain': 3 });
  let mirror = deserializeGame(serializeGame(game));
  const step = () => { const command = { type: 'endTurn', factionId } as const; expect(issue(game, command)).toEqual(issue(mirror, command)); expect(stateHash(game)).toBe(stateHash(mirror)); };
  step(); expect(game.resources.stockpiles[factionId]?.['resource.grain']).toBe(3);
  const queued = { type: 'queue', factionId, settlementId: town.id, itemId: 'building.market' } as const;
  issue(game, queued); issue(mirror, queued);
  while (town.queue.length) step();
  const amount = 2, beforeStock = game.resources.stockpiles[factionId]!['resource.grain']!, beforeCoin = game.factions[0]!.treasury;
  const sell = { type: 'sellResource', factionId, settlementId: town.id, resourceId: 'resource.grain', amount } as const;
  expect(issue(game, sell)).toEqual(issue(mirror, sell));
  expect(game.resources.stockpiles[factionId]!['resource.grain']).toBe(beforeStock - amount);
  expect(game.factions[0]!.treasury).toBe(beforeCoin + 4);
  expect(stateHash(game)).toBe(stateHash(mirror));
  const saved = serializeGame(game); expect(applyCommand(game, { ...sell, amount: 999999 }).ok).toBe(false); expect(serializeGame(game)).toBe(saved);
  const stop: GameCommand = { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [] }; issue(game, stop);
  mirror = deserializeGame(serializeGame(game)); const stock = game.resources.stockpiles[factionId]!['resource.grain']; step(); expect(game.resources.stockpiles[factionId]!['resource.grain']).toBe(stock);
});
test('deposits stay hidden until charted and observations cannot alter stockpiles', () => {
  const game = createGame({ seed: 17, size: 'standard', factionCount: 2 }), id = game.turnOwnerId;
  const view = getObservation(game, id), before = serializeGame(game);
  expect(view.cells.every(cell => !cell.resourceId || game.explored[id]!.has(cell.cell) && game.resources.deposits[cell.cell] === cell.resourceId)).toBe(true);
  expect(view.cells.filter(cell => cell.resourceId).length).toBeLessThan(Object.keys(game.resources.deposits).length);
  view.resources!.stockpiles[0]!.amount = 1000;
  expect(serializeGame(game)).toBe(before);
});
test('ordinary land cannot accept extraction without its deposit, and occupation suspends output', () => {
  const { game, town, factionId, deposit } = grainHearth();
  const bare = game.land.settlements[town.id]!.claimed.find(cell => cell !== town.cell && !game.resources.deposits[cell])!;
  const saved = serializeGame(game);
  expect(applyCommand(game, { type: 'improveTile', factionId, settlementId: town.id, cell: bare, improvementId: 'improvement.grange' }).ok).toBe(false);
  expect(serializeGame(game)).toBe(saved);
  game.land.settlements[town.id]!.worked = [deposit]; game.land.settlements[town.id]!.improvements[deposit] = 'improvement.grange';
  expect(resourceObservation(game, factionId).stockpiles.find(item => item.resourceId === 'resource.grain')!.perTurn).toBe(3);
  town.occupationTurns = 2; expect(settlementResourceYield(game, town)).toEqual({});
  const invalid = JSON.parse(saved); invalid.state.resources.deposits['999999'] = 'resource.grain'; invalid.stateChecksum = checksum(JSON.stringify(invalid.state));
  expect(() => deserializeGame(JSON.stringify(invalid))).toThrow('Invalid resource deposit');
});
