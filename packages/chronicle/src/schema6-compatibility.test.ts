import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { applyCommandForVersion, battleReportForVersion, createGame, deserializeGame, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from '@theandril/sim';
import type { GameState } from '@theandril/sim';
import { applyRecordedCommand, createArchive, parseArchive, replayArchive } from './index';
import type { ArchiveRulesVersion, CampaignArchive } from './index';
import captured from './fixtures/v5-archives.json';

const end = { type: 'endTurn' as const, factionId: 'faction.ashen_compact' };

function recordWithVersion(game: GameState, archive: CampaignArchive, command: unknown, rulesVersion: ArchiveRulesVersion): void {
  const turn = game.turn;
  const result = applyCommandForVersion(game, command, rulesVersion);
  const checkpoint = result.ok && (game.turn !== turn || game.victory) ? stateHashForVersion(game, rulesVersion) : null;
  archive.records.push({ sequence: archive.records.length + 1, turn, afterTurn: game.turn, command: structuredClone(command), ok: result.ok,
    error: result.error ?? null, events: structuredClone(result.events),
    battles: result.events.some(event => event.type === 'battle_finished') ? [battleReportForVersion(game.battleReports.at(-1)!, rulesVersion)] : [],
    checkpoint, checkpointVersion: checkpoint ? rulesVersion : null, rulesVersion });
}

describe('schema-6 archives retain genuine schema-5 evidence', () => {
  it.each(['travel', 'battle'] as const)('preserves the actual pre-migration %s snapshot, reports, events and seals byte-for-byte', name => {
    const fixture = captured[name];
    const game = deserializeGame(fixture.finalSave);
    const archive = parseArchive(fixture.archive, game);
    expect(archive).toEqual(fixture.archive);
    expect(serializeGameForVersion(game, 5)).toBe(fixture.finalSave);
    expect(stateHashForVersion(game, 5)).toBe(fixture.finalHash);
    const replayed = replayArchive(archive);
    expect(serializeGameForVersion(replayed, 5)).toBe(fixture.finalSave);
    expect(stateHash(replayed)).toBe(stateHash(game));
    expect(archive.records.map(record => record.checkpoint)).toEqual(fixture.archive.records.map(record => record.checkpoint));
    expect(archive.records.flatMap(record => record.battles)).toEqual(fixture.archive.records.flatMap(record => record.battles));
  });

  it('restores a genuine in-flight schema-5 route and replays its exact saved continuation', () => {
    const game = deserializeGame(captured.travel.queuedSave);
    expect(Object.values(game.routes)).toHaveLength(1);
    for (const record of captured.travel.archive.records.slice(1)) {
      expect(applyCommandForVersion(game, record.command, 5)).toMatchObject({ ok: record.ok, events: record.events });
      expect(stateHashForVersion(game, 5)).toBe(record.checkpoint);
      expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    }
    expect(serializeGameForVersion(game, 5)).toBe(captured.travel.finalSave);
  });

  it('continues a genuine pending schema-5 battle through new archive records without changing historical combat', () => {
    const game = deserializeGame(captured.battle.pendingSave);
    expect(game.battle).not.toBeNull();
    const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
    const firstTactical = captured.battle.archive.records.findIndex(record => (record.command as { type: string }).type === 'battleOrder');
    expect(firstTactical).toBeGreaterThan(0);
    for (const record of captured.battle.archive.records.slice(firstTactical)) {
      recordWithVersion(game, archive, record.command, SAVE_VERSION);
      const actual = archive.records.at(-1)!;
      expect({ ...actual, events: actual.events.filter(event => event.type !== 'formation_experience') }).toMatchObject({ ok: record.ok, events: record.events, rulesVersion: SAVE_VERSION });
    }
    expect(battleReportForVersion(game.battleReports.at(-1)!, 5)).toEqual(captured.battle.archive.records.flatMap(record => record.battles)[0]);
    // The historical combat is frozen, but the following modern end turn earns
    // schema-9 land/center yields. Only historical execution retains old resources.
    const earned = Object.entries(game.development.formations);
    expect(earned.length).toBeGreaterThan(0);
    expect(earned.every(([id, development]) => development.experience > 0 && Object.values(game.armies).some(army => army.formations.some(formation => formation.id === id)))).toBe(true);
    const historical = deserializeGame(captured.battle.finalSave);
    expect(game.armies).toEqual(historical.armies);
    expect(game.factions.reduce((sum, faction) => sum + faction.knowledge, 0)).toBeGreaterThan(historical.factions.reduce((sum, faction) => sum + faction.knowledge, 0));
    expect(stateHash(replayArchive(parseArchive(archive, game)))).toBe(stateHash(game));
  });

  it('detects altered historical battle logs and never silently modernizes their report shape', () => {
    const game = deserializeGame(captured.battle.finalSave);
    const corrupted = structuredClone(captured.battle.archive);
    corrupted.records.find(record => record.battles.length)!.battles[0]!.combat.log[0] = 'Invented historical order.';
    expect(() => replayArchive(parseArchive(corrupted, game))).toThrow(/battle mismatch/);
    const modernized = structuredClone(captured.battle.archive);
    Object.assign(modernized.records.find(record => record.battles.length)!.battles[0]!, { rulesVersion: 5, formationBindings: [] });
    expect(() => parseArchive(modernized, game)).toThrow();
  });

  it('supports numeric 4 → 5 → 6 rules transitions and preserves formerly unknown commands as refused', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 1, rosterVersion: 1, rulesVersion: 4 });
    const initialSave = serializeGameForVersion(game, 4);
    const archive: CampaignArchive = { version: 2, mode: 'watch', coverage: 'complete', initialSave, initialHash: checksum(initialSave), initialSaveVersion: 4, initialTurn: 1, records: [], finalHash: null, finalHashVersion: null };
    recordWithVersion(game, archive, end, 4);
    recordWithVersion(game, archive, { type: 'mergeArmies', factionId: end.factionId, sourceArmyId: 'army.1', targetArmyId: 'army.2' }, 5);
    expect(archive.records.at(-1)).toMatchObject({ ok: false, error: expect.stringMatching(/Malformed command/) });
    recordWithVersion(game, archive, end, 5);
    recordWithVersion(game, archive, end, 6);
    expect(archive.records.at(-1)).toMatchObject({ ok: true, rulesVersion: 6 });
    expect(archive.records.map(record => record.rulesVersion)).toEqual([4, 5, 5, 6]);
    expect(stateHash(replayArchive(parseArchive(archive, game)))).toBe(stateHash(game));
    const downgraded = structuredClone(archive);
    downgraded.records.push({ ...downgraded.records[1]!, sequence: 5, turn: game.turn, afterTurn: game.turn });
    expect(() => parseArchive(downgraded, game)).toThrow(/downgrade/);
  });

  it('forbids schema-5 rules after a current-format origin or even a rejected current-format order', () => {
    const game = deserializeGame(captured.travel.finalSave);
    const archive = parseArchive(captured.travel.archive, game);
    expect(applyRecordedCommand(game, archive, { type: 'move', factionId: end.factionId, armyId: 'army.missing', target: 1 }).ok).toBe(false);
    recordWithVersion(game, archive, { type: 'unknown' }, 5);
    expect(() => parseArchive(archive, game)).toThrow(/downgrade/);
    const origin = createArchive(game, { mode: 'watch', coverage: 'from-save' });
    recordWithVersion(game, origin, { type: 'unknown' }, 5);
    expect(() => parseArchive(origin, game)).toThrow(/downgrade/);
  });

  it('records real composition commands with current-format identity instead of flattening their rosters into old seals', () => {
    const game = createGame({ seed: 74, size: 'tiny', factionCount: 2, pace: 'long' });
    const archive = createArchive(game, { mode: 'player' });
    const formationIds = ['army.1', 'army.2'].flatMap(id => game.armies[id]!.formations.map(formation => formation.id)).sort();
    expect(applyRecordedCommand(game, archive, { type: 'mergeArmies', factionId: end.factionId, sourceArmyId: 'army.1', targetArmyId: 'army.2' }).ok).toBe(true);
    expect(game.armies['army.2']!.formations.map(formation => formation.id).sort()).toEqual(formationIds);
    expect(() => serializeGameForVersion(game, 5)).toThrow();
    expect(applyRecordedCommand(game, archive, end).ok).toBe(true);
    expect(applyRecordedCommand(game, archive, { type: 'splitArmy', factionId: end.factionId, armyId: 'army.2', formationIds: [formationIds[0]!], name: 'Recorded detachment' }).ok).toBe(true);
    expect(applyRecordedCommand(game, archive, end).ok).toBe(true);
    expect(archive.records.every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
  });
});
