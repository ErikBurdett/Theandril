/** Isolated AI retirement benchmark. Run only in the parent's quiet CPU window.
 * Authored post-capture worlds are stress fixtures, not organically earned empires. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { createJournal, replayArchive } from '../packages/chronicle/src';
import { pauseMovement } from '../packages/sim/src/movement';
import { MAX_PATROL_RECOVERY_COMMANDS, planPatrol } from '../packages/ai/src/patrols';
import { heldDelegatedArmyIds } from '../packages/ai/src/theaters';
import { matureCampaign } from '../packages/test-fixtures/src';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../packages/test-fixtures/src/authored-land';

type Size = 'huge' | 'legendary';
type Workload = 'visible-foreign-hearth' | 'hidden-foreign-hearth' | 'owned-hearth';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('node --import tsx scripts/benchmark-patrol-retirement.ts [--out=path.json] [--case=huge-visible-foreign-hearth] [--verify-only]\nSix Huge/Legendary visibility/ownership cases by default. One warmup and three samples; --verify-only checks one plan and command/replay boundaries without recording timing. Refuses output overwrite.');
  process.exit(0);
}
assert(args.every(arg => arg === '--verify-only' || /^--(out|case)=.+$/.test(arg)), 'Unknown option; use --help.');
const option = (key: string) => args.find(arg => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
const verifyOnly = args.includes('--verify-only');
const output = option('out') ?? `docs/development/2026-10-24-patrol-retirement/retirement-${verifyOnly ? 'verification' : 'benchmark'}.json`;
assert(!existsSync(output), 'Preserve earlier evidence; output already exists.');
const cases = (['huge', 'legendary'] as const).flatMap(size => (['visible-foreign-hearth', 'hidden-foreign-hearth', 'owned-hearth'] as const)
  .map(workload => ({ size, workload, name: `${size}-${workload}` })));
assert(!option('case') || cases.some(item => item.name === option('case')), 'Unknown --case.');
const paths = ['scripts/benchmark-patrol-retirement.ts', 'packages/ai/src/patrols.ts', 'packages/ai/src/patrol-recovery.ts', 'packages/ai/src/theaters.ts',
  'packages/sim/src/patrols.ts', 'packages/sim/src/movement.ts', 'packages/sim/src/visibility.ts', 'packages/chronicle/src/index.ts',
  'packages/test-fixtures/src/index.ts', 'packages/test-fixtures/src/authored-land.ts'];
const sources = () => paths.map(path => ({ path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }));
const sourceHashes = sources();

function prepare(size: Size, workload: Workload) {
  let game = matureCampaign(size);
  const owner = game.turnOwnerId, { width, height } = game.world;
  const first = 20 * width + 20, second = first + 6, distant = 20 * width + 46;
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.fertility.fill(60); game.world.waterDepth.fill(0);
  game.resources.deposits = {};
  const home = Object.values(game.settlements).find(town => town.factionId === owner)!;
  home.cell = first; game.world.starts[0] = first;
  const targetId = `settlement.${game.nextId++}`;
  game.settlements[targetId] = { ...structuredClone(home), id: targetId, name: 'Authored endpoint hearth', cell: second, queue: [] };
  for (const [index, faction] of game.factions.entries()) if (faction.id !== owner) {
    const cell = (height - 32 + Math.floor(index / 16) * 8) * width + 16 + index % 16 * 8;
    game.world.starts[index] = cell;
    for (const town of Object.values(game.settlements)) if (town.factionId === faction.id) town.cell = cell;
  }
  const guards = Object.values(game.armies).filter(army => army.factionId === owner && army.formations.every(formation => formation.unitId === 'unit.guard'));
  assert(guards.length <= 128, 'Authored own guard roster exceeds the patrol bound.');
  while (guards.length < 128) {
    const id = `army.${game.nextId++}`;
    const army = { id, factionId: owner, name: `Authored retirement company ${id}`, cell: first, movement: 0, formations: [createArmyFormation(id, 'unit.guard')] };
    game.armies[id] = army; guards.push(army);
  }
  const guardIds = new Set(guards.map(army => army.id));
  const foreignFactions = game.factions.filter(faction => faction.id !== owner), foreignCells: number[] = [];
  for (let y = 16; y <= 24; y++) for (let x = 41; x <= 51; x++) {
    const cell = y * width + x;
    if (cell !== distant && hexDistance(distant, cell, width) <= 4) foreignCells.push(cell);
  }
  assert(foreignCells.length >= foreignFactions.length);
  const cellByFaction = new Map(foreignFactions.map((faction, index) => [faction.id, foreignCells[index]!]));
  for (const army of Object.values(game.armies)) {
    army.cell = army.factionId !== owner ? cellByFaction.get(army.factionId)! : guardIds.has(army.id) ? first : distant;
    if (guardIds.has(army.id)) army.movement = 0;
  }
  // Dedicated real scouts create current permitted observations; they are not
  // patrol actors. Different foreign factions never share a stack cell.
  const endpointObserverId = `army.${game.nextId++}`, distantObserverId = `army.${game.nextId++}`;
  for (const [id, cell] of [[endpointObserverId, second - 1], [distantObserverId, distant]] as const) {
    game.armies[id] = { id, factionId: owner, name: `Authored observation scout ${id}`, cell, movement: 0,
      formations: [createArmyFormation(id, 'unit.scout')] };
  }
  // Full authored chart coverage exposes the retirement visibility-index cost.
  // Exploration is not current sight: the hidden foreign town must stay absent.
  game.explored[owner] = new Set<number>();
  for (let cell = 0; cell < width * height; cell++) game.explored[owner]!.add(cell);
  rebaseAuthoredLand(game); game = deserializeGame(serializeGame(game));
  const issue = (command: GameCommand) => { const result = applyCommand(game, command); assert(result.ok, `${command.type}: ${result.error}`); };
  for (const armyId of [...guardIds].sort()) {
    issue({ type: 'setPatrol', factionId: owner, armyId, firstCell: first, secondCell: second, enabled: true, pauseOnWar: false });
    issue({ type: 'queueMovement', factionId: owner, armyId, target: second });
    assert.equal(game.armies[armyId]!.cell, first, 'Exhausted companies must retain their full ordinary queued leg.');
    assert(game.routes[armyId]);
    pauseMovement(game, armyId, 'Authored interrupted home route before endpoint review.', []);
  }
  // Explicit stress setup, not an invented played capture: genuine conquest
  // history is covered by the separate retained turn150 regression.
  if (workload !== 'owned-hearth') game.settlements[targetId]!.factionId = foreignFactions[0]!.id;
  if (workload === 'hidden-foreign-hearth') game.armies[endpointObserverId]!.cell = distant;
  rebaseAuthoredLand(game); refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  return { game, guardIds, owner, first, second, targetId };
}

function measure(size: Size, workload: Workload) {
  console.error(`Preparing ${size}-${workload}; ${verifyOnly ? 'verification only, no timing' : 'setup and observation excluded from timing'}.`);
  const { game, guardIds, owner, first, second, targetId } = prepare(size, workload);
  const baseline = stateHash(game), positive = workload === 'visible-foreign-hearth';
  const samples: { elapsedMs: number; routeQueries: number; targetSearchExpandedNodes: number; commandCount: number }[] = [];
  let expected = '', finalPlan: ReturnType<typeof planPatrol> | undefined;
  let observedArmies = 0, observedForeignArmies = 0, uniqueForeignCells = 0, observedCells = 0, observationBytes = 0, targetVisible = false;
  for (let iteration = 0; iteration < (verifyOnly ? 1 : 4); iteration++) {
    const view = getObservation(game, owner, { landDetails: 'none', developmentCandidates: false });
    const foreigners = view.armies.filter(army => army.factionId !== owner);
    const target = view.settlements.find(town => town.id === targetId);
    targetVisible = view.cells.find(cell => cell.cell === second)?.visible === true;
    assert.equal(view.patrols?.length, 128); assert.equal(view.routes.length, 128);
    assert.equal(view.cells.length, game.world.terrain.length, 'Every authored world cell must be charted for the visibility-index workload.');
    assert(view.routes.every(route => route.status === 'paused' && route.waypoints.length === 1 && route.waypoints[0] === second));
    assert(view.patrols!.every(patrol => patrol.enabled && !patrol.pauseOnWar && patrol.status === 'waiting' && patrol.targetCell === second));
    assert(view.armies.filter(army => guardIds.has(army.id)).every(army => army.cell === first && army.movement === 0));
    assert.equal(hexDistance(first, second, view.width), 6);
    assert(view.settlements.some(town => town.cell === first && town.factionId === owner));
    if (workload === 'hidden-foreign-hearth') { assert.equal(targetVisible, false); assert.equal(target, undefined); }
    else { assert(targetVisible && target); assert.equal(target.factionId === owner, workload === 'owned-hearth'); }
    assert(foreigners.length >= (size === 'huge' ? 1400 : 3800), 'Real own observers must reveal the foreign population.');
    const before = JSON.stringify(view);
    const started = verifyOnly ? 0 : performance.now(), plan = planPatrol(view), elapsedMs = verifyOnly ? null : performance.now() - started;
    assert.equal(JSON.stringify(view), before, 'Planner mutated its permitted observation.');
    const serialized = JSON.stringify({ ...plan, heldArmyIds: [...plan.heldArmyIds].sort() });
    if (expected) assert.equal(serialized, expected, 'Repeated fresh observations changed proposal order or counters.');
    expected = serialized; finalPlan = plan;
    assert.equal(plan.heldArmyIds.size, 128, 'Keep all configured actors reserved until a fresh post-command plan.');
    assert.equal(plan.routeQueries, 0); assert.equal(plan.targetSearchExpandedNodes, 0);
    assert.equal(plan.commands.length, positive ? MAX_PATROL_RECOVERY_COMMANDS : 0);
    assert(plan.commands.every(command => command.type === 'clearPatrol' && guardIds.has(command.armyId)));
    if (iteration && elapsedMs !== null) samples.push({ elapsedMs, routeQueries: plan.routeQueries, targetSearchExpandedNodes: plan.targetSearchExpandedNodes, commandCount: plan.commands.length });
    observedArmies = view.armies.length; observedForeignArmies = foreigners.length;
    uniqueForeignCells = new Set(foreigners.map(army => army.cell)).size;
    observedCells = view.cells.length; observationBytes = Buffer.byteLength(before);
  }
  assert.equal(stateHash(game), baseline, 'Planner mutated canonical state.');
  // Actual commands, independent mirrors and replay stay outside measurement.
  const saved = serializeGame(game), mirror = deserializeGame(saved), repeat = deserializeGame(saved);
  assert.equal(serializeGame(mirror), saved);
  const journal = createJournal(mirror, { mode: 'watch', coverage: 'from-save' });
  const originalRoutes = structuredClone(mirror.routes), originalArmies = structuredClone(mirror.armies);
  const selected = new Set<string>();
  for (const command of finalPlan!.commands) {
    assert.equal(command.type, 'clearPatrol');
    if (command.type !== 'clearPatrol') throw new Error('Unexpected proposal.');
    selected.add(command.armyId);
    const result = journal.record(mirror, command); assert(result.ok, result.error);
    assert.deepEqual(applyCommand(repeat, command), result);
    assert.deepEqual(mirror.routes, originalRoutes, 'An ordinary clear must preserve every current route field.');
    assert.deepEqual(mirror.armies, originalArmies, 'Retirement must not move or alter armies.');
  }
  assert.deepEqual(mirror.patrols, game.patrols.filter(patrol => !selected.has(patrol.armyId)));
  const freshHeld = heldDelegatedArmyIds(getObservation(mirror, owner, { landDetails: 'none', developmentCandidates: false }));
  for (const armyId of guardIds) assert.equal(freshHeld.has(armyId), !selected.has(armyId));
  assert.equal(mirror.patrols.length, 128 - selected.size);
  const continuedHash = stateHash(mirror), continuedBytes = serializeGame(mirror);
  assert.equal(stateHash(repeat), continuedHash);
  assert.equal(stateHash(replayArchive(journal.materialize())), continuedHash);
  assert.equal(serializeGame(deserializeGame(continuedBytes)), continuedBytes);
  const times = samples.map(sample => sample.elapsedMs).sort((a, b) => a - b);
  return { size, workload, authored: true, cells: game.world.terrain.length, realms: game.factions.length,
    globalArmies: Object.keys(game.armies).length, ownedPatrols: guardIds.size, observedArmies, observedForeignArmies, uniqueForeignCells,
    observedCells, observationBytes, targetVisible, endpointDistance: 6, actorMovement: 0,
    warmups: verifyOnly ? 0 : 1, measuredSamples: samples.length, samples, medianMs: times[1] ?? null, minMs: times[0] ?? null, maxMs: times[2] ?? null,
    commands: finalPlan!.commands, commandLimit: MAX_PATROL_RECOVERY_COMMANDS, routeQueries: finalPlan!.routeQueries, targetSearchExpandedNodes: finalPlan!.targetSearchExpandedNodes,
    canonicalHash: baseline, continuedHash, canonicalUnmutated: true, observationUnmutated: true, deterministicPlansAndResults: true,
    ordinaryClearsAccepted: selected.size, unchangedRoutes: guardIds.size, retainedPolicies: mirror.patrols.length,
    sameBatchHeldActors: finalPlan!.heldArmyIds.size, freshObservationHeldActors: freshHeld.size, journalReplayExact: true, savedBytesExact: true };
}

const report = { scope: 'Absolute isolated planPatrol timing on fully charted authored Huge/Legendary post-capture states.128owned zero-movement guard companies receive real setPatrol and queueMovement commands between two six-hex-separated owned hearths, then canonical authored route pauses. Foreign ownership and observer relocation are explicitly authored before strict save validation; this is not a played conquest or an organically earned empire. Every world cell is explored to expose the one-pass visibility-index cost, but current sight remains restricted to actual sources: an explored hidden foreign town is absent from the permitted settlement roster. Dedicated own scouts reveal distant foreign stacks at one distinct cell per foreign faction. Visible foreign, hidden foreign and still-owned endpoints isolate cleanup while zero movement prevents existing recovery queries in the own control. One warmup and three fresh-observation samples unless --verify-only. Excludes setup, observations, serialization/hashing, assertions, command execution/replay, whole AI/turns, campaign pacing, worker transfer and rendering. No speedup, network, tail-latency or gameplay timing claim.',
  verificationOnly: verifyOnly, node: process.version, platform: platform(), cpu: cpus()[0]?.model, contentHash: CONTENT_HASH, sourceHashes,
  scenarios: cases.filter(item => !option('case') || item.name === option('case')).map(item => measure(item.size, item.workload)) };
assert.deepEqual(sources(), sourceHashes, 'Benchmark sources changed during execution.');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
