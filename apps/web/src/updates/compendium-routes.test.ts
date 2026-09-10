import { describe, expect, it } from 'vitest';
import { resolveCulture, resolveUnit } from './compendium-routes';

describe('compendium routes', () => {
  it('accepts short and fully qualified culture ids and rejects unknown ones', () => {
    expect(resolveCulture('vesper_court')?.id).toBe('faction.vesper_court');
    expect(resolveCulture('faction.vesper_court')?.id).toBe('faction.vesper_court');
    expect(resolveCulture('nobody')).toBeUndefined();
    expect(resolveCulture(null)).toBeUndefined();
  });
  it('accepts short and fully qualified unit ids', () => {
    expect(resolveUnit('heavy_infantry')?.id).toBe('unit.heavy_infantry');
    expect(resolveUnit('unit.heavy_infantry')?.id).toBe('unit.heavy_infantry');
    expect(resolveUnit('dragon')).toBeUndefined();
  });
});
