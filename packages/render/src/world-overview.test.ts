import { expect, test } from 'vitest';
import { worldOverviewPixels } from './world-overview';
import type { MapObservation } from '@theandril/sim';

const factions = [{ id: 'realm.a', color: 0xcc8844 }, { id: 'realm.b', color: 0x44aacc }];
const cells: MapObservation['cells'] = [
  { cell: 0, terrain: 1, biome: 1, waterDepth: 0, fertility: 80, visible: true, factionId: 'realm.a', settlementId: 'town.a' },
  { cell: 1, terrain: 1, biome: 1, waterDepth: 0, fertility: 80, visible: false, factionId: 'realm.b', settlementId: 'town.b' },
];
function color(raster: ReturnType<typeof worldOverviewPixels>, cell: number) {
  const offset = (cell * 2) * 4;
  return [...raster.pixels.slice(offset, offset + 3)];
}

test('political overview colors supplied claims while preserving remembered dimness and absent-cell fog', () => {
  const before = structuredClone(cells), options = { mode: 'political' as const, factions };
  const normal = worldOverviewPixels(3, 1, cells, options);
  expect(color(normal, 0)).toEqual([204, 136, 68]);
  expect(color(normal, 1)).toEqual([27, 68, 82]);
  expect(color(normal, 2)).toEqual([26, 37, 42]);
  const revealed = worldOverviewPixels(3, 1, [...cells.map(cell => ({ ...cell, visible: true })), { ...cells[0]!, cell: 2, factionId: 'realm.b' }], options);
  expect(color(revealed, 2)).toEqual([68, 170, 204]);
  // Restoring the original permitted input must reproduce the original fog.
  expect(worldOverviewPixels(3, 1, cells, options)).toEqual(normal);
  expect(cells).toEqual(before);
});

test('realm filters affect only territory coloration, never knowledge or terrain mode', () => {
  const all = worldOverviewPixels(3, 1, cells, { mode: 'political', factions });
  const one = worldOverviewPixels(3, 1, cells, { mode: 'political', factions, factionIds: ['realm.a'] });
  const none = worldOverviewPixels(3, 1, cells, { mode: 'political', factions, factionIds: [] });
  const unknown = worldOverviewPixels(3, 1, cells, { mode: 'political', factions, factionIds: ['realm.unseen'] });
  expect(color(one, 0)).toEqual(color(all, 0)); expect(color(one, 1)).not.toEqual(color(all, 1));
  expect(color(none, 0)).not.toEqual(color(all, 0)); expect(unknown).toEqual(none);
  expect(color(one, 2)).toEqual(color(all, 2));
  expect(worldOverviewPixels(3, 1, cells, { mode: 'terrain', factions, factionIds: [] })).toEqual(worldOverviewPixels(3, 1, cells));
});

test('a fully revealed Huge political raster remains one bounded four-pixel-per-hex buffer', () => {
  const count = 640 * 480;
  const supplied = Array.from({ length: count }, (_, cell) => ({ ...cells[cell % 2]!, cell, visible: true }));
  const raster = worldOverviewPixels(640, 480, supplied, { mode: 'political', factions });
  expect(raster.pixels.byteLength).toBe((640 * 2 + 1) * 480 * 2 * 4);
});
