import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { deserializeGame, serializeGameForVersion, stateHashForVersion, serializeGame } from '@theandril/sim';
import { replayArchive, parseArchive, resumeJournal, type CampaignArchive } from './index';
import captured from './fixtures/v15-development-baseline.json';
const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { version: number; contentHash: string; cases: Record<string, { save: string; hash: string; sha256: string; archive: CampaignArchive }> };
test.each(Object.entries(fixture.cases))('genuine15 %s retains exact historical bytes and replay', (_name, entry) => {
  expect(fixture.contentHash).toBe('eec4003a');
  expect(createHash('sha256').update(entry.save).digest('hex')).toBe(entry.sha256);
  const game = deserializeGame(entry.save);
  expect(game.resources.version).toBe(0);
  expect(serializeGameForVersion(game, 15)).toBe(entry.save);
  expect(stateHashForVersion(game, 15)).toBe(entry.hash);
  expect(serializeGameForVersion(replayArchive(parseArchive(entry.archive, game)), 15)).toBe(entry.save);
});
test('a captured capped hearth continues under16 while keeping15 history intact', () => {
  const entry = fixture.cases.populationLimitContinued!, game = deserializeGame(entry.save), archive = parseArchive(entry.archive, game);
  const town = Object.values(game.settlements)[0]!;
  expect(town.population).toBe(20);
  const journal = resumeJournal(game, archive);
  expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
  expect(town.population).toBe(21);
  const continued = journal.materialize();
  expect(continued.records.slice(0, archive.records.length)).toEqual(archive.records);
  expect(continued.records.at(-1)?.rulesVersion).toBe(16);
  expect(serializeGame(replayArchive(continued))).toBe(serializeGame(game));
});
