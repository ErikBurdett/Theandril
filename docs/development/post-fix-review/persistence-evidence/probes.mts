import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { writeFileSync } from 'node:fs';
import type { SaveStore as SaveStoreType } from '/home/telephoneheater/Work/Theandril/packages/persistence/src/index.ts';
import { createJournal, replayArchive } from '/home/telephoneheater/Work/Theandril/packages/chronicle/src/index.ts';
import { createGame, serializeGame } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index.ts';
import { checksum } from '/home/telephoneheater/Work/Theandril/packages/content/src/index.ts';
const require = createRequire('/home/telephoneheater/Work/Theandril/package.json');
require('fake-indexeddb/auto');
const { SaveStore } = await import('/home/telephoneheater/Work/Theandril/packages/persistence/src/index.ts');
const prefix = `independent-persistence-${randomUUID()}-`;
const names = new Set<string>(), opened: SaveStoreType[] = [], reports: unknown[] = [];
const tables = ['campaignGenerations', 'campaignManifests', 'campaignBlobs', 'campaignPayloads', 'campaignGarbage', 'saves'];
function store(name = prefix + names.size) { names.add(name); const db = new SaveStore(name); opened.push(db); return db; }
function make(seed = 74) { const game = createGame({ seed, size: 'tiny', factionCount: 2, pace: 'short' }); return { game, journal: createJournal(game, { mode: 'watch' }) }; }
function end(c: ReturnType<typeof make>) { assert.equal(c.journal.record(c.game, { type: 'endTurn', factionId: c.game.turnOwnerId }).ok, true); }
const save = (db: SaveStoreType, c: ReturnType<typeof make>, kind: 'manual' | 'auto' = 'auto') => db.saveCampaign(c.game, c.journal, kind);
const rows = (db: SaveStoreType) => Promise.all(tables.map(name => db.table(name).toArray()));
async function verify(db: SaveStoreType, c: ReturnType<typeof make>, kind: 'manual' | 'auto' = 'auto') {
  const loaded = await db.loadLatestCampaign(kind);
  assert.deepEqual(loaded.journal.materialize(), c.journal.materialize());
  assert.equal(serializeGame(loaded.game), serializeGame(c.game));
  assert.equal(serializeGame(replayArchive(loaded.journal.materialize())), serializeGame(c.game));
}
async function changeBlob(db: SaveStoreType, digest: string, patch: object) {
  const old = await db.table('campaignBlobs').get(digest);
  const { metadataChecksum: _seal, ...body } = old;
  const updated = { ...body, ...patch };
  await db.table('campaignBlobs').put({ ...updated, metadataChecksum: checksum(JSON.stringify(updated)) });
  return old;
}
async function checkReferences(db: SaveStoreType) {
  const blobs = await db.table('campaignBlobs').toArray(), expected = new Map<string, number>(blobs.map(b => [b.digest, 0]));
  const retain = (d: string) => { assert.ok(expected.has(d)); expected.set(d, expected.get(d)! + 1); };
  for (const b of blobs) {
    const copy = await db.table('campaignPayloads').get([b.digest, 0]);
    const value = JSON.parse(copy.payload);
    if (value.previousDigest) retain(value.previousDigest);
  }
  for (const g of await db.table('campaignGenerations').toArray()) if (g.type === 'chunks') {
    const m = JSON.parse((await db.table('campaignManifests').get(g.id)).payload);
    retain(m.originDigest); if (m.headDigest) retain(m.headDigest);
  }
  const queued = new Set((await db.table('campaignGarbage').toArray()).map(j => j.digest));
  for (const b of blobs) { assert.equal(b.refs, expected.get(b.digest)); assert.equal(queued.has(b.digest), b.refs === 0); }
}
async function probe(name: string, run: () => Promise<unknown>) {
  const result = await run(); reports.push({ name, passed: true, result });
  console.log(JSON.stringify(reports.at(-1)));
  for (const db of opened.splice(0)) db.close();
  for (const name of names) { await SaveStore.delete(name); assert.equal(await SaveStore.exists(name), false); }
}
try {
  for (const append of [false, true]) await probe(`fragment-interior-loss-${append}`, async () => {
    const db = store(), c = make(); await save(db, c);
    const fallback = await db.loadLatestCampaign('auto');
    assert.equal(c.journal.record(c.game, { type: 'move', factionId: '💠'.repeat(90_000), armyId: 'absent', target: 0 }).ok, false);
    await save(db, c); end(c); await save(db, c);
    const fragments = (await db.table('campaignBlobs').toArray()).filter(b => b.type === 'fragment');
    assert.ok(fragments.length > 2);
    const middle = fragments.find(b => b.previousDigest !== null)!;
    const copies = await db.table('campaignPayloads').where('digest').equals(middle.digest).toArray();
    await db.table('campaignPayloads').where('digest').equals(middle.digest).delete();
    if (append) end(c);
    const before = await rows(db), stats = db.lastCampaignSaveStats;
    await assert.rejects(save(db, c), /replicas/);
    assert.deepEqual(await rows(db), before); assert.deepEqual(db.lastCampaignSaveStats, stats);
    await verify(db, fallback);
    await db.table('campaignPayloads').bulkAdd(copies);
    await save(db, c); assert.equal(db.lastCampaignSaveStats!.suffixRecords, Number(append)); await verify(db, c);
    return { fragments: fragments.length, fallbackReplayed: true, retrySuffix: Number(append) };
  });
  await probe('origin-loss-and-single-surviving-replica', async () => {
    const db = store(), c = make(); end(c); await save(db, c);
    const generation = await db.table('campaignGenerations').orderBy('id').last();
    const copies = await db.table('campaignPayloads').where('digest').equals(generation.originDigest).toArray();
    await db.table('campaignPayloads').bulkDelete(copies.slice(0, 2).map(c => [c.digest, c.replica]));
    await save(db, c); await verify(db, c);
    await db.table('campaignPayloads').where('digest').equals(generation.originDigest).delete();
    const before = await rows(db); end(c); await assert.rejects(save(db, c), /replicas/); assert.deepEqual(await rows(db), before);
    await db.table('campaignPayloads').bulkAdd(copies); await save(db, c);
    assert.equal(db.lastCampaignSaveStats!.suffixRecords, 1); await verify(db, c);
  });
  for (const fault of ['previousDigest', 'type', 'byteLength', 'from', 'to', 'missingMetadata', 'missingPayload', 'badManifest']) await probe(`unrelated-GC-proof-${fault}`, async () => {
    const db = store(), active = make(99), other = make();
    end(active); await save(db, active, 'manual');
    for (let i = 0; i < 3; i++) { end(other); await save(db, other); }
    const gens = await db.table('campaignGenerations').where('kind').equals('auto').sortBy('id');
    const digest = gens[1].headDigest, original = await db.table('campaignBlobs').get(digest);
    const copies = await db.table('campaignPayloads').where('digest').equals(digest).toArray();
    const manifest = await db.table('campaignManifests').get(gens[1].id);
    if (fault === 'missingMetadata') await db.table('campaignBlobs').delete(digest);
    else if (fault === 'missingPayload') await db.table('campaignPayloads').where('digest').equals(digest).delete();
    else if (fault === 'badManifest') await db.table('campaignManifests').put({ ...manifest, payload: '{}' });
    else await changeBlob(db, digest, { [fault]: fault === 'previousDigest' ? null : fault === 'type' ? 'fragment' : original[fault] + 1 });
    await db.table('campaignGarbage').put({ digest: gens[0].headDigest });
    const before = await rows(db), stats = db.lastCampaignSaveStats;
    end(active); let refused = '';
    await assert.rejects(save(db, active, 'manual'), e => { refused = String(e); return true; });
    assert.deepEqual(await rows(db), before); assert.deepEqual(db.lastCampaignSaveStats, stats);
    const fallback = await db.loadLatestCampaign('manual'); assert.equal(fallback.game.turn, active.game.turn - 1);
    assert.equal(serializeGame(replayArchive(fallback.journal.materialize())), serializeGame(fallback.game));
    await db.table('campaignBlobs').put(original); await db.table('campaignPayloads').bulkPut(copies); await db.table('campaignManifests').put(manifest);
    await save(db, active, 'manual'); assert.equal(db.lastCampaignSaveStats!.suffixRecords, 1);
    await checkReferences(db); await verify(db, active, 'manual'); await verify(db, other);
    return { atomicRefusal: refused, retrySuffix: 1 };
  });
  await probe('orphan-successor-leases-with-a-live-shared-fork', async () => {
    const db = store(), first = make(); end(first); await save(db, first, 'manual');
    const fork = await db.loadLatestCampaign('manual');
    assert.equal(first.journal.record(first.game, { type: 'move', factionId: first.game.turnOwnerId, armyId: 'missing', target: 0 }).ok, false);
    await save(db, first, 'manual');
    for (let i = 0; i < 70; i++) { end(fork); await save(db, fork); }
    const active = make(99), deletions = [];
    for (let i = 0; i < 3; i++) { end(active); const n = await db.table('campaignBlobs').count(); await save(db, active); deletions.push(n + db.lastCampaignSaveStats!.newBlobs - await db.table('campaignBlobs').count()); }
    assert.equal(deletions.at(-1), 64); assert.ok(await db.table('campaignGarbage').count() > 0);
    await checkReferences(db); await verify(db, first, 'manual'); await verify(db, active);
    await save(db, first, 'manual'); await checkReferences(db);
    assert.equal(await db.table('campaignGarbage').count(), 0);
    await verify(db, first, 'manual'); await verify(db, active);
    return { deletions, deferredQueueDrained: true, bothForksReplayed: true };
  });
  await probe('physical-GC-failure-rolls-back-after-first-deletion', async () => {
    const db = store(), old = make(), active = make(99);
    for (let i = 0; i < 5; i++) { end(old); await save(db, old); }
    for (let i = 0; i < 2; i++) { end(active); await save(db, active); }
    const before = await rows(db), stats = db.lastCampaignSaveStats; end(active); let deletions = 0;
    const hook = () => { if (++deletions === 2) throw new DOMException('injected during GC', 'QuotaExceededError'); };
    db.table('campaignBlobs').hook('deleting', hook);
    try { await assert.rejects(save(db, active), /injected during GC/); }
    finally { db.table('campaignBlobs').hook('deleting').unsubscribe(hook); }
    assert.equal(deletions, 2); assert.deepEqual(await rows(db), before); assert.deepEqual(db.lastCampaignSaveStats, stats);
    await save(db, active); assert.equal(db.lastCampaignSaveStats!.suffixRecords, 1); await checkReferences(db); await verify(db, active);
    return { reachedSecondDeletion: true, allSixStoresRolledBack: true, retrySuffix: 1 };
  });
  await probe('second-connection-rotates-cursor-after-preflight', async () => {
    const db = store(), connection = store(db.name), old = make(), active = make(99);
    for (let i = 0; i < 3; i++) { end(old); await save(db, old); }
    end(old); const stats = db.lastCampaignSaveStats, transact = db.transaction.bind(db); let afterOther: unknown;
    (db as any).transaction = async (...args: any[]) => {
      (db as any).transaction = transact;
      for (let i = 0; i < 3; i++) { end(active); await save(connection, active); }
      afterOther = await rows(connection);
      return (transact as any)(...args);
    };
    await assert.rejects(save(db, old), /rotated concurrently/);
    assert.deepEqual(await rows(db), afterOther); assert.deepEqual(db.lastCampaignSaveStats, stats); await verify(connection, active);
    await save(db, old); assert.equal(db.lastCampaignSaveStats!.suffixRecords, old.journal.recordCount); await verify(db, old);
    return { atomicRefusal: true, coldRetryRecords: old.journal.recordCount };
  });
  assert.equal((await indexedDB.databases()).filter(x => x.name?.startsWith(prefix)).length, 0);
  writeFileSync('/tmp/theandril-persistence-rereview-hxguo7sl/probes.json', JSON.stringify({ passed: true, cases: reports, total: reports.length, databasesDeleted: names.size, noRemainingDatabases: true }, null, 2));
  console.log(JSON.stringify({ passed: true, total: reports.length, databasesDeleted: names.size, noRemainingDatabases: true }));
} finally {
  for (const db of opened) db.close();
  for (const name of names) await SaveStore.delete(name);
}
