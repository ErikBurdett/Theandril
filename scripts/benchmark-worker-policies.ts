import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { CONTENT_HASH } from '@theandril/content';
import { applyCommand, createGame, deserializeGame, getObservation, SAVE_VERSION, serializeGame, stateHash, type GameState } from '@theandril/sim';
import { getLandIndex } from '../packages/sim/src/territory';
import { advanceWorkerPolicies, observeWorkerPolicies } from '../packages/sim/src/worker-policies';
import { empireLandCampaign } from '../packages/test-fixtures/src/empire-land-fixture';
import { rebaseAuthoredLand, refreshAuthoredSight } from '../packages/test-fixtures/src/authored-land';

const distribution = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: sorted.length, medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))]!, maxMs: sorted.at(-1)! };
};
function largeTerritory() {
  let game = createGame({ seed: 74, size: 'huge', factionCount: 1, pace: 'epic', generatorVersion: 4 });
  assert(applyCommand(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name: 'Authored great estate' }).ok);
  const town = Object.values(game.settlements)[0]!, width = game.world.width;
  const claimed = Array.from({ length: 100 }, (_, row) => Array.from({ length: 100 }, (_, column) => (row + 10) * width + column + 10)).flat();
  for (const cell of claimed) {
    game.world.terrain[cell] = 1; game.world.biome[cell] = 1; game.world.waterDepth[cell] = 0; game.world.hydrology[cell] = 0; game.world.fertility[cell] = 60;
    delete game.resources.deposits[cell];
  }
  town.cell = 60 * width + 60; town.population = 128; town.food = 0;
  for (const army of Object.values(game.armies)) army.cell = town.cell;
  game.factions[0]!.treasury = 1_000_000;
  rebaseAuthoredLand(game);
  game.land.settlements[town.id]!.claimed = claimed;
  game.land.settlements[town.id]!.worked = [];
  const index = getLandIndex(game); index.clear();
  for (const cell of claimed) index.set(cell, town.id);
  for (const cell of claimed) game.explored[game.turnOwnerId]!.add(cell);
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  return game;
}
function measure(name: string, game: GameState) {
  const owner = game.turnOwnerId, towns = Object.values(game.settlements).filter(town => town.factionId === owner);
  const policiesStarted = performance.now();
  for (const town of towns) assert(applyCommand(game, { type: 'setWorkerPolicy', factionId: owner, settlementId: town.id, focus: 'balanced' }).ok);
  const installMs = performance.now() - policiesStarted;
  const mirror = deserializeGame(serializeGame(game)), phase: number[] = [], read: number[] = [], turns: number[] = [], fullRead: number[] = [];
  let policyBytes = 0, observationBytes = 0, reallocations = 0;
  for (let index = 0; index < 15; index++) {
    const before = stateHash(game), start = performance.now();
    advanceWorkerPolicies(game, []);
    const phaseMs = performance.now() - start;
    assert.equal(stateHash(game), before, 'already applied policy must be idempotent');
    const readStart = performance.now(), summary = observeWorkerPolicies(game, owner), readMs = performance.now() - readStart;
    policyBytes = Math.max(policyBytes, Buffer.byteLength(JSON.stringify(summary)));
    const fullStart = performance.now(), observed = getObservation(game, owner, { landDetails: 'none', developmentCandidates: false }), fullMs = performance.now() - fullStart;
    observationBytes = Math.max(observationBytes, Buffer.byteLength(JSON.stringify(observed)));
    assert.equal(stateHash(game), before, 'observations must be read-only');
    const command = { type: 'endTurn' as const, factionId: owner }, turnStart = performance.now(), result = applyCommand(game, command), turnMs = performance.now() - turnStart;
    assert(result.ok, result.error); assert.deepEqual(applyCommand(mirror, command), result);
    assert.equal(stateHash(game), stateHash(mirror));
    reallocations += result.events.filter(event => event.type === 'worker_policy_allocated').length;
    if (index >= 3) { phase.push(phaseMs); read.push(readMs); turns.push(turnMs); fullRead.push(fullMs); }
  }
  assert.equal(serializeGame(deserializeGame(serializeGame(game))), serializeGame(game));
  return { name, generatorVersion: game.world.generatorVersion, mapCells: game.world.terrain.length, ownedTowns: towns.length, claimed: towns.reduce((sum, town) => sum + game.land.settlements[town.id]!.claimed.length, 0), maxClaims: Math.max(...towns.map(town => game.land.settlements[town.id]!.claimed.length)), assigned: towns.reduce((sum, town) => sum + game.land.settlements[town.id]!.worked.length, 0), policies: game.workerPolicies.length, installMs, policyPhase: distribution(phase), policyObservation: distribution(read), fullPlayerSummary: distribution(fullRead), endTurn: distribution(turns), policyBytes, observationBytes, reallocations, finalHash: stateHash(game), mirroredTurns: 15 };
}
const results = [measure('Huge authored32-hearth estate', empireLandCampaign('huge')), measure('Legendary authored40-hearth estate', empireLandCampaign('legendary')), measure('Huge authored10000-claim128-person hearth', largeTerritory())];
const report = { rules: SAVE_VERSION, contentHash: CONTENT_HASH, cpu: cpus()[0]?.model, generatedAt: new Date().toISOString(), scope: 'Authored ownership/population/terrain scale fixtures, not organic empires. 3 warmup+12 measured sustained turns each, normal canonical endTurn without AI planning. Isolated policy phase, compact policy summary, full player summary and complete turn measured separately; hashes/mirrors/serialization outside timings. No browser transfer, rendering, disk or 350000-cell single-estate acceptance.', results };
const output = process.argv.find(arg => arg.startsWith('--out='))?.slice(6);
if (output) writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
