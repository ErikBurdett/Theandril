import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { deriveBiomes } from '@theandril/mapgen';
import { applyCommandForVersion, battleReportForVersion, createGame, deserializeGame, getMovementQuery, getObservation, SAVE_VERSION, serializeGame, serializeGameForVersion, stateHash, stateHashForVersion } from '@theandril/sim';
import type { GameState, GameCommand } from '@theandril/sim';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../../test-fixtures/src/victory-fixture';
import { applyRecordedCommand, generateChronicles, parseArchive, replayArchive } from './index';
import type { CampaignArchive, ArchiveRecord } from './index';
import { planTurn } from './fixtures/legacy-planner';
import { initializeLegacyLand } from '../../sim/src/simulation';

type LegacyRecord = Omit<ArchiveRecord, 'checkpointVersion' | 'rulesVersion'>;
type LegacyArchive = Omit<CampaignArchive, 'version' | 'records' | 'initialSaveVersion' | 'finalHashVersion'> & { version: 1; records: LegacyRecord[] };
const factionId = 'faction.ashen_compact';
const end: GameCommand = { type: 'endTurn', factionId };

/** Synthetic prior-format fixture: no claim that this was a released or retained user file. */
function legacyOrigin(state: GameState, coverage: 'complete' | 'from-save' = 'complete'): LegacyArchive {
  const initialSave = serializeGameForVersion(state, 4);
  return { version: 1, mode: 'watch', coverage, initialSave, initialHash: checksum(initialSave), initialTurn: state.turn, records: [], finalHash: state.victory ? stateHashForVersion(state, 4) : null };
}
function legacyIssue(state: GameState, archive: LegacyArchive, command: unknown): void {
  const before = state.turn; const result = applyCommandForVersion(state, command, 4);
  const checkpoint = result.ok && (state.turn !== before || state.victory) ? stateHashForVersion(state, 4) : null;
  archive.records.push({ sequence: archive.records.length + 1, turn: before, afterTurn: state.turn, command: structuredClone(command), ok: result.ok, error: result.error ?? null, events: result.events, battles: result.events.some(event => event.type === 'battle_finished') ? [battleReportForVersion(state.battleReports.at(-1)!, 4)] : [], checkpoint });
  if (state.victory) archive.finalHash = stateHashForVersion(state, 4);
}

describe('preserved schema-4 archives and mixed-version continuation', () => {
  it('matches the independently recorded pre-travel short-campaign v4 benchmark seal', () => {
    // Provenance: the completed pre-schema-5 benchmark recorded seed 20260905,
    // Tiny / four AI factions / Short pace, victory on turn46 and seal a7a7b987.
    // This is an independently recorded golden, not a retained raw save artifact.
    const state = createGame({ seed: 20260905, size: 'tiny', factionCount: 4, pace: 'short', generatorVersion: 1, rosterVersion: 1 });
    const prior = legacyOrigin(state);
    const issue = (command: GameCommand): void => {
      legacyIssue(state, prior, command);
      const result = prior.records.at(-1)!;
      expect(result.ok, result.error ?? JSON.stringify(command)).toBe(true);
    };
    while (!state.victory && state.turn <= 150) {
      for (const faction of state.factions) for (const command of planTurn(getObservation(state, faction.id))) {
        issue(command);
        if (state.battle) {
          const battle = state.battle;
          issue({ type: 'autoResolveBattle', factionId: [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId });
        }
        if (state.pendingCapture) {
          const decision = planTurn(getObservation(state, state.pendingCapture.factionId))[0];
          if (!decision || decision.type !== 'resolveCapture') throw new Error('Legacy benchmark requires a capture decision');
          issue(decision);
        }
      }
      issue({ type: 'endTurn', factionId: state.turnOwnerId });
    }
    expect(state.victory?.turn).toBe(46);
    expect(stateHashForVersion(state, 4)).toBe('a7a7b987');
    const migrated = parseArchive(prior, deserializeGame(serializeGameForVersion(state, 4)));
    expect(migrated.finalHash).toBe('a7a7b987');
    expect(stateHashForVersion(replayArchive(migrated), 4)).toBe('a7a7b987');
  });

  it('migrates actual v4 snapshot structure without rewriting its bytes, events or checkpoint seals', () => {
    const state = createGame({ seed: 74, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 1, rosterVersion: 1 });
    const prior = legacyOrigin(state);
    legacyIssue(state, prior, { type: 'found', factionId, armyId: 'army.1', name: 'Old hearth' });
    for (let turn = 0; turn < 8; turn++) legacyIssue(state, prior, end);
    const imported = deserializeGame(serializeGameForVersion(state, 4));
    const archive = parseArchive(prior, imported);
    expect(imported.world.generatorVersion).toBe(1); expect(imported.routes).toEqual({});
    expect(archive).toMatchObject({ version: 2, initialSaveVersion: 4, initialSave: prior.initialSave, initialHash: prior.initialHash });
    expect(archive.records.map(record => record.checkpoint)).toEqual(prior.records.map(record => record.checkpoint));
    expect(archive.records.map(record => record.events)).toEqual(prior.records.map(record => record.events));
    expect(archive.records.every(record => record.rulesVersion === 4)).toBe(true);
    expect(stateHashForVersion(replayArchive(archive), 4)).toBe(stateHashForVersion(state, 4));
    expect(stateHash(replayArchive(archive))).toBe(stateHash(imported));
    const copied = structuredClone(prior); copied.records[1]!.checkpoint = '00000000';
    expect(() => replayArchive(parseArchive(copied, imported))).toThrow(/checkpoint/);
  });

  it('keeps historical rejected future command names rejected while new records use new rules', () => {
    const state = createGame({ seed: 74, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 1, rosterVersion: 1 });
    const prior = legacyOrigin(state);
    const oldUnknownCommand = { type: 'moveTo', factionId, armyId: 'army.2', target: 1 };
    legacyIssue(state, prior, oldUnknownCommand); legacyIssue(state, prior, end);
    expect(prior.records[0]?.ok).toBe(false); expect(prior.records[0]?.error).toMatch(/Malformed command/);
    const archive = parseArchive(prior, state); expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
    const view = getObservation(state, factionId); const target = getMovementQuery(view, 'army.2').reachable[0]?.cell;
    if (target === undefined) throw new Error('No modern movement target');
    expect(applyRecordedCommand(state, archive, { type: 'moveTo', factionId, armyId: 'army.2', target }).ok).toBe(true);
    expect(applyRecordedCommand(state, archive, end).ok).toBe(true);
    expect(archive.records.at(-1)).toMatchObject({ rulesVersion: SAVE_VERSION, checkpointVersion: SAVE_VERSION, checkpoint: stateHash(state) });
    expect(stateHash(replayArchive(parseArchive(archive, state)))).toBe(stateHash(state));
    expect(archive.initialSave).toBe(prior.initialSave);
  });

  it('preserves original victory seals and postgame records after importing an old completed campaign', () => {
    const state = prosperityCampaign(); state.rosterVersion = 1; state.world.generatorVersion = 1; state.world.biome = deriveBiomes(state.world.seed, state.world.width, state.world.height, state.world.terrain, 1);
    // This is deliberately authored prior-format setup, not a captured user file.
    // Remove modern land development explicitly before the frozen-rule replay.
    initializeLegacyLand(state);
    state.roads = { edges: {}, projects: {}, known: Object.fromEntries(state.factions.map(faction => [faction.id, {}])) };
    const prior = legacyOrigin(state, 'from-save');
    for (const command of [
      { type: 'research', factionId, technologyId: 'technology.civic_accounts' },
      { type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' },
      { type: 'startVictoryProject', factionId, settlementId: PROSPERITY_FIXTURE.hostId },
      end, end, end, end, end,
    ]) legacyIssue(state, prior, command);
    expect(state.victory).not.toBeNull();
    const archive = parseArchive(prior, state); expect(archive.finalHashVersion).toBe(4); expect(archive.finalHash).toBe(prior.finalHash);
    const documents = generateChronicles(state, archive);
    const technical: { initialSaveVersion: number; finalHashVersion: number; initialHash: string; finalHash: string } = JSON.parse(documents.technical);
    expect(technical).toMatchObject({ initialSaveVersion: 4, finalHashVersion: 4, initialHash: prior.initialHash, finalHash: prior.finalHash });
    expect(documents.historyText).toContain(prior.finalHash!);
    expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
    expect(applyRecordedCommand(state, archive, end).ok).toBe(false);
    expect(archive.finalHash).toBe(prior.finalHash); expect(archive.finalHashVersion).toBe(4);
    expect(stateHash(replayArchive(archive))).toBe(stateHash(state));
  });

  it('rejects invented versions, lost format metadata and a downgrade after modern records', () => {
    const state = createGame({ seed: 74, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 1, rosterVersion: 1 }); const prior = legacyOrigin(state);
    legacyIssue(state, prior, end); const archive = parseArchive(prior, state);
    expect(applyRecordedCommand(state, archive, end).ok).toBe(true);
    for (const mutate of [
      (copy: CampaignArchive) => { copy.initialSaveVersion = 5; },
      (copy: CampaignArchive) => { copy.records[0]!.checkpointVersion = null; },
      (copy: CampaignArchive) => { copy.records.at(-1)!.checkpointVersion = 4; },
    ]) { const copy = structuredClone(archive); mutate(copy); expect(() => parseArchive(copy, state)).toThrow(); }
    const copy = structuredClone(archive); copy.records.push({ ...copy.records[0]!, sequence: copy.records.length + 1, turn: state.turn, afterTurn: state.turn + 1 });
    expect(() => parseArchive(copy, state)).toThrow(/downgrade/);
    const initial = deserializeGame(archive.initialSave); initial.world.generatorVersion = 2;
    expect(() => serializeGameForVersion(initial, 4)).toThrow(/legacy/);
    expect(() => parseArchive({ ...prior, initialSave: serializeGame(initial) }, state)).toThrow(/schema-4/);
  });
});
