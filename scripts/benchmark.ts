import { cpus, platform, release } from 'node:os';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createGame, applyCommand, getObservation, serializeGame, deserializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { aiObservationOptions, planTurn } from '@theandril/ai';
import type { MapSize } from '@theandril/mapgen';
import { matureCampaign } from '../packages/test-fixtures/src/index';
import { autoResolveBattle, createBattle, type BattleFormation } from '../packages/sim/src/combat';
import { CONTENT_HASH, UNITS } from '@theandril/content';
import { conquestCampaign, CONQUEST_FIXTURE } from '../packages/test-fixtures/src/conquest-fixture';
import { benchmarkMovement } from './benchmark-movement';

const measurements: object[] = [];
for (const size of ['huge', 'legendary'] satisfies MapSize[]) {
  for (const mature of [false, true]) {
  const start = performance.now();
  const state = mature ? matureCampaign(size) : createGame({ seed: 20260905, size, factionCount: size === 'huge' ? 32 : 40 });
  const generatedMs = performance.now() - start;
  const initialArmies = Object.keys(state.armies).length;
  const initialFormations = Object.values(state.armies).reduce((sum, army) => sum + army.formations.length, 0);
  let aiMs = 0;
  let turnMs = 0;
  let maxTurnMs = 0;
  let commands = 0;
  let rejectedCommands = 0;
  let commandMs = 0;
  let resumed: GameState | undefined;
  const issue = (command: GameCommand) => {
    const started = performance.now();
    const result = applyCommand(state, command);
    commandMs += performance.now() - started;
    commands++;
    if (!result.ok) { rejectedCommands++; throw new Error(`Benchmark rejected on turn ${state.turn}: ${JSON.stringify(command)}: ${result.error}`); }
    if (resumed && JSON.stringify(applyCommand(resumed, command)) !== JSON.stringify(result)) throw new Error('Resumed command result/events diverged');
    return result;
  };
  const memory: number[] = [];
  const hashes: string[] = [];
  const phases: Record<string, number> = {};
  const phaseStarts: Record<string, number> = {};
  for (let turn = 0; turn < 100; turn++) {
    for (const faction of state.factions) {
      const planning = performance.now();
      // Fixed-length scale workload intentionally defers the terminal project.
      // A separate benchmark-chronicle run measures real generated-start victory.
      const proposals = planTurn(getObservation(state, faction.id, aiObservationOptions(state.turn))).filter(command => command.type !== 'startVictoryProject');
      aiMs += performance.now() - planning;
      for (const command of proposals) {
        issue(command);
        if (state.battle) {
          const battle = state.battle;
          const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
          const result = issue({ type: 'autoResolveBattle', factionId: controller });
          if (!result.ok) throw new Error(result.error);
        }
        if (state.pendingCapture) {
          const capture = state.pendingCapture;
          const result = issue({ type: 'resolveCapture', factionId: capture.factionId, settlementId: capture.settlementId, outcome: 'occupy' });
          if (!result.ok) throw new Error(result.error);
        }
      }
    }
    const resolving = performance.now();
    const result = applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId }, (phase, edge) => {
      if (edge === 'start') phaseStarts[phase] = performance.now();
      else phases[phase] = (phases[phase] ?? 0) + performance.now() - (phaseStarts[phase] ?? 0);
    });
    if (!result.ok) throw new Error(result.error);
    const duration = performance.now() - resolving;
    turnMs += duration;
    maxTurnMs = Math.max(maxTurnMs, duration);
    if (resumed && JSON.stringify(applyCommand(resumed, { type: 'endTurn', factionId: resumed.turnOwnerId })) !== JSON.stringify(result)) throw new Error('Resumed turn result/events diverged');
    if (turn === 49) resumed = deserializeGame(serializeGame(state));
    if (turn % 25 === 0 || turn === 99) { memory.push(process.memoryUsage().heapUsed); hashes.push(stateHash(state)); }
  }
  if (!resumed || stateHash(resumed) !== stateHash(state)) throw new Error('Fifty-turn continuation from midpoint save diverged');
  const saveStart = performance.now();
  const saved = serializeGame(state);
  const saveMs = performance.now() - saveStart;
  const restoreStart = performance.now();
  const restored = deserializeGame(saved);
  const loadMs = performance.now() - restoreStart;
  if (stateHash(restored) !== stateHash(state)) throw new Error('Benchmark save determinism failed');
  const view = getObservation(state, state.turnOwnerId);
  measurements.push({ size, mature, generatorVersion: state.world.generatorVersion, layout: state.world.layout, cells: state.world.width * state.world.height, factions: state.factions.length,
    initialArmies, initialFormations, armies: Object.keys(state.armies).length,
    formations: Object.values(state.armies).reduce((sum, army) => sum + army.formations.length, 0),
    largestArmyFormations: Math.max(0, ...Object.values(state.armies).map(army => army.formations.length)), settlements: Object.keys(state.settlements).length,
    generatedMs, turns: 100, averageEndTurnMs: turnMs / 100, maxEndTurnMs: maxTurnMs,
    averageAiAllFactionsMs: aiMs / 100, averageCommandResolutionMs: commandMs / 100,
    averageFullTurnWithoutSaveMs: (aiMs + commandMs + turnMs) / 100, commands, rejectedCommands, saveMs, loadMs,
    resumedTurnsVerified: 50, battleReportsRetained: state.battleReports.length,
    saveBytes: Buffer.byteLength(saved), fullObservationBytes: Buffer.byteLength(JSON.stringify(view)),
    heapSamplesMiB: memory.map(bytes => Math.round(bytes / 1048576)), hashes, saveHash: stateHash(state),
    averagePhaseMs: Object.fromEntries(Object.entries(phases).map(([phase, ms]) => [phase, ms / 100])),
    note: (mature ? 'Synthetic 1500/4000-singleton-army starting position; real command validation, AI, economy and movement for 100 turns. Field battles resolve when encountered.' : 'Young campaign with real AI; content roster reused for stress faction counts.') + ' AI timing includes observations using the production rotating eight-town detail window; fullObservationBytes is a separate unscoped diagnostic read. Army containers and canonical formations are counted separately: merging lowers container count without erasing formation workload. Victory project proposals are intentionally deferred for this 100-turn workload; full archived victory is benchmarked separately.' });
  }
}
// Keep the original kernel workload comparable when the campaign content roster grows.
const kernelUnitIds = ['unit.colonist', 'unit.scout', 'unit.guard'];
const formations = (startId: number): BattleFormation[] => Array.from({ length: 12 }, (_, i) => {
  const unit = UNITS.find(unit => unit.id === kernelUnitIds[i % kernelUnitIds.length])!;
  return { id: `army.${startId + i}`, unitId: unit.id, strength: unit.strength, maxStrength: unit.strength, morale: unit.morale, fatigue: 0, row: Math.floor(i / 5), column: i % 5, attack: unit.attack, armor: unit.armor, initiative: unit.initiative, range: unit.range };
});
const battleTimes: number[] = [];
for (let i = 0; i < 220; i++) {
  const started = performance.now();
  const result = autoResolveBattle(createBattle({ seed: 42 + i, terrain: 3, attacker: formations(1), defender: formations(13) }));
  if (!result.result) throw new Error('Battle benchmark did not finish');
  if (i >= 20) battleTimes.push(performance.now() - started);
}
battleTimes.sort((a, b) => a - b);
const siegeTimes: number[] = [], peaceTimes: number[] = [];
let conquestHash = '';
for (let i = 0; i < 55; i++) {
  const campaign = conquestCampaign();
  const player = CONQUEST_FIXTURE.playerFactionId, enemy = CONQUEST_FIXTURE.enemyFactionId;
  const replayed: { state?: GameState } = {};
  const issue = (command: GameCommand) => {
    const result = applyCommand(campaign, command);
    if (!result.ok) throw new Error('Conquest benchmark rejected: ' + result.error);
    if (replayed.state && !applyCommand(replayed.state, command).ok) throw new Error('Conquest benchmark mirror rejected');
  };
  issue({ type: 'declareWar', factionId: player, targetFactionId: enemy });
  issue({ type: 'besiege', factionId: player, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId });
  for (let turn = 0; turn < 3; turn++) issue({ type: 'endTurn', factionId: player });
  const siegeStart = performance.now();
  issue({ type: 'assault', factionId: player, settlementId: CONQUEST_FIXTURE.settlementId });
  issue({ type: 'autoResolveBattle', factionId: player });
  if (!campaign.pendingCapture) throw new Error('Benchmark settlement did not fall');
  if (i >= 5) siegeTimes.push(performance.now() - siegeStart);
  replayed.state = deserializeGame(serializeGame(campaign));
  issue({ type: 'resolveCapture', factionId: player, settlementId: CONQUEST_FIXTURE.settlementId, outcome: 'occupy' });
  // This small package timing includes commands on the resumed mirror (reported explicitly).
  const peaceStart = performance.now();
  issue({ type: 'proposePeace', factionId: player, targetFactionId: enemy, terms: { offerCoin: 20, requestCoin: 0, truceTurns: 10 } });
  issue({ type: 'respondPeace', factionId: enemy, offerId: campaign.diplomacy.offers[0]!.id, accept: true });
  if (i >= 5) peaceTimes.push(performance.now() - peaceStart);
  for (let turn = 0; turn < 11; turn++) issue({ type: 'endTurn', factionId: player });
  const hash = stateHash(campaign);
  if (stateHash(replayed.state) !== hash || stateHash(deserializeGame(serializeGame(campaign))) !== hash) throw new Error('Capture/peace continuation diverged');
  if (conquestHash && conquestHash !== hash) throw new Error('Conquest fixture is not repeatable');
  conquestHash = hash;
}
siegeTimes.sort((a, b) => a - b); peaceTimes.sort((a, b) => a - b);
const report = { measuredAt: new Date().toISOString(), saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  runtime: process.version, cpu: cpus()[0]?.model, os: platform() + ' ' + release(), measurements,
  movement: benchmarkMovement(),
  battleKernel: { iterations: 200, formationsPerSide: 12, unitIds: kernelUnitIds, medianMs: battleTimes[100], p95Ms: battleTimes[190], maxMs: battleTimes.at(-1) },
  conquestAndPeace: { iterations: 50, siegeAssaultMedianMs: siegeTimes[25], siegeAssaultP95Ms: siegeTimes[47], peacePackageWithMirrorMedianMs: peaceTimes[25], peacePackageWithMirrorP95Ms: peaceTimes[47], finalHash: conquestHash,
    note: 'Real blockade, militia assault, occupation, paid peace and treaty expiry. Capture-decision midpoint save plus 11 resumed turns verified every run. Siege timing excludes setup; peace timing includes separately applied mirror commands.' } };
if (process.argv.includes('--output')) writeFileSync('docs/performance/0029-campaign-scale.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
