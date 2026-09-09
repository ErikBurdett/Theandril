import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { autoResolveBattle, battleStateSchema, chooseBattleOrder, createBattle, resolveBattleRound, type BattleFormation, type BattleState } from './index';
import { isHull, sceneSoldiers } from './individual';
import type { BattleFact } from './presentation';

function formation(id: string, overrides: Partial<BattleFormation> = {}): BattleFormation {
  return { id, unitId: 'unit.guard', strength: 60, maxStrength: 60, morale: 80, fatigue: 0, row: 0, column: 2, attack: 12, armor: 8, initiative: 15, range: 0, ...overrides };
}
const battle = (attacker = [formation('formation.a')], defender = [formation('formation.b')], version = 10) => createBattle({ seed: 9271, terrain: 1, attacker, defender }, version);
function assertIdentities(state: BattleState) {
  for (const formation of [...state.attacker, ...state.defender]) {
    if (isHull(formation.unitId)) expect(formation.members).toBeUndefined();
    else { expect(formation.members).toHaveLength(formation.strength); expect(new Set(formation.members).size).toBe(formation.strength); }
  }
  const soldiers = sceneSoldiers([...state.attacker, ...state.defender]);
  expect(new Set(soldiers.map(item => item.id)).size).toBe(soldiers.length);
  return soldiers;
}

describe('canonical individual battle rules', () => {
  it('represents actual initial strength with stable identities, while frozen battle9 carries no future state', () => {
    const input = [formation('formation.a', { strength: 17 })], modern = battle(input), legacy = battle(input, undefined, 9);
    expect(modern.attacker[0]!.members).toEqual(Array.from({ length: 17 }, (_, index) => index));
    expect(sceneSoldiers(modern.attacker)).toHaveLength(17);
    expect(legacy.attacker[0]).not.toHaveProperty('members'); expect(legacy.attacker[0]).not.toHaveProperty('position');
    expect(sceneSoldiers(legacy.attacker)).toEqual([]);
    const original = structuredClone(modern);
    const next = resolveBattleRound(modern, { attacker: 'advance', defender: 'advance' }, 10);
    next.attacker[0]!.members!.pop(); next.attacker[0]!.position!.forward = 4;
    expect(modern).toEqual(original);
  });

  it('lets advancing infantry eventually reach a stationary braced line and records canonical movement/cohesion', () => {
    let state = battle(); const facts: BattleFact[] = [];
    for (let round = 0; round < 6 && !state.result; round++) state = resolveBattleRound(state, { attacker: 'advance', defender: 'brace' }, 10, { observe: fact => facts.push(fact) });
    expect(facts.some(fact => fact.type === 'attack' && fact.sourceId === 'formation.a')).toBe(true);
    expect(state.defender[0]!.position!.forward).toBe(0);
    expect(facts.some(fact => fact.movement?.formationId === 'formation.a')).toBe(true);
    expect(state.attacker[0]!.cohesion).toBeLessThan(100);
    expect(state.defender[0]!.strength).toBeLessThan(60);
  });

  it('event participants and killed identities exactly reconcile every volley and pursuit, including ward absorption', () => {
    let state = battle([formation('formation.a', { unitId: 'unit.bowman', range: 2, initiative: 25 })]);
    state.defender[0]!.ward = 8;
    const living = new Set(assertIdentities(state).map(item => item.id)), killed = new Set<string>();
    for (let round = 0; round < 12 && !state.result; round++) {
      const facts: BattleFact[] = [], before = structuredClone(state);
      state = resolveBattleRound(state, { attacker: 'advance', defender: round === 5 ? 'withdraw' : 'advance' }, 10, { observe: fact => facts.push(fact) });
      for (const fact of facts) {
        for (const id of [...fact.sourceSoldierIds ?? [], ...fact.targetSoldierIds ?? []]) { expect(living.has(id), id).toBe(true); expect(killed.has(id), id).toBe(false); }
        for (const id of fact.killedSoldierIds ?? []) { expect(living.delete(id), id).toBe(true); expect(killed.has(id), id).toBe(false); killed.add(id); }
        if (fact.type === 'attack') expect(fact.killedSoldierIds!.length).toBe(-fact.changes.find(change => change.formationId === fact.targetIds[0])!.strengthDelta);
      }
      expect([...living].sort()).toEqual(assertIdentities(state).map(item => item.id).sort());
      expect(facts.flatMap(fact => fact.killedSoldierIds ?? []).length).toBe([...before.attacker, ...before.defender].reduce((n, item) => n + item.strength, 0) - [...state.attacker, ...state.defender].reduce((n, item) => n + item.strength, 0));
    }
    expect(killed.size).toBeGreaterThan(0); expect(state.result).toBeTruthy();
  });

  it('pike screens reduce early mounted charge losses and support prevents the unprotected-flank bonus', () => {
    const run = (targetId: string, support = false) => {
      let state = battle([formation('formation.a', { unitId: 'unit.lancer', attack: 17, initiative: 25 })], [formation('formation.b', { unitId: targetId }), ...(support ? [formation('formation.c', { column: 1 })] : [])]);
      const facts: BattleFact[] = [];
      for (let i = 0; i < 2; i++) state = resolveBattleRound(state, { attacker: 'advance', defender: 'advance' }, 10, { observe: fact => facts.push(fact) });
      return { state, facts };
    };
    const open = run('unit.guard'), pikes = run('unit.halberdier');
    expect(pikes.facts.some(fact => fact.reason === 'pike screen')).toBe(true);
    expect(open.facts.some(fact => fact.reason === 'mounted charge')).toBe(true);
    expect(pikes.state.defender[0]!.strength).toBeGreaterThan(open.state.defender[0]!.strength);
    const flank = (support: boolean) => {
      let state = battle([formation('formation.a')], [formation('formation.b'), ...(support ? [formation('formation.c', { column: 1 })] : [])]);
      const facts: BattleFact[] = [];
      for (let i = 0; i < 4; i++) state = resolveBattleRound(state, { attacker: 'flank', defender: 'advance' }, 10, { observe: fact => facts.push(fact) });
      return facts.filter(fact => fact.type === 'attack' && fact.sourceId === 'formation.a');
    };
    expect(flank(false).some(fact => fact.reason === 'unprotected flank')).toBe(true);
    expect(flank(true).some(fact => fact.reason === 'unprotected flank')).toBe(false);
  });

  it('a missile line can fire before melee reaches contact, and naval strength remains one visible hull', () => {
    const firesAt = (range: number) => {
      let state = battle([formation('formation.a', { unitId: range ? 'unit.bowman' : 'unit.guard', range })]);
      const facts: BattleFact[] = [];
      while (!facts.some(fact => fact.type === 'attack' && fact.sourceId === 'formation.a') && state.round < 8) state = resolveBattleRound(state, { attacker: 'advance', defender: 'brace' }, 10, { observe: fact => facts.push(fact) });
      return facts.find(fact => fact.type === 'attack' && fact.sourceId === 'formation.a')!.round;
    };
    expect(firesAt(2)).toBeLessThan(firesAt(0));
    const naval = battle([formation('formation.a', { unitId: 'unit.transport', strength: 30 })], [formation('formation.b', { unitId: 'unit.coastal_warship' })]);
    expect(assertIdentities(naval)).toHaveLength(2);
    expect(naval.attacker[0]!.members).toBeUndefined();
  });

  it('manual AI orders and autoresolve have the same canonical hash through JSON continuation and detached observers', () => {
    const initial = battle([formation('formation.a', { unitId: 'unit.lancer', initiative: 25 }), formation('formation.c', { unitId: 'unit.bowman', column: 1, row: 1, range: 2 })]);
    let manual = initial;
    while (!manual.result) {
      manual = resolveBattleRound(battleStateSchema.parse(JSON.parse(JSON.stringify(manual))), { attacker: chooseBattleOrder(manual, 'attacker'), defender: chooseBattleOrder(manual, 'defender') }, 10);
      assertIdentities(manual);
    }
    const automatic = autoResolveBattle(initial, 10);
    expect(checksum(JSON.stringify(manual))).toBe(checksum(JSON.stringify(automatic)));
    expect(battleStateSchema.parse(JSON.parse(JSON.stringify(automatic)))).toEqual(automatic);
    expect(initial.round).toBe(0);
  });
});
