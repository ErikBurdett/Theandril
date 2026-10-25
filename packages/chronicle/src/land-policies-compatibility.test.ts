import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommandForVersion, commandSchemaForVersion, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, SAVE_VERSION } from '@theandril/sim';
import { withRules } from '../../sim/src/rules';
import { parseArchive, replayArchive, resumeJournal, type CampaignArchive } from './index';

// Independently captured from unmodified 657a4a55c8d1fabe0f64fd2544c422a90995bf21.
const saveBytes = readFileSync(new URL('../../sim/src/fixtures/land-policy-v36-save.json', import.meta.url));
const archiveBytes = readFileSync(new URL('../../sim/src/fixtures/land-policy-v36-archive.json', import.meta.url));
const save = saveBytes.toString('utf8').replace(/\n$/, '');
const archive = JSON.parse(archiveBytes.toString('utf8')) as CampaignArchive;
const digest = (value: Buffer) => createHash('sha256').update(value).digest('hex');

describe('land commissions preserve genuine rules36 history', () => {
  it('retains original bytes, original seals, worker policies and all thirteen recorded outcomes', () => {
    expect(digest(saveBytes)).toBe('df98c624c9975a869b51f425aa4d48550590f67e5c32a80ec0b25108a77a687a');
    expect(digest(archiveBytes)).toBe('c96008dba7fc797310226bb812aea9803534bf7517eeec6cec8bcaedcf294b34');
    expect(archive.initialHash).toBe('852ddbd7'); expect(archive.records).toHaveLength(13);
    const game = deserializeGame(save);
    expect(game.landPolicies).toEqual([]); expect(game.workerPolicies).toHaveLength(1);
    expect(stateHashForVersion(game, 36)).toBe('e9013c5e');
    expect(serializeGameForVersion(game, 36)).toBe(save);
    expect(parseArchive(archive, game)).toEqual(archive);
    expect(serializeGameForVersion(replayArchive(archive), 36)).toBe(save);
    expect(withRules(game, 36, () => getObservation(game, game.turnOwnerId)).landPolicies).toBeUndefined();
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it('appends modern commissions and paid turns without rewriting old records', () => {
    const game = deserializeGame(save), journal = resumeJournal(game, archive), factionId = game.turnOwnerId;
    const settlementId = Object.values(game.settlements).find(town => town.factionId === factionId)!.id;
    for (const command of [
      { type: 'setLandPolicy', factionId, settlementId, improvementId: 'improvement.managed_woodlot', allowance: 100, reserve: 40 },
      { type: 'endTurn', factionId },
      { type: 'endTurn', factionId },
    ] as const) expect(journal.record(game, command).ok).toBe(true);
    const current = journal.materialize();
    expect(current.initialSave).toBe(archive.initialSave);
    expect(current.records.slice(0, archive.records.length)).toEqual(archive.records);
    expect(current.records.slice(archive.records.length).every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(serializeGame(replayArchive(parseArchive(current, game)))).toBe(serializeGame(game));
    expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    expect(() => serializeGameForVersion(game, 36)).toThrow(/land policies/);
    expect(() => stateHashForVersion(game, 36)).toThrow(/land policies/);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 36)).toThrow(/land policies/);
  });

  it('rejects future fields in resealed old snapshots and new commands under old rules', () => {
    const raw = JSON.parse(save), game = deserializeGame(save), before = serializeGame(game);
    raw.state.landPolicies = []; raw.stateChecksum = checksum(JSON.stringify(raw.state));
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/Unrecognized key/);
    const command = { type: 'setLandPolicy', factionId: game.turnOwnerId, settlementId: Object.keys(game.settlements)[0]!, improvementId: 'improvement.terraced_fields', allowance: 100, reserve: 40 } as const;
    expect(commandSchemaForVersion(36).safeParse(command).success).toBe(false);
    expect(applyCommandForVersion(game, command, 36).ok).toBe(false);
    expect(serializeGame(game)).toBe(before);
  });
});
