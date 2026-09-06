import 'fake-indexeddb/auto';
import { afterEach, expect, test } from 'vitest';
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
