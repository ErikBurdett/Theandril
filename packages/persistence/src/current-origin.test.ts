import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { createGame, serializeGame, SAVE_VERSION } from '@theandril/sim';
import { createJournal, replayArchive } from '@theandril/chronicle';
import { SaveStore } from './index';

test.each(['manual', 'auto'] as const)('persists a fresh current-version origin in a %s slot before and after its first command', async kind => {
  const game = createGame({ seed: 74, size: 'tiny', factionCount: 2 });
  const journal = createJournal(game, { mode: 'player' });
  const db = new SaveStore(`current-origin-${kind}`);
  try {
    expect(JSON.parse(serializeGame(game)).version).toBe(SAVE_VERSION);
    await db.saveCampaign(game, journal, kind);
    const first = await db.loadLatestCampaign(kind);
    expect(first.journal.materialize().initialSaveVersion).toBe(SAVE_VERSION);
    expect(serializeGame(first.game)).toBe(serializeGame(game));
    expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    await db.saveCampaign(game, journal, kind);
    const second = await db.loadLatestCampaign(kind);
    expect(second.journal.materialize().initialSaveVersion).toBe(SAVE_VERSION);
    expect(second.journal.materialize().records).toHaveLength(1);
    expect(serializeGame(second.game)).toBe(serializeGame(game));
    expect(serializeGame(replayArchive(second.journal.materialize()))).toBe(serializeGame(game));
  } finally { await db.delete(); }
});
