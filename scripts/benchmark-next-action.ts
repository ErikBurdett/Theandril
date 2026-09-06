import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { getObservation, serializeGame, stateHash } from '@theandril/sim';
import { actionCandidates, nextAction } from '../apps/web/src/next-action';
import { empireLandCampaign } from '../packages/test-fixtures/src/empire-land-fixture';

function measure<T>(operation: () => T) {
  const elapsed: number[] = [];
  let result: T;
  for (let sample = -20; sample < 200; sample++) {
    const started = performance.now(); result = operation();
    if (sample >= 0) elapsed.push(performance.now() - started);
  }
  elapsed.sort((a, b) => a - b);
  return { result: result!, timing: { samples: elapsed.length, meanMs: elapsed.reduce((a, b) => a + b, 0) / elapsed.length, medianMs: elapsed[100], p95Ms: elapsed[190] } };
}

const scenarios = (['huge', 'legendary'] as const).map(size => {
  const game = empireLandCampaign(size), saved = serializeGame(game), hash = stateHash(game);
  const observation = getObservation(game, game.turnOwnerId, { landDetails: 'none' });
  const observedBefore = JSON.stringify(observation);
  const candidates = measure(() => actionCandidates(observation));
  const army = candidates.result.armies[0], town = candidates.result.settlements[0];
  assert.ok(army); assert.ok(town);
  const navigation = measure(() => [nextAction(candidates.result.armies, army.id), nextAction(candidates.result.armies, army.id, -1), nextAction(candidates.result.settlements, town.id), nextAction(candidates.result.settlements, town.id, -1)]);
  for (const list of [candidates.result.armies, candidates.result.settlements]) {
    assert.equal(nextAction(list, list.at(-1)!.id)?.id, list[0]!.id);
    assert.equal(nextAction(list, list[0]!.id, -1)?.id, list.at(-1)!.id);
  }
  assert.equal(JSON.stringify(observation), observedBefore);
  assert.equal(stateHash(game), hash); assert.equal(serializeGame(game), saved);
  return { size, worldCells: game.world.terrain.length, globalArmies: Object.keys(game.armies).length,
    observedArmies: observation.armies.length, ownArmies: observation.armies.filter(army => army.factionId === observation.factionId).length,
    ownTowns: observation.land.settlements.length, armyCandidates: candidates.result.armies.length, townCandidates: candidates.result.settlements.length,
    candidateBuild: candidates.timing, fourDirectionalLookups: navigation.timing, hash };
});
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model,
  note: 'Synthetic mature empireLandCampaign fixtures, ordinary permitted observations. 20 warmups and 200 samples. Pure candidate filtering/sorting and four directional lookups only; excludes state setup, observation construction, assertions, React, renderer and worker. Global army counts are not ownership counts; actual observed and owned counts are reported separately. Navigation preserves exact observation/save bytes and state hashes; this is not an end-turn or thousand-turn memory measurement.', scenarios }, null, 2));
