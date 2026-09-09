import 'fake-indexeddb/auto';
import { afterEach, expect, test, vi } from 'vitest';
import { createGame, serializeGame, deserializeGame, stateHash, applyCommand } from '@theandril/sim';
import { SaveStore, exportSave, importSave, serializeCampaign, deserializeCampaign } from './index';
import { createArchive, applyRecordedCommand, replayArchive } from '@theandril/chronicle';
import { checksum } from '@theandril/content';
import { assertSaveSize } from './size';
import { gzipSync, strToU8 } from 'fflate';

const databases: SaveStore[] = [];
function store(name: string): SaveStore { const database = new SaveStore(name); databases.push(database); return database; }
afterEach(async () => { for (const db of databases.splice(0)) await db.delete(); });
test('save budget counts UTF-8 bytes, including non-BMP and non-Latin names', () => {
  expect(() => assertSaveSize('four', 4)).not.toThrow();
  expect(() => assertSaveSize('💠', 4)).not.toThrow();
  expect(() => assertSaveSize('💠', 3)).toThrow(/limit/);
  expect(() => assertSaveSize('炭火', 5)).toThrow(/limit/);
  expect(() => assertSaveSize('炭火', 6)).not.toThrow();
  expect(() => assertSaveSize('four', 3)).toThrow('3-byte limit');
});
test('save/load and compressed import reproduce a deterministic campaign', async () => {
  const state = createGame({ seed: 17, size: 'tiny' });
  const text = serializeGame(state);
  const db = store('roundtrip');
  await db.save(text, 'manual');
  expect(stateHash(deserializeGame(await db.loadLatest('manual')))).toBe(stateHash(state));
  expect(stateHash(deserializeGame(await importSave(await exportSave(text))))).toBe(stateHash(state));
});
test('autosave rotates three generations and corruption does not overwrite recovery', async () => {
  const state = createGame({ seed: 21, size: 'tiny' });
  const db = store('rotation');
  for (let i = 0; i < 5; i++) {
    applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId });
    await db.save(serializeGame(state), 'auto');
  }
  expect(await db.table('saves').count()).toBe(3);
  await expect(db.save('{broken', 'auto')).rejects.toThrow();
  expect(deserializeGame(await db.loadLatest('auto')).turn).toBe(state.turn);
  const latest = await db.table('saves').orderBy('id').last();
  await db.table('saves').update(latest.id as number, { text: 'broken disk data' });
  expect(deserializeGame(await db.loadLatest('auto')).turn).toBe(state.turn - 1);
  expect(await db.table('saves').count()).toBe(3);
});
test('malformed files fail without touching the saved campaign', async () => {
  const db = store('bad-import');
  const text = serializeGame(createGame({ seed: 1, size: 'tiny' }));
  await db.save(text, 'manual');
  await expect(importSave(new Uint8Array([0, 1, 2]))).rejects.toThrow();
  const bytes = await exportSave(text);
  bytes[bytes.length - 4] = 255;
  bytes[bytes.length - 3] = 255;
  bytes[bytes.length - 2] = 255;
  bytes[bytes.length - 1] = 255;
  await expect(importSave(bytes)).rejects.toThrow(/limit/);
  expect(await db.loadLatest('manual')).toBe(text);
});
test('gzip CRC corruption and a forged smaller expanded length are rejected', async () => {
  const text = serializeGame(createGame({ seed: 17, size: 'tiny' }));
  const corrupt = await exportSave(text);
  corrupt[corrupt.length - 8] = (corrupt[corrupt.length - 8] ?? 0) ^ 255;
  await expect(importSave(corrupt)).rejects.toThrow();
  const padded = gzipSync(strToU8(text + ' '.repeat(1_000_000)));
  new DataView(padded.buffer).setUint32(padded.length - 4, text.length, true);
  await expect(importSave(padded)).rejects.toThrow();
});

test('campaign envelope preserves full archive and AI-watch mode across save and compressed roundtrip', async () => {
  const game = createGame({ seed: 27, size: 'tiny', factionCount: 2 });
  const archive = createArchive(game, { mode: 'watch' });
  for (let i = 0; i < 8; i++) applyRecordedCommand(game, archive, { type: 'endTurn', factionId: game.turnOwnerId });
  const text = serializeCampaign(game, archive);
  const db = store('archive-roundtrip');
  await db.save(text, 'manual');
  const restored = deserializeCampaign(await importSave(await exportSave(await db.loadLatest('manual'))));
  expect(restored.archive.mode).toBe('watch');
  expect(restored.archive.coverage).toBe('complete');
  expect(restored.archive.records).toHaveLength(8);
  expect(stateHash(restored.game)).toBe(stateHash(game));
  expect(stateHash(replayArchive(restored.archive))).toBe(stateHash(game));
  applyRecordedCommand(restored.game, restored.archive, { type: 'endTurn', factionId: restored.game.turnOwnerId });
  applyRecordedCommand(game, archive, { type: 'endTurn', factionId: game.turnOwnerId });
  expect(restored.archive).toEqual(archive);
});

test('explicit v2 envelopes use a tagged portable codec without changing history or old gzip files', async () => {
  const game = createGame({ seed: 27, size: 'tiny', factionCount: 2 });
  const archive = createArchive(game, { mode: 'watch' });
  applyRecordedCommand(game, archive, { type: 'endTurn', factionId: game.turnOwnerId });
  const legacy = serializeCampaign(game, archive);
  const extended = JSON.stringify({ ...JSON.parse(legacy), version: 2 });
  expect(deserializeCampaign(extended).archive).toEqual(archive);
  const portable = await exportSave(extended);
  expect([...portable.slice(0, 4)]).toEqual([84, 65, 67, 50]); // TAC2
  const loaded = deserializeCampaign(await importSave(portable));
  expect(loaded.archive).toEqual(archive);
  expect(stateHash(replayArchive(loaded.archive))).toBe(stateHash(game));
  expect([...(await exportSave(legacy)).slice(0, 2)]).toEqual([31, 139]);
});

test('legacy v1 files with large valid records remain readable and re-exportable', async () => {
  const game = createGame({ seed: 27, size: 'tiny', factionCount: 2 });
  const archive = createArchive(game, { mode: 'watch' });
  applyRecordedCommand(game, archive, { type: 'move', factionId: '炭'.repeat(1_500_000), armyId: 'missing', target: 0 });
  // Explicit old-envelope construction exercises the pre-existing 64-MiB contract, not the new writer policy.
  const payload = { snapshot: serializeGame(game), archive };
  const text = JSON.stringify({ format: 'theandril-campaign', version: 1, checksum: checksum(JSON.stringify(payload)), ...payload });
  expect(deserializeCampaign(text).archive).toEqual(archive);
  const restored = deserializeCampaign(await importSave(gzipSync(strToU8(text))));
  expect(restored.archive).toEqual(archive);
  expect(deserializeCampaign(await importSave(await exportSave(text))).archive).toEqual(archive);
});

test('v2 section policy bounds aggregate history and record count before whole-envelope encoding', () => {
  const game = createGame({ seed: 27, size: 'tiny', factionCount: 2 });
  const archive = createArchive(game, { mode: 'watch' });
  applyRecordedCommand(game, archive, { type: 'move', factionId: '炭'.repeat(700_000), armyId: 'missing', target: 0 });
  // Deliberately aliased synthetic boundary input, not campaign/replay evidence: no 128-MiB fixture allocation.
  const record = archive.records[0]!;
  archive.records = Array.from({ length: 65 }, () => record);
  expect(() => serializeCampaign(game, archive)).toThrow(/history.*byte limit/i);
  archive.records = Array.from({ length: 1_000_001 }, () => record);
  expect(() => serializeCampaign(game, archive)).toThrow(/archive sections/);
});

test('portable v2 retains CRC, length, format and compressed-input bounds', async () => {
  const game = createGame({ seed: 27, size: 'tiny', factionCount: 2 });
  const text = JSON.stringify({ ...JSON.parse(serializeCampaign(game, createArchive(game, { mode: 'watch' }))), version: 2 });
  const bytes = await exportSave(text);
  const corrupt = bytes.slice(); corrupt[corrupt.length - 8]! ^= 255;
  await expect(importSave(corrupt)).rejects.toThrow();
  const short = bytes.slice(); new DataView(short.buffer).setUint32(short.length - 4, 1, true);
  await expect(importSave(short)).rejects.toThrow();
  const bomb = bytes.slice(); new DataView(bomb.buffer).setUint32(bomb.length - 4, 192 * 1024 * 1024 + 1, true);
  await expect(importSave(bomb)).rejects.toThrow(/byte limit/);
  await expect(importSave(bytes.subarray(4))).rejects.toThrow(/tag.*version/);
  const old = await exportSave(serializeGame(game));
  await expect(importSave(new Uint8Array([84, 65, 67, 50, ...old]))).rejects.toThrow(/tag.*version/);
  await expect(importSave(new Uint8Array(64 * 1024 * 1024 + 1))).rejects.toThrow(/Compressed.*64 MiB/);
  await expect(importSave(bytes.slice(0, -1))).rejects.toThrow();
  await expect(importSave(new Uint8Array([...bytes, ...old]))).rejects.toThrow();
});

test('invalid UTF-8 cancels the decoder instead of leaving unread decompression work', async () => {
  const cancel = vi.spyOn(ReadableStreamDefaultReader.prototype, 'cancel');
  try {
    const gzip = gzipSync(new Uint8Array([255, ...strToU8(' '.repeat(100_000))]));
    await expect(importSave(gzip)).rejects.toThrow();
    expect(cancel).toHaveBeenCalled();
  } finally { cancel.mockRestore(); }
});

test('legacy raw saves announce partial history; envelope corruption cannot replace a valid generation', async () => {
  const game = createGame({ seed: 31, size: 'tiny' });
  applyCommand(game, { type: 'endTurn', factionId: game.turnOwnerId });
  const migrated = deserializeCampaign(serializeGame(game));
  expect(migrated.archive.coverage).toBe('from-save');
  expect(migrated.archive.initialTurn).toBe(2);
  const text = serializeCampaign(migrated.game, migrated.archive);
  const db = store('archive-corruption');
  await db.save(text, 'auto');
  const broken = JSON.parse(text) as { checksum: string; snapshot: string; archive: { initialTurn: number } };
  broken.archive.initialTurn = 99;
  await expect(db.save(JSON.stringify(broken), 'auto')).rejects.toThrow(/checksum/);
  broken.checksum = checksum(JSON.stringify({ snapshot: broken.snapshot, archive: broken.archive }));
  await expect(db.save(JSON.stringify(broken), 'auto')).rejects.toThrow(/snapshot mismatch/);
  expect(await db.loadLatest('auto')).toBe(text);
});
