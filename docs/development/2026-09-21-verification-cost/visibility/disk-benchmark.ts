import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { cpus, tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeGame, digest } from './corpus';
import type * as visibility from '../../../../packages/sim/src/visibility';
import { withRules, type RulesVersion } from '../../../../packages/sim/src/rules';
import { serializeGame, type GameState } from '../../../../packages/sim/src/index';

async function load(filename: string): Promise<typeof visibility> {
  const source = await readFile(new URL(filename, import.meta.url), 'utf8');
  const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-sight-disk-'));
  const modulePath = resolve(temporary, 'visibility.mts');
  const rewritten = source.replace(/from '([^']+)'/g, (_match, specifier: string) => {
    const target = specifier.startsWith('@theandril/') ? resolve(`packages/${specifier.slice('@theandril/'.length)}/src/index.ts`) : resolve('packages/sim/src', `${specifier}.ts`);
    return `from '${pathToFileURL(target).href}'`;
  });
  await writeFile(modulePath, rewritten);
  return import(pathToFileURL(modulePath).href);
}
const before = await load('disk-visibility-before.ts.txt'), after = await load('disk-visibility-candidate.ts.txt');
const frozen = JSON.parse(await readFile(new URL('baseline.json', import.meta.url), 'utf8')) as { results: { version: RulesVersion; name: string; origin: number; radius: number; snapshots: string[] }[] };
function capture(api: typeof visibility, game: GameState) {
  return { visible: [...api.indexes(game).visible].map(([owner, cells]) => [owner, [...cells].sort(([a], [b]) => a - b)]),
    explored: Object.entries(game.explored).map(([owner, cells]) => [owner, [...cells].sort((a, b) => a - b)]), land: game.land.known, roads: game.roads.known };
}
for (const item of frozen.results) for (const api of [before, after]) {
  const game = makeGame(), owner = game.turnOwnerId;
  api.rebuildIndexes(game);
  const snapshots = [digest(capture(api, game))];
  withRules(game, item.version, () => {
    for (const delta of [1, 1, -1, -1] as const) { api.updateSight(game, owner, item.origin, item.radius, delta); snapshots.push(digest(capture(api, game))); }
  });
  snapshots.push(digest(serializeGame(game)));
  assert.deepEqual(snapshots, item.snapshots, `Frozen lifecycle ${item.version}/${item.name}`);
}
const memoryResults = [];
for (const version of [8, 9, 11, 12, 17] as const) {
  const run = (api: typeof visibility) => {
    const game = makeGame(), owner = game.turnOwnerId, cell = 748;
    api.rebuildIndexes(game);
    const biome = game.world.biome[cell] === 5 ? 1 : 5;
    game.land.biomes[cell] = biome; game.roads.edges[cell] = 1;
    const snapshots: string[] = [];
    withRules(game, version, () => {
      for (const delta of [1, 1] as const) { api.updateSight(game, owner, cell, 1, delta); snapshots.push(digest(capture(api, game))); }
      assert.equal(game.land.known[owner]![cell]?.biome, version >= 9 ? biome : undefined);
      assert.equal(game.roads.known[owner]![cell], version >= 12 ? 1 : undefined);
      const memories = JSON.stringify({ land: game.land.known, roads: game.roads.known });
      delete game.land.biomes[cell]; delete game.roads.edges[cell];
      for (const delta of [-1, -1] as const) { api.updateSight(game, owner, cell, 1, delta); snapshots.push(digest(capture(api, game))); }
      assert.equal(JSON.stringify({ land: game.land.known, roads: game.roads.known }), memories);
      api.updateSight(game, owner, cell, 1, 1);
      assert.equal(game.land.known[owner]![cell], undefined); assert.equal(game.roads.known[owner]![cell], undefined);
      snapshots.push(digest(capture(api, game)), digest(serializeGame(game)));
    });
    return snapshots;
  };
  const expected = run(before); assert.deepEqual(run(after), expected); memoryResults.push({ version, snapshots: expected });
}
// Returned disks remain detached; each invocation owns and consumes its scratch.
const geometry = makeGame();
for (const origin of [0, 1, 47, 48, 49, 748, 1535]) for (const radius of [0, 1, 2, 3, 4]) {
  const expected = before.cellsWithin(geometry, origin, radius), disk = after.cellsWithin(geometry, origin, radius);
  assert.deepEqual(disk, expected); disk.reverse(); disk.push(-1);
  assert.deepEqual(after.cellsWithin(geometry, origin, radius), expected);
}
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const rows = [];
for (const version of [4, 9, 12, 17] as RulesVersion[]) for (const radius of [1, 3]) {
  const a = makeGame(), b = makeGame();
  for (const game of [a, b]) { game.land.biomes[748] = game.world.biome[748] === 5 ? 1 : 5; game.roads.edges[748] = 1; }
  before.rebuildIndexes(a); after.rebuildIndexes(b);
  const baseline = () => withRules(a, version, () => { before.updateSight(a, a.turnOwnerId, 748, radius, 1); before.updateSight(a, a.turnOwnerId, 748, radius, -1); });
  const candidate = () => withRules(b, version, () => { after.updateSight(b, b.turnOwnerId, 748, radius, 1); after.updateSight(b, b.turnOwnerId, 748, radius, -1); });
  for (let i = 0; i < 100; i++) { baseline(); candidate(); }
  const samples = { before: [] as number[], after: [] as number[] };
  for (let pair = 0; pair < 30; pair++) for (const key of (pair % 2 ? ['after', 'before'] : ['before', 'after']) as ('before' | 'after')[]) {
    const action = key === 'before' ? baseline : candidate, start = performance.now();
    for (let count = 0; count < 300; count++) action();
    samples[key].push((performance.now() - start) / 300);
    assert.equal(serializeGame(a), serializeGame(b));
    assert.deepEqual(capture(before, a), capture(after, b));
  }
  rows.push({ version, radius, beforeMedianMs: median(samples.before), afterMedianMs: median(samples.after), samples });
}
const sha = (source: string) => createHash('sha256').update(source).digest('hex');
await writeFile(new URL('disk-benchmark.json', import.meta.url), JSON.stringify({ node: process.version, cpu: cpus()[0]?.model,
  scope: 'Incremental complete positive+negative updateSight versus current disk-reuse visibility.32 frozen original lifecycles and5 memory sequences exact;35 detached disk cases exact.100 warmups/30 alternating pairs of300 lifecycles; full save and visibility equality outside timing. Not campaign timing.',
  beforeSourceSha256: sha(await readFile(new URL('disk-visibility-before.ts.txt', import.meta.url), 'utf8')),
  afterSourceSha256: sha(await readFile(new URL('disk-visibility-candidate.ts.txt', import.meta.url), 'utf8')),
  memoryResults, rows }, null, 2) + '\n');
console.log(JSON.stringify(rows.map(({ samples: _samples, ...row }) => row), null, 2));
