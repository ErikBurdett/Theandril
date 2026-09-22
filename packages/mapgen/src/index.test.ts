import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  generateWorld as generateCurrentWorld, hexDistance, isPassable, neighbors, neighborsInto,
  SeededRandom, TERRAIN, type MapSize, type World,
} from './index';

// These are the original connected-continent guarantees. V5 has independent
// multi-landmass fairness/topology tests; do not weaken historical expectations.
// Byte-exact generator1–7 output is sealed in historical-seals.test.ts.
const generateWorld: typeof generateCurrentWorld = (seed, size, count, version = 4, options) => generateCurrentWorld(seed, size, count, version, options);

function fingerprint(world: World): string {
  let hash = 0x811c9dc5;
  for (const cells of [world.terrain, world.fertility, world.starts]) {
    for (const value of cells) hash = Math.imul(hash ^ value, 0x01000193) >>> 0;
  }
  return `${world.seed}:${world.width}:${world.height}:${hash.toString(16)}`;
}

function reachable(world: World, origin: number): Set<number> {
  const seen = new Set([origin]);
  const queue = [origin];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const cell of neighbors(queue[cursor]!, world.width, world.height)) {
      if (isPassable(world.terrain[cell]!) && !seen.has(cell)) {
        seen.add(cell);
        queue.push(cell);
      }
    }
  }
  return seen;
}

describe('seeded integer random streams', () => {
  it('can serialize and restore a stream, including the zero seed', () => {
    const original = new SeededRandom(0);
    const first = original.nextUint32();
    expect(first).not.toBe(0);
    const resumed = new SeededRandom(original.state);
    expect(Array.from({ length: 100 }, () => original.nextUint32()))
      .toEqual(Array.from({ length: 100 }, () => resumed.nextUint32()));
  });

  it('matches exact unsigned multiplication for bounded integers', () => {
    fc.assert(fc.property(
      fc.integer({ min: -2147483648, max: 4294967295 }),
      fc.integer({ min: 1, max: 4294967296 }),
      (seed, bound) => {
        const reference = BigInt(new SeededRandom(seed).nextUint32()) * BigInt(bound) / 4294967296n;
        expect(new SeededRandom(seed).nextInt(bound)).toBe(Number(reference));
      },
    ), { numRuns: 500 });
  });

  it('rejects malformed seeds and bounds instead of silently propagating NaN', () => {
    for (const seed of [NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => new SeededRandom(seed)).toThrow(RangeError);
    }
    for (const bound of [0, -1, 0.5, Infinity, 4294967297]) {
      expect(() => new SeededRandom(1).nextInt(bound)).toThrow(RangeError);
    }
  });
});

describe('odd-row hex geometry', () => {
  it('has clockwise, parity-correct neighbors and does not wrap at edges', () => {
    expect(neighbors(0, 4, 3)).toEqual([1, 4]);
    expect(neighbors(4, 4, 3)).toEqual([5, 9, 8, 0, 1]);
    expect(neighbors(3, 4, 3)).toEqual([7, 6, 2]);
    expect(neighbors(0, 1, 1)).toEqual([]);
    expect(neighbors(-1, 4, 3)).toEqual([]);
    expect(neighbors(12, 4, 3)).toEqual([]);
    expect(neighbors(1.5, 4, 3)).toEqual([]);
    expect(neighbors(0, 0, 3)).toEqual([]);
  });

  it('keeps every edge reciprocal, bounded, unique and exactly one hex long', () => {
    // One aggregated assertion per grid: the same checks without ~10^5 expect calls.
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 35 }), fc.integer({ min: 1, max: 35 }),
      (width, height) => {
        const violations: string[] = [];
        for (let cell = 0; cell < width * height; cell++) {
          const adjacent = neighbors(cell, width, height);
          if (adjacent.length > 6 || new Set(adjacent).size !== adjacent.length) violations.push(`${cell}: shape`);
          for (const next of adjacent) {
            if (next < 0 || next >= width * height || !neighbors(next, width, height).includes(cell) || hexDistance(cell, next, width) !== 1) {
              violations.push(`${cell}->${next}`);
            }
          }
        }
        expect(violations).toEqual([]);
      },
    ), { numRuns: 25 });
  });

  it('distance equals shortest path on an unobstructed grid', () => {
    const width = 6;
    const height = 5;
    for (let origin = 0; origin < width * height; origin++) {
      const distance = new Int32Array(width * height).fill(-1);
      distance[origin] = 0;
      const queue = [origin];
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const cell = queue[cursor]!;
        for (const next of neighbors(cell, width, height)) {
          if (distance[next] === -1) {
            distance[next] = distance[cell]! + 1;
            queue.push(next);
          }
        }
      }
      for (let cell = 0; cell < width * height; cell++) {
        expect(hexDistance(origin, cell, width)).toBe(distance[cell]);
      }
    }
  });

  it('only recognizes defined terrestrial movement classes', () => {
    expect([0, 1, 2, 3, 4, 5, NaN].map(isPassable))
      .toEqual([false, true, true, true, false, false, false]);
  });
});

describe('scratch hex topology', () => {
  it('preserves the complete clockwise topology across narrow maps, parity and every edge', () => {
    const scratch: number[] = [999], mismatches: string[] = [];
    for (const width of [1, 2, 3, 7, 32, 65]) for (const height of [1, 2, 3, 9, 64]) {
      for (let cell = 0; cell < width * height; cell++) {
        const expected = neighbors(cell, width, height);
        if (neighborsInto(cell, width, height, scratch) !== scratch || scratch.join() !== expected.join()) mismatches.push(`${width}x${height}:${cell}`);
        // Existing callers retain independently owned results across reuse.
        neighborsInto(0, 1, 1, scratch);
        if (scratch.length || neighbors(cell, width, height).join() !== expected.join()) mismatches.push(`${width}x${height}:${cell} reuse`);
      }
    }
    expect(mismatches).toEqual([]);
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

describe('world generation', () => {
  it('keeps the historical connected-start fixture on Tiny', () => {
    const world = generateWorld(20260905, 'tiny', 8, 1);
    expect({ version: world.generatorVersion, fingerprint: fingerprint(world), starts: world.starts })
      .toEqual({
        version: 1,
        fingerprint: '20260905:48:32:88244012',
        starts: [488, 1052, 318, 1132, 1164, 428, 644, 756],
      });
  });

  it('generates Tiny and Small at declared scale with coherent land and every start connected', () => {
    for (const size of ['tiny', 'small'] as MapSize[]) {
      const world = generateWorld(20260905, size, 48);
      expect(world.terrain.length).toBe(world.width * world.height);
      expect(world.fertility.length).toBe(world.terrain.length);
      expect(world.biome.length).toBe(world.terrain.length);
      expect(world.starts).toHaveLength(48);
      const land = world.terrain.reduce((sum, terrain) => sum + Number(terrain !== TERRAIN.water), 0);
      expect(land / world.terrain.length).toBeGreaterThan(0.3);
      expect(land / world.terrain.length).toBeLessThan(0.8);
      expect(new Set(world.terrain).size).toBe(5);
      expect(world.fertility.every((food) => food >= 0 && food <= 100)).toBe(true);
      const connected = reachable(world, world.starts[0]!);
      for (const start of world.starts) expect(connected.has(start)).toBe(true);
    }
  });

  it('gives every faction fertile, connected expansion space across arbitrary seeds', () => {
    fc.assert(fc.property(
      fc.integer({ min: -2147483648, max: 4294967295 }),
      fc.integer({ min: 1, max: 48 }),
      (seed, count) => {
        const world = generateWorld(seed, 'tiny', count);
        expect(new Set(world.starts).size).toBe(count);
        const connected = reachable(world, world.starts[0]!);
        expect(connected.size).toBeGreaterThan(count * 5);
        for (const [index, start] of world.starts.entries()) {
          expect(connected.has(start)).toBe(true);
          expect(isPassable(world.terrain[start]!)).toBe(true);
          expect(world.fertility[start]).toBeGreaterThanOrEqual(75);
          const adjacent = neighbors(start, world.width, world.height);
          expect(adjacent.filter((cell) => isPassable(world.terrain[cell]!)).length).toBeGreaterThanOrEqual(4);
          expect(adjacent.some((cell) => world.fertility[cell]! >= 70)).toBe(true);
          for (const other of world.starts.slice(index + 1)) {
            expect(hexDistance(start, other, world.width)).toBeGreaterThanOrEqual(2);
          }
        }
      },
    ), { numRuns: 25, seed: 20260905 });
  });

  it('canonicalizes equivalent 32-bit seeds and rejects unsupported settings', () => {
    expect(fingerprint(generateWorld(-1, 'tiny', 4)))
      .toBe(fingerprint(generateWorld(4294967295, 'tiny', 4)));
    expect(fingerprint(generateWorld(-1, 'tiny', 4, 8, { layout: 'fractal' })))
      .toBe(fingerprint(generateWorld(4294967295, 'tiny', 4, 8, { layout: 'fractal' })));
    for (const count of [0, -1, 49, 1.5, NaN]) {
      expect(() => generateWorld(42, 'tiny', count)).toThrow(RangeError);
    }
    expect(() => generateWorld(NaN, 'tiny', 4)).toThrow(RangeError);
    expect(() => generateWorld(42, 'invalid' as MapSize, 4)).toThrow(RangeError);
    expect(() => generateWorld(42, '__proto__' as MapSize, 4)).toThrow(RangeError);
  });

  it('returns independent mutable buffers for independent campaigns', () => {
    const first = generateWorld(7, 'tiny', 4);
    const second = generateWorld(7, 'tiny', 4);
    first.terrain[0] = TERRAIN.mountain;
    first.biome[0] = 9;
    first.fertility[0] = 100;
    first.starts.push(0);
    expect(second.terrain[0]).toBe(TERRAIN.water);
    expect(second.biome[0]).toBe(0);
    expect(second.fertility[0]).toBe(0);
    expect(second.starts).toHaveLength(4);
  });
});
