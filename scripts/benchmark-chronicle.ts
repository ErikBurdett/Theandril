import { performance } from 'node:perf_hooks';
import { cpus } from 'node:os';
import { createGame, getObservation, stateHash, type GameCommand } from '@theandril/sim';
import { planTurn } from '@theandril/ai';
import { applyRecordedCommand, createArchive, generateChronicles, replayArchive } from '@theandril/chronicle';
import { deserializeCampaign, serializeCampaign, exportSave, importSave } from '@theandril/persistence';
import type { CampaignPace } from '@theandril/content';
import type { MapSize } from '@theandril/mapgen';

const measurements: object[] = [];
const cases: { size: MapSize; pace: CampaignPace; factions: number; limit: number }[] = [
  { size: 'tiny', pace: 'short', factions: 4, limit: 150 },
  { size: 'huge', pace: 'short', factions: 32, limit: 150 },
  { size: 'legendary', pace: 'short', factions: 40, limit: 150 },
  { size: 'tiny', pace: 'standard', factions: 4, limit: 500 },
  { size: 'tiny', pace: 'epic', factions: 4, limit: 1400 },
];
const options = new Map(process.argv.slice(2).map(argument => {
  const match = /^--(seed|size|pace|factions|limit)=(.+)$/.exec(argument);
  if (!match) throw new Error('Use --seed=N --size=standard --pace=long --factions=N --limit=N.');
  return [match[1]!, match[2]!] as const;
}));
const numberOption = (name: string, fallback: number, minimum: number, maximum: number): number => {
  const value = Number(options.get(name) ?? fallback);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error(`Invalid ${name}: expected ${minimum}–${maximum}.`);
  return value;
};
const seed = numberOption('seed', 20260905, 0, 0xffff_ffff);
if (['size', 'pace', 'factions', 'limit'].some(name => options.has(name))) {
  const size = options.get('size') ?? 'standard'; const pace = options.get('pace') ?? 'long';
  if (!['tiny', 'small', 'standard', 'huge', 'legendary'].includes(size) || !['short', 'standard', 'long', 'epic'].includes(pace)) throw new Error('Unknown map size or pace.');
  cases.splice(0, cases.length, { size: size as MapSize, pace: pace as CampaignPace, factions: numberOption('factions', 24, 1, 48), limit: numberOption('limit', 1200, 1, 2000) });
}
for (const { size, pace, factions, limit } of cases) {
  const state = createGame({ seed, size, factionCount: factions, pace });
  const archive = createArchive(state, { mode: 'watch' });
  let aiMs = 0, commandAndArchiveMs = 0, observationMs = 0, rejected = 0;
  const started = performance.now();
  const issue = (command: GameCommand) => {
    const before = performance.now();
    const result = applyRecordedCommand(state, archive, command);
    commandAndArchiveMs += performance.now() - before;
    if (!result.ok) rejected++;
  };
  while (!state.victory && state.turn <= limit) {
    for (const faction of state.factions) {
      const before = performance.now();
      const view = getObservation(state, faction.id);
      observationMs += performance.now() - before;
      const planning = performance.now();
      const proposals = planTurn(view);
      aiMs += performance.now() - planning;
      for (const command of proposals) {
        issue(command);
        if (state.battle) {
          const battle = state.battle;
          issue({ type: 'autoResolveBattle', factionId: [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId });
        }
        if (state.pendingCapture) {
          const decision = planTurn(getObservation(state, state.pendingCapture.factionId))[0];
          if (!decision || decision.type !== 'resolveCapture') throw new Error('No capture decision');
          issue(decision);
        }
      }
    }
    issue({ type: 'endTurn', factionId: state.turnOwnerId });
  }
  const totalMs = performance.now() - started;
  if (!state.victory || rejected) throw new Error(`Archived ${size} campaign did not finish cleanly: ${rejected} refused orders, turn ${state.turn}.`);
  const saveStarted = performance.now();
  const text = serializeCampaign(state, archive);
  const saveMs = performance.now() - saveStarted;
  const loadStarted = performance.now();
  const restored = deserializeCampaign(text);
  const loadMs = performance.now() - loadStarted;
  if (stateHash(restored.game) !== stateHash(state)) throw new Error('Archive restore mismatch');
  const exportStarted = performance.now();
  const compressed = await exportSave(text);
  const exportMs = performance.now() - exportStarted;
  const importStarted = performance.now();
  const imported = await importSave(compressed);
  const importMs = performance.now() - importStarted;
  if (stateHash(deserializeCampaign(imported).game) !== stateHash(state)) throw new Error('Compressed archive roundtrip mismatch');
  const logStarted = performance.now();
  const documents = generateChronicles(restored.game, restored.archive);
  const logMs = performance.now() - logStarted;
  const replayStarted = performance.now();
  if (stateHash(replayArchive(restored.archive)) !== stateHash(state)) throw new Error('Archive replay mismatch');
  const replayMs = performance.now() - replayStarted;
  const eventCounts: Record<string, number> = {};
  for (const record of archive.records) for (const event of record.events) eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
  measurements.push({ seed, size, pace: state.pace, factions: state.factions.length, victory: state.victory, turns: state.turn - 1, orders: archive.records.length,
    events: archive.records.reduce((sum, record) => sum + record.events.length, 0), battleReportsArchived: archive.records.reduce((sum, record) => sum + record.battles.length, 0), rejected, totalMs, aiMs, observationMs, commandAndArchiveMs,
    winnerSettlements: Object.values(state.settlements).filter(town => town.factionId === state.victory?.factionId).length,
    livingCharacters: Object.values(state.characters).filter(character => !character.dead).length, retainedMemorials: Object.values(state.characters).filter(character => character.dead).length,
    characterActivity: Object.fromEntries(Object.entries(eventCounts).filter(([type]) => type.startsWith('character_') || type === 'commander_rallied')),
    // Most public warfare events notify both participants; these are notification counts, not unique captures.
    conquestNotifications: eventCounts.settlement_captured ?? 0,
    averageRoundWithArchiveMs: totalMs / (state.turn - 1), saveMs, loadMs, exportMs, importMs, compressedBytes: compressed.byteLength, logMs, replayMs,
    saveBytes: Buffer.byteLength(text), technicalBytes: Buffer.byteLength(documents.technical), historyBytes: Buffer.byteLength(documents.historyText),
    chapters: documents.history.chapters.length, hash: stateHash(state), heapMiB: Math.round(process.memoryUsage().heapUsed / 1048576) });
}
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model, note: 'Generated starts, every faction controlled by real AI, complete command/event/battle archives, true Prosperity victory. Short32/40faction scale runs are distinct from Standard/Epic4faction duration runs. Round time includes end-turn archive hashes but excludes disk saves, compression, rendering and final log generation. Complete replay and envelope restore verified.', measurements }, null, 2));
