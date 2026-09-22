import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import captured from '../../../../packages/chronicle/src/fixtures/v15-development-baseline.json';
import { sameJson, stableJson } from '../../../../packages/chronicle/src/json-equivalence';
import type { CampaignArchive } from '../../../../packages/chronicle/src/index';

const original = (value: unknown) => JSON.stringify(value, (_key, entry: unknown) => entry && typeof entry === 'object' && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
const reverseKeys = (value: unknown): unknown => Array.isArray(value) ? value.map(reverseKeys)
  : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).reverse().map(([key, entry]) => [key, reverseKeys(entry)])) : value;
const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { cases: Record<string, { archive: CampaignArchive }> };
const records = fixture.cases.fieldCompleted!.archive.records;
const pairs = records.flatMap(record => [record.events, record.battles].map(value => ({ value, reordered: reverseKeys(value) })));
for (const { value, reordered } of pairs) {
  assert.equal(original(value), original(reordered));
  assert.equal(stableJson(value), original(value));
  assert.equal(sameJson(value, reordered), true);
}
const before: number[] = [], after: number[] = [];
for (let sample = -4; sample < 20; sample++) {
  for (const kind of sample % 2 ? ['before', 'after'] as const : ['after', 'before'] as const) {
    let matches = 0;
    const started = performance.now();
    for (let repeat = 0; repeat < 50; repeat++) for (const { value, reordered } of pairs) {
      if (kind === 'before' ? original(value) === original(reordered) : sameJson(value, reordered)) matches++;
    }
    const elapsed = performance.now() - started;
    assert.equal(matches, pairs.length * 50);
    if (sample >= 0) (kind === 'before' ? before : after).push(elapsed);
  }
}
const distribution = (samples: number[]) => {
  const ordered = [...samples].sort((a, b) => a - b);
  return { samples: samples.length, medianMs: ordered[Math.floor(ordered.length / 2)]!, p95Ms: ordered[Math.floor(ordered.length * .95)]! };
};
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model, pairs: pairs.length, comparisonsPerSample: pairs.length * 50,
  corpusSha256: createHash('sha256').update(original(pairs)).digest('hex'), before: distribution(before), after: distribution(after),
  note: 'Paired original canonical-string comparison vs structural JSON comparison over retained v15 battle/event records with reversed object key insertion. Four warmups, twenty samples, alternating execution order; corpus construction and correctness checks outside timing. No campaign execution, hashing, archive parsing, rendering or I/O in samples. Technical-renderer bytes independently equal the original.' }, null, 2));
