import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { checksum, CONTENT_HASH } from '@theandril/content';
import { deserializeGame, serializeGame, stateHash, SAVE_VERSION, type GameState } from '@theandril/sim';
import { borderBattleCampaign } from '../packages/test-fixtures/src/combat-fixture';
import { matureCampaign } from '../packages/test-fixtures/src/index';
import { empireLandCampaign } from '../packages/test-fixtures/src/empire-land-fixture';

const output = process.argv.includes('--output');
if (process.argv.slice(2).some(argument => argument !== '--output')) throw new Error('Usage: node --import tsx scripts/benchmark-envelope-hash.ts [--output]');
const samples = 40, warmups = 6;
const distribution = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { samples: values.length, meanMs: values.reduce((sum, value) => sum + value, 0) / values.length,
    medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.floor(sorted.length * .95)]!, maxMs: sorted.at(-1)! };
};
const cases: { name: string; setup: () => GameState }[] = [
  { name: 'Tiny authored border encounter', setup: borderBattleCampaign },
  { name: 'Huge synthetic mature armies', setup: () => matureCampaign('huge') },
  { name: 'Legendary synthetic mature armies', setup: () => matureCampaign('legendary') },
  { name: 'Huge synthetic many-town land', setup: () => empireLandCampaign('huge') },
];
const measurements = [];
for (const fixture of cases) {
  const game = fixture.setup(), saved = serializeGame(game), expected = checksum(saved);
  assert.equal(serializeGame(deserializeGame(saved)), saved);
  const before: number[] = [], after: number[] = [];
  for (let sample = -warmups; sample < samples; sample++) {
    const paths = sample % 2 ? ['candidate', 'baseline'] as const : ['baseline', 'candidate'] as const;
    for (const path of paths) {
      const start = performance.now();
      const result = path === 'baseline' ? checksum(serializeGame(game)) : stateHash(game);
      const elapsed = performance.now() - start;
      // Validation is outside the measured operation, not omitted for timing.
      assert.equal(result, expected);
      if (sample >= 0) (path === 'baseline' ? before : after).push(elapsed);
    }
  }
  assert.equal(serializeGame(game), saved);
  assert.equal(stateHash(deserializeGame(saved)), expected);
  const baseline = distribution(before), candidate = distribution(after);
  measurements.push({ name: fixture.name, seed: game.world.seed, turn: game.turn, cells: game.world.terrain.length, factions: game.factions.length,
    armies: Object.keys(game.armies).length, formations: Object.values(game.armies).reduce((sum, army) => sum + army.formations.length, 0),
    towns: Object.keys(game.settlements).length, knownLandCells: Object.values(game.land.known).reduce((sum, cells) => sum + Object.keys(cells).length, 0),
    saveBytes: Buffer.byteLength(saved), envelopeUtf16Units: saved.length, hash: expected, exactHashes: true, unchangedSave: true, strictRoundtrip: true,
    baseline, candidate, meanRatioCandidateOverBaseline: candidate.meanMs / baseline.meanMs, medianRatioCandidateOverBaseline: candidate.medianMs / baseline.medianMs });
}
const report = { date: new Date().toISOString(), schema: SAVE_VERSION, content: CONTENT_HASH, runtime: process.version, cpu: cpus()[0]?.model,
  logicalCpus: cpus().length, ramBytes: totalmem(), warmupsPerPath: warmups,
  scope: 'Alternating whole-operation checksum(serializeGame(state)) versus streamed current-envelope stateHash(state), including canonical projection, strict parsing, JSON.stringify and both FNV passes. All normal allocations and GC costs remain inside timed operations. No forced GC. Fixtures are actual validated canonical states with authored army/ownership/population/funding setup, not earned late campaigns. Setup, restore/equality checks, saves used only for verification, file output, AI, turn advancement, archives and browser work are excluded.',
  mechanism: 'Candidate folds the exact header, payload and closing brace as UTF-16 code units without joining a full outer envelope string. No checksum or canonical validation is removed. Legacy versions remain on the original serialized path.',
  measurements, finalMemory: process.memoryUsage() };
if (output) {
  const path = resolve('docs/performance/0025-envelope-hash.json'); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
