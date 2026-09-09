import 'fake-indexeddb/auto';
import { gunzipSync } from 'node:zlib';
import Dexie from 'dexie';
import { afterEach, expect, test, vi } from 'vitest';
import { createGame, deserializeGame, serializeGame, stateHash, SAVE_VERSION, type GameState } from '@theandril/sim';
import { createJournal, replayArchive, resumeJournal, type CampaignJournal } from '@theandril/chronicle';
import { checksum } from '@theandril/content';
import { SaveStore, serializeCampaign, deserializeCampaign, exportSave, importSave } from './index';
import { historyDigest, logicalCampaignBytes, MAX_CHUNK_BYTES, MAX_CHUNK_RECORDS, MAX_GARBAGE_BLOBS_PER_COMMIT } from './campaign-storage';
import preExpansion from '../../chronicle/src/fixtures/v12-faction-history.json';
import preBattle from '../../chronicle/src/fixtures/v13-battle-history.json';

const stores: SaveStore[] = [];
let serial = 0;
function store(): SaveStore { const db = new SaveStore(`incremental-test-${++serial}`); stores.push(db); return db; }
afterEach(async () => { vi.restoreAllMocks(); for (const db of stores.splice(0)) await db.delete(); });
function campaign(seed = 74): { game: GameState; journal: CampaignJournal } { const game = createGame({ seed, size: 'tiny', factionCount: 2, pace: 'short' }); return { game, journal: createJournal(game, { mode: 'watch' }) }; }
function end(game: GameState, journal: CampaignJournal): void { expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true); }
const generations = async (db: SaveStore, kind = 'auto') => db.table('campaignGenerations').where('kind').equals(kind).sortBy('id') as Promise<{ id: number; kind: string; type: string; originDigest: string; headDigest: string | null; manifestDigest: string }[]>;

test('incremental storage retains a genuine schema12 origin and immutable prefix while appending current rules', async () => {
  const fixture = (JSON.parse(gunzipSync(Buffer.from(preExpansion.payload, 'base64')).toString('utf8')) as { activeWork: { save: string; archive: unknown } }).activeWork;
  const game = deserializeGame(fixture.save), journal = resumeJournal(game, fixture.archive), before = journal.materialize(), db = store();
  await db.saveCampaign(game, journal, 'manual');
  end(game, journal);
  await db.saveCampaign(game, journal, 'manual');
  expect(db.lastCampaignSaveStats!.suffixRecords).toBe(1);
  const loaded = await db.loadLatestCampaign('manual'), archive = loaded.journal.materialize();
  expect(archive.initialSaveVersion).toBe(12); expect(archive.initialSave).toBe(before.initialSave);
  expect(archive.records.slice(0, before.records.length)).toEqual(before.records);
  expect(archive.records.at(-1)).toMatchObject({ rulesVersion: SAVE_VERSION, checkpointVersion: SAVE_VERSION });
  expect(serializeGame(loaded.game)).toBe(serializeGame(game));
  expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  const exported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(loaded.game, archive))));
  expect(exported.archive).toEqual(archive); expect(serializeGame(exported.game)).toBe(serializeGame(game));
});

test.each([
  ['fieldRally', 'fieldRoundOne', 'battleOrder'],
  ['fieldRoundOne', 'fieldCompleted', 'autoResolveBattle'],
  ['siegeRoundOne', 'siegeCompleted', 'autoResolveBattle'],
] as const)('incremental storage preserves the genuine schema13 %s battle through modern commands and portable replay', async (start, finish, type) => {
  const captures = (JSON.parse(gunzipSync(Buffer.from(preBattle.payload, 'base64')).toString()) as { cases: Record<string, { save: string; archive: unknown }> }).cases;
  const source = captures[start]!, expected = deserializeGame(captures[finish]!.save);
  const game = deserializeGame(source.save), journal = resumeJournal(game, source.archive), before = journal.materialize(), db = store();
  expect(game.battle?.rulesVersion).toBe(8);
  await db.saveCampaign(game, journal, 'manual');
  const command = type === 'battleOrder' ? { type, factionId: game.turnOwnerId, order: 'brace' as const } : { type, factionId: game.turnOwnerId };
  expect(journal.record(game, command).ok).toBe(true);
  expect(game.battle?.combat).toEqual(expected.battle?.combat);
  expect(game.battleReports).toEqual(expected.battleReports);
  await db.saveCampaign(game, journal, 'manual');
  expect(db.lastCampaignSaveStats!.suffixRecords).toBe(1);
  const loaded = await db.loadLatestCampaign('manual'), archive = loaded.journal.materialize();
  expect(archive.initialSaveVersion).toBe(13); expect(archive.initialSave).toBe(before.initialSave);
  expect(archive.records.slice(0, before.records.length)).toEqual(before.records);
  expect(archive.records.at(-1)).toMatchObject({ rulesVersion: SAVE_VERSION, checkpointVersion: null });
  expect(serializeGame(loaded.game)).toBe(serializeGame(game));
  const imported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(loaded.game, archive))));
  expect(imported.archive).toEqual(archive);
  expect(serializeGame(replayArchive(imported.archive))).toBe(serializeGame(game));
});

test('incremental commit preserves replay, counts exact envelope bytes, and writes no history for a no-op save', async () => {
  const db = store(); const { game, journal } = campaign(); end(game, journal);
  await db.saveCampaign(game, journal, 'auto');
  expect(db.lastCampaignSaveStats).toMatchObject({ suffixRecords: 1, newBlobs: 2, historyPayloadWrites: 6 });
  const oldPayloads = await db.table('campaignPayloads').toArray();
  const materialize = vi.spyOn(journal, 'materialize').mockImplementation(() => { throw new Error('No whole-history materialization during save'); });
  await db.saveCampaign(game, journal, 'auto');
  expect(db.lastCampaignSaveStats).toMatchObject({ suffixRecords: 0, encodedHistoryBytes: 0, newBlobs: 0, historyPayloadWrites: 0 });
  expect(await db.table('campaignPayloads').toArray()).toEqual(oldPayloads);
  end(game, journal); await db.saveCampaign(game, journal, 'auto');
  expect(db.lastCampaignSaveStats).toMatchObject({ suffixRecords: 1, newBlobs: 1, historyPayloadWrites: 3 }); materialize.mockRestore();
  expect(db.lastCampaignSaveStats?.logicalBytes).toBe(new TextEncoder().encode(serializeCampaign(game, journal.materialize())).byteLength);
  const loaded = await db.loadLatestCampaign('auto'); expect(stateHash(loaded.game)).toBe(stateHash(game)); expect(loaded.journal.materialize()).toEqual(journal.materialize());
  expect(stateHash(replayArchive(loaded.journal.materialize()))).toBe(stateHash(game));
  expect(deserializeCampaign(await db.loadLatest('auto')).archive).toEqual(journal.materialize());
  const exported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(loaded.game, loaded.journal.materialize()))));
  expect(stateHash(replayArchive(exported.archive))).toBe(stateHash(game));
});

test('logical byte counting includes quotes, Unicode, delimiters and empty/nonempty record lists exactly', () => {
  const { game, journal } = campaign(); journal.record(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: '炭火 💠 "Hearth"' });
  for (let step = 0; step < 3; step++) {
    const archive = journal.materialize(); const { records, initialSave, ...header } = archive;
    const encode = (text: string) => new TextEncoder().encode(text).byteLength;
    expect(logicalCampaignBytes(serializeGame(game), header, encode(JSON.stringify(initialSave)), records.reduce((sum, record) => sum + encode(JSON.stringify(record)), 0), records.length)).toBe(encode(serializeCampaign(game, archive)));
    end(game, journal);
  }
});

test('three generations rotate metadata atomically, share immutable prefixes and collect unused origins/branches', async () => {
  const db = store(); const first = campaign();
  for (let turn = 0; turn < 5; turn++) { end(first.game, first.journal); await db.saveCampaign(first.game, first.journal, 'auto'); }
  expect(await generations(db)).toHaveLength(3);
  expect(await db.table('campaignBlobs').count()).toBe(6); // One origin + five linked chunks, shared by all retained heads.
  expect(await db.table('campaignPayloads').count()).toBe(18);
  await db.saveCampaign(first.game, first.journal, 'manual');
  const second = campaign(99);
  for (let turn = 0; turn < 3; turn++) { end(second.game, second.journal); await db.saveCampaign(second.game, second.journal, 'auto'); }
  expect(stateHash((await db.loadLatestCampaign('manual')).game)).toBe(stateHash(first.game));
  for (let turn = 0; turn < 3; turn++) { end(second.game, second.journal); await db.saveCampaign(second.game, second.journal, 'manual'); }
  const blobRows = await db.table('campaignBlobs').toArray(); const payloadRows = await db.table('campaignPayloads').toArray();
  expect(blobRows.filter(row => row.type === 'origin')).toHaveLength(1);
  expect(payloadRows).toHaveLength(blobRows.length * 3); expect(blobRows.every(row => row.refs > 0)).toBe(true);
});

test('quota-like failures roll back chunks, manifests, rotation and cursors; retry retains the full suffix', async () => {
  const db = store(); const { game, journal } = campaign();
  for (let i = 0; i < 3; i++) { end(game, journal); await db.saveCampaign(game, journal, 'auto'); }
  const before = await db.table('campaignGenerations').toArray(); const blobs = await db.table('campaignBlobs').toArray();
  end(game, journal);
  const hook = () => { throw new DOMException('Storage quota exceeded', 'QuotaExceededError'); };
  db.table('campaignManifests').hook('creating', hook);
  await expect(db.saveCampaign(game, journal, 'auto')).rejects.toThrow(/quota/i);
  db.table('campaignManifests').hook('creating').unsubscribe(hook);
  expect(await db.table('campaignGenerations').toArray()).toEqual(before); expect(await db.table('campaignBlobs').toArray()).toEqual(blobs);
  expect((await db.loadLatestCampaign('auto')).game.turn).toBe(game.turn - 1);
  await db.saveCampaign(game, journal, 'auto');
  expect(db.lastCampaignSaveStats?.suffixRecords).toBe(1);
  expect((await db.loadLatestCampaign('auto')).journal.materialize()).toEqual(journal.materialize());
  expect(await generations(db)).toHaveLength(3);
});

test('invalid newest manifest/tail falls back without deleting evidence; independent shared-prefix replicas recover', async () => {
  const db = store(); const { game, journal } = campaign();
  for (let i = 0; i < 3; i++) { end(game, journal); await db.saveCampaign(game, journal, 'auto'); }
  const rows = await generations(db); const latest = rows.at(-1)!;
  const manifest = await db.table('campaignManifests').get(latest.id);
  await db.table('campaignManifests').put({ generationId: latest.id, payload: 'broken manifest' });
  expect((await db.loadLatestCampaign('auto')).game.turn).toBe(game.turn - 1);
  await db.table('campaignManifests').put(manifest);
  const shared = rows[0]!.headDigest!;
  for (const replica of [0, 1]) await db.table('campaignPayloads').update([shared, replica], { payload: 'corrupt shared prefix' });
  expect(stateHash((await db.loadLatestCampaign('auto')).game)).toBe(stateHash(game));
  for (const replica of [0, 1, 2]) await db.table('campaignPayloads').update([latest.headDigest, replica], { payload: 'corrupt latest tail' });
  expect((await db.loadLatestCampaign('auto')).game.turn).toBe(game.turn - 1);
  end(game, journal);
  await expect(db.saveCampaign(game, journal, 'auto')).rejects.toThrow(/replicas/);
  expect(await generations(db)).toHaveLength(3);
});

test('branching an older recovered journal and alternating kinds preserves both immutable histories', async () => {
  const db = store(); const original = campaign(); end(original.game, original.journal); await db.saveCampaign(original.game, original.journal, 'manual');
  const branch = await db.loadLatestCampaign('manual');
  for (let i = 0; i < 4; i++) { end(original.game, original.journal); await db.saveCampaign(original.game, original.journal, 'auto'); }
  branch.journal.record(branch.game, { type: 'found', factionId: branch.game.turnOwnerId, armyId: 'army.1', name: 'Branch hearth' });
  end(branch.game, branch.journal); await db.saveCampaign(branch.game, branch.journal, 'manual');
  expect((await db.loadLatestCampaign('manual')).journal.materialize()).toEqual(branch.journal.materialize());
  expect((await db.loadLatestCampaign('auto')).journal.materialize()).toEqual(original.journal.materialize());
  expect(stateHash(replayArchive(branch.journal.materialize()))).toBe(stateHash(branch.game));
  const clonedGame = deserializeCampaign(serializeCampaign(branch.game, branch.journal.materialize())).game;
  const cloned = resumeJournal(clonedGame, branch.journal.materialize()); await db.saveCampaign(clonedGame, cloned, 'manual');
  expect(stateHash((await db.loadLatestCampaign('manual')).game)).toBe(stateHash(clonedGame));
});

test('a real DB1 upgrade preserves raw rows and mixed old/new API ordering and recovery', async () => {
  const name = `incremental-test-${++serial}`; const old = new Dexie(name); old.version(1).stores({ saves: '++id,kind' });
  const { game, journal } = campaign(); const oldText = serializeGame(game);
  await old.table('saves').add({ kind: 'manual', turn: game.turn, text: oldText }); old.close();
  const db = new SaveStore(name); stores.push(db);
  expect(await db.loadLatest('manual')).toBe(oldText); expect(await db.table('saves').count()).toBe(1);
  expect((await db.loadLatestCampaign('manual')).journal.coverage).toBe('from-save');
  end(game, journal); await db.saveCampaign(game, journal, 'manual'); expect((await db.loadLatestCampaign('manual')).game.turn).toBe(2);
  await db.save(oldText, 'manual'); expect(await db.loadLatest('manual')).toBe(oldText);
  end(game, journal); await db.saveCampaign(game, journal, 'manual'); expect(await generations(db, 'manual')).toHaveLength(3);
  expect((await db.loadLatestCampaign('manual')).journal.materialize()).toEqual(journal.materialize());
});

test('history chunks obey record and byte caps, including oversized individual records with exact reconstruction', async () => {
  const db = store(); const { game, journal } = campaign();
  // Rejected commands are genuine immutable records; a large malformed identifier does not alter canonical rules.
  for (let i = 0; i < MAX_CHUNK_RECORDS + 2; i++) journal.record(game, { type: 'move', factionId: game.turnOwnerId, armyId: 'missing', target: 0 });
  journal.record(game, { type: 'move', factionId: '炭💠'.repeat(80_000), armyId: 'missing', target: 0 });
  await db.saveCampaign(game, journal, 'auto');
  const blobs = await db.table('campaignBlobs').toArray(); expect(blobs.some(row => row.type === 'fragment')).toBe(true);
  expect(blobs.filter(row => row.type !== 'origin').every(row => row.byteLength <= MAX_CHUNK_BYTES && row.to - row.from <= MAX_CHUNK_RECORDS)).toBe(true);
  const loaded = await db.loadLatestCampaign('auto'); expect(loaded.journal.materialize()).toEqual(journal.materialize());
  expect(stateHash(replayArchive(loaded.journal.materialize()))).toBe(stateHash(game));
});

test('all replica corruption fails visibly; digest collisions and cross-origin replacements are not silently accepted', async () => {
  const db = store(); const { game, journal } = campaign(); end(game, journal); await db.saveCampaign(game, journal, 'auto');
  const origin = (await generations(db))[0]!.originDigest;
  for (const replica of [0, 1, 2]) await db.table('campaignPayloads').update([origin, replica], { payload: '{}' });
  await expect(db.loadLatestCampaign('auto')).rejects.toThrow(/No valid save/);
  const freshJournal = resumeJournal(game, journal.materialize());
  await expect(db.saveCampaign(game, freshJournal, 'auto')).rejects.toThrow(/content address/);
  expect(await generations(db)).toHaveLength(1);
  expect(await historyDigest('same bytes')).toBe(await historyDigest('same bytes'));
});

test('cross-origin chunk splices fail even when the manifest and metadata checksums have been recomputed', async () => {
  const db = store(); const first = campaign(74); const second = campaign(99);
  end(first.game, first.journal); end(second.game, second.journal);
  await db.saveCampaign(first.game, first.journal, 'auto'); await db.saveCampaign(second.game, second.journal, 'manual');
  const destination = (await generations(db))[0]!; const foreign = (await generations(db, 'manual'))[0]!;
  const stored = await db.table('campaignManifests').get(destination.id);
  const manifest = JSON.parse(stored.payload) as { headDigest: string };
  manifest.headDigest = foreign.headDigest!;
  const payload = JSON.stringify(manifest); const manifestDigest = await historyDigest(payload);
  await db.table('campaignManifests').put({ generationId: destination.id, payload });
  const current = await db.table('campaignGenerations').get(destination.id);
  const { id: _id, metadataChecksum: _checksum, ...body } = current;
  const updated = { ...body, headDigest: foreign.headDigest, manifestDigest };
  await db.table('campaignGenerations').put({ id: destination.id, ...updated, metadataChecksum: checksum(JSON.stringify(updated)) });
  await expect(db.loadLatestCampaign('auto')).rejects.toThrow(/No valid save/);
  expect(stateHash((await db.loadLatestCampaign('manual')).game)).toBe(stateHash(second.game));
});

test('corrupt refcounts cannot trigger destructive cleanup of intact shared payloads', async () => {
  const db = store(); const { game, journal } = campaign();
  for (let i = 0; i < 3; i++) { end(game, journal); await db.saveCampaign(game, journal, 'auto'); }
  const beforeRows = await db.table('campaignGenerations').toArray(); const beforeCopies = await db.table('campaignPayloads').toArray();
  const latest = (await generations(db)).at(-1)!;
  await db.table('campaignBlobs').update(latest.headDigest, { refs: 900 });
  end(game, journal); await expect(db.saveCampaign(game, journal, 'auto')).rejects.toThrow(/metadata is corrupt/);
  expect(await db.table('campaignGenerations').toArray()).toEqual(beforeRows); expect(await db.table('campaignPayloads').toArray()).toEqual(beforeCopies);
  expect((await db.loadLatestCampaign('auto')).game.turn).toBe(game.turn - 1);
});

test('rotating a long abandoned campaign limits cleanup per commit and safely drains deferred orphan chains', async () => {
  const db = store(); const old = campaign(74);
  for (let i = 0; i < MAX_GARBAGE_BLOBS_PER_COMMIT + 6; i++) { end(old.game, old.journal); await db.saveCampaign(old.game, old.journal, 'auto'); }
  const active = campaign(99);
  for (let i = 0; i < 2; i++) { end(active.game, active.journal); await db.saveCampaign(active.game, active.journal, 'auto'); }
  const before = await db.table('campaignBlobs').count();
  end(active.game, active.journal); await db.saveCampaign(active.game, active.journal, 'auto');
  expect(before + 1 - await db.table('campaignBlobs').count()).toBe(MAX_GARBAGE_BLOBS_PER_COMMIT);
  expect(await db.table('campaignGarbage').count()).toBeGreaterThan(0);
  expect(stateHash((await db.loadLatestCampaign('auto')).game)).toBe(stateHash(active.game));
  await db.saveCampaign(active.game, active.journal, 'auto');
  expect(db.lastCampaignSaveStats?.historyPayloadWrites).toBe(0);
  expect(await db.table('campaignGarbage').count()).toBe(0);
  expect(await db.table('campaignBlobs').count()).toBe(4);
});

test('v2 rejects oversized fragments; legacy reads survive but cannot migrate into an unreadable v2 generation', async () => {
  const db = store(); const { game, journal } = campaign();
  await db.saveCampaign(game, journal, 'auto');
  journal.record(game, { type: 'move', factionId: '炭'.repeat(1_500_000), armyId: 'missing', target: 0 });
  const record = JSON.stringify(journal.materialize().records[0]);
  const row = (await generations(db))[0]!;
  const manifest = JSON.parse((await db.table('campaignManifests').get(row.id)).payload);
  const pieces: string[] = [];
  for (let from = 0; from < record.length; from += 32_000) pieces.push(record.slice(from, from + 32_000));
  let head: string | null = null, historyStoredBytes = 0;
  for (const [part, json] of pieces.entries()) {
    const payload = JSON.stringify({ version: 1, type: 'fragment', originDigest: row.originDigest, previousDigest: head,
      from: 0, to: Number(part === pieces.length - 1), sequence: 1, part, parts: pieces.length, json });
    const digest = await historyDigest(payload);
    const metadata = { digest, type: 'fragment', previousDigest: head, refs: 1, byteLength: Buffer.byteLength(payload), from: 0, to: Number(part === pieces.length - 1) };
    await db.table('campaignBlobs').put({ ...metadata, metadataChecksum: checksum(JSON.stringify(metadata)) });
    head = digest; historyStoredBytes += Buffer.byteLength(payload);
    await db.table('campaignPayloads').bulkPut([0, 1, 2].map(replica => ({ digest: head, replica, payload })));
  }
  manifest.headDigest = head; manifest.recordCount = 1; manifest.recordBytes = Buffer.byteLength(record);
  manifest.historyStoredBytes = historyStoredBytes; manifest.historyBlobCount = pieces.length;
  manifest.logicalBytes = logicalCampaignBytes(manifest.snapshot, manifest.header, manifest.originEscapedBytes, manifest.recordBytes, 1);
  const payload = JSON.stringify(manifest), manifestDigest = await historyDigest(payload);
  await db.table('campaignManifests').put({ generationId: row.id, payload });
  const { id, metadataChecksum: _old, ...body } = await db.table('campaignGenerations').get(row.id);
  const updated = { ...body, headDigest: head, manifestDigest };
  await db.table('campaignGenerations').put({ id, ...updated, metadataChecksum: checksum(JSON.stringify(updated)) });
  await expect(db.loadLatestCampaign('auto')).rejects.toThrow(/No valid save/);
  // The same history is legal under the old v1 policy. Preserve read/export compatibility,
  // but never commit a v2 head whose shared prefix would fail the v2 reader.
  const { historyStoredBytes: _bytes, historyBlobCount: _blobs, ...legacy } = manifest;
  const oldPayload = JSON.stringify({ ...legacy, version: 1 });
  const legacyRow = { ...updated, manifestDigest: await historyDigest(oldPayload) };
  await db.table('campaignManifests').put({ generationId: id, payload: oldPayload });
  await db.table('campaignGenerations').put({ id, ...legacyRow, metadataChecksum: checksum(JSON.stringify(legacyRow)) });
  const loaded = await db.loadLatestCampaign('auto');
  expect(loaded.journal.materialize()).toEqual(journal.materialize());
  expect(deserializeCampaign(await db.loadLatest('auto')).archive).toEqual(journal.materialize());
  const before = await db.table('campaignGenerations').toArray();
  end(loaded.game, loaded.journal);
  await expect(db.saveCampaign(loaded.game, loaded.journal, 'auto')).rejects.toThrow(/legacy.*record.*4 MiB limit/i);
  expect(await db.table('campaignGenerations').toArray()).toEqual(before);
  expect((await db.loadLatestCampaign('auto')).journal.materialize()).toEqual(journal.materialize());
});

test('a v1 manifest stays readable and appends via v2 without rewriting its immutable prefix', async () => {
  const db = store(); const { game, journal } = campaign(); end(game, journal);
  await db.saveCampaign(game, journal, 'auto');
  const row = (await generations(db))[0]!;
  const { historyStoredBytes: _bytes, historyBlobCount: _blobs, ...legacy } = JSON.parse((await db.table('campaignManifests').get(row.id)).payload);
  const payload = JSON.stringify({ ...legacy, version: 1 });
  const manifestDigest = await historyDigest(payload);
  await db.table('campaignManifests').put({ generationId: row.id, payload });
  const { id, metadataChecksum: _seal, ...body } = await db.table('campaignGenerations').get(row.id);
  const updated = { ...body, manifestDigest };
  await db.table('campaignGenerations').put({ id, ...updated, metadataChecksum: checksum(JSON.stringify(updated)) });
  const copies = await db.table('campaignPayloads').toArray();
  const loaded = await db.loadLatestCampaign('auto');
  expect(loaded.journal.materialize()).toEqual(journal.materialize());
  end(loaded.game, loaded.journal); await db.saveCampaign(loaded.game, loaded.journal, 'auto');
  expect(db.lastCampaignSaveStats?.suffixRecords).toBe(1);
  for (const copy of copies) expect(await db.table('campaignPayloads').get([copy.digest, copy.replica])).toEqual(copy);
  const latest = (await generations(db)).at(-1)!;
  const manifest = JSON.parse((await db.table('campaignManifests').get(latest.id)).payload);
  expect(manifest).toMatchObject({ version: 2, historyBlobCount: 2 });
  expect(stateHash(replayArchive((await db.loadLatestCampaign('auto')).journal.materialize()))).toBe(stateHash(loaded.game));
});

test.each(['historyStoredBytes', 'historyBlobCount'] as const)('v2 %s is verified, not trusted when a manifest is resealed', async field => {
  const db = store(); const { game, journal } = campaign();
  end(game, journal); await db.saveCampaign(game, journal, 'auto');
  end(game, journal); await db.saveCampaign(game, journal, 'auto');
  const row = (await generations(db)).at(-1)!;
  const manifest = JSON.parse((await db.table('campaignManifests').get(row.id)).payload);
  manifest[field]--;
  const payload = JSON.stringify(manifest), manifestDigest = await historyDigest(payload);
  await db.table('campaignManifests').put({ generationId: row.id, payload });
  const { id, metadataChecksum: _seal, ...body } = await db.table('campaignGenerations').get(row.id);
  const updated = { ...body, manifestDigest };
  await db.table('campaignGenerations').put({ id, ...updated, metadataChecksum: checksum(JSON.stringify(updated)) });
  expect((await db.loadLatestCampaign('auto')).game.turn).toBe(game.turn - 1);
  expect(await generations(db)).toHaveLength(2);
});

test('a single 4-MiB record limit rejects oversized suffixes without touching recovery generations', async () => {
  const db = store(); const { game, journal } = campaign(); end(game, journal); await db.saveCampaign(game, journal, 'auto');
  const rows = await db.table('campaignGenerations').toArray(); const copies = await db.table('campaignPayloads').toArray();
  const result = journal.record(game, { type: 'move', factionId: '炭'.repeat(Math.floor(4 * 1024 * 1024 / 3) + 1), armyId: 'missing', target: 0 });
  expect(result.ok).toBe(false);
  await expect(db.saveCampaign(game, journal, 'auto')).rejects.toThrow(/record.*4 MiB limit/i);
  expect(await db.table('campaignGenerations').toArray()).toEqual(rows); expect(await db.table('campaignPayloads').toArray()).toEqual(copies);
  expect((await db.loadLatestCampaign('auto')).journal.recordCount).toBe(1);
});
