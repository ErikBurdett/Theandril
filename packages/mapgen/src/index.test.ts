import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  generateWorld, GENERATOR_VERSION, hexDistance, isPassable, MAP_DIMENSIONS, neighbors,
  SeededRandom, TERRAIN, type MapSize, type World,
} from './index';

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
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 35 }), fc.integer({ min: 1, max: 35 }),
      (width, height) => {
        for (let cell = 0; cell < width * height; cell++) {
          const adjacent = neighbors(cell, width, height);
          expect(adjacent.length).toBeLessThanOrEqual(6);
          expect(new Set(adjacent).size).toBe(adjacent.length);
          for (const next of adjacent) {
            expect(next).toBeGreaterThanOrEqual(0);
            expect(next).toBeLessThan(width * height);
            expect(neighbors(next, width, height)).toContain(cell);
            expect(hexDistance(cell, next, width)).toBe(1);
          }
        }
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

describe('world generation', () => {
  it('preserves the versioned seed fixture for saves and replays', () => {
    const world = generateWorld(20260905, 'tiny', 8, 1);
    expect(GENERATOR_VERSION).toBe(4);
    expect({ version: world.generatorVersion, fingerprint: fingerprint(world), starts: world.starts })
      .toEqual({
        version: 1,
        fingerprint: '20260905:48:32:88244012',
        starts: [488, 1052, 318, 1132, 1164, 428, 644, 756],
      });
  });

  it.each(Object.keys(MAP_DIMENSIONS) as MapSize[])('generates %s at its declared scale reproducibly', (size) => {
    const world = generateWorld(20260905, size, 48);
    const dimensions = MAP_DIMENSIONS[size];
    expect(world.width).toBe(dimensions.width);
    expect(world.height).toBe(dimensions.height);
    expect(world.terrain).toBeInstanceOf(Uint8Array);
    expect(world.fertility).toBeInstanceOf(Uint8Array);
    expect(world.biome).toBeInstanceOf(Uint8Array);
    expect(world.terrain.length).toBe(dimensions.width * dimensions.height);
    expect(world.fertility.length).toBe(world.terrain.length);
    expect(world.biome.length).toBe(world.terrain.length);
    expect(world.starts).toHaveLength(48);
    expect(fingerprint(generateWorld(20260905, size, 48))).toBe(fingerprint(world));
    const land = world.terrain.reduce((sum, terrain) => sum + Number(terrain !== TERRAIN.water), 0);
    expect(land / world.terrain.length).toBeGreaterThan(0.3);
    expect(land / world.terrain.length).toBeLessThan(0.8);
    expect(new Set(world.terrain).size).toBe(5);
    expect(world.fertility.every((food) => food >= 0 && food <= 100)).toBe(true);
    const connected = reachable(world, world.starts[0]!);
    for (const start of world.starts) expect(connected.has(start)).toBe(true);
  });

  it('gives every faction fertile, connected expansion space across arbitrary seeds', () => {
    fc.assert(fc.property(
      fc.integer({ min: -2147483648, max: 4294967295 }),
      fc.integer({ min: 1, max: 48 }),
      (seed, count) => {
        const world = generateWorld(seed, 'tiny', count);
        expect(fingerprint(generateWorld(seed, 'tiny', count))).toBe(fingerprint(world));
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
    ), { numRuns: 150, seed: 20260905 });
  });

  it('has coherent land and forest patches rather than independent tile noise', () => {
    const world = generateWorld(42, 'small', 8);
    let matching = 0;
    let compared = 0;
    for (let cell = 0; cell < world.terrain.length; cell++) {
      const east = cell + 1;
      if (east % world.width === 0) continue;
      compared++;
      if (world.terrain[east] === world.terrain[cell]) matching++;
    }
    expect(matching / compared).toBeGreaterThan(0.85);
    expect(fingerprint(world)).not.toBe(fingerprint(generateWorld(43, 'small', 8)));
  });

  it('canonicalizes equivalent 32-bit seeds and rejects unsupported settings', () => {
    expect(fingerprint(generateWorld(-1, 'tiny', 4)))
      .toBe(fingerprint(generateWorld(4294967295, 'tiny', 4)));
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
