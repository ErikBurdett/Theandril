import 'fake-indexeddb/auto';
import { afterEach, expect, test } from 'vitest';
import { createGame, serializeGame, type GameState } from '@theandril/sim';
import { createJournal, replayArchive, type CampaignJournal } from '@theandril/chronicle';
import { checksum } from '@theandril/content';
import { SaveStore } from './index';
import { MAX_GARBAGE_BLOBS_PER_COMMIT } from './campaign-storage';

const stores: SaveStore[] = [];
function store(): SaveStore { const db = new SaveStore(`durability-test-${stores.length}`); stores.push(db); return db; }
afterEach(async () => { for (const db of stores.splice(0)) await db.delete(); });
function campaign(seed = 74) { const game = createGame({ seed, size: 'tiny', factionCount: 2, pace: 'short' }); return { game, journal: createJournal(game, { mode: 'watch' }) }; }
function end(game: GameState, journal: CampaignJournal): void { expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true); }
async function storedRows(db: SaveStore) {
  return Promise.all(['campaignGenerations', 'campaignManifests', 'campaignBlobs', 'campaignPayloads', 'campaignGarbage', 'saves'].map(name => db.table(name).toArray()));
}

test.each([false, true])('PERSIST-01 refuses an unreadable shared dependency without rotating the last readable generation (append=%s)', async append => {
  const db = store(), { game, journal } = campaign();
  await db.saveCampaign(game, journal, 'auto'); // Turn 1 has no dependency on the lost turn-2 chunk.
  const readable = { snapshot: serializeGame(game), archive: journal.materialize() };
  for (let i = 0; i < 2; i++) { end(game, journal); await db.saveCampaign(game, journal, 'auto'); }
  const rows = await db.table('campaignGenerations').orderBy('id').toArray();
  expect(rows.map(row => row.turn)).toEqual([1, 2, 3]);
  const lost = rows[1]!.headDigest;
  const copies = await db.table('campaignPayloads').where('digest').equals(lost).toArray();
  expect(copies).toHaveLength(3);
  await db.table('campaignPayloads').where('digest').equals(lost).delete();
  expect(await db.table('campaignPayloads').where('digest').equals(lost).count()).toBe(0);
  expect(await db.table('campaignPayloads').where('digest').equals(rows[2]!.headDigest).count()).toBe(3);
  expect((await db.loadLatestCampaign('auto')).game.turn).toBe(1);
  if (append) end(game, journal); // Keep the ORIGINAL live journal and its durable turn-3 cursor.
  const before = await storedRows(db), stats = db.lastCampaignSaveStats;
  await expect(db.saveCampaign(game, journal, 'auto')).rejects.toThrow(/replicas/);
  expect(await storedRows(db)).toEqual(before);
  expect(db.lastCampaignSaveStats).toEqual(stats);
  const recovered = await db.loadLatestCampaign('auto');
  expect(serializeGame(recovered.game)).toBe(readable.snapshot);
  expect(recovered.journal.materialize()).toEqual(readable.archive);
  expect(serializeGame(replayArchive(recovered.journal.materialize()))).toBe(readable.snapshot);
  // Restoring exactly the removed test bytes lets retry prove the failed save never advanced its cursor.
  await db.table('campaignPayloads').bulkAdd(copies);
  expect(await db.table('campaignPayloads').where('digest').equals(lost).toArray()).toEqual(copies);
  await db.saveCampaign(game, journal, 'auto');
  expect(db.lastCampaignSaveStats?.suffixRecords).toBe(Number(append));
  const loaded = await db.loadLatestCampaign('auto');
  expect(serializeGame(loaded.game)).toBe(serializeGame(game));
  expect(loaded.journal.materialize()).toEqual(journal.materialize());
  expect(serializeGame(replayArchive(loaded.journal.materialize()))).toBe(serializeGame(game));
  expect(await db.table('campaignGenerations').count()).toBe(3);
});

test('PERSIST-02 a resealed refcount undercount cannot reclaim a remaining history, and bounded GC still drains it when abandoned', async () => {
  const db = store(), { game, journal } = campaign();
  const expected = new Map<number, { snapshot: string; archive: ReturnType<CampaignJournal['materialize']> }>();
  for (let i = 0; i < 3; i++) {
    end(game, journal); await db.saveCampaign(game, journal, 'auto');
    expected.set(game.turn, { snapshot: serializeGame(game), archive: journal.materialize() });
  }
  const rows = await db.table('campaignGenerations').orderBy('id').toArray();
  expect(rows.map(row => row.turn)).toEqual([2, 3, 4]);
  const oldest = rows[0]!.headDigest, metadata = await db.table('campaignBlobs').get(oldest);
  expect(metadata.refs).toBe(2); // One generation root and one immutable successor edge.
  const { metadataChecksum: _seal, ...body } = metadata;
  const undercount = { ...body, refs: 1 };
  await db.table('campaignBlobs').put({ ...undercount, metadataChecksum: checksum(JSON.stringify(undercount)) });
  expect((await db.table('campaignBlobs').get(oldest)).refs).toBe(1);
  const copies = await db.table('campaignPayloads').toArray();
  expect((await db.loadLatestCampaign('auto')).journal.materialize()).toEqual(journal.materialize());
  await db.saveCampaign(game, journal, 'auto');
  expect(await db.table('campaignPayloads').toArray()).toEqual(copies);
  expect((await db.table('campaignBlobs').get(oldest)).refs).toBe(1); // Successor still owns it.
  expect(db.lastCampaignSaveStats?.historyPayloadWrites).toBe(0);
  const retained = await db.table('campaignGenerations').orderBy('id').toArray();
  expect(retained.map(row => row.turn)).toEqual([3, 4, 4]);
  const manifests = await db.table('campaignManifests').toArray();
  for (const row of retained.reverse()) {
    const loaded = await db.loadLatestCampaign('auto'), wanted = expected.get(row.turn)!;
    expect(serializeGame(loaded.game)).toBe(wanted.snapshot);
    expect(loaded.journal.materialize()).toEqual(wanted.archive);
    expect(serializeGame(replayArchive(loaded.journal.materialize()))).toBe(wanted.snapshot);
    await db.table('campaignManifests').put({ generationId: row.id, payload: 'test fallback to preceding intact history' });
  }
  await db.table('campaignManifests').bulkPut(manifests);
  // Grow a real command chain beyond one reclamation budget, then retire its final root.
  for (let i = 0; i < MAX_GARBAGE_BLOBS_PER_COMMIT; i++) { end(game, journal); await db.saveCampaign(game, journal, 'auto'); }
  const abandoned = await db.table('campaignBlobs').toArray(), active = campaign(99);
  for (let i = 0; i < 3; i++) {
    end(active.game, active.journal);
    const before = await db.table('campaignBlobs').count();
    await db.saveCampaign(active.game, active.journal, 'auto');
    expect(before + db.lastCampaignSaveStats!.newBlobs - await db.table('campaignBlobs').count()).toBeLessThanOrEqual(MAX_GARBAGE_BLOBS_PER_COMMIT);
  }
  expect(await db.table('campaignGarbage').count()).toBeGreaterThan(0);
  await db.saveCampaign(active.game, active.journal, 'auto');
  expect(await db.table('campaignGarbage').count()).toBe(0);
  expect(await db.table('campaignBlobs').count()).toBe(4);
  expect(await db.table('campaignPayloads').count()).toBe(12);
  for (const blob of abandoned) {
    expect(await db.table('campaignBlobs').get(blob.digest)).toBeUndefined();
    expect(await db.table('campaignPayloads').where('digest').equals(blob.digest).count()).toBe(0);
  }
  const loaded = await db.loadLatestCampaign('auto');
  expect(loaded.journal.materialize()).toEqual(active.journal.materialize());
  expect(serializeGame(replayArchive(loaded.journal.materialize()))).toBe(serializeGame(active.game));
});

test('a resealed predecessor-metadata mismatch refuses GC atomically after suffix installation; retry keeps the durable cursor', async () => {
  const db = store(), { game, journal } = campaign();
  for (let i = 0; i < 3; i++) { end(game, journal); await db.saveCampaign(game, journal, 'auto'); }
  const generations = await db.table('campaignGenerations').orderBy('id').toArray();
  const { metadataChecksum: _old, ...oldest } = await db.table('campaignBlobs').get(generations[0]!.headDigest);
  const undercount = { ...oldest, refs: 1 };
  await db.table('campaignBlobs').put({ ...undercount, metadataChecksum: checksum(JSON.stringify(undercount)) });
  const middle = await db.table('campaignBlobs').get(generations[1]!.headDigest);
  const { metadataChecksum: _middle, ...body } = middle;
  const changed = { ...body, previousDigest: null }; // Actual immutable payload still points to the oldest blob.
  await db.table('campaignBlobs').put({ ...changed, metadataChecksum: checksum(JSON.stringify(changed)) });
  const before = await storedRows(db), stats = db.lastCampaignSaveStats;
  end(game, journal);
  await expect(db.saveCampaign(game, journal, 'auto')).rejects.toThrow(/metadata differs from its payload/);
  expect(await storedRows(db)).toEqual(before); expect(db.lastCampaignSaveStats).toEqual(stats);
  const recovered = await db.loadLatestCampaign('auto');
  expect(recovered.game.turn).toBe(4);
  expect(serializeGame(replayArchive(recovered.journal.materialize()))).toBe(serializeGame(recovered.game));
  await db.table('campaignBlobs').put(middle);
  await db.saveCampaign(game, journal, 'auto');
  expect(db.lastCampaignSaveStats?.suffixRecords).toBe(1);
  const loaded = await db.loadLatestCampaign('auto');
  expect(loaded.journal.materialize()).toEqual(journal.materialize());
  expect(serializeGame(replayArchive(loaded.journal.materialize()))).toBe(serializeGame(game));
});
