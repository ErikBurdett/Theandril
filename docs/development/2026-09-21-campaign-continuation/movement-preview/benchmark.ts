import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { getMovementPreview, getMovementQuery } from '../../../../packages/sim/src/index';
import { previewCorpus } from './corpus';
import captured from './baseline.json';

const distribution = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return { medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)] }; };
const results = [];
for (const item of previewCorpus()) {
  const original = JSON.stringify(item.view);
  const full = () => getMovementQuery(item.view, item.armyId, item.target, { append: item.append }).preview;
  const targetOnly = () => getMovementPreview(item.view, item.armyId, item.target, { append: item.append });
  assert.deepEqual(full(), captured.entries.find(entry => entry.name === item.name)!.preview);
  assert.deepEqual(targetOnly(), full());
  const samples = { full: [] as number[], targetOnly: [] as number[] };
  for (let sample = -5; sample < 40; sample++) for (const side of sample % 2 ? ['full', 'targetOnly'] as const : ['targetOnly', 'full'] as const) {
    const start = performance.now(); const result = side === 'full' ? full() : targetOnly(); const elapsed = performance.now() - start;
    assert.ok(result);
    if (sample >= 0) samples[side].push(elapsed);
  }
  assert.equal(JSON.stringify(item.view), original);
  results.push({ name: item.name, full: distribution(samples.full), targetOnly: distribution(samples.targetOnly),
    previewSha256: createHash('sha256').update(JSON.stringify(targetOnly())).digest('hex'), previewExpandedNodes: targetOnly().expandedNodes,
    fullExpandedNodes: getMovementQuery(item.view, item.armyId, item.target, { append: item.append }).expandedNodes });
}
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0]?.model,
  sourceSha256: createHash('sha256').update(await readFile('packages/sim/src/movement.ts')).digest('hex'), originalSourceSha256: captured.sourceSha256,
  scope: 'Synthetic detached64x64 charts. Full-query target preview vs new exact target-only publication; both execute the identical range search and share its remaining4096node budget with route preview. Five warmups, forty alternating samples; setup/equality/hashes outside timing. No campaign, renderer or fog/activity reduction.', results }, null, 2));
