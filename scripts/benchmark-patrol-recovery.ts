/** Local isolated planner benchmark; run sequentially after campaign pacing.
 * Flat mature fixtures are authored stress observations, not earned empires. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, MAX_PATH_NODES, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { pauseMovement } from '../packages/sim/src/movement';
import { MAX_PATROL_RECOVERY_COMMANDS, MAX_PATROL_RECOVERY_ROUTE_QUERIES, planPatrol } from '../packages/ai/src/patrols';
import { matureCampaign } from '../packages/test-fixtures/src';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../packages/test-fixtures/src/authored-land';

type Size = 'huge' | 'legendary';
type Workload = 'distant-observed-hostiles' | 'nearby-observed-hostile';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('node --import tsx scripts/benchmark-patrol-recovery.ts [--out=path.json] [--case=huge-distant-observed-hostiles]\nFour Huge/Legendary safe/blocked cases by default. One warmup and three samples. Refuses to overwrite output.');
  process.exit(0);
}
assert(args.every(arg => /^--(out|case)=.+$/.test(arg)), 'Unknown option; use --help.');
const option = (key: string) => args.find(arg => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
const output = option('out') ?? 'docs/development/2026-10-24-patrol-recovery/recovery-benchmark.json';
assert(!existsSync(output), 'Preserve previous benchmark evidence; output already exists.');
const cases = (['huge', 'legendary'] as const).flatMap(size => (['distant-observed-hostiles', 'nearby-observed-hostile'] as const)
  .map(workload => ({ size, workload, name: `${size}-${workload}` })));
assert(!option('case') || cases.some(item => item.name === option('case')), 'Unknown --case.');
const paths = ['scripts/benchmark-patrol-recovery.ts', 'packages/ai/src/patrols.ts', 'packages/ai/src/patrol-recovery.ts', 'packages/ai/src/theaters.ts', 'packages/sim/src/movement.ts', 'packages/sim/src/patrols.ts', 'packages/test-fixtures/src/index.ts', 'packages/test-fixtures/src/authored-land.ts'];
const sources = () => paths.map(path => ({ path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }));
const sourceHashes = sources();

function prepare(size: Size, workload: Workload) {
  let game = matureCampaign(size);
  const owner = game.turnOwnerId, { width, height } = game.world;
  const first = 20 * width + 20, second = first + 12, distant = 20 * width + 46;
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.fertility.fill(60); game.world.waterDepth.fill(0);
  game.resources.deposits = {};
  const home = Object.values(game.settlements).find(town => town.factionId === owner)!;
  home.cell = first; game.world.starts[0] = first;
  const townId = `settlement.${game.nextId++}`;
  game.settlements[townId] = { ...structuredClone(home), id: townId, name: 'Authored eastern home', cell: second, queue: [] };
  for (const [index, faction] of game.factions.entries()) if (faction.id !== owner) {
    const cell = (height - 32 + Math.floor(index / 16) * 8) * width + 16 + index % 16 * 8;
    game.world.starts[index] = cell;
    for (const town of Object.values(game.settlements)) if (town.factionId === faction.id) town.cell = cell;
  }
  const guards = Object.values(game.armies).filter(army => army.factionId === owner && army.formations.every(formation => formation.unitId === 'unit.guard'));
  assert(guards.length <= 128, 'Fixture grew beyond the authored128-company roster.');
  while (guards.length < 128) {
    const id = `army.${game.nextId++}`;
    const army = { id, factionId: owner, name: `Authored recovery company ${id}`, cell: first, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
    game.armies[id] = army; guards.push(army);
  }
  const guardIds = new Set(guards.map(army => army.id));
  const foreignCells: number[] = [];
  for (let y = 16; y <= 24; y++) for (let x = 41; x <= 51; x++) {
    const cell = y * width + x;
    if (cell !== distant && hexDistance(distant, cell, width) <= 4) foreignCells.push(cell);
  }
  const foreignFactions = game.factions.filter(faction => faction.id !== owner);
  assert(foreignCells.length >= foreignFactions.length);
  const cellByFaction = new Map(foreignFactions.map((faction, index) => [faction.id, foreignCells[index]!]));
  // Keep original distant observers and all foreign forces real and visible.
  // No foreign observation or hidden cell is injected into the planner.
  for (const army of Object.values(game.armies)) {
    army.cell = army.factionId !== owner ? cellByFaction.get(army.factionId)! : guardIds.has(army.id) ? first : distant;
    if (guardIds.has(army.id)) army.movement = 3;
  }
  game.explored[owner] = new Set<number>();
  for (let y = 14; y <= 26; y++) for (let x = 14; x <= 52; x++) game.explored[owner]!.add(y * width + x);
  rebaseAuthoredLand(game); game = deserializeGame(serializeGame(game));
  const issue = (command: GameCommand) => { const result = applyCommand(game, command); assert(result.ok, `${command.type}: ${result.error}`); };
  for (const armyId of [...guardIds].sort()) {
    issue({ type: 'setPatrol', factionId: owner, armyId, firstCell: first, secondCell: second, enabled: true, pauseOnWar: false });
    issue({ type: 'queueMovement', factionId: owner, armyId, target: second });
    assert(game.routes[armyId], 'The actual leg must remain in flight after spending movement.');
    pauseMovement(game, armyId, 'New hostile forces or a hostile settlement were sighted nearby.', []);
    // Authored next-review budget, explicitly outside measured or campaign time.
    game.armies[armyId]!.movement = 3;
  }
  if (workload === 'nearby-observed-hostile') {
    const hostile = Object.values(game.armies).find(army => army.factionId !== owner)!;
    hostile.cell = game.armies[[...guardIds][0]!]!.cell + 1;
  }
  refreshAuthoredSight(game);
  // Contacts come from real own observers. Ordinary declarations populate the
  // public enemy relation; the distant mass is safe for the home-leg companies.
  for (const faction of game.factions) if (faction.id !== owner) issue({ type: 'declareWar', factionId: owner, targetFactionId: faction.id });
  game = deserializeGame(serializeGame(game));
  return { game, guardIds, owner, first, second };
}

function measure(size: Size, workload: Workload) {
  console.error(`Preparing ${size}-${workload}; setup and observation excluded from timing.`);
  const { game, guardIds, owner, first, second } = prepare(size, workload), baseline = stateHash(game);
  const samples: { elapsedMs: number; routeQueries: number; targetSearchExpandedNodes: number; commandCount: number }[] = [];
  let expected = '', finalPlan: ReturnType<typeof planPatrol> | undefined;
  let observedArmies = 0, observedHostiles = 0, uniqueHostileCells = 0, observedCells = 0, observationBytes = 0;
  for (let iteration = 0; iteration < 4; iteration++) {
    const view = getObservation(game, owner, { landDetails: 'none', developmentCandidates: false });
    const enemies = new Set(view.wars), hostiles = view.armies.filter(army => enemies.has(army.factionId));
    assert.equal(view.patrols?.length, 128);
    assert.equal(view.routes.length, 128);
    assert(view.routes.every(route => route.status === 'paused' && route.waypoints.length === 1 && route.waypoints[0] === second));
    assert(view.patrols!.every(patrol => patrol.enabled && patrol.status === 'waiting' && patrol.targetCell === second));
    assert(view.settlements.some(town => town.factionId === owner && town.cell === first));
    assert(view.settlements.some(town => town.factionId === owner && town.cell === second));
    assert(hostiles.length >= (size === 'huge' ? 1400 : 3800), 'Threat indexing requires the authored foreign population in permitted sight.');
    const localThreatened = view.armies.filter(army => guardIds.has(army.id)).filter(army => hostiles.some(enemy => hexDistance(army.cell, enemy.cell, view.width) <= army.sight)).length;
    assert.equal(localThreatened, workload === 'nearby-observed-hostile' ? 128 : 0);
    const before = JSON.stringify(view);
    const started = performance.now(), plan = planPatrol(view), elapsedMs = performance.now() - started;
    assert.equal(JSON.stringify(view), before, 'Planner mutated its permitted observation.');
    const serialized = JSON.stringify({ ...plan, heldArmyIds: [...plan.heldArmyIds].sort() });
    if (expected) assert.equal(serialized, expected, 'Fresh-observation samples must produce identical proposals and counters.');
    expected = serialized; finalPlan = plan;
    assert.equal(plan.heldArmyIds.size, 128, 'Recovery keeps every configured company reserved.');
    assert(plan.routeQueries <= MAX_PATROL_RECOVERY_ROUTE_QUERIES);
    assert(plan.commands.length <= MAX_PATROL_RECOVERY_COMMANDS);
    assert(plan.targetSearchExpandedNodes <= plan.routeQueries * MAX_PATH_NODES);
    if (workload === 'nearby-observed-hostile') {
      assert.equal(plan.routeQueries, 0); assert.deepEqual(plan.commands, []); assert.equal(plan.targetSearchExpandedNodes, 0);
    } else {
      assert.equal(plan.routeQueries, 4); assert.equal(plan.commands.length, 4);
      assert(plan.commands.every(command => command.type === 'resumeMovement' && guardIds.has(command.armyId)));
      assert(plan.targetSearchExpandedNodes > 0);
    }
    if (iteration) samples.push({ elapsedMs, routeQueries: plan.routeQueries, targetSearchExpandedNodes: plan.targetSearchExpandedNodes, commandCount: plan.commands.length });
    observedArmies = view.armies.length; observedHostiles = hostiles.length; uniqueHostileCells = new Set(hostiles.map(army => army.cell)).size;
    observedCells = view.cells.length; observationBytes = Buffer.byteLength(before);
  }
  assert.equal(stateHash(game), baseline, 'Planner mutated canonical state.');
  // Execute real proposals on two separate save copies, outside measurement.
  const bytes = serializeGame(game), mirror = deserializeGame(bytes), repeat = deserializeGame(bytes);
  const unchangedPatrols = structuredClone(mirror.patrols), selected = new Set<string>();
  for (const command of finalPlan!.commands) {
    assert.equal(command.type, 'resumeMovement');
    if (command.type !== 'resumeMovement') throw new Error('Unexpected proposal.');
    selected.add(command.armyId);
    const beforeCell = mirror.armies[command.armyId]!.cell;
    const result = applyCommand(mirror, command); assert(result.ok, result.error);
    assert.deepEqual(applyCommand(repeat, command), result);
    assert.notEqual(mirror.armies[command.armyId]!.cell, beforeCell, 'Accepted resume must actually advance this authored leg.');
  }
  assert.deepEqual(mirror.patrols, unchangedPatrols, 'Resume must preserve saved patrol policy.');
  for (const armyId of guardIds) if (!selected.has(armyId)) assert.deepEqual(mirror.routes[armyId], game.routes[armyId], 'Unselected paused routes remain exact.');
  const continuedHash = stateHash(mirror);
  assert.equal(stateHash(repeat), continuedHash);
  assert.equal(stateHash(deserializeGame(serializeGame(mirror))), continuedHash);
  const times = samples.map(sample => sample.elapsedMs).sort((a, b) => a - b);
  return { size, workload, authored: true, cells: game.world.terrain.length, realms: game.factions.length,
    globalArmies: Object.keys(game.armies).length, ownedPatrols: guardIds.size, observedArmies, observedHostiles, uniqueHostileCells,
    observedCells, observationBytes, warmups: 1, measuredSamples: 3, samples, medianMs: times[1], minMs: times[0], maxMs: times[2],
    commands: finalPlan!.commands, routeQueryLimit: MAX_PATROL_RECOVERY_ROUTE_QUERIES, commandLimit: MAX_PATROL_RECOVERY_COMMANDS,
    pathNodeBudgetPerPreview: MAX_PATH_NODES, combinedRangeAndTargetNodeBound: MAX_PATROL_RECOVERY_ROUTE_QUERIES * MAX_PATH_NODES,
    canonicalHash: baseline, continuedHash, canonicalUnmutated: true, observationUnmutated: true, deterministicPlansAndResults: true,
    ordinaryResumesAccepted: selected.size, untouchedPausedRoutes: guardIds.size - selected.size };
}

const report = { scope: 'Absolute isolated planPatrol recovery timing on authored Huge/Legendary mature populations. Each of128owned guard companies has an actual setPatrol and queueMovement leg, followed by canonical pauseMovement and an explicitly authored renewed movement budget. Flat land, two home hearths, many foreign armies visible through an own distant observer, ordinary declared wars. Each foreign faction occupies its own distinct cell within the distant observer\'s four-hex sight, optionally plus one nearby blocker: this measures indexing many observed entities and31/39distant hostile cells, not wide geographic threat distribution. One warmup and three fresh-observation samples. Excludes fixture setup, observation construction, hashing/serialization, assertions, command execution, complete AI turns, whole campaigns, worker transfer and rendering. Target expandedNodes excludes reachable-range work; each preview shares its4096-node cap between range and target search. No before-change speedup or worst-case path-search claim.',
  node: process.version, platform: platform(), cpu: cpus()[0]?.model, contentHash: CONTENT_HASH, sourceHashes,
  scenarios: cases.filter(item => !option('case') || item.name === option('case')).map(item => measure(item.size, item.workload)) };
assert.deepEqual(sources(), sourceHashes, 'Measured sources changed during benchmark.');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
