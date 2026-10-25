import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyRecordedCommand, createArchive, replayArchive } from '../../chronicle/src';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, applyCommandForVersion, createArmyFormation, createGame, deserializeGame, getLandPolicyChoice, getObservation, getSettlementLandObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { cellsWithin, rebuildIndexes } from './visibility';
import { advanceLandPolicies, observeLandPolicies, type LandPolicy } from './land-policies';
import { handleLandCapture } from './territory';
import { settlementResourceYield } from './resources';

const improvementId = 'improvement.terraced_fields';
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, `${command.type}: ${result.error}`).toBe(true); return result; };
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
const reject = (state: GameState, command: unknown) => { const before = serializeGame(state); expect(applyCommand(state, command).ok).toBe(false); expect(serializeGame(state)).toBe(before); };

function fixture(two = false) {
  const state = createGame({ seed: 17, size: 'tiny', factionCount: 2, generatorVersion: 4 });
  const colonists = Object.values(state.armies).filter(army => army.formations.some(formation => formation.unitId === 'unit.colonist')).slice(0, two ? 2 : 1);
  // Authored clearings/funding/population isolate allocation and shared treasury.
  // Generated resource deposits are removed only from replaced geography.
  for (const army of colonists) for (const cell of cellsWithin(state, army.cell, 2)) {
    state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.waterDepth[cell] = 0; delete state.resources.deposits[cell];
  }
  for (const army of colonists) issue(state, { type: 'found', factionId: army.factionId, armyId: army.id, name: 'Commission hearth' });
  const towns = Object.values(state.settlements).sort((a, b) => a.id < b.id ? -1 : 1);
  for (const town of towns) {
    if (town.factionId !== state.turnOwnerId) { const old = town.factionId; town.factionId = state.turnOwnerId; handleLandCapture(state, town.id, old); }
    town.population = 6;
    const cells = getSettlementLandObservation(state, town.factionId, town.id)!.cells.filter(cell => cell.claimed && cell.canWork).map(cell => cell.cell).sort((a, b) => a - b);
    issue(state, { type: 'setWorkedTiles', factionId: town.factionId, settlementId: town.id, cells });
  }
  state.factions[0]!.treasury = 10_000;
  const town = towns[0]!;
  return { state, town, towns, land: state.land.settlements[town.id]!, factionId: state.turnOwnerId };
}
const policy = (state: GameState, settlementId = Object.keys(state.settlements)[0]!, allowance = 1000, reserve = 40): LandPolicy => ({ factionId: state.turnOwnerId, settlementId, improvementId, allowance, reserve });
const order = (input: LandPolicy): GameCommand => ({ type: 'setLandPolicy', ...input });

describe('paid land-work commissions', () => {
  it('starts the cheapest real quote immediately, spends once, and continues only after completion', () => {
    const { state, town, land } = fixture(), beforeCoin = state.factions[0]!.treasury;
    const desired = policy(state), next = getLandPolicyChoice(state, desired);
    expect(next.blocker).toBeNull(); expect(next.cell).not.toBeNull();
    const quotes = getSettlementLandObservation(state, town.factionId, town.id)!.cells.filter(cell => cell.worked && cell.cell !== town.cell)
      .map(cell => ({ cell: cell.cell, quote: cell.improvementOptions.find(option => option.improvementId === improvementId)! }))
      .filter(item => item.quote.canStart).sort((a, b) => a.quote.coinCost - b.quote.coinCost || a.cell - b.cell);
    expect(next.cell).toBe(quotes[0]!.cell); expect(next.coinCost).toBe(quotes[0]!.quote.coinCost);
    const result = issue(state, order(desired));
    expect(result.events.map(event => event.type)).toEqual(['land_policy_set', 'land_work_started', 'land_policy_ordered']);
    expect(state.factions[0]!.treasury).toBe(beforeCoin - next.coinCost!);
    expect(state.landPolicies[0]!.allowance).toBe(1000 - next.coinCost!);
    expect(land.work!.remainingTurns).toBe(next.turns);
    const active = structuredClone(land.work); advanceLandPolicies(state, []); expect(land.work).toEqual(active);
    for (let i = 1; i < next.turns!; i++) { end(state); expect(land.work!.cell).toBe(next.cell); }
    end(state);
    expect(land.improvements[next.cell!]).toBe(improvementId);
    expect(land.work!.cell).not.toBe(next.cell);
    expect(land.work!.remainingTurns).toBe(land.work!.turns);
    expect(state.landPolicies[0]!.allowance).toBe(1000 - next.coinCost! - land.work!.coinCost);
  });

  it('respects a finite total allowance and treasury reserve across arbitrary affordable purses', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 120 }), fc.integer({ min: 0, max: 120 }), fc.integer({ min: 0, max: 80 }), (treasury, allowance, reserve) => {
      const { state, town, land } = fixture(); state.factions[0]!.treasury = treasury;
      issue(state, order(policy(state, town.id, allowance, reserve)));
      const spent = treasury - state.factions[0]!.treasury;
      expect(spent).toBeLessThanOrEqual(allowance);
      expect(spent).toBeLessThanOrEqual(Math.max(0, treasury - reserve));
      expect(state.landPolicies[0]!.allowance).toBe(allowance - spent);
      expect(land.work?.coinCost ?? 0).toBe(spent);
      const stable = serializeGame(state); advanceLandPolicies(state, []); expect(serializeGame(state)).toBe(stable);
    }), { numRuns: 25 });
  });

  it('does not refill its total allowance after completing paid work', () => {
    const { state, town, land } = fixture(), quote = getLandPolicyChoice(state, policy(state));
    issue(state, order(policy(state, town.id, quote.coinCost! + 1, 0)));
    expect(state.landPolicies[0]!.allowance).toBe(1);
    for (let turn = 0; turn < quote.turns! + 3; turn++) end(state);
    expect(land.work).toBeNull(); expect(Object.keys(land.improvements)).toHaveLength(1);
    expect(state.landPolicies[0]!.allowance).toBe(1);
    expect(getLandPolicyChoice(state, state.landPolicies[0]!).blocker).toMatch(/only 1 remains/);
  });

  it('refreshes a shared treasury between canonically ordered commissions', () => {
    const { state, towns } = fixture(true);
    const first = policy(state, towns[0]!.id), second = policy(state, towns[1]!.id);
    const firstCost = getLandPolicyChoice(state, first).coinCost!, secondCost = getLandPolicyChoice(state, second).coinCost!;
    state.factions[0]!.treasury = 0;
    issue(state, order(second)); issue(state, order(first));
    expect(state.landPolicies.map(item => item.settlementId)).toEqual(towns.map(town => town.id));
    state.factions[0]!.treasury = 40 + Math.max(firstCost, secondCost);
    const before = state.factions[0]!.treasury; advanceLandPolicies(state, []);
    expect(state.land.settlements[towns[0]!.id]!.work?.coinCost).toBe(firstCost);
    expect(state.land.settlements[towns[1]!.id]!.work).toBeNull();
    expect(state.factions[0]!.treasury).toBe(before - firstCost);
    expect(state.factions[0]!.treasury).toBeGreaterThanOrEqual(40);
  });

  it('keeps ordinary production charter priority after upkeep', () => {
    const { state, town, land, factionId } = fixture();
    issue(state, order(policy(state, town.id, 1000, 10_000))); // wait now
    issue(state, { type: 'setCharter', factionId, settlementId: town.id, focus: 'works', ceiling: 24 });
    state.landPolicies[0]!.reserve = 40; state.factions[0]!.treasury = 50;
    const result = end(state), charter = result.events.findIndex(event => event.type === 'charter_ordered'), commission = result.events.findIndex(event => event.type === 'land_policy_ordered');
    expect(charter).toBeGreaterThanOrEqual(0);
    if (commission >= 0) expect(commission).toBeGreaterThan(charter);
    expect(land.work).toBeNull(); // upkeep plus existing charter has priority over new optional work
    expect(state.landPolicies[0]!.allowance).toBe(1000);
  });

  it('keeps active paid work on explicit revocation and forbids silent refunds or replacements', () => {
    const { state, town, land } = fixture(); issue(state, order(policy(state)));
    const work = structuredClone(land.work), coin = state.factions[0]!.treasury;
    issue(state, order({ ...policy(state), improvementId: 'none' }));
    expect(state.landPolicies).toEqual([]); expect(land.work).toEqual(work); expect(state.factions[0]!.treasury).toBe(coin);
    while (land.work) end(state);
    issue(state, { type: 'setWorkedTiles', factionId: town.factionId, settlementId: town.id, cells: [work!.cell] });
    issue(state, order(policy(state)));
    expect(land.work).toBeNull(); expect(getLandPolicyChoice(state, state.landPolicies[0]!).blocker).toMatch(/No suitable/);
    expect(land.improvements[work!.cell]).toBe(improvementId);
  });

  it('manual success revokes while failed direct orders preserve commission and hash', () => {
    const { state, town, land, factionId } = fixture(); issue(state, order(policy(state)));
    reject(state, { type: 'improveTile', factionId, settlementId: town.id, cell: town.cell, improvementId });
    expect(state.landPolicies).toHaveLength(1);
    issue(state, { type: 'cancelLandWork', factionId, settlementId: town.id }); expect(state.landPolicies).toEqual([]); expect(land.work).toBeNull();
    issue(state, order(policy(state, town.id, 0)));
    const cell = land.worked[0]!;
    issue(state, { type: 'improveTile', factionId, settlementId: town.id, cell, improvementId }); expect(state.landPolicies).toEqual([]);
  });

  it('successful direct cultivation takes control without revoking an unrelated worker policy', () => {
    const { state, town, factionId, land } = fixture();
    issue(state, { type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' });
    issue(state, order(policy(state, town.id, 0)));
    const candidate = getSettlementLandObservation(state, factionId, town.id)!.cells.flatMap(cell => cell.terraformOptions.filter(option => option.canStart).map(option => ({ cell: cell.cell, biome: option.biome })))[0]!;
    expect(candidate).toBeDefined();
    issue(state, { type: 'terraformTile', factionId, settlementId: town.id, ...candidate });
    expect(land.work?.kind).toBe('terraform'); expect(state.landPolicies).toEqual([]); expect(state.workerPolicies).toHaveLength(1);
  });

  it('worker reassignment keeps the commission and lets it find newly worked cells', () => {
    const { state, town, factionId, land } = fixture();
    issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [] });
    issue(state, order(policy(state))); expect(land.work).toBeNull();
    const cell = land.claimed.find(cell => cell !== town.cell)!;
    issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [cell] }); expect(state.landPolicies).toHaveLength(1);
    end(state); expect(land.work?.cell).toBe(cell);
  });

  it('waits through occupation and starts only after the occupation countdown finishes', () => {
    const { state, town, land } = fixture(); town.occupationTurns = 2;
    issue(state, order(policy(state))); expect(land.work).toBeNull();
    expect(observeLandPolicies(state, town.factionId)[0]!.blocker).toMatch(/occupation/);
    end(state); expect(land.work).toBeNull(); end(state); expect(land.work!.remainingTurns).toBe(land.work!.turns);
  });

  it('summaries are detached and omit choices; requested detail scans beyond the quoted page', () => {
    const { state, town, land, factionId } = fixture(); issue(state, order(policy(state, town.id, 0)));
    state.landPolicies[0]!.allowance = 1000;
    const before = serializeGame(state), compact = getObservation(state, factionId, { landDetails: 'none' });
    expect(compact.landPolicies).toHaveLength(1); expect(compact.land.settlements[0]!.landPolicyChoice).toBeUndefined();
    const detail = getSettlementLandObservation(state, factionId, town.id, { offset: 0, limit: 1 })!;
    expect(detail.landPolicyChoice).toEqual(getLandPolicyChoice(state, state.landPolicies[0]!));
    expect(detail.cells).toHaveLength(1); expect(land.worked.length).toBeGreaterThan(1);
    expect(getObservation(state, state.factions[1]!.id).landPolicies).toEqual([]);
    compact.landPolicies![0]!.allowance = 1; expect(serializeGame(state)).toBe(before);
  });

  it('rejects malformed, foreign, unknown and historical orders without mutation', () => {
    const { state, town } = fixture(), command = order(policy(state));
    for (const edit of [{ allowance: -1 }, { allowance: 0.1 }, { reserve: Number.MAX_SAFE_INTEGER + 1 }, { improvementId: 'improvement.missing' }, { extra: 1 }, { settlementId: 'settlement.missing' }, { factionId: state.factions[1]!.id }]) reject(state, { ...command, ...edit });
    reject(state, { ...command, improvementId: 'none' });
    const before = serializeGame(state); expect(applyCommandForVersion(state, command, 36).ok).toBe(false); expect(serializeGame(state)).toBe(before);
    issue(state, order(policy(state, town.id, 0)));
    state.landPolicies.push({ ...state.landPolicies[0]! }); expect(() => deserializeGame(serializeGame(state))).toThrow(/unique and sorted/);
    state.landPolicies.pop(); state.landPolicies[0]!.factionId = state.factions[1]!.id; expect(() => deserializeGame(serializeGame(state))).toThrow(/owned settlement/);
  });

  it.each(['occupy', 'raze'] as const)('pauses for an actual siege and removes the commission on %s', outcome => {
    const state = conquestCampaign(), target = state.settlements[CONQUEST_FIXTURE.settlementId]!, army = state.armies[CONQUEST_FIXTURE.playerArmyId]!;
    const previousOwner = target.factionId, factionId = state.turnOwnerId;
    issue(state, order({ ...policy(state, target.id, 0), factionId: previousOwner }));
    army.formations = Array.from({ length: 6 }, (_, index) => createArmyFormation(`army.${state.nextId++}`, index < 3 ? 'unit.heavy_infantry' : 'unit.arbalester')).sort((a, b) => a.id < b.id ? -1 : 1);
    refreshAuthoredSight(state);
    issue(state, { type: 'declareWar', factionId, targetFactionId: previousOwner });
    issue(state, { type: 'besiege', factionId, armyId: army.id, settlementId: target.id });
    expect(observeLandPolicies(state, previousOwner)[0]!.blocker).toMatch(/siege/);
    for (let turn = 0; turn < 3; turn++) end(state);
    issue(state, { type: 'assault', factionId, settlementId: target.id });
    issue(state, { type: 'autoResolveBattle', factionId });
    issue(state, { type: 'resolveCapture', factionId, settlementId: target.id, outcome });
    expect(state.landPolicies).toEqual([]); expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
  });

  it('protects generated deposits, pays for matching extraction and preserves harvest/replay', () => {
    const state = createGame({ seed: 17, size: 'tiny', factionCount: 1, pace: 'epic' });
    const deposit = Number(Object.entries(state.resources.deposits).find(([cell, id]) => id === 'resource.grain' && neighbors(Number(cell), state.world.width, state.world.height).some(next => isPassable(state.world.terrain[next]!)))![0]);
    const center = neighbors(deposit, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!))!;
    // Authored starting-force relocation only; geography/deposit and paid outcomes are generated.
    for (const army of Object.values(state.armies)) army.cell = center;
    rebuildIndexes(state);
    const factionId = state.turnOwnerId;
    issue(state, { type: 'found', factionId, armyId: 'army.1', name: 'Commissioned grain' });
    const town = Object.values(state.settlements)[0]!, land = state.land.settlements[town.id]!;
    issue(state, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [deposit] });
    const archive = createArchive(state, { mode: 'player', coverage: 'from-save' });
    const record = (command: GameCommand) => { const result = applyRecordedCommand(state, archive, command); expect(result.ok, result.error).toBe(true); expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state)); return result; };
    record(order(policy(state, town.id))); expect(land.work).toBeNull();
    record(order({ ...policy(state, town.id), improvementId: 'improvement.grange', reserve: 0 }));
    expect(land.work?.cell).toBe(deposit);
    const paid = land.work!.coinCost; expect(state.landPolicies[0]!.allowance).toBe(1000 - paid);
    while (land.work) record({ type: 'endTurn', factionId });
    expect(settlementResourceYield(state, town)).toEqual({ 'resource.grain': 3 });
    record({ type: 'endTurn', factionId }); expect(state.resources.stockpiles[factionId]!['resource.grain']).toBe(3);
    record({ type: 'setWorkedTiles', factionId, settlementId: town.id, cells: [] });
    record({ type: 'endTurn', factionId }); expect(state.resources.stockpiles[factionId]!['resource.grain']).toBe(3);
    expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
  });
});
