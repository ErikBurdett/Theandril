import { describe, expect, it } from 'vitest';
import { battleRevealOffset, mayAdvanceBattleWatch } from './battle-playback';
describe('explicit visible battle watch', () => {
  const ready = { watching: true, paused: false, busy: false, error: false, suspended: false, battle: true, playing: false };
  it('never schedules behind setup/modal review, after a battle, or before the prior action settles', () => {
    expect(mayAdvanceBattleWatch(ready)).toBe(true);
    for (const flag of ['paused', 'busy', 'error', 'suspended', 'playing'] as const) expect(mayAdvanceBattleWatch({ ...ready, [flag]: true })).toBe(false);
    expect(mayAdvanceBattleWatch({ ...ready, watching: false })).toBe(false);
    expect(mayAdvanceBattleWatch({ ...ready, battle: false })).toBe(false);
  });
  it('leaves visible targets alone and reveals offscreen targets immediately', () => {
    expect(battleRevealOffset(100, 140, 844)).toBe(0);
    expect(battleRevealOffset(900, 140, 844)).toBe(548);
    expect(battleRevealOffset(-300, 140, 844)).toBe(-652);
    expect(battleRevealOffset(0, 1200, 844)).toBe(178);
  });
});
