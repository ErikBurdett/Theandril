import { describe, expect, it } from 'vitest';
import { IMPROVEMENTS } from '../../content/src/index';
import { drawImprovementGlyph, type GlyphPainter } from './improvement-glyphs';
import { dirtyTerritoryChunks, IMPROVEMENT_GLYPHS, settlementArtRole, territoryEdges, type ObservedOwner } from './territory-style';

describe('observed cached territory presentation', () => {
  it('draws outer borders but no same-settlement seams, without querying outside the map', () => {
    const a = { cell: 0, settlementId: 'town.a', factionId: 'realm.a' }, b = { ...a, cell: 1 };
    const requested: number[] = [];
    const edges = territoryEdges(a, 32, 32, id => { requested.push(id); return id === 1 ? b : undefined; });
    expect(edges).toHaveLength(5); expect(edges.every(edge => edge.kind === 'realm')).toBe(true);
    expect(requested.every(id => id >= 0 && id < 1024)).toBe(true);
    expect(territoryEdges({ cell: 1 }, 32, 32, () => a)).toEqual([]);
  });
  it('gives inner city borders a distinct subdued style and shared foreign edges only one line', () => {
    const a = { cell: 100, settlementId: 'town.a', factionId: 'realm.a' };
    const b = { ...a, cell: 101, settlementId: 'town.b' };
    const map = new Map<number, ObservedOwner>([[100, a], [101, b]]);
    expect(territoryEdges(a, 32, 32, id => map.get(id)).find(edge => edge.angle === 0)?.kind).toBe('settlement');
    expect(territoryEdges(b, 32, 32, id => map.get(id))).toHaveLength(5);
    b.factionId = 'realm.b';
    expect(territoryEdges(a, 32, 32, id => map.get(id)).find(edge => edge.angle === 0)?.kind).toBe('realm');
  });
  it('invalidates neighboring chunk owners on boundary changes, bounded independently of map area', () => {
    for (const width of [48, 512, 640]) for (const cell of [0, 15, 16, 15 * width + 15, 16 * width + 16]) {
      const keys = dirtyTerritoryChunks(cell, width, 480);
      expect(new Set(keys).size).toBe(keys.length); expect(keys.length).toBeLessThanOrEqual(7);
      expect(keys).toContain(`${Math.floor(cell % width / 16)},${Math.floor(Math.floor(cell / width) / 16)}`);
    }
    expect(dirtyTerritoryChunks(15 * 48 + 15, 48, 32)).toEqual(['0,0', '0,1', '1,0', '1,1']);
  });
  it('aligns all six shared edge normals with odd-row hex centers on both row parities', () => {
    const width = 48, height = 32;
    const center = (id: number) => { const row = Math.floor(id / width); return { x: Math.sqrt(3) * (id % width + .5 * (row & 1)), y: row * 1.5 }; };
    for (const row of [10, 11]) {
      const cell = row * width + 20, origin = center(cell), owner = { cell, settlementId: 'town.a', factionId: 'realm.a' };
      const edges = territoryEdges(owner, width, height, () => undefined);
      expect(edges).toHaveLength(6);
      const closest = [];
      for (let r = row - 1; r <= row + 1; r++) for (let c = 19; c <= 21; c++) {
        const id = r * width + c, target = center(id), dx = target.x - origin.x, dy = target.y - origin.y;
        if (Math.abs(Math.hypot(dx, dy) - Math.sqrt(3)) < 1e-8) closest.push({ id, dx, dy });
      }
      expect(closest).toHaveLength(6);
      for (const edge of edges) {
        const match = closest.filter(next => Math.abs(Math.cos(edge.angle) * Math.sqrt(3) - next.dx) < 1e-8 && Math.abs(Math.sin(edge.angle) * Math.sqrt(3) - next.dy) < 1e-8);
        expect(match).toHaveLength(1);
        const connected = territoryEdges(owner, width, height, id => id === match[0]!.id ? { ...owner, cell: id } : undefined);
        expect(connected.some(next => next.angle === edge.angle)).toBe(false);
      }
    }
  });
  it('binds all ten real improvements to known sprite fallbacks or an actual procedural program', () => {
    const approvedFallbacks = { 'improvement.terraced_fields': 'fields', 'improvement.managed_woodlot': 'woodlot',
      'improvement.quarry': 'quarry', 'improvement.reedworks': 'reeds', 'improvement.shore_fishery': 'fishery' };
    expect(IMPROVEMENTS).toHaveLength(10);
    expect(Object.keys(IMPROVEMENT_GLYPHS).sort()).toEqual(IMPROVEMENTS.map(item => item.id).sort());
    expect(new Set(Object.values(IMPROVEMENT_GLYPHS)).size).toBe(10);
    for (const [id, glyph] of Object.entries(approvedFallbacks)) expect(IMPROVEMENT_GLYPHS[id]).toBe(glyph);
    for (const improvement of IMPROVEMENTS.filter(item => !Object.hasOwn(approvedFallbacks, item.id))) {
      let rectangles = 0;
      const painter: GlyphPainter = { rect() { rectangles++; return this; }, fill() { return this; } };
      expect(drawImprovementGlyph(painter, IMPROVEMENT_GLYPHS[improvement.id]!, 0, 0, .4)).toBe(true);
      expect(rectangles).toBeGreaterThan(0);
    }
  });
  it('binds correct settlement stages without conflating capital and size', () => {
    expect([1, 2, 3, 7, 8, 100].map(settlementArtRole)).toEqual(['settlement.village', 'settlement.village', 'settlement.town', 'settlement.town', 'settlement.city', 'settlement.city']);
  });
});
