import { afterEach, describe, expect, it, vi } from 'vitest';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { prosperityCampaign } from '../../test-fixtures/src/victory-fixture';
import { applyCommand, createGame, deserializeGame, getLandObservation, getObservation, getSettlementLandObservation, initializeSettlementLand, refreshLandKnowledge, serializeGame, stateHash, type GameState, type LandDetails, type ObservationOptions, type SettlementLandObservation } from './index';
import * as visibility from './visibility';

afterEach(() => vi.restoreAllMocks());

function ownIds(state: GameState): string[] {
  return Object.values(state.settlements).filter(town => town.factionId === state.turnOwnerId).map(town => town.id).sort();
}
const summary = (town: SettlementLandObservation): SettlementLandObservation => ({ ...town, cells: [] });

/** Authored town registries on unchanged generated geography; strict load checks
 * center spacing, territory, references and visibility before selector tests. */
function windowCampaign(count: number): GameState {
  const state = createGame({ seed: 41, size: 'tiny', factionCount: 2 });
  const centers: number[] = [];
  for (let cell = 0; cell < state.world.terrain.length && centers.length < count + 1; cell++) {
    if (!isPassable(state.world.terrain[cell]!) || centers.some(center => hexDistance(center, cell, state.world.width) < 3)) continue;
    const factionId = state.factions[centers.length < count ? 0 : 1]!.id;
    const id = `settlement.${state.nextId++}`;
    const town = { id, factionId, founderFactionId: factionId, name: `Window ${id}`, cell, population: 3, food: 0, buildings: [], queue: [], devastation: 0, occupationTurns: 0 };
    state.settlements[id] = town;
    initializeSettlementLand(state, town);
    centers.push(cell);
  }
  expect(centers).toHaveLength(count + 1);
  state.settlements = Object.fromEntries(Object.entries(state.settlements).reverse());
  const index = visibility.rebuildIndexes(state);
  for (const faction of state.factions) refreshLandKnowledge(state, faction.id, index.visible.get(faction.id)!);
  return deserializeGame(serializeGame(state));
}

describe('scoped settlement land queries', () => {
  it('preserves the default full observation byte for byte and retains every summary when omitting details', () => {
    const state = prosperityCampaign(), owner = state.turnOwnerId;
    const full = getObservation(state, owner);
    expect(full.land.settlements).toHaveLength(3);
    expect(full.land.settlements.every(town => town.cells.length > 0)).toBe(true);
    expect(JSON.stringify(getObservation(state, owner, { landDetails: 'all' }))).toBe(JSON.stringify(full));
    expect(JSON.stringify(getObservation(state, owner, {}))).toBe(JSON.stringify(full));
    const expected = { ...full, land: { ...full.land, settlements: full.land.settlements.map(summary) } };
    for (const landDetails of ['none', []] as const) {
      expect(JSON.stringify(getObservation(state, owner, { landDetails }))).toBe(JSON.stringify(expected));
    }
  });

  it('details only requested own IDs in canonical order, ignoring duplicate, foreign and unknown probes', () => {
    const state = prosperityCampaign(), owner = state.turnOwnerId, ids = ownIds(state);
    const foreign = Object.values(state.settlements).find(town => town.factionId !== owner)!;
    const options: ObservationOptions = { landDetails: Object.freeze([ids[2]!, foreign.id, 'settlement.999999', ids[0]!, ids[2]!]) };
    const full = getObservation(state, owner), scoped = getObservation(state, owner, options);
    expect(scoped.land.settlements.map(town => town.settlementId)).toEqual(ids);
    expect(JSON.stringify(scoped)).toBe(JSON.stringify({ ...full, land: { ...full.land, settlements: full.land.settlements.map(town => town.settlementId === ids[1] ? summary(town) : town) } }));
    for (const town of full.land.settlements) {
      expect(JSON.stringify(getSettlementLandObservation(state, owner, town.settlementId))).toBe(JSON.stringify(town));
    }
    expect(getSettlementLandObservation(state, owner, foreign.id)).toBeNull();
    expect(getSettlementLandObservation(state, owner, 'settlement.999999')).toBeNull();
    expect(getSettlementLandObservation(state, 'faction.unknown', ids[0]!)).toBeNull();
    expect(getObservation(state, owner, { landDetails: [foreign.id] }).land.settlements).toEqual(full.land.settlements.map(summary));
  });

  it('does not enumerate candidate cells for omitted towns or scan unrelated town records in a direct query', () => {
    const state = prosperityCampaign(), owner = state.turnOwnerId, id = ownIds(state)[0]!;
    const visible = visibility.indexes(state).visible.get(owner)!;
    const enumerate = vi.spyOn(visibility, 'cellsWithin');
    getLandObservation(state, owner, visible, 'none');
    expect(enumerate).not.toHaveBeenCalled();
    getLandObservation(state, owner, visible, [id]);
    expect(enumerate).toHaveBeenCalledTimes(1);
    enumerate.mockClear();
    getLandObservation(state, owner, visible);
    expect(enumerate).toHaveBeenCalledTimes(3);
    enumerate.mockClear();
    // Both indexes are warm. A direct selector must use the requested record,
    // not enumerate every town and discard the unwanted results afterwards.
    const original = state.settlements;
    state.settlements = new Proxy(original, { ownKeys: () => { throw new Error('Unrelated settlement scan'); } });
    try {
      expect(getSettlementLandObservation(state, owner, id)?.settlementId).toBe(id);
      expect(enumerate).toHaveBeenCalledTimes(1);
      enumerate.mockClear();
      expect(getSettlementLandObservation(state, owner, 'settlement.missing')).toBeNull();
      expect(enumerate).not.toHaveBeenCalled();
    } finally { state.settlements = original; }
  });

  it('filters quotes using the same current visibility index, not explored memory', () => {
    const state = prosperityCampaign(), owner = state.turnOwnerId, id = ownIds(state)[0]!;
    const original = getSettlementLandObservation(state, owner, id)!;
    const allowed = original.cells[0]!.cell, index = visibility.indexes(state), sight = index.visible.get(owner)!;
    expect(original.cells.every(cell => state.explored[owner]!.has(cell.cell))).toBe(true);
    // Narrow the read-model visibility source only: remembered cells remain
    // explored. This isolates selector filtering without altering saved rules.
    index.visible.set(owner, new Map([[allowed, 1]]));
    try {
      const direct = getSettlementLandObservation(state, owner, id)!;
      expect(direct.cells.map(cell => cell.cell)).toEqual([allowed]);
      expect(direct).toEqual({ ...original, cells: original.cells.filter(cell => cell.cell === allowed) });
      expect(getObservation(state, owner, { landDetails: [id] }).land.settlements.find(town => town.settlementId === id)).toEqual(direct);
      expect(getLandObservation(state, owner, { has: () => false }).settlements.every(town => town.cells.length === 0)).toBe(true);
    } finally { index.visible.set(owner, sight); }
    expect(getSettlementLandObservation(state, owner, id)).toEqual(original);
  });

  it('keeps full, scoped, direct and rejected reads detached from canonical saves and subsequent queries', () => {
    const state = prosperityCampaign(), owner = state.turnOwnerId;
    const town = getObservation(state, owner).land.settlements.find(town => town.cells.some(cell => cell.canWork && cell.improvementOptions.some(option => option.canStart)))!;
    const cell = town.cells.find(cell => cell.canWork && cell.improvementOptions.some(option => option.canStart))!;
    const improvement = cell.improvementOptions.find(option => option.canStart)!;
    expect(applyCommand(state, { type: 'setWorkedTiles', factionId: owner, settlementId: town.settlementId, cells: [cell.cell] }).ok).toBe(true);
    expect(applyCommand(state, { type: 'improveTile', factionId: owner, settlementId: town.settlementId, cell: cell.cell, improvementId: improvement.improvementId }).ok).toBe(true);
    const save = serializeGame(state), hash = stateHash(state);
    const reference = getSettlementLandObservation(state, owner, town.settlementId)!;
    expect(reference.work).not.toBeNull();
    const snapshots = [
      getSettlementLandObservation(state, owner, town.settlementId)!,
      getObservation(state, owner).land.settlements.find(item => item.settlementId === town.settlementId)!,
      getObservation(state, owner, { landDetails: [town.settlementId] }).land.settlements.find(item => item.settlementId === town.settlementId)!,
      getObservation(state, owner, { landDetails: 'none' }).land.settlements.find(item => item.settlementId === town.settlementId)!,
    ];
    for (const snapshot of snapshots) {
      snapshot.claimed.length = 0; snapshot.worked.push(-1); snapshot.work!.remainingTurns = 999;
      snapshot.yields.food = -100; snapshot.capitalOption.coinCost = -100;
      for (const item of snapshot.cells) {
        item.yields.biome.food = -100; item.yields.total.industry = -100; item.claim.blocker = 'Injected';
        item.improvementOptions[0]!.coinCost = -100; item.terraformOptions[0]!.name = 'Injected';
        item.improvementOptions.length = 0;
      }
      snapshot.cells.length = 0;
    }
    for (const id of ['settlement.missing', '__proto__', 'constructor']) expect(getSettlementLandObservation(state, owner, id)).toBeNull();
    expect(getSettlementLandObservation(state, owner, town.settlementId)).toEqual(reference);
    expect(stateHash(state)).toBe(hash);
    expect(serializeGame(state)).toBe(save);
    const restored = deserializeGame(save);
    expect(getSettlementLandObservation(restored, owner, town.settlementId)).toEqual(reference);
    expect(stateHash(restored)).toBe(hash);
  });

  it('does not disclose remote work through foreign-town queries or change a rejected command probe', () => {
    const state = prosperityCampaign(), owner = state.turnOwnerId;
    const foreign = Object.values(state.settlements).find(town => town.factionId !== owner)!;
    expect(visibility.indexes(state).visible.get(owner)!.has(foreign.cell)).toBe(false);
    const detail = getSettlementLandObservation(state, foreign.factionId, foreign.id)!;
    const cell = detail.cells.find(cell => cell.improvementOptions.some(option => option.canStart))!;
    const improvementId = cell.improvementOptions.find(option => option.canStart)!.improvementId;
    const probe = { type: 'improveTile', factionId: owner, settlementId: foreign.id, cell: cell.cell, improvementId };
    const rejected = applyCommand(state, probe);
    expect(rejected.ok).toBe(false);
    expect(getSettlementLandObservation(state, owner, foreign.id)).toBeNull();
    expect(applyCommand(state, { ...probe, factionId: foreign.factionId }).ok).toBe(true);
    const hash = stateHash(state), save = serializeGame(state);
    expect(getSettlementLandObservation(state, owner, foreign.id)).toBeNull();
    expect(getObservation(state, owner, { landDetails: [foreign.id] }).land.settlements.every(town => town.cells.length === 0)).toBe(true);
    expect(applyCommand(state, probe)).toEqual(rejected);
    expect(stateHash(state)).toBe(hash); expect(serializeGame(state)).toBe(save);
  });

  it('handles generated starts with no towns without special cases or mutation', () => {
    const state = createGame({ seed: 41, size: 'tiny', factionCount: 2 }), hash = stateHash(state);
    const expected = getObservation(state, state.turnOwnerId);
    for (const landDetails of ['all', 'none', ['settlement.missing']] as const) {
      expect(getObservation(state, state.turnOwnerId, { landDetails })).toEqual(expected);
    }
    expect(getSettlementLandObservation(state, state.turnOwnerId, 'settlement.missing')).toBeNull();
    expect(stateHash(state)).toBe(hash);
  });

  it.each([0, 1, 8, 9, 16, 17])('matches exact ID subsets for circular windows over %i owned towns', count => {
    const state = windowCampaign(count), owner = state.turnOwnerId, before = serializeGame(state);
    const full = getObservation(state, owner), ids = ownIds(state);
    expect(ids).toHaveLength(count);
    for (const window of [
      { offset: 0, limit: 8 }, { offset: 8, limit: 8 }, { offset: 16, limit: 8 },
      { offset: Math.max(0, count - 1), limit: 8 }, { offset: count * 3 + 2, limit: 0 },
      { offset: Number.MAX_SAFE_INTEGER, limit: Number.MAX_SAFE_INTEGER },
    ]) {
      const offset = count ? window.offset % count : 0;
      const selected = Array.from({ length: Math.min(window.limit, count) }, (_, index) => ids[(offset + index) % count]!);
      const options: ObservationOptions = { landDetails: Object.freeze(window) };
      const scoped = getObservation(state, owner, options);
      expect(scoped).toEqual(getObservation(state, owner, { landDetails: selected }));
      expect(scoped).toEqual({ ...full, land: { ...full.land, settlements: full.land.settlements.map(town => selected.includes(town.settlementId) ? town : summary(town)) } });
      expect(scoped.land.settlements.map(town => town.settlementId)).toEqual(ids);
      const changed = scoped.land.settlements.find(town => town.cells.length);
      if (changed) { changed.cells[0]!.claim.coinCost = -100; changed.claimed.length = 0; changed.borderExpansion.progress = -1; }
      expect(serializeGame(state)).toBe(before);
    }
  });

  it('enumerates only selected-window quote disks and preserves current fog filtering', () => {
    const state = windowCampaign(17), owner = state.turnOwnerId, ids = ownIds(state), visible = visibility.indexes(state).visible.get(owner)!;
    const options = Object.freeze({ offset: 16, limit: 8 });
    const expectedIds = [ids[16]!, ...ids.slice(0, 7)];
    const enumerate = vi.spyOn(visibility, 'cellsWithin');
    getLandObservation(state, owner, visible, options);
    expect(enumerate).toHaveBeenCalledTimes(8);
    enumerate.mockClear();
    getLandObservation(state, owner, visible, { offset: 0, limit: 0 });
    expect(enumerate).not.toHaveBeenCalled();
    enumerate.mockRestore();
    const allowed = state.settlements[ids[0]!]!.cell;
    const narrowSight = { has: (cell: number) => cell === allowed };
    expect(getLandObservation(state, owner, narrowSight, options)).toEqual(getLandObservation(state, owner, narrowSight, expectedIds));
    expect(getLandObservation(state, owner, narrowSight, options).settlements.flatMap(town => town.cells).every(cell => cell.cell === allowed)).toBe(true);
  });

  it('rejects malformed windows even with no towns, before detail enumeration or canonical mutation', () => {
    for (const count of [0, 9]) {
      const state = windowCampaign(count), owner = state.turnOwnerId, saved = serializeGame(state);
      const invalid: unknown[] = [null, {}, { offset: 0 }, { limit: 8 },
        ...[-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, '8'].flatMap(value => [{ offset: value, limit: 8 }, { offset: 0, limit: value }])];
      const enumerate = vi.spyOn(visibility, 'cellsWithin');
      for (const landDetails of invalid) expect(() => getObservation(state, owner, { landDetails: landDetails as LandDetails })).toThrow('Land detail window offset and limit must be nonnegative safe integers.');
      expect(enumerate).not.toHaveBeenCalled();
      enumerate.mockRestore();
      expect(serializeGame(state)).toBe(saved);
    }
  });
});
