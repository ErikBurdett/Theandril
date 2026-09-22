import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeGame } from './corpus';
import { indexes, updateSight } from '../../../../packages/sim/src/visibility';
import { withRules, type RulesVersion } from '../../../../packages/sim/src/rules';
import { serializeGame } from '../../../../packages/sim/src/index';

const source = await readFile(new URL('./visibility-before.ts.txt', import.meta.url), 'utf8');
const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-sight-before-'));
const modulePath = resolve(temporary, 'visibility.mts');
const resolved = source.replace(/from '([^']+)'/g, (_match, specifier: string) => {
  const target = specifier.startsWith('@theandril/')
    ? resolve(`packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
    : resolve('packages/sim/src', `${specifier}.ts`);
  return `from '${pathToFileURL(target).href}'`;
});
await writeFile(modulePath, resolved);
const before = await import(pathToFileURL(modulePath).href) as typeof import('../../../../packages/sim/src/visibility');
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const rows = [];
for (const version of [4, 9, 12, 17] as RulesVersion[]) for (const radius of [1, 3]) {
  const a = makeGame(), b = makeGame();
  for (const game of [a, b]) {
    game.land.biomes[748] = game.world.biome[748] === 5 ? 1 : 5;
    game.roads.edges[748] = 1;
  }
  before.rebuildIndexes(a); indexes(b);
  const baseline = () => withRules(a, version, () => { before.updateSight(a, a.turnOwnerId, 748, radius, 1); before.updateSight(a, a.turnOwnerId, 748, radius, -1); });
  const candidate = () => withRules(b, version, () => { updateSight(b, b.turnOwnerId, 748, radius, 1); updateSight(b, b.turnOwnerId, 748, radius, -1); });
  for (let i = 0; i < 100; i++) { baseline(); candidate(); }
  const samples = { before: [] as number[], after: [] as number[] };
  for (let pair = 0; pair < 20; pair++) for (const key of (pair % 2 ? ['after', 'before'] : ['before', 'after']) as ('before' | 'after')[]) {
    const action = key === 'before' ? baseline : candidate, start = performance.now();
    for (let count = 0; count < 200; count++) action();
    samples[key].push((performance.now() - start) / 200);
  }
  if (serializeGame(a) !== serializeGame(b)) throw new Error(`State mismatch: ${version}/${radius}`);
  const visible = (map: ReturnType<typeof indexes>['visible']) => JSON.stringify([...map].map(([owner, cells]) => [owner, [...cells]]));
  if (visible(before.indexes(a).visible) !== visible(indexes(b).visible)) throw new Error(`Visibility mismatch: ${version}/${radius}`);
  rows.push({ version, radius, beforeMedianMs: median(samples.before), afterMedianMs: median(samples.after), samples });
}
await writeFile(new URL('./benchmark.json', import.meta.url), JSON.stringify({ scope: 'Paired complete positive+negative updateSight; generated Tiny geography; warmed caches; 100 warmups, 20 alternating pairs of 200 lifecycles. Full save bytes and visibility counters equal after each case. Not whole-campaign timing.', rows }, null, 2) + '\n');
console.log(JSON.stringify(rows.map(({ samples: _samples, ...row }) => row), null, 2));
