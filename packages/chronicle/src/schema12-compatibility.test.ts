import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { applyCommandForVersion, createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHashForVersion } from '@theandril/sim';
import { createArchive, parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v11-geography-history.json';

const entry = z.object({ save: z.string(), archive: z.unknown(), hash: z.string(), saveBytes: z.number(), saveSha256: z.string(), replaySha256: z.string() });
const data: Record<string, unknown> = z.record(z.string(), z.unknown()).parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));
const cases = Object.entries(packed.hashes).map(([name, hash]) => ({ name, hash, fixture: entry.parse(data[name]) }));
describe('genuine schema11 geography and road migration', () => {
  it.each(['continents', 'islands', 'archipelago'] as const)('preserves the %s origin and rejects cross-layout history', layout => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 4, layout });
    const archive = createArchive(game, { mode: 'watch', coverage: 'complete' });
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
    const other = createGame({ seed: 74, size: 'tiny', factionCount: 4, layout: layout === 'islands' ? 'continents' : 'islands' });
    expect(() => parseArchive(archive, other)).toThrow(/different campaign/);
  });
  it.each(cases)('preserves $name source bytes, all original commands and seals', ({ fixture, hash }) => {
    expect(data.saveVersion).toBe(11); expect(data.contentHash).toBe('3c54fb02');
    expect(fixture.hash).toBe(hash);
    expect(Buffer.byteLength(fixture.save)).toBe(fixture.saveBytes);
    expect(createHash('sha256').update(fixture.save).digest('hex')).toBe(fixture.saveSha256);
    expect(fixture.replaySha256).toBe(fixture.saveSha256);
    const game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(game.world.layout).toBe('legacy'); expect(game.world.hydrology.every(value => value === 0)).toBe(true);
    expect(game.roads.edges).toEqual({}); expect(game.roads.projects).toEqual({});
    expect(serializeGameForVersion(game, 11)).toBe(fixture.save); expect(stateHashForVersion(game, 11)).toBe(hash);
    expect(serializeGameForVersion(replayArchive(archive), 11)).toBe(fixture.save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });
  it('appends modern continuation without rewriting the old prefix', () => {
    const fixture = entry.parse(data.activeCultivation), game = deserializeGame(fixture.save), journal = resumeJournal(game, fixture.archive), before = journal.materialize();
    for (let i = 0; i < 4; i++) expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
    const archive = journal.materialize();
    expect(archive.records.slice(0, before.records.length)).toEqual(before.records);
    expect(archive.initialSave).toBe(before.initialSave);
    expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  });
  it('does not allow roads or modern worlds to masquerade as an old archive', () => {
    const old = deserializeGame(entry.parse(data.twelveOrigin).save), before = serializeGame(old);
    expect(applyCommandForVersion(old, { type: 'accelerateRoad', factionId: old.turnOwnerId, settlementId: 'settlement.1' }, 11).ok).toBe(false);
    expect(serializeGame(old)).toBe(before);
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 4, layout: 'islands', rosterVersion: 3 });
    expect(() => serializeGameForVersion(game, 11)).toThrow(/geography or roads/);
  });
});
