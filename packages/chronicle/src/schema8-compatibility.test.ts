import { gunzipSync } from 'node:zlib';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommand, applyCommandForVersion, battleReportForVersion, createArmyFormation, deserializeGame, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion, type GameCommand } from '@theandril/sim';
import { applyRecordedCommand, parseArchive, replayArchive, resumeJournal } from './index';
import packed from './fixtures/v7-archives.json';

// Captured by scripts/capture-schema7.ts against the real, untouched schema-7
// implementation. Do not regenerate this payload or substitute current-rule seals.
const seal = z.string().regex(/^[a-f0-9]{8}$/);
const capturedCase = z.object({ archive: z.unknown(), save: z.string(), hash: seal }).strict();
const captured = z.object({ capturedBefore: z.literal('Schema-8 generals and naval changes'), contentHash: z.literal('9442246b'), mission: capturedCase, battle: capturedCase, battleFinish: capturedCase }).strict().parse(JSON.parse(gunzipSync(Buffer.from(packed.payload, 'base64')).toString('utf8')));
const original = JSON.stringify(captured);
const golden = { mission: '1af2d228', battle: '7980882d', battleFinish: 'd14195b3' } as const;

describe('immutable real schema-7 officer archives through schema-8', () => {
  it.each(['mission', 'battle', 'battleFinish'] as const)('retains every original %s byte, result, snapshot and independently captured hash', name => {
    const fixture = captured[name], game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    expect(packed.encoding).toBe('gzip-base64'); expect(packed.hashes).toEqual(golden);
    expect(fixture.hash).toBe(golden[name]); expect(stateHashForVersion(game, 7)).toBe(golden[name]);
    expect(serializeGameForVersion(game, 7)).toBe(fixture.save); expect(archive).toEqual(fixture.archive);
    expect(archive.initialSaveVersion).toBe(7); expect(archive.records.every(record => record.rulesVersion === 7)).toBe(true);
    const replayed = replayArchive(archive);
    expect(serializeGameForVersion(replayed, 7)).toBe(fixture.save); expect(stateHash(replayed)).toBe(stateHash(game));
    expect(serializeGameForVersion(deserializeGame(archive.initialSave), 7)).toBe(archive.initialSave);
    expect(game.transports).toEqual({}); expect(Object.values(game.characters).every(character => !character.learnedSkillIds.length)).toBe(true);
    expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game)); expect(JSON.stringify(captured)).toBe(original);
  });

  it('restores the genuine Rally-used round-one battle and replays its captured schema-7 aftermath exactly', () => {
    const game = deserializeGame(captured.battle.save), completion = parseArchive(captured.battleFinish.archive, deserializeGame(captured.battleFinish.save));
    expect(completion.initialSave).toBe(captured.battle.save);
    expect(game.battle).toMatchObject({ rulesVersion: 7, domain: 'land', usedAbilities: [{ characterId: 'character.12', abilityId: 'ability.rally' }], combat: { round: 1 } });
    expect(game.battle!.characterSnapshots[0]).toMatchObject({ leadership: { attack: 1, armor: 0 }, learnedSkillIds: [] });
    expect(game.battle!.combat.attacker).toHaveLength(4); expect(game.battle!.combat.defender).toHaveLength(3);
    for (const record of completion.records) {
      const result = applyCommandForVersion(game, record.command, 7);
      expect({ ok: result.ok, error: result.error ?? null, events: result.events }).toEqual({ ok: record.ok, error: record.error, events: record.events });
      if (record.battles.length) expect(battleReportForVersion(game.battleReports.at(-1)!, 7)).toEqual(record.battles[0]);
      if (record.checkpoint) expect(stateHashForVersion(game, 7)).toBe(record.checkpoint);
      expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    }
    expect(serializeGameForVersion(game, 7)).toBe(captured.battleFinish.save); expect(stateHashForVersion(game, 7)).toBe(golden.battleFinish);
  });

  it.each(['army-unit', 'building', 'unit-queue', 'building-queue', 'technology', 'character-skill', 'battle-unit', 'battle-skill', 'report-unit', 'report-skill'] as const)('rejects checksum-valid schema-7 %s references absent from the captured pack', kind => {
    type OldBattle = { combat: { attacker: { unitId: string }[] }; characterSnapshots: { skillId: string | null }[] };
    // Mutate the genuine old JSON shape, not a projection of current content.
    // The checksum is deliberately recomputed: reference compatibility, rather
    // than accidental corruption detection, must reject these forged saves.
    const fixture = kind.startsWith('report-') ? captured.battleFinish : captured.battle;
    const forged = JSON.parse(fixture.save) as { stateChecksum: string; state: {
      armies: { formations: { unitId: string }[] }[];
      settlements: { buildings: string[]; queue: { itemId: string; progress: number }[] }[];
      progression: { technologies: string[] }[];
      characters: { skillId: string | null }[];
      battle: OldBattle | null; battleReports: OldBattle[];
    } };
    if (kind === 'army-unit') forged.state.armies[0]!.formations[0]!.unitId = 'unit.transport';
    if (kind === 'building') forged.state.settlements[0]!.buildings.push('building.harbor');
    if (kind === 'unit-queue' || kind === 'building-queue') forged.state.settlements[0]!.queue.push({ itemId: kind === 'unit-queue' ? 'unit.coastal_warship' : 'building.harbor', progress: 0 });
    if (kind === 'technology') forged.state.progression[0]!.technologies.push('technology.coastal_navigation');
    if (kind === 'character-skill') forged.state.characters[0]!.skillId = 'skill.muster_rolls';
    if (kind === 'battle-unit') forged.state.battle!.combat.attacker[0]!.unitId = 'unit.ocean_warship';
    if (kind === 'battle-skill') forged.state.battle!.characterSnapshots[0]!.skillId = 'skill.field_orders';
    if (kind === 'report-unit') forged.state.battleReports[0]!.combat.attacker[0]!.unitId = 'unit.transport';
    if (kind === 'report-skill') forged.state.battleReports[0]!.characterSnapshots[0]!.skillId = 'skill.measured_advance';
    const priorChecksum = forged.stateChecksum;
    forged.stateChecksum = checksum(JSON.stringify(forged.state));
    expect(forged.stateChecksum).not.toBe(priorChecksum);
    expect(() => deserializeGame(JSON.stringify(forged))).toThrow('v7 references content absent from its frozen pack');
    expect(JSON.stringify(captured)).toBe(original);
  });

  it.each(['mission', 'battle'] as const)('continues the migrated %s through new journal suffixes without rewriting its old records', name => {
    const fixture = captured[name], game = deserializeGame(fixture.save), archive = parseArchive(fixture.archive, game);
    const journal = resumeJournal(game, archive), originalRecords = structuredClone(archive.records), beforeCount = journal.recordCount;
    const end: GameCommand = { type: 'endTurn', factionId: game.turnOwnerId };
    if (name === 'battle') {
      expect(journal.record(game, { type: 'autoResolveBattle', factionId: game.turnOwnerId }).ok).toBe(true);
      const old = parseArchive(captured.battleFinish.archive, deserializeGame(captured.battleFinish.save));
      expect(battleReportForVersion(game.battleReports.at(-1)!, 7)).toEqual(old.records[0]!.battles[0]);
    }
    expect(journal.record(game, end).ok).toBe(true);
    if (name === 'mission') expect(game.characters['character.4']).toMatchObject({ mission: null, experience: 4 });
    const commit = journal.prepareCommit(game, beforeCount), full = journal.materialize();
    expect(commit.records.every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(commit.records.at(-1)).toMatchObject({ checkpointVersion: SAVE_VERSION, checkpoint: stateHash(game) });
    expect(full.initialSave).toBe(archive.initialSave); expect(full.initialHash).toBe(archive.initialHash);
    expect(full.records.slice(0, beforeCount)).toEqual(originalRecords);
    expect(serializeGame(replayArchive(parseArchive(full, game)))).toBe(serializeGame(game));
    const mirror = deserializeGame(serializeGame(game)), resumed = resumeJournal(mirror, full);
    expect(resumed.record(mirror, end)).toEqual(journal.record(game, end));
    expect(stateHash(mirror)).toBe(stateHash(game)); expect(resumed.materialize()).toEqual(journal.materialize());
    expect(JSON.stringify(captured)).toBe(original);
  });

  it('refuses new transport commands and training under old rules, then rejects projecting learned skills as old evidence', () => {
    const game = deserializeGame(captured.mission.save), factionId = game.turnOwnerId;
    const before = stateHash(game);
    expect(applyCommandForVersion(game, { type: 'embarkArmy', factionId, armyId: 'army.2', fleetId: 'army.missing' }, 7)).toMatchObject({ ok: false, events: [], error: expect.stringMatching(/Malformed command/) });
    expect(stateHash(game)).toBe(before);
    expect(applyCommandForVersion(game, { type: 'endTurn', factionId }, 7).ok).toBe(true);
    const character = game.characters['character.4']!; character.experience = 30; // Explicit veteran setup only for boundary refusal tests.
    expect(applyCommandForVersion(game, { type: 'promoteCharacter', factionId, characterId: character.id, skillId: 'skill.fieldcraft' }, 7).ok).toBe(true);
    const upgrade: GameCommand = { type: 'promoteCharacter', factionId, characterId: character.id, skillId: 'skill.horizon_studies' };
    const oldHash = stateHash(game); expect(applyCommandForVersion(game, upgrade, 7)).toMatchObject({ ok: false, events: [], error: expect.stringMatching(/historical rules/) });
    expect(stateHash(game)).toBe(oldHash); expect(applyCommand(game, upgrade).ok).toBe(true);
    expect(character.learnedSkillIds).toEqual(['skill.horizon_studies']);
    const modernHash = stateHash(game); expect(() => serializeGameForVersion(game, 7)).toThrow(/pre-naval/);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId }, 7)).toThrow(/Historical rules/); expect(stateHash(game)).toBe(modernHash);
  });

  it.each(['twenty-formations', 'naval-formations', 'transport-links'] as const)('never flattens %s into a schema-7 seal', kind => {
    const game = deserializeGame(captured.mission.save), army = game.armies['army.2']!;
    if (kind === 'twenty-formations') while (army.formations.length < 20) army.formations.push(createArmyFormation(`army.${game.nextId++}`, 'unit.guard'));
    if (kind === 'naval-formations') army.formations = [createArmyFormation(army.id, 'unit.transport')];
    if (kind === 'transport-links') game.transports[army.id] = 'army.missing';
    // Deliberately incompatible in-memory candidates: projections must refuse, not
    // invent a valid old snapshot by dropping excess formations or relationships.
    const before = stateHash(game);
    expect(() => serializeGameForVersion(game, 7)).toThrow(/pre-naval/);
    expect(() => applyCommandForVersion(game, { type: 'endTurn', factionId: game.turnOwnerId }, 7)).toThrow(/Historical rules/);
    expect(stateHash(game)).toBe(before);
  });

  it('detects altered schema-7 tactical records and forbids a downgrade after a modern refusal', () => {
    const game = deserializeGame(captured.battleFinish.save), archive = parseArchive(captured.battleFinish.archive, game);
    const forged = structuredClone(archive); forged.records[0]!.battles[0]!.combat.log[0] = 'A fabricated officer outcome.';
    expect(() => replayArchive(parseArchive(forged, game))).toThrow(/battle mismatch/);
    const modern = structuredClone(archive), end: GameCommand = { type: 'endTurn', factionId: game.turnOwnerId };
    expect(applyRecordedCommand(game, modern, { type: 'move', factionId: game.turnOwnerId, armyId: 'army.missing', target: 0 }).ok).toBe(false);
    modern.records.push({ ...modern.records.at(-1)!, sequence: modern.records.length + 1, command: end, rulesVersion: 7 });
    expect(() => parseArchive(modern, game)).toThrow(/downgrade/);
    expect(JSON.stringify(captured)).toBe(original);
  });
});
