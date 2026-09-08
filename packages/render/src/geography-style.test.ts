import { describe, expect, it } from 'vitest';
import { directionNeighbor } from '@theandril/mapgen';
import { geographicConnections, lakeShoreAngles, riverHalfCurve, type GeographicCell } from './geography-style';
import { worldOverviewPixels } from './world-overview';

describe('observed river and road half-edge joins', () => {
  it('meanders inside each cell while preserving exact shared joins, tangents and confluence anchors', () => {
    const center = (cell: number): readonly [number, number] => [((cell % 48) + (Math.floor(cell / 48) & 1) * .5) * Math.sqrt(3) * 29, Math.floor(cell / 48) * 43.5];
    for (const origin of [16 * 48 + 15, 15 * 48 + 16]) {
      const starts: unknown[] = [];
      for (let direction = 1; direction <= 6; direction++) {
        const next = directionNeighbor(origin, 48, 32, direction)!;
        const first = riverHalfCurve(origin, next, center), second = riverHalfCurve(next, origin, center);
        expect(first.end).toEqual(second.end);
        for (const axis of [0, 1] as const) {
          expect(first.end[axis]).toBe((center(origin)[axis] + center(next)[axis]) / 2);
          expect(first.end[axis] - first.control2[axis]).toBeCloseTo(-(second.end[axis] - second.control2[axis]), 9);
        }
        for (const point of [first.start, first.control1, first.control2]) expect(Math.hypot(point[0] - center(origin)[0], point[1] - center(origin)[1])).toBeLessThan(25);
        const dx = first.end[0] - first.start[0], dy = first.end[1] - first.start[1];
        expect(Math.abs(dx * (first.control1[1] - first.start[1]) - dy * (first.control1[0] - first.start[0]))).toBeGreaterThan(1);
        starts.push(first.start);
        expect(riverHalfCurve(origin, next, center)).toEqual(first);
      }
      expect(starts.every(start => JSON.stringify(start) === JSON.stringify(starts[0]))).toBe(true);
    }
  });
  it('draws lake shores only against known land, never between lake cells or beside unknown ground', () => {
    const lake = { cell: 49, visible: true, terrain: 0, hydrology: 33 };
    const adjacentLake = { cell: 50, visible: true, terrain: 0, hydrology: 33 };
    expect(lakeShoreAngles(lake, 48, 32, id => id === 50 ? adjacentLake : undefined)).toEqual([]);
    expect(lakeShoreAngles(lake, 48, 32, id => id === 50 ? { ...adjacentLake, terrain: 4, hydrology: 0 } : undefined)).toEqual([0]);
    expect(lakeShoreAngles({ ...lake, hydrology: 0 }, 48, 32, id => ({ cell: id, visible: true, terrain: 4 }))).toEqual([]);
  });
  it('joins every compass direction consistently across even/odd rows and chunk boundaries', () => {
    for (const origin of [16 * 48 + 15, 15 * 48 + 16]) for (let direction = 1; direction <= 6; direction++) {
      const next = directionNeighbor(origin, 48, 32, direction)!;
      const cells = new Map<number, GeographicCell>([
        [origin, { cell: origin, visible: true, hydrology: 16 | direction, roadMask: 1 << (direction - 1) }],
        [next, { cell: next, visible: true, hydrology: 0, roadMask: 1 << ((direction + 2) % 6) }],
      ]);
      const first = geographicConnections(cells.get(origin)!, 48, 32, id => cells.get(id));
      const second = geographicConnections(cells.get(next)!, 48, 32, id => cells.get(id));
      expect(first.rivers).toEqual([{ neighbor: next, size: 2, alpha: 1 }]);
      expect(second.rivers).toEqual([{ neighbor: origin, size: 2, alpha: 1 }]);
      expect(first.roads).toEqual([{ neighbor: next, size: 1, alpha: 1 }]);
      expect(second.roads).toEqual([{ neighbor: origin, size: 1, alpha: 1 }]);
    }
  });
  it('never joins into unknown cells, invents a reverse road, or paints internal lake drainage as a river', () => {
    const cell = { cell: 49, visible: true, hydrology: 17, roadMask: 1 };
    expect(geographicConnections(cell, 48, 32, () => undefined)).toEqual({ rivers: [], roads: [] });
    const next = { cell: 50, visible: false, hydrology: 33, roadMask: 0 };
    const lookup = (id: number) => id === 50 ? next : undefined;
    expect(geographicConnections(cell, 48, 32, lookup)).toEqual({ rivers: [{ neighbor: 50, size: 2, alpha: .4 }], roads: [] });
    expect(geographicConnections({ ...cell, hydrology: 33 }, 48, 32, lookup)).toEqual({ rivers: [], roads: [] });
  });
  it('never wraps a map-border connection to the next row', () => {
    const edge = { cell: 47, visible: true, hydrology: 9, roadMask: 1 };
    expect(geographicConnections(edge, 48, 32, cell => ({ cell, visible: true, roadMask: 63 }))).toEqual({ rivers: [], roads: [] });
  });
});

describe('bounded map overview raster', () => {
  it('samples only supplied known cells, retaining black unexplored regions and dim memory', () => {
    const cell = { cell: 0, terrain: 1, biome: 1, waterDepth: 0, fertility: 0, visible: true };
    const known = worldOverviewPixels(48, 32, [cell]), dim = worldOverviewPixels(48, 32, [{ ...cell, visible: false }]);
    expect(known.width).toBe(97); expect(known.height).toBe(64);
    expect([...known.pixels.slice(0, 3)]).toEqual([0x74, 0x76, 0x58]);
    expect([...known.pixels.slice(8, 12)]).toEqual([26, 37, 42, 255]);
    expect(dim.pixels[0]).toBeLessThan(known.pixels[0]!);
    expect(cell.visible).toBe(true);
  });
  it('fits Legendary in one bounded raster and rejects unbounded dimensions or out-of-map cells', () => {
    const raster = worldOverviewPixels(640, 480, []);
    expect(raster.pixels.byteLength).toBe(1281 * 960 * 4);
    expect(raster.pixels.byteLength).toBeLessThan(5 * 1024 * 1024);
    expect(() => worldOverviewPixels(1000, 1000, [])).toThrow('dimensions');
    expect(() => worldOverviewPixels(2, 2, [{ cell: 4, terrain: 0, biome: 0, waterDepth: 2, fertility: 0, visible: true }])).toThrow('cell');
  });
});
