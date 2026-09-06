import { describe, expect, it } from 'vitest';
import { generateWorld, MAP_DIMENSIONS, RECOMMENDED_FACTION_COUNTS, recommendedFactionCount, type MapSize } from './index';

describe('new-campaign faction density recommendations', () => {
  it('provides bounded increasing defaults without changing explicit generation', () => {
    expect(RECOMMENDED_FACTION_COUNTS).toEqual({ tiny: 4, small: 12, standard: 24, huge: 32, legendary: 40 });
    for (const size of Object.keys(MAP_DIMENSIONS) as MapSize[]) {
      const count = recommendedFactionCount(size);
      expect(count).toBeGreaterThanOrEqual(1); expect(count).toBeLessThanOrEqual(48);
      expect(generateWorld(748291, size, count).starts).toHaveLength(count);
      expect(generateWorld(748291, size, 4).starts).toHaveLength(4);
    }
    expect(() => recommendedFactionCount('invalid' as MapSize)).toThrow('Unknown map size');
  });
});
