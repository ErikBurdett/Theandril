import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import { deserializeGame, serializeGame, stateHash } from '@theandril/sim';
import { copyWorldLayer, foldOriginal, fold4, fold8 } from './kernels';
import { loadCandidate } from './load-candidate';

const started = performance.now();
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
console.log(JSON.stringify({ type: 'metadata', node: process.version, cpu: cpus()[0]?.model, baselineSha256: sha(readFileSync(new URL('save-before.ts.txt', import.meta.url), 'utf8')),
  scope: 'Pure-kernel candidates; no production edits. Two warmups/six alternating measured pairs. Whole-hash candidates share current unchanged dependencies and keep all strict schema parsing/native full JSON. Original whole save bytes and seals are checked outside timing. Standard24 actual final turn is227.' }));
let random = 20260921;
for (let sample = 0; sample < 1000; sample++) {
  let text = '';
  for (let index = 0; index < sample % 71; index++) { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; text += String.fromCharCode(random >>> 16); }
  for (const initial of [0, 2166136261, random]) {
    assert.equal(fold4(initial, text), foldOriginal(initial, text));
    assert.equal(fold8(initial, text), foldOriginal(initial, text));
  }
}
for (const length of [0, 1, 3, 4, 7, 8, 9, 1536, 98_304]) {
  const layer = Uint8Array.from({ length }, (_, index) => index % 256);
  assert.deepEqual(copyWorldLayer(layer), [...layer]);
  Object.defineProperty(layer, Symbol.iterator, { value: function* () { yield 9; yield 2; }, configurable: true });
  assert.deepEqual(copyWorldLayer(layer), [...layer]);
  Object.defineProperty(layer, Symbol.iterator, { value: undefined });
  assert.throws(() => [...layer]); assert.throws(() => copyWorldLayer(layer));
}
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
function measure(name: string, iterations: number, before: () => unknown, after: () => unknown): void {
  const values = { before: [] as number[], after: [] as number[] };
  for (let sample = -2; sample < 6; sample++) for (const side of sample % 2 ? ['after', 'before'] as const : ['before', 'after'] as const) {
    const run = side === 'before' ? before : after;
    const start = performance.now();
    let sink: unknown;
    for (let repeat = 0; repeat < iterations; repeat++) sink = run();
    const elapsed = performance.now() - start;
    assert.notEqual(sink, undefined);
    if (sample >= 0) values[side].push(elapsed / iterations);
  }
  console.log(JSON.stringify({ type: 'timing', name, iterationsPerSample: iterations, beforeMedianMs: median(values.before), afterMedianMs: median(values.after), perOperationSamplesMs: values }));
}
const modes = ['arrays', 'fold4', 'fold8', 'both4'] as const;
const candidates = await Promise.all(modes.map(async mode => ({ mode, save: await loadCandidate(mode) })));
for (const label of ['D-tiny4-seed99-epic', 'D-standard24-seed74-300']) {
  const captured = gunzipSync(readFileSync(`docs/hermes-analysis/campaigns/runs/${label}/final.json.gz`)).toString('utf8');
  const game = deserializeGame(captured), original = serializeGame(game), hash = stateHash(game);
  console.log(JSON.stringify({ type: 'corpus', label, turn: game.turn, cells: game.world.terrain.length, reports: game.battleReports.length,
    bytes: Buffer.byteLength(original), originalSha256: sha(original), originalHash: hash }));
  const layers = [game.world.terrain, game.world.fertility, game.world.biome, game.world.waterDepth, game.world.hydrology];
  measure(`${label}: world-copy`, game.world.terrain.length < 10_000 ? 30 : 2, () => layers.map(layer => [...layer]), () => layers.map(copyWorldLayer));
  const foldRepeats = game.world.terrain.length < 10_000 ? 5 : 1;
  measure(`${label}: fold4`, foldRepeats, () => foldOriginal(2166136261, original), () => fold4(2166136261, original));
  measure(`${label}: fold8`, foldRepeats, () => foldOriginal(2166136261, original), () => fold8(2166136261, original));
  for (const { mode, save } of candidates) {
    assert.equal(save.serializeGame(game), original, `${label}:${mode} exact bytes`);
    assert.equal(save.stateHash(game), hash, `${label}:${mode} exact seal`);
    measure(`${label}: whole-hash:${mode}`, game.world.terrain.length < 10_000 ? 3 : 1, () => stateHash(game), () => save.stateHash(game));
    game.factions[0]!.treasury++;
    assert.equal(save.serializeGame(game), serializeGame(game));
    assert.equal(save.stateHash(game), stateHash(game));
    game.factions[0]!.treasury--;
  }
  assert.equal(serializeGame(game), original);
}
console.log(JSON.stringify({ type: 'complete', wallMs: performance.now() - started, codeUnitCases: 1000, initialHashStatesPerCase: 3, productionChanged: false }));
