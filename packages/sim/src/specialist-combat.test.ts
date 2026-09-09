import { expect, test } from 'vitest';
import { UNITS } from '@theandril/content';
import { autoResolveBattle, chooseBattleOrder, createBattle, resolveBattleRound, type BattleFormation } from './combat';

function formation(id: string, unitId: string, row = 0, column = 2): BattleFormation {
  const unit = UNITS.find(item => item.id === unitId)!;
  return { id, unitId, strength: unit.strength, maxStrength: unit.strength, morale: unit.morale, fatigue: 0, attack: unit.attack, armor: unit.armor, initiative: unit.initiative, range: unit.range, row, column };
}

test('arbalesters fire from rear ranks, halberdiers reach from the second rank, and lancers must close', () => {
  for (const [unitId, row, canStrike] of [['unit.arbalester', 2, true], ['unit.halberdier', 1, true], ['unit.halberdier', 2, false], ['unit.lancer', 1, false]] as const) {
    const input = createBattle({ seed: 92, terrain: 1, attacker: [formation('front', 'unit.guard'), formation('rear', unitId, row)], defender: [formation('enemy', 'unit.heavy_infantry')] });
    const battle = resolveBattleRound(input, { attacker: 'brace', defender: 'brace' });
    expect(battle.log.some(line => line.startsWith('rear struck'))).toBe(canStrike);
  }
});

test('a mixed specialist battle has identical automatic and manually advanced results across seeds and terrain', () => {
  for (const seed of [1, 29, 198, 20260908]) for (const terrain of [1, 2, 3]) {
    const input = createBattle({ seed, terrain, attacker: [formation('a', 'unit.halberdier'), formation('b', 'unit.lancer', 0, 4), formation('c', 'unit.skirmisher', 1), formation('d', 'unit.arbalester', 2)], defender: [formation('e', 'unit.heavy_infantry'), formation('f', 'unit.cavalry', 0, 4), formation('g', 'unit.spearman', 1), formation('h', 'unit.scout', 2)] });
    let manual = input;
    while (!manual.result) manual = resolveBattleRound(manual, { attacker: chooseBattleOrder(manual, 'attacker'), defender: chooseBattleOrder(manual, 'defender') });
    expect(autoResolveBattle(input)).toEqual(manual);
    expect(manual.result).not.toBeNull();
  }
});
