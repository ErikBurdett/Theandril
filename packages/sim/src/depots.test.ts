import { describe, expect, it } from 'vitest';
import { applyCommand, applyCommandForVersion, createGame, getObservation } from './simulation';
import { DEPOT_COIN, DEPOT_SPACING, DEPOT_UPKEEP, depotsOf } from './depots';
import { armySupply, suppliedCells, SUPPLY_BUDGET, SUPPLY_OPEN_COST } from './supply';
import { deserializeGame, serializeGame, SAVE_VERSION, stateHash } from './save';
import { cellsWithin, rebuildIndexes } from './visibility';
import type { GameCommand, GameState } from './types';

const run = (state: GameState, command: GameCommand): void => { const result = applyCommand(state, command); expect(result.error ?? 'ok').toBe('ok'); };
const reach = SUPPLY_BUDGET / SUPPLY_OPEN_COST;

/** One hearth on clear ground, and a company standing just beyond its reach. */
function start(): { state: GameState; townCell: number; armyId: string } {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'standard', factionCount: 2, pace: 'standard' });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, reach + 6)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  state.explored[state.turnOwnerId] = new Set(state.world.terrain.keys());
  run(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Depot Hearth' });
  const townCell = Object.values(state.settlements)[0]!.cell;
  const armyId = Object.values(state.armies).find(army => army.factionId === state.turnOwnerId)!.id;
  state.armies[armyId]!.cell = [...cellsWithin(state, townCell, reach + 2)].find(cell => !cellsWithin(state, townCell, reach).includes(cell))!;
  state.factions[0]!.treasury = 500;
  return { state: deserializeGame(serializeGame(state)), townCell, armyId };
}

describe('supply depots', () => {
  it('extends supply where it is raised, costs upkeep, and survives a save', () => {
    const { state, armyId } = start();
    const factionId = state.turnOwnerId;
    expect(suppliedCells(state, factionId).has(state.armies[armyId]!.cell)).toBe(false);

    const treasury = state.factions[0]!.treasury;
    run(state, { type: 'buildDepot', factionId, armyId });
    expect(state.factions[0]!.treasury).toBe(treasury - DEPOT_COIN);
    expect(state.armies[armyId]!.movement).toBe(0);
    expect(depotsOf(state, factionId).map(depot => depot.cell)).toEqual([state.armies[armyId]!.cell]);
    // The ground it stands on, and the ring around it, are now fed.
    const supplied = suppliedCells(state, factionId);
    expect(supplied.has(state.armies[armyId]!.cell)).toBe(true);
    expect(armySupply(state, armyId).reason).toContain('Supplied from the depot at hex');

    const save = serializeGame(state);
    expect(JSON.parse(save).version).toBe(SAVE_VERSION);
    const loaded = deserializeGame(save);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(serializeGame(loaded)).toBe(save);
    expect(loaded.depots).toEqual(state.depots);

    const view = getObservation(state, factionId);
    expect(view.depotCoinCost).toBe(DEPOT_COIN);
    expect(view.depots).toEqual(state.depots);
    expect(view.suppliedCells).toContain(state.armies[armyId]!.cell);
    expect(applyCommandForVersion(state, { type: 'buildDepot', factionId, armyId }, 27).error).toContain('Malformed command');

    // Rules 29: the realm can pull its own depot down and stop paying for it.
    const cellHere = state.depots[0]!.cell;
    expect(applyCommand(state, { type: 'abandonDepot', factionId, cell: cellHere + 1 }).error).toBe('You hold no depot on that hex.');
    run(state, { type: 'abandonDepot', factionId, cell: cellHere });
    expect(state.depots).toEqual([]);
    expect(suppliedCells(state, factionId).has(state.armies[armyId]!.cell)).toBe(false);
    expect(applyCommandForVersion(state, { type: 'abandonDepot', factionId, cell: cellHere }, 28).error).toContain('Malformed command');
  });

  it('refuses a second depot beside the first, a hearth hex, a spent company and an empty purse', () => {
    const { state, townCell, armyId } = start();
    const factionId = state.turnOwnerId;
    run(state, { type: 'buildDepot', factionId, armyId });
    expect(applyCommand(state, { type: 'buildDepot', factionId, armyId }).error).toBe('This company has already spent its movement this turn.');

    state.armies[armyId]!.movement = 2;
    expect(applyCommand(state, { type: 'buildDepot', factionId, armyId }).error).toBe('A depot already stands here.');

    const near = [...cellsWithin(state, state.armies[armyId]!.cell, DEPOT_SPACING - 1)].find(cell => cell !== state.armies[armyId]!.cell)!;
    state.armies[armyId]!.cell = near;
    expect(applyCommand(state, { type: 'buildDepot', factionId, armyId }).error).toContain(`stand at least ${DEPOT_SPACING} hexes apart`);

    state.armies[armyId]!.cell = townCell;
    expect(applyCommand(state, { type: 'buildDepot', factionId, armyId }).error).toBe('A hearth already supplies this ground.');

    state.armies[armyId]!.cell = [...cellsWithin(state, townCell, reach + 5)].find(cell => !cellsWithin(state, townCell, reach + 3).includes(cell))!;
    state.factions[0]!.treasury = DEPOT_COIN - 1;
    expect(applyCommand(state, { type: 'buildDepot', factionId, armyId }).error).toBe(`A depot costs ${DEPOT_COIN} coin.`);
  });

  it('charges its upkeep every turn and is pulled down by an enemy that walks onto it', () => {
    const { state, armyId } = start();
    const factionId = state.turnOwnerId;
    // The same turn, played with and without the depot, differs by exactly what
    // the depot cost to raise and what it costs to keep.
    const without = deserializeGame(serializeGame(state));
    run(state, { type: 'buildDepot', factionId, armyId });
    const depotCell = state.depots[0]!.cell;
    run(without, { type: 'endTurn', factionId: without.turnOwnerId });
    run(state, { type: 'endTurn', factionId: state.turnOwnerId });
    expect(without.factions[0]!.treasury - state.factions[0]!.treasury).toBe(DEPOT_COIN + DEPOT_UPKEEP);

    // A rival that walks onto it pulls it down at the end of the turn.
    const raider = deserializeGame(serializeGame(state));
    const rival = raider.factions.find(item => item.id !== factionId)!.id;
    const enemy = Object.values(raider.armies).find(army => army.factionId === rival)!;
    enemy.cell = depotCell;
    raider.wars.push([factionId, rival].sort() as [string, string]);
    rebuildIndexes(raider);
    expect(raider.depots).toHaveLength(1);
    run(raider, { type: 'endTurn', factionId: raider.turnOwnerId });
    expect(raider.depots).toEqual([]);
    expect(raider.events.some(event => event.type === 'depot_razed')).toBe(true);
  });
});
