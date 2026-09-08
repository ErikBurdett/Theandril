import { describe, expect, it } from 'vitest';
import { SELECTION_CYCLE_MS, selectionContourAlpha, selectionGlintAlpha, selectionSilhouette } from './selection-effect';

describe('asset-local selection contours', () => {
  it('outlines only the opaque silhouette, without painting source pixels or its empty source canvas', () => {
    const rgba = new Uint8ClampedArray(8 * 8 * 4);
    for (const [x, y] of [[3, 2], [3, 3], [3, 4], [4, 4]]) rgba[(y! * 8 + x!) * 4 + 3] = 255;
    const before = rgba.slice(), mask = selectionSilhouette(rgba, 8, 8);
    expect(rgba).toEqual(before);
    expect(mask.bounds).toEqual({ x: 2, y: 1, width: 4, height: 5 });
    expect(mask.width).toBe(12); expect(mask.height).toBe(12);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (rgba[(y * 8 + x) * 4 + 3]) expect(mask.pixels[((y + 2) * 12 + x + 2) * 4 + 3]).toBe(0);
    expect(mask.pixels[3]).toBe(0);
    expect(mask.points).toHaveLength(3);
    for (const point of mask.points) expect(mask.pixels[((point.y + 2) * 12 + point.x + 2) * 4 + 3]).toBe(255);
    expect(mask.contourPixels).toBeLessThan(64);
  });
  it('handles edge-touching and transparent frames without reading beyond the frame or creating a box', () => {
    const empty = selectionSilhouette(new Uint8ClampedArray(4 * 4 * 4), 4, 4);
    expect(empty.bounds).toBeNull(); expect(empty.points).toEqual([]); expect(empty.contourPixels).toBe(0);
    const rgba = new Uint8ClampedArray(4 * 4 * 4); rgba[3] = 255; rgba[7] = 127;
    const corner = selectionSilhouette(rgba, 4, 4);
    expect(corner.contourPixels).toBe(8);
    expect(corner.bounds).toEqual({ x: -1, y: -1, width: 3, height: 3 });
    expect(() => selectionSilhouette(rgba, 3, 4)).toThrow();
    expect(() => selectionSilhouette([], 1000, 1000)).toThrow();
  });
  it('uses a slow bounded opacity-only cycle, with entirely static reduced-motion/far output', () => {
    for (let time = 0; time <= 20_000; time += 16) {
      const contour = selectionContourAlpha(time, true);
      expect(contour).toBeGreaterThanOrEqual(.35); expect(contour).toBeLessThanOrEqual(.57);
      expect(Math.abs(contour - selectionContourAlpha(time + 16, true))).toBeLessThan(.003);
      expect(selectionContourAlpha(time, false)).toBe(.5);
      for (let index = 0; index < 3; index++) {
        expect(selectionGlintAlpha(time, index, false)).toBe(0);
        expect(selectionGlintAlpha(time, index, true)).toBeGreaterThanOrEqual(0);
        expect(selectionGlintAlpha(time, index, true)).toBeLessThanOrEqual(.8);
        expect(selectionGlintAlpha(time + SELECTION_CYCLE_MS, index, true)).toBeCloseTo(selectionGlintAlpha(time, index, true), 10);
      }
    }
  });
});
