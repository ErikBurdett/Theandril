import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import * as mapgen from '@theandril/mapgen';
import { capture, digest, lifecycle, makeGame } from '../../../docs/development/2026-09-21-verification-cost/visibility/corpus';
import { indexes, updateSight } from './visibility';
import { withRules, type RulesVersion } from './rules';

const baseline = JSON.parse(readFileSync(new URL('../../../docs/development/2026-09-21-verification-cost/visibility/baseline.json', import.meta.url), 'utf8')) as {
  results: { version: RulesVersion; name: string; origin: number; radius: number; snapshots: string[] }[];
};
afterEach(() => vi.restoreAllMocks());

test.each(baseline.results)('preserves original visibility lifecycle at rules $version / $name', item => {
  expect(lifecycle(item.version, item.origin, item.radius)).toEqual(item.snapshots);
});

test('one sight gain traverses its radius-three disk once while updating all three memory layers', () => {
  const game = makeGame(), owner = game.turnOwnerId;
  indexes(game); // Source/index initialization is separate from the measured update.
  // Authored nondefault memories exercise writes, not only empty-map deletion.
  game.land.biomes[748] = game.world.biome[748] === mapgen.BIOME.desert ? mapgen.BIOME.grassland : mapgen.BIOME.desert;
  game.roads.edges[748] = 1;
  const visits = vi.spyOn(mapgen, 'neighbors');
  updateSight(game, owner, 748, 3, 1);
  // Hex BFS visits 1 + 6 + 12 frontier cells. Previously three traversals made 57 calls.
  expect(visits.mock.calls.length).toBeLessThanOrEqual(19);
  expect(game.explored[owner]!.has(748)).toBe(true);
  expect(game.land.known[owner]![748]).toBeDefined();
  expect(game.roads.known[owner]![748]).toBeDefined();
});

test.each([8, 9, 11, 12, 17] as const)('rules %s refresh nondefault memory on arrival and preserve it on departure', version => {
  const game = makeGame(), owner = game.turnOwnerId;
  indexes(game);
  const cell = 748, biome = game.world.biome[cell] === mapgen.BIOME.desert ? mapgen.BIOME.grassland : mapgen.BIOME.desert;
  // This directly exercises the sight helper with authored overlays; existing
  // road/territory scenarios cover payment and legal construction separately.
  game.land.biomes[cell] = biome; game.roads.edges[cell] = 1;
  withRules(game, version, () => {
    updateSight(game, owner, cell, 1, 1);
    updateSight(game, owner, cell, 1, 1);
    expect(game.land.known[owner]![cell]?.biome).toBe(version >= 9 ? biome : undefined);
    expect(game.roads.known[owner]![cell]).toBe(version >= 12 ? 1 : undefined);
    const remembered = JSON.stringify({ land: game.land.known, roads: game.roads.known });
    delete game.land.biomes[cell]; delete game.roads.edges[cell];
    updateSight(game, owner, cell, 1, -1);
    updateSight(game, owner, cell, 1, -1);
    expect(JSON.stringify({ land: game.land.known, roads: game.roads.known })).toBe(remembered);
    expect(game.explored[owner]!.has(cell)).toBe(true);
    updateSight(game, owner, cell, 1, 1);
    expect(game.land.known[owner]![cell]).toBeUndefined();
    expect(game.roads.known[owner]![cell]).toBeUndefined();
  });
});

test('an unknown visibility owner is rejected without changing counters or memories', () => {
  const game = makeGame(), before = digest(capture(game));
  expect(() => updateSight(game, 'faction.missing', 748, 3, 1)).toThrow('Missing faction visibility');
  expect(digest(capture(game))).toBe(before);
});
