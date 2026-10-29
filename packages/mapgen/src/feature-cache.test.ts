import { expect, test } from 'vitest';
import { generateWorld, naturalFeatures } from './index';

test('natural features are memoized per world without changing any cell, and invalid cells still throw', () => {
  const world = generateWorld(20260906, 'tiny', 2);
  const first = Array.from({ length: world.terrain.length }, (_, cell) => naturalFeatures(world, cell));
  const again = Array.from({ length: world.terrain.length }, (_, cell) => naturalFeatures(world, cell));
  expect(again).toEqual(first);
  // Independent construction of the same world computes the same bits from scratch.
  const twin = generateWorld(20260906, 'tiny', 2);
  expect(Array.from({ length: twin.terrain.length }, (_, cell) => naturalFeatures(twin, cell))).toEqual(first);
  expect(first.some(bits => bits & 64)).toBe(true);
  expect(first.every(bits => bits >= 0 && bits < 128)).toBe(true);
  expect(() => naturalFeatures(world, world.terrain.length)).toThrow(RangeError);
  expect(() => naturalFeatures(world, -1)).toThrow(RangeError);
  expect(() => naturalFeatures(world, 1.5)).toThrow(RangeError);
});
