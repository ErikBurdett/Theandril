import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, applyCommandForVersion, commandSchemaForVersion, createGame, deserializeGame,
  serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, SAVE_VERSION, type GameCommand } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import { defenseTheaters32, defenseTheaters32ManifestBytes, historical32, historical32File } from './fixtures/defense-theaters32';

const sha256 = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
describe('rules33 theaters preserve independently captured rules32 history', () => {
  it('keeps the genuine prechange manifest and every exact compressed/raw byte seal', () => {
    expect(sha256(defenseTheaters32ManifestBytes)).toBe('ca1934baae080209ba8e538a006ac3c4ce7b93ba15eae09a89b779a0e12b8ef6');
    expect(defenseTheaters32).toMatchObject({ version: 32, contentHash: '015468d1', sourceRevision: 'c5aa2615798bbc09efc9ca011dbb77f3d198980e' });
    for (const checkpoint of Object.values(defenseTheaters32.cases)) for (const entry of [checkpoint.save, checkpoint.archive]) {
      const bytes = historical32File(entry);
      expect(bytes.raw.length).toBe(entry.bytes); expect(sha256(bytes.raw)).toBe(entry.sha256);
      expect(bytes.compressed.length).toBe(entry.gzipBytes); expect(sha256(bytes.compressed)).toBe(entry.gzipSha256);
    }
  });

  it.each(Object.keys(defenseTheaters32.cases))('%s preserves frozen serialization, hash and original archive replay', name => {
    const { entry, save, archive } = historical32(name), game = deserializeGame(save);
    expect(game.theaters).toEqual([]); expect(game.nextTheaterId).toBe(1);
    expect(game.factions).toHaveLength(entry.factions);
    expect(serializeGameForVersion(game, 32)).toBe(save);
    expect(stateHashForVersion(game, 32)).toBe(entry.hash);
    const parsed = parseArchive(archive, game);
    expect(parsed).toEqual(archive);
    expect(serializeGameForVersion(replayArchive(parsed), 32)).toBe(save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it.each([
    ['generated-delegated', 'generated-continued'],
    ['travel-ordered', 'travel-continued'],
    ['sixty-four-origin', 'sixty-four-continued'],
  ])('continues %s under explicit frozen32 commands to its independent %s seal', (from, to) => {
    const initial = historical32(from), final = historical32(to), game = deserializeGame(initial.save);
    expect(final.archive.records.slice(0, initial.archive.records.length)).toEqual(initial.archive.records);
    for (const record of final.archive.records.slice(initial.archive.records.length)) {
      const result = applyCommandForVersion(game, record.command, 32);
      expect(result.ok).toBe(record.ok); expect(result.error ?? null).toBe(record.error); expect(result.events).toEqual(record.events);
      if (record.checkpoint) expect(stateHashForVersion(game, 32)).toBe(record.checkpoint);
    }
    expect(serializeGameForVersion(game, 32)).toBe(final.save);
    expect(stateHashForVersion(game, 32)).toBe(final.entry.hash);
  });

  it('resumes rules32 groups/postings with current theaters while keeping every original archive record', () => {
    const original = historical32('generated-delegated'), game = deserializeGame(original.save), journal = resumeJournal(game, original.archive);
    const factionId = game.turnOwnerId, army = game.armies['army.2']!, town = Object.values(game.settlements)[0]!;
    const oldGroups = structuredClone(game.selectionGroups), oldPosting = structuredClone(game.postings), nextId = game.nextId;
    const issue = (command: GameCommand) => expect(journal.record(game, command)).toMatchObject({ ok: true });
    issue({ type: 'setTheater', factionId, name: 'Remembered defense', settlementIds: [town.id], armyIds: [army.id], reserveCell: army.cell, guardsPerSettlement: 2, enabled: true });
    expect(game.nextId).toBe(nextId); expect(game.nextTheaterId).toBe(2);
    issue({ type: 'endTurn', factionId });
    expect(game.theaters[0]).toMatchObject({ name: 'Remembered defense', lastRunTurn: game.turn, lastDispatches: [] });
    expect(game.selectionGroups).toEqual(oldGroups); expect(game.postings).toEqual(oldPosting);
    const archive = journal.materialize(), save = serializeGame(game);
    expect(archive.initialSave).toBe(original.archive.initialSave);
    expect(archive.records.slice(0, original.archive.records.length)).toEqual(original.archive.records);
    expect(archive.records.slice(original.archive.records.length).map(record => record.rulesVersion)).toEqual([SAVE_VERSION, SAVE_VERSION]);
    expect(archive.records.at(-1)).toMatchObject({ checkpointVersion: SAVE_VERSION, checkpoint: stateHash(game) });
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(save);
    expect(serializeGame(deserializeGame(save))).toBe(save);
  });

  it('rejects resealed future fields in frozen32 before migration and verifies the original checksum', () => {
    const { save } = historical32('generated-delegated');
    const invalidChecksum = JSON.parse(save); invalidChecksum.state.turn++;
    expect(() => deserializeGame(JSON.stringify(invalidChecksum))).toThrow(/checksum/);
    for (const field of ['theaters', 'nextTheaterId']) {
      const future = JSON.parse(save); future.state[field] = field === 'theaters' ? [] : 1;
      future.stateChecksum = checksum(JSON.stringify(future.state));
      expect(() => deserializeGame(JSON.stringify(future))).toThrow(/Unrecognized key/);
    }
  });

  it('will not execute or serialize older rules after creating and deleting a theater', () => {
    const game = deserializeGame(historical32('generated-delegated').save), factionId = game.turnOwnerId;
    const command: GameCommand = { type: 'setTheater', factionId, name: 'Later policy', settlementIds: Object.keys(game.settlements), armyIds: ['army.2'], reserveCell: game.armies['army.2']!.cell, guardsPerSettlement: 1, enabled: false };
    expect(commandSchemaForVersion(32).safeParse(command).success).toBe(false);
    expect(applyCommandForVersion(game, command, 32).ok).toBe(false);
    expect(applyCommand(game, command).ok).toBe(true);
    for (const version of [31, 32] as const) {
      expect(() => serializeGameForVersion(game, version)).toThrow(/theater/);
      expect(() => stateHashForVersion(game, version)).toThrow(/theater/);
      expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, version)).toThrow(/theater/);
    }
    expect(applyCommand(game, { type: 'deleteTheater', factionId, theaterId: game.theaters[0]!.id }).ok).toBe(true);
    expect(game.theaters).toEqual([]); expect(game.nextTheaterId).toBe(2);
    expect(() => serializeGameForVersion(game, 32)).toThrow(/identifier history/);
    expect(() => stateHashForVersion(game, 32)).toThrow(/identifier history/);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 32)).toThrow(/identifier history/);
  });

  it.each([23, 25, 26, 27, 31, 32] as const)('gives independent rules%i migrations fresh theater registers', version => {
    const old = serializeGameForVersion(createGame({ seed: 42, size: 'tiny', factionCount: 1, generatorVersion: 4 }), version);
    const first = deserializeGame(old), second = deserializeGame(old), before = stateHash(second);
    first.nextTheaterId = 5;
    expect(second.nextTheaterId).toBe(1); expect(second.theaters).toEqual([]);
    expect(first.theaters).not.toBe(second.theaters); expect(stateHash(second)).toBe(before);
    expect(deserializeGame(old).nextTheaterId).toBe(1);
  });
});
