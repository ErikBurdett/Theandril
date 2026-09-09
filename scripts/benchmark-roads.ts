import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, createArmyFormation, createGame, deserializeGame, SAVE_VERSION, serializeGame, stateHash, type DomainEvent, type GameCommand, type GameState } from '@theandril/sim';
import { advanceRoads, observeRoads } from '../packages/sim/src/roads';
import { rebuildIndexes } from '../packages/sim/src/visibility';

const WARMUPS = 3, SAMPLES = 20, ACTIVE_STEPS = 20;
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
function invariant(value: unknown, message: string): asserts value { if (!value) throw new Error('Road benchmark: ' + message); }
function issue(game: GameState, command: GameCommand) {
  const result = applyCommand(game, command); invariant(result.ok, `${JSON.stringify(command)}: ${result.error}`); return result;
}
function restored(game: GameState): GameState {
  const save = serializeGame(game), result = deserializeGame(save);
  invariant(serializeGame(result) === save, 'strict save roundtrip changed bytes'); return result;
}
function statistics(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return { samplesMs: samples, meanMs: samples.reduce((sum, value) => sum + value, 0) / samples.length,
    medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]!, maxMs: sorted.at(-1)! };
}
function roadCounts(game: GameState) {
  const projects = Object.values(game.roads.projects), masks = Object.values(game.roads.edges);
  const bitCount = (mask: number): number => { let result = 0; for (; mask; mask &= mask - 1) result++; return result; };
  return { projects: projects.length, completedProjects: projects.filter(project => project.completed === project.path.length - 1).length,
    completedSegments: projects.reduce((sum, project) => sum + project.completed, 0), workProgress: projects.reduce((sum, project) => sum + project.progress, 0),
    totalPlannedSegments: projects.reduce((sum, project) => sum + project.path.length - 1, 0), maxPathCells: Math.max(0, ...projects.map(project => project.path.length)),
    roadCells: masks.length, physicalEdges: masks.reduce((sum, mask) => sum + bitCount(mask), 0) / 2,
    knownRoadCells: Object.values(game.roads.known).reduce((sum, known) => sum + Object.keys(known).length, 0), jsonBytes: Buffer.byteLength(JSON.stringify(game.roads)) };
}

/** Deliberately authored same local geometry at both map sizes. No roads or
 * progress are injected. All towns are founded through the public command API. */
function corridorCampaign(size: 'huge' | 'legendary', factionCount: number): GameState {
  let game = createGame({ seed: 20260905, size, factionCount, generatorVersion: 4, rosterVersion: 3, pace: 'epic' });
  game.world.terrain.fill(3); game.world.biome.fill(3); game.world.fertility.fill(50); game.world.waterDepth.fill(0);
  const founders: { factionId: string; oldId: string; newId: string }[] = [];
  for (const [index, faction] of game.factions.entries()) {
    const start = (24 + Math.floor(index / 8) * 16) * game.world.width + 24 + index % 8 * 32;
    game.world.starts[index] = start; game.explored[faction.id] = new Set();
    game.armies[`army.${index * 2 + 1}`]!.cell = start;
    game.armies[`army.${index * 2 + 2}`]!.cell = start + 6;
    const id = `army.${game.nextId++}`;
    game.armies[id] = { id, factionId: faction.id, name: 'Road charter caravan', cell: start + 12, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
    founders.push({ factionId: faction.id, oldId: `army.${index * 2 + 1}`, newId: id });
  }
  rebuildIndexes(game); game = restored(game);
  for (const founder of founders) {
    issue(game, { type: 'found', factionId: founder.factionId, armyId: founder.oldId, name: 'Lower Crossing' });
    issue(game, { type: 'found', factionId: founder.factionId, armyId: founder.newId, name: 'Upper Crossing' });
  }
  // Turn1 selects each older endpoint, which has no older same-realm target.
  // Turn2 is the first normal survey opportunity for every younger endpoint.
  issue(game, { type: 'endTurn', factionId: game.turnOwnerId });
  invariant(game.turn === 2 && !Object.keys(game.roads.projects).length, 'unexpected initial automatic road survey');
  return restored(game);
}

function workload(size: 'huge' | 'legendary', factionCount: number) {
  const base = corridorCampaign(size, factionCount), baseline = serializeGame(base), baselineHash = stateHash(base);
  // Rules15 adds optional specialist recruits; this retained roster3 road workload
  // recruits no specialists or casters, researches no magic and enters no battle.
  invariant(SAVE_VERSION === 16 && Object.values(base.arcaneResearch).every(discoveries => discoveries.length === 0) && Object.values(base.armies).every(army => army.formations.every(item => !['unit.skirmisher', 'unit.arbalester', 'unit.halberdier', 'unit.lancer'].includes(item.unitId))), 'review this retained road workload before another schema change');
  const planningMs: number[] = [], readMs: number[] = [];
  let expectedRoads = '', expectedEvents = '', planned: GameState | null = null;
  for (let sample = 0; sample < WARMUPS + SAMPLES; sample++) {
    // Full validation/restore happens outside the timer, not a patched phase or
    // a loop that silently stops surveying after the first successful sample.
    const game = deserializeGame(baseline), events: DomainEvent[] = [];
    const started = performance.now(); advanceRoads(game, events); const elapsed = performance.now() - started;
    const roads = JSON.stringify(game.roads), eventText = JSON.stringify(events);
    if (sample) invariant(roads === expectedRoads && eventText === expectedEvents, 'identical survey input changed roads/events');
    expectedRoads = roads; expectedEvents = eventText; planned = game;
    const counts = roadCounts(game);
    invariant(counts.projects === factionCount && counts.maxPathCells === 13 && counts.workProgress === factionCount, 'not one real12-segment survey per realm');
    invariant(events.filter(event => event.type === 'road_planned').length === factionCount, 'survey event count differs');
    const before = JSON.stringify(game.roads), readStarted = performance.now();
    const observations = game.factions.map(faction => observeRoads(game, faction.id));
    const readElapsed = performance.now() - readStarted;
    invariant(observations.every(roads => roads.length === 1 && roads[0]!.canAccelerate), 'an escort/ownership/treasury unexpectedly blocks the benchmark');
    invariant(JSON.stringify(game.roads) === before, 'road quotes mutated infrastructure');
    if (sample >= WARMUPS) { planningMs.push(elapsed); readMs.push(readElapsed); }
  }
  invariant(planned, 'missing surveyed state');
  invariant(serializeGame(base) === baseline, 'independent samples mutated their source');
  let game = restored(planned), mirror = restored(game);
  const plannedCounts = roadCounts(game), phaseMs: number[] = [], activeSamples: { step: number; activeProjects: number; before: ReturnType<typeof roadCounts>; after: ReturnType<typeof roadCounts>; eventCount: number }[] = [];
  const eventSeal = createHash('sha256');
  for (let step = 0; step < ACTIVE_STEPS; step++) {
    const before = roadCounts(game), activeProjects = game.factions.flatMap(faction => observeRoads(game, faction.id)).filter(project => project.canAccelerate).length;
    invariant(activeProjects === factionCount, 'phase workload became blocked or idle');
    const events: DomainEvent[] = [], mirrorEvents: DomainEvent[] = [];
    const started = performance.now(); advanceRoads(game, events); phaseMs.push(performance.now() - started);
    advanceRoads(mirror, mirrorEvents);
    invariant(JSON.stringify(mirrorEvents) === JSON.stringify(events) && JSON.stringify(mirror.roads) === JSON.stringify(game.roads), 'saved phase continuation diverged');
    eventSeal.update(JSON.stringify(events)); activeSamples.push({ step: step + 1, activeProjects, before, after: roadCounts(game), eventCount: events.length });
    if (step === Math.floor(ACTIVE_STEPS / 2) - 1) { game = restored(game); mirror = restored(mirror); }
  }
  // A normal paid public order and full-turn continuation validate that isolated
  // phase results remain ordinary, saveable canonical state, not a fake model.
  const payer = game.factions[0]!, quote = observeRoads(game, payer.id)[0]!;
  invariant(quote.canAccelerate, 'final payable segment unavailable');
  const beforeCoin = payer.treasury;
  const order: GameCommand = { type: 'accelerateRoad', factionId: payer.id, settlementId: quote.settlementId };
  invariant(JSON.stringify(issue(game, order)) === JSON.stringify(issue(mirror, order)), 'paid saved continuation differs');
  const chargedCost = beforeCoin - payer.treasury;
  invariant(chargedCost === quote.coinCost, 'paid continuation charged the wrong quote');
  const endOrder: GameCommand = { type: 'endTurn', factionId: game.turnOwnerId };
  invariant(JSON.stringify(issue(game, endOrder)) === JSON.stringify(issue(mirror, endOrder)), 'ordinary end-turn continuation differs');
  invariant(serializeGame(game) === serializeGame(mirror), 'final mirror bytes differ'); restored(game);
  const finalSave = serializeGame(game);
  return { size, factionCount, synthetic: true, cells: game.world.terrain.length, towns: Object.keys(game.settlements).length, armies: Object.keys(game.armies).length,
    exploredCells: Object.values(game.explored).reduce((sum, cells) => sum + cells.size, 0), generation: { version: 4, authored: 'All-hill uniform-biome world, same local12-segment corridors at both sizes; one independent scout at each corridor midpoint. Initial extra caravans are authored; both towns per realm use ordinary found commands. No whole-map reveal.' },
    baselineHash, baselineSaveBytes: Buffer.byteLength(baseline), planned: plannedCounts,
    surveyAndFirstWork: statistics(planningMs), allFactionRoadQuotes: statistics(readMs), activePhase: statistics(phaseMs), activeSamples,
    final: roadCounts(game), finalHash: stateHash(game), finalSaveBytes: Buffer.byteLength(finalSave), finalSaveSha256: sha(finalSave), phaseEventSha256: eventSeal.digest('hex'),
    paidContinuation: { command: order, quotedCost: quote.coinCost, chargedCost },
    verification: { deterministicSurveySamples: WARMUPS + SAMPLES, mirroredActivePhases: ACTIVE_STEPS, strictMidpoint: true, strictFinal: true, publicContinuationOrders: 2, rejectedCommands: 0 },
    bounds: { sourceLimits: { candidateEndpointsPerAttempt: 8, visitedNodesPerAttempt: 4096, pathCells: 129, surveyAttemptsPerRealmPerCall: 1 }, measuredMaxPathCells: plannedCounts.maxPathCells,
      note: 'Source limits are inspected production constants, not intrusive measured node counters. This nearby-target case does not establish saturated4096-node search throughput.' } };
}

const flags = process.argv.slice(2);
invariant(flags.every(flag => flag === '--output'), 'use only --output');
const results = [workload('huge', 32), workload('legendary', 32), workload('legendary', 40)];
const report = { measuredAt: new Date().toISOString(), runtime: process.version, cpu: cpus()[0]?.model, logicalCpus: cpus().length, ramBytes: totalmem(), saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  command: 'node --import tsx scripts/benchmark-roads.ts --output',
  scope: 'Standalone production advanceRoads and all-faction observeRoads. Survey samples each start from a fresh strictly validated identical snapshot (3 warmups +20 measured). Active samples are20 consecutive phase calls with every project still active; they are NOT20 full turns, and their turn counter stays fixed. Setup, validation, clones, JSON/hash comparison, mirrors and final ordinary paid/end-turn commands are excluded from timing. No AI/browser/render or giant full-campaign throughput claim.',
  memory: 'Save/roads UTF8 bytes are exact; process final memory is not peak or retained-memory evidence. Matched32-faction local roads differ only in global map size and cell row stride;40 is a separately labeled workload increase.',
  results, finalProcessMemory: process.memoryUsage() };
if (flags.includes('--output')) await writeFile(resolve('docs/performance/0027-roads.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
