import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHashForVersion } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v12-generator5-history.json';

const payload = z.object({
  saveVersion: z.literal(12), generatorVersion: z.literal(5), contentHash: z.literal('3c54fb02'),
  cases: z.array(z.object({ name: z.string(), save: z.string(), archive: z.unknown(), hash: z.string(), saveSha256: z.string(), saveBytes: z.number() })),
}).parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));

describe('genuine generator5 history survives newer geography', () => {
  it.each(payload.cases)('preserves $name exact source, generated origin and all replay seals', fixture => {
    expect(Object.entries(packed.hashes)).toContainEqual([fixture.name, fixture.hash]);
    expect(Buffer.byteLength(fixture.save)).toBe(fixture.saveBytes);
    expect(createHash('sha256').update(fixture.save).digest('hex')).toBe(fixture.saveSha256);
    const game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(game.world.generatorVersion).toBe(5);
    expect(stateHashForVersion(game, 12)).toBe(fixture.hash);
    expect(serializeGameForVersion(game, 12)).toBe(fixture.save);
    expect(serializeGameForVersion(replayArchive(archive), 12)).toBe(fixture.save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    if (game.world.layout === 'legacy') throw new Error('A genuine generator5 origin must retain its modern layout.');
    const origin = createGame({ seed: 74, size: 'tiny', factionCount: 4, generatorVersion: 5, rosterVersion: 3, layout: game.world.layout, pace: 'epic', rulesVersion: 12 });
    expect(serializeGameForVersion(origin, 12)).toBe(archive.initialSave);
  });

  it.each(payload.cases.filter(fixture => fixture.name.endsWith('-developed')))('continues $name without rewriting the saved world or prior ledger', fixture => {
    const game = deserializeGame(fixture.save), journal = resumeJournal(game, fixture.archive), before = journal.materialize();
    const geography = { terrain: [...game.world.terrain], biome: [...game.world.biome], hydrology: [...game.world.hydrology], starts: [...game.world.starts] };
    for (let i = 0; i < 4; i++) expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    const after = journal.materialize();
    expect(after.records.slice(0, before.records.length)).toEqual(before.records);
    expect(after.initialSave).toBe(before.initialSave);
    expect({ terrain: [...game.world.terrain], biome: [...game.world.biome], hydrology: [...game.world.hydrology], starts: [...game.world.starts] }).toEqual(geography);
    expect(serializeGame(replayArchive(after))).toBe(serializeGame(game));
  });
});
