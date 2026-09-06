import 'fake-indexeddb/auto';
import { cpus } from 'node:os';
import { deepStrictEqual } from 'node:assert';
import { performance } from 'node:perf_hooks';
import { createGame, getObservation, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { planTurn } from '@theandril/ai';
import { createJournal, resumeJournal, replayArchive, type CampaignJournal } from '@theandril/chronicle';
import { SaveStore, deserializeCampaign, serializeCampaign } from '@theandril/persistence';

function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function distribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: values.length, meanMs: values.reduce((sum, value) => sum + value, 0) / values.length,
    medianMs: sorted[Math.floor(sorted.length / 2)], maxMs: sorted.at(-1) };
}
function round(game: GameState, journal: CampaignJournal, mirror?: { game: GameState; journal: CampaignJournal }) {
  let count = 0;
  const issue = (command: GameCommand) => {
    const result = journal.record(game, command); count++;
    check(result.ok, `Rejected ${JSON.stringify(command)}: ${result.error}`);
    if (mirror) check(JSON.stringify(mirror.journal.record(mirror.game, command)) === JSON.stringify(result), 'Mirrored command/result/events differ.');
  };
  for (const faction of game.factions) for (const command of planTurn(getObservation(game, faction.id))) {
    issue(command);
    if (game.battle) {
      const battle = game.battle;
      issue({ type: 'autoResolveBattle', factionId: [battle.attackerFactionId, battle.defenderFactionId].includes(game.turnOwnerId) ? game.turnOwnerId : battle.attackerFactionId });
    }
    if (game.pendingCapture) {
      const decision = planTurn(getObservation(game, game.pendingCapture.factionId))[0];
      check(decision?.type === 'resolveCapture', 'Missing capture decision.'); issue(decision);
    }
  }
  issue({ type: 'endTurn', factionId: game.turnOwnerId });
  if (mirror) check(stateHash(game) === stateHash(mirror.game), 'Round continuation differs.');
  return count;
}

const smoke = process.argv.includes('--smoke');
check(process.argv.slice(2).every(arg => arg === '--smoke'), 'Supported option: --smoke');
const cases = smoke ? [{ seed: 20260905, size: 'tiny' as const, pace: 'epic' as const, factions: 4, warmupTurns: 10, measuredTurns: 3 }]
  : [{ seed: 20260905, size: 'tiny' as const, pace: 'epic' as const, factions: 4, warmupTurns: 500, measuredTurns: 10 },
    { seed: 748291, size: 'standard' as const, pace: 'long' as const, factions: 24, warmupTurns: 250, measuredTurns: 10 }];
const measurements: object[] = [];
for (const settings of cases) {
  const game = createGame({ seed: settings.seed, size: settings.size, pace: settings.pace, factionCount: settings.factions });
  const journal = createJournal(game, { mode: 'watch' });
  for (let index = 0; index < settings.warmupTurns; index++) round(game, journal);
  check(!game.victory, 'Measured prefix must precede victory.');
  const initialEnvelope = serializeCampaign(game, journal.materialize());
  const restored = deserializeCampaign(initialEnvelope);
  const mirror = { game: restored.game, journal: resumeJournal(restored.game, restored.archive) };
  const archiveRecordsAtStart = journal.recordCount;
  const incremental = new SaveStore(`storage-bench-incremental-${settings.size}`);
  const legacy = new SaveStore(`storage-bench-legacy-${settings.size}`);
  try {
    const initialStarted = performance.now(); await incremental.saveCampaign(game, journal, 'auto');
    const initialCommitMs = performance.now() - initialStarted;
    const initialCommit = incremental.lastCampaignSaveStats;
    await legacy.save(initialEnvelope, 'auto');
    const incrementalTimes: number[] = [], legacyTimes: number[] = [], commits: object[] = [];
    let recordedCommands = 0;
    for (let index = 0; index < settings.measuredTurns; index++) {
      const appended = round(game, journal, mirror); recordedCommands += appended;
      let started = performance.now(); await incremental.saveCampaign(game, journal, 'auto');
      incrementalTimes.push(performance.now() - started);
      const stats = incremental.lastCampaignSaveStats;
      check(stats?.suffixRecords === appended, 'An incremental commit encoded old records or omitted new records.');
      commits.push({ turn: game.turn, ...stats });
      started = performance.now();
      await legacy.save(serializeCampaign(mirror.game, mirror.journal.materialize()), 'auto');
      legacyTimes.push(performance.now() - started);
    }
    const noopStarted = performance.now(); await incremental.saveCampaign(game, journal, 'auto');
    const noopMs = performance.now() - noopStarted, noop = incremental.lastCampaignSaveStats;
    check(noop?.suffixRecords === 0 && noop.newBlobs === 0 && noop.historyPayloadWrites === 0, 'No-op save rewrote historical payloads.');
    const loadStarted = performance.now(), loaded = await incremental.loadLatestCampaign('auto');
    const loadMs = performance.now() - loadStarted;
    const loadedArchive = loaded.journal.materialize(), expectedArchive = journal.materialize();
    check(stateHash(loaded.game) === stateHash(game), 'Chunk reconstruction differs from the saved game.');
    // Schema parsing may order object keys differently; every nested value must remain exact.
    deepStrictEqual(loadedArchive, expectedArchive, 'Chunk reconstruction differs from original history.');
    check(stateHash(deserializeCampaign(await legacy.loadLatest('auto')).game) === stateHash(game), 'Legacy comparison save differs.');
    const replayStarted = performance.now();
    check(stateHash(replayArchive(loadedArchive)) === stateHash(game), 'Reconstructed archive cannot replay exactly.');
    const replayMs = performance.now() - replayStarted;
    measurements.push({ ...settings, actualTurn: game.turn, archiveRecordsAtStart, finalRecords: journal.recordCount,
      initialEnvelopeBytes: Buffer.byteLength(initialEnvelope), finalEnvelopeBytes: Buffer.byteLength(serializeCampaign(game, expectedArchive)),
      recordedCommands, initialCommitMs, initialCommit, incrementalSave: distribution(incrementalTimes),
      wholeEnvelopeSave: distribution(legacyTimes), commits, noopMs, noop, loadMs, replayMs,
      finalHash: stateHash(game), rawHeapMiB: Math.round(process.memoryUsage().heapUsed / 1048576) });
  } finally { await incremental.delete(); await legacy.delete(); }
}
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model,
  note: 'Real generated, observation-only AI campaign prefixes. Each measured turn applies identical commands to two independent journals and compares results/events/hash outside storage timings. Incremental saves compared with legacy whole-envelope saves in fake-indexeddb: algorithm/serialization/emulated-transaction measurements, NOT browser disk latency. Whole-envelope timing includes explicit detached materialization. Initial commit is reported separately; append/no-op counters, exact reconstruction, legacy equality and complete replay are mandatory. Three immutable payload replicas preserve redundancy; no claim of threefold disk savings. No forced GC, peak or retained-memory proof. Archives remain in memory and the 64 MiB logical policy is unchanged.', measurements }, null, 2));
