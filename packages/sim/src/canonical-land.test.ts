import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { checksum } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from './index';
import { landStateSchema, type LandState } from './territory';
import type { GameState } from './types';

/** Retained pre-optimization algorithm, only as an independent byte-order oracle. */
function originalLandProjection(land: LandState): LandState {
  const sorted: unknown = JSON.parse(JSON.stringify(land, (_key, value: unknown) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : value));
  return landStateSchema.parse(sorted);
}
function assertOriginalBytes(game: GameState): void {
  const actual = serializeGame(game);
  const saved = JSON.parse(actual) as { state: { land: LandState }; stateChecksum: string };
  const expectedState = { ...saved.state, land: originalLandProjection(game.land) };
  const expected = JSON.stringify({ ...saved, stateChecksum: checksum(JSON.stringify(expectedState)), state: expectedState });
  expect(actual).toBe(expected);
  expect(stateHash(game)).toBe(checksum(expected));
}
function reverseProperties(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseProperties);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).reverse().map(([key, child]) => [key, reverseProperties(child)]));
}
function founded(seed = 17, turns = 0): GameState {
  const game = createGame({ seed, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4, rosterVersion: 3 });
  for (const faction of game.factions) {
    const army = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(item => item.unitId === 'unit.colonist'))!;
    const result = applyCommand(game, { type: 'found', factionId: faction.id, armyId: army.id, name: faction.name });
    expect(result.ok, result.error).toBe(true);
  }
  for (let turn = 0; turn < turns; turn++) expect(applyCommand(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
  return game;
}

describe('strict deterministic canonical land projection', () => {
  it.each([
    [17, '49492132', 16084, 'eef991e0', 21387],
    [20260905, '83ff6d7a', 16253, '940bcf02', 21431],
  ] as const)('preserves seed %i save bytes and seals captured before optimizing the helper', (seed, originHash, originBytes, developedHash, developedBytes) => {
    const origin = createGame({ seed, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 4, rosterVersion: 3 });
    expect(stateHashForVersion(origin, 11)).toBe(originHash); expect(serializeGameForVersion(origin, 11)).toHaveLength(originBytes);
    const developed = founded(seed, 12);
    expect(stateHashForVersion(developed, 11)).toBe(developedHash); expect(serializeGameForVersion(developed, 11)).toHaveLength(developedBytes);
    assertOriginalBytes(origin); assertOriginalBytes(developed);
    expect(stateHashForVersion(deserializeGame(serializeGame(developed)), 11)).toBe(developedHash);
  });
  it('matches the old complete serialized envelope for shuffled object insertion orders and real developed towns', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 1_000_000 }), fc.integer({ min: 0, max: 14 }), (seed, turns) => {
      const game = founded(seed, turns), original = serializeGame(game);
      game.land = reverseProperties(game.land) as LandState;
      expect(serializeGame(game)).toBe(original);
      assertOriginalBytes(game);
    }), { numRuns: 30, seed: 110061 });
  });
  it('preserves numeric cell order, lexical ID order, arrays and both paid-work shapes', () => {
    const game = founded();
    // Projection-level, schema-valid inputs exercise every shape. Global ownership
    // is deliberately not claimed here; full save import checks it independently.
    game.land = {
      known: { 'faction.z': { 10: { improvementId: 'improvement.quarry', factionId: 'faction.z', settlementId: 'settlement.10', biome: 2 }, 2: { improvementId: null, factionId: null, settlementId: null, biome: 1 } }, 'faction.a': {} },
      cultivation: { 'faction.z': 5, 'faction.a': 0 }, capitals: { 'faction.z': 'settlement.2', 'faction.a': null }, biomes: { 10: 2, 2: 1 },
      settlements: {
        'settlement.2': { borderGrowth: 7, work: { improvementId: 'improvement.quarry', kind: 'improve', startedTurn: 1, remainingTurns: 2, turns: 3, coinCost: 12, cell: 10 }, improvements: { 10: 'improvement.quarry', 2: 'improvement.terraced_fields' }, worked: [10, 2], claimed: [10, 2, 1] },
        'settlement.10': { borderGrowth: 0, work: { biome: 3, kind: 'terraform', startedTurn: 1, remainingTurns: 2, turns: 3, coinCost: 10, cell: 2 }, improvements: {}, worked: [], claimed: [2] },
      },
    };
    assertOriginalBytes(game);
    const parsed = JSON.parse(serializeGame(game)) as { state: { land: LandState } };
    expect(Object.keys(parsed.state.land)).toEqual(['settlements', 'biomes', 'capitals', 'cultivation', 'known']);
    expect(Object.keys(parsed.state.land.settlements)).toEqual(['settlement.10', 'settlement.2']);
    expect(Object.keys(parsed.state.land.biomes)).toEqual(['2', '10']);
    expect(Object.keys(parsed.state.land.known['faction.z']![10]!)).toEqual(['biome', 'settlementId', 'factionId', 'improvementId']);
    expect(parsed.state.land.settlements['settlement.2']!.worked).toEqual([10, 2]);
  });
  it('never mutates original dictionaries or nested arrays while sorting the detached projection', () => {
    const game = founded(), before = JSON.stringify(game.land);
    const freeze = (value: unknown): void => { if (!value || typeof value !== 'object') return; for (const child of Object.values(value)) freeze(child); Object.freeze(value); };
    freeze(game.land);
    assertOriginalBytes(game);
    expect(JSON.stringify(game.land)).toBe(before);
  });
  it('retains null-prototype JSON records but rejects inherited required fields at every object level', () => {
    const safe = founded();
    safe.land.capitals = Object.assign(Object.create(null) as Record<string, string | null>, safe.land.capitals);
    assertOriginalBytes(safe);
    const cases: ((game: GameState) => void)[] = [
      game => { game.land = Object.create(game.land) as LandState; },
      game => { game.land.settlements = Object.create(game.land.settlements) as LandState['settlements']; },
      game => { const id = Object.keys(game.land.settlements)[0]!; game.land.settlements[id] = Object.create(game.land.settlements[id]!) as LandState['settlements'][string]; },
      game => { const owner = game.factions[0]!.id, cell = Object.keys(game.land.known[owner]!)[0]!; game.land.known[owner]![Number(cell)] = Object.create(game.land.known[owner]![Number(cell)]!) as LandState['known'][string][string]; },
    ];
    for (const corrupt of cases) { const game = founded(); corrupt(game); expect(() => serializeGame(game)).toThrow(/plain data records/); }
  });
  it('rejects unknown canonical keys rather than projecting them away, even undefined fields and toJSON hooks', () => {
    const targets: ((game: GameState) => object)[] = [
      game => game.land,
      game => Object.values(game.land.settlements)[0]!,
      game => Object.values(game.land.known[game.turnOwnerId]!)[0]!,
    ];
    for (const target of targets) for (const value of [1, undefined, () => ({})]) {
      const game = founded(); Object.assign(target(game), { unexpectedCanonicalField: value });
      expect(() => serializeGame(game)).toThrow();
    }
    const game = founded(); let called = false;
    Object.assign(game.land, { toJSON: () => { called = true; return {}; } });
    expect(() => serializeGame(game)).toThrow(); expect(called).toBe(false);
  });
  it('retains strict number/key/work validation rather than accepting lossy JSON normalization', () => {
    const cases: ((game: GameState) => void)[] = [
      game => { game.land.cultivation[game.turnOwnerId] = NaN; },
      game => { game.land.biomes['01'] = 1; },
      game => { game.land.capitals[game.turnOwnerId] = Infinity as unknown as string; },
      game => { Object.values(game.land.settlements)[0]!.borderGrowth = 160; },
      game => { Object.values(game.land.settlements)[0]!.worked = [undefined as unknown as number]; },
      game => { Object.values(game.land.settlements)[0]!.work = { kind: 'improve', cell: 1, coinCost: 10, turns: 1, remainingTurns: 0, startedTurn: 1, improvementId: 'improvement.quarry' }; },
    ];
    for (const corrupt of cases) { const game = founded(); corrupt(game); expect(() => serializeGame(game)).toThrow(); }
  });
});
