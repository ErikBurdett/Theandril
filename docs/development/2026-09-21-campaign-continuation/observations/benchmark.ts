import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { gunzipSync } from 'node:zlib';
import { createGame, deserializeGame, getObservation, serializeGame, type ObservationOptions } from '@theandril/sim';
import { getLandObservation, type LandDetails } from '../../../../packages/sim/src/territory';
import { indexes } from '../../../../packages/sim/src/visibility';
import captured from './baseline.json';
import { loadBaseline } from './load-baseline';

const baseline = await loadBaseline();
const payload = gunzipSync(Buffer.from(captured.payload, 'base64')).toString('utf8');
assert.equal(createHash('sha256').update(payload).digest('hex'), captured.payloadSha256);
const snapshots = (JSON.parse(payload) as { snapshots: { name: string; save: string }[] }).snapshots;
const selections: { name: string; fixture: string; options: ObservationOptions; landOnly?: boolean }[] = [
  { name: 'generated-resource-full', fixture: 'paid-grange-completed', options: {} },
  { name: 'foreign-memory-full', fixture: 'remembered-foreign-hearth', options: {} },
  { name: 'naval-cargo-full', fixture: 'embarked-passengers', options: {} },
  { name: '17-towns-full', fixture: 'seventeen-authored-towns', options: {} },
  { name: '17-towns-eight-details', fixture: 'seventeen-authored-towns', options: { landDetails: { offset: 7, limit: 8 } } },
  { name: '17-towns-summary', fixture: 'seventeen-authored-towns', options: { landDetails: 'none' } },
  { name: '17-towns-land-only', fixture: 'seventeen-authored-towns', options: {}, landOnly: true },
  { name: 'standard-full-chart', fixture: 'synthetic-standard', options: {} },
];
const measure = (samples: number[]) => { const sorted = [...samples].sort((a, b) => a - b); return { medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)] }; };
const results = [];
for (const selection of selections) {
  const state = selection.fixture === 'synthetic-standard' ? createGame({ seed: 74, size: 'standard', factionCount: 4 })
    : deserializeGame(snapshots.find(snapshot => snapshot.name === selection.fixture)!.save);
  if (selection.fixture === 'synthetic-standard') state.explored[state.turnOwnerId] = new Set(Array.from({ length: state.world.terrain.length }, (_, cell) => cell));
  const factionId = state.turnOwnerId, visible = indexes(state).visible.get(factionId)!, input = serializeGame(state);
  const before = () => selection.landOnly ? baseline.territory.getLandObservation(state, factionId, visible, selection.options.landDetails) : baseline.simulation.getObservation(state, factionId, selection.options);
  const after = () => selection.landOnly ? getLandObservation(state, factionId, visible, selection.options.landDetails) : getObservation(state, factionId, selection.options);
  const original = JSON.stringify(before()), current = JSON.stringify(after());
  assert.equal(current, original, selection.name);
  const samples = { before: [] as number[], after: [] as number[] };
  for (let sample = -4; sample < 20; sample++) for (const side of sample % 2 ? ['after', 'before'] as const : ['before', 'after'] as const) {
    const start = performance.now(); const result = side === 'before' ? before() : after(); const elapsed = performance.now() - start;
    assert.ok(result);
    if (sample >= 0) samples[side].push(elapsed);
  }
  assert.equal(serializeGame(state), input, 'Observation mutated canonical state.');
  results.push({ ...selection, cells: state.explored[factionId]!.size, ownedTowns: Object.values(state.settlements).filter(town => town.factionId === factionId).length,
    outputBytes: Buffer.byteLength(original), outputSha256: createHash('sha256').update(original).digest('hex'), before: measure(samples.before), after: measure(samples.after) });
}
// Capture the unchanged original public rejection semantics from archived code.
const state = deserializeGame(snapshots.find(snapshot => snapshot.name === 'visible-foreign-hearth')!.save), factionId = state.turnOwnerId;
const failures = [];
for (const details of [null, { offset: -1, limit: 1 }, { offset: 0, limit: -1 }, { offset: .5, limit: 1 }, { offset: Infinity, limit: 1 }, { offset: 0, limit: NaN }]) {
  const message = (reader: typeof getObservation) => { try { reader(state, factionId, { landDetails: details as LandDetails }); return null; } catch (error) { return error instanceof Error ? error.message : String(error); } };
  const original = message(baseline.simulation.getObservation), current = message(getObservation);
  assert.equal(current, original); assert.notEqual(original, null); failures.push({ details, message: original });
}
const sourceHashes = Object.fromEntries(await Promise.all(['simulation', 'territory'].map(async name => [name, createHash('sha256').update(await readFile(`packages/sim/src/${name}.ts`)).digest('hex')])));
console.log(JSON.stringify({ node: process.version, cpu: cpus()[0]?.model, sourceHashes, baselineHashes: captured.sourceHashes,
  scope: 'Paired retained original/current complete observations; 4 warmups, 20 alternating samples. Setup, serialization, equivalence/hash checks outside timing. No omitted detail, changed AI or new cache. Standard full chart is synthetic knowledge over generated geography; not giant mature campaign or renderer evidence.',
  results, failures }, null, 2));
