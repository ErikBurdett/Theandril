import { describe, expect, it } from 'vitest';
import { originalOverview, parseFamilyReviewArguments } from '../../../scripts/art-family-review';

describe('exact family review boundary', () => {
  it('accepts the new vampire culture and original cultures without changing stage', () => {
    expect(parseFamilyReviewArguments(['--family=vesper_court', '--stage=candidate'])).toEqual({ family: 'vesper_court', stage: 'candidate' });
    expect(parseFamilyReviewArguments(['--stage=approved', '--family=ashen_compact'])).toEqual({ family: 'ashen_compact', stage: 'approved' });
  });
  it.each([
    [], ['--family=vesper_court'], ['--family=vesper_court', '--approve'],
    ['--family=../escape', '--stage=candidate'], ['--family=testament_union', '--stage=candidate'],
    ['--family=vesper_court', '--stage=published'], ['--stage=candidate', '--stage=candidate'],
    ['--family=vesper_court', '--stage=candidate', '--approve'],
  ])('rejects ambiguous, unregistered or mutation arguments: %j', (...args) => {
    expect(() => parseFamilyReviewArguments(args as string[])).toThrow();
  });
  it('preserves source bytes, aspect and stable exact review pixels', () => {
    const source = { width: 2, height: 1, data: new Uint8Array([231, 16, 71, 255, 0, 0, 0, 0]) }, before = source.data.slice();
    const first = originalOverview([source]);
    expect(first.width).toBe(400); expect(first.height).toBe(400);
    expect(first.data).toEqual(originalOverview([source]).data);
    expect(source.data).toEqual(before);
    expect([...first.data.slice((104 * 400 + 8) * 4, (104 * 400 + 8) * 4 + 4)]).toEqual([231, 16, 71, 255]);
    expect([...first.data.slice((8 * 400 + 8) * 4, (8 * 400 + 8) * 4 + 4)]).toEqual([64, 64, 64, 255]);
  });
  it('bounds source review groups and rejects malformed inputs', () => {
    const source = { width: 1, height: 1, data: new Uint8Array(4) };
    expect(() => originalOverview([])).toThrow(); expect(() => originalOverview(Array(7).fill(source))).toThrow();
    expect(() => originalOverview([{ ...source, width: 2 }])).toThrow();
  });
});
