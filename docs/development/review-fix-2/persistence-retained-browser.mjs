import { chromium } from '@playwright/test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const checkpoint = process.argv[2]; assert.ok(['before', 'after'].includes(checkpoint));
const server = 'http://127.0.0.1:5197', root = '/@fs/home/telephoneheater/Work/Theandril';
const sha256 = createHash('sha256').update(readFileSync(new URL('../../hermes-analysis/qa/captured-standard-long-748291.json.gz', import.meta.url))).digest('hex');
assert.equal(sha256, '56a81b5fbc91c0bea89b8cc5f78ace519d7fa0d6109545f7444af5dcce159780');
const database = `hermes-review-fix-2-retained-browser-${checkpoint}`;
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium' });
const context = await browser.newContext(), errors = [];
async function page() {
  const tab = await context.newPage(); tab.on('pageerror', error => errors.push(error.message));
  await tab.route('**/persistence-only', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Retained persistence cost</title>' }));
  await tab.goto(server + '/persistence-only'); return tab;
}
try {
  let tab = await page();
  const saved = await tab.evaluate(async ({ root, checkpoint, database }) => {
    const { SaveStore, deserializeCampaign, importSave, serializeCampaign } = await import(root + '/packages/persistence/src/index.ts');
    const { CampaignStorage, historyDigest } = await import(root + '/packages/persistence/src/campaign-storage.ts' + (checkpoint === 'before' ? '?review-before' : ''));
    const { resumeJournal } = await import(root + '/packages/chronicle/src/index.ts');
    const { stateHashForVersion, serializeGame } = await import(root + '/packages/sim/src/index.ts');
    const response = await fetch(root + '/docs/development/hermes-archive/retained-standard-long-748291.theandril');
    if (!response.ok) throw new Error('Retained portable unavailable');
    const { game, archive } = deserializeCampaign(await importSave(new Uint8Array(await response.arrayBuffer())));
    const originalDigest = await historyDigest(JSON.stringify(archive)), journal = resumeJournal(game, archive), db = new SaveStore(database);
    const old = checkpoint === 'before' ? new CampaignStorage(db, { validate: text => deserializeCampaign(text).game, parse: deserializeCampaign, serialize: serializeCampaign }) : null;
    const save = () => old ? old.saveCampaign(game, journal, 'auto') : db.saveCampaign(game, journal, 'auto');
    const stats = () => old ? old.lastSaveStats : db.lastCampaignSaveStats;
    const measurements = {};
    try {
      for (const phase of ['cold', 'noop', 'append']) {
        if (phase === 'append') {
          measurements.appendResult = journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId });
          if (measurements.appendResult.ok) throw new Error('Unexpected victory continuation');
        }
        const start = performance.now(); await save();
        measurements[phase] = { ms: performance.now() - start, stats: stats(), heapSample: performance.memory ? { used: performance.memory.usedJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null };
      }
      return { measurements, originalDigest, originalRecords: archive.records.length, originalBattles: archive.records.reduce((sum, record) => sum + record.battles.length, 0),
        expectedDigest: await historyDigest(JSON.stringify(journal.materialize())), snapshotDigest: await historyDigest(serializeGame(game)), hash16: stateHashForVersion(game, 16) };
    } finally { db.close(); }
  }, { root, checkpoint, database });
  assert.equal(saved.originalRecords, 114244); assert.equal(saved.originalBattles, 1496); assert.equal(saved.hash16, '0f0b85f5');
  assert.deepEqual(['cold', 'noop', 'append'].map(phase => saved.measurements[phase].stats.historyPayloadWrites), [1344, 0, 3]);
  assert.deepEqual(['cold', 'noop', 'append'].map(phase => saved.measurements[phase].stats.suffixRecords), [114244, 0, 1]);
  await tab.close(); tab = await page();
  const loaded = await tab.evaluate(async ({ root, database }) => {
    const { SaveStore } = await import(root + '/packages/persistence/src/index.ts');
    const { historyDigest } = await import(root + '/packages/persistence/src/campaign-storage.ts');
    const { serializeGame } = await import(root + '/packages/sim/src/index.ts');
    const db = new SaveStore(database);
    let result;
    try {
      const start = performance.now(), { game, journal } = await db.loadLatestCampaign('auto');
      const loadMs = performance.now() - start, archive = journal.materialize();
      result = { loadMs, records: archive.records.length, digest: await historyDigest(JSON.stringify(archive)), snapshotDigest: await historyDigest(serializeGame(game)),
        storage: { generations: await db.table('campaignGenerations').count(), blobs: await db.table('campaignBlobs').count(), replicas: await db.table('campaignPayloads').count() },
        heapSample: performance.memory ? { used: performance.memory.usedJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null };
      archive.records.pop(); result.originalDigest = await historyDigest(JSON.stringify(archive));
    } finally { await db.delete(); }
    result.databaseDeleted = !(await SaveStore.exists(database)); return result;
  }, { root, database });
  assert.equal(loaded.records, 114245); assert.equal(loaded.digest, saved.expectedDigest); assert.equal(loaded.originalDigest, saved.originalDigest);
  assert.equal(loaded.snapshotDigest, saved.snapshotDigest); assert.equal(loaded.databaseDeleted, true); assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checkpoint, sha256, browser: browser.version(), saved, loaded, errors,
    scope: 'One sequential real Chromium IndexedDB cold/noop/one-record append run. Original victorious capture preserved; append is a real refused endTurn, not invented post-victory gameplay. Separate-page load verifies SHA-256 of every original historical value plus the one-record suffix. Save timing excludes portable import/journal validation. Browser heap SAMPLES are not peaks or whole-browser RSS; Node retained harness reports process peak RSS separately. Prior retained full replay is not rerun or relabeled.' }, null, 2));
} finally {
  const cleanup = await page().catch(() => null);
  if (cleanup) await cleanup.evaluate(async ({ root, database }) => { const { SaveStore } = await import(root + '/packages/persistence/src/index.ts'); await SaveStore.delete(database); }, { root, database }).catch(error => console.error('Private database cleanup:', error));
  await context.close(); await browser.close();
}
