import 'fake-indexeddb/auto';
import { gunzipSync } from 'node:zlib';
import { expect, test } from 'vitest';
import { deserializeGame, serializeGame } from '@theandril/sim';
import { replayArchive, resumeJournal, type CampaignArchive } from '@theandril/chronicle';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from './index';
import captured from '../../chronicle/src/fixtures/v31-selection-groups-baseline.json';

test('persists, reopens and exports rules32 saved groups with the untouched original rules31 voyage history', async () => {
  const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { cases: Record<string, { save: string; archive: CampaignArchive }> };
  const entry = fixture.cases.navalEmbarked!, game = deserializeGame(entry.save), journal = resumeJournal(game, entry.archive);
  const factionId = game.turnOwnerId, nextId = game.nextId;
  expect(journal.record(game, { type: 'setSelectionGroup', factionId, kind: 'armies', name: 'Island expedition', memberIds: ['army.9'] })).toMatchObject({ ok: true });
  expect(journal.record(game, { type: 'setSelectionGroup', factionId, kind: 'settlements', name: 'Harbours', memberIds: ['settlement.5'] })).toMatchObject({ ok: true });
  expect(game.nextId).toBe(nextId);
  const name = 'selection-groups-mixed-history';
  let db = new SaveStore(name);
  try {
    await db.saveCampaign(game, journal, 'manual'); db.close(); db = new SaveStore(name);
    const restored = await db.loadLatestCampaign('manual'), saved = serializeGame(game);
    expect(serializeGame(restored.game)).toBe(saved);
    const archive = restored.journal.materialize();
    expect(archive.initialSave).toBe(entry.archive.initialSave);
    expect(archive.records.slice(0, entry.archive.records.length)).toEqual(entry.archive.records);
    expect(archive.records.at(-1)?.rulesVersion).toBe(32);
    const imported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(restored.game, archive))));
    expect(serializeGame(imported.game)).toBe(saved); expect(imported.archive).toEqual(archive);
    expect(serializeGame(replayArchive(imported.archive))).toBe(saved);
    expect(imported.game.selectionGroups).toEqual(game.selectionGroups);
  } finally { await db.delete(); }
});
