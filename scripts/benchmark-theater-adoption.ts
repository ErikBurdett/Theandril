import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, SAVE_VERSION, serializeGame, stateHash } from '@theandril/sim';
import { MAX_THEATER_ADOPTION_HEARTHS, MAX_THEATER_ADOPTION_ROUTE_QUERIES, planDefenseTheater } from '../packages/ai/src/theaters';
import { MAX_PATH_NODES } from '../packages/sim/src/movement';
import { matureCampaign } from '../packages/test-fixtures/src';
import { rebaseAuthoredLand } from '../packages/test-fixtures/src/authored-land';

/** Local, isolated AI-planner measurement. Run in a quiet CPU window:
 * tsx scripts/benchmark-theater-adoption.ts --out evidence.json
 * All geography and the100-company owner are explicitly authored. */
type Size = 'huge' | 'legendary';
type Workload = 'reachable' | 'island-fallback' | 'all-blocked';
const argument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  if (index < 0) return undefined;
  const value = process.argv[index + 1];
  assert(value && !value.startsWith('--'), `${name} requires a value.`);
  return value;
};
const output = argument('--out'), selected = argument('--case');
const cases = (['huge', 'legendary'] as const).flatMap(size => (['reachable', 'island-fallback', 'all-blocked'] as const)
  .map(workload => ({ size, workload, name: `${size}-${workload}` })));
assert(!selected || cases.some(item => item.name === selected), 'Unknown --case.');
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const paths = ['scripts/benchmark-theater-adoption.ts', 'packages/ai/src/theaters.ts', 'packages/sim/src/movement.ts'];
const sources = paths.map(path => ({ path, sha256: sha256(readFileSync(path)) }));
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));

function prepare(size: Size, workload: Workload) {
  let state = matureCampaign(size);
  const owner = state.turnOwnerId, { width, height } = state.world;
  const home = Object.values(state.settlements).find(town => town.factionId === owner)!;
  // A bounded charted area keeps the real observed route search active. This
  // deliberately does not claim natural-map or4096-node worst-case coverage.
  state.world.terrain.fill(1); state.world.biome.fill(1); state.world.fertility.fill(60); state.world.waterDepth.fill(0);
  state.resources.deposits = {};
  const staging = 20 * width + 26;
  home.cell = 20 * width + 20;
  state.world.starts[0] = home.cell;
  const hearths = [home];
  for (const [x, y] of [[36, 20], [20, 36], [36, 36]]) {
    const id = `settlement.${state.nextId++}`;
    const town = { ...structuredClone(home), id, name: `Authored candidate ${id}`, cell: y! * width + x!, queue: [] };
    state.settlements[id] = town; hearths.push(town);
  }
  state.factions.forEach((faction, index) => {
    if (faction.id === owner) return;
    const cell = (height - 32 + Math.floor(index / 16) * 8) * width + 16 + index % 16 * 8;
    state.world.starts[index] = cell;
    for (const town of Object.values(state.settlements)) if (town.factionId === faction.id) town.cell = cell;
    for (const army of Object.values(state.armies)) if (army.factionId === faction.id) army.cell = cell;
  });
  for (const army of Object.values(state.armies)) if (army.factionId === owner) army.cell = staging;
  const guards = Object.values(state.armies).filter(army => army.factionId === owner && army.formations.every(formation => formation.unitId === 'unit.guard'));
  while (guards.length < 100) {
    const id = `army.${state.nextId++}`;
    const army = { id, factionId: owner, name: 'Authored spare company', cell: staging, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
    state.armies[id] = army; guards.push(army);
  }
  assert.equal(guards.length, 100);
  const isolated = workload === 'reachable' ? [] : workload === 'all-blocked' ? hearths : hearths.filter(town => town.id !== hearths[1]!.id);
  for (const town of isolated) for (const cell of neighbors(town.cell, width, height)) {
    state.world.terrain[cell] = 0; state.world.biome[cell] = 0; state.world.fertility[cell] = 0; state.world.waterDepth[cell] = 1;
  }
  state.explored[owner] = new Set<number>();
  for (let y = 14; y <= 42; y++) for (let x = 14; x <= 42; x++) state.explored[owner]!.add(y * width + x);
  rebaseAuthoredLand(state);
  state = deserializeGame(serializeGame(state));
  return { state, fallbackId: hearths[1]!.id };
}

function measure(size: Size, workload: Workload) {
  console.error(`Preparing ${size}-${workload}; setup, observation, hashes and command proofs are outside planner timings.`);
  const { state, fallbackId } = prepare(size, workload), owner = state.turnOwnerId, before = stateHash(state);
  const samplesMs: number[] = [], queries: number[] = [], targetNodes: number[] = [];
  let expectedPlan = '', finalPlan: ReturnType<typeof planDefenseTheater> | undefined, observationBytes = 0, observedCells = 0;
  for (let iteration = 0; iteration < 4; iteration++) {
    // Fresh observation identity per sample: route-query indexes from the
    // previous sample cannot make its initial query artificially cheap.
    const view = getObservation(state, owner, { landDetails: 'none', developmentCandidates: false });
    assert.deepEqual(view.theaters, []);
    const prior = JSON.stringify(view), start = performance.now(), plan = planDefenseTheater(view), elapsed = performance.now() - start;
    assert.equal(JSON.stringify(view), prior, 'The pure planner must not mutate permitted observations.');
    const serializedPlan = JSON.stringify({ ...plan, heldArmyIds: [...plan.heldArmyIds].sort() });
    if (expectedPlan) assert.equal(serializedPlan, expectedPlan, 'Independent samples must return the same proposals and diagnostics.');
    expectedPlan = serializedPlan; finalPlan = plan; observationBytes = Buffer.byteLength(prior); observedCells = view.cells.length;
    assert(plan.routeQueries > 0 && plan.routeQueries <= MAX_THEATER_ADOPTION_ROUTE_QUERIES);
    assert(plan.targetSearchExpandedNodes > 0 && plan.targetSearchExpandedNodes <= plan.routeQueries * MAX_PATH_NODES);
    if (workload === 'all-blocked') {
      assert.deepEqual(plan.commands, []); assert.equal(plan.heldArmyIds.size, 0);
      assert.equal(plan.routeQueries, MAX_THEATER_ADOPTION_ROUTE_QUERIES);
    } else {
      assert.equal(plan.commands.length, 1);
      const command = plan.commands[0]!;
      assert.equal(command.type, 'setTheater');
      if (command.type !== 'setTheater') throw new Error('Expected an ordinary theater adoption.');
      assert.equal(command.armyIds.length, 2);
      if (workload === 'island-fallback') assert.deepEqual(command.settlementIds, [fallbackId], 'Only the reachable alternative may be adopted.');
    }
    if (iteration) { samplesMs.push(elapsed); queries.push(plan.routeQueries); targetNodes.push(plan.targetSearchExpandedNodes); }
  }
  assert.equal(stateHash(state), before, 'Planning must not mutate canonical campaign state.');
  // Prove the returned real command and its next-turn delegated movement on an
  // independent strict-save copy. The measured baseline remains unassigned.
  const mirror = deserializeGame(serializeGame(state));
  for (const command of finalPlan!.commands) { const result = applyCommand(mirror, command); assert(result.ok, result.error); }
  let automaticAccepted = 0;
  if (finalPlan!.commands.length) {
    const ended = applyCommand(mirror, { type: 'endTurn', factionId: owner });
    assert(ended.ok, ended.error);
    const dispatches = mirror.theaters.flatMap(theater => theater.lastDispatches);
    assert(dispatches.length > 0 && dispatches.every(dispatch => dispatch.accepted), 'Adoption must produce reachable ordinary automatic movement.');
    automaticAccepted = dispatches.length;
  }
  const ordered = [...samplesMs].sort((a, b) => a - b);
  return { size, workload, synthetic: true, cells: state.world.terrain.length, factions: state.factions.length,
    globalArmies: Object.keys(state.armies).length, ownArmies: Object.values(state.armies).filter(army => army.factionId === owner).length,
    ownCombatCompanies: 100, candidateHearths: MAX_THEATER_ADOPTION_HEARTHS, observedCells, observationBytes,
    commands: finalPlan!.commands, commandBytes: bytes(finalPlan!.commands), warmups: 1, measuredSamples: 3,
    samplesMs, medianMs: ordered[1]!, minMs: ordered[0]!, maxMs: ordered[2]!, routeQueries: queries,
    targetSearchExpandedNodes: targetNodes, maxRouteQueries: MAX_THEATER_ADOPTION_ROUTE_QUERIES,
    pathNodeBudgetPerPreview: MAX_PATH_NODES, theoreticalCombinedRangeAndTargetNodeBound: MAX_THEATER_ADOPTION_ROUTE_QUERIES * MAX_PATH_NODES,
    canonicalHash: before, canonicalUnmutated: true, permittedObservationUnmutated: true, repeatedPlanExact: true,
    ordinaryCommandsAccepted: finalPlan!.commands.length, automaticAccepted };
}

const report = { version: 1, sourceRevision: process.env.BENCHMARK_REVISION ?? 'Uncommitted candidate; exact measured source hashes follow.', sources,
  saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH, node: process.version, platform: platform(), cpu: cpus()[0]?.model,
  scope: 'Absolute pure home-watch planner timing, one warmup plus three fresh-observation samples per authored case. No before-change speedup claim. Flat authored geography,100 own combat companies and four candidate hearths within mature Huge/Legendary entity populations; not natural geography or worst-case search saturation. Setup, observations, strict saves, hashing and command/automatic-movement proofs excluded. Each canonical preview first computes movement range and then target search within a shared4096-node cap; reported expandedNodes counts only target search. At most eight previews bound combined work to32768 expansions. One adoption-capable realm; excludes complete AI turns, whole campaigns, workers, browser and physical storage.',
  scenarios: cases.filter(item => !selected || item.name === selected).map(item => measure(item.size, item.workload)),
};
assert.deepEqual(paths.map(path => ({ path, sha256: sha256(readFileSync(path)) })), sources, 'Measured source files must remain unchanged.');
if (output) { const target = resolve(output); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report, null, 2));
