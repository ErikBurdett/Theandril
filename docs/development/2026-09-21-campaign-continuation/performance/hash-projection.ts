import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import { deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import captured from '../observations/baseline.json';
import { loadHashCandidate } from './load-hash-candidate';
import { statistics } from './encoded-projection-candidate';

const candidate = await loadHashCandidate();
const snapshots = (JSON.parse(gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8')) as { snapshots: { name: string; save: string }[] }).snapshots;
const cases = [
  { name: 'retained-real-epic-turn808', save: gunzipSync(readFileSync('docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/final.json.gz')).toString('utf8') },
  { name: 'seventeen-authored-towns', save: snapshots.find(entry => entry.name === 'seventeen-authored-towns')!.save },
  { name: 'genuine-v17-pending-diplomacy', save: readFileSync(new URL('../m1-fixture/pending-save.json', import.meta.url), 'utf8') },
  { name: 'retained-real-standard24-turn301', save: gunzipSync(readFileSync('docs/hermes-analysis/campaigns/runs/D-standard24-seed74-300/final.json.gz')).toString('utf8') },
];
const results = cases.flatMap(({ name, save }) => {
  const game = deserializeGame(save);
  const originalBytes = serializeGame(game), expectedHash = stateHash(game);
  assert.equal(candidate.serializeGame(game), originalBytes);
  assert.equal(candidate.stateHash(game), expectedHash);
  const lateLand = Object.values(game.land.known).flatMap(cells => Object.values(cells)).at(-1);
  const hashesPerSample = game.factions.length > 4 ? 10 : 50;
  const results = [];
  for (const changes of ['none', 'treasury', 'late-land-every-read', 'late-land-one-in-five'] as const) {
    const statisticsBefore = { ...statistics };
    const before: number[] = [], after: number[] = [];
    for (let sample = -2; sample < 8; sample++) {
      for (const kind of sample % 2 ? ['before', 'after'] as const : ['after', 'before'] as const) {
        const hash = kind === 'before' ? stateHash : candidate.stateHash;
        const started = performance.now();
        let actual = '';
        for (let repeat = 0; repeat < hashesPerSample; repeat++) {
          // Model normal changing economies; cached sections still need a full
          // structural check, while the complete resulting seal must change.
          if (changes === 'treasury') game.factions[0]!.treasury++;
          if (changes === 'late-land-every-read' || changes === 'late-land-one-in-five' && repeat % 5 === 0) {
            if (lateLand) lateLand.biome = (lateLand.biome + 1) % 12;
            else game.land.visibilityVersion = game.land.visibilityVersion === 1 ? 0 : 1;
          }
          actual = hash(game);
        }
        const elapsed = performance.now() - started;
        assert.equal(actual, stateHash(game));
        if (sample >= 0) (kind === 'before' ? before : after).push(elapsed);
      }
    }
    const distribution = (values: number[]) => ({ medianMs: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)], samplesMs: values });
    assert.equal(candidate.serializeGame(game), serializeGame(game));
    results.push({ name, changes, currentVersion: 17, turn: game.turn, reports: game.battleReports.length,
      towns: Object.keys(game.settlements).length, knownLandCells: Object.values(game.land.known).reduce((total, cells) => total + Object.keys(cells).length, 0),
      baselineBytes: Buffer.byteLength(originalBytes), originalHash: expectedHash, originalSha256: createHash('sha256').update(originalBytes).digest('hex'),
      hashesPerSample, before: distribution(before), after: distribution(after),
      cacheStatistics: Object.fromEntries(Object.entries(statistics).map(([key, value]) => [key, value - statisticsBefore[key as keyof typeof statisticsBefore]])) });
  }
  return results;
});
console.log(JSON.stringify({ runtime: process.version, cpu: cpus()[0]?.model, results,
  note: 'Experimental whole current state hash. Retained real v16 Epic and Standard24 saves migrate through the unchanged loader to current v17; other fixtures are disclosed authored setups. Two warmups/eight alternating sample pairs,50 whole hashes each (10 for Standard24); capture/loading and independent byte/hash checks excluded. Changes include treasury and late land-memory fields on every read or one in five reads. Land mutations are synthetic cache-miss workloads, not simulated gameplay. Runtime production save.ts remains untouched; temporary candidate module rewrites retained source only. Counters include warmup/correctness calls and encodedBytes is cumulative, not live memory. This is a microbenchmark, not full-suite acceptance.' }, null, 2));
