import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { deserializeGame, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, SAVE_VERSION, type Army, type RulesVersion } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal, type CampaignArchive } from './index';
import captured from './fixtures/v30-fleet-provisions-baseline.json';

const fixture = JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as {
  version: number; contentHash: string; cases: Record<string, { save: string; hash: string; sha256: string; archive: CampaignArchive }>;
};
const historical = () => deserializeGame(fixture.cases.navalAtSeaTwelveTurns!.save);
type Envelope = { version: number; stateChecksum: string; state: { armies: Army[] } };
function reseal(envelope: Envelope): string {
  envelope.stateChecksum = checksum(JSON.stringify(envelope.state));
  return JSON.stringify(envelope);
}

describe('rules31 fleet provisions and frozen rules30 evidence', () => {
  it.each(Object.entries(fixture.cases))('%s retains independent original bytes, hashes and command replay', (_name, entry) => {
    expect(fixture.version).toBe(30); expect(fixture.contentHash).toBe('015468d1');
    expect(createHash('sha256').update(entry.save).digest('hex')).toBe(entry.sha256);
    const game = deserializeGame(entry.save);
    expect(Object.values(game.armies).every(army => army.provisions === undefined)).toBe(true);
    expect(serializeGameForVersion(game, 30)).toBe(entry.save);
    expect(stateHashForVersion(game, 30)).toBe(entry.hash);
    expect(serializeGameForVersion(replayArchive(parseArchive(entry.archive, game)), 30)).toBe(entry.save);
  });

  it('continues a genuine old voyage with finite stores without rewriting any old record', () => {
    const entry = fixture.cases.navalAtSeaTwelveTurns!, game = historical();
    const original = structuredClone(entry.archive), journal = resumeJournal(game, parseArchive(original, game));
    const modernBefore = serializeGame(game);
    expect(JSON.parse(modernBefore).version).toBe(31);
    expect(game.armies['army.2']!.provisions).toBeUndefined();
    expect(journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId })).toMatchObject({ ok: true });
    expect(game.armies['army.2']!.provisions).toBe(7);
    const saved = serializeGame(game), continued = journal.materialize();
    expect(continued.initialSave).toBe(original.initialSave);
    expect(continued.records.slice(0, original.records.length)).toEqual(original.records);
    expect(continued.records.at(-1)).toMatchObject({ rulesVersion: SAVE_VERSION, checkpointVersion: SAVE_VERSION });
    expect(serializeGame(deserializeGame(saved))).toBe(saved);
    expect(serializeGame(replayArchive(parseArchive(continued, game)))).toBe(saved);
  });

  it.each([0, 1, 7, 8])('preserves exactly %i provisions through roundtrip and in the canonical hash', provisions => {
    const game = historical(), before = stateHash(game);
    game.armies['army.2']!.provisions = provisions;
    const save = serializeGame(game), loaded = deserializeGame(save);
    expect(loaded.armies['army.2']!.provisions).toBe(provisions);
    expect(serializeGame(loaded)).toBe(save);
    expect(stateHash(loaded)).toBe(stateHash(game));
    expect(stateHash(game)).not.toBe(before);
  });

  it.each([-1, 9, 1.5, null, '4'])('rejects resealed malformed provisions %j', provisions => {
    const raw = JSON.parse(serializeGame(historical())) as Envelope;
    Object.assign(raw.state.armies.find(army => army.id === 'army.2')!, { provisions });
    expect(() => deserializeGame(reseal(raw))).toThrow();
  });

  it('rejects stores on a land army even while embarked, and detects an unsealed stores edit', () => {
    const game = historical();
    expect(game.transports['army.9']).toBe('army.2');
    game.armies['army.9']!.provisions = 8;
    expect(() => serializeGame(game)).toThrow(/Only a fleet/);
    expect(() => stateHash(game)).toThrow(/Only a fleet/);
    const raw = JSON.parse(serializeGame(historical())) as Envelope;
    raw.state.armies.find(army => army.id === 'army.9')!.provisions = 8;
    expect(() => deserializeGame(reseal(raw))).toThrow(/Only a fleet/);
    const tampered = JSON.parse(serializeGame(historical())) as Envelope;
    tampered.state.armies.find(army => army.id === 'army.2')!.provisions = 7;
    expect(() => deserializeGame(JSON.stringify(tampered))).toThrow(/checksum/);
  });

  it.each([28, 29, 30] as const)('refuses even correctly resealed provisions in rules%i envelopes', version => {
    const raw = JSON.parse(serializeGameForVersion(historical(), version)) as Envelope;
    raw.state.armies.find(army => army.id === 'army.2')!.provisions = 8;
    expect(() => deserializeGame(reseal(raw))).toThrow();
  });

  it('refuses to omit populated stores from every historical serialization and hash projection', () => {
    const game = historical(); game.armies['army.2']!.provisions = 0;
    for (let version = 4; version <= 30; version++) {
      expect(() => serializeGameForVersion(game, version as RulesVersion)).toThrow(/fleet provisions/);
      expect(() => stateHashForVersion(game, version as RulesVersion)).toThrow(/fleet provisions/);
    }
  });
});
