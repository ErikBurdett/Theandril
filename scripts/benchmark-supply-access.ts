import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform, release } from 'node:os';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, getMovementPreview, getObservation, MAX_PATH_NODES, SAVE_VERSION, serializeGame, stateHash,
  type GameCommand, type GameState } from '@theandril/sim';
import { createJournal, replayArchive, resumeJournal } from '@theandril/chronicle';
import { advanceSupplyAccess, observeSupplyAccess, supplyAccessSources } from '../packages/sim/src/supply-access';
import { MAX_SUPPLY_ACCESS_IMPORTS, MAX_SUPPLY_ACCESS_OFFERS } from '../packages/sim/src/supply-access-state';
import { armySupply, observedSuppliedCells, observeSupply, previewSupplyAccessCells, suppliedCells } from '../packages/sim/src/supply';
import { answerSupplyAccess, MAX_SUPPLY_ACCESS_ROUTE_QUERIES, planSupplyAccess, SUPPLY_ACCESS_REQUEST_INTERVAL } from '../packages/ai/src/supply-access';
import { matureCampaign } from '../packages/test-fixtures/src';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../packages/test-fixtures/src/authored-land';

type Scale = 'huge' | 'legendary';
const args = process.argv.slice(2), smoke = args.includes('--smoke');
const aiOnly = args.includes('--ai-only');
const output = args.find(arg => arg.startsWith('--output='))?.slice(9);
assert(args.every(arg => arg === '--smoke' || arg === '--ai-only' || arg.startsWith('--output=')), 'Arguments: --smoke --ai-only --output=<path>');
const WARMUPS = 1, SAMPLES = smoke ? 1 : 3;
const options = { landDetails: 'none' as const, developmentCandidates: false };
const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const seal = (value: unknown) => sha256(JSON.stringify(value));
const timed = <T>(run: () => T) => { const start = performance.now(), value = run(); return { value, ms: performance.now() - start }; };
const distribution = (samplesMs: number[]) => {
  const sorted = [...samplesMs].sort((a, b) => a - b);
  return { samplesMs, medianMs: sorted[Math.floor(sorted.length / 2)]!, minMs: sorted[0]!, maxMs: sorted.at(-1)! };
};
const issue = (state: GameState, command: GameCommand) => {
  const result = applyCommand(state, command); assert(result.ok, `${JSON.stringify(command)}: ${result.error}`); return result;
};

/** Retains every generated terrain/resource cell and existing mature actor.
 * New buyer field forces are explicit setup, not organic overseas expansion. */
function fixture(size: Scale) {
  let state = matureCampaign(size);
  const owner = state.turnOwnerId, home = Object.values(state.settlements).find(town => town.factionId === owner)!;
  const geographicSeal = seal({ terrain: [...state.world.terrain], biome: [...state.world.biome], waterDepth: [...state.world.waterDepth],
    fertility: [...state.world.fertility], hydrology: [...state.world.hydrology], deposits: state.resources.deposits });
  const sites: { sourceId: string; providerId: string; armyId: string; cell: number; harbor: boolean }[] = [];
  // Prefer naturally coastal sources, then stable IDs. No water or deposit is
  // authored to create a port; land-only sources remain legitimate imports.
  const coastal = (cell: number) => neighbors(cell, state.world.width, state.world.height).some(next => state.world.terrain[next] === 0);
  const towns = Object.values(state.settlements).filter(town => town.factionId !== owner)
    .sort((a, b) => Number(coastal(b.cell)) - Number(coastal(a.cell)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const town of towns) {
    if (sites.length === MAX_SUPPLY_ACCESS_IMPORTS) break;
    if (hexDistance(town.cell, home.cell, state.world.width) <= 12
      || sites.some(site => site.providerId === town.factionId || hexDistance(site.cell, town.cell, state.world.width) <= 12)) continue;
    const cell = neighbors(town.cell, state.world.width, state.world.height).find(candidate => isPassable(state.world.terrain[candidate]!)
      && !Object.values(state.settlements).some(other => other.cell === candidate)
      && !Object.values(state.armies).some(army => army.cell === candidate));
    if (cell === undefined) continue;
    const armyId = `army.${state.nextId++}`;
    const formations = [armyId, `army.${state.nextId++}`, `army.${state.nextId++}`].map(id => createArmyFormation(id, 'unit.guard'))
      .sort((a, b) => a.id < b.id ? -1 : 1);
    state.armies[armyId] = { id: armyId, factionId: owner, name: `Authored supply witness ${sites.length + 1}`, cell, movement: 3, formations };
    const harbor = coastal(town.cell);
    if (harbor && !town.buildings.includes('building.harbor')) town.buildings.push('building.harbor');
    sites.push({ sourceId: town.id, providerId: town.factionId, armyId, cell: town.cell, harbor });
  }
  assert.equal(sites.length, MAX_SUPPLY_ACCESS_IMPORTS, 'Generated geography must offer eight separated visible providers.');
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  assert.equal(seal({ terrain: [...state.world.terrain], biome: [...state.world.biome], waterDepth: [...state.world.waterDepth],
    fertility: [...state.world.fertility], hydrology: [...state.world.hydrology], deposits: state.resources.deposits }), geographicSeal);
  const baseline = serializeGame(state), journal = createJournal(state, { mode: 'player', coverage: 'from-save' });
  const baselineReach = suppliedCells(state, owner);
  for (const site of sites) assert.equal(armySupply(state, site.armyId, baselineReach).supplied, false, 'Three-company witness must genuinely lack its own supply.');
  for (const site of sites) {
    const proposed = journal.record(state, { type: 'proposeSupplyAccess', factionId: owner, targetFactionId: site.providerId,
      settlementId: site.sourceId, feeCoin: 10, termTurns: 5 });
    assert(proposed.ok, proposed.error);
    const offer = state.supplyAccess.offers.find(record => record.source.settlementId === site.sourceId)!;
    const accepted = journal.record(state, { type: 'respondSupplyAccess', factionId: site.providerId, offerId: offer.id, accept: true });
    assert(accepted.ok, accepted.error);
  }
  assert.equal(state.supplyAccess.agreements.length, MAX_SUPPLY_ACCESS_IMPORTS);
  assert.equal(state.supplyAccess.nextId, 17);
  const active = serializeGame(state), archive = journal.materialize(), activeHash = stateHash(state);
  assert.equal(serializeGame(replayArchive(archive)), active);
  assert.equal(serializeGame(deserializeGame(active)), active);
  const activeReach = suppliedCells(state, owner);
  for (const site of sites) assert.equal(armySupply(state, site.armyId, activeReach).supplied, true, 'A paid source must feed its real witness force.');
  return { state, owner, sites, baseline, active, archive, activeHash, geographicSeal };
}

function readSamples(snapshot: string, owner: string, sites: ReturnType<typeof fixture>['sites']) {
  const raw: Record<string, number[]> = { sourceGraph: [], contractForecast: [], compactContractObservation: [], ownArmySupply: [], ownObservation: [] };
  let expectedSeal: string | undefined, facts: object = {};
  for (let sample = -WARMUPS; sample < SAMPLES; sample++) {
    const game = deserializeGame(snapshot), before = stateHash(game);
    const graph = timed(() => suppliedCells(game, owner));
    const forecast = timed(() => observedSuppliedCells(game, owner, graph.value));
    const compact = timed(() => observeSupplyAccess(game, owner));
    const armyStatus = timed(() => observeSupply(game, owner, graph.value));
    const observation = timed(() => getObservation(game, owner, options));
    const result = {
      actual: [...graph.value], forecast: [...forecast.value], compact: compact.value, armyStatus: armyStatus.value, observation: observation.value,
    };
    const actualSeal = seal(result); if (expectedSeal) assert.equal(actualSeal, expectedSeal); else expectedSeal = actualSeal;
    assert.equal(stateHash(game), before, 'Supply reads must not mutate canonical state.');
    assert.deepEqual(observation.value.supply, armyStatus.value);
    assert.deepEqual(observation.value.suppliedCells, [...forecast.value.keys()].sort((a, b) => a - b));
    facts = { inputHash: before, actualCells: graph.value.size, forecastCells: forecast.value.size,
      importedActualCells: [...graph.value.values()].filter(id => id.startsWith('supply-access.')).length,
      importedForecastCells: [...forecast.value.values()].filter(id => id.startsWith('supply-access.')).length,
      suppliedWitnesses: sites.filter(site => armyStatus.value.find(row => row.armyId === site.armyId)?.supplied).length,
      observedCells: observation.value.cells.length, observationBytes: Buffer.byteLength(JSON.stringify(observation.value)),
      compactObservationBytes: Buffer.byteLength(JSON.stringify(compact.value)), outputSha256: actualSeal, readOnlyHashMatched: true };
    if (sample >= 0) for (const [name, ms] of [['sourceGraph', graph.ms], ['contractForecast', forecast.ms], ['compactContractObservation', compact.ms],
      ['ownArmySupply', armyStatus.ms], ['ownObservation', observation.ms]] as const) raw[name]!.push(ms);
  }
  return { ...facts, timings: Object.fromEntries(Object.entries(raw).map(([name, values]) => [name, distribution(values)])) };
}

type Invalidation = 'war-command' | 'source-loss-phase' | 'expiry-phase';
function invalidationSamples(prepared: ReturnType<typeof fixture>, mode: Invalidation) {
  const { owner, active, sites } = prepared, first = sites[0]!;
  const raw: number[] = [], graphMs: number[] = [], forecastMs: number[] = [];
  let expectedSeal: string | undefined, facts: object = {};
  for (let sample = -WARMUPS; sample < SAMPLES; sample++) {
    const game = deserializeGame(active);
    let sourceLossSetup: { previousOwner: string; newOwner: string; displacedArmyIds: string[]; from: number; to: number | null } | null = null;
    // Isolated lifecycle inputs are explicit boundary setup, not a claim that
    // the benchmark fought a capture or timed an entire economic end turn.
    if (mode === 'source-loss-phase') {
      const successor = game.factions.find(faction => faction.id !== owner && !sites.some(site => site.providerId === faction.id));
      assert(successor, 'The source-loss boundary needs a separate successor realm.');
      const town = game.settlements[first.sourceId]!;
      const displaced = Object.values(game.armies).filter(army => army.cell === town.cell).sort((a, b) => a.id < b.id ? -1 : 1);
      const occupied = new Set(Object.values(game.armies).map(army => army.cell));
      const settled = new Set(Object.values(game.settlements).map(settlement => settlement.cell));
      const destination = displaced.length ? neighbors(town.cell, game.world.width, game.world.height).sort((a, b) => a - b)
        .find(cell => isPassable(game.world.terrain[cell]!) && !occupied.has(cell) && !settled.has(cell)) : undefined;
      assert(!displaced.length || destination !== undefined, 'The source-loss boundary needs empty neighboring land for its previous garrison.');
      sourceLossSetup = { previousOwner: town.factionId, newOwner: successor.id, displacedArmyIds: displaced.map(army => army.id), from: town.cell, to: destination ?? null };
      // The mature fixture stations guards on its hearth. A changed owner with
      // that foreign garrison still present is not a legal saved boundary.
      // Explicitly displace it onto unchanged empty land, outside all timing;
      // this authors no battle, retreat command, casualties or new allegiance.
      for (const army of displaced) {
        assert(army.factionId === town.factionId && !game.routes[army.id] && !game.transports[army.id], 'Only idle original garrison members may be displaced by this fixture.');
        army.cell = destination!;
      }
      town.factionId = successor.id;
      rebaseAuthoredLand(game);
      assert.equal(seal({ terrain: [...game.world.terrain], biome: [...game.world.biome], waterDepth: [...game.world.waterDepth],
        fertility: [...game.world.fertility], hydrology: [...game.world.hydrology], deposits: game.resources.deposits }), prepared.geographicSeal);
    }
    if (mode === 'expiry-phase') game.turn = game.supplyAccess.agreements[0]!.expiresTurn;
    const invalidated = mode === 'war-command'
      ? timed(() => issue(game, { type: 'declareWar', factionId: owner, targetFactionId: first.providerId }).events)
      : timed(() => advanceSupplyAccess(game));
    const graph = timed(() => suppliedCells(game, owner));
    const forecast = timed(() => observedSuppliedCells(game, owner, graph.value));
    const agreements = mode === 'expiry-phase' ? 0 : 7;
    assert.equal(game.supplyAccess.agreements.length, agreements);
    assert.equal(supplyAccessSources(game, owner).length, agreements);
    assert.equal(armySupply(game, first.armyId, graph.value).supplied, false);
    assert.equal([...graph.value.values()].some(id => id === 'supply-access.2'), false);
    assert.equal([...forecast.value.values()].some(id => id === 'supply-access.2'), false);
    const hash = stateHash(game), value = { hash, events: invalidated.value, actual: [...graph.value], forecast: [...forecast.value] };
    const outputSeal = seal(value); if (expectedSeal) assert.equal(outputSeal, expectedSeal); else expectedSeal = outputSeal;
    assert.equal(stateHash(deserializeGame(serializeGame(game))), hash, 'Post-invalidation state must remain a strict save.');
    facts = { mode, afterHash: hash, agreementsRemaining: agreements, sourcesRemaining: supplyAccessSources(game, owner).length,
      lapsedEvents: invalidated.value.filter(event => event.type === 'supply_access_lapsed').length,
      actualCells: graph.value.size, forecastCells: forecast.value.size,
      firstWitnessSupplied: false, sourceLossSetup, outputSha256: outputSeal, strictSaveRoundtrip: true };
    if (sample >= 0) { raw.push(invalidated.ms); graphMs.push(graph.ms); forecastMs.push(forecast.ms); }
  }
  return { ...facts, timings: { invalidation: distribution(raw), actualSourceGraph: distribution(graphMs), contractForecast: distribution(forecastMs) } };
}

function continuationProof(prepared: ReturnType<typeof fixture>) {
  const { active, archive, owner, sites } = prepared;
  const game = deserializeGame(active), mirror = deserializeGame(active), journal = resumeJournal(game, archive);
  const commands: GameCommand[] = Array.from({ length: 5 }, () => ({ type: 'endTurn', factionId: owner }));
  for (const command of commands) {
    const result = journal.record(game, command); assert(result.ok, result.error);
    assert.deepEqual(applyCommand(mirror, command), result); assert.equal(stateHash(mirror), stateHash(game));
  }
  assert.equal(game.supplyAccess.agreements.length, 0, 'Five ordinary turns must really expire five-turn agreements.');
  const endHash = stateHash(game), saved = serializeGame(game), finalArchive = journal.materialize();
  assert.equal(serializeGame(replayArchive(finalArchive)), saved); assert.equal(serializeGame(deserializeGame(saved)), saved);
  const war = deserializeGame(active), warJournal = resumeJournal(war, archive);
  assert(warJournal.record(war, { type: 'declareWar', factionId: owner, targetFactionId: sites[0]!.providerId }).ok);
  assert.equal(war.supplyAccess.agreements.length, 7);
  assert.equal(serializeGame(replayArchive(warJournal.materialize())), serializeGame(war));
  return { originalRecords: archive.records.length, originalArchiveSha256: seal(archive), continuationCommands: commands.length,
    finalRecords: finalArchive.records.length, finalHash: endHash, finalArchiveSha256: seal(finalArchive),
    exactSavedMirror: true, fullReplayMatches: true, strictSaveMatches: true,
    actualExpiryViaEndTurns: true, ordinaryWarReplayHash: stateHash(war),
    sourceLossLimit: 'Ownership-loss measurement starts at an explicitly authored lifecycle boundary. Original guards are relocated together onto empty neighboring land, preserving their faction, formations and unchanged generated geography. No battle, retreat command, casualties or capture acceptance is claimed by this benchmark.' };
}

/** Reuses the exact pre-contract fixture. The veto variant retains every
 * source in ordinary sight but authors one needy force next to its actual own
 * line. Other witness containers forage, so they cannot hide a failed veto. */
function plannerSamples(prepared: ReturnType<typeof fixture>, variant: 'useful-source' | 'nearer-own-line') {
  const { owner, sites } = prepared;
  let setup = deserializeGame(prepared.baseline);
  const slot = [...owner].reduce((total, char) => total + char.charCodeAt(0), 0) % SUPPLY_ACCESS_REQUEST_INTERVAL;
  while (setup.turn % SUPPLY_ACCESS_REQUEST_INTERVAL !== slot) setup.turn++;
  let ownRoute: { armyId: string; target: number; cost: number; steps: number; targetSearchExpandedNodes: number } | null = null;
  if (variant === 'nearer-own-line') {
    const first = sites[0]!, field = setup.armies[first.armyId]!, originalCell = field.cell;
    for (const site of sites.slice(1)) setup.armies[site.armyId]!.formations = setup.armies[site.armyId]!.formations.slice(0, 1);
    const sightKeeper = Object.values(setup.armies).filter(army => army.factionId === owner && army.formations.length === 1 && !sites.some(site => site.armyId === army.id))
      .sort((a, b) => a.id < b.id ? -1 : 1)[0]!;
    sightKeeper.cell = originalCell;
    const own = suppliedCells(setup, owner), towns = new Set(Object.values(setup.settlements).map(town => town.cell));
    const occupied = new Set(Object.values(setup.armies).map(army => army.cell));
    const candidate = [...own.keys()].sort((a, b) => a - b).flatMap(target => neighbors(target, setup.world.width, setup.world.height)
      .filter(cell => !own.has(cell) && isPassable(setup.world.terrain[cell]!) && !towns.has(cell) && !occupied.has(cell)
        && sites.every(site => hexDistance(cell, site.cell, setup.world.width) > 10)).map(cell => ({ cell, target })))[0];
    assert(candidate, 'Generated home must have an empty land approach outside its own supply line.');
    field.cell = candidate.cell; refreshAuthoredSight(setup); setup = deserializeGame(serializeGame(setup));
    const view = getObservation(setup, owner, options), route = getMovementPreview(view, first.armyId, candidate.target);
    assert(!armySupply(setup, first.armyId).supplied, 'Veto input must contain a genuinely needy field force.');
    assert(route.canQueue && route.action === 'move', 'The nearer own line must have a real permitted route.');
    assert.equal(suppliedCells(setup, owner).has(candidate.target), true);
    assert.equal(sites.filter(site => view.settlements.some(town => town.id === site.sourceId)).length, 8);
    for (const site of sites) assert(previewSupplyAccessCells(view, site.sourceId).every(cell => hexDistance(field.cell, cell, view.width) > 1), 'Foreign supply must be farther than the adjacent own line.');
    ownRoute = { armyId: first.armyId, target: candidate.target, cost: route.cost, steps: route.path.length, targetSearchExpandedNodes: route.expandedNodes };
  }
  const snapshot = serializeGame(setup), baselineHash = stateHash(setup), forecastIds = sites.slice(0, 4).map(site => site.sourceId);
  const forecastMs: number[] = [], plannerMs: number[] = [];
  let outputSeal: string | undefined, facts: object = {}, proof: object | null = null;
  for (let sample = -WARMUPS; sample < SAMPLES; sample++) {
    const game = deserializeGame(snapshot), forecastView = getObservation(game, owner, options);
    assert.equal(forecastIds.filter(id => forecastView.settlements.some(town => town.id === id)).length, 4);
    const forecasts = timed(() => forecastIds.map(id => ({ sourceId: id, cells: previewSupplyAccessCells(forecastView, id) })));
    // A separate fresh permitted observation prevents the forecast timing from
    // warming the prospective-query or movement indexes for the planner sample.
    const view = getObservation(game, owner, options), planned = timed(() => planSupplyAccess(view));
    assert.equal(stateHash(game), baselineHash, 'AI and prospective reads must not mutate canonical state.');
    if (variant === 'nearer-own-line') assert.equal(planned.value, null);
    else assert.equal(planned.value?.commands.length, 1, 'The ordinary planner must actually propose a useful contract.');
    const result = { forecasts: forecasts.value, plan: planned.value ? { commands: planned.value.commands, reasons: planned.value.reasons, heldArmyIds: [...planned.value.heldArmyIds].sort() } : null };
    const currentSeal = seal(result); if (outputSeal) assert.equal(currentSeal, outputSeal); else outputSeal = currentSeal;
    if (sample === 0 && planned.value) {
      const command = planned.value.commands[0]!, held = [...planned.value.heldArmyIds][0]!;
      assert.equal(command.type, 'proposeSupplyAccess');
      if (command.type !== 'proposeSupplyAccess') throw new Error('Expected a canonical supply proposal.');
      assert.equal(armySupply(game, held).supplied, false);
      assert(previewSupplyAccessCells(view, command.settlementId).includes(game.armies[held]!.cell), 'The selected source must feed this witness where it actually stands.');
      const journal = createJournal(game, { mode: 'player', coverage: 'from-save' }), buyerBefore = game.factions.find(faction => faction.id === owner)!.treasury;
      assert(journal.record(game, command).ok);
      const response = answerSupplyAccess(getObservation(game, command.targetFactionId, options))?.commands[0];
      assert(response?.type === 'respondSupplyAccess' && response.accept, 'The provider must accept through its ordinary observed policy.');
      assert(journal.record(game, response).ok);
      assert.equal(game.factions.find(faction => faction.id === owner)!.treasury, buyerBefore - command.feeCoin);
      assert.equal(armySupply(game, held).supplied, true);
      const saved = serializeGame(game); assert.equal(serializeGame(replayArchive(journal.materialize())), saved);
      assert.equal(serializeGame(deserializeGame(saved)), saved);
      proof = { command, response, heldArmyId: held, paidCoin: command.feeCoin, actualWitnessSupplied: true, journalRecords: journal.materialize().records.length,
        afterHash: stateHash(game), fullReplayMatches: true, strictSaveMatches: true };
    }
    facts = { variant, inputHash: baselineHash, observedCells: view.cells.length, observationBytes: Buffer.byteLength(JSON.stringify(view)),
      forecastSources: forecastIds, forecastCellCounts: forecasts.value.map(row => row.cells.length), forecastBytes: Buffer.byteLength(JSON.stringify(forecasts.value)),
      proposalCount: planned.value?.commands.length ?? 0, heldArmyIds: planned.value ? [...planned.value.heldArmyIds].sort() : [], outputSha256: currentSeal, readOnlyHashMatched: true };
    if (sample >= 0) { forecastMs.push(forecasts.ms); plannerMs.push(planned.ms); }
  }
  return { ...facts, timings: { fourSourceForecasts: distribution(forecastMs), supplyPlanner: distribution(plannerMs) }, ordinaryPurchaseProof: proof, verifiedOwnReturnRoute: ownRoute,
    routeQueryAccounting: { actualPlannerQueryCount: null, reason: 'Planner internals are not instrumented; no measured query count is claimed.',
      configuredMaximumQueries: MAX_SUPPLY_ACCESS_ROUTE_QUERIES, maximumCombinedSearchNodes: MAX_SUPPLY_ACCESS_ROUTE_QUERIES * MAX_PATH_NODES },
    setup: variant === 'nearer-own-line' ? 'Same baseline; one authored witness relocated just outside its actual own line, seven witness formations reduced to single-company foragers, one existing scout/guard retains the first foreign source in sight. Generated terrain/resources remain unchanged. The measured turn is explicitly aligned to the ordinary ten-turn purchase cadence.'
      : 'Same baseline before its eight contracts; measured turn explicitly aligned to the ordinary ten-turn purchase cadence. All eight authored overseas witnesses and source sightings remain. No offered, accepted or supplied result is injected.' };
}

function measure(size: Scale) {
  console.error(`Preparing ${size}: generated geography, eight authored witnesses, actual paid imports; setup is outside timing.`);
  const prepared = fixture(size);
  const ai = (['useful-source', 'nearer-own-line'] as const).map(variant => plannerSamples(prepared, variant));
  if (aiOnly) return { size, cells: prepared.state.world.terrain.length, factions: prepared.state.factions.length, synthetic: true,
    geographyAndResourceSha256: prepared.geographicSeal, sourceFixtureHash: stateHash(deserializeGame(prepared.baseline)), ai };
  const absent = readSamples(prepared.baseline, prepared.owner, prepared.sites);
  const active = readSamples(prepared.active, prepared.owner, prepared.sites);
  return { size, synthetic: true, seed: prepared.state.world.seed, generatorVersion: prepared.state.world.generatorVersion,
    cells: prepared.state.world.terrain.length, factions: prepared.state.factions.length, armies: Object.keys(prepared.state.armies).length,
    hearths: Object.keys(prepared.state.settlements).length, measuredBuyers: 1, activeImports: 8,
    authoredWitnesses: prepared.sites.length, formationsPerWitness: 3, authoredHarbors: prepared.sites.filter(site => site.harbor).length,
    geographyAndResourceSha256: prepared.geographicSeal, generatedGeographyUnchanged: true, sources: prepared.sites,
    feeCoinPerSource: 10, termTurns: 5, totalActualFeeCoin: 80, inputHash: prepared.activeHash,
    noAgreements: absent, eightActiveAgreements: active, ai,
    invalidation: (['war-command', 'source-loss-phase', 'expiry-phase'] as const).map(mode => invalidationSamples(prepared, mode)),
    continuation: continuationProof(prepared) };
}

const sourcePaths = ['scripts/benchmark-supply-access.ts', 'packages/sim/src/supply-access.ts', 'packages/sim/src/supply-access-state.ts',
  'packages/sim/src/supply.ts', 'packages/sim/src/simulation.ts', 'packages/sim/src/save.ts', 'packages/sim/src/rules.ts',
  'packages/test-fixtures/src/index.ts', 'packages/test-fixtures/src/authored-land.ts', 'packages/ai/src/supply-access.ts',
  'packages/ai/src/observation-index.ts', 'packages/sim/src/movement.ts'];
const sourceFingerprints = Object.fromEntries(sourcePaths.map(path => [path, sha256(readFileSync(path))]));
const workloads = (smoke ? ['huge'] as const : ['huge', 'legendary'] as const).map(measure);
for (const [path, hash] of Object.entries(sourceFingerprints)) assert.equal(sha256(readFileSync(path)), hash, `Source changed during measurement: ${path}`);
const result = {
  capturedAt: new Date().toISOString(), runtime: process.version, cpu: cpus()[0]?.model, os: `${platform()} ${release()}`,
  rulesVersion: SAVE_VERSION, contentHash: CONTENT_HASH, smoke, aiOnly, warmups: WARMUPS, measuredSamples: SAMPLES, sourceFingerprints, workloads,
  configuredBounds: { maxImportsPerBuyer: MAX_SUPPLY_ACCESS_IMPORTS, maxOffersPerBuyer: MAX_SUPPLY_ACCESS_OFFERS,
    maximumRealms: 64, maximumGlobalAgreements: 64 * MAX_SUPPLY_ACCESS_IMPORTS, maximumGlobalOffers: 64 * MAX_SUPPLY_ACCESS_OFFERS },
  scope: (aiOnly ? 'AI-only review of the same synthetic matureCampaign baseline before its eight imports. ' : 'One buyer at its eight-import ceiling, plus AI review before the imports, on synthetic matureCampaign Huge/Legendary fixtures. ')
    + 'Existing generated geography/resources remain exact. Eight three-company forces establish ordinary current sight of existing foreign hearths; harbors are authored only at naturally coastal sources. The separate AI nearer-own-line variant retains those sightings with foragers and explicitly relocates one needy force beside a verified reachable own line. Offers, acceptance and payment use ordinary commands. The full benchmark also checks war termination and a saved expiry continuation. Neither organic expansion, 64-buyer saturation, browser rendering nor release acceptance is claimed.',
  timing: `${WARMUPS} discarded warmup and ${SAMPLES} measured sample(s) each deserialize an identical strict snapshot. Setup, loading, hashing, serialization, output comparisons and archive replay are outside phase timing. AI source-forecast and planner timings use separate fresh permitted observations built outside timing, so source-index construction is included and the direct forecast does not warm the planner. Actual planner route-query counts are not instrumented; only configured bounds are reported. Full-workload contract-forecast timing receives a precomputed actual map; whole-own-observation timing includes its normal repeated supply/read-model work. War timing includes the full declareWar command; ownership-loss/expiry timings isolate cleanup at explicitly prepared lifecycle boundaries. Local samples provide medians/ranges, not tail confidence or universal performance guarantees. Smoke samples are correctness checks, not accepted final timing.`,
  complexity: 'For a buyer, source filtering scans at most 512 active agreements globally (8 per realm across64 realms). Actual and forecast spread each use fixed nine cost buckets over nearby cells, not a whole-map scan; their radius is at most8 road steps and no more than217 hexes per isolated seed, with overlapping seeds shared per spread. Settlement source selection scans hearths; occupied-cell checks use spatial indexes. Cleanup visits pending offers plus active agreements and tests source/war references; at current bounds at most512 offers plus512 agreements. Own observation additionally traverses visible/explored cells and entity/read-model collections. This one-buyer measurement is not a proof of simultaneous512-agreement throughput.',
};
const json = JSON.stringify(result, null, 2) + '\n';
if (output) { mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, json, { flag: 'wx' }); }
console.log(json);
