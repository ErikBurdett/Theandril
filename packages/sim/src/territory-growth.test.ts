import { describe, expect, it } from 'vitest';
import { checksum, IMPROVEMENTS } from '@theandril/content';
import { hexDistance, neighbors } from '@theandril/mapgen';
import { applyCommand, applyCommandForVersion, createGame, deserializeGame, getSettlementLandObservation, serializeGame, stateHash } from './index';
import type { DomainEvent, GameCommand, GameState } from './types';
import { borderExpansionObservation, emptyLandState, getLandIndex, handleLandCapture, initializeSettlementLand, landCellYields, observeLandCell, refreshLandKnowledge, resolveLandTurn, settlementLandYield, validateLand } from './territory';
import { cellsWithin, indexes, rebuildIndexes } from './visibility';
import { withRules } from './rules';

function issue(state: GameState, command: GameCommand) { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; }
const end = (state: GameState) => issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
function scene(population = 8): GameState {
  const state = createGame({ seed: 17, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4 });
  // Authored physical clearing/population isolates expansion. All claims and
  // canonical visibility are then initialized by actual founding commands.
  const origin = state.armies['army.1']!.cell;
  for (const cell of cellsWithin(state, origin, 3)) { state.world.terrain[cell] = 1; state.world.waterDepth[cell] = 0; state.world.biome[cell] = 1; state.world.fertility[cell] = 80; }
  issue(state, { type: 'found', factionId: state.turnOwnerId, armyId: 'army.1', name: 'Growing witness' });
  state.settlements['settlement.5']!.population = population;
  return deserializeGame(serializeGame(state));
}
const town = (state: GameState) => state.settlements['settlement.5']!;
const land = (state: GameState) => state.land.settlements['settlement.5']!;
const growth = (state: GameState) => borderExpansionObservation(state, town(state));

describe('automatic city boundary growth', () => {
  it('quotes bounded conservative progress from population, actual infrastructure and acquired research', () => {
    const state = scene();
    expect(growth(state)).toMatchObject({ progress: 0, threshold: 40, rate: 3, blocker: null });
    town(state).buildings.push('building.market', 'building.archive');
    expect(growth(state).rate).toBe(5);
    state.factions[0]!.knowledge = 1000;
    issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.stewardship' });
    issue(state, { type: 'research', factionId: state.turnOwnerId, technologyId: 'technology.surveyed_estates' });
    expect(growth(state).rate).toBe(6);
    town(state).population = 20;
    expect(growth(state).rate).toBe(7);
    const saved = serializeGame(state), summary = getSettlementLandObservation(state, state.turnOwnerId, town(state).id)!;
    summary.borderExpansion.progress = 39;
    expect(serializeGame(state)).toBe(saved);
    expect(withRules(state, 10, () => growth(state))).toMatchObject({ rate: 0, nextCell: null });
  });

  it('expands one connected tile with deterministic ties, without free workers, improvements or yields', () => {
    const state = scene(), before = structuredClone(land(state)), yields = settlementLandYield(state, town(state)), geography = structuredClone(state.world);
    const candidates = cellsWithin(state, town(state).cell, 2).filter(cell => !getLandIndex(state).has(cell)).sort((a, b) => a - b);
    expect(growth(state).nextCell).toBe(candidates[0]);
    land(state).borderGrowth = growth(state).threshold - growth(state).rate + 1;
    const priorCoin = state.factions[0]!.treasury;
    const result = end(state);
    expect(result.events.filter(event => event.type === 'territory_expanded')).toHaveLength(1);
    expect(land(state).claimed).toEqual([...before.claimed, candidates[0]!].sort((a, b) => a - b));
    expect(land(state).borderGrowth).toBe(1); expect(growth(state).threshold).toBe(44);
    expect(land(state).worked).toEqual(before.worked); expect(land(state).improvements).toEqual(before.improvements);
    expect(settlementLandYield(state, town(state))).toEqual(yields); expect(state.world).toEqual(geography);
    expect(state.factions[0]!.treasury).toBeGreaterThan(priorCoin);
    expect(observeLandCell(state, state.turnOwnerId, candidates[0]!)).toMatchObject({ settlementId: town(state).id, factionId: state.turnOwnerId });
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('does not accumulate when a colony has filled its reach; growth remains unlocked by real population advancement', () => {
    const state = scene(1);
    expect(growth(state)).toMatchObject({ rate: 0, nextCell: null });
    for (let i = 0; i < 4; i++) resolveLandTurn(state, town(state));
    expect(land(state).borderGrowth).toBe(0);
    for (let i = 0; town(state).population < 3 && i < 30; i++) end(state);
    expect(town(state).population).toBeGreaterThanOrEqual(3);
    expect(growth(state).nextCell).not.toBeNull(); expect(land(state).borderGrowth).toBeGreaterThan(0);
  });

  it('pauses under occupation and siege, retaining paid work and progress until conditions change', () => {
    const state = scene(), target = land(state).claimed.find(cell => cell !== town(state).cell)!;
    issue(state, { type: 'improveTile', factionId: state.turnOwnerId, settlementId: town(state).id, cell: target, improvementId: 'improvement.terraced_fields' });
    land(state).borderGrowth = 10; town(state).occupationTurns = 2;
    const work = structuredClone(land(state).work); end(state);
    expect(land(state).borderGrowth).toBe(10); expect(land(state).work).toEqual(work);
    expect(growth(state).blocker).toMatch(/occupation/);
    town(state).occupationTurns = 0;
    state.sieges[town(state).id] = { settlementId: town(state).id, armyId: 'army.4', factionId: state.factions[1]!.id, startedTurn: 1, defenses: 30, supplies: 3, militiaStrength: 30, militiaMorale: 60, militiaFatigue: 0 };
    const events: DomainEvent[] = []; resolveLandTurn(state, town(state), events);
    expect(growth(state).blocker).toMatch(/siege/); expect(land(state).borderGrowth).toBe(10); expect(land(state).work).toEqual(work); expect(events).toEqual([]);
    delete state.sieges[town(state).id]; resolveLandTurn(state, town(state));
    expect(land(state).borderGrowth).toBe(13); expect(land(state).work?.remainingTurns).toBe(1);
  });

  it('resets captured civic progress without deleting developed land and releases territory on razing', () => {
    const state = scene(), previousOwner = state.turnOwnerId, nextOwner = state.factions[1]!.id;
    const cell = land(state).claimed.find(cell => cell !== town(state).cell)!;
    issue(state, { type: 'improveTile', factionId: previousOwner, settlementId: town(state).id, cell, improvementId: 'improvement.terraced_fields' });
    end(state); end(state); const claims = [...land(state).claimed];
    land(state).borderGrowth = 19; town(state).factionId = nextOwner;
    handleLandCapture(state, town(state).id, previousOwner);
    expect(land(state).borderGrowth).toBe(0); expect(land(state).claimed).toEqual(claims); expect(land(state).improvements[cell]).toBe('improvement.terraced_fields');
    const id = town(state).id; delete state.settlements[id]; handleLandCapture(state, id, nextOwner);
    expect(state.land.settlements[id]).toBeUndefined(); expect(claims.some(cell => getLandIndex(state).has(cell))).toBe(false);
  });

  it('excludes deep ocean and uncharted cells, stops at37 and never exposes foreign town options', () => {
    const state = scene(), origin = town(state).cell;
    const candidates = cellsWithin(state, origin, 3).filter(cell => !land(state).claimed.includes(cell));
    for (const cell of candidates) state.world.waterDepth[cell] = 2;
    expect(growth(state)).toMatchObject({ rate: 0, nextCell: null });
    const target = candidates.find(cell => hexDistance(origin, cell, state.world.width) === 2)!;
    state.world.waterDepth[target] = 0; state.explored[state.turnOwnerId]!.delete(target);
    expect(growth(state).nextCell).toBeNull(); state.explored[state.turnOwnerId]!.add(target);
    expect(growth(state).nextCell).toBe(target);
    expect(getSettlementLandObservation(state, state.factions[1]!.id, town(state).id)).toBeNull();
    land(state).claimed = cellsWithin(state, origin, 3).sort((a, b) => a - b);
    expect(land(state).claimed).toHaveLength(37); expect(growth(state)).toMatchObject({ threshold: 160, rate: 0, nextCell: null });
  });

  it('keeps hidden land memory historical when a rival boundary grows', () => {
    const state = scene(), cell = growth(state).nextCell!, foreign = state.factions[1]!.id;
    state.explored[foreign]!.add(cell); const old = observeLandCell(state, foreign, cell, true);
    expect(indexes(state).visible.get(foreign)?.has(cell)).not.toBe(true);
    land(state).borderGrowth = 39; end(state);
    expect(observeLandCell(state, foreign, cell)).toEqual(old);
    expect(observeLandCell(state, state.turnOwnerId, cell).settlementId).toBe(town(state).id);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('resolves competing expansions in stable town order without double claims', () => {
    const state = scene(), first = town(state), rival = state.factions[1]!.id;
    // Two explicitly authored three-hex-distant towns isolate a contested ring.
    const center = cellsWithin(state, first.cell, 3).find(cell => hexDistance(first.cell, cell, state.world.width) === 3)!;
    state.settlements['settlement.6'] = { ...first, id: 'settlement.6', factionId: rival, founderFactionId: rival, cell: center, buildings: [], queue: [] }; state.nextId = 7;
    state.land = emptyLandState(state.factions.map(faction => faction.id));
    initializeSettlementLand(state, first); initializeSettlementLand(state, state.settlements['settlement.6']!); rebuildIndexes(state);
    for (const faction of state.factions) refreshLandKnowledge(state, faction.id, indexes(state).visible.get(faction.id)!);
    for (const entry of Object.values(state.land.settlements)) entry.borderGrowth = 12 + entry.claimed.length * 4 - 1;
    const mirror = deserializeGame(serializeGame(state));
    mirror.settlements = Object.fromEntries(Object.entries(mirror.settlements).reverse());
    end(state); end(mirror); expect(stateHash(state)).toBe(stateHash(mirror));
    const claims = Object.values(state.land.settlements).flatMap(land => land.claimed);
    expect(new Set(claims).size).toBe(claims.length); validateLand(state);
  });

  it('leaves historical turns without civic accumulation and preserves modern save continuation', () => {
    const state = scene(), legacy = deserializeGame(serializeGame(state)), before = [...land(state).claimed];
    legacy.rosterVersion = 3; // Authored old-rule comparison, not a migrated archive.
    for (let i = 0; i < 20; i++) expect(applyCommandForVersion(legacy, { type: 'endTurn', factionId: legacy.turnOwnerId }, 10).ok).toBe(true);
    expect(land(legacy).borderGrowth).toBe(0); expect(land(legacy).claimed).toEqual(before);
    for (let i = 0; i < 7; i++) end(state);
    const mirror = deserializeGame(serializeGame(state));
    for (let i = 0; i < 20; i++) { expect(end(state)).toEqual(end(mirror)); expect(stateHash(state)).toBe(stateHash(mirror)); }
    expect(land(state).claimed.length).toBeGreaterThan(before.length);
  });

  it('rejects malformed or impossible civic progress without silently repairing a current save', () => {
    const state = scene();
    for (const value of [-1, 1.5, 40, 160]) {
      land(state).borderGrowth = value;
      expect(() => deserializeGame(serializeGame(state))).toThrow();
    }
    land(state).borderGrowth = 0;
    const raw = JSON.parse(serializeGame(state)) as { stateChecksum: string; state: { land: { settlements: Record<string, { borderGrowth?: number }> } } };
    delete raw.state.land.settlements[town(state).id]!.borderGrowth;
    raw.stateChecksum = checksum(JSON.stringify(raw.state));
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/borderGrowth/);
  });

  it('gates advanced improvements by knowledge but preserves a captured completed improvement without captor research', () => {
    const state = scene(), owner = state.turnOwnerId, cell = land(state).claimed.find(cell => cell !== town(state).cell)!;
    const definition = IMPROVEMENTS.find(item => item.id === 'improvement.polder')!;
    state.world.biome[cell] = 7; refreshLandKnowledge(state, owner, indexes(state).visible.get(owner)!); state.factions[0]!.treasury = 1000;
    const command = { type: 'improveTile', factionId: owner, settlementId: town(state).id, cell, improvementId: definition.id } as const;
    const before = stateHash(state); expect(applyCommand(state, command).error).toMatch(/Research/); expect(stateHash(state)).toBe(before);
    state.factions[0]!.knowledge = 1000;
    issue(state, { type: 'research', factionId: owner, technologyId: 'technology.stewardship' }); issue(state, { type: 'research', factionId: owner, technologyId: 'technology.waterworks' });
    issue(state, command); for (let i = 0; i < definition.turns; i++) end(state);
    expect(landCellYields(state, town(state), cell).improvement).toEqual(definition.yields);
    const nextOwner = state.factions[1]!.id; town(state).factionId = nextOwner; handleLandCapture(state, town(state).id, owner);
    expect(state.progression[nextOwner]!.technologies).toEqual([]); validateLand(state);
    expect(land(state).improvements[cell]).toBe(definition.id);
    expect(neighbors(town(state).cell, state.world.width, state.world.height)).toContain(cell);
  });
});
