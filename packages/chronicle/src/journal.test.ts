import { afterEach, describe, expect, it, vi } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash } from '@theandril/sim';
import type { GameCommand } from '@theandril/sim';
import * as chronicle from './index';
import { createJournal, resumeJournal } from './journal';
import captured5 from './fixtures/v5-archives.json';
import captured6 from './fixtures/v6-archives.json';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../../test-fixtures/src/victory-fixture';

const create = () => createGame({ seed: 74, size: 'tiny', factionCount: 2, pace: 'short' });
const end: GameCommand = { type: 'endTurn', factionId: 'faction.ashen_compact' };
afterEach(() => vi.restoreAllMocks());

describe('private incremental campaign journals', () => {
  it('records the same commands, results and checkpoints as the existing archive', () => {
    const game = create(), mirror = deserializeGame(serializeGame(game));
    const journal = createJournal(game, { mode: 'watch' }), archive = chronicle.createArchive(mirror, { mode: 'watch' });
    for (const command of [{ type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Witness hearth' }, end,
      { type: 'move', factionId: game.turnOwnerId, armyId: 'army.missing', target: 0 }] satisfies GameCommand[]) {
      expect(journal.record(game, command)).toEqual(chronicle.applyRecordedCommand(mirror, archive, command));
    }
    expect(journal.mode).toBe('watch'); expect(journal.coverage).toBe('complete'); expect(journal.recordCount).toBe(3);
    expect(journal.materialize()).toEqual(archive);
    expect(stateHash(chronicle.replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  it('detaches command, nested result, materialized and commit data from private history', () => {
    const game = create(), journal = createJournal(game, { mode: 'player' });
    const command: GameCommand = { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Original hearth' };
    const result = journal.record(game, command), expected = journal.materialize(), gameHash = stateHash(game);
    command.name = 'Changed caller name'; result.events[0]!.message = 'Changed result'; result.events.push({ turn: 1, factionId: game.turnOwnerId, type: 'invented', message: 'Not a real event' });
    const snapshot = journal.materialize(), commit = journal.prepareCommit(game, 0);
    snapshot.records[0]!.events[0]!.message = 'Changed snapshot'; snapshot.records.length = 0;
    commit.records[0]!.events[0]!.message = 'Changed commit'; commit.header.initialHash = '00000000';
    expect(journal.materialize()).toEqual(expected); expect(stateHash(game)).toBe(gameHash);
  });

  it('clones only the requested suffix and does not reparse the historical origin', () => {
    const game = create(), journal = createJournal(game, { mode: 'player' });
    for (let index = 0; index < 12; index++) journal.record(game, end);
    const first = journal.prepareCommit(game, 0);
    journal.record(game, end);
    const clone = vi.spyOn(globalThis, 'structuredClone'), parse = vi.spyOn(chronicle, 'parseArchive');
    const next = journal.prepareCommit(game, first.to);
    expect(next).toMatchObject({ from: 12, to: 13 }); expect(next.records).toHaveLength(1);
    expect(clone).toHaveBeenCalledTimes(1); expect(clone.mock.calls[0]![0]).toEqual(next.records); expect(parse).not.toHaveBeenCalled();
    expect(journal.prepareCommit(game, next.to)).toMatchObject({ from: 13, to: 13, records: [] });
    expect([...first.records, ...next.records]).toEqual(journal.materialize().records);
  });

  it('rejects a different game object and invalid cursors before changing either game', () => {
    const game = create(), journal = createJournal(game, { mode: 'player' }), other = deserializeGame(serializeGame(game));
    const before = stateHash(game);
    expect(() => journal.record(other, end)).toThrow(/different game object/);
    expect(() => journal.prepareCommit(other, 0)).toThrow(/different game object/);
    for (const cursor of [-1, 1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) expect(() => journal.prepareCommit(game, cursor)).toThrow(/cursor/);
    expect(stateHash(game)).toBe(before); expect(stateHash(other)).toBe(before); expect(journal.recordCount).toBe(0);
    expect(journal.record(game, end).ok).toBe(true);
  });

  it('leaves a failed preparation retryable and detects a changed latest checkpoint', () => {
    const game = create(), journal = createJournal(game, { mode: 'player' });
    journal.record(game, end);
    const packet = journal.prepareCommit(game, 0);
    game.factions[0]!.treasury++;
    expect(() => journal.prepareCommit(game, 0)).toThrow(/latest checkpoint/);
    game.factions[0]!.treasury--;
    expect(journal.prepareCommit(game, 0)).toEqual(packet); expect(journal.prepareCommit(game, 0)).toEqual(packet);
    expect(journal.recordCount).toBe(1);
  });

  it('rejects unrecorded turns and changed campaign identity', () => {
    const game = create(), journal = createJournal(game, { mode: 'player' });
    game.world.seed++;
    expect(() => journal.prepareCommit(game, 0)).toThrow(/identity changed/);
    game.world.seed--;
    applyCommand(game, end);
    expect(() => journal.prepareCommit(game, 0)).toThrow(/unrecorded turn/);
    expect(() => journal.record(game, end)).toThrow(/unrecorded turn/); expect(journal.recordCount).toBe(0);
  });

  it('latches an interrupted recorder instead of committing a potentially partial command', () => {
    const game = create(), journal = createJournal(game, { mode: 'player' });
    const clone = globalThis.structuredClone;
    vi.spyOn(globalThis, 'structuredClone').mockImplementation(value => {
      if (value && typeof value === 'object' && 'ok' in value) throw new Error('Result transfer interrupted');
      return clone(value);
    });
    expect(() => journal.record(game, end)).toThrow(/Result transfer interrupted/);
    expect(game.turn).toBe(2); // The real command already ran when the output boundary failed.
    expect(() => journal.prepareCommit(game, 0)).toThrow(/interrupted/);
    expect(() => journal.record(game, end)).toThrow(/interrupted/);
    expect(() => journal.materialize()).toThrow(/interrupted/);
  });

  it('validates complete provenance at construction and does not alias imported unknown commands', () => {
    const game = create(); applyCommand(game, end);
    expect(() => createJournal(game, { mode: 'player' })).toThrow(/generated campaign start/);
    const source = chronicle.createArchive(game, { mode: 'player', coverage: 'from-save' });
    chronicle.applyRecordedCommand(game, source, { type: 'move', factionId: game.turnOwnerId, armyId: 'army.missing', target: 1 });
    const expected = structuredClone(source), parse = vi.spyOn(chronicle, 'parseArchive');
    const journal = resumeJournal(game, source);
    expect(parse).toHaveBeenCalledTimes(1);
    (source.records[0]!.command as { target: number }).target = 99;
    source.initialHash = '00000000';
    expect(journal.materialize()).toEqual(expected); journal.prepareCommit(game, 1);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it.each([{ version: 5, fixture: captured5 }, { version: 6, fixture: captured6 }])('preserves genuine version-$version travel and battle evidence when resumed', ({ fixture }) => {
    for (const name of ['travel', 'battle'] as const) {
      const game = deserializeGame(fixture[name].finalSave), journal = resumeJournal(game, fixture[name].archive);
      expect(journal.materialize()).toEqual(fixture[name].archive);
      const original = journal.prepareCommit(game, 0);
      expect(journal.record(game, end).ok).toBe(true);
      const suffix = journal.prepareCommit(game, original.to);
      expect(suffix.records).toHaveLength(1); expect(suffix.records[0]!.rulesVersion).toBe(SAVE_VERSION);
      const combined = { ...suffix.header, records: [...original.records, ...suffix.records] };
      expect(combined.records.slice(0, original.to)).toEqual(fixture[name].archive.records);
      expect(stateHash(chronicle.replayArchive(combined))).toBe(stateHash(game));
    }
  });

  it('accepts an archive-1 schema-4 origin without rewriting its snapshot or seal', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 1, rosterVersion: 1 });
    const initialSave = serializeGameForVersion(game, 4), initialHash = checksum(initialSave);
    const journal = resumeJournal(game, { version: 1, mode: 'player', coverage: 'complete', initialSave, initialHash, initialTurn: 1, records: [], finalHash: null });
    expect(journal.prepareCommit(game, 0).header).toMatchObject({ initialSave, initialHash, initialSaveVersion: 4 });
    expect(journal.record(game, end).ok).toBe(true);
    expect(stateHash(chronicle.replayArchive(journal.materialize()))).toBe(stateHash(game));
  });

  it('resumes a real current-format mission and appends only its deterministic completion', () => {
    const game = create(), journal = createJournal(game, { mode: 'player' }), factionId = game.turnOwnerId;
    expect(journal.record(game, { type: 'found', factionId, armyId: 'army.1', name: 'Witness hearth' }).ok).toBe(true);
    const settlementId = Object.keys(game.settlements)[0]!;
    expect(journal.record(game, { type: 'recruitCharacter', factionId, settlementId, definitionId: 'character.surveyor' }).ok).toBe(true);
    const characterId = Object.keys(game.characters)[0]!;
    expect(journal.record(game, { type: 'assignCharacter', factionId, characterId, armyId: 'army.2' }).ok).toBe(true);
    expect(journal.record(game, { type: 'startCharacterMission', factionId, characterId, missionId: 'mission.survey', targetCell: game.armies['army.2']!.cell }).ok).toBe(true);
    expect(journal.record(game, end).ok).toBe(true);
    expect(game.characters[characterId]?.mission?.remainingTurns).toBe(1);
    const mirror = deserializeGame(serializeGame(game)), saved = journal.materialize(), resumed = resumeJournal(mirror, saved);
    expect(journal.record(game, end)).toEqual(resumed.record(mirror, end));
    const suffix = resumed.prepareCommit(mirror, saved.records.length);
    expect(suffix.records).toHaveLength(1);
    expect(suffix.records[0]!.events.some(event => event.type === 'character_mission_completed')).toBe(true);
    expect(mirror.characters[characterId]).toMatchObject({ experience: 4, mission: null });
    expect(resumed.materialize()).toEqual(journal.materialize());
    expect(stateHash(chronicle.replayArchive(resumed.materialize()))).toBe(stateHash(game));
  });

  it('preserves a real victory seal even when its latest order is a refusal without a checkpoint', () => {
    const game = prosperityCampaign(), journal = createJournal(game, { mode: 'player', coverage: 'from-save' }), factionId = game.turnOwnerId;
    for (const command of [{ type: 'research', factionId, technologyId: 'technology.civic_accounts' },
      { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' },
      { type: 'startVictoryProject', factionId, settlementId: PROSPERITY_FIXTURE.hostId }] satisfies GameCommand[]) {
      expect(journal.record(game, command).ok).toBe(true);
    }
    for (let turn = 0; turn < 5; turn++) expect(journal.record(game, end).ok).toBe(true);
    expect(game.victory?.factionId).toBe(factionId);
    expect(journal.record(game, end).ok).toBe(false);
    const packet = journal.prepareCommit(game, 0);
    expect(packet.records.at(-1)!.checkpoint).toBeNull(); expect(packet.header.finalHash).toBe(stateHash(game));
    game.factions[0]!.treasury++;
    expect(() => journal.prepareCommit(game, packet.to)).toThrow(/victory seal/);
    game.factions[0]!.treasury--;
    expect(journal.prepareCommit(game, packet.to).records).toEqual([]);
    expect(stateHash(chronicle.replayArchive(journal.materialize()))).toBe(stateHash(game));
  });
});
