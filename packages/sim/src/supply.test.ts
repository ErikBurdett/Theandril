import { describe, expect, it } from 'vitest';
import { UNITS } from '@theandril/content';
import { hexDistance, neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, getObservation } from './simulation';
import { createArmyFormation } from './army-composition';
import { armySupply, suppliedCells, SUPPLY_ATTRITION, SUPPLY_BUDGET, SUPPLY_OPEN_COST } from './supply';
import { deserializeGame, serializeGame, stateHash } from './save';
import { roadDirection } from './roads';
import { cellsWithin, rebuildIndexes } from './visibility';
import type { GameCommand, GameState } from './types';

const run = (state: GameState, command: GameCommand): void => { const result = applyCommand(state, command); expect(result.error ?? 'ok').toBe('ok'); };
const endTurn = (state: GameState): void => { run(state, { type: 'endTurn', factionId: state.turnOwnerId }); };
const reach = SUPPLY_BUDGET / SUPPLY_OPEN_COST;

/** One hearth on clear ground, and a three-company force standing in it. */
function start(): { state: GameState; townCell: number; armyId: string } {
  const state = createGame({ generatorVersion: 4, seed: 17, size: 'standard', factionCount: 1, pace: 'standard' });
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, reach + 4)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 7; state.world.waterDepth[cell] = 0; state.world.fertility[cell] = 80;
    delete state.resources.deposits[cell];
  }
  state.explored[state.turnOwnerId] = new Set(state.world.terrain.keys());
  run(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Supply Hearth' });
  const townCell = Object.values(state.settlements)[0]!.cell;
  const armyId = `army.${state.nextId++}`;
  state.armies[armyId] = { id: armyId, factionId: state.turnOwnerId, name: 'Field force', cell: townCell, movement: 2,
    formations: ['unit.guard', 'unit.spearman', 'unit.heavy_infantry'].map(unitId => ({ ...createArmyFormation(armyId, unitId), id: `formation.${state.nextId++}` })) };
  rebuildIndexes(state);
  return { state: deserializeGame(serializeGame(state)), townCell, armyId };
}

describe('supply lines', () => {
  it('reaches a bounded distance from a hearth, runs further on roads and stops at an enemy', () => {
    const { state, townCell } = start();
    const factionId = state.turnOwnerId;
    const supplied = suppliedCells(state, factionId);
    expect(supplied.get(townCell)).toBe(Object.values(state.settlements)[0]!.id);
    const distances = [...supplied.keys()].map(cell => cellsWithin(state, townCell, reach).includes(cell));
    expect(distances.every(Boolean)).toBe(true);
    expect(supplied.size).toBeGreaterThan(reach * 6);

    // A built road carries supply twice as far along its line.
    const road = deserializeGame(serializeGame(state));
    let here = townCell;
    for (let step = 0; step < reach + 3; step++) {
      const next = neighbors(here, road.world.width, road.world.height)
        .filter(cell => hexDistance(cell, townCell, road.world.width) > hexDistance(here, townCell, road.world.width)).sort((a, b) => a - b)[0];
      if (next === undefined) break;
      road.roads.edges[here] = (road.roads.edges[here] ?? 0) | (1 << roadDirection(here, next, road.world.width));
      here = next;
    }
    expect(hexDistance(here, townCell, road.world.width)).toBeGreaterThan(reach);
    expect(suppliedCells(state, factionId).has(here)).toBe(false);
    expect(suppliedCells(road, factionId).has(here)).toBe(true);

    // A hearth under siege feeds nobody, so the whole reach goes with it.
    state.sieges[Object.values(state.settlements)[0]!.id] = { settlementId: Object.values(state.settlements)[0]!.id, armyId: 'army.1', factionId,
      startedTurn: 1, defenses: 10, supplies: 10, militiaStrength: 10, militiaMorale: 10, militiaFatigue: 0 };
    expect(suppliedCells(state, factionId).size).toBe(0);
  });

  it('wears a force that stands outside it, and says so through the ordinary observation', () => {
    const { state, townCell, armyId } = start();
    const factionId = state.turnOwnerId;
    expect(armySupply(state, armyId).supplied).toBe(true);

    // March the force beyond the reach of its only hearth.
    const distant = [...cellsWithin(state, townCell, reach + 3)].find(cell => !cellsWithin(state, townCell, reach).includes(cell))!;
    state.armies[armyId]!.cell = distant;
    const away = deserializeGame(serializeGame(state));
    const status = armySupply(away, armyId);
    expect(status.supplied).toBe(false);
    expect(status.reason).toContain(`loses ${SUPPLY_ATTRITION} strength a turn`);
    expect(getObservation(away, factionId).supply.find(item => item.armyId === armyId)?.supplied).toBe(false);

    const before = away.armies[armyId]!.formations.map(item => item.strength);
    endTurn(away);
    expect(away.armies[armyId]!.formations.map(item => item.strength)).toEqual(before.map(strength => strength - SUPPLY_ATTRITION));
    expect(away.events.some(event => event.type === 'supply_attrition')).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(away)))).toBe(stateHash(away));
  });

  it('never starves a scout, a settling expedition or a realm with no hearth at all', () => {
    const { state, townCell, armyId } = start();
    const distant = [...cellsWithin(state, townCell, reach + 3)].find(cell => !cellsWithin(state, townCell, reach).includes(cell))!;
    // Two companies forage; three do not.
    state.armies[armyId]!.cell = distant;
    state.armies[armyId]!.formations.length = 2;
    expect(armySupply(deserializeGame(serializeGame(state)), armyId).supplied).toBe(true);

    // A caravan makes it an expedition however large it is.
    state.armies[armyId]!.formations.push({ ...createArmyFormation(armyId, 'unit.spearman'), id: `formation.${state.nextId++}` }, { ...createArmyFormation(armyId, 'unit.colonist'), id: `formation.${state.nextId++}` });
    expect(UNITS.find(unit => unit.id === 'unit.colonist')!.canFound).toBe(true);
    expect(armySupply(deserializeGame(serializeGame(state)), armyId).reason).toContain('forages for itself');

    // And a realm before its first hearth stands has no line to cut.
    const opening = createGame({ generatorVersion: 4, seed: 17, size: 'standard', factionCount: 1, pace: 'standard' });
    expect(armySupply(opening, 'army.1').reason).toContain('holds no hearth');
  });
});
