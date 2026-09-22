import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import captured from '../../../../packages/chronicle/src/fixtures/v15-development-baseline.json';
import type { CampaignArchive } from '../../../../packages/chronicle/src/index';
import { stablePrettyJson } from '../../../../packages/chronicle/src/json-equivalence';

// Frozen production implementation before direct formatting. It deliberately
// retains the intermediate compact string and parsed copy inside the timing.
const original = (value: unknown): string => JSON.stringify(JSON.parse(JSON.stringify(value, (_key, entry: unknown) => entry && typeof entry === 'object' && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry)) as unknown, null, 2);
const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { cases: Record<string, { archive: CampaignArchive }> };
const capturedArchive = fixture.cases.fieldCompleted!.archive;
const corpus = { ...capturedArchive, records: Array.from({ length: 4096 }, () => capturedArchive.records).flat() };
const freeze = (value: unknown, seen = new Set<object>()): void => {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const entry of Object.values(value)) freeze(entry, seen);
  Object.freeze(value);
};
freeze(corpus);
const digest = (value: string): string => createHash('sha256').update(value).digest('hex');
const inputBefore = digest(JSON.stringify(corpus));
const originalBytes = original(corpus);
assert.equal(stablePrettyJson(corpus), originalBytes);
for (const record of capturedArchive.records) assert.equal(stablePrettyJson(record), original(record));
const before: number[] = [], after: number[] = [];
for (let sample = -2; sample < 8; sample++) {
  for (const kind of sample % 2 ? ['before', 'after'] as const : ['after', 'before'] as const) {
    const renderer = kind === 'before' ? original : stablePrettyJson;
    let bytes = 0;
    const started = performance.now();
    bytes += renderer(corpus).length;
    // A real export renders both the whole archive and each order's detail page.
    for (const record of corpus.records) bytes += renderer(record).length;
    const elapsed = performance.now() - started;
    assert.ok(bytes > originalBytes.length);
    if (sample >= 0) (kind === 'before' ? before : after).push(elapsed);
  }
}
assert.equal(digest(JSON.stringify(corpus)), inputBefore);
const distribution = (samples: number[]) => {
  const ordered = [...samples].sort((a, b) => a - b);
  return { samples: samples.length, medianMs: ordered[Math.floor(ordered.length / 2)]!, p95Ms: ordered[Math.floor(ordered.length * .95)]!, valuesMs: samples };
};
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model, sourceRecords: capturedArchive.records.length, repeatedBatches: 4096,
  recordsPerSample: corpus.records.length, technicalBytes: Buffer.byteLength(originalBytes), inputSha256: inputBefore,
  outputSha256: digest(originalBytes), before: distribution(before), after: distribution(after),
  note: 'Serialization-only paired benchmark. The four retained v15 fieldCompleted records are repeated 4096 times, including their real battle/event data. This is a synthetic large history, not a simulated campaign. Each sample formats the whole archive and every record, matching the two technical rendering paths. Two warmups and eight alternating samples. Frozen inputs and exact byte comparison are checked outside timing. No rules, replay, hashing, validation, UI construction, or I/O is timed.' }, null, 2));
