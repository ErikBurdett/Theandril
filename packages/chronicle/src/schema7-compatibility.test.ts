import { describe, expect, it } from 'vitest';
import { applyCommandForVersion, battleReportForVersion, deserializeGame, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from '@theandril/sim';
import { applyRecordedCommand, createArchive, parseArchive, replayArchive } from './index';
import captured from './fixtures/v6-archives.json';

describe('immutable real schema-6 mixed-army archives', () => {
  it.each(['travel', 'battle'] as const)('retains every original %s origin byte, result, report and checkpoint seal', name => {
    const fixture = captured[name];
    const game = deserializeGame(fixture.finalSave);
    const archive = parseArchive(fixture.archive, game);
    expect(archive).toEqual(fixture.archive);
    expect(serializeGameForVersion(game, 6)).toBe(fixture.finalSave);
    expect(stateHashForVersion(game, 6)).toBe(fixture.finalHash);
    const replayed = replayArchive(archive);
    expect(serializeGameForVersion(replayed, 6)).toBe(fixture.finalSave);
    expect(stateHash(replayed)).toBe(stateHash(game));
    expect(archive.records.flatMap(record => record.events)).toEqual(fixture.archive.records.flatMap(record => record.events));
    expect(archive.records.flatMap(record => record.battles)).toEqual(fixture.archive.records.flatMap(record => record.battles));
    expect(archive.records.map(record => record.checkpoint)).toEqual(fixture.archive.records.map(record => record.checkpoint));
  });

  it('resumes a genuine merged-army schema-6 route and retains formation identity through its recorded split', () => {
    const game = deserializeGame(captured.travel.queuedSave);
    expect(game.armies['army.2']!.formations.map(formation => formation.id)).toEqual(['formation.1', 'formation.2']);
    expect(Object.values(game.routes)).toHaveLength(1);
    for (const record of captured.travel.archive.records.slice(captured.travel.queuedAfter)) {
      expect(applyCommandForVersion(game, record.command, 6)).toMatchObject({ ok: record.ok, events: record.events });
      if (record.checkpoint) expect(stateHashForVersion(game, 6)).toBe(record.checkpoint);
      expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    }
    expect(serializeGameForVersion(game, 6)).toBe(captured.travel.finalSave);
    expect(stateHashForVersion(game, 6)).toBe('90ffebed');
    expect(Object.values(game.armies).find(army => army.name === 'Oldroad caravan')?.formations.map(formation => formation.id)).toEqual(['formation.1']);
  });

  it.each(['pending', 'round'] as const)('continues the genuine mixed four-versus-three %s battle from its saved tactical state', stage => {
    const game = deserializeGame(stage === 'pending' ? captured.battle.pendingSave : captured.battle.roundSave);
    const after = stage === 'pending' ? captured.battle.pendingAfter : captured.battle.roundAfter;
    expect(game.battle?.combat.attacker).toHaveLength(4);
    expect(game.battle?.combat.defender).toHaveLength(3);
    expect(game.battle?.combat.round).toBe(stage === 'pending' ? 0 : 1);
    for (const record of captured.battle.archive.records.slice(after)) {
      expect(applyCommandForVersion(game, record.command, 6)).toMatchObject({ ok: record.ok, events: record.events });
      if (record.checkpoint) expect(stateHashForVersion(game, 6)).toBe(record.checkpoint);
      if (record.battles.length) expect(battleReportForVersion(game.battleReports.at(-1)!, 6)).toEqual(record.battles[0]);
      expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    }
    expect(serializeGameForVersion(game, 6)).toBe(captured.battle.finalSave);
    expect(stateHashForVersion(game, 6)).toBe('31b14677');
  });

  it.each(['pending', 'round'] as const)('continues an imported schema-6 %s battle through modern orders without retroactive character effects', stage => {
    const game = deserializeGame(stage === 'pending' ? captured.battle.pendingSave : captured.battle.roundSave);
    const after = stage === 'pending' ? captured.battle.pendingAfter : captured.battle.roundAfter;
    const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
    for (const record of captured.battle.archive.records.slice(after)) {
      const command = record.command as Parameters<typeof applyRecordedCommand>[2];
      const actual = applyRecordedCommand(game, archive, command);
      expect({ ...actual, events: actual.events.filter(event => event.type !== 'formation_experience' && event.type !== 'supply_attrition') }).toMatchObject({ ok: record.ok, events: record.events });
      expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
    }
    const report = game.battleReports.at(-1)!;
    expect(report).toMatchObject({ rulesVersion: 6, characterSnapshots: [], characterAftermath: [], usedAbilities: [] });
    expect(battleReportForVersion(report, 6)).toEqual(captured.battle.archive.records.find(record => record.battles.length)!.battles[0]);
    expect(archive.records.every(record => record.rulesVersion === SAVE_VERSION)).toBe(true);
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
    const earned = Object.entries(game.development.formations);
    expect(earned.length).toBeGreaterThan(0);
    expect(earned.every(([id, development]) => development.experience > 0 && Object.values(game.armies).some(army => army.formations.some(formation => formation.id === id)))).toBe(true);
    const historical = deserializeGame(captured.battle.finalSave);
    // A modern end turn also resolves modern rules: rules 27 supply attrition can
    // wear an unsupplied force. What must not change retroactively is who exists,
    // where they stand and what they are made of.
    const roster = (state: typeof game) => Object.fromEntries(Object.entries(state.armies)
      .map(([id, army]) => [id, { factionId: army.factionId, cell: army.cell, formations: army.formations.map(item => ({ id: item.id, unitId: item.unitId })) }]));
    expect(roster(game)).toEqual(roster(historical));
    // A modern end turn uses developed land yields; it is not an old economic seal.
    expect(game.factions.reduce((sum, faction) => sum + faction.knowledge, 0)).toBeGreaterThan(historical.factions.reduce((sum, faction) => sum + faction.knowledge, 0));
  });

  it('rejects an invented schema-6 formation aftermath instead of accepting a matching final snapshot alone', () => {
    const game = deserializeGame(captured.battle.finalSave);
    const corrupted = structuredClone(captured.battle.archive);
    const report = corrupted.records.find(record => record.battles.length)!.battles[0]!;
    report.formationAftermath[0]!.strength++;
    expect(() => replayArchive(parseArchive(corrupted, game))).toThrow(/battle mismatch/);
    const modernized = structuredClone(captured.battle.archive);
    Object.assign(modernized.records.find(record => record.battles.length)!.battles[0]!, { characterSnapshots: [], characterAftermath: [], usedAbilities: [] });
    expect(() => parseArchive(modernized, game)).toThrow();
  });

  it('appends modern commands without rewriting six-format evidence and never downgrades afterward', () => {
    const game = deserializeGame(captured.travel.finalSave);
    const archive = parseArchive(captured.travel.archive, game);
    const end = { type: 'endTurn' as const, factionId: game.turnOwnerId };
    expect(applyRecordedCommand(game, archive, end).ok).toBe(true);
    expect(archive.records.slice(0, captured.travel.archive.records.length)).toEqual(captured.travel.archive.records);
    expect(archive.records.at(-1)).toMatchObject({ rulesVersion: SAVE_VERSION, checkpointVersion: SAVE_VERSION, checkpoint: stateHash(game) });
    expect(serializeGame(replayArchive(parseArchive(archive, game)))).toBe(serializeGame(game));
    const downgraded = structuredClone(archive);
    downgraded.records.push({ ...downgraded.records.at(-1)!, sequence: downgraded.records.length + 1, turn: game.turn, afterTurn: game.turn + 1, rulesVersion: 6, checkpointVersion: 6 });
    expect(() => parseArchive(downgraded, game)).toThrow(/downgrade/);
    const modernOrigin = createArchive(game, { mode: 'player', coverage: 'from-save' });
    modernOrigin.records.push({ ...downgraded.records.at(-1)!, sequence: 1 });
    expect(() => parseArchive(modernOrigin, game)).toThrow(/downgrade/);
  });

  it('keeps future character command names malformed under historical schema-6 rules', () => {
    const game = deserializeGame(captured.travel.finalSave);
    const archive = parseArchive(captured.travel.archive, game);
    const command = { type: 'recruitCharacter', factionId: game.turnOwnerId, settlementId: 'settlement.missing', definitionId: 'character.surveyor' };
    const before = stateHash(game);
    const result = applyCommandForVersion(game, command, 6);
    expect(result).toMatchObject({ ok: false, events: [], error: expect.stringMatching(/Malformed command/) });
    expect(stateHash(game)).toBe(before);
    archive.records.push({ sequence: archive.records.length + 1, turn: game.turn, afterTurn: game.turn, command, ok: false, error: result.error!, events: [], battles: [], checkpoint: null, checkpointVersion: null, rulesVersion: 6 });
    expect(stateHash(replayArchive(parseArchive(archive, game)))).toBe(before);
  });
});
