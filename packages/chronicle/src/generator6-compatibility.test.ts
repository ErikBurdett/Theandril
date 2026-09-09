import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHashForVersion, SAVE_VERSION } from '@theandril/sim';
import { createArchive, createJournal, parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v12-generator6-history.json';

const payload = z.object({
  saveVersion: z.literal(12), generatorVersion: z.literal(6), contentHash: z.literal('3c54fb02'),
  cases: z.array(z.object({ name: z.string(), save: z.string(), archive: z.unknown(), hash: z.string(), saveSha256: z.string(), saveBytes: z.number() }).strict()).length(6),
}).strict().parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));

describe('genuine generator6 history survives newer inland-sea geography', () => {
  it.each(payload.cases)('preserves $name exact source, generated origin and full replay', fixture => {
    expect(Object.entries(packed.hashes)).toContainEqual([fixture.name, fixture.hash]);
    expect(Buffer.byteLength(fixture.save)).toBe(fixture.saveBytes);
    expect(createHash('sha256').update(fixture.save).digest('hex')).toBe(fixture.saveSha256);
    const game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(game.world.generatorVersion).toBe(6); expect(game.rosterVersion).toBe(3);
    expect(stateHashForVersion(game, 12)).toBe(fixture.hash);
    expect(serializeGameForVersion(game, 12)).toBe(fixture.save);
    expect(serializeGameForVersion(replayArchive(archive), 12)).toBe(fixture.save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    if (game.world.layout === 'legacy') throw new Error('A genuine generator6 origin must retain its modern layout.');
    const origin = createGame({ seed: 74, size: 'tiny', factionCount: 4, generatorVersion: 6, rosterVersion: 3, layout: game.world.layout, pace: 'epic', rulesVersion: 12 });
    expect(serializeGameForVersion(origin, 12)).toBe(archive.initialSave);
  });

  it.each(payload.cases.filter(fixture => fixture.name.endsWith('-developed')))('continues $name without rewriting geography or the prior ledger', fixture => {
    const game = deserializeGame(fixture.save), mirror = deserializeGame(fixture.save);
    const journal = resumeJournal(game, fixture.archive), before = journal.materialize();
    const geography = structuredClone(game.world), source = JSON.stringify(fixture.archive);
    for (let round = 0; round < 4; round++) {
      const command = { type: 'endTurn', factionId: game.turnOwnerId } as const;
      const result = journal.record(game, command);
      expect(result.ok, result.error).toBe(true); expect(applyCommand(mirror, command)).toEqual(result);
      expect(serializeGame(mirror)).toBe(serializeGame(game));
    }
    const after = journal.materialize();
    expect(after.records.slice(0, before.records.length)).toEqual(before.records);
    expect(after.initialSave).toBe(before.initialSave);
    expect(after.records.slice(before.records.length).every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(game.world).toEqual(geography);
    expect(serializeGame(replayArchive(after))).toBe(serializeGame(game));
    expect(JSON.stringify(fixture.archive)).toBe(source);
  });
});

describe('generator7 acceptance keeps generator identity explicit in the current envelope', () => {
  it.each(['continents', 'islands', 'archipelago'] as const)('restores and replays an actual %s campaign without regenerating its saved world', layout => {
    const options = { seed: 74, size: 'tiny', factionCount: 4, generatorVersion: 7, rosterVersion: 3, layout, pace: 'short' } as const;
    const game = createGame(options), journal = createJournal(game, { mode: 'watch', coverage: 'complete' });
    const origin = serializeGame(game), world = structuredClone(game.world);
    expect(game.world.generatorVersion).toBe(7);
    expect(serializeGame(createGame(options))).toBe(origin);
    expect(journal.record(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Inland witness' }).ok).toBe(true);
    for (let round = 0; round < 3; round++) expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    const save = serializeGame(game), restored = deserializeGame(save), archive = journal.materialize();
    expect(JSON.parse(save).version).toBe(SAVE_VERSION);
    expect(serializeGame(restored)).toBe(save); expect(restored.world).toEqual(world);
    expect(serializeGame(replayArchive(parseArchive(archive, restored)))).toBe(save);
    expect(archive.initialSave).toBe(origin);
    const other = createGame({ ...options, generatorVersion: 6 });
    expect(() => parseArchive(createArchive(other, { mode: 'watch', coverage: 'complete' }), createGame(options))).toThrow(/different campaign/);
  });

  it('rejects checksum-valid unsupported generator identities without accepting an open-ended version range', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 4, generatorVersion: 7, rosterVersion: 3, rulesVersion: 12 });
    const save = serializeGame(game);
    for (const version of [0, 8, 1.5, '7', null]) {
      const changed = JSON.parse(save) as { state: { world: { generatorVersion: unknown } }; stateChecksum: string };
      changed.state.world.generatorVersion = version;
      changed.stateChecksum = checksum(JSON.stringify(changed.state));
      expect(() => deserializeGame(JSON.stringify(changed))).toThrow();
    }
    expect(serializeGame(game)).toBe(save);
    expect(() => serializeGameForVersion(game, 11)).toThrow(/geography or roads/);
  });
});
