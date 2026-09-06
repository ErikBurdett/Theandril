import { describe, expect, it } from 'vitest';
import { mapArmyVisible, navalMarker, waterPresentation } from './naval-style';

describe('observation-derived naval presentation', () => {
  it('keeps land separate from observed coastal shelves and deep ocean', () => {
    expect(waterPresentation(1, 0)).toBe('land');
    expect(waterPresentation(0, 1)).toBe('shallows');
    expect(waterPresentation(0, 2)).toBe('deep');
    expect(waterPresentation(4, 2)).toBe('land');
  });
  it('does not create a second world marker for passengers carried by a fleet', () => {
    expect(mapArmyVisible({ carrierId: null })).toBe(true);
    expect(mapArmyVisible({ carrierId: 'army.2' })).toBe(false);
  });
  it('gives all three naval roles a ship silhouette instead of a land-unit substitute', () => {
    expect(navalMarker('unit.transport')).toBe('transport');
    expect(navalMarker('unit.coastal_warship')).toBe('coastal-warship');
    expect(navalMarker('unit.ocean_warship')).toBe('ocean-warship');
  });
});
