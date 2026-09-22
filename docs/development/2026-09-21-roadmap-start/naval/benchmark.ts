import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { hexDistance, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import { getObservation, type Observation } from '@theandril/sim';
import { navalCampaign } from '../../../../packages/test-fixtures/src/naval-fixture';
import { planNaval } from '../../../../packages/ai/src/naval';

// Run from the repository root with `node --import tsx <this-file>` during an
// exclusive CPU window. Baseline implementation is archival, never runtime code.
const evidence = dirname(fileURLToPath(import.meta.url));
const repository = resolve(evidence, '../../../..');
const baseline = await readFile(resolve(evidence, 'naval-before.ts.txt'), 'utf8');
const current = await readFile(resolve(repository, 'packages/ai/src/naval.ts'), 'utf8');
const moduleDirectory = await mkdtemp(resolve(tmpdir(), 'theandril-naval-baseline-'));
const baselinePath = resolve(moduleDirectory, 'naval-before.mts');
const source = baseline.replace(/from '([^']+)'/g, (_match, specifier: string) => {
  const target = specifier.startsWith('@theandril/')
    ? resolve(repository, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
    : resolve(repository, 'packages/ai/src', `${specifier}.ts`);
  return `from '${pathToFileURL(target).href}'`;
});
await writeFile(baselinePath, source);
const before = (await import(pathToFileURL(baselinePath).href)).planNaval as typeof planNaval;
const state = navalCampaign({ enemyFleet: false }), base = getObservation(state, state.turnOwnerId);
const width = 384, height = 256, origin = 100 * width + 128;
const founder = base.armies.find(army => army.canFound)!, town = base.settlements.find(town => town.factionId === base.factionId)!;
const charts = new Map([4, 12, 32].map(radius => [radius, Array.from({ length: width * height }, (_, cell) => cell)
  .filter(cell => hexDistance(origin, cell, width) <= radius)
  .map(cell => ({ cell, visible: true, fertility: 50, biome: 1, terrain: cell > origin ? TERRAIN.water : TERRAIN.plains,
    waterDepth: cell > origin ? WATER_DEPTH.deep : WATER_DEPTH.land }))]));
const fixture = (founders: number, radius: number, factionCount: number): Observation => ({ ...base, width, height, factionCount,
  factions: base.factions.filter(faction => faction.id === base.factionId), treasury: 0, knowledge: 0, settlements: [{ ...town, cell: origin }],
  productionOptions: [], routes: [], characters: [], cells: charts.get(radius)!,
  armies: Array.from({ length: founders }, (_, index) => ({ ...founder, id: `army.outlet.${index}`, cell: origin, movement: 0 })) });
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const rows = [];
for (const factionCount of [4, 24]) for (const radius of charts.keys()) for (const founders of [1, 8, 32, 128]) {
  const view = fixture(founders, radius, factionCount), original = JSON.stringify(view);
  const result = { factionCount, radius, founders, observedCells: view.cells.length, beforeReads: 0, afterReads: 0, beforeMedianMs: 0, afterMedianMs: 0 };
  for (const [label, planner] of [['before', before], ['after', planNaval]] as const) {
    let reads = 0;
    const instrumented = { ...view, cells: new Proxy(view.cells, { get(target, key, receiver) {
      if (typeof key === 'string' && /^\d+$/.test(key)) reads++;
      return Reflect.get(target, key, receiver);
    } }) };
    const planned = planner(instrumented, 0);
    if (planned.commands.length) throw new Error('Waiting-founder benchmark unexpectedly proposed a command.');
    result[label === 'before' ? 'beforeReads' : 'afterReads'] = reads;
  }
  // Fresh observation per sample matches a turn's first planning pass; fixture
  // creation is excluded. Alternate order to reduce systematic warmup bias.
  const times = { before: [] as number[], after: [] as number[] };
  for (let sample = 0; sample < 9; sample++) for (const label of sample % 2 ? ['after', 'before'] as const : ['before', 'after'] as const) {
    const detached = structuredClone(view), planner = label === 'before' ? before : planNaval;
    const start = performance.now(); planner(detached, 0); const elapsed = performance.now() - start;
    if (sample >= 2) times[label].push(elapsed);
  }
  result.beforeMedianMs = median(times.before); result.afterMedianMs = median(times.after);
  if (JSON.stringify(view) !== original) throw new Error('Benchmark observation was mutated.');
  rows.push(result);
}
console.log(JSON.stringify({
  scope: 'Synthetic detached observations only: 384×256 public dimensions; 61/469/3169 charted cells; 1/8/32/128 idle founders; no fleets, orders or hidden-state access. Not a canonical campaign or renderer benchmark.',
  timing: 'Whole planNaval; fresh detached observation per sample; 2 warmups and 7 measured alternating paired runs; cloning/setup excluded; median milliseconds.',
  baselineRevision: 'f07024fe23ad3386874656d48fbbc33a5380d979',
  baselineSha256: createHash('sha256').update(baseline).digest('hex'), currentSha256: createHash('sha256').update(current).digest('hex'),
  node: process.version, rows,
}, null, 2));
