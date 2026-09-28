import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, applyCommandForVersion, commandSchemaForVersion, deserializeGame, serializeGame, serializeGameForVersion,
  stateHash, stateHashForVersion, SAVE_VERSION, type GameCommand } from '@theandril/sim';
import { parseArchive, replayArchive, resumeJournal } from './index';
import { historical33, historical33File, logistics33, logistics33ManifestBytes } from './fixtures/reinforcement-logistics33';

const sha256 = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
describe('reinforcement/logistics preserve independently captured rules33 history', () => {
  it('retains the original prechange manifest and every raw/compressed save and archive seal', () => {
    expect(sha256(logistics33ManifestBytes)).toBe('b5cc8c79df4bc59e453d7139901f5e895097524c510d9e30420ded18bd15c5bb');
    expect(logistics33).toMatchObject({ version: 33, contentHash: '015468d1', sourceRevision: '8e371b3290aaabd9421ce679b76cc8a5ce28d770', acceptedCommands: 27 });
    for (const checkpoint of Object.values(logistics33.cases)) for (const file of [checkpoint.save, checkpoint.archive]) {
      const bytes = historical33File(file);
      expect(bytes.raw.length).toBe(file.bytes); expect(sha256(bytes.raw)).toBe(file.sha256);
      expect(bytes.compressed.length).toBe(file.gzipBytes); expect(sha256(bytes.compressed)).toBe(file.gzipSha256);
    }
  });

  it.each(Object.keys(logistics33.cases))('%s retains its frozen save/hash, original records and full replay', name => {
    const { entry, save, archive } = historical33(name), game = deserializeGame(save);
    expect(game.supplyAccess).toEqual({ offers: [], agreements: [], nextId: 1 });
    expect(game.theaters.every(theater => theater.reinforcementLimit === 0 && theater.reinforcementHolds?.length === 0)).toBe(true);
    expect(game.factions).toHaveLength(entry.factions);
    expect(serializeGameForVersion(game, 33)).toBe(save); expect(stateHashForVersion(game, 33)).toBe(entry.hash);
    const parsed = parseArchive(archive, game); expect(parsed).toEqual(archive);
    expect(serializeGameForVersion(replayArchive(parsed), 33)).toBe(save);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });

  it.each(logistics33.continuationPairs)('continues %s to independent %s command/event/full-state seals', (from, to) => {
    const initial = historical33(from), final = historical33(to), game = deserializeGame(initial.save);
    expect(final.archive.records.slice(0, initial.entry.records)).toEqual(initial.archive.records);
    for (const record of final.archive.records.slice(initial.entry.records)) {
      const seal = final.entry.commandSeals.find(item => item.sequence === record.sequence)!;
      expect(stateHashForVersion(game, 33)).toBe(seal.beforeHash);
      const result = applyCommandForVersion(game, record.command, 33);
      expect(result.ok).toBe(record.ok); expect(result.error ?? null).toBe(record.error); expect(result.events).toEqual(record.events);
      expect(sha256(JSON.stringify(result))).toBe(seal.resultSha256);
      expect(stateHashForVersion(game, 33)).toBe(seal.afterHash);
      if (record.checkpoint) expect(stateHashForVersion(game, 33)).toBe(record.checkpoint);
    }
    expect(stateHashForVersion(game, 33)).toBe(final.entry.hash); expect(serializeGameForVersion(game, 33)).toBe(final.save);
  });

  it.each(['generated-delegated', 'theaters-allocated'])('resumes %s into modern reinforcement while retaining every old record', name => {
    const prior = historical33(name), game = deserializeGame(prior.save), journal = resumeJournal(game, prior.archive);
    const theater = game.theaters[0]!, factionId = theater.factionId;
    const command: GameCommand = { type: 'setTheater', factionId, theaterId: theater.id, name: theater.name,
      settlementIds: theater.settlementIds, armyIds: theater.armyIds, reserveCell: theater.reserveCell,
      guardsPerSettlement: theater.guardsPerSettlement, enabled: true, reinforcementLimit: 2 };
    expect(journal.record(game, command).ok).toBe(true);
    expect(journal.record(game, { type: 'endTurn', factionId }).ok).toBe(true);
    const archive = journal.materialize(), save = serializeGame(game);
    expect(archive.initialSave).toBe(prior.archive.initialSave);
    expect(archive.records.slice(0, prior.entry.records)).toEqual(prior.archive.records);
    expect(archive.records.slice(prior.entry.records).map(record => record.rulesVersion)).toEqual([SAVE_VERSION, SAVE_VERSION]);
    expect(archive.records.at(-1)).toMatchObject({ checkpointVersion: SAVE_VERSION, checkpoint: stateHash(game) });
    expect(game.theaters[0]!.reinforcementLimit).toBe(2);
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(save);
    expect(serializeGame(deserializeGame(save))).toBe(save);
    expect(() => serializeGameForVersion(game, 33)).toThrow(/reinforcement/);
    expect(() => stateHashForVersion(game, 33)).toThrow(/reinforcement/);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 33)).toThrow(/reinforcement/);
  });

  it('rejects resealed future metadata in frozen33 before migration and verifies its original checksum', () => {
    const { save } = historical33('theaters-ordered');
    const wrongChecksum = JSON.parse(save); wrongChecksum.state.turn++;
    expect(() => deserializeGame(JSON.stringify(wrongChecksum))).toThrow(/checksum/);
    for (const field of ['supplyAccess', 'reinforcementLimit', 'reinforcementHolds']) {
      const future = JSON.parse(save);
      if (field === 'supplyAccess') future.state.supplyAccess = { offers: [], agreements: [], nextId: 1 };
      else future.state.theaters[0][field] = field === 'reinforcementLimit' ? 0 : [];
      future.stateChecksum = checksum(JSON.stringify(future.state));
      expect(() => deserializeGame(JSON.stringify(future))).toThrow(/Unrecognized key/);
    }
  });

  it('rejects future commands under33 and cannot discard consumed supply IDs after records expire', () => {
    const game = deserializeGame(historical33('generated-delegated').save), factionId = game.turnOwnerId, theater = game.theaters[0]!;
    const commands = [
      { type: 'setTheater', factionId, theaterId: theater.id, name: theater.name, settlementIds: theater.settlementIds,
        armyIds: theater.armyIds, reserveCell: theater.reserveCell, guardsPerSettlement: 1, enabled: true, reinforcementLimit: 0 },
      { type: 'proposeSupplyAccess', factionId, targetFactionId: game.factions[1]!.id, settlementId: theater.settlementIds[0], feeCoin: 10, termTurns: 5 },
      { type: 'respondSupplyAccess', factionId, offerId: 'supply-offer.1', accept: false },
      { type: 'endSupplyAccess', factionId, agreementId: 'supply-access.1' },
    ];
    const before = serializeGame(game);
    for (const command of commands) {
      expect(commandSchemaForVersion(33).safeParse(command).success).toBe(false);
      expect(applyCommandForVersion(game, command, 33).ok).toBe(false);
      expect(serializeGame(game)).toBe(before);
    }
    game.supplyAccess.nextId = 2; // Legal persistent counter after a deleted/expired record.
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
    expect(() => serializeGameForVersion(game, 33)).toThrow(/identifier history/);
    expect(() => stateHashForVersion(game, 33)).toThrow(/identifier history/);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 33)).toThrow(/identifier history/);
    expect(applyCommand(game, { type: 'endTurn', factionId }).ok).toBe(true);
  });

  it('migrates fresh independent defaults without sharing theater holds or supply arrays', () => {
    const { save } = historical33('theaters-allocated'), first = deserializeGame(save), second = deserializeGame(save), before = serializeGame(second);
    first.supplyAccess.nextId = 2;
    first.theaters[0]!.reinforcementHolds!.push({ settlementId: first.theaters[0]!.settlementIds[0]!, extraGuards: 1, untilTurn: first.turn });
    expect(first.supplyAccess.offers).not.toBe(second.supplyAccess.offers);
    expect(first.supplyAccess.agreements).not.toBe(second.supplyAccess.agreements);
    expect(first.theaters[0]!.reinforcementHolds).not.toBe(first.theaters[1]!.reinforcementHolds);
    expect(serializeGame(second)).toBe(before); expect(deserializeGame(save).supplyAccess.nextId).toBe(1);
  });
});
