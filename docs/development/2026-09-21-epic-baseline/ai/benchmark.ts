import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { aiObservationOptions } from '../../../../packages/ai/src/index';
import { deserializeGame, getObservation } from '../../../../packages/sim/src/index';
import { loadCandidate } from './load-candidate';
import { probes } from './preview-probe';

const folder = 'docs/development/2026-09-21-epic-baseline/ai/';
const source = 'docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/';
const snapshots = [1, 30, 60, 100, 200, 300, 500, 800, 808];
const modules = await loadCandidate(process.argv.includes('--runtime'));
const stringify = (value: unknown) => JSON.stringify(value, (_, entry) => entry instanceof Set ? [...entry] : entry);
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const distribution = (values: number[]) => { const sorted = [...values].sort((a, b) => a - b); return { medianMs: sorted[Math.floor(sorted.length / 2)]!, p95Ms: sorted[Math.floor(sorted.length * .95)]! }; };
const results = [], originals = [];
for (const turn of snapshots) {
  const path = `${source}turn-${turn}.json.gz`, bytes = await readFile(path);
  const state = deserializeGame(gunzipSync(bytes).toString('utf8'));
  for (const faction of state.factions) {
    const view = getObservation(state, faction.id, aiObservationOptions(state.turn));
    const before = JSON.stringify(view), budget = view.treasury;
    const baseline = stringify(modules.baseline.planNaval(view, budget));
    assert.equal(stringify(modules.candidate.planNaval(view, budget)), baseline);
    assert.equal(stringify(modules.instrumented.planNaval(view, budget)), baseline);
    const samples = { baseline: [] as number[], candidate: [] as number[] };
    for (let sample = -2; sample < 8; sample++) for (const side of sample % 2 ? ['baseline', 'candidate'] as const : ['candidate', 'baseline'] as const) {
      const start = performance.now(); modules[side].planNaval(view, budget); const elapsed = performance.now() - start;
      if (sample >= 0) samples[side].push(elapsed);
    }
    assert.equal(JSON.stringify(view), before);
    const key = `turn-${turn}/${faction.id}`;
    originals.push({ key, save: path, saveSha256: digest(bytes), observationSha256: digest(before), budget, output: JSON.parse(baseline) });
    results.push({ key, observedCells: view.cells.length, fleets: probes.at(-1)!.fleets, passengers: probes.at(-1)!.passengers,
      baseline: distribution(samples.baseline), candidate: distribution(samples.candidate), outputSha256: digest(baseline) });
  }
  console.error(`Validated and measured canonical checkpoint ${turn}.`);
}
const sealed = { sourceSha256: digest(await readFile(`${folder}naval-before.ts.txt`)), originals };
try {
  assert.deepEqual(sealed, JSON.parse(await readFile(`${folder}complete-proposals-before.json`, 'utf8')));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  await writeFile(`${folder}complete-proposals-before.json`, JSON.stringify(sealed, null, 2) + '\n');
}
const groups = probes.flatMap(plan => plan.groups), queries = groups.reduce((sum, group) => sum + group.calls, 0);
await writeFile(`${folder}preview-counts.json`, JSON.stringify({ scope: 'Tool-only exact naval calls on genuine Epic seed99 checkpoints, all seats. Each public plan receives its full observed treasury; this is not a replay of the overall AI reserve calculation or the seed20260905 archive gate. Preliminary range counts are queried separately outside timing. No canonical commands are applied.',
  plans: probes.length, queries, distinctPlanArmies: groups.length, repeatedQueries: queries - groups.length,
  rangeNodes: groups.reduce((sum, group) => sum + group.calls * group.rangeNodes, 0), repeatedRangeNodes: groups.reduce((sum, group) => sum + (group.calls - 1) * group.rangeNodes, 0),
  targetNodes: groups.reduce((sum, group) => sum + group.previewNodes, 0), probes }, null, 2) + '\n');
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0]?.model, baselineSourceSha256: digest(await readFile(`${folder}naval-before.ts.txt`)),
  candidateSourceSha256: digest(await readFile(`${folder}naval-lazy-candidate.ts.txt`)),
  scope: 'Genuine retained Epic seed99 checkpoints, migrated v16 to current rules using the unchanged loader; all faction observations, full treasury public naval calls. Both modules share unchanged dependencies. Two warmups/eight alternating samples, correctness and instrumentation outside timing. These repeated detached-observation timings are not full-campaign timings.',
  candidate: process.argv.includes('--runtime') ? 'Exact current runtime naval source' : 'Tool-only lazy candidate',
  totalsOfCaseMedians: { baseline: results.reduce((sum, item) => sum + item.baseline.medianMs, 0), candidate: results.reduce((sum, item) => sum + item.candidate.medianMs, 0) }, results }, null, 2));
