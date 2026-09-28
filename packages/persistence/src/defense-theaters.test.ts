import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { deserializeGame, serializeGame, SAVE_VERSION } from '@theandril/sim';
import { replayArchive, resumeJournal } from '@theandril/chronicle';
import { historical32 } from '../../chronicle/src/fixtures/defense-theaters32';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from './index';

test('theaters persist through a closed database and portable export with untouched rules32 history', async () => {
  const origin = historical32('generated-delegated'), game = deserializeGame(origin.save), journal = resumeJournal(game, origin.archive);
  const factionId = game.turnOwnerId, settlementId = Object.keys(game.settlements)[0]!, reserveCell = game.armies['army.2']!.cell;
  expect(journal.record(game, { type: 'setTheater', factionId, name: 'Saved defense', settlementIds: [settlementId], armyIds: ['army.2'], reserveCell, guardsPerSettlement: 2, enabled: true }).ok).toBe(true);
  expect(journal.record(game, { type: 'endTurn', factionId }).ok).toBe(true);
  const save = serializeGame(game), name = 'defense-theaters-mixed-history';
  let db = new SaveStore(name);
  try {
    await db.saveCampaign(game, journal, 'manual'); db.close(); db = new SaveStore(name);
    const restored = await db.loadLatestCampaign('manual'), archive = restored.journal.materialize();
    expect(serializeGame(restored.game)).toBe(save);
    expect(restored.game.theaters).toEqual(game.theaters); expect(restored.game.nextTheaterId).toBe(2);
    expect(archive.initialSave).toBe(origin.archive.initialSave);
    expect(archive.records.slice(0, origin.archive.records.length)).toEqual(origin.archive.records);
    expect(archive.records.at(-1)).toMatchObject({ rulesVersion: SAVE_VERSION, checkpointVersion: SAVE_VERSION });
    const imported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(restored.game, archive))));
    expect(serializeGame(imported.game)).toBe(save); expect(imported.archive).toEqual(archive);
    expect(serializeGame(replayArchive(imported.archive))).toBe(save);
    expect(imported.game.selectionGroups).toEqual(game.selectionGroups);
    expect(imported.game.postings).toEqual(game.postings);
  } finally { await db.delete(); }
});
