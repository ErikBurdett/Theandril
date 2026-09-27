import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH, type CampaignPace } from '../packages/content/src';
import { hexDistance, neighbors } from '../packages/mapgen/src';
import { planTurn } from '../packages/ai/src';
import { applyCommandForVersion, commandSchemaForVersion, createGame, deserializeGame, getObservation, serializeGameForVersion, stateHashForVersion, type GameCommand } from '../packages/sim/src';
import { withRules } from '../packages/sim/src/rules';

/** Exact headline setup and decision loop from measure-pacing.ts. This separate
 * local comparison changes neither policy nor prices and is never a CI job.
 * Both runs use this same source tree, selecting historical rules explicitly.
 * The retained rules32 compatibility fixtures independently prove old history.
 *
 * node --import tsx scripts/compare-theater-pacing.ts --out result.json
 * Optional: --case standard|long|epic; --source-context "reviewed pin/dirty scope".
 * --rules33 reruns current rules only and must reproduce the retained comparison.
 */
const argument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value.`);
  return value;
};
const output = argument('--out'), chosen = argument('--case'), rules33Only = process.argv.includes('--rules33');
const MAX_ROUNDS = 900;
const CASES: readonly { name: string; pace: CampaignPace; target: string }[] = [
  { name: 'headline-standard', pace: 'standard', target: 'about200 turns; DH-021 remains open' },
  { name: 'headline-long', pace: 'long', target: 'about300 turns; DH-021 remains open' },
  { name: 'headline', pace: 'epic', target: '350–400 turns' },
];
assert(!chosen || CASES.some(entry => entry.pace === chosen), '--case must be standard, long or epic.');
const selected = CASES.filter(entry => !chosen || entry.pace === chosen);
const sha256 = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
const baselinePath = 'docs/development/2026-09-27-defense-theaters/historical/manifest.json';
const baselineBytes = readFileSync(baselinePath);
const baseline = JSON.parse(baselineBytes.toString()) as { sourceRevision: string; version: number; contentHash: string };
assert.equal(baseline.version, 32);
assert.equal(baseline.contentHash, CONTENT_HASH);
function runtimeSources() {
  const paths: string[] = ['scripts/compare-theater-pacing.ts', 'scripts/measure-pacing.ts'];
  const collect = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'fixtures') collect(path); }
      else if (/\.(ts|json)$/.test(entry.name) && !/\.(test|benchmark)\.ts$/.test(entry.name)) paths.push(path);
    }
  };
  for (const name of ['ai', 'sim', 'mapgen', 'content']) collect(`packages/${name}/src`);
  const files = paths.sort().map(path => ({ path, sha256: sha256(readFileSync(path)) }));
  return { aggregateSha256: sha256(JSON.stringify(files)), files };
}
const sources = runtimeSources();
const comparisonPath = 'docs/development/2026-09-27-defense-theaters/pacing-comparison.json';
const comparisonBytes = rules33Only ? readFileSync(comparisonPath) : undefined;
const comparison = comparisonBytes ? JSON.parse(comparisonBytes.toString()) as {
  sources: { files: { path: string; sha256: string }[] };
  runs: { rulesVersion: number; configuration: { pace: CampaignPace }; finalHash: string; commandResultTraceSha256: string; finalTurn: number }[];
} : undefined;
if (comparison) {
  assert(!output || resolve(output) !== resolve(comparisonPath), 'Diagnostic output must preserve the original comparison.');
  const runtime = (files: typeof sources.files) => files.filter(file => file.path !== 'scripts/compare-theater-pacing.ts');
  assert.deepEqual(runtime(sources.files), runtime(comparison.sources.files), 'Only diagnostic harness changes may differ from the retained pacing comparison.');
  const expectedHashes = { standard: 'ac642f3c', long: '4e71d9eb', epic: '03dbe061' };
  for (const entry of CASES) assert.equal(comparison.runs.find(run => run.rulesVersion === 33 && run.configuration.pace === entry.pace)?.finalHash,
    expectedHashes[entry.pace as keyof typeof expectedHashes], 'Retained current-rules reference hash must match the original measured candidate.');
}

interface RefusalSample {
  turn: number; factionId: string; armyId: string; targetCell: number; memberCell: number | null;
  route: unknown; sourceHearth: unknown; targetHearth: unknown; theater: unknown;
  targetKnown: boolean; targetVisible: boolean; distance: number | null;
  memberMovement: number | null; movementBlocker: string | null;
  memberNeighbors: unknown[]; targetNeighbors: unknown[]; nearbyVisibleForeignArmies: unknown[];
}

function play(entry: typeof CASES[number], version: 32 | 33) {
  const configuration = { seed: 20260905, pace: entry.pace, size: 'standard' as const, factionCount: 12, rulesVersion: version };
  const state = createGame(configuration), started = performance.now();
  const initialHash = stateHashForVersion(state, version), initialRules32Hash = stateHashForVersion(state, 32);
  const trace = createHash('sha256'), eventCounts: Record<string, number> = {}, acceptedCommands: Record<string, number> = {};
  const refusals: { turn: number; command: GameCommand; error: string | undefined }[] = [];
  const adoptions: { turn: number; factionId: string; theaterId: string; members: number; hearths: number }[] = [];
  const automaticRefusalReasons: Record<string, { count: number; samples: RefusalSample[] }> = {};
  let diagnosticObservations = 0;
  let refused = 0, observations = 0, acceptedSetTheater = 0, automaticDispatches = 0, automaticRefusals = 0;
  let endTurnMovementQueuedEvents = 0, endTurnTheaterBlockedEvents = 0;
  let maxTheaters = 0, maxAssignedMembers = 0;
  // Assert the frozen command boundary without dispatching a fake order or
  // mutating the measured initial position.
  if (version === 32) {
    assert.equal(commandSchemaForVersion(32).safeParse({ type: 'setTheater', factionId: state.turnOwnerId, name: 'Forbidden historical control', settlementIds: ['settlement.example'], armyIds: ['army.2'], reserveCell: state.world.starts[0], guardsPerSettlement: 1, enabled: true }).success, false);
    assert.equal(commandSchemaForVersion(32).safeParse({ type: 'deleteTheater', factionId: state.turnOwnerId, theaterId: 'theater.1' }).success, false);
  }
  const plan = (factionId: string): GameCommand[] => withRules(state, version, () => {
    const view = getObservation(state, factionId);
    observations++;
    assert.equal(Object.hasOwn(view, 'theaters'), version === 33, 'The observation capability must match the selected rules.');
    const commands = planTurn(view);
    if (version === 32) assert(commands.every(command => command.type !== 'setTheater' && command.type !== 'deleteTheater'), 'Historical AI must propose no theater controls.');
    return commands;
  });
  const issue = (command: GameCommand): void => {
    const turn = state.turn, result = applyCommandForVersion(state, command, version);
    trace.update(JSON.stringify({ turn, command, result }) + '\n');
    if (!result.ok) {
      refused++;
      if (refusals.length < 20) refusals.push({ turn, command, error: result.error });
      console.error(`rules${version} ${entry.pace} refused at turn${turn}: ${JSON.stringify(command)}: ${result.error}`);
      return;
    }
    acceptedCommands[command.type] = (acceptedCommands[command.type] ?? 0) + 1;
    for (const event of result.events) eventCounts[event.type] = (eventCounts[event.type] ?? 0) + 1;
    if (command.type === 'setTheater') {
      assert.equal(result.events.filter(event => event.type === 'theater_saved').length, 1);
      acceptedSetTheater++;
      if (!command.theaterId) {
        const theater = state.theaters.find(item => item.factionId === command.factionId && item.name === command.name);
        assert(theater, 'Accepted adoption must create a real canonical theater.');
        adoptions.push({ turn, factionId: command.factionId, theaterId: theater.id, members: theater.armyIds.length, hearths: theater.settlementIds.length });
      }
    }
    if (command.type === 'endTurn') {
      // Accepted theater dispatches emit the normal movement_queued event. The
      // canonical latest-turn report identifies their source; reconcile it with
      // actual returned domain events instead of inferring use from metadata.
      const dispatches = state.theaters.filter(theater => theater.enabled && theater.lastRunTurn === state.turn).flatMap(theater => theater.lastDispatches);
      const accepted = dispatches.filter(dispatch => dispatch.accepted).length, blocked = dispatches.length - accepted;
      const queuedEvents = result.events.filter(event => event.type === 'movement_queued').length;
      const blockedEvents = result.events.filter(event => event.type === 'theater_dispatch_blocked').length;
      // This headline planner currently creates no postings/musters. Fail
      // explicitly if that changes, rather than misattribute their routes.
      assert.equal(state.postings.length + state.musters.length, 0, 'Other automatic posting routes require separate attribution.');
      assert.equal(queuedEvents, accepted, 'Every accepted automatic dispatch must emit a canonical queued-travel event.');
      assert.equal(blockedEvents, blocked, 'Every refused automatic dispatch must emit its canonical theater event.');
      automaticDispatches += queuedEvents; automaticRefusals += blockedEvents;
      endTurnMovementQueuedEvents += queuedEvents; endTurnTheaterBlockedEvents += blockedEvents;
      for (const theater of state.theaters.filter(item => item.enabled && item.lastRunTurn === state.turn)) {
        for (const dispatch of theater.lastDispatches.filter(item => !item.accepted)) {
          const reason = automaticRefusalReasons[dispatch.message] ??= { count: 0, samples: [] };
          reason.count++;
          if (reason.samples.length >= 3) continue;
          // Own observations only. Record bounded context, never hidden terrain,
          // foreign treasury or an unseen current foreign settlement owner.
          const view = withRules(state, version, () => getObservation(state, theater.factionId));
          diagnosticObservations++;
          const member = view.armies.find(army => army.id === dispatch.armyId && army.factionId === theater.factionId);
          const known = new Map(view.cells.map(cell => [cell.cell, cell]));
          const townAt = (cell: number | undefined) => {
            const town = view.settlements.find(town => town.cell === cell);
            return town ? { id: town.id, name: town.name, factionId: town.factionId, cell: town.cell, occupationTurns: town.occupationTurns } : null;
          };
          const surrounding = (cell: number | undefined) => cell === undefined ? [] : neighbors(cell, view.width, view.height).map(next => {
            const fact = known.get(next);
            return { cell: next, known: Boolean(fact), terrain: fact?.terrain ?? null, visible: fact?.visible ?? false, knownFactionId: fact?.factionId ?? null };
          });
          reason.samples.push({ turn: state.turn, factionId: theater.factionId, armyId: dispatch.armyId, targetCell: dispatch.targetCell, memberCell: member?.cell ?? null,
            route: structuredClone(view.routes.find(route => route.armyId === dispatch.armyId) ?? null), sourceHearth: townAt(member?.cell), targetHearth: townAt(dispatch.targetCell),
            theater: { id: theater.id, name: theater.name, settlementIds: [...theater.settlementIds], armyIds: [...theater.armyIds], reserveCell: theater.reserveCell, guardsPerSettlement: theater.guardsPerSettlement },
            targetKnown: known.has(dispatch.targetCell), targetVisible: known.get(dispatch.targetCell)?.visible ?? false,
            distance: member ? hexDistance(member.cell, dispatch.targetCell, view.width) : null, memberMovement: member?.movement ?? null, movementBlocker: member?.movementBlocker ?? null,
            memberNeighbors: surrounding(member?.cell), targetNeighbors: surrounding(dispatch.targetCell),
            nearbyVisibleForeignArmies: view.armies.filter(army => army.factionId !== theater.factionId && (hexDistance(army.cell, dispatch.targetCell, view.width) <= 2
              || member && hexDistance(army.cell, member.cell, view.width) <= 2)).slice(0, 8).map(army => ({ id: army.id, factionId: army.factionId, cell: army.cell, domain: army.domain })) });
        }
      }
    }
    maxTheaters = Math.max(maxTheaters, state.theaters.length);
    maxAssignedMembers = Math.max(maxAssignedMembers, state.theaters.reduce((sum, theater) => sum + theater.armyIds.length, 0));
    if (version === 32) { assert.equal(state.theaters.length, 0); assert.equal(state.nextTheaterId, 1); }
  };
  console.error(`Starting rules${version} ${entry.name}: standard map,12 realms,seed20260905,target ${entry.target}.`);
  for (let round = 0; round < MAX_ROUNDS && !state.victory; round++) {
    for (const faction of state.factions) {
      for (const command of plan(faction.id)) {
        issue(command);
        for (let decisions = 0; state.battle || state.pendingCapture; decisions++) {
          if (decisions >= 4) throw new Error('Pending tactical or capture decisions exceeded their bound.');
          if (state.battle) {
            const battle = state.battle;
            const controller = [battle.attackerFactionId, battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : battle.attackerFactionId;
            issue({ type: 'autoResolveBattle', factionId: controller });
          } else if (state.pendingCapture) {
            const choice = plan(state.pendingCapture.factionId)[0];
            if (!choice || choice.type !== 'resolveCapture') throw new Error('Missing capture choice.');
            issue(choice);
          }
        }
      }
    }
    issue({ type: 'endTurn', factionId: state.turnOwnerId });
    if ((round + 1) % 100 === 0) console.error(`rules${version} ${entry.pace}: turn${state.turn},${adoptions.length} adoptions,${automaticDispatches} accepted automatic dispatches.`);
  }
  const elapsedMs = performance.now() - started, hash = stateHashForVersion(state, version), save = serializeGameForVersion(state, version);
  assert.equal(stateHashForVersion(deserializeGame(save), version), hash, 'Final strict save roundtrip must retain the selected historical hash.');
  assert.equal(runtimeSources().aggregateSha256, sources.aggregateSha256, 'Runtime sources changed during the comparison; rerun against stable sources.');
  const result = { name: entry.name, rulesVersion: version, configuration, target: entry.target, generatorVersion: state.world.generatorVersion,
    cells: state.world.terrain.length, finalTurn: state.turn, victoryPath: state.victory?.path ?? 'none', winner: state.victory?.factionId ?? null,
    maxRounds: MAX_ROUNDS, refused, retainedRefusals: refusals, acceptedCommands, domainEventCounts: eventCounts, depots: state.depots.length,
    acceptedSetTheaterCount: acceptedSetTheater, acceptedTheaterCreations: adoptions.length, adoptedFactions: [...new Set(adoptions.map(item => item.factionId))].sort(), adoptions,
    endingTheaters: state.theaters.length, endingEnabledTheaters: state.theaters.filter(theater => theater.enabled).length,
    endingMembers: state.theaters.reduce((sum, theater) => sum + theater.armyIds.length, 0), maxTheaters, maxAssignedMembers,
    automaticDispatchCount: automaticDispatches, automaticRefusalCount: automaticRefusals, automaticAttemptCount: automaticDispatches + automaticRefusals,
    automaticRefusalReasons, diagnosticObservations,
    endTurnMovementQueuedEvents, endTurnTheaterBlockedEvents, dispatchEventsReconciled: true,
    theaterPolicyUsed: acceptedSetTheater > 0 && automaticDispatches > 0,
    observationsChecked: observations, historicalTheaterCapabilityAbsent: version === 32 ? true : null, historicalTheaterCommandsRejected: version === 32 ? true : null,
    initialHash, initialRules32Hash, finalHash: hash, finalSaveBytes: Buffer.byteLength(save), finalSaveSha256: sha256(save), strictFinalSaveRoundtrip: true,
    commandResultTraceSha256: trace.digest('hex'), elapsedMs };
  assert.equal(Object.values(automaticRefusalReasons).reduce((sum, reason) => sum + reason.count, 0), automaticRefusals);
  if (comparison) {
    const previous = comparison.runs.find(run => run.rulesVersion === version && run.configuration.pace === entry.pace);
    assert(previous, 'Every diagnostic run needs its retained comparison.');
    assert.equal(result.finalHash, previous.finalHash, 'Refusal instrumentation must preserve the exact final canonical hash.');
    assert.equal(result.finalTurn, previous.finalTurn);
    assert.equal(result.commandResultTraceSha256, previous.commandResultTraceSha256, 'Refusal instrumentation must preserve every command and result.');
  }
  console.error(`Finished rules${version} ${entry.pace}: turn${result.finalTurn},${result.victoryPath},${refused} refused;${acceptedSetTheater} accepted theater creations/edits;${automaticDispatches} accepted/${automaticRefusals} refused automatic routes.`);
  if (version === 33 && !result.theaterPolicyUsed) console.error(`NO ACTIVE THEATER ADOPTION for ${entry.pace}: do not count an idle metadata policy as measured gameplay.`);
  return result;
}

const report = {
  schemaVersion: 1, sourceContext: argument('--source-context') ?? 'Uncommitted candidate runtime sources; exact file fingerprints below, not a claimed published revision.',
  historicalBaselineRevision: baseline.sourceRevision, historicalManifestPath: baselinePath, historicalManifestSha256: sha256(baselineBytes), sources,
  contentHash: CONTENT_HASH, node: process.version, platform: platform(), cpu: cpus()[0]?.model,
  rules33Only, reproductionReference: comparisonBytes ? { path: comparisonPath, sha256: sha256(comparisonBytes), exactFinalHashesAndCommandResultTracesRequired: true } : null,
  scope: 'One seed for each of three standard-map12-realm headline paces, identical current source selecting frozen32 or current33 rules. Same unmodified planner except its observed theater capability. Canonical commands/events only; no policy tuning or injected adoption. Elapsed times are instrumented campaign runtimes, not allocator benchmarks. No complete archive/replay or multi-seed pacing confidence claim.',
  runs: [] as ReturnType<typeof play>[], comparisons: [] as { pace: CampaignPace; rules32Turn: number; rules33Turn: number; deltaTurns: number; sameInitialRules32Hash: boolean; rules33TheaterPolicyUsed: boolean }[],
};
const writeReport = () => { if (output) { const target = resolve(output); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(report, null, 2) + '\n'); } };
for (const entry of selected) {
  if (rules33Only) { report.runs.push(play(entry, 33)); writeReport(); continue; }
  const previous = play(entry, 32); report.runs.push(previous); writeReport();
  const current = play(entry, 33); report.runs.push(current);
  assert.equal(previous.initialRules32Hash, current.initialRules32Hash, 'Both rule versions must start from the same rules32-projected world state.');
  report.comparisons.push({ pace: entry.pace, rules32Turn: previous.finalTurn, rules33Turn: current.finalTurn, deltaTurns: current.finalTurn - previous.finalTurn,
    sameInitialRules32Hash: true, rules33TheaterPolicyUsed: current.theaterPolicyUsed });
  writeReport();
}
console.log(JSON.stringify(report, null, 2));
