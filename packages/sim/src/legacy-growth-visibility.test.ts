import { expect, test } from 'vitest';
import { applyCommand, applyCommandForVersion, createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, serializeGameForVersion, stateHash } from './index';
import { refreshLandKnowledge } from './territory';
import { rememberRoadCell } from './roads';
import { withRules } from './rules';
import { cellsWithin, indexes, rebuildIndexes } from './visibility';

function oldCity() {
  const state = createGame({ seed: 17, size: 'tiny', factionCount: 1, pace: 'epic', rulesVersion: 15, generatorVersion: 4 });
  const factionId = state.turnOwnerId, founder = state.armies['army.1']!;
  for (const cell of cellsWithin(state, founder.cell, 4)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.waterDepth[cell] = 0;
  }
  expect(applyCommandForVersion(state, { type: 'found', factionId, armyId: founder.id, name: 'Old border' }, 15).ok).toBe(true);
  const town = Object.values(state.settlements)[0]!;
  town.population = 8;
  const claimed = cellsWithin(state, town.cell, 3).sort((a, b) => a - b);
  expect(claimed).toHaveLength(37);
  state.land = { ...state.land, settlements: { [town.id]: { ...state.land.settlements[town.id]!, claimed } } };
  // An authored pre-16 city whose independent scout has left its original district.
  const scout = state.armies['army.2']!;
  scout.cell = cellsWithin(state, town.cell, 10).at(-1)!;
  state.world.terrain[scout.cell] = 1; state.world.biome[scout.cell] = 1; state.world.waterDepth[scout.cell] = 0;
  state.explored[factionId] = new Set(); state.land.known[factionId] = {}; state.roads.known[factionId] = {};
  const sight = withRules(state, 15, () => rebuildIndexes(state));
  refreshLandKnowledge(state, factionId, sight.visible.get(factionId)!);
  for (const cell of sight.visible.get(factionId)!.keys()) rememberRoadCell(state, factionId, cell);
  const outer = cellsWithin(state, town.cell, 4).filter(cell => !state.explored[factionId]!.has(cell));
  expect(outer.length).toBeGreaterThan(0);
  return { state, factionId, townId: town.id, outer };
}

test('reserializing a v15 city preserves unexplored outer borders until the first successful modern action', () => {
  const { state, factionId, townId, outer } = oldCity();
  const historical = serializeGameForVersion(state, 15), migrated = deserializeGame(historical);
  expect(migrated.land.visibilityVersion).toBe(0);
  const modernEnvelope = serializeGame(migrated), mirror = deserializeGame(modernEnvelope);
  expect(serializeGame(mirror)).toBe(modernEnvelope);
  expect(serializeGameForVersion(mirror, 15)).toBe(historical);
  const before = stateHash(migrated), sight = [...indexes(migrated).visible.get(factionId)!.keys()];
  getObservation(migrated, factionId);
  getSettlementLandObservation(migrated, factionId, townId, { offset: 0, cell: outer[0]! });
  expect(stateHash(migrated)).toBe(before);
  expect(applyCommand(migrated, { type: 'claimCell', factionId, settlementId: townId, cell: outer[0]! }).ok).toBe(false);
  expect(stateHash(migrated)).toBe(before);
  expect(migrated.land.visibilityVersion).toBe(0);
  expect([...indexes(migrated).visible.get(factionId)!.keys()]).toEqual(sight);
  expect(outer.every(cell => !migrated.explored[factionId]!.has(cell))).toBe(true);
  const command = { type: 'endTurn', factionId } as const;
  const applied = applyCommand(migrated, command);
  expect(applied.ok, applied.error).toBe(true);
  expect(applyCommand(mirror, command)).toEqual(applied);
  expect(migrated.land.visibilityVersion).toBe(1);
  expect(outer.every(cell => migrated.explored[factionId]!.has(cell))).toBe(true);
  expect(stateHash(migrated)).toBe(stateHash(mirror));
  expect(stateHash(deserializeGame(serializeGame(migrated)))).toBe(stateHash(migrated));
});
