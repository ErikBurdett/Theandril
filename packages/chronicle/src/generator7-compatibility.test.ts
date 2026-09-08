import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHashForVersion, SAVE_VERSION } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v12-generator7-history.json';

const payload = z.object({
  saveVersion: z.literal(12), generatorVersion: z.literal(7), rosterVersion: z.literal(3), contentHash: z.literal('3c54fb02'),
  factionDefinitionIds: z.array(z.string()).length(12),
  cases: z.array(z.object({
    name: z.string(), save: z.string(), archive: z.unknown(), hash: z.string(), saveSha256: z.string(), replaySha256: z.string(), saveBytes: z.number(),
    options: z.object({ seed: z.literal(74), size: z.literal('tiny'), factionCount: z.literal(4),
      layout: z.enum(['continents', 'islands', 'archipelago']), generatorVersion: z.literal(7), rosterVersion: z.literal(3), pace: z.literal('short') }).strict(),
  }).strict()).length(6),
}).strict().parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));

describe('genuine generator7 twelve-culture history before schema13/roster4', () => {
  it.each(payload.cases)('preserves $name exact source, generated origin and full command replay', fixture => {
    expect(packed.encoding).toBe('gzip-base64');
    expect(Object.entries(packed.hashes)).toContainEqual([fixture.name, fixture.hash]);
    expect(Buffer.byteLength(fixture.save)).toBe(fixture.saveBytes);
    expect(createHash('sha256').update(fixture.save).digest('hex')).toBe(fixture.saveSha256);
    expect(fixture.replaySha256).toBe(fixture.saveSha256);
    const game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(game.world.generatorVersion).toBe(7); expect(game.world.layout).toBe(fixture.options.layout);
    expect(game.rosterVersion).toBe(3);
    expect(game.factions.every(faction => payload.factionDefinitionIds.includes(faction.definitionId))).toBe(true);
    expect(stateHashForVersion(game, 12)).toBe(fixture.hash);
    expect(serializeGameForVersion(game, 12)).toBe(fixture.save);
    expect(serializeGameForVersion(replayArchive(archive), 12)).toBe(fixture.save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    const origin = createGame(fixture.options);
    expect(serializeGameForVersion(origin, 12)).toBe(archive.initialSave);
    if (fixture.name.endsWith('-developed')) {
      expect(game.turn).toBe(13);
      expect(archive.records).toHaveLength(fixture.options.layout === 'islands' ? 37 : 36);
      const types = archive.records.map(record => (record.command as { type: string }).type);
      expect(types.filter(type => type === 'found')).toHaveLength(4);
      expect(types.filter(type => type === 'endTurn')).toHaveLength(12);
      expect(types).toContain('queue'); expect(types).toContain('research');
      expect(archive.records.every(record => record.rulesVersion === 12)).toBe(true);
    } else expect(archive.records).toHaveLength(0);
  });

  it.each(payload.cases.filter(fixture => fixture.name.endsWith('-developed')))('continues $name without replacing old terrain, culture order or records', fixture => {
    const game = deserializeGame(fixture.save), mirror = deserializeGame(fixture.save);
    const journal = resumeJournal(game, fixture.archive), before = journal.materialize();
    const source = JSON.stringify(fixture.archive), geography = structuredClone(game.world);
    const factions = game.factions.map(({ id, definitionId, name, color }) => ({ id, definitionId, name, color }));
    for (let round = 0; round < 4; round++) {
      const command = { type: 'endTurn', factionId: game.turnOwnerId } as const;
      const result = journal.record(game, command);
      expect(result.ok, result.error).toBe(true);
      expect(applyCommand(mirror, command)).toEqual(result);
      expect(serializeGame(mirror)).toBe(serializeGame(game));
    }
    const after = journal.materialize();
    expect(after.records.slice(0, before.records.length)).toEqual(before.records);
    expect(after.initialSave).toBe(before.initialSave);
    expect(after.records.slice(before.records.length).every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(game.world).toEqual(geography);
    expect(game.factions.map(({ id, definitionId, name, color }) => ({ id, definitionId, name, color }))).toEqual(factions);
    expect(serializeGame(replayArchive(after))).toBe(serializeGame(game));
    expect(JSON.stringify(fixture.archive)).toBe(source);
  });
});
