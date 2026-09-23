import 'fake-indexeddb/auto';
import { gunzipSync } from 'node:zlib';
import { expect, test } from 'vitest';
import { deserializeGame, serializeGame } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal, type CampaignArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from './index';
import captured from '../../chronicle/src/fixtures/v30-fleet-provisions-baseline.json';

test('persists and exports a continued rules30 voyage with rules31 stores and exact original history', async () => {
  const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { cases: Record<string, { save: string; archive: CampaignArchive }> };
  const entry = fixture.cases.navalAtSeaTwelveTurns!, game = deserializeGame(entry.save);
  const journal = resumeJournal(game, parseArchive(entry.archive, game));
  expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId })).toMatchObject({ ok: true });
  expect(game.armies['army.2']!.provisions).toBe(7);
  const db = new SaveStore('fleet-provisions-mixed-history');
  try {
    await db.saveCampaign(game, journal, 'manual');
    const restored = await db.loadLatestCampaign('manual');
    expect(serializeGame(restored.game)).toBe(serializeGame(game));
    const archive = restored.journal.materialize();
    expect(archive.initialSave).toBe(entry.archive.initialSave);
    expect(archive.records.slice(0, entry.archive.records.length)).toEqual(entry.archive.records);
    expect(archive.records.at(-1)?.rulesVersion).toBe(31);
    const portable = await importSave(await exportSave(serializeCampaign(restored.game, archive)));
    const imported = deserializeCampaign(portable);
    expect(imported.game.armies['army.2']!.provisions).toBe(7);
    expect(imported.archive).toEqual(archive);
    expect(serializeGame(replayArchive(imported.archive))).toBe(serializeGame(game));
  } finally { await db.delete(); }
});
