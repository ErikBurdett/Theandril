import 'fake-indexeddb/auto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { performance } from 'node:perf_hooks';
import { deserializeGame, serializeGame, stateHash, stateHashForVersion } from '@theandril/sim';
import { replayArchive, resumeJournal, type CampaignArchive } from '@theandril/chronicle';
import { SaveStore, deserializeCampaign, exportSave, importSave, serializeCampaign } from '@theandril/persistence';

// Original retained bytes are read-only. No regeneration, rule overrides or payload repairs.
const phase = process.argv[2] ?? 'save-load';
assert.ok(['save-load', 'portable', 'replay', 'replay-browser'].includes(phase) && process.argv.length <= 3);
const path = new URL('../../hermes-analysis/qa/captured-standard-long-748291.json.gz', import.meta.url);
const portablePath = new URL(phase === 'replay-browser' ? './retained-browser.theandril' : './retained-standard-long-748291.theandril', import.meta.url);
const compressed = readFileSync(path);
const sha256 = createHash('sha256').update(compressed).digest('hex');
assert.equal(sha256, '56a81b5fbc91c0bea89b8cc5f78ace519d7fa0d6109545f7444af5dcce159780');
const source = JSON.parse(gunzipSync(compressed, { maxOutputLength: 128 * 1024 * 1024 }).toString('utf8')) as { snapshot: string; archive: CampaignArchive };
const game = deserializeGame(source.snapshot);
assert.equal(stateHashForVersion(game, 16), '0f0b85f5');
assert.equal(game.turn, 446); assert.equal(source.archive.records.length, 114244);
const started = performance.now();
const measurements: Record<string, unknown> = {};
if (phase === 'save-load') {
  const journal = resumeJournal(game, source.archive);
  const db = new SaveStore('hermes-retained-standard-long-748291');
  try {
    await db.save(source.archive.initialSave, 'auto');
    const beforeQuota = await db.table('campaignGenerations').toArray();
    const quota = () => { throw new DOMException('Injected storage quota exhaustion', 'QuotaExceededError'); };
    db.table('campaignManifests').hook('creating', quota);
    await assert.rejects(db.saveCampaign(game, journal, 'auto'), /quota/i);
    db.table('campaignManifests').hook('creating').unsubscribe(quota);
    assert.deepEqual(await db.table('campaignGenerations').toArray(), beforeQuota);
    assert.equal(await db.table('campaignPayloads').count(), 0);
    assert.equal(await db.loadLatest('auto'), source.archive.initialSave);
    const cold = performance.now(); await db.saveCampaign(game, journal, 'auto');
    measurements.saveMs = performance.now() - cold; measurements.cold = db.lastCampaignSaveStats;
    const noop = performance.now(); await db.saveCampaign(game, journal, 'auto');
    measurements.noopMs = performance.now() - noop; measurements.noop = db.lastCampaignSaveStats;
    assert.equal(db.lastCampaignSaveStats?.historyPayloadWrites, 0);
    assert.equal(db.lastCampaignSaveStats?.suffixRecords, 0);
    const load = performance.now(); const loaded = await db.loadLatestCampaign('auto');
    measurements.loadMs = performance.now() - load;
    assert.equal(serializeGame(loaded.game), serializeGame(game));
    assert.deepEqual(loaded.journal.materialize(), source.archive);
    // Corrupt newest manifest only; recover prior full generation, retaining all evidence.
    const latest = await db.table('campaignGenerations').orderBy('id').last();
    await db.table('campaignManifests').put({ generationId: latest.id, payload: 'broken retained-case manifest' });
    assert.deepEqual((await db.loadLatestCampaign('auto')).journal.materialize(), source.archive);
    assert.equal((await db.table('campaignManifests').get(latest.id)).payload, 'broken retained-case manifest');
    const blobs = await db.table('campaignBlobs').toArray();
    const manifests = await db.table('campaignManifests').toArray();
    measurements.storage = { generations: await db.table('campaignGenerations').count(), blobs: blobs.length,
      replicas: await db.table('campaignPayloads').count(), largestBlob: Math.max(...blobs.map(blob => blob.byteLength)),
      historyPayloadBytesAllReplicas: blobs.reduce((sum, blob) => sum + blob.byteLength * 3, 0),
      manifestBytes: manifests.reduce((sum, manifest) => sum + Buffer.byteLength(manifest.payload), 0) };
    measurements.quotaRecovery = true; measurements.corruptionRecovery = true;
  } finally { await db.delete(); }
} else if (phase === 'portable') {
  const encoded = performance.now(); const text = serializeCampaign(game, source.archive);
  measurements.serializeMs = performance.now() - encoded; measurements.envelopeBytes = Buffer.byteLength(text);
  assert.ok(Buffer.byteLength(text) > 64 * 1024 * 1024);
  assert.equal(JSON.parse(text).version, 2);
  const exported = performance.now(); const bytes = await exportSave(text);
  measurements.exportMs = performance.now() - exported; measurements.compressedBytes = bytes.byteLength;
  assert.ok(bytes.byteLength <= 64 * 1024 * 1024);
  assert.deepEqual([...bytes.slice(0, 4)], [84, 65, 67, 50]);
  const imported = performance.now(); const restored = deserializeCampaign(await importSave(bytes));
  measurements.importAndValidateMs = performance.now() - imported;
  assert.equal(serializeGame(restored.game), serializeGame(game)); assert.deepEqual(restored.archive, source.archive);
  writeFileSync(portablePath, bytes);
  const retained = readFileSync(portablePath);
  assert.ok(retained.equals(bytes));
  measurements.portableSha256 = createHash('sha256').update(retained).digest('hex');
  measurements.portablePath = portablePath.pathname;
} else {
  const bytes = new Uint8Array(readFileSync(portablePath));
  const restored = deserializeCampaign(await importSave(bytes));
  assert.deepEqual(restored.archive, source.archive);
  const replay = performance.now(); const replayed = replayArchive(restored.archive);
  measurements.replayMs = performance.now() - replay;
  assert.equal(serializeGame(replayed), serializeGame(game));
  assert.equal(stateHashForVersion(replayed, 16), source.archive.finalHash);
  measurements.fullReplay = true;
  measurements.portableSha256 = createHash('sha256').update(bytes).digest('hex');
}
console.log(JSON.stringify({ source: path.pathname, sha256, phase, runtime: process.version,
  totalMs: performance.now() - started, measurements, records: source.archive.records.length,
  battles: source.archive.records.reduce((sum, record) => sum + record.battles.length, 0),
  coverage: source.archive.coverage, initialSaveVersion: source.archive.initialSaveVersion, finalHashVersion: source.archive.finalHashVersion,
  hash16: stateHashForVersion(game, 16), currentHash: stateHash(game), memory: process.memoryUsage(), maxRssKiB: process.resourceUsage().maxRSS,
  scope: 'Real retained campaign. Fake IndexedDB is algorithm/transaction evidence, NOT browser disk latency. Phase times exclude input gzip parse; peak process RSS includes it and ownership/validation clones. Separate processes, no forced GC; not a browser or sustained-memory certificate.' }, null, 2));
