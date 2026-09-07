import { describe, expect, it } from 'vitest';
import { Graphics } from 'pixi.js';
import { drawImprovementGlyph, PROCEDURAL_IMPROVEMENT_GLYPHS, type GlyphPainter } from './improvement-glyphs';

class Recorder implements GlyphPainter {
  rectangles: number[][] = [];
  fills: { color: number; alpha: number }[] = [];
  rect(...rectangle: [number, number, number, number]): this { this.rectangles.push(rectangle); return this; }
  fill(style: { color: number; alpha: number }): this { this.fills.push({ ...style }); return this; }
}

describe('original, static improvement identifiers', () => {
  it('binds exactly the five newly authored improvements without inventing approved assets', () => {
    expect(PROCEDURAL_IMPROVEMENT_GLYPHS).toEqual({
      'improvement.spring_garden': 'spring-garden', 'improvement.polder': 'polder',
      'improvement.grove_archive': 'grove-archive', 'improvement.oreworks': 'oreworks',
      'improvement.tide_observatory': 'tide-observatory',
    });
    expect(Object.isFrozen(PROCEDURAL_IMPROVEMENT_GLYPHS)).toBe(true);
  });

  it('keeps every footprint inside its 22×22 backing with at most 13 rectangles and two fills', () => {
    const silhouettes: string[] = [];
    for (const name of Object.values(PROCEDURAL_IMPROVEMENT_GLYPHS)) {
      const recorder = new Recorder();
      expect(drawImprovementGlyph(recorder, name, 0, 0, 1)).toBe(true);
      expect(recorder.rectangles.length).toBeGreaterThan(0);
      expect(recorder.rectangles.length).toBeLessThanOrEqual(13);
      expect(recorder.fills).toHaveLength(2);
      const pixels = new Set<string>();
      for (const [x, y, width, height] of recorder.rectangles as [number, number, number, number][]) {
        expect([x, y, width, height].every(Number.isInteger)).toBe(true);
        expect(width).toBeGreaterThan(0); expect(height).toBeGreaterThan(0);
        expect(x).toBeGreaterThanOrEqual(-10); expect(x + width).toBeLessThanOrEqual(10);
        expect(y).toBeGreaterThanOrEqual(-9); expect(y + height).toBeLessThanOrEqual(11);
        for (let py = y; py < y + height; py++) for (let px = x; px < x + width; px++) pixels.add(`${px},${py}`);
      }
      silhouettes.push([...pixels].sort().join(';'));
    }
    // Different occupancy even without either material color, not five palette swaps.
    expect(new Set(silhouettes).size).toBe(5);
  });

  it('preserves the observed fog alpha, translating geometry without retaining painter state', () => {
    for (const name of Object.values(PROCEDURAL_IMPROVEMENT_GLYPHS)) {
      const native = new Recorder(), moved = new Recorder(), retry = new Recorder();
      drawImprovementGlyph(native, name, 0, 0, 1);
      drawImprovementGlyph(moved, name, 1234.5, 987.25, .4);
      expect(moved.rectangles).toEqual(native.rectangles.map(([x, y, width, height]) => [x! + 1234.5, y! + 987.25, width, height]));
      expect(moved.fills.map(fill => fill.alpha)).toEqual([.4, .4]);
      // A consumer cannot rewrite later instructions through its captured outputs.
      moved.rectangles[0]![0] = 999999; moved.fills[0]!.color = 0;
      drawImprovementGlyph(retry, name, 0, 0, 1);
      expect(retry).toEqual(native);
    }
  });

  it('does not turn missing or inherited property names into valid glyphs', () => {
    for (const name of ['missing', 'toString', 'constructor', '__proto__', 'improvement.quarry']) {
      const recorder = new Recorder();
      expect(drawImprovementGlyph(recorder, name, 0, 0, 1)).toBe(false);
      expect(recorder.rectangles).toEqual([]); expect(recorder.fills).toEqual([]);
    }
  });

  it('appends to the actual Pixi chunk graphics without expanding the backing or creating scene children', () => {
    for (const name of Object.values(PROCEDURAL_IMPROVEMENT_GLYPHS)) for (const x of [0, 16000]) {
      const y = 9000, graphics = new Graphics().roundRect(x - 11, y - 10, 22, 22, 3).fill({ color: 0x202328, alpha: .34 });
      expect(drawImprovementGlyph(graphics, name, x, y, .4)).toBe(true);
      const bounds = graphics.getLocalBounds();
      expect({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }).toEqual({ x: x - 11, y: y - 10, width: 22, height: 22 });
      expect(graphics.context.instructions).toHaveLength(3);
      expect(graphics.children).toHaveLength(0);
      graphics.destroy();
    }
  });
});
