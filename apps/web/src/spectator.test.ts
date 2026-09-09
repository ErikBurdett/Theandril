import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { getSpectatorObservation } from '../../../packages/sim/src/spectator';

describe('pure spectator map projection', () => {
  it('reveals actual map positions without revealing private read models or changing sight/saves', () => {
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 4, pace: 'short' });
    for (const faction of game.factions) {
      const caravan = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
      expect(applyCommand(game, { type: 'found', factionId: faction.id, armyId: caravan.id, name: faction.name + ' haven' }).ok).toBe(true);
    }
    const before = serializeGame(game), hash = stateHash(game), normal = getObservation(game, game.turnOwnerId);
    const map = getSpectatorObservation(game, game.turnOwnerId);
    expect(map.cells).toHaveLength(game.world.terrain.length);
    expect(map.cells.every(cell => cell.visible)).toBe(true);
    expect(map.cells.length).toBeGreaterThan(normal.cells.length);
    expect(map.settlements).toHaveLength(4);
    expect(map.factions).toHaveLength(4);
    expect(Object.keys(map).sort()).toEqual(['armies', 'cells', 'factionId', 'factions', 'height', 'land', 'ruins', 'settlements', 'wars', 'width']);
    for (const army of map.armies) {
      expect(Object.keys(army).sort()).toEqual(['carrierId', 'cell', 'domain', 'factionId', 'formationCount', 'id', 'name', 'unitId']);
      expect(army.formationCount).toBe(game.armies[army.id]!.formations.length);
    }
    for (const town of map.settlements) {
      // Completed visible infrastructure drives the map districts. Private
      // production orders, food and tile-work queues remain absent.
      expect(Object.keys(town).sort()).toEqual(['buildings', 'cell', 'factionId', 'id', 'name', 'population']);
      expect(town.buildings).toEqual([...game.settlements[town.id]!.buildings].sort());
      town.buildings!.push('building.archive');
    }
    map.cells[0]!.biome = 10; map.factions[0]!.name = 'Detached'; map.armies[0]!.name = 'Detached'; map.settlements[0]!.name = 'Detached';
    expect(serializeGame(game)).toBe(before); expect(stateHash(game)).toBe(hash);
    expect(getObservation(game, game.turnOwnerId)).toEqual(normal);
    expect(() => getSpectatorObservation(game, 'faction.missing')).toThrow('Unknown spectator faction');
  });
});
