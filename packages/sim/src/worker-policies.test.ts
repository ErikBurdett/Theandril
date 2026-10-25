import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { applyRecordedCommand, createArchive, replayArchive } from '../../chronicle/src';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, applyCommandForVersion, createArmyFormation, createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { cellsWithin } from './visibility';
import { allocatePolicyWorkers, workerAllocationBlocker } from './territory';
import { advanceWorkerPolicies, observeWorkerPolicies, WORKER_POLICY_FOCI, workerPolicyScore, type WorkerPolicyFocus } from './worker-policies';

const priorSave = readFileSync(new URL('./fixtures/worker-policy-v35-save.json', import.meta.url), 'utf8');
const loaded = () => deserializeGame(priorSave);
const townOf = (state: GameState) => Object.values(state.settlements).find(town => town.factionId === state.turnOwnerId)!;
const order = (state: GameState, focus: WorkerPolicyFocus | 'none' = 'balanced'): GameCommand => ({ type: 'setWorkerPolicy', factionId: state.turnOwnerId, settlementId: townOf(state).id, focus });
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, `${command.type}: ${result.error}`).toBe(true); return result; };
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
const reject = (state: GameState, command: unknown) => { const before = serializeGame(state); expect(applyCommand(state, command).ok).toBe(false); expect(serializeGame(state)).toBe(before); };

describe('standing worker stewardship', () => {
  it('allocates immediately without buying land, spending coin or changing other orders', () => {
    const state = loaded(), town = townOf(state), land = state.land.settlements[town.id]!;
    const before = structuredClone({ towns: state.settlements, factions: state.factions, charters: state.charters, musters: state.musters, claimed: land.claimed, work: land.work, improvements: land.improvements });
    expect(land.worked.length).toBeLessThan(town.population);
    const result = issue(state, order(state));
    expect(land.worked).toHaveLength(town.population);
    expect(land.worked).not.toContain(town.cell);
    expect({ towns: state.settlements, factions: state.factions, charters: state.charters, musters: state.musters, claimed: land.claimed, work: land.work, improvements: land.improvements }).toEqual(before);
    expect(result.events.map(event => event.type)).toEqual(['worker_policy_set', 'worker_policy_allocated']);
    expect(observeWorkerPolicies(state, state.turnOwnerId)).toEqual([{ ...state.workerPolicies[0], blocker: null, assigned: town.population, capacity: town.population }]);
    const repeat = issue(state, order(state));
    expect(repeat.events.map(event => event.type)).toEqual(['worker_policy_set']);
    const events: Parameters<typeof advanceWorkerPolicies>[1] = [];
    advanceWorkerPolicies(state, events); expect(events).toEqual([]);
  });

  it('uses declared primary yields and a food-sensitive balanced secondary score', () => {
    const yields = { food: 2, industry: 3, coin: 4, knowledge: 5 };
    expect(workerPolicyScore(yields, 'balanced', true)).toEqual([33, 0]);
    expect(workerPolicyScore(yields, 'balanced', false)).toEqual([27, 0]);
    expect(workerPolicyScore(yields, 'food', true)).toEqual([2, 33]);
    expect(workerPolicyScore(yields, 'industry', false)).toEqual([3, 27]);
    expect(workerPolicyScore(yields, 'coin', false)).toEqual([4, 27]);
    expect(workerPolicyScore(yields, 'knowledge', false)).toEqual([5, 27]);
  });

  it('keeps deterministic best workers regardless of claim order and matches full ranking across capacities and foci', () => {
    fc.assert(fc.property(fc.constantFrom(...WORKER_POLICY_FOCI), fc.integer({ min: 1, max: 9 }), fc.boolean(), (focus, population, hungry) => {
      const state = loaded(), town = townOf(state), land = state.land.settlements[town.id]!;
      town.population = population; town.food = hungry ? 0 : 1000;
      const candidates = getSettlementLandObservation(state, town.factionId, town.id)!.cells.filter(cell => cell.claimed && cell.canWork);
      const expected = candidates.sort((a, b) => {
        const av = workerPolicyScore(a.yields.total, focus, hungry), bv = workerPolicyScore(b.yields.total, focus, hungry);
        return bv[0] - av[0] || bv[1] - av[1] || a.cell - b.cell;
      }).slice(0, population).map(cell => cell.cell).sort((a, b) => a - b);
      issue(state, order(state, focus)); expect(land.worked).toEqual(expected);
      land.claimed.reverse(); land.worked = [];
      allocatePolicyWorkers(state, state.workerPolicies, []); expect(land.worked).toEqual(expected);
    }), { numRuns: 45 });
  });

  it('assigns newly grown capacity after the harvest and preserves every replay and save boundary', () => {
    const state = loaded(), town = townOf(state), archive = createArchive(state, { mode: 'player', coverage: 'from-save' });
    const record = (command: GameCommand) => { const result = applyRecordedCommand(state, archive, command); expect(result.ok, result.error).toBe(true); expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state)); return result; };
    record(order(state, 'food')); const initial = town.population;
    for (let turn = 0; turn < 12 && town.population === initial; turn++) record({ type: 'endTurn', factionId: state.turnOwnerId });
    expect(town.population).toBeGreaterThan(initial);
    expect(state.land.settlements[town.id]!.worked).toHaveLength(town.population);
    expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
    const mirror = deserializeGame(serializeGame(state));
    for (let turns = 0; turns < 3; turns++) { expect(end(mirror)).toEqual(end(state)); expect(stateHash(mirror)).toBe(stateHash(state)); }
  });

  it('returns to manual management on a successful direct order, while failed direct orders retain policy', () => {
    const state = loaded(), town = townOf(state), land = state.land.settlements[town.id]!;
    issue(state, order(state));
    reject(state, { type: 'setWorkedTiles', factionId: town.factionId, settlementId: town.id, cells: [town.cell] });
    expect(state.workerPolicies).toHaveLength(1);
    const chosen = land.worked.slice(0, 1);
    const result = issue(state, { type: 'setWorkedTiles', factionId: town.factionId, settlementId: town.id, cells: chosen });
    expect(result.events.map(event => event.type)).toEqual(['worker_policy_revoked', 'worked_tiles_changed']);
    expect(state.workerPolicies).toEqual([]); end(state); expect(land.worked).toEqual(chosen);
    issue(state, order(state, 'industry')); const kept = [...land.worked];
    issue(state, order(state, 'none')); expect(land.worked).toEqual(kept); end(state); expect(land.worked).toEqual(kept);
  });

  it('rejects malformed, unknown, foreign and historical commands without mutation', () => {
    const state = loaded(), command = order(state);
    for (const edit of [{ focus: 'gold' }, { focus: null }, { extra: 1 }, { settlementId: 'settlement.missing' }, { factionId: state.factions[1]!.id }]) reject(state, { ...command, ...edit });
    reject(state, order(state, 'none'));
    const before = serializeGame(state); expect(applyCommandForVersion(state, command, 35).ok).toBe(false); expect(serializeGame(state)).toBe(before);
  });

  it('keeps blocked policies available for review and revocation during occupation', () => {
    const state = loaded(), town = townOf(state), land = state.land.settlements[town.id]!;
    town.occupationTurns = 2;
    const old = [...land.worked]; issue(state, order(state)); expect(land.worked).toEqual(old);
    expect(workerAllocationBlocker(state, town)).toMatch(/occupation/);
    expect(observeWorkerPolicies(state, town.factionId)[0]!.blocker).toMatch(/occupation/);
    end(state); expect(land.worked).toEqual(old);
    end(state); expect(land.worked.length).toBeGreaterThan(old.length);
    town.occupationTurns = 2; issue(state, order(state, 'none')); expect(state.workerPolicies).toEqual([]);
  });

  it('publishes owned compact summaries without mutating state or exposing foreign policies', () => {
    const state = loaded(); issue(state, order(state));
    const before = serializeGame(state), owner = state.turnOwnerId, rival = state.factions[1]!.id;
    const view = getObservation(state, owner, { landDetails: 'none' });
    expect(view.workerPolicies).toHaveLength(1); expect(view.land.settlements.every(town => town.cells.length === 0)).toBe(true);
    expect(getObservation(state, rival).workerPolicies).toEqual([]);
    view.workerPolicies![0]!.focus = 'coin'; expect(state.workerPolicies[0]!.focus).toBe('balanced');
    expect(serializeGame(state)).toBe(before);
  });

  it('uses owned cells outside the detail page and supports more than six workers', () => {
    const state = createGame({ seed: 17, size: 'tiny', factionCount: 2, generatorVersion: 4 });
    const origin = state.armies['army.1']!.cell;
    // Authored resource-free clearing only; all territory below is paid for.
    for (const cell of cellsWithin(state, origin, 8)) { state.world.terrain[cell] = 1; state.world.biome[cell] = 1; state.world.waterDepth[cell] = 0; delete state.resources.deposits[cell]; }
    issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Stewardship reach' });
    const town = townOf(state); town.population = 80; state.factions[0]!.treasury = 200000;
    const land = state.land.settlements[town.id]!;
    while (land.claimed.length < 80) {
      const cell = getSettlementLandObservation(state, town.factionId, town.id)!.borderExpansion.nextCell!;
      issue(state, { type: 'claimCell', factionId: town.factionId, settlementId: town.id, cell });
    }
    issue(state, order(state)); expect(land.worked.length).toBe(79);
    const page = getSettlementLandObservation(state, town.factionId, town.id, { offset: 0, limit: 24 })!;
    expect(land.worked.some(cell => !page.cells.some(quoted => quoted.cell === cell))).toBe(true);
    expect(land.worked.every(cell => land.claimed.includes(cell) && cell !== town.cell)).toBe(true);
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
  });

  it.each(['occupy', 'raze'] as const)('pauses for an actual siege and removes stewardship on %s before any later turn', outcome => {
    const state = conquestCampaign(), target = state.settlements[CONQUEST_FIXTURE.settlementId]!, army = state.armies[CONQUEST_FIXTURE.playerArmyId]!;
    const previousOwner = target.factionId, factionId = state.turnOwnerId;
    issue(state, { type: 'setWorkerPolicy', factionId: previousOwner, settlementId: target.id, focus: 'food' });
    army.formations = Array.from({ length: 6 }, (_, index) => createArmyFormation(`army.${state.nextId++}`, index < 3 ? 'unit.heavy_infantry' : 'unit.arbalester')).sort((a, b) => a.id < b.id ? -1 : 1);
    refreshAuthoredSight(state);
    issue(state, { type: 'declareWar', factionId, targetFactionId: previousOwner });
    issue(state, { type: 'besiege', factionId, armyId: army.id, settlementId: target.id });
    expect(observeWorkerPolicies(state, previousOwner)[0]!.blocker).toMatch(/siege/);
    const workers = [...state.land.settlements[target.id]!.worked];
    for (let turn = 0; turn < 3; turn++) end(state);
    expect(state.land.settlements[target.id]!.worked).toEqual(workers);
    issue(state, { type: 'assault', factionId, settlementId: target.id });
    reject(state, { type: 'setWorkerPolicy', factionId: previousOwner, settlementId: target.id, focus: 'none' });
    issue(state, { type: 'autoResolveBattle', factionId });
    expect(state.pendingCapture?.settlementId).toBe(target.id);
    reject(state, { type: 'setWorkerPolicy', factionId: previousOwner, settlementId: target.id, focus: 'none' });
    issue(state, { type: 'resolveCapture', factionId, settlementId: target.id, outcome });
    expect(state.workerPolicies).toEqual([]);
    expect(serializeGame(deserializeGame(serializeGame(state)))).toBe(serializeGame(state));
  });

  it('rejects invalid, duplicate and orphaned saved policies instead of silently repairing them', () => {
    const state = loaded(); issue(state, order(state));
    // Serializer retains strict shapes; loader additionally checks ownership/order.
    state.workerPolicies.push({ ...state.workerPolicies[0]! });
    expect(() => deserializeGame(serializeGame(state))).toThrow(/unique and sorted/);
    state.workerPolicies.pop(); state.workerPolicies[0]!.factionId = state.factions[1]!.id;
    expect(() => deserializeGame(serializeGame(state))).toThrow(/owned settlement/);
  });
});
