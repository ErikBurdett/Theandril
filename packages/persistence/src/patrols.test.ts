import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { deserializeGame, serializeGame, SAVE_VERSION } from '@theandril/sim';
import { replayArchive, resumeJournal } from '@theandril/chronicle';
import { historical34 } from '../../chronicle/src/fixtures/patrols34';
import { deserializeCampaign, exportSave, importSave, SaveStore, serializeCampaign } from './index';

test('patrol target and paused policy persist through reopened storage, portable export and mixed-version replay', async () => {
  const prior = historical34('orders-origin'), game = deserializeGame(prior.save), journal = resumeJournal(game, prior.archive);
  const factionId = game.turnOwnerId, armyId = Object.keys(game.armies)[0]!;
  expect(journal.record(game, { type: 'setPatrol', factionId, armyId, firstCell: 495, secondCell: 500, enabled: true }).ok).toBe(true);
  expect(journal.record(game, { type: 'endTurn', factionId }).ok).toBe(true);
  expect(journal.record(game, { type: 'setPatrolEnabled', factionId, armyId, enabled: false }).ok).toBe(true);
  const save = serializeGame(game), name = 'patrols-mixed-history'; let store = new SaveStore(name);
  try {
    await store.saveCampaign(game, journal, 'manual'); store.close(); store = new SaveStore(name);
    const restored = await store.loadLatestCampaign('manual'), archive = restored.journal.materialize();
    expect(serializeGame(restored.game)).toBe(save); expect(restored.game.patrols).toEqual(game.patrols);
    expect(archive.initialSave).toBe(prior.archive.initialSave);
    expect(archive.records.at(-1)?.rulesVersion).toBe(SAVE_VERSION);
    const imported = deserializeCampaign(await importSave(await exportSave(serializeCampaign(restored.game, archive))));
    expect(serializeGame(imported.game)).toBe(save); expect(imported.archive).toEqual(archive);
    expect(serializeGame(replayArchive(imported.archive))).toBe(save);
  } finally { await store.delete(); }
});
