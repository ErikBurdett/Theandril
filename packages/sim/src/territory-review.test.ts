import { expect, test } from 'vitest';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getLandObservation, getObservation, serializeGame, stateHash } from './index';
import { indexes } from './visibility';

test('an out-of-range claim probe cannot reveal whether a fogged rival bought the target hex', () => {
  let game = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace: 'short' });
  for (const faction of game.factions) {
    const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
    expect(applyCommand(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: faction.name + ' Witness' }).ok).toBe(true);
    faction.treasury = 10_000;
  }
  const [player, rival] = game.factions;
  const ownTown = Object.values(game.settlements).find(town => town.factionId === player!.id)!;
  const rivalTown = Object.values(game.settlements).find(town => town.factionId === rival!.id)!;
  rivalTown.population = 3; // Explicit bounded setup unlocks the second claim ring.
  game = deserializeGame(serializeGame(game));
  const target = getLandObservation(game, rival!.id, indexes(game).visible.get(rival!.id)!).settlements[0]!.cells.find(cell =>
    cell.claim.canStart && !indexes(game).visible.get(player!.id)!.has(cell.cell) && hexDistance(cell.cell, ownTown.cell, game.world.width) > 3)!.cell;
  // The player charted the empty hex earlier but has no current sight of it.
  game.explored[player!.id]!.add(target);
  game = deserializeGame(serializeGame(game));
  const probe = { type: 'claimCell', factionId: player!.id, settlementId: ownTown.id, cell: target } as const;
  const before = stateHash(game), beforeView = getObservation(game, player!.id).cells.find(cell => cell.cell === target)!;
  const first = applyCommand(game, probe);
  expect(first.ok).toBe(false); expect(stateHash(game)).toBe(before);
  expect(applyCommand(game, { type: 'claimCell', factionId: rival!.id, settlementId: rivalTown.id, cell: target }).ok).toBe(true);
  expect(getObservation(game, player!.id).cells.find(cell => cell.cell === target)).toEqual(beforeView);
  const after = stateHash(game), second = applyCommand(game, probe);
  expect(second.ok).toBe(false); expect(stateHash(game)).toBe(after);
  expect(second).toEqual(first);
});
