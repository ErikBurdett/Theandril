import { describe, expect, it } from 'vitest';
import { neighbors, neighborsInto } from './index';

describe('scratch hex topology', () => {
  it('preserves the complete clockwise topology across narrow maps, parity and every edge', () => {
    const scratch: number[] = [999];
    for (const width of [1, 2, 3, 7, 32, 65]) for (const height of [1, 2, 3, 9, 64]) {
      for (let cell = 0; cell < width * height; cell++) {
        const expected = neighbors(cell, width, height);
        expect(neighborsInto(cell, width, height, scratch)).toBe(scratch);
        expect(scratch).toEqual(expected);
        // Existing callers retain independently owned results across reuse.
        neighborsInto(0, 1, 1, scratch);
        expect(scratch).toEqual([]);
        expect(neighbors(cell, width, height)).toEqual(expected);
      }
    }
  });

  it('clears prior contents for the same invalid coordinates as the original API', () => {
    const invalid: [number, number, number][] = [
      [-1, 4, 4], [16, 4, 4], [1.5, 4, 4], [NaN, 4, 4], [Infinity, 4, 4],
      [0, 0, 4], [0, -1, 4], [0, 1.5, 4], [0, NaN, 4], [0, Infinity, 4],
      [0, 4, 0], [0, 4, -1], [0, 4, 1.5], [0, 4, NaN], [0, 4, Infinity],
    ];
    for (const [cell, width, height] of invalid) {
      const scratch = [1, 2, 3, 4, 5, 6, 7];
      expect(neighborsInto(cell, width, height, scratch)).toBe(scratch);
      expect(scratch).toEqual(neighbors(cell, width, height));
      expect(scratch).toEqual([]);
    }
  });
});
