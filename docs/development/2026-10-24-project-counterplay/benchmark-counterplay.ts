/** Isolated counterplay benchmark. Timing requires the parent's quiet CPU window. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { performance } from 'node:perf_hooks';
import { BUILDINGS, CONTENT_HASH } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getBesiegePreview, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';
import { reviewProjectCounterplay } from '../../../packages/ai/src/project-counterplay';
import { planDiplomacy, protectedFactions } from '../../../packages/ai/src/diplomacy';
import { matureCampaign } from '../../../packages/test-fixtures/src';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../../../packages/test-fixtures/src/authored-land';

type Size = 'huge' | 'legendary';
type Workload = 'accepted' | 'hidden' | 'no-adjacent' | 'four-direct-quotes' | 'maintained-own-siege';
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('node --import tsx docs/development/2026-10-24-project-counterplay/benchmark-counterplay.ts [--verify-only] [--case=huge-accepted] [--out=path.json]\nTen Huge/Legendary cases including maintained own siege; one warmup and three fresh-observation samples. Verify-only records no timing. Refuses overwrite.');
  process.exit(0);
}
assert(args.every(arg => arg === '--verify-only' || /^--(out|case)=.+$/.test(arg)), 'Unknown option; use --help.');
const option = (key: string) => args.find(arg => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
const verifyOnly = args.includes('--verify-only');
const output = option('out') ?? `docs/development/2026-10-24-project-counterplay/counterplay-${verifyOnly ? 'verification-final' : 'benchmark-final'}.json`;
assert(!existsSync(output), 'Preserve earlier evidence: output already exists.');
const cases = (['huge', 'legendary'] as const).flatMap(size => (['accepted', 'hidden', 'no-adjacent', 'four-direct-quotes', 'maintained-own-siege'] as const).map(workload => ({ size, workload, name: `${size}-${workload}` })));
assert(!option('case') || cases.some(item => item.name === option('case')), 'Unknown case.');
const paths = ['docs/development/2026-10-24-project-counterplay/benchmark-counterplay.ts', 'packages/ai/src/project-counterplay.ts', 'packages/ai/src/diplomacy.ts', 'packages/ai/src/theaters.ts', 'packages/sim/src/siege-establishment.ts', 'packages/sim/src/siege.ts', 'packages/sim/src/simulation.ts', 'packages/sim/src/progression.ts', 'packages/sim/src/visibility.ts', 'packages/test-fixtures/src/index.ts', 'packages/test-fixtures/src/authored-land.ts', 'packages/chronicle/src/index.ts'];
const hashes = () => paths.map(path => ({ path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }));
const sourceHashes = hashes();

function prepare(size: Size) {
  let game = matureCampaign(size);
  game.pace = 'short';
  const owner = game.turnOwnerId, rival = game.factions.find(faction => faction.id !== owner)!.id;
  const { width, height } = game.world;
  const home = 20 * width + 20, hostCell = 20 * width + 60, distant = 20 * width + 100;
  game.world.terrain.fill(1); game.world.biome.fill(1); game.world.fertility.fill(60); game.world.waterDepth.fill(0);
  game.resources.deposits = {};
  for (const [index, faction] of game.factions.entries()) {
    const cell = faction.id === owner ? home : faction.id === rival ? hostCell : (height - 32 + Math.floor(index / 16) * 8) * width + 16 + index % 16 * 8;
    game.world.starts[index] = cell;
    for (const town of Object.values(game.settlements)) if (town.factionId === faction.id) town.cell = cell;
    for (const army of Object.values(game.armies)) if (army.factionId === faction.id) army.cell = cell;
  }
  const host = Object.values(game.settlements).find(town => town.factionId === rival)!;
  host.buildings = BUILDINGS.filter(building => !building.coastalOnly).map(building => building.id);
  for (let i = 1; i <= 2; i++) {
    const id = `settlement.${game.nextId++}`;
    game.settlements[id] = { ...structuredClone(host), id, name: `Authored project support ${i}`, cell: hostCell + i * 8, queue: [] };
  }
  game.factions.find(faction => faction.id === rival)!.knowledge = 1000;
  const guards = Object.values(game.armies).filter(army => army.factionId === owner && army.formations.every(formation => formation.unitId === 'unit.guard'));
  while (guards.length < 128) {
    const id = `army.${game.nextId++}`;
    const army = { id, factionId: owner, name: `Authored counterplay guard ${id}`, cell: home, movement: 3, formations: [createArmyFormation(id, 'unit.guard')] };
    game.armies[id] = army; guards.push(army);
  }
  assert.equal(guards.length, 128);
  const actors = guards.map(army => army.id).sort().slice(0, 4);
  game.explored[owner] = new Set(game.world.terrain.keys());
  rebaseAuthoredLand(game); game = deserializeGame(serializeGame(game));
  const initial = serializeGame(game), setupMirror = deserializeGame(initial), setupJournal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
  const commands: GameCommand[] = [];
  const issue = (command: GameCommand) => {
    const result = setupJournal.record(game, command); assert(result.ok, `${command.type}: ${result.error}`);
    assert.deepEqual(applyCommand(setupMirror, command), result); commands.push(command);
  };
  const fundsBefore = game.factions.find(faction => faction.id === rival)!.treasury;
  issue({ type: 'research', factionId: rival, technologyId: 'technology.civic_accounts' });
  issue({ type: 'adoptInstitution', factionId: rival, institutionId: 'institution.charter_compact' });
  issue({ type: 'startVictoryProject', factionId: rival, settlementId: host.id });
  const fundsAfter = game.factions.find(faction => faction.id === rival)!.treasury;
  assert.equal(fundsBefore - fundsAfter, 150);
  for (let i = 0; i < 4; i++) issue({ type: 'endTurn', factionId: owner });
  assert.equal(game.projects.length, 1); assert.equal(game.projects[0]!.progress, 4); assert.equal(game.projects[0]!.requiredTurns, 5); assert.equal(game.projects[0]!.status, 'active');
  assert.equal(serializeGame(game), serializeGame(setupMirror));
  assert.equal(serializeGame(replayArchive(setupJournal.materialize())), serializeGame(game));
  const setupHash = stateHash(game);
  // Final deployment is explicit authored stress setup, not ordinary movement
  // or a played conquest. It changes no project progress, prices or ownership.
  const foreignFactions = game.factions.filter(faction => faction.id !== owner), cells: number[] = [];
  for (let y = 16; y <= 24; y++) for (let x = 95; x <= 105; x++) {
    const cell = y * width + x;
    if (cell !== distant && hexDistance(distant, cell, width) <= 4) cells.push(cell);
  }
  assert(cells.length >= foreignFactions.length);
  const foreignCells = new Map(foreignFactions.map((faction, index) => [faction.id, cells[index]!]));
  for (const army of Object.values(game.armies)) if (army.factionId !== owner) army.cell = foreignCells.get(army.factionId)!;
  const observerIds: string[] = [];
  for (const cell of [hostCell - 3, distant]) {
    const id = `army.${game.nextId++}`; observerIds.push(id);
    game.armies[id] = { id, factionId: owner, name: 'Authored sight scout', cell, movement: 3, formations: [createArmyFormation(id, 'unit.scout')] };
  }
  for (const id of actors) game.armies[id]!.cell = hostCell - 1;
  const unrelated = guards.map(army => army.id).sort().slice(-3);
  game.armies[unrelated[2]!]!.movement = 0;
  refreshAuthoredSight(game); game = deserializeGame(serializeGame(game));
  const delegationCommands: GameCommand[] = [
    // Contact is real only after the authored observation deployment above.
    { type: 'declareWar', factionId: owner, targetFactionId: rival },
    { type: 'setPosting', factionId: owner, armyId: unrelated[0]!, cell: home, mode: 'hold' },
    { type: 'setPatrol', factionId: owner, armyId: unrelated[1]!, firstCell: home, secondCell: home + 2, enabled: false },
    { type: 'queueMovement', factionId: owner, armyId: unrelated[2]!, target: home + 4 },
  ];
  const deploymentMirror = deserializeGame(serializeGame(game)), deploymentJournal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
  for (const command of delegationCommands) {
    const result = deploymentJournal.record(game, command); assert(result.ok, result.error); assert.deepEqual(applyCommand(deploymentMirror, command), result);
  }
  assert.equal(serializeGame(game), serializeGame(deploymentMirror));
  assert.equal(serializeGame(replayArchive(deploymentJournal.materialize())), serializeGame(game));
  assert.equal(game.postings.length, 1); assert.equal(game.patrols.length, 1); assert.equal(Object.keys(game.routes).length, 1);
  return { saved: serializeGame(game), owner, rival, actors, hostId: host.id, hostCell, home, observerId: observerIds[0]!, setupHash, setupCommands: commands, delegationCommands, setupReplayExact: true, fundsBefore, fundsAfter };
}

function measure(base: ReturnType<typeof prepare>, size: Size, workload: Workload) {
  let game = deserializeGame(base.saved);
  const maintained = workload === 'maintained-own-siege';
  if (workload === 'hidden' || workload === 'no-adjacent') for (const id of base.actors) game.armies[id]!.cell = base.home;
  if (workload === 'hidden') game.armies[base.observerId]!.cell = base.home;
  refreshAuthoredSight(game); game = deserializeGame(serializeGame(game));
  const caseSetupCommands: GameCommand[] = maintained ? [
    { type: 'besiege', factionId: base.owner, armyId: base.actors[0]!, settlementId: base.hostId },
    { type: 'proposePeace', factionId: base.rival, targetFactionId: base.owner, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } },
  ] : [];
  if (maintained) {
    const mirror = deserializeGame(serializeGame(game)), journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
    for (const command of caseSetupCommands) {
      const result = journal.record(game, command); assert(result.ok, result.error); assert.deepEqual(applyCommand(mirror, command), result);
    }
    assert.equal(serializeGame(game), serializeGame(mirror)); assert.equal(serializeGame(game), serializeGame(replayArchive(journal.materialize())));
    assert.equal(game.projects[0]!.status, 'paused');
  }
  const initial = serializeGame(game), initialHash = stateHash(game), direct = workload === 'four-direct-quotes', positive = workload === 'accepted' || direct || maintained;
  const samples: number[] = [];
  let expected = '', commands: GameCommand[] = [], metadata: Record<string, number | boolean> = {};
  for (let iteration = 0; iteration < (verifyOnly ? 1 : 4); iteration++) {
    // Fresh observation identity makes the public query cache cold each sample.
    const view = getObservation(game, base.owner, { landDetails: 'none', developmentCandidates: false });
    const before = JSON.stringify(view), protectedIds = protectedFactions(view);
    assert.equal(view.cells.length, game.world.terrain.length);
    assert.equal(view.projects.length, 1); assert.equal(view.projects[0]!.progress, 4);
    const hostVisible = view.settlements.some(town => town.id === base.hostId);
    assert.equal(hostVisible, workload !== 'hidden');
    const started = verifyOnly ? 0 : performance.now();
    const result = direct ? base.actors.map(armyId => getBesiegePreview(view, armyId, base.hostId))
      : reviewProjectCounterplay(view, protectedIds);
    const elapsedMs = verifyOnly ? null : performance.now() - started;
    assert.equal(JSON.stringify(view), before);
    const serialized = JSON.stringify(result); if (expected) assert.equal(serialized, expected); expected = serialized;
    let queryCount: number, consideredProjects: number;
    if (Array.isArray(result)) {
      assert(result.every(quote => quote.canBesiege && quote.blocker === null));
      commands = result.map(quote => ({ type: 'besiege', factionId: base.owner, armyId: quote.armyId, settlementId: quote.settlementId }));
      queryCount = result.length; consideredProjects = 0;
    } else {
      commands = result.command ? [result.command] : []; queryCount = result.siegeQueries; consideredProjects = result.consideredProjects;
      assert.equal(commands.length, workload === 'accepted' ? 1 : 0);
      assert.equal(queryCount, workload === 'accepted' ? 1 : 0);
      assert.equal(consideredProjects, workload === 'hidden' ? 0 : 1);
      if (maintained) {
        assert.deepEqual(result.peaceBlockedFactionIds, [base.rival]);
        // Actual diplomatic rejection is verified outside the review timer.
        commands = planDiplomacy(view)!.commands;
        assert.deepEqual(commands, [{ type: 'respondPeace', factionId: base.owner, offerId: game.diplomacy.offers[0]!.id, accept: false }]);
      }
    }
    assert.equal(queryCount, direct ? 4 : workload === 'accepted' ? 1 : 0);
    if (iteration && elapsedMs !== null) samples.push(elapsedMs);
    metadata = { hostVisible, observedArmies: view.armies.length, observedForeignArmies: view.armies.filter(army => army.factionId !== base.owner).length,
      observedCells: view.cells.length, currentlyVisibleCells: view.cells.filter(cell => cell.visible).length, observationBytes: Buffer.byteLength(before), queryCount, consideredProjects };
  }
  assert.equal(serializeGame(game), initial);
  const branches = commands.length ? commands : [null];
  const boundaries = branches.map(command => {
    const branch = deserializeGame(initial), mirror = deserializeGame(initial), journal = createJournal(branch, { mode: 'watch', coverage: 'from-save' });
    const orders = { routes: structuredClone(branch.routes), postings: structuredClone(branch.postings), patrols: structuredClone(branch.patrols), theaters: structuredClone(branch.theaters) };
    const siegeBefore = structuredClone(branch.sieges);
    if (command) {
      const result = journal.record(branch, command); assert(result.ok, result.error); assert.deepEqual(applyCommand(mirror, command), result);
      assert.equal(branch.projects[0]!.status, 'paused'); assert.equal(branch.projects[0]!.progress, 4); assert.equal(branch.victory, null);
      assert.deepEqual({ routes: branch.routes, postings: branch.postings, patrols: branch.patrols, theaters: branch.theaters }, orders);
      if (maintained) {
        assert.deepEqual(branch.sieges, siegeBefore);
        const endTurn: GameCommand = { type: 'endTurn', factionId: branch.turnOwnerId };
        const advanced = journal.record(branch, endTurn); assert(advanced.ok, advanced.error); assert.deepEqual(applyCommand(mirror, endTurn), advanced);
        assert.equal(branch.projects[0]!.status, 'paused'); assert.equal(branch.projects[0]!.progress, 4); assert.equal(branch.victory, null);
        assert.equal(branch.sieges[base.hostId]!.factionId, base.owner);
        // Ordinary travel may advance on this end turn; only the rejection
        // boundary promises exact unchanged orders, not a frozen simulation.
      }
    }
    const saved = serializeGame(branch); assert.equal(saved, serializeGame(mirror)); assert.equal(saved, serializeGame(deserializeGame(saved)));
    assert.equal(saved, serializeGame(replayArchive(journal.materialize())));
    return { command, finalHash: stateHash(branch), exactReplay: true, exactSavedBytes: true, unchangedUnrelatedOrdersAtCommand: true, followingEndTurnVerified: maintained, projectStatus: branch.projects[0]!.status };
  });
  assert.equal(boundaries.filter(branch => branch.command).length, positive ? direct ? 4 : 1 : 0);
  const sorted = [...samples].sort((a, b) => a - b);
  return { size, workload, ...metadata, realms: game.factions.length, globalArmies: Object.keys(game.armies).length, ownedGuardCompanies: 128,
    activeProjects: game.projects.filter(project => project.status === 'active').length, pausedProjects: game.projects.filter(project => project.status === 'paused').length,
    initialHash, setupHash: base.setupHash, setupCommands: base.setupCommands, delegationCommands: base.delegationCommands, caseSetupCommands, setupReplayExact: base.setupReplayExact, paidInstitutionAndProjectCoin: base.fundsBefore - base.fundsAfter,
    unrelatedOrders: { postings: game.postings.length, patrols: game.patrols.length, routes: Object.keys(game.routes).length, theaters: game.theaters.length },
    warmups: verifyOnly ? 0 : 1, measuredSamples: samples.length, samplesMs: samples, minMs: sorted[0] ?? null, medianMs: sorted[1] ?? null, maxMs: sorted[2] ?? null,
    commands, boundaries, canonicalUnmutated: true, observationUnmutated: true, deterministicPlans: true,
    commandScope: direct ? 'Four independent saved branches; never four simultaneous sieges or four AI proposals.' : maintained ? 'Timed review emits no command; an untimed ordinary incoming rejection preserves the siege, followed by one real end turn.' : 'One isolated counterplay review.' };
}

const scenarios = [];
for (const size of ['huge', 'legendary'] as const) {
  const selected = cases.filter(item => item.size === size && (!option('case') || item.name === option('case')));
  if (!selected.length) continue;
  const base = prepare(size);
  for (const item of selected) scenarios.push(measure(base, size, item.workload));
}
assert.deepEqual(hashes(), sourceHashes, 'Source changed during benchmark.');
const report = { scope: 'Authored fully charted Huge/Legendary stress worlds with restricted current sight, 128 owned guard companies and a remote observed foreign roster. One rival project uses three authored developed hearths, ordinary paid research/institution/project and four real Short-pace turns to 4/5; final observer/army deployment is authored after that verified setup, then ordinary war follows actual contact. Eight-project/four-query cap proofs remain separate synthetic tests. Absolute cold-observation isolated planner/public-query cost; one warmup and three samples. Four direct quotes target the same host with distinct actors and each executes on its own saved branch. Maintained-siege cases use ordinary besiege/peace-offer setup, time only zero-query policy review, then verify an untimed ordinary rejection plus endTurn keeps the actual siege/project pause; unrelated orders are unchanged at rejection while normal travel may advance at endTurn. Excludes setup, observation construction, protected-faction set construction, assertions, save/hash/command/replay, full AI/turns, campaign pacing, worker and rendering. No speedup, organic-campaign, network or whole-scale acceptance claim.',
  verificationOnly: verifyOnly, node: process.version, platform: platform(), cpu: cpus()[0]?.model, contentHash: CONTENT_HASH, sourceHashes, scenarios };
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
