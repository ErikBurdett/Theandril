import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('web deployment base configuration', () => {
  it.each([
    [undefined, '/'],
    ['', '/'],
    ['/', '/'],
    ['/Theandril/', '/Theandril/'],
  ])('uses VITE_BASE_PATH=%s without making local builds depend on Pages', async (value, expected) => {
    vi.stubEnv('VITE_BASE_PATH', value);
    vi.resetModules();
    const { default: config } = await import('../vite.config');
    expect(config.base).toBe(expected);
    expect(config.plugins).toHaveLength(1);
  });
});
