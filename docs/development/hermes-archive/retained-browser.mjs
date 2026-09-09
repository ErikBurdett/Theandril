import { chromium } from '@playwright/test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Pure persistence integration: blank private page, actual Chromium IndexedDB and gzip.
// No application controls or simulation mutations; not player-UX evidence.
const server = process.env.ARCHIVE_TEST_SERVER ?? 'http://127.0.0.1:5173';
assert.equal(new URL(server).hostname, '127.0.0.1');
const root = '/@fs/home/telephoneheater/Work/Theandril';
const portable = root + '/docs/development/hermes-archive/retained-standard-long-748291.theandril';
const output = new URL('./retained-browser.theandril', import.meta.url);
const database = 'hermes-r02-private-browser';
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
const context = await browser.newContext({ acceptDownloads: true });
const errors = [];
const reports = {};
async function page() {
  const tab = await context.newPage();
  tab.on('pageerror', error => errors.push(error.message));
  await tab.route('**/hermes-persistence-only', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>R02 persistence integration</title>' }));
  await tab.goto(server + '/hermes-persistence-only');
  return tab;
}
try {
  let tab = await page();
  reports.save = await tab.evaluate(async ({ root, portable, database }) => {
    const { SaveStore, importSave, deserializeCampaign, serializeCampaign } = await import(root + '/packages/persistence/src/index.ts');
    const { historyDigest } = await import(root + '/packages/persistence/src/campaign-storage.ts');
    const { resumeJournal } = await import(root + '/packages/chronicle/src/index.ts');
    const { stateHashForVersion, serializeGame } = await import(root + '/packages/sim/src/index.ts');
    const response = await fetch(portable); if (!response.ok) throw new Error('Retained portable file unavailable.');
    const started = performance.now();
    const { game, archive } = deserializeCampaign(await importSave(new Uint8Array(await response.arrayBuffer())));
    const importMs = performance.now() - started;
    const digest = await historyDigest(JSON.stringify(archive)), snapshotDigest = await historyDigest(serializeGame(game));
    const journal = resumeJournal(game, archive), db = new SaveStore(database);
    const save = performance.now(); await db.saveCampaign(game, journal, 'auto');
    const saveMs = performance.now() - save, cold = db.lastCampaignSaveStats;
    const noopStarted = performance.now(); await db.saveCampaign(game, journal, 'auto');
    const noopMs = performance.now() - noopStarted, noop = db.lastCampaignSaveStats;
    const estimate = await navigator.storage.estimate();
    db.close();
    return { importMs, saveMs, noopMs, cold, noop, digest, snapshotDigest, records: archive.records.length,
      coverage: archive.coverage, hash16: stateHashForVersion(game, 16), envelopeBytes: new TextEncoder().encode(serializeCampaign(game, archive)).byteLength,
      storageEstimate: estimate, heapSample: performance.memory ? { used: performance.memory.usedJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null };
  }, { root, portable, database });
  assert.equal(reports.save.records, 114244); assert.equal(reports.save.coverage, 'complete'); assert.equal(reports.save.hash16, '0f0b85f5');
  assert.equal(reports.save.noop.historyPayloadWrites, 0);
  await tab.close(); // Real page/process ownership boundary before reading the stored generation.
  tab = await page();
  const download = tab.waitForEvent('download', { timeout: 120_000 });
  reports.loadExport = await tab.evaluate(async ({ root, database }) => {
    const { SaveStore, exportSave, serializeCampaign } = await import(root + '/packages/persistence/src/index.ts');
    const { historyDigest } = await import(root + '/packages/persistence/src/campaign-storage.ts');
    const { stateHashForVersion, serializeGame } = await import(root + '/packages/sim/src/index.ts');
    const db = new SaveStore(database), started = performance.now();
    const { game, journal } = await db.loadLatestCampaign('auto');
    const loadMs = performance.now() - started, archive = journal.materialize();
    const digest = await historyDigest(JSON.stringify(archive)), snapshotDigest = await historyDigest(serializeGame(game));
    const exported = performance.now(), bytes = await exportSave(serializeCampaign(game, archive));
    const exportMs = performance.now() - exported;
    const url = URL.createObjectURL(new Blob([bytes]));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'retained-browser.theandril'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); db.close();
    return { loadMs, exportMs, compressedBytes: bytes.byteLength, digest, snapshotDigest, records: journal.recordCount, coverage: journal.coverage, hash16: stateHashForVersion(game, 16),
      heapSample: performance.memory ? { used: performance.memory.usedJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null };
  }, { root, database });
  assert.equal(reports.loadExport.digest, reports.save.digest); assert.equal(reports.loadExport.snapshotDigest, reports.save.snapshotDigest);
  assert.equal(reports.loadExport.compressedBytes <= 64 * 1024 * 1024, true);
  await (await download).saveAs(output.pathname);
  await tab.close();
  tab = await page();
  reports.import = await tab.evaluate(async ({ root, database }) => {
    const { SaveStore, deserializeCampaign, importSave } = await import(root + '/packages/persistence/src/index.ts');
    const { historyDigest } = await import(root + '/packages/persistence/src/campaign-storage.ts');
    const { stateHashForVersion, serializeGame } = await import(root + '/packages/sim/src/index.ts');
    const response = await fetch(root + '/docs/development/hermes-archive/retained-browser.theandril');
    if (!response.ok) throw new Error('Browser export unavailable.');
    const started = performance.now(); const { game, archive } = deserializeCampaign(await importSave(new Uint8Array(await response.arrayBuffer())));
    const importMs = performance.now() - started;
    const digest = await historyDigest(JSON.stringify(archive)), snapshotDigest = await historyDigest(serializeGame(game));
    const db = new SaveStore(database); await db.delete();
    return { importMs, digest, snapshotDigest, records: archive.records.length, coverage: archive.coverage, hash16: stateHashForVersion(game, 16),
      databaseDeleted: !(await SaveStore.exists(database)), heapSample: performance.memory ? { used: performance.memory.usedJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null };
  }, { root, database });
  assert.equal(reports.import.digest, reports.save.digest); assert.equal(reports.import.snapshotDigest, reports.save.snapshotDigest);
  assert.equal(reports.import.databaseDeleted, true); assert.deepEqual(errors, []);
  console.log(JSON.stringify({ browser: browser.version(), server, reports, errors,
    portableSha256: createHash('sha256').update(readFileSync(output)).digest('hex'),
    scope: 'Actual headless Chromium IndexedDB, separate pages, native gzip decoder, Fflate streamed export. Pure persistence APIs, NOT UI/worker-control or cross-browser evidence. Single retained case, no forced GC; JS heap samples are NOT peaks or whole-browser RSS. Quota injection and corrupted-manifest recovery are separately covered by Node/fake-indexeddb tests.' }, null, 2));
} finally { await context.close(); await browser.close(); }
