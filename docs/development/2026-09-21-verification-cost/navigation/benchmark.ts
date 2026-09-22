import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import '../../../../packages/sim/src/index';
import { evidence, loadNavigation } from './load';
import { navigationCorpus, runNavigation } from './corpus';

const baseline = await loadNavigation('navigation-before.ts.txt');
const candidate = await loadNavigation('navigation-candidate.ts.txt');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const entries = [], captured = [];
const distribution = (samplesMs: number[]) => { const sorted = [...samplesMs].sort((a, b) => a - b); return { medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)], samplesMs }; };
for (const item of navigationCorpus()) {
  const input = JSON.stringify(item.view), exact = runNavigation(baseline.createNavigation, item);
  assert.deepEqual(runNavigation(candidate.createNavigation, item), exact);
  captured.push({ name: item.name, ...exact });
  const expected = runNavigation(baseline.createNavigation, item, false);
  const samples = { before: [] as number[], after: [] as number[] };
  for (let sample = -20; sample < 50; sample++) for (const side of sample % 2 ? ['before', 'after'] as const : ['after', 'before'] as const) {
    const start = performance.now();
    const actual = runNavigation(side === 'before' ? baseline.createNavigation : candidate.createNavigation, item, false);
    const elapsed = performance.now() - start;
    assert.deepEqual(actual, expected);
    if (sample >= 0) samples[side].push(elapsed);
  }
  assert.equal(JSON.stringify(item.view), input);
  entries.push({ name: item.name, mode: item.mode, attempts: item.attempts, before: distribution(samples.before), after: distribution(samples.after), resultSha256: sha(JSON.stringify(exact)) });
}
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0]?.model,
  scope: 'Complete destination batches with a fresh navigation object on each run. Both modules share unchanged movement dependencies.20 warmups/50 alternating pairs. Fixture construction, serialization/equality excluded; navigation construction, callbacks and all queries included. Exact full callback traces verified outside timing; identical callback counts retained inside timing. Not whole-AI or campaign timing.',
  beforeSourceSha256: sha(await readFile(resolve(evidence, 'navigation-before.ts.txt'), 'utf8')),
  afterSourceSha256: sha(await readFile(resolve(evidence, 'navigation-candidate.ts.txt'), 'utf8')),
  entries, captured }, null, 2));
