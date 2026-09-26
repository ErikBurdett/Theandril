import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal, type CampaignArchive } from './index';
import captured from './fixtures/v31-selection-groups-baseline.json';

const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as {
  version: number; contentHash: string; sourceRevision: string; cases: Record<string, { save: string; hash: string; sha256: string; archive: CampaignArchive }>;
};
describe('rules32 groups and independent prechange31 evidence', () => {
  it.each(Object.entries(fixture.cases))('%s preserves original bytes, seals, provisions and complete replay', (_name, entry) => {
    expect(fixture.version).toBe(31); expect(fixture.contentHash).toBe('015468d1');
    expect(fixture.sourceRevision).toBe('6cb7692c800464d3c5ad66b42df6cf063ffeb0ca');
    expect(createHash('sha256').update(entry.save).digest('hex')).toBe(entry.sha256);
    const game = deserializeGame(entry.save);
    expect(game.selectionGroups).toEqual([]); expect(game.nextSelectionGroupId).toBe(1);
    expect(serializeGameForVersion(game, 31)).toBe(entry.save);
    expect(stateHashForVersion(game, 31)).toBe(entry.hash);
    expect(serializeGameForVersion(replayArchive(parseArchive(entry.archive, game)), 31)).toBe(entry.save);
  });

  it('continues an old archive with saved groups without changing its historical prefix', () => {
    const entry = fixture.cases.generatedContinued!, game = deserializeGame(entry.save);
    const journal = resumeJournal(game, entry.archive), factionId = game.turnOwnerId;
    const issue = (command: Parameters<typeof journal.record>[1]) => expect(journal.record(game, command)).toMatchObject({ ok: true });
    issue({ type: 'setSelectionGroup', factionId, kind: 'armies', name: 'Old veterans', memberIds: ['army.2'] });
    issue({ type: 'setSelectionGroup', factionId, groupId: game.selectionGroups[0]!.id, kind: 'armies', name: 'Veterans renamed', memberIds: ['army.2'] });
    issue({ type: 'endTurn', factionId });
    const archive = journal.materialize(), saved = serializeGame(game);
    expect(archive.initialSave).toBe(entry.archive.initialSave);
    expect(archive.records.slice(0, entry.archive.records.length)).toEqual(entry.archive.records);
    expect(archive.records.slice(entry.archive.records.length).every(record => record.rulesVersion === 32)).toBe(true);
    expect(archive.records.at(-1)).toMatchObject({ checkpointVersion: 32, checkpoint: stateHash(game) });
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(saved);
    expect(serializeGame(deserializeGame(saved))).toBe(saved);
  });

  it.each([23, 25, 26, 27, 31] as const)('gives independent rules%i migrations fresh group registers', version => {
    const initial = createGame({ seed: 42, size: 'tiny', factionCount: 1, generatorVersion: 4 });
    const old = serializeGameForVersion(initial, version);
    const first = deserializeGame(old), second = deserializeGame(old), before = stateHash(second);
    expect(applyCommand(first, { type: 'setSelectionGroup', factionId: first.turnOwnerId, kind: 'armies', name: 'Isolated', memberIds: ['army.2'] })).toMatchObject({ ok: true });
    expect(second.selectionGroups).toEqual([]); expect(second.nextSelectionGroupId).toBe(1);
    expect(stateHash(second)).toBe(before);
    expect(deserializeGame(old).selectionGroups).toEqual([]);
  });

  it('rejects metadata in a resealed rules31 envelope and verifies its original checksum before migration', () => {
    const entry = fixture.cases.generatedContinued!;
    const altered = JSON.parse(entry.save); altered.state.turn++;
    expect(() => deserializeGame(JSON.stringify(altered))).toThrow(/checksum/);
    const forged = JSON.parse(entry.save); forged.state.selectionGroups = []; forged.state.nextSelectionGroupId = 1;
    forged.stateChecksum = checksum(JSON.stringify(forged.state));
    expect(() => deserializeGame(JSON.stringify(forged))).toThrow(/Unrecognized keys/);
  });
});
