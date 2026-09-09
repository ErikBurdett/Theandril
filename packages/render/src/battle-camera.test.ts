import { expect, test } from 'vitest';
import { battleCameraPoint, battleCameraTransform } from './battle-camera';

test('normal battle view retains its exact existing layout and invalid zoom stays finite', () => {
  for (const zoom of [1, 0, -5, NaN, Infinity]) expect(battleCameraTransform(800, 400, 1600, zoom, { x: 700, y: 1500 }, { x: 10, y: -10 })).toEqual({ zoom: 1, x: 0, y: 0 });
  expect(battleCameraTransform(800, 400, 1600, 8, { x: 400, y: 800 }, { x: 0, y: 0 }).zoom).toBe(4);
});

test('a selected rank is centered, and pointer inversion recovers its canonical position', () => {
  const focus = { x: 400, y: 800 }, pan = { x: 0, y: 0 };
  const transform = battleCameraTransform(800, 400, 1600, 2, focus, pan);
  expect(transform).toEqual({ zoom: 2, x: -400, y: -1400 });
  expect(battleCameraPoint({ x: 400, y: 200 }, transform)).toEqual(focus);
  const soldier = { x: 431, y: 823 };
  const screen = { x: soldier.x * transform.zoom + transform.x, y: soldier.y * transform.zoom + transform.y };
  expect(battleCameraPoint(screen, transform)).toEqual(soldier);
  expect(focus).toEqual({ x: 400, y: 800 }); expect(pan).toEqual({ x: 0, y: 0 });
});

test.each([2, 4])('pan traverses one viewport at zoom%s and clamps all world edges', zoom => {
  const focus = { x: 400, y: 800 };
  const base = battleCameraTransform(800, 400, 1600, zoom, focus, { x: 0, y: 0 });
  const pan = battleCameraTransform(800, 400, 1600, zoom, focus, { x: 0, y: 1 });
  expect(pan.y - base.y).toBe(-400);
  expect(battleCameraTransform(800, 400, 1600, zoom, focus, { x: -100, y: -100 })).toEqual({ zoom, x: 0, y: 0 });
  expect(battleCameraTransform(800, 400, 1600, zoom, focus, { x: 100, y: 100 })).toEqual({ zoom, x: 800 - 800 * zoom, y: 400 - 1600 * zoom });
  for (const x of [-100, 0, 100]) for (const y of [-100, 0, 100]) {
    const camera = battleCameraTransform(800, 400, 1600, zoom, focus, { x, y });
    const upper = battleCameraPoint({ x: 0, y: 0 }, camera), lower = battleCameraPoint({ x: 800, y: 400 }, camera);
    expect(upper.x).toBeGreaterThanOrEqual(0); expect(upper.y).toBeGreaterThanOrEqual(0);
    expect(lower.x).toBeLessThanOrEqual(800); expect(lower.y).toBeLessThanOrEqual(1600);
  }
});
