import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { performance } from 'node:perf_hooks';
import { deserializeGame, serializeGame, stateHashForVersion } from '@theandril/sim';
import { resumeJournal, type CampaignArchive } from '@theandril/chronicle';
import { SaveStore } from '@theandril/persistence';

const label = process.argv[2]; assert.ok(label === 'before' || label === 'after');
const input = new URL('../../hermes-analysis/qa/captured-standard-long-748291.json.gz', import.meta.url);
const bytes = readFileSync(input), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, '56a81b5fbc91c0bea89b8cc5f78ace519d7fa0d6109545f7444af5dcce159780');
const source = JSON.parse(gunzipSync(bytes, { maxOutputLength: 128 * 1024 * 1024 }).toString('utf8')) as { snapshot: string; archive: CampaignArchive };
assert.equal(source.archive.records.length, 114244);
const battles = source.archive.records.reduce((sum, record) => sum + record.battles.length, 0); assert.equal(battles, 1496);
const game = deserializeGame(source.snapshot), journal = resumeJournal(game, source.archive);
assert.equal(stateHashForVersion(game, 16), '0f0b85f5');
const db = new SaveStore(`hermes-review-fix-2-retained-${label}`);
const measurements: Record<string, unknown> = {};
try {
  for (const phase of ['cold', 'noop', 'append'] as const) {
    if (phase === 'append') {
      // This is the original VICTORY capture: a genuine refused endTurn is the legal journal suffix,
      // not a fabricated continuation or an edit to any of its historical records/seals.
      const result = journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId });
      assert.equal(result.ok, false);
      measurements.appendResult = result;
    }
    const start = performance.now(); await db.saveCampaign(game, journal, 'auto');
    measurements[phase] = { ms: performance.now() - start, stats: db.lastCampaignSaveStats, memory: process.memoryUsage(), maxRssKiB: process.resourceUsage().maxRSS };
    assert.equal(db.lastCampaignSaveStats?.suffixRecords, phase === 'cold' ? 114244 : Number(phase === 'append'));
    assert.equal(db.lastCampaignSaveStats?.historyPayloadWrites, phase === 'cold' ? 1344 : phase === 'noop' ? 0 : 3);
  }
  const start = performance.now(), loaded = await db.loadLatestCampaign('auto');
  measurements.loadMs = performance.now() - start;
  assert.equal(serializeGame(loaded.game), serializeGame(game));
  const archive = loaded.journal.materialize();
  assert.deepEqual(archive.records.slice(0, source.archive.records.length), source.archive.records);
  assert.deepEqual(archive.records.at(-1), journal.prepareCommit(game, source.archive.records.length).records[0]);
  const { records: _records, ...header } = archive, { records: _sourceRecords, ...sourceHeader } = source.archive;
  assert.deepEqual(header, sourceHeader);
  measurements.completeLoadEquality = true;
  measurements.storage = { generations: await db.table('campaignGenerations').count(), blobs: await db.table('campaignBlobs').count(), replicas: await db.table('campaignPayloads').count() };
} finally { await db.delete(); }
assert.equal(await SaveStore.exists(db.name), false);
console.log(JSON.stringify({ label, sha256, records: source.archive.records.length, battles, measurements, databaseDeleted: true,
  runtime: process.version, sourceSha256: createHash('sha256').update(readFileSync(new URL('../../../packages/persistence/src/campaign-storage.ts', import.meta.url))).digest('hex'),
  memory: process.memoryUsage(), maxRssKiB: process.resourceUsage().maxRSS,
  scope: 'One sequential cold/noop/one-record append sample, real retained victory; no forced GC. Fake IndexedDB is not disk timing. Save times exclude capture/journal parse, complete-load equality is measured separately. Peak RSS includes all parsing/equality. Existing full historical replay evidence is not rerun or relabeled here.' }, null, 2));
