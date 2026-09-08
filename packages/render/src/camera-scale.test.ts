import { describe, expect, it } from 'vitest';
import { cameraPresentation, detailScaleFloor, nextCameraScale, worldFitScale } from './camera-scale';

describe('continuous bounded camera scale', () => {
  it('distinguishes actual world overview from far markers at overlapping zoom scales', () => {
    expect(cameraPresentation(.42, true)).toBe('world-overview');
    expect(cameraPresentation(.42, false)).toBe('strategic-glyphs');
    expect(cameraPresentation(.65, false)).toBe('static-sprites');
    expect(cameraPresentation(1.2, false)).toBe('near-sprites');
  });
  it.each([[1440, 1000], [390, 844]])('reaches true Huge fit through ordinary zoom and returns continuously at %s×%s', (width, height) => {
    const fit = worldFitScale({ viewportWidth: width, viewportHeight: height, worldWidth: 512.5 * Math.sqrt(3) * 29, worldHeight: 384 * 43.5 });
    const detail = detailScaleFloor(width, height, 16 * Math.sqrt(3) * 29, 16 * 43.5);
    let scale = 1, transitions = 0, prior = false;
    for (let step = 0; step < 60; step++) {
      const next = nextCameraScale(scale, .8, fit, detail);
      expect(next.scale).toBeLessThanOrEqual(scale);
      if (next.overview !== prior) transitions++;
      prior = next.overview; scale = next.scale;
    }
    expect(scale).toBe(fit); expect(transitions).toBe(1);
    const next = nextCameraScale(scale, 1.25, fit, detail);
    expect(next.scale).toBeCloseTo(fit * 1.25); expect(next.overview).toBe(true);
    const local = nextCameraScale(scale, 1 / fit, fit, detail);
    expect(local).toMatchObject({ atFit: false, overview: false }); expect(local.scale).toBeCloseTo(1, 12);
  });
  it('bounds detailed viewport dimensions even on exceptionally large browser windows', () => {
    const floor = detailScaleFloor(7680, 4320, 800, 696);
    expect(7680 / floor / 800).toBeLessThanOrEqual(6);
    expect(4320 / floor / 696).toBeLessThanOrEqual(6);
    expect(nextCameraScale(1, 100, .01, .35).scale).toBe(2.2);
  });
});
