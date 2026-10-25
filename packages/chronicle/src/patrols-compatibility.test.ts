import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommandForVersion, commandSchemaForVersion, deserializeGame, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, SAVE_VERSION } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import { historical34, patrol34File, patrol34Manifest, patrol34ManifestBytes } from './fixtures/patrols34';

const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
describe('land patrols preserve genuine rules34 history', () => {
  it('retains independent raw/compressed seals and capture source', () => {
    expect(hash(patrol34ManifestBytes)).toBe('84fbfa822cf09223b3cb4bad28388273803b4af09e1a9c123616ae72585d3213');
    expect(patrol34Manifest).toMatchObject({ version: 34, sourceRevision: 'd06ba4bcbc7e64a0ba3aa26e2b7460d174bb4333', contentHash: '015468d1' });
    for (const entry of Object.values(patrol34Manifest.cases)) for (const file of [entry.save, entry.archive]) {
      const bytes = patrol34File(file);
      expect(Buffer.byteLength(bytes.raw)).toBe(file.bytes); expect(hash(bytes.raw)).toBe(file.sha256); expect(hash(bytes.compressed)).toBe(file.gzipSha256);
    }
  });
  it.each(Object.keys(patrol34Manifest.cases))('%s preserves frozen bytes, full replay and independent command continuations', name => {
    const { save, archive, entry } = historical34(name), game = deserializeGame(save);
    expect(game.patrols).toEqual([]);
    expect(serializeGameForVersion(game, 34)).toBe(save); expect(stateHashForVersion(game, 34)).toBe(entry.hash);
    expect(parseArchive(archive, game)).toEqual(archive);
    expect(serializeGameForVersion(replayArchive(archive), 34)).toBe(save);
    const continuation = deserializeGame(archive.initialSave);
    for (const seal of entry.seals) {
      expect(stateHashForVersion(continuation, 34)).toBe(seal.before);
      const result = applyCommandForVersion(continuation, seal.command, 34);
      expect(result.ok).toBe(true); expect(hash(JSON.stringify(result))).toBe(seal.result);
      expect(stateHashForVersion(continuation, 34)).toBe(seal.after);
    }
    expect(serializeGameForVersion(continuation, 34)).toBe(save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });
  it('keeps old records intact while new patrols progress, pause and replay', () => {
    const prior = historical34('orders-continued'), game = deserializeGame(prior.save), journal = resumeJournal(game, prior.archive);
    const army = Object.values(game.armies).find(item => !game.postings.some(posting => posting.armyId === item.id))!;
    const factionId = game.turnOwnerId;
    expect(journal.record(game, { type: 'setPatrol', factionId, armyId: army.id, firstCell: 500, secondCell: 510, enabled: true }).ok).toBe(true);
    expect(journal.record(game, { type: 'endTurn', factionId }).ok).toBe(true);
    expect(journal.record(game, { type: 'setPatrolEnabled', factionId, armyId: army.id, enabled: false }).ok).toBe(true);
    const archive = journal.materialize(), save = serializeGame(game);
    expect(archive.initialSave).toBe(prior.archive.initialSave);
    expect(archive.records.slice(0, prior.archive.records.length)).toEqual(prior.archive.records);
    expect(archive.records.slice(prior.archive.records.length).every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(save);
    expect(() => serializeGameForVersion(game, 34)).toThrow(/patrol/i);
    expect(() => stateHashForVersion(game, 34)).toThrow(/patrol/i);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 34)).toThrow(/patrol/i);
    expect(stateHash(deserializeGame(save))).toBe(stateHash(game));
  });
  it('refuses future fields in resealed old envelopes and future commands under old rules', () => {
    const prior = historical34('orders-origin'), raw = JSON.parse(prior.save), game = deserializeGame(prior.save);
    raw.state.patrols = []; raw.stateChecksum = checksum(JSON.stringify(raw.state));
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/Unrecognized key/);
    const armyId = Object.keys(game.armies)[0]!, factionId = game.turnOwnerId;
    const before = serializeGame(game);
    for (const command of [
      { type: 'setPatrol', factionId, armyId, firstCell: 500, secondCell: 510, enabled: true },
      { type: 'setPatrolEnabled', factionId, armyId, enabled: false },
      { type: 'clearPatrol', factionId, armyId },
    ]) {
      expect(commandSchemaForVersion(34).safeParse(command).success).toBe(false);
      expect(applyCommandForVersion(game, command, 34).ok).toBe(false);
      expect(serializeGame(game)).toBe(before);
    }
  });
});
