import { describe, expect, it } from 'vitest';
import { checksum, IMPROVEMENTS } from '@theandril/content';
import { hexDistance, naturalFeatures, neighbors } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash } from './index';
import type { GameCommand, GameState } from './types';
import { cellsWithin, indexes, updateSight } from './visibility';
import { applyLandCommand, emptyLandState, getLandIndex, getLandObservation, handleLandCapture, initializeSettlementLand, landCellYields, observeLandCell, refreshLandKnowledge, resolveLandTurn, settlementLandYield, validateLand, validateLandKnowledge, type LandCommand, type LandState } from './territory';

const player = 'faction.ashen_compact', rival = 'faction.reedbound_council', townId = 'settlement.5';
function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); expect(result, `${command.type}: ${result.error ?? ''}`).toMatchObject({ ok: true }); return result; }
function refresh(state: GameState): void { for (const owner of state.factions) refreshLandKnowledge(state, owner.id, indexes(state).visible.get(owner.id)!); }
function restore(state: GameState): GameState { const mirror = deserializeGame(serializeGame(state)); expect(stateHash(mirror)).toBe(stateHash(state)); return mirror; }
function scenario(biome = 1, terrain = 1): GameState {
  const state = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace: 'short' });
  // Authored local sites isolate economics; ordinary founding establishes all
  // territory, visibility and capital state. This is not a generated balance run.
  for (const cell of cellsWithin(state, state.armies['army.1']!.cell, 3)) {
    state.world.terrain[cell] = terrain; state.world.biome[cell] = biome; state.world.fertility[cell] = 80; state.world.waterDepth[cell] = 0;
  }
  issue(state, { type: 'found', factionId: player, armyId: 'army.1', name: 'Land witness' });
  issue(state, { type: 'found', factionId: rival, armyId: 'army.3', name: 'Reed witness' });
  state.factions[0]!.treasury = 10_000;
  return restore(state);
}
const view = (state: GameState) => getLandObservation(state, player, indexes(state).visible.get(player)!).settlements.find(town => town.settlementId === townId)!;
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: player });
function nextToCenter(state: GameState): number { return state.land.settlements[townId]!.claimed.find(cell => cell !== state.settlements[townId]!.cell)!; }
function improve(state: GameState, cell: number, improvementId = 'improvement.terraced_fields'): void { issue(state, { type: 'improveTile', factionId: player, settlementId: townId, cell, improvementId }); }

describe('territory, worked land and persistent cultivation', () => {
  it('initializes disjoint claims and capitals without changing generated geography, and exposes only owned city details', () => {
    const state = scenario(), before = stateHash(state), own = view(state);
    expect(own).toMatchObject({ stage: 'colony', isCapital: true, claimRadius: 1, claimCapacity: 7, workerCapacity: 1, worked: [], work: null });
    expect(own.claimed).toHaveLength(7); expect(own.cells).toHaveLength(7);
    expect(new Set(Object.values(state.land.settlements).flatMap(land => land.claimed)).size).toBe(Object.values(state.land.settlements).reduce((sum, land) => sum + land.claimed.length, 0));
    expect(getLandObservation(state, player, indexes(state).visible.get(player)!).settlements.map(town => town.settlementId)).toEqual([townId]);
    own.claimed.length = 0; expect(state.land.settlements[townId]!.claimed).toHaveLength(7);
    expect(stateHash(state)).toBe(before); validateLand(state);
  });

  it('reserves every existing settlement center before assigning migration rings', () => {
    const state = scenario(), first = state.settlements[townId]!, second = state.settlements['settlement.6']!;
    // Deliberately tight authored layout tests the initializer independently of
    // the ordinary founding distance rule, which rejects this arrangement.
    second.cell = neighbors(first.cell, state.world.width, state.world.height)[0]!;
    state.land = emptyLandState(state.factions.map(item => item.id));
    initializeSettlementLand(state, first); initializeSettlementLand(state, second);
    expect(getLandIndex(state).get(first.cell)).toBe(first.id); expect(getLandIndex(state).get(second.cell)).toBe(second.id);
    expect(state.land.settlements[first.id]!.claimed).not.toContain(second.cell); validateLand(state);
  });

  it('unlocks paid contiguous claims with population stages, retaining legal claims after population loss', () => {
    const state = scenario(), town = state.settlements[townId]!;
    const target = cellsWithin(state, town.cell, 2).find(cell => hexDistance(town.cell, cell, state.world.width) === 2)!;
    const command: LandCommand = { type: 'claimCell', factionId: player, settlementId: townId, cell: target };
    const before = stateHash(state); expect(applyLandCommand(state, command)).toMatch(/reach/); expect(stateHash(state)).toBe(before);
    town.population = 3;
    const quote = view(state).cells.find(cell => cell.cell === target)!.claim; expect(quote).toMatchObject({ canStart: true, coinCost: 20 });
    const coin = state.factions[0]!.treasury; issue(state, command); expect(state.factions[0]!.treasury).toBe(coin - quote.coinCost);
    expect(getLandIndex(state).get(target)).toBe(townId);
    town.population = 8; expect(view(state)).toMatchObject({ stage: 'city', claimRadius: 3, claimCapacity: 37, workerCapacity: 6 });
    town.population = 1; resolveLandTurn(state, town); expect(view(state).claimed).toContain(target); restore(state);
  });

  it('rejects malformed, duplicate, foreign, hidden, over-budget and over-capacity orders atomically', () => {
    const state = scenario(), cell = nextToCenter(state), home = state.settlements[townId]!.cell;
    const rejected: unknown[] = [
      { type: 'claimCell', factionId: player, settlementId: townId, cell, injected: true },
      { type: 'improveTile', factionId: player, settlementId: townId, cell, improvementId: 'improvement.unknown' },
      { type: 'setWorkedTiles', factionId: rival, settlementId: townId, cells: [cell] },
      { type: 'setWorkedTiles', factionId: player, settlementId: townId, cells: [cell, cell] },
      { type: 'setWorkedTiles', factionId: player, settlementId: townId, cells: [home] },
      { type: 'setWorkedTiles', factionId: player, settlementId: townId, cells: state.land.settlements[townId]!.claimed.filter(item => item !== home).slice(0, 2) },
      { type: 'claimCell', factionId: player, settlementId: townId, cell: state.world.terrain.length },
      { type: 'claimCell', factionId: player, settlementId: townId, cell: state.settlements['settlement.6']!.cell },
      { type: 'terraformTile', factionId: player, settlementId: townId, cell, biome: 11 },
    ];
    for (const command of rejected) { const before = stateHash(state); expect(applyLandCommand(state, command)).not.toBeNull(); expect(stateHash(state)).toBe(before); }
    state.factions[0]!.treasury = 0; const before = stateHash(state);
    expect(applyLandCommand(state, { type: 'improveTile', factionId: player, settlementId: townId, cell, improvementId: 'improvement.terraced_fields' })).toMatch(/coin/);
    expect(stateHash(state)).toBe(before); restore(state);
  });

  it('pays the quoted improvement price once, completes through real turns, and scales later work by successful completions', () => {
    const state = scenario(), cell = nextToCenter(state), quote = view(state).cells.find(item => item.cell === cell)!.improvementOptions.find(item => item.improvementId === 'improvement.terraced_fields')!;
    const coin = state.factions[0]!.treasury; improve(state, cell);
    expect(state.factions[0]!.treasury).toBe(coin - quote.coinCost); expect(state.land.settlements[townId]!.work).toMatchObject({ coinCost: quote.coinCost, turns: 2, remainingTurns: 2 });
    expect(applyLandCommand(state, { type: 'terraformTile', factionId: player, settlementId: townId, cell, biome: 2 })).toMatch(/already has/);
    end(state); const mirror = restore(state); expect(state.land.settlements[townId]!.work?.remainingTurns).toBe(1);
    end(state); end(mirror); expect(stateHash(mirror)).toBe(stateHash(state));
    expect(state.land.settlements[townId]!.improvements[cell]).toBe('improvement.terraced_fields'); expect(state.land.cultivation[player]).toBe(1);
    const next = state.land.settlements[townId]!.claimed.find(item => item !== cell && item !== state.settlements[townId]!.cell)!;
    expect(view(state).cells.find(item => item.cell === next)!.improvementOptions.find(item => item.improvementId === 'improvement.terraced_fields')!.coinCost).toBe(quote.coinCost + 3);
    restore(state);
  });

  it('pays signed feature/affinity tradeoffs only on worked cells and trims workers deterministically after losses', () => {
    const state = scenario(10, 3), town = state.settlements[townId]!, cell = nextToCenter(state);
    const idleYield = settlementLandYield(state, town); improve(state, cell, 'improvement.quarry'); end(state); end(state); end(state);
    expect(settlementLandYield(state, town)).toEqual(idleYield);
    issue(state, { type: 'setWorkedTiles', factionId: player, settlementId: townId, cells: [cell] });
    const breakdown = landCellYields(state, town, cell);
    expect(breakdown.improvement.food).toBe(-1); expect(breakdown.features).toBeDefined(); expect(breakdown.total.food).toBeGreaterThanOrEqual(0);
    expect(settlementLandYield(state, town).industry).toBe(idleYield.industry + breakdown.total.industry);
    const options = view(state).cells.find(item => item.cell === cell)!; expect(options.features).toBe(naturalFeatures(state.world, cell));
    town.population = 3; const worked = state.land.settlements[townId]!.claimed.filter(item => item !== town.cell).slice(0, 3).reverse();
    issue(state, { type: 'setWorkedTiles', factionId: player, settlementId: townId, cells: worked });
    town.population = 1; resolveLandTurn(state, town); expect(state.land.settlements[townId]!.worked).toEqual([...worked].sort((a, b) => a - b).slice(0, 1)); restore(state);
  });

  it('pauses paid work under blockade and occupation, and cancels without a refund', () => {
    const state = scenario(), town = state.settlements[townId]!, cell = nextToCenter(state); improve(state, cell);
    const work = structuredClone(state.land.settlements[townId]!.work), treasury = state.factions[0]!.treasury;
    town.occupationTurns = 1; resolveLandTurn(state, town); expect(state.land.settlements[townId]!.work).toEqual(work);
    town.occupationTurns = 0;
    // The dedicated siege suite verifies public siege creation; this isolates the
    // land phase's reaction to its persisted blockade reference.
    state.sieges[townId] = { settlementId: townId, armyId: 'army.4', factionId: rival, startedTurn: state.turn, defenses: 20, supplies: 2, militiaStrength: 30, militiaMorale: 30, militiaFatigue: 0 };
    resolveLandTurn(state, town); expect(state.land.settlements[townId]!.work).toEqual(work); expect(view(state).workPaused).toMatch(/siege/);
    delete state.sieges[townId]; issue(state, { type: 'cancelLandWork', factionId: player, settlementId: townId });
    expect(state.land.settlements[townId]!.work).toBeNull(); expect(state.factions[0]!.treasury).toBe(treasury); expect(state.land.cultivation[player]).toBe(0); restore(state);
  });

  it('cultivates a saved biome without changing physical arrays or leaking a remote change through fog', () => {
    const state = scenario(), cell = nextToCenter(state), physical = JSON.stringify({ terrain: [...state.world.terrain], biomes: [...state.world.biome], fertility: [...state.world.fertility], depths: [...state.world.waterDepth] });
    state.explored[rival]!.add(cell); const remembered = observeLandCell(state, rival, cell, true);
    expect(indexes(state).visible.get(rival)!.has(cell)).toBe(false);
    issue(state, { type: 'terraformTile', factionId: player, settlementId: townId, cell, biome: 2 });
    const mirror = restore(state);
    for (let turn = 0; turn < 3; turn++) { end(state); end(mirror); }
    expect(state.land.biomes[cell]).toBe(2); expect(observeLandCell(state, rival, cell)).toEqual(remembered);
    expect(getObservation(state, rival).cells.find(item => item.cell === cell)?.biome).toBe(remembered.biome);
    expect(observeLandCell(state, player, cell).biome).toBe(2);
    expect(JSON.stringify({ terrain: [...state.world.terrain], biomes: [...state.world.biome], fertility: [...state.world.fertility], depths: [...state.world.waterDepth] })).toBe(physical);
    expect(stateHash(mirror)).toBe(stateHash(state)); refreshLandKnowledge(state, rival, [cell]); expect(observeLandCell(state, rival, cell).biome).toBe(2); restore(state);
  });

  it('cancels captured work and transfers improvements, while razing releases claims but preserves cultivation and historical memory', () => {
    const state = scenario(), town = state.settlements[townId]!, cell = nextToCenter(state);
    issue(state, { type: 'terraformTile', factionId: player, settlementId: townId, cell, biome: 2 }); end(state); end(state); end(state);
    improve(state, cell, 'improvement.managed_woodlot'); end(state); end(state); end(state);
    const next = state.land.settlements[townId]!.claimed.find(item => item !== cell && item !== town.cell)!; improve(state, next);
    const paid = state.factions[0]!.treasury;
    state.explored[rival]!.add(cell); observeLandCell(state, rival, cell, true);
    issue(state, { type: 'move', factionId: player, armyId: 'army.2', target: next });
    updateSight(state, player, town.cell, 3, -1); town.factionId = rival; town.population = 1; updateSight(state, rival, town.cell, 3, 1);
    const events: Parameters<typeof handleLandCapture>[3] = [];
    handleLandCapture(state, townId, player, events); refresh(state);
    expect(events.some(event => event.type === 'land_work_cancelled')).toBe(true);
    expect(state.land.settlements[townId]!.work).toBeNull(); expect(state.land.settlements[townId]!.improvements[cell]).toBe('improvement.managed_woodlot');
    expect(state.land.capitals[player]).toBeNull(); expect(state.factions[0]!.treasury).toBe(paid); restore(state);
    const memory = observeLandCell(state, rival, cell);
    updateSight(state, rival, town.cell, 3, -1); indexes(state).settlements.delete(town.cell); delete state.settlements[town.id];
    handleLandCapture(state, townId, rival); refresh(state);
    expect(state.land.settlements[townId]).toBeUndefined(); expect(getLandIndex(state).get(cell)).toBeUndefined(); expect(state.land.biomes[cell]).toBe(2);
    expect(observeLandCell(state, rival, cell)).toEqual(memory); restore(state);
  });

  it('rejects corrupted claims, work, overrides and memories even with a recomputed snapshot checksum', () => {
    const state = scenario(), cell = nextToCenter(state);
    const mutations: ((land: LandState) => void)[] = [
      land => { land.settlements[townId]!.claimed.push(cell); },
      land => { land.settlements[townId]!.worked = [state.settlements[townId]!.cell]; },
      land => { land.settlements[townId]!.improvements[cell] = 'improvement.missing'; },
      land => { land.biomes[cell] = 1; },
      land => { land.capitals[player] = 'settlement.6'; },
      land => { delete land.known[player]![cell]; },
      land => { land.known[player]![cell]!.factionId = null; },
    ];
    for (const mutate of mutations) {
      const saved = JSON.parse(serializeGame(state)) as { state: { land: LandState }; stateChecksum: string };
      mutate(saved.state.land); saved.stateChecksum = checksum(JSON.stringify(saved.state)); expect(() => deserializeGame(JSON.stringify(saved))).toThrow(/land/i);
    }
    expect(() => validateLandKnowledge(state, player, indexes(state).visible.get(player)!)).not.toThrow();
  });

  it('keeps each authored improvement site and preview authoritative across all five definitions', () => {
    const state = scenario();
    for (const cell of view(state).cells) for (const option of cell.improvementOptions) {
      expect(IMPROVEMENTS.some(item => item.id === option.improvementId)).toBe(true);
      const copy = restore(state), command: LandCommand = { type: 'improveTile', factionId: player, settlementId: townId, cell: cell.cell, improvementId: option.improvementId };
      const error = applyLandCommand(copy, command);
      expect(error === null).toBe(option.canStart); if (error) expect(error).toBe(option.blocker);
    }
  });
});
