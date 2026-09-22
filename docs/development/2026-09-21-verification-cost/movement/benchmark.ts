import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { cpus, tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getMovementPreview, getMovementQuery } from '../../../../packages/sim/src/index';
import { previewCorpus } from '../../2026-09-21-campaign-continuation/movement-preview/corpus';

const evidence = dirname(fileURLToPath(import.meta.url)), root = resolve(evidence, '../../../..');
let after = { getMovementPreview, getMovementQuery };
const require = createRequire(resolve(root, 'packages/sim/src/movement.ts'));
const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-search-before-'));
const original = await readFile(resolve(evidence, 'movement-before.ts.txt'), 'utf8');
const resolved = original.replace(/from '([^']+)'/g, (_match, specifier: string) => {
  const target = specifier.startsWith('@theandril/') ? resolve(root, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
    : specifier.startsWith('.') ? resolve(root, 'packages/sim/src', `${specifier}.ts`) : require.resolve(specifier);
  return `from '${pathToFileURL(target).href}'`;
});
await writeFile(resolve(temporary, 'movement.mts'), resolved);
const before = await import(pathToFileURL(resolve(temporary, 'movement.mts')).href) as typeof after;
const candidateSource = process.env.MOVEMENT_CANDIDATE ? await readFile(resolve(evidence, process.env.MOVEMENT_CANDIDATE), 'utf8') : await readFile(resolve(root, 'packages/sim/src/movement.ts'), 'utf8');
if (process.env.MOVEMENT_CANDIDATE) {
  const source = candidateSource.replace(/from '([^']+)'/g, (_match, specifier: string) => {
    const target = specifier.startsWith('@theandril/') ? resolve(root, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
      : specifier.startsWith('.') ? resolve(root, 'packages/sim/src', `${specifier}.ts`) : require.resolve(specifier);
    return `from '${pathToFileURL(target).href}'`;
  });
  await writeFile(resolve(temporary, 'candidate.mts'), source);
  after = await import(pathToFileURL(resolve(temporary, 'candidate.mts')).href) as typeof after;
}
const warmups = Number(process.env.MOVEMENT_WARMUPS ?? 5);
const samplesPerSide = Number(process.env.MOVEMENT_SAMPLES ?? 40);
const coldIndex = process.env.MOVEMENT_COLD === '1';
const distribution = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return { medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)], samplesMs: values }; };
const results = [];
for (const item of previewCorpus()) for (const mode of ['full', 'preview'] as const) {
  const invoke = (api: typeof after, view = item.view) => mode === 'full' ? api.getMovementQuery(view, item.armyId, item.target, { append: item.append }) : api.getMovementPreview(view, item.armyId, item.target, { append: item.append });
  const expected = JSON.stringify(invoke(before));
  assert.equal(JSON.stringify(invoke(after)), expected);
  const input = JSON.stringify(item.view), samples = { before: [] as number[], after: [] as number[] };
  for (let sample = -warmups; sample < samplesPerSide; sample++) for (const side of sample % 2 ? ['before', 'after'] as const : ['after', 'before'] as const) {
    const view = coldIndex ? structuredClone(item.view) : item.view;
    const started = performance.now();
    const result = invoke(side === 'before' ? before : after, view);
    const elapsed = performance.now() - started;
    assert.equal(JSON.stringify(result), expected);
    if (sample >= 0) samples[side].push(elapsed);
  }
  assert.equal(JSON.stringify(item.view), input);
  results.push({ name: item.name, mode, before: distribution(samples.before), after: distribution(samples.after), resultSha256: createHash('sha256').update(expected).digest('hex') });
}
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0]?.model,
  scope: 'Synthetic detached64x64 charts from the retained22-case preview corpus, both full and preview API. Alternating sample pairs; encoding/equality/setup excluded. Baseline module loaded from exact retained source; unchanged dependencies shared. Complete output equality and input nonmutation checked. Not campaign or renderer performance.',
  warmups, samplesPerSide, coldIndex,
  beforeSourceSha256: createHash('sha256').update(original).digest('hex'),
  candidateSource: process.env.MOVEMENT_CANDIDATE ?? 'packages/sim/src/movement.ts',
  afterSourceSha256: createHash('sha256').update(candidateSource).digest('hex'), results }, null, 2));
