import { chromium } from '@playwright/test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const checkpoint = process.argv[2]; assert.ok(['before', 'after'].includes(checkpoint));
const server = 'http://127.0.0.1:5197', root = '/@fs/home/telephoneheater/Work/Theandril';
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium' });
const context = await browser.newContext(), errors = [], reports = [];
async function page() {
  const tab = await context.newPage(); tab.on('pageerror', error => errors.push(error.message));
  await tab.route('**/persistence-only', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Persistence durability probes</title>' }));
  await tab.goto(server + '/persistence-only'); return tab;
}
try {
  let tab = await page();
  for (const variant of ['missing-noop', 'missing-append', 'undercount']) {
    const database = `hermes-review-fix-2-${checkpoint}-${variant}`;
    const report = await tab.evaluate(async ({ root, checkpoint, variant, database }) => {
      const { SaveStore, deserializeCampaign, serializeCampaign } = await import(root + '/packages/persistence/src/index.ts');
      const { CampaignStorage, MAX_GARBAGE_BLOBS_PER_COMMIT } = await import(root + '/packages/persistence/src/campaign-storage.ts' + (checkpoint === 'before' ? '?review-before' : ''));
      const { createGame, serializeGame, SAVE_VERSION } = await import(root + '/packages/sim/src/index.ts');
      const { createJournal, replayArchive } = await import(root + '/packages/chronicle/src/index.ts');
      const { checksum } = await import(root + '/packages/content/src/index.ts');
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
      const equal = (a, b, message) => check(JSON.stringify(sorted(a)) === JSON.stringify(sorted(b)), message);
      const db = new SaveStore(database);
      // Before uses the exact read-only source checkpoint, loaded in its original package context.
      // After exercises the normal SaveStore facade. Neither rewrites working production files.
      const old = checkpoint === 'before' ? new CampaignStorage(db, { validate: text => deserializeCampaign(text).game, parse: deserializeCampaign, serialize: serializeCampaign }) : null;
      const save = (game, journal) => old ? old.saveCampaign(game, journal, 'auto') : db.saveCampaign(game, journal, 'auto');
      const load = () => old ? old.loadCampaign('auto') : db.loadLatestCampaign('auto');
      const stats = () => old ? old.lastSaveStats : db.lastCampaignSaveStats;
      const make = seed => { const game = createGame({ seed, size: 'tiny', factionCount: 2, pace: 'short' }); return { game, journal: createJournal(game, { mode: 'watch' }) }; };
      const end = ({ game, journal }) => check(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok, 'endTurn refused');
      const rows = () => Promise.all(['campaignGenerations', 'campaignManifests', 'campaignBlobs', 'campaignPayloads', 'campaignGarbage', 'saves'].map(name => db.table(name).toArray()));
      const current = make(74), expected = new Map(), result = { database, variant, saveVersion: SAVE_VERSION };
      const remember = () => expected.set(current.game.turn, { snapshot: serializeGame(current.game), archive: current.journal.materialize() });
      const verify = async wanted => {
        const restored = await load();
        equal(serializeGame(restored.game), wanted.snapshot, 'snapshot mismatch');
        equal(restored.journal.materialize(), wanted.archive, 'incomplete archive');
        equal(serializeGame(replayArchive(restored.journal.materialize())), wanted.snapshot, 'replay mismatch');
        return restored.game.turn;
      };
      try {
        if (variant.startsWith('missing')) { await save(current.game, current.journal); remember(); }
        for (let i = 0; i < (variant.startsWith('missing') ? 2 : 3); i++) { end(current); await save(current.game, current.journal); remember(); }
        const generations = await db.table('campaignGenerations').orderBy('id').toArray();
        result.initialTurns = generations.map(row => row.turn);
        if (variant.startsWith('missing')) {
          const digest = generations[1].headDigest;
          const copies = await db.table('campaignPayloads').where('digest').equals(digest).toArray(); check(copies.length === 3, 'missing initial replicas');
          await db.table('campaignPayloads').where('digest').equals(digest).delete();
          result.deletedReplicas = copies.length;
          result.deletionReadback = await db.table('campaignPayloads').where('digest').equals(digest).count(); check(result.deletionReadback === 0, 'delete not applied');
          result.intactHeadCopies = await db.table('campaignPayloads').where('digest').equals(generations[2].headDigest).count(); check(result.intactHeadCopies === 3, 'head was touched');
          result.recoveredBefore = await verify(expected.get(1));
          if (variant === 'missing-append') end(current);
          const before = await rows(), priorStats = stats();
          try { await save(current.game, current.journal); result.saveError = null; } catch (error) { result.saveError = error.message; }
          result.retainedTurns = (await db.table('campaignGenerations').orderBy('id').toArray()).map(row => row.turn);
          try { result.loadAfter = (await load()).game.turn; } catch (error) { result.loadError = error.message; }
          if (checkpoint === 'after') {
            check(/replicas/.test(result.saveError), 'unreadable prefix save did not refuse');
            equal(await rows(), before, 'failed save changed persisted evidence'); equal(stats(), priorStats, 'failure advanced stats');
            result.recoveredAfter = await verify(expected.get(1)); result.atomicRefusal = true;
            await db.table('campaignPayloads').bulkAdd(copies);
            equal(await db.table('campaignPayloads').where('digest').equals(digest).toArray(), copies, 'restoration readback mismatch');
            await save(current.game, current.journal);
            check(stats().suffixRecords === Number(variant === 'missing-append'), 'failed commit advanced cursor');
            result.retrySuffix = stats().suffixRecords;
            result.verifiedRetryTurn = await verify({ snapshot: serializeGame(current.game), archive: current.journal.materialize() });
          }
        } else {
          const oldest = generations[0].headDigest;
          const { metadataChecksum: _seal, ...body } = await db.table('campaignBlobs').get(oldest); check(body.refs === 2, 'not shared by root and successor');
          const changed = { ...body, refs: 1 };
          await db.table('campaignBlobs').put({ ...changed, metadataChecksum: checksum(JSON.stringify(changed)) });
          const readback = await db.table('campaignBlobs').get(oldest);
          equal(readback, { ...changed, metadataChecksum: checksum(JSON.stringify(changed)) }, 'undercount not applied'); result.resealedRefs = readback.refs;
          result.loadedBefore = await verify(expected.get(4));
          const copies = await db.table('campaignPayloads').toArray();
          await save(current.game, current.journal);
          result.remainingOldestReplicas = await db.table('campaignPayloads').where('digest').equals(oldest).count();
          result.retainedTurns = (await db.table('campaignGenerations').orderBy('id').toArray()).map(row => row.turn);
          try { result.loadAfter = (await load()).game.turn; } catch (error) { result.loadError = error.message; }
          if (checkpoint === 'after') {
            equal(await db.table('campaignPayloads').toArray(), copies, 'live payload was reclaimed');
            check((await db.table('campaignBlobs').get(oldest)).refs === 1, 'actual successor reference not restored');
            const retained = await db.table('campaignGenerations').orderBy('id').toArray(), manifests = await db.table('campaignManifests').toArray();
            result.fallbackReplayTurns = [];
            for (const row of retained.reverse()) {
              result.fallbackReplayTurns.push(await verify(expected.get(row.turn)));
              await db.table('campaignManifests').put({ generationId: row.id, payload: 'controlled fallback probe' });
            }
            await db.table('campaignManifests').bulkPut(manifests);
            for (let i = 0; i < MAX_GARBAGE_BLOBS_PER_COMMIT; i++) { end(current); await save(current.game, current.journal); }
            const abandoned = await db.table('campaignBlobs').toArray(), active = make(99); result.collectedPerCommit = [];
            for (let i = 0; i < 4; i++) {
              if (i < 3) end(active);
              const count = await db.table('campaignBlobs').count();
              await save(active.game, active.journal);
              const removed = count + stats().newBlobs - await db.table('campaignBlobs').count();
              check(removed <= MAX_GARBAGE_BLOBS_PER_COMMIT, 'GC deletion budget exceeded'); result.collectedPerCommit.push(removed);
              if (i === 2) check(await db.table('campaignGarbage').count() > 0, 'no deferred garbage');
            }
            for (const blob of abandoned) {
              check(await db.table('campaignBlobs').get(blob.digest) === undefined, 'abandoned metadata retained');
              check(await db.table('campaignPayloads').where('digest').equals(blob.digest).count() === 0, 'abandoned replicas retained');
            }
            result.garbageRemaining = await db.table('campaignGarbage').count(); check(result.garbageRemaining === 0, 'GC did not drain');
            result.liveBlobs = await db.table('campaignBlobs').count(); check(result.liveBlobs === 4, 'unexpected live blobs');
            result.liveReplicas = await db.table('campaignPayloads').count(); check(result.liveReplicas === 12, 'unexpected replicas');
            result.verifiedActiveTurn = await verify({ snapshot: serializeGame(active.game), archive: active.journal.materialize() });
          }
        }
      } finally { db.close(); }
      return result;
    }, { root, checkpoint, variant, database });
    assert.equal(report.saveVersion, 17); reports.push(report);
  }
  await tab.close(); tab = await page(); // New page/SaveStore/journal ownership, same private IndexedDB.
  const reload = [];
  for (const report of reports) {
    reload.push(await tab.evaluate(async ({ root, database }) => {
      const { SaveStore } = await import(root + '/packages/persistence/src/index.ts');
      const { replayArchive } = await import(root + '/packages/chronicle/src/index.ts');
      const { serializeGame } = await import(root + '/packages/sim/src/index.ts');
      const db = new SaveStore(database), result = { database };
      try {
        const { game, journal } = await db.loadLatestCampaign('auto');
        result.turn = game.turn; result.records = journal.recordCount;
        result.replayEqual = serializeGame(replayArchive(journal.materialize())) === serializeGame(game);
      } catch (error) { result.error = error.message; }
      finally { await db.delete(); }
      result.deleted = !(await SaveStore.exists(database)); return result;
    }, { root, database: report.database }));
  }
  if (checkpoint === 'before') {
    for (const report of reports) {
      assert.equal(report.loadError, 'Campaign storage: No valid save remains in this slot. Import a backup.');
      if (report.variant.startsWith('missing')) assert.equal(report.saveError, null);
      else assert.equal(report.remainingOldestReplicas, 0);
    }
    assert.deepEqual(reports.map(report => report.retainedTurns), [[2, 3, 3], [2, 3, 4], [3, 4, 4]]);
    assert.ok(reload.every(result => /No valid save/.test(result.error)));
  } else { assert.ok(reload.every(result => result.replayEqual && !result.error)); }
  assert.ok(reload.every(result => result.deleted)); assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checkpoint, browser: browser.version(), server, reports, reload, errors,
    sourceSha256: createHash('sha256').update(readFileSync(new URL(checkpoint === 'before' ? './persistence-before.ts.txt' : '../../../packages/persistence/src/campaign-storage.ts', import.meta.url))).digest('hex'),
    scope: 'Real Chromium IndexedDB in a private context; controlled payload deletion/resealed local metadata with readback, actual API save/load/replay, separate-page reopen and database deletion readback. Not UI-control, quota-exhaustion, process-kill/fsync, cross-browser, or authentication evidence.' }, null, 2));
} finally {
  const cleanup = await page().catch(() => null);
  if (cleanup) await cleanup.evaluate(async root => {
    const { SaveStore } = await import(root + '/packages/persistence/src/index.ts');
    for (const item of await indexedDB.databases()) if (item.name?.startsWith('hermes-review-fix-2-')) await SaveStore.delete(item.name);
  }, root).catch(error => console.error('Private-context cleanup:', error));
  await context.close(); await browser.close();
}
