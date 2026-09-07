import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { checksum, CONTENT_HASH, FACTIONS } from '@theandril/content';
import { applyCommandForVersion, commandSchemaForVersion, createGame, deserializeGame, getObservation, getSettlementLandObservation, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from '@theandril/sim';
import { createArchive, createJournal, parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v9-archives.json';

const capturedCase = z.object({
  archive: z.unknown(), save: z.string(), hash: z.string(), saveBytes: z.number().int().positive(),
  saveSha256: z.string().regex(/^[a-f0-9]{64}$/), replaySha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
const captured = z.object({
  capturedBefore: z.literal('Expanded faction roster and distinctive faction rules'),
  saveVersion: z.literal(9), contentHash: z.literal('9418e598'), provenance: z.string(),
  sixOrigin: capturedCase, activeImprovement: capturedCase, improved: capturedCase,
  activeCultivation: capturedCase, cultivated: capturedCase, eightOrigin: capturedCase, eightFounded: capturedCase,
}).strict().parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));

// These seals were recorded before any roster/content change, by the guarded
// capture-schema9 script. They are not reconstructed from a later implementation.
const golden = {
  sixOrigin: ['1754cd12', 20915, '9c4b384c770a8c58c58e7fd88875fafaa14270d6ce2b081337efe55de225f1a6'],
  activeImprovement: ['62246794', 27809, 'cecb55a4de6c4e18c4fd8af7882e618e3b2603cca068a91f51fe381b446810f0'],
  improved: ['1e1b8012', 29516, '66366d9ec19cdfd17100642faee5dd5b813005c642c80ed1e7ebf99bd2d24fd0'],
  activeCultivation: ['5af80213', 33715, 'b0a40c3b692d042b5332dc3cb47dbedd88191c8c188b26d4888b59c7fa04eca5'],
  cultivated: ['72356a62', 35480, '5f884b0953cd438ece0465399f3126ab8a797b2793e86c1c11a488aa78fae250'],
  eightOrigin: ['58aa6b37', 23194, '4068929b80330f93c410d6076a0e739c8e768156f576a72c2cff03113b0f36eb'],
  eightFounded: ['19a1afaf', 24282, 'd95d474bfb6dd7e8ec1d18b7418f46df2126c4827a12b3eeee7cf3cc606ac65e'],
} as const;
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

describe('genuine schema-9 six-culture campaign evidence', () => {
  it.each(Object.keys(golden) as (keyof typeof golden)[])('retains exact %s bytes, original archive and historical replay', name => {
    const fixture = captured[name], [hash, bytes, sha] = golden[name];
    expect(packed.encoding).toBe('gzip-base64'); expect(packed.hashes[name]).toBe(hash);
    expect(fixture.hash).toBe(hash); expect(fixture.saveBytes).toBe(bytes);
    expect(Buffer.byteLength(fixture.save)).toBe(bytes); expect(sha256(fixture.save)).toBe(sha);
    expect(fixture.saveSha256).toBe(sha); expect(fixture.replaySha256).toBe(sha);
    const game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(game.rosterVersion).toBe(2);
    expect(stateHashForVersion(game, 9)).toBe(hash); expect(serializeGameForVersion(game, 9)).toBe(fixture.save);
    expect(archive.coverage).toBe('complete'); expect(archive).toEqual(fixture.archive);
    expect(serializeGameForVersion(replayArchive(archive), 9)).toBe(fixture.save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it('freezes selected-seat order and repeated definition IDs beyond the old six-culture roster', () => {
    const six = deserializeGame(captured.sixOrigin.save), eight = deserializeGame(captured.eightOrigin.save);
    expect(six.world.generatorVersion).toBe(4); expect(eight.world.generatorVersion).toBe(4);
    expect(six.factions.map(faction => faction.id)).toEqual([
      'faction.reedbound_council', 'faction.ashen_compact', 'faction.cinder_march',
      'faction.glass_tide', 'faction.iron_covenant', 'faction.sepulchral_synod',
    ]);
    expect(eight.factions.map(faction => [faction.id, faction.definitionId])).toEqual([
      ['faction.sepulchral_synod', 'faction.sepulchral_synod'], ['faction.ashen_compact', 'faction.ashen_compact'],
      ['faction.reedbound_council', 'faction.reedbound_council'], ['faction.cinder_march', 'faction.cinder_march'],
      ['faction.glass_tide', 'faction.glass_tide'], ['faction.iron_covenant', 'faction.iron_covenant'],
      ['faction.sepulchral_synod.7', 'faction.sepulchral_synod'], ['faction.ashen_compact.8', 'faction.ashen_compact'],
    ]);
    expect(six.turnOwnerId).toBe('faction.reedbound_council'); expect(eight.turnOwnerId).toBe('faction.sepulchral_synod');
    expect(Object.keys(six.armies)).toHaveLength(12); expect(Object.keys(eight.armies)).toHaveLength(16);
    expect(Object.keys(six.settlements)).toHaveLength(0); expect(Object.keys(eight.settlements)).toHaveLength(0);
  });

  it.each([
    ['activeImprovement', 'improved'], ['activeCultivation', 'cultivated'],
  ] as const)('continues the saved %s through the original paid command suffix to %s', (start, end) => {
    const game = deserializeGame(captured[start].save);
    const first = parseArchive(captured[start].archive, game), last = parseArchive(captured[end].archive, deserializeGame(captured[end].save));
    const prefix = structuredClone(first.records);
    expect(last.records.slice(0, first.records.length)).toEqual(prefix);
    for (const record of last.records.slice(first.records.length)) {
      const result = applyCommandForVersion(game, record.command, 9);
      expect(result.ok).toBe(true); expect(result.events).toEqual(record.events);
    }
    expect(serializeGameForVersion(game, 9)).toBe(captured[end].save);
    expect(first.records).toEqual(prefix);
  });

  it('retains actual paid work, contiguous claims and completed cultivation without changing physical geography', () => {
    const origin = deserializeGame(captured.sixOrigin.save), improvement = deserializeGame(captured.activeImprovement.save);
    const active = deserializeGame(captured.activeCultivation.save), final = deserializeGame(captured.cultivated.save);
    expect(improvement.land.settlements['settlement.13']!.work).toEqual({
      kind: 'improve', cell: 1084, coinCost: 26, turns: 2, remainingTurns: 2, startedTurn: 1,
      improvementId: 'improvement.reedworks',
    });
    expect(active.land.settlements['settlement.13']!.work).toEqual({
      kind: 'terraform', cell: 1036, coinCost: 51, turns: 3, remainingTurns: 2, startedTurn: 6, biome: 8,
    });
    expect(final.land.settlements['settlement.13']!.work).toBeNull();
    expect(final.land.settlements['settlement.13']!.claimed).toContain(1036);
    expect(final.land.settlements['settlement.13']!.worked).toEqual([1036, 1084]);
    expect(final.land.settlements['settlement.13']!.improvements).toEqual({ 1084: 'improvement.reedworks' });
    expect(final.land.biomes).toEqual({ 1036: 8 }); expect(final.land.cultivation[final.turnOwnerId]).toBe(2);
    expect(final.world).toEqual(origin.world);
    const archive = parseArchive(captured.cultivated.archive, final);
    const commands = archive.records.map(record => commandSchemaForVersion(9).parse(record.command));
    expect(commands.map(command => command.type)).toContain('claimCell');
    expect(commands.filter(command => command.type === 'terraformTile')).toHaveLength(1);
    expect(final.turn).toBe(9);
  });
});

describe('roster-versioned schema-10 archives', () => {
  it('rejects checksum-valid new content or metadata masquerading as a genuine schema-9 save', () => {
    type PriorEnvelope = { contentHash: string; stateChecksum: string; state: { factions: { definitionId: string; color: number }[]; rosterVersion?: number } };
    const readPrior = () => JSON.parse(captured.sixOrigin.save) as PriorEnvelope;
    const newer = FACTIONS.find(faction => faction.id === 'faction.mire_courts')!;
    const culture = readPrior();
    culture.state.factions[0]!.definitionId = newer.id;
    culture.state.factions[0]!.color = newer.color;
    culture.stateChecksum = checksum(JSON.stringify(culture.state));
    expect(() => deserializeGame(JSON.stringify(culture))).toThrow(/v9.*frozen/);

    const pack = readPrior();
    expect(CONTENT_HASH).not.toBe(pack.contentHash);
    pack.contentHash = CONTENT_HASH;
    expect(() => deserializeGame(JSON.stringify(pack))).toThrow(/v9 content hash/);

    const roster = readPrior();
    roster.state.rosterVersion = 3;
    roster.stateChecksum = checksum(JSON.stringify(roster.state));
    expect(() => deserializeGame(JSON.stringify(roster))).toThrow(/Unrecognized key:.*rosterVersion/);

    expect(sha256(captured.sixOrigin.save)).toBe(golden.sixOrigin[2]);
    expect(stateHashForVersion(deserializeGame(captured.sixOrigin.save), 9)).toBe(golden.sixOrigin[0]);
    expect(packed.hashes).toEqual(Object.fromEntries(Object.entries(golden).map(([name, [hash]]) => [name, hash])));
  });

  it.each(['activeImprovement', 'activeCultivation'] as const)('finishes genuine schema-9 %s with modern records and an unchanged prefix', name => {
    const game = deserializeGame(captured[name].save), journal = resumeJournal(game, captured[name].archive);
    const original = journal.prepareCommit(game, 0), initialSave = original.header.initialSave;
    const prefix = JSON.stringify(original.records), work = structuredClone(game.land.settlements['settlement.13']!.work!);
    expect(work.remainingTurns).toBeGreaterThan(0);
    const mirror = deserializeGame(serializeGame(game)), mirrored = resumeJournal(mirror, journal.materialize());
    for (let turn = 0; turn < work.remainingTurns; turn++) {
      const command = { type: 'endTurn', factionId: game.turnOwnerId } as const;
      expect(journal.record(game, command)).toEqual(mirrored.record(mirror, command));
    }
    expect(game.land.settlements['settlement.13']!.work).toBeNull();
    if (work.kind === 'improve') expect(game.land.settlements['settlement.13']!.improvements[work.cell]).toBe(work.improvementId);
    else expect(game.land.biomes[work.cell]).toBe(work.biome);
    const suffix = journal.prepareCommit(game, original.to), archive = journal.materialize();
    expect(game.rosterVersion).toBe(2);
    expect(suffix.records).toHaveLength(work.remainingTurns);
    expect(suffix.records.every(record => record.ok && record.rulesVersion === SAVE_VERSION && record.checkpointVersion === SAVE_VERSION)).toBe(true);
    expect(suffix.records.at(-1)!.checkpoint).toBe(stateHash(game));
    expect(suffix.records.flatMap(record => record.events).some(event => event.type === 'land_work_completed')).toBe(true);
    expect(archive.initialSave).toBe(initialSave); expect(archive.initialSaveVersion).toBe(9);
    expect(JSON.stringify(archive.records.slice(0, original.to))).toBe(prefix);
    expect(JSON.stringify(original.records)).toBe(prefix);
    expect(archive).toEqual(mirrored.materialize());
    expect(serializeGame(game)).toBe(serializeGame(mirror));
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
    const downgraded = structuredClone(archive);
    downgraded.records.push({ ...downgraded.records.at(-1)!, sequence: downgraded.records.length + 1,
      turn: game.turn, afterTurn: game.turn + 1, rulesVersion: 9, checkpointVersion: 9 });
    expect(() => parseArchive(downgraded, game)).toThrow(/downgrade/);
  });

  it('keeps summary and owned-land queries out of a resumed historical journal', () => {
    const game = deserializeGame(captured.activeCultivation.save), journal = resumeJournal(game, captured.activeCultivation.archive);
    const archive = journal.materialize(), save = serializeGame(game), original = journal.prepareCommit(game, 0);
    const observation = getObservation(game, game.turnOwnerId, { landDetails: 'none' });
    expect(observation.land.settlements.every(town => town.cells.length === 0)).toBe(true);
    const land = getSettlementLandObservation(game, game.turnOwnerId, 'settlement.13');
    expect(land?.work).toMatchObject({ kind: 'terraform', remainingTurns: 2, coinCost: 51 });
    expect(getSettlementLandObservation(game, game.turnOwnerId, 'settlement.14')).toBeNull();
    expect(journal.recordCount).toBe(original.to);
    expect(journal.prepareCommit(game, original.to)).toMatchObject({ from: original.to, to: original.to, records: [] });
    expect(journal.materialize()).toEqual(archive); expect(serializeGame(game)).toBe(save);
  });

  it('reconstructs a full expanded-roster origin independently of the physical generator version', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 12, generatorVersion: 4, rosterVersion: 3 });
    expect(new Set(game.factions.map(faction => faction.definitionId)).size).toBe(12);
    expect(game.rosterVersion).toBe(3); expect(game.world.generatorVersion).toBe(4);
    const archive = createArchive(game, { mode: 'player' });
    expect(archive.initialSaveVersion).toBe(SAVE_VERSION);
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
  });

  it('rejects an unrecorded roster change even when the actual seats and turn are unchanged', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 2, rosterVersion: 3 });
    const journal = createJournal(game, { mode: 'player' }), original = journal.materialize();
    game.rosterVersion = 2;
    expect(() => parseArchive(original, game)).toThrow(/different campaign/);
    expect(() => journal.prepareCommit(game, 0)).toThrow(/identity changed/);
    expect(() => journal.record(game, { type: 'endTurn', factionId: game.turnOwnerId })).toThrow(/identity changed/);
    expect(game.turn).toBe(1); expect(journal.recordCount).toBe(0);
    game.rosterVersion = 3;
    expect(journal.materialize()).toEqual(original);
  });
});
