import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import captured from '../../../../packages/chronicle/src/fixtures/v15-development-baseline.json';
import { applyCommand, campaignBattleSchema, type CampaignBattle } from '@theandril/sim';
import { borderBattleCampaign } from '../../../../packages/test-fixtures/src/combat-fixture';
import { validatedProjection } from './battle-projection-candidate';

const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { cases: Record<string, { archive: { records: { battles: CampaignBattle[] }[] } }> };
const historical = Object.values(fixture.cases).flatMap(entry => entry.archive.records.flatMap(record => record.battles));
const game = borderBattleCampaign();
for (const command of [
  { type: 'declareWar', factionId: game.factions[0]!.id, targetFactionId: game.factions[1]!.id },
  { type: 'attack', factionId: game.factions[0]!.id, armyId: 'army.2', targetArmyId: 'army.4' },
  { type: 'autoResolveBattle', factionId: game.factions[0]!.id },
] as const) {
  const result = applyCommand(game, command);
  assert.equal(result.ok, true, result.error);
}
assert.equal(game.battleReports.length, 1);
const cases = [{ name: 'retained-v15', reports: historical }, { name: 'ordinary-v17-border-battle', reports: game.battleReports }];
const results = cases.map(({ name, reports }) => {
  assert.ok(reports.length);
  const original = (report: CampaignBattle) => campaignBattleSchema.parse(report);
  const candidate = validatedProjection(original);
  for (const report of reports) assert.deepEqual(candidate(report), original(report));
  const before: number[] = [], after: number[] = [];
  for (let sample = -2; sample < 8; sample++) {
    for (const kind of sample % 2 ? ['before', 'after'] as const : ['after', 'before'] as const) {
      const method = kind === 'before' ? original : candidate;
      let length = 0;
      const started = performance.now();
      for (let repeat = 0; repeat < 1000; repeat++) for (const report of reports) length += method(report).combat.log.length;
      const elapsed = performance.now() - started;
      assert.ok(length > 0);
      if (sample >= 0) (kind === 'before' ? before : after).push(elapsed);
    }
  }
  const distribution = (values: number[]) => ({ medianMs: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)], samplesMs: values });
  return { name, reports: reports.length, parsesPerSample: reports.length * 1000,
    inputSha256: createHash('sha256').update(JSON.stringify(reports)).digest('hex'), bytes: Buffer.byteLength(JSON.stringify(reports)),
    before: distribution(before), after: distribution(after) };
});
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model, cases: results,
  note: 'Experimental validation/projection only. Every candidate hit rechecks all own keys, values, prototypes and data descriptors recursively against a private parsed projection. Public returned projections are not proposed for caching. Two warmups/eight alternating paired samples. Corpus contains real retained v15 reports and a new completed v17 battle produced by ordinary commands from the disclosed existing authored border fixture. No campaign throughput claim.' }, null, 2));
