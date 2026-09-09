import { performance } from 'node:perf_hooks';
import { strict as assert } from 'node:assert';
import { CONTENT_HASH, UNITS, checksum } from '../packages/content/src/index';
import { generateWorld } from '../packages/mapgen/src/index';
import { createResources } from '../packages/sim/src/resources';
import { autoResolveBattle, createBattle, type BattleFormation } from '../packages/sim/src/combat';

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const resources = (['tiny', 'standard', 'huge'] as const).map(size => {
  const world = generateWorld(17, size, 4), timings: number[] = [];
  const expected = createResources(world, ['faction.ashen_compact']);
  for (let run = 0; run < 7; run++) {
    const start = performance.now(), actual = createResources(world, ['faction.ashen_compact']);
    timings.push(performance.now() - start); assert.deepEqual(actual, expected);
  }
  return { size, cells: world.terrain.length, deposits: Object.keys(expected.deposits).length, types: new Set(Object.values(expected.deposits)).size,
    generationMedianMs: median(timings), hash: checksum(JSON.stringify(expected)) };
});
const roles = UNITS.filter(unit => unit.movementDomain !== 'naval' && !unit.canFound);
function army(side: string): BattleFormation[] {
  return Array.from({ length: 20 }, (_, index) => {
    const unit = roles[index % roles.length]!;
    return { id: `formation.${side}${String(index).padStart(2, '0')}`, unitId: unit.id, strength: unit.strength, maxStrength: unit.strength,
      morale: unit.morale, fatigue: 0, row: Math.floor(index / 5), column: index % 5, attack: unit.attack, armor: unit.armor, initiative: unit.initiative, range: unit.range };
  });
}
const input = { seed: 17027, terrain: 1, attacker: army('a'), defender: army('d') };
const start = createBattle(input, 10), expected = autoResolveBattle(start, 10), timings: number[] = [];
for (let run = 0; run < 7; run++) {
  const at = performance.now(), actual = autoResolveBattle(start, 10); timings.push(performance.now() - at); assert.deepEqual(actual, expected);
}
assert.deepEqual(createBattle(input, 10), start);
console.log(JSON.stringify({ contentHash: CONTENT_HASH, rulesVersion: 16, battleVersion: 10,
  scope: 'Headless CPU only. Resource timing excludes physical world generation; battle is a synthetic 20-versus-20 content-stat deployment without campaign officers, abilities or rendering. Seven warm runs, equality verified outside timing.', resources,
  battle: { formations: 40, enteringSoldiers: [...start.attacker, ...start.defender].reduce((sum, unit) => sum + unit.strength, 0), rounds: expected.round,
    resolveMedianMs: median(timings), result: expected.result, hash: checksum(JSON.stringify(expected)) } }, null, 2));
