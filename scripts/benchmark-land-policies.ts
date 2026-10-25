import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH, resourceById } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, getSettlementLandObservation, SAVE_VERSION, serializeGame, stateHash, type DomainEvent, type GameState, type LandCellObservation } from '@theandril/sim';
import { getLandIndex, getLandPolicyChoice } from '../packages/sim/src/territory';
import { advanceLandPolicies, observeLandPolicies, type LandPolicy } from '../packages/sim/src/land-policies';
import { empireLandCampaign } from '../packages/test-fixtures/src/empire-land-fixture';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../packages/test-fixtures/src/authored-land';

const WARMUP = 3, SAMPLES = 12, TURNS = WARMUP + SAMPLES;
const distribution = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))]!, maxMs: sorted.at(-1)! };
};
const ownedTowns = (game: GameState) => Object.values(game.settlements).filter(town => town.factionId === game.turnOwnerId)
  .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const budgetLeft = (game: GameState) => game.landPolicies.reduce((sum, policy) => sum + policy.allowance, 0);
const starts = (events: DomainEvent[]) => events.filter(event => event.type === 'land_work_started').length;

function estate(size: 'huge' | 'legendary'): GameState {
  let game = empireLandCampaign(size);
  const factionId = game.turnOwnerId;
  // Not every generated cultural hearth has a researched improvement suitable
  // for its local biome. This paid-phase workload authors plains on its owned
  // non-center claims so all 32/40 commissions can start work. Existing sites,
  // natural features outside the patch and all unrelated deposits remain intact.
  // Generator4 accepts this authored patch without modern drainage fabrication.
  for (const town of ownedTowns(game)) for (const cell of game.land.settlements[town.id]!.claimed) {
    if (cell === town.cell) continue;
    game.world.terrain[cell] = 1; game.world.biome[cell] = 1; game.world.waterDepth[cell] = 0; game.world.hydrology[cell] = 0; game.world.fertility[cell] = 60;
    delete game.resources.deposits[cell];
  }
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  const policies: LandPolicy[] = [];
  for (const town of ownedTowns(game)) {
    // Setup inspects every page before choosing workers; runtime commissions
    // will scan their actual full worked set, not this quote window.
    const cells = new Map<number, LandCellObservation>();
    for (let offset = 0; ; offset += 64) {
      const detail = getSettlementLandObservation(game, factionId, town.id, { offset, limit: 64 })!;
      for (const cell of detail.cells) cells.set(cell.cell, cell);
      if (!detail.cellWindow || offset + 64 >= detail.cellWindow.total) break;
    }
    const options = new Map<string, { cell: number; cost: number }[]>();
    for (const cell of cells.values()) {
      if (!cell.claimed || !cell.canWork || cell.improvementId) continue;
      for (const option of cell.improvementOptions) {
        if (!option.canStart || (cell.resourceId && resourceById.get(cell.resourceId)?.improvementId !== option.improvementId)) continue;
        const candidates = options.get(option.improvementId) ?? [];
        candidates.push({ cell: cell.cell, cost: option.coinCost }); options.set(option.improvementId, candidates);
      }
    }
    const best = [...options].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))[0];
    assert(best, `No generated suitable improvement sites at ${town.id}`);
    const workers = best[1].sort((a, b) => a.cost - b.cost || a.cell - b.cell).slice(0, town.population).map(cell => cell.cell).sort((a, b) => a - b);
    const result = applyCommand(game, { type: 'setWorkedTiles', factionId, settlementId: town.id, cells: workers });
    assert(result.ok, result.error);
    policies.push({ settlementId: town.id, factionId, improvementId: best[0], allowance: 10_000, reserve: 100 });
  }
  // Explicit authored register: each isolated paid-phase sample starts with
  // validated commissions awaiting their first order, without bypassing quotes.
  game.landPolicies = policies;
  return deserializeGame(serializeGame(game));
}

function largeWorkedEstate(): GameState {
  let game = createGame({ seed: 74, size: 'huge', factionCount: 1, pace: 'epic', generatorVersion: 4 });
  assert(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Authored worked estate' }).ok);
  const town = ownedTowns(game)[0]!, width = game.world.width;
  const claimed = Array.from({ length: 100 }, (_, row) => Array.from({ length: 100 }, (_, column) => (row + 10) * width + column + 10)).flat();
  for (const cell of claimed) {
    game.world.terrain[cell] = 1; game.world.biome[cell] = 1; game.world.waterDepth[cell] = 0; game.world.hydrology[cell] = 0; game.world.fertility[cell] = 60;
    delete game.resources.deposits[cell];
  }
  town.cell = 60 * width + 60; town.population = 10_000; town.food = 0;
  for (const army of Object.values(game.armies)) army.cell = town.cell;
  game.factions[0]!.treasury = 100_000_000;
  rebaseAuthoredLand(game);
  game.land.settlements[town.id]!.claimed = claimed;
  const index = getLandIndex(game); index.clear();
  for (const cell of claimed) { index.set(cell, town.id); game.explored[game.turnOwnerId]!.add(cell); }
  refreshAuthoredSight(game);
  const result = applyCommand(game, { type: 'setWorkedTiles', factionId: game.turnOwnerId, settlementId: town.id, cells: claimed.filter(cell => cell !== town.cell) });
  assert(result.ok, result.error);
  game.landPolicies = [{ settlementId: town.id, factionId: town.factionId, improvementId: 'improvement.terraced_fields', allowance: 1_000_000, reserve: 100 }];
  game = deserializeGame(serializeGame(game));
  return game;
}

function describeSetup(name: string, game: GameState) {
  const towns = ownedTowns(game);
  return { name, generatorVersion: game.world.generatorVersion, mapCells: game.world.terrain.length, ownedTowns: towns.length,
    armies: Object.keys(game.armies).length, claimed: towns.reduce((sum, town) => sum + game.land.settlements[town.id]!.claimed.length, 0),
    worked: towns.reduce((sum, town) => sum + game.land.settlements[town.id]!.worked.length, 0), policies: game.landPolicies.length,
    eligibleChoices: game.landPolicies.map(policy => ({ settlementId: policy.settlementId, improvementId: policy.improvementId, ...getLandPolicyChoice(game, policy) })) };
}

function measure(name: string, prepared: GameState) {
  const setup = describeSetup(name, prepared), original = serializeGame(prepared), owner = prepared.turnOwnerId;
  assert.equal(setup.policies, setup.ownedTowns);
  assert(setup.eligibleChoices.every(choice => choice.cell !== null && choice.blocker === null));
  const choices: number[] = [], paidPhases: number[] = [], reads: number[] = [], fullReads: number[] = [];
  let isolatedStarts = 0, isolatedCoin = 0, policyBytes = 0, observationBytes = 0;
  for (let sample = 0; sample < TURNS; sample++) {
    // Restoring the same authored pre-order boundary is outside timings. Unlike
    // an idempotent scan, every paid phase actually spends and starts new work.
    const game = deserializeGame(original), mirror = deserializeGame(original), before = stateHash(game);
    const choiceStart = performance.now();
    const chosen = game.landPolicies.map(policy => getLandPolicyChoice(game, policy));
    const choiceMs = performance.now() - choiceStart;
    assert(chosen.every(choice => choice.cell !== null && !choice.blocker));
    assert.equal(stateHash(game), before, 'choice queries mutated state');
    const allowance = budgetLeft(game), treasury = game.factions.find(faction => faction.id === owner)!.treasury;
    const events: DomainEvent[] = [], paidStart = performance.now();
    advanceLandPolicies(game, events);
    const paidMs = performance.now() - paidStart;
    const mirrorEvents: DomainEvent[] = []; advanceLandPolicies(mirror, mirrorEvents);
    assert.deepEqual(events, mirrorEvents); assert.equal(stateHash(game), stateHash(mirror));
    assert.equal(starts(events), setup.policies, 'every isolated sample must contain one real paid start per policy');
    const spent = treasury - game.factions.find(faction => faction.id === owner)!.treasury;
    assert.equal(spent, allowance - budgetLeft(game)); assert(spent > 0);
    for (const policy of game.landPolicies) {
      const work = game.land.settlements[policy.settlementId]!.work;
      assert(work); assert.equal(work.remainingTurns, work.turns, 'new paid work must have no free progress');
    }
    const after = stateHash(game), readStart = performance.now(), summary = observeLandPolicies(game, owner), readMs = performance.now() - readStart;
    const fullStart = performance.now(), observed = getObservation(game, owner, { landDetails: 'none', developmentCandidates: false }), fullMs = performance.now() - fullStart;
    assert.equal(stateHash(game), after, 'summary queries mutated state');
    policyBytes = Math.max(policyBytes, Buffer.byteLength(JSON.stringify(summary)));
    observationBytes = Math.max(observationBytes, Buffer.byteLength(JSON.stringify(observed)));
    if (sample >= WARMUP) { choices.push(choiceMs); paidPhases.push(paidMs); reads.push(readMs); fullReads.push(fullMs); isolatedStarts += starts(events); isolatedCoin += spent; }
  }
  const game = deserializeGame(original), configurations = [...game.landPolicies]; game.landPolicies = [];
  // This sustained run authorizes policies through ordinary public commands.
  // The immediate starts are counted, but installation is outside turn timing.
  let sustainedStarts = 0, completions = 0;
  for (const policy of configurations) {
    const result = applyCommand(game, { type: 'setLandPolicy', ...policy }); assert(result.ok, result.error);
    sustainedStarts += starts(result.events);
  }
  const mirror = deserializeGame(serializeGame(game)), turns: number[] = [], turnSamples: { turn: number; paidStarts: number; completed: number; allowance: number; milliseconds: number; measured: boolean }[] = [];
  for (let sample = 0; sample < TURNS; sample++) {
    const command = { type: 'endTurn' as const, factionId: owner }, turnStart = performance.now(), result = applyCommand(game, command), turnMs = performance.now() - turnStart;
    assert(result.ok, result.error); assert.deepEqual(applyCommand(mirror, command), result);
    assert.equal(stateHash(game), stateHash(mirror));
    const completed = result.events.filter(event => event.type === 'land_work_completed').length;
    sustainedStarts += starts(result.events); completions += completed;
    turnSamples.push({ turn: game.turn, paidStarts: starts(result.events), completed, allowance: budgetLeft(game), milliseconds: turnMs, measured: sample >= WARMUP });
    if (sample >= WARMUP) turns.push(turnMs);
  }
  assert(sustainedStarts > configurations.length, 'sustained sample must make further paid starts');
  assert(completions > 0, 'sustained sample must complete real work');
  assert.equal(serializeGame(deserializeGame(serializeGame(game))), serializeGame(game));
  return { ...setup, eligibleChoices: undefined, choice: distribution(choices), paidPhase: distribution(paidPhases), policyObservation: distribution(reads),
    fullPlayerSummary: distribution(fullReads), endTurn: distribution(turns), isolatedPaidStarts: isolatedStarts, isolatedCoinSpent: isolatedCoin,
    policyBytes, observationBytes, sustained: { turns: TURNS, initialAllowance: configurations.reduce((sum, policy) => sum + policy.allowance, 0),
      remainingAllowance: budgetLeft(game), paidStarts: sustainedStarts, completed: completions, turnSamples, finalHash: stateHash(game), mirroredTurns: TURNS } };
}

const fixtures = [
  { name: 'Huge authored 32-hearth commissions', game: estate('huge') },
  { name: 'Legendary authored 40-hearth commissions', game: estate('legendary') },
  { name: 'Huge authored 10000-claim 9999-worker commission', game: largeWorkedEstate() },
];
const setupOnly = process.argv.includes('--setup-only');
const report = { rules: SAVE_VERSION, contentHash: CONTENT_HASH, cpu: cpus()[0]?.model, generatedAt: new Date().toISOString(),
  scope: setupOnly ? 'Fixture construction and validation only; no timing evidence.' : 'Authored ownership/population/purses/policies and plains on owned non-center claims (or a 10000-cell estate); generated deposits cleared only on rewritten cells. Not organically developed empires. Three warmups plus twelve measured independent paid-phase samples each restore a validated waiting-policy boundary outside timings and actually charge/start orders; choice scans and paid phases are separate. Fifteen sustained ordinary End turns separately prove repeated starts, completions and exact saved mirrors; policies are installed through ordinary commands. Hashing, clone restoration, serialization and verification are outside timings. No AI planning, browser transfer/rendering, disk or full-world single-estate acceptance.',
  results: fixtures.map(fixture => setupOnly ? describeSetup(fixture.name, fixture.game) : measure(fixture.name, fixture.game)) };
const output = process.argv.find(arg => arg.startsWith('--out='))?.slice(6);
if (output) writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
