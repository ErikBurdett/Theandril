import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import { deserializeGame } from '@theandril/sim';
import { loadCandidate } from './load-candidate';

const started = performance.now();
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
console.log(JSON.stringify({ type: 'metadata', node: process.version, cpu: cpus()[0]?.model, baselineSha256: sha(readFileSync(new URL('save-before.ts.txt', import.meta.url), 'utf8')), scope: 'Evidence-only primitive compilation. Every full graph is reparsed, cloned and stringified on every operation. Two warmups, six alternating pairs; no mutable cache.' }));
const before = await loadCandidate('before');
const candidates = await Promise.all((['local-primitives', 'known-primitives'] as const).map(async mode => ({ mode, save: await loadCandidate(mode) })));
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
function measure(label: string, iterations: number, original: () => string, candidate: () => string) {
  const values = { before: [] as number[], after: [] as number[] };
  for (let sample = -2; sample < 6; sample++) for (const side of sample % 2 ? ['after', 'before'] as const : ['before', 'after'] as const) {
    const run = side === 'before' ? original : candidate, start = performance.now();
    let sink = '';
    for (let repeat = 0; repeat < iterations; repeat++) sink = run();
    const elapsed = performance.now() - start;
    assert.ok(sink);
    if (sample >= 0) values[side].push(elapsed / iterations);
  }
  console.log(JSON.stringify({ type: 'timing', label, iterationsPerSample: iterations, beforeMedianMs: median(values.before), afterMedianMs: median(values.after), samples: values }));
}
for (const label of ['D-tiny4-seed99-epic', 'D-standard24-seed74-300']) {
  const captured = gunzipSync(readFileSync(`docs/hermes-analysis/campaigns/runs/${label}/final.json.gz`)).toString('utf8');
  const game = deserializeGame(captured), original = before.serializeGame(game), hash = before.stateHash(game);
  console.log(JSON.stringify({ type: 'corpus', label, turn: game.turn, cells: game.world.terrain.length, reports: game.battleReports.length, bytes: Buffer.byteLength(original), originalSha256: sha(original), originalHash: hash }));
  for (const { mode, save } of candidates) {
    assert.equal(save.serializeGame(game), original);
    assert.equal(save.stateHash(game), hash);
    measure(`${label}:${mode}`, game.world.terrain.length < 10_000 ? 6 : 1, () => before.stateHash(game), () => save.stateHash(game));
    game.factions[0]!.treasury++;
    assert.equal(save.serializeGame(game), before.serializeGame(game));
    assert.equal(save.stateHash(game), before.stateHash(game));
    game.factions[0]!.treasury--;
  }
}
console.log(JSON.stringify({ type: 'complete', wallMs: performance.now() - started, productionChanged: false }));
