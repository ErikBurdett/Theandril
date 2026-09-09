import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, applyCommandForVersion, createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHashForVersion, SAVE_VERSION } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v12-faction-history.json';
import packedV10 from './fixtures/v10-archives.json';
import packedV11 from './fixtures/v11-geography-history.json';

const entry = z.object({ save: z.string(), archive: z.unknown(), hash: z.string(), saveBytes: z.number(), saveSha256: z.string(), replaySha256: z.string() }).strict();
const data = z.object({
  saveVersion: z.literal(12), contentHash: z.literal('3c54fb02'),
  options: z.object({ seed: z.literal(20260905), size: z.literal('tiny'), factionCount: z.literal(14), factionDefinitionId: z.literal('faction.reedbound_council'), pace: z.literal('short'), generatorVersion: z.literal(6), rosterVersion: z.literal(3), layout: z.literal('continents') }).strict(),
  evidence: z.object({ settlementId: z.string(), workedCell: z.number(), improvementId: z.string(), characterId: z.string(), characterName: z.string(), scoutId: z.string() }).strict(),
  origin: entry, activeWork: entry, partialWork: entry, developed: entry,
}).parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));
const names = ['origin', 'activeWork', 'partialWork', 'developed'] as const;

// Captured by schema12 before the next roster change. These pass on the source
// engine too; only appended records use SAVE_VERSION, never the historical seals.
describe('genuine twelve-culture roster history before the next cohort', () => {
  it.each([10, 11, 12] as const)('rejects checksum-valid roster4 and new-culture forgeries in frozen schema%i', version => {
    const source = version === 12 ? data.origin.save : z.object({ twelveOrigin: z.object({ save: z.string() }) }).parse(JSON.parse(gunzipSync(Buffer.from((version === 10 ? packedV10 : packedV11).payload, 'base64')).toString('utf8'))).twelveOrigin.save;
    for (const forge of ['roster', 'culture', 'both'] as const) {
      // Preserve source property order: a shape parser before resealing would
      // manufacture a checksum mismatch unrelated to the forgery being tested.
      const raw = JSON.parse(source) as { stateChecksum: string; state: { rosterVersion: number; factions: { definitionId: string }[] } };
      if (forge !== 'culture') raw.state.rosterVersion = 4;
      if (forge !== 'roster') raw.state.factions[0]!.definitionId = 'faction.vesper_court';
      raw.stateChecksum = checksum(JSON.stringify(raw.state));
      expect(() => deserializeGame(JSON.stringify(raw))).toThrow(forge === 'culture' ? /frozen/ : /Invalid input/);
    }
    expect(serializeGameForVersion(deserializeGame(source), version)).toBe(source);
  });

  it('does not project or execute roster4 with old rules, even when its currently selected seats use old cultures', () => {
    for (const factionDefinitionId of ['faction.ashen_compact', 'faction.vesper_court']) {
      const game = createGame({ seed: 74, size: 'tiny', factionCount: 1, factionDefinitionId, rulesVersion: 15 }), before = serializeGame(game);
      for (const version of [10, 11, 12] as const) {
        expect(() => serializeGameForVersion(game, version)).toThrow('frozen pre-expansion pack');
        expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId: game.turnOwnerId }, version)).toThrow('frozen roster');
        expect(serializeGame(game)).toBe(before);
      }
    }
  });
  it.each(names)('preserves %s raw bytes and every original command/result/checkpoint', name => {
    const fixture = data[name], game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(fixture.hash).toBe(packed.hashes[name]);
    expect(Buffer.byteLength(fixture.save)).toBe(fixture.saveBytes);
    expect(createHash('sha256').update(fixture.save).digest('hex')).toBe(fixture.saveSha256);
    expect(fixture.replaySha256).toBe(fixture.saveSha256);
    expect(game.rosterVersion).toBe(3); expect(game.world.generatorVersion).toBe(6);
    expect(stateHashForVersion(game, 12)).toBe(fixture.hash);
    expect(serializeGameForVersion(game, 12)).toBe(fixture.save);
    expect(serializeGameForVersion(replayArchive(archive), 12)).toBe(fixture.save);
    expect(archive.initialSaveVersion).toBe(12);
    expect(archive.records.every(record => record.rulesVersion === 12 && record.ok)).toBe(true);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it('regenerates the selected first culture and the old twelve-culture repeat at seats thirteen/fourteen', () => {
    const origin = createGame({ ...data.options, rulesVersion: 12 }), fixture = deserializeGame(data.origin.save);
    expect(serializeGameForVersion(origin, 12)).toBe(data.origin.save);
    expect(origin.factions.map(faction => faction.id)).toEqual(fixture.factions.map(faction => faction.id));
    expect(origin.factions[0]!.definitionId).toBe('faction.reedbound_council');
    expect(origin.factions[12]!.id).toBe('faction.reedbound_council.13');
    expect(origin.factions[13]!.id).toBe('faction.ashen_compact.14');
    expect(new Set(origin.factions.map(faction => faction.definitionId)).size).toBe(12);
    expect(origin.world.starts).toEqual(fixture.world.starts);
  });

  it('retains real paid work, named appointment, earned survey experience and acquired research', () => {
    const active = deserializeGame(data.activeWork.save), partial = deserializeGame(data.partialWork.save), final = deserializeGame(data.developed.save);
    const { settlementId, workedCell, improvementId, characterId, characterName, scoutId } = data.evidence;
    expect(active.land.settlements[settlementId]!.worked).toContain(workedCell);
    expect(active.land.settlements[settlementId]!.work).toMatchObject({ kind: 'improve', improvementId });
    expect(active.characters[characterId]).toMatchObject({ name: characterName, experience: 0, location: { kind: 'army', armyId: scoutId }, mission: { definitionId: 'mission.survey', remainingTurns: 2 } });
    expect(partial.characters[characterId]!.mission?.remainingTurns).toBe(1);
    expect(final.turn).toBe(13); expect(final.settlements[settlementId]!.buildings).toContain('building.archive');
    expect(final.land.settlements[settlementId]!.improvements[workedCell]).toBe(improvementId);
    expect(final.characters[characterId]).toMatchObject({ name: characterName, experience: 4, mission: null });
    expect(final.progression[final.turnOwnerId]!.technologies.length).toBeGreaterThan(0);
    const archive = parseArchive(data.developed.archive, final);
    const types = archive.records.map(record => z.object({ type: z.string() }).parse(record.command).type);
    for (const type of ['found', 'setWorkedTiles', 'improveTile', 'queue', 'recruitCharacter', 'assignCharacter', 'startCharacterMission', 'research']) expect(types).toContain(type);
    expect(types.filter(type => type === 'endTurn')).toHaveLength(12);
  });

  it('appends current continuation to active old work without rewriting its historical prefix', () => {
    const game = deserializeGame(data.activeWork.save), mirror = deserializeGame(data.activeWork.save);
    const journal = resumeJournal(game, data.activeWork.archive), before = journal.materialize(), source = JSON.stringify(data.activeWork.archive);
    for (let round = 0; round < 4; round++) {
      const command = { type: 'endTurn', factionId: game.turnOwnerId } as const;
      const result = journal.record(game, command);
      expect(result.ok, result.error).toBe(true); expect(applyCommand(mirror, command)).toEqual(result);
      expect(serializeGame(mirror)).toBe(serializeGame(game));
    }
    const after = journal.materialize();
    expect(after.initialSave).toBe(before.initialSave);
    expect(after.records.slice(0, before.records.length)).toEqual(before.records);
    expect(after.records.slice(before.records.length).every(record => record.rulesVersion === SAVE_VERSION && record.checkpointVersion === SAVE_VERSION)).toBe(true);
    // This is a live campaign: turn checkpoints are sealed, not a victory seal.
    expect(after.finalHash).toBeNull(); expect(after.finalHashVersion).toBeNull();
    expect(serializeGame(replayArchive(after))).toBe(serializeGame(game));
    expect(JSON.stringify(data.activeWork.archive)).toBe(source);
  });
});
