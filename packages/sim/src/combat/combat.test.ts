import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  autoResolveBattle, battleStateSchema, legacyBattleStateSchema, chooseBattleOrder, createBattle,
  MAX_BATTLE_ROUNDS, resolveBattleRound, type BattleFormation, type BattleInput, type BattleOrder,
} from './index';

function formation(id: string, overrides: Partial<BattleFormation> = {}): BattleFormation {
  return { id, unitId: 'unit.oath_guard', strength: 100, maxStrength: 100, morale: 80,
    fatigue: 0, row: 0, column: 2, attack: 26, armor: 5, initiative: 20, range: 0, ...overrides };
}
function fixture(overrides: Partial<BattleInput> = {}): BattleInput {
  return { seed: 42, terrain: 1,
    attacker: [formation('army.a', { initiative: 30 })], defender: [formation('army.b')], ...overrides };
}
const advance = { attacker: 'advance', defender: 'advance' } as const;

describe('formation battle rules', () => {
  it('applies casualties, morale loss and fatigue while preserving the input', () => {
    const battle = createBattle(fixture());
    const original = structuredClone(battle);
    const next = resolveBattleRound(battle, advance);
    expect(battle).toEqual(original);
    expect(next.round).toBe(1);
    expect(next.attacker[0]!.strength).toBeLessThan(100);
    expect(next.defender[0]!.strength).toBeLessThan(100);
    expect(next.attacker[0]!.morale).toBeLessThan(80);
    expect(next.attacker[0]!.fatigue).toBeGreaterThan(0);
    expect(next.rngState).not.toBe(next.seed);
    next.attacker[0]!.strength = 1;
    expect(battle.attacker[0]!.strength).toBe(100);
  });

  it('gives elevated defenders real protection and woodland reduces ranged damage', () => {
    const plain = resolveBattleRound(createBattle(fixture()), advance);
    const hills = resolveBattleRound(createBattle(fixture({ terrain: 3 })), advance);
    expect(hills.defender[0]!.strength).toBeGreaterThan(plain.defender[0]!.strength);
    const ranged = [formation('army.a', { initiative: 30, range: 2 })];
    const open = resolveBattleRound(createBattle(fixture({ attacker: ranged })), advance);
    const forest = resolveBattleRound(createBattle(fixture({ attacker: ranged, terrain: 2 })), advance);
    expect(forest.defender[0]!.strength).toBeGreaterThan(open.defender[0]!.strength);
  });

  it('trades flank damage and morale shock for fatigue and exposure', () => {
    const plain = resolveBattleRound(createBattle(fixture()), advance);
    const flanked = resolveBattleRound(createBattle(fixture()), { attacker: 'flank', defender: 'advance' });
    expect(flanked.defender[0]!.strength).toBeLessThan(plain.defender[0]!.strength);
    expect(flanked.defender[0]!.morale).toBeLessThan(plain.defender[0]!.morale);
    expect(flanked.attacker[0]!.fatigue).toBeGreaterThan(plain.attacker[0]!.fatigue);
    const braced = resolveBattleRound(createBattle(fixture()), { attacker: 'advance', defender: 'brace' });
    expect(braced.defender[0]!.strength).toBeGreaterThan(plain.defender[0]!.strength);
    expect(braced.attacker[0]!.strength).toBeGreaterThan(plain.attacker[0]!.strength);
  });

  it('fatigued formations hit less effectively and act later', () => {
    const rested = resolveBattleRound(createBattle(fixture()), advance);
    const tired = resolveBattleRound(createBattle(fixture({
      attacker: [formation('army.a', { fatigue: 90, initiative: 30 })],
    })), advance);
    expect(tired.defender[0]!.strength).toBeGreaterThan(rested.defender[0]!.strength);
    expect(tired.attacker[0]!.fatigue).toBeLessThanOrEqual(100);
  });

  it('ranged rear formations can fire while melee reserves need to close distance', () => {
    const army = (range: number) => [formation('army.front', { column: 2, initiative: 10 }), formation('army.rear', { row: 2, column: 2, range, initiative: 40 })];
    const ranged = resolveBattleRound(createBattle(fixture({ attacker: army(2) })), { attacker: 'brace', defender: 'brace' });
    const melee = resolveBattleRound(createBattle(fixture({ attacker: army(0) })), { attacker: 'brace', defender: 'brace' });
    expect(ranged.log.some(line => line.startsWith('army.rear struck'))).toBe(true);
    expect(melee.log.some(line => line.startsWith('army.rear struck'))).toBe(false);
    expect(ranged.defender[0]!.strength).toBeLessThan(melee.defender[0]!.strength);
  });

  it('routes low-morale formations before annihilation and applies pursuit losses', () => {
    const battle = createBattle(fixture({ defender: [formation('army.b', { morale: 5 })] }));
    const result = resolveBattleRound(battle, advance);
    expect(result.result).toEqual({ winner: 'attacker', reason: 'morale rout' });
    expect(result.defender[0]!.strength).toBeGreaterThan(0);
    expect(result.defender[0]!.morale).toBe(0);
    expect(result.log.some(line => line.includes('during pursuit'))).toBe(true);
    expect(result.attacker[0]!.strength).toBe(100);
  });

  it('uses initiative to decide which fragile line breaks first', () => {
    const fragile = (attackerInitiative: number) => fixture({
      attacker: [formation('army.a', { morale: 5, initiative: attackerInitiative })],
      defender: [formation('army.b', { morale: 5, initiative: 20 })],
    });
    expect(resolveBattleRound(createBattle(fragile(40)), advance).result?.winner).toBe('attacker');
    expect(resolveBattleRound(createBattle(fragile(1)), advance).result?.winner).toBe('defender');
  });

  it('resolves withdrawal immediately with surviving retreaters and pursuit', () => {
    const battle = createBattle(fixture());
    const withdrawn = resolveBattleRound(battle, { attacker: 'withdraw', defender: 'advance' });
    expect(withdrawn.result).toEqual({ winner: 'defender', reason: 'ordered withdrawal' });
    expect(withdrawn.attacker[0]!.strength).toBeLessThan(100);
    expect(withdrawn.attacker[0]!.strength).toBeGreaterThan(0);
    expect(withdrawn.defender[0]!.strength).toBe(100);
    const mutual = resolveBattleRound(battle, { attacker: 'withdraw', defender: 'withdraw' });
    expect(mutual.result?.winner).toBe('draw');
    expect(mutual.attacker[0]!.strength).toBe(100);
    expect(mutual.defender[0]!.strength).toBe(100);
  });

  it('caps a protected stalemate at twelve rounds', () => {
    let battle = createBattle(fixture({
      attacker: [formation('army.a', { column: 0, attack: 0, armor: 100 })],
      defender: [formation('army.b', { column: 4, attack: 0, armor: 100 })],
    }));
    for (let round = 0; round < MAX_BATTLE_ROUNDS; round++) {
      battle = resolveBattleRound(battle, { attacker: 'brace', defender: 'brace' });
    }
    expect(battle.round).toBe(12);
    expect(battle.result).toEqual({ winner: 'draw', reason: 'round limit' });
    expect(resolveBattleRound(battle, advance)).toEqual(battle);
  });
});

describe('battle determinism, persistence and bounds', () => {
  it('uses four ranks for twenty-versus-twenty battles while freezing historical twelve-formation limits', () => {
    const side = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => formation(`${prefix}.${index}`, { row: Math.floor(index / 5), column: index % 5, range: index >= 15 ? 2 : 0 }));
    const input = fixture({ attacker: side('army.a', 20), defender: side('army.b', 20) });
    const initial = createBattle(input, 8);
    expect(initial.attacker).toHaveLength(20); expect(initial.attacker.find(item => item.id === 'army.a.19')!.row).toBe(3);
    expect(legacyBattleStateSchema.safeParse(initial).success).toBe(false);
    expect(() => createBattle(input, 7)).toThrow();
    expect(() => resolveBattleRound(initial, advance, 7)).toThrow();
    expect(() => autoResolveBattle(initial, 7)).toThrow();
    let manual = initial;
    while (!manual.result) manual = resolveBattleRound(JSON.parse(JSON.stringify(manual)), { attacker: chooseBattleOrder(manual, 'attacker'), defender: chooseBattleOrder(manual, 'defender') }, 8);
    expect(manual).toEqual(autoResolveBattle(initial, 8));
    expect([...manual.attacker, ...manual.defender]).toHaveLength(40);
    expect(manual.attacker.some(item => item.strength < item.maxStrength)).toBe(true);
    const oldInput = fixture({ attacker: side('army.a', 12), defender: side('army.b', 12) });
    expect(autoResolveBattle(createBattle(oldInput, 7), 7)).toEqual(autoResolveBattle(createBattle(oldInput, 8), 8));
  });
  it('autoresolve exactly matches manual rounds using the same AI orders', () => {
    const initial = createBattle(fixture({ terrain: 3 }));
    let manual = initial;
    while (!manual.result) {
      manual = resolveBattleRound(manual, { attacker: chooseBattleOrder(manual, 'attacker'), defender: chooseBattleOrder(manual, 'defender') });
    }
    expect(autoResolveBattle(initial)).toEqual(manual);
    expect(initial.round).toBe(0);
  });

  it('is independent of input formation insertion order', () => {
    const input = fixture({
      attacker: [formation('army.z', { column: 0 }), formation('army.a', { column: 3 })],
      defender: [formation('army.y', { column: 0 }), formation('army.b', { column: 3 })],
    });
    const normal = createBattle(input);
    const reverse = createBattle({ ...input, attacker: [...input.attacker].reverse(), defender: [...input.defender].reverse() });
    expect(reverse).toEqual(normal);
    expect(autoResolveBattle(reverse)).toEqual(autoResolveBattle(normal));
    const resolved = autoResolveBattle(normal);
    expect(autoResolveBattle({ ...resolved, attacker: [...resolved.attacker].reverse() })).toEqual(resolved);
  });

  it('preserves exact continuation after JSON save/load midway through battle', () => {
    const middle = resolveBattleRound(createBattle(fixture()), advance);
    const restored = battleStateSchema.parse(JSON.parse(JSON.stringify(middle)));
    expect(restored).toEqual(middle);
    expect(autoResolveBattle(restored)).toEqual(autoResolveBattle(middle));
  });

  it('rejects malformed fields, conflicting slots/IDs, dead starts and illegal orders', () => {
    const input = fixture();
    expect(() => createBattle({ ...input, seed: NaN })).toThrow();
    expect(() => createBattle({ ...input, attacker: [] })).toThrow();
    expect(() => createBattle({ ...input, attacker: Array.from({ length: 13 }, (_, i) => formation(`army.a${i}`)) })).toThrow();
    expect(() => createBattle({ ...input, attacker: [formation('army.a', { row: 4 })] })).toThrow();
    expect(() => createBattle({ ...input, attacker: [formation('army.a', { column: 5 })] })).toThrow();
    expect(() => createBattle({ ...input, attacker: [formation('army.a', { strength: 0 })] })).toThrow();
    expect(() => createBattle({ ...input, attacker: [formation('army.a', { strength: 101 })] })).toThrow();
    expect(() => createBattle({ ...input, defender: [formation('army.a')] })).toThrow();
    expect(() => createBattle({ ...input, attacker: [formation('army.a'), formation('army.c')] })).toThrow();
    const state = createBattle(input);
    expect(() => battleStateSchema.parse({ ...state, unknownField: true })).toThrow();
    expect(() => battleStateSchema.parse({ ...state, round: 12 })).toThrow();
    expect(() => resolveBattleRound(state, { attacker: 'cheat' as BattleOrder, defender: 'advance' })).toThrow();
    expect(state).toEqual(createBattle(input));
  });

  it('terminates deterministically with bounded casualties and integer stats across varied formations', () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 0xffffffff }), fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 500 }), fc.integer({ min: 1, max: 100 }),
      fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 4 }),
      (seed, count, strength, morale, armor, terrain) => {
        const army = (side: string) => Array.from({ length: count }, (_, i) => formation(`army.${side}${i}`, {
          row: Math.floor(i / 5), column: i % 5, strength, maxStrength: strength,
          morale, armor, attack: (seed + i) % 101, initiative: i * 5, range: i % 3,
        }));
        const initial = createBattle({ seed, terrain, attacker: army('a'), defender: army('d') });
        const result = autoResolveBattle(initial);
        expect(result.result).toBeDefined();
        expect(result.round).toBeLessThanOrEqual(MAX_BATTLE_ROUNDS);
        expect(result.log.length).toBeLessThanOrEqual(256);
        expect(battleStateSchema.safeParse(result).success).toBe(true);
        expect(autoResolveBattle(initial)).toEqual(result);
        for (const unit of [...result.attacker, ...result.defender]) {
          expect(unit.strength).toBeGreaterThanOrEqual(0);
          expect(unit.strength).toBeLessThanOrEqual(strength);
          expect(Number.isInteger(unit.strength)).toBe(true);
        }
      },
    ), { numRuns: 150, seed: 20260905 });
  });
});
