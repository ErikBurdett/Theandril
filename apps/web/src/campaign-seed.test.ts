import { describe, expect, it, vi } from 'vitest';
import { resolveCampaignSeed } from './campaign-seed';

describe('new campaign seed selection', () => {
  it('draws fresh browser entropy for each blank launch, including zero', () => {
    const entropy = vi.spyOn(crypto, 'getRandomValues')
      .mockImplementationOnce(array => { (array as Uint32Array)[0] = 0; return array; })
      .mockImplementationOnce(array => { (array as Uint32Array)[0] = 0xffff_ffff; return array; });
    try {
      expect(resolveCampaignSeed('')).toBe(0);
      expect(resolveCampaignSeed('   ', 0)).toBe(0xffff_ffff);
      expect(entropy).toHaveBeenCalledTimes(2);
    } finally { entropy.mockRestore(); }
  });

  it('redraws a random seed that would recreate the current world', () => {
    const entropy = vi.fn().mockReturnValueOnce(20260905).mockReturnValueOnce(17);
    expect(resolveCampaignSeed('', 20260905, entropy)).toBe(17);
    expect(entropy).toHaveBeenCalledTimes(2);
  });

  it.each(['0', '17', '20260905', '4294967295', ' 17 '])('retains explicit seed %s, even when repeating a world', input => {
    const entropy = vi.fn();
    const seed = Number(input);
    expect(resolveCampaignSeed(input, seed, entropy)).toBe(seed);
    expect(entropy).not.toHaveBeenCalled();
  });

  it.each(['-1', '0.5', '4294967296', '9007199254740992', 'NaN', 'Infinity', 'a new world'])('rejects invalid explicit seed %s without drawing randomness', input => {
    const entropy = vi.fn();
    expect(() => resolveCampaignSeed(input, undefined, entropy)).toThrow(RangeError);
    expect(entropy).not.toHaveBeenCalled();
  });
});
