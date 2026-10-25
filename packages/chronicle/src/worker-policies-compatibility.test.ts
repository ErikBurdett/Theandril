import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommandForVersion, commandSchemaForVersion, deserializeGame, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, SAVE_VERSION } from '@theandril/sim';
import { withRules } from '../../sim/src/rules';
import { getObservation } from '../../sim/src';
import { parseArchive, replayArchive, resumeJournal, type CampaignArchive } from './index';

// Captured from unmodified 47174209f633a92930b8076b0b1ce7db13c3e38e before36.
const saveBytes = readFileSync(new URL('../../sim/src/fixtures/worker-policy-v35-save.json', import.meta.url));
const archiveBytes = readFileSync(new URL('../../sim/src/fixtures/worker-policy-v35-archive.json', import.meta.url));
// The capture file adds one trailing newline; the original serialized envelope does not.
const save = saveBytes.toString('utf8').replace(/\n$/, '');
const archive = JSON.parse(archiveBytes.toString('utf8')) as CampaignArchive;
const digest = (value: Buffer) => createHash('sha256').update(value).digest('hex');

describe('worker stewardship preserves genuine rules35 history', () => {
  it('retains independently captured raw bytes, historical save seals and all fourteen recorded outcomes', () => {
    expect(digest(saveBytes)).toBe('2c9e7d75913a1dfe437624b12e0687fd59f3b219db11b5573612b7af019e7315');
    expect(digest(archiveBytes)).toBe('646bb52dae5f8080dea5685277122c4d364ea059d65aa8437cd3b6098331c7ca');
    expect(archive.initialHash).toBe('cf953be6'); expect(archive.records).toHaveLength(14);
    const game = deserializeGame(save);
    expect(game.workerPolicies).toEqual([]);
    expect(stateHashForVersion(game, 35)).toBe('b3bb5875');
    expect(serializeGameForVersion(game, 35)).toBe(save);
    expect(parseArchive(archive, game)).toEqual(archive);
    expect(serializeGameForVersion(replayArchive(archive), 35)).toBe(save);
    expect(withRules(game, 35, () => getObservation(game, game.turnOwnerId)).workerPolicies).toBeUndefined();
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it('appends modern policies and turns without rewriting old records and replays exact continuation', () => {
    const game = deserializeGame(save), journal = resumeJournal(game, archive), factionId = game.turnOwnerId;
    const settlementId = Object.values(game.settlements).find(town => town.factionId === factionId)!.id;
    for (const command of [
      { type: 'setWorkerPolicy', factionId, settlementId, focus: 'food' },
      { type: 'endTurn', factionId },
      { type: 'setWorkerPolicy', factionId, settlementId, focus: 'coin' },
      { type: 'endTurn', factionId },
    ] as const) expect(journal.record(game, command).ok).toBe(true);
    const current = journal.materialize();
    expect(current.initialSave).toBe(archive.initialSave);
    expect(current.records.slice(0, archive.records.length)).toEqual(archive.records);
    expect(current.records.slice(archive.records.length).every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(serializeGame(replayArchive(parseArchive(current, game)))).toBe(serializeGame(game));
    expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    expect(() => serializeGameForVersion(game, 35)).toThrow(/worker policies/);
    expect(() => stateHashForVersion(game, 35)).toThrow(/worker policies/);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 35)).toThrow(/worker policies/);
  });

  it('rejects new fields in resealed old envelopes and new commands under historical rules', () => {
    const raw = JSON.parse(save), game = deserializeGame(save), before = serializeGame(game);
    raw.state.workerPolicies = []; raw.stateChecksum = checksum(JSON.stringify(raw.state));
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/Unrecognized key/);
    const command = { type: 'setWorkerPolicy', factionId: game.turnOwnerId, settlementId: Object.keys(game.settlements)[0]!, focus: 'balanced' } as const;
    expect(commandSchemaForVersion(35).safeParse(command).success).toBe(false);
    expect(applyCommandForVersion(game, command, 35).ok).toBe(false);
    expect(serializeGame(game)).toBe(before);
  });
});
