import { describe, expect, it } from 'vitest';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, createGame, getObservation } from './simulation';
import { createArmyFormation } from './army-composition';
import { recordWar } from './diplomacy';
import { warPair } from './warfare';
import { armySupply, observedSuppliedCells, suppliedCells } from './supply';
import { observeSupplyAccess, proposeSupplyAccess } from './supply-access';
import { deserializeGame, serializeGame, stateHash } from './save';
import type { GameCommand } from './types';

function corridor() {
  let state = createGame({ seed: 341, size: 'tiny', factionCount: 3, generatorVersion: 4 });
  const { width } = state.world, cell = (x: number, y = 16) => y * width + x;
  state.world.terrain.fill(0); state.world.biome.fill(0); state.world.fertility.fill(0); state.world.waterDepth.fill(1); state.resources.deposits = {};
  const land = (x: number, y: number) => { const at = cell(x, y); state.world.terrain[at] = 1; state.world.biome[at] = 1; state.world.fertility[at] = 65; state.world.waterDepth[at] = 0; };
  for (let y = 13; y <= 19; y++) for (let x = 4; x <= 10; x++) land(x, y);
  for (let y = 15; y <= 17; y++) for (let x = 24; x <= 25; x++) land(x, y);
  for (let y = 23; y <= 29; y++) for (let x = 38; x <= 44; x++) land(x, y);
  for (let x = 11; x <= 30; x++) land(x, 16);
  const starts = [cell(7), cell(25), cell(40, 26)]; state.world.starts = starts;
  state.factions.forEach((faction, i) => {
    faction.treasury = 1000; state.explored[faction.id] = new Set(state.world.terrain.keys());
    state.armies[`army.${i * 2 + 1}`]!.cell = starts[i]!; state.armies[`army.${i * 2 + 2}`]!.cell = starts[i]!;
  });
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); };
  refreshAuthoredSight(state);
  state.factions.forEach((faction, i) => issue({ type: 'found', factionId: faction.id, armyId: `army.${i * 2 + 1}`, name: `Corridor hearth ${i + 1}` }));
  const buyerId = state.factions[0]!.id, providerId = state.factions[1]!.id, enemyId = state.factions[2]!.id;
  const source = Object.values(state.settlements).find(town => town.factionId === providerId)!;
  const fieldId = `army.${state.nextId++}`;
  state.armies[fieldId] = { id: fieldId, factionId: buyerId, name: 'Corridor guard', cell: cell(29), movement: 3,
    formations: Array.from({ length: 3 }, (_, i) => createArmyFormation(i ? `army.${state.nextId++}` : fieldId, 'unit.guard')) };
  state.armies['army.2']!.cell = cell(24);
  state.wars.push(warPair(buyerId, enemyId)); recordWar(state, buyerId, enemyId);
  rebaseAuthoredLand(state); state = deserializeGame(serializeGame(state));
  issue({ type: 'proposeSupplyAccess', factionId: buyerId, targetFactionId: providerId, settlementId: source.id, feeCoin: 20, termTurns: 10 });
  issue({ type: 'respondSupplyAccess', factionId: providerId, offerId: state.supplyAccess.offers[0]!.id, accept: true });
  state.armies['army.2']!.cell = starts[0]!;
  refreshAuthoredSight(state); state = deserializeGame(serializeGame(state));
  return { state, buyerId, providerId, enemyId, sourceId: source.id, fieldId, cell };
}

describe('supply access permitted forecast', () => {
  it('keeps hidden blockade and source changes off the reach map while reporting actual own shortages', () => {
    const { state, buyerId, enemyId, sourceId, fieldId, cell } = corridor();
    const before = getObservation(state, buyerId);
    expect(before.settlements.some(town => town.id === sourceId)).toBe(false);
    expect(armySupply(state, fieldId).supplied).toBe(true);
    const forecast = [...observedSuppliedCells(state, buyerId)], contract = observeSupplyAccess(state, buyerId);
    expect(observeSupplyAccess(state, enemyId)).toMatchObject({ offers: [], agreements: [] });
    state.armies['army.6']!.cell = cell(26); // Authored unseen enemy occupies the only land corridor.
    state.settlements[sourceId]!.name = 'Unseen renamed hearth';
    state.settlements[sourceId]!.buildings.push('building.harbor');
    refreshAuthoredSight(state);
    const after = getObservation(state, buyerId);
    expect(after.armies.some(army => army.id === 'army.6')).toBe(false);
    expect(after.settlements.some(town => town.id === sourceId)).toBe(false);
    expect(armySupply(state, fieldId).supplied).toBe(false);
    expect(after.suppliedCells).toEqual(before.suppliedCells);
    expect([...observedSuppliedCells(state, buyerId)]).toEqual(forecast);
    expect(observeSupplyAccess(state, buyerId)).toEqual(contract);
    expect(JSON.stringify(after.supply)).not.toContain('Unseen renamed hearth');
    state.armies['army.6']!.cell = cell(40, 26); refreshAuthoredSight(state);
    expect(armySupply(state, fieldId).supplied).toBe(true);
    expect(armySupply(state, fieldId).reason).toContain('Corridor hearth 2');
  });

  it('publishes no imported unknown cells and refuses a new request to an unseen source', () => {
    const { state, buyerId, providerId, sourceId, cell } = corridor();
    const unknown = cell(24, 15);
    state.explored[buyerId]!.delete(unknown);
    expect(suppliedCells(state, buyerId).has(unknown)).toBe(true);
    expect(observedSuppliedCells(state, buyerId).has(unknown)).toBe(false);
    expect(getObservation(state, buyerId).suppliedCells).not.toContain(unknown);
    state.supplyAccess.agreements = [];
    const before = stateHash(state);
    expect(proposeSupplyAccess(state, { type: 'proposeSupplyAccess', factionId: buyerId, targetFactionId: providerId, settlementId: sourceId, feeCoin: 20, termTurns: 10 }).error).toMatch(/Observe/);
    expect(stateHash(state)).toBe(before);
  });
});
