import { describe, expect, it } from 'vitest';
import { selectClipFrame } from './animation';

const asset = { clips: [
  { id: 'unit.test/idle/se', state: 'idle', direction: 'se', frames: ['idle0', 'idle1'], durationsMs: [100, 200], loop: true },
  { id: 'unit.test/attack/se', state: 'attack', direction: 'se', frames: ['attack0', 'attack1', 'attack2'], durationsMs: [50, 100, 150], loop: false },
] };

describe('approved state-selectable presentation clips', () => {
  it('keeps ordinary idle/static selection compatible and follows unequal durations', () => {
    expect(selectClipFrame(asset)?.frameId).toBe('idle0');
    expect([0, 99, 100, 299, 300, 400].map(elapsedMs => selectClipFrame(asset, { elapsedMs, animate: true })?.frameId))
      .toEqual(['idle0', 'idle0', 'idle1', 'idle1', 'idle0', 'idle1']);
  });
  it('plays an explicitly requested one-shot and holds its final registered frame', () => {
    expect([0, 49, 50, 149, 150, 299, 300, 10000].map(elapsedMs => selectClipFrame(asset, { state: 'attack', elapsedMs, animate: true })?.frameId))
      .toEqual(['attack0', 'attack0', 'attack1', 'attack1', 'attack2', 'attack2', 'attack2', 'attack2']);
    expect(selectClipFrame(asset, { state: 'attack', elapsedMs: 300, animate: true })?.completed).toBe(true);
    expect(selectClipFrame(asset, { elapsedMs: 10000, animate: true })?.completed).toBe(false);
  });
  it('reports absent states without pretending an idle pose is an attack or cast', () => {
    expect(selectClipFrame(asset, { state: 'cast', animate: true })).toBeUndefined();
    expect(selectClipFrame({ clips: [] })).toBeUndefined();
    expect(selectClipFrame(asset, { state: 'attack', direction: 'nw' })).toMatchObject({ direction: 'se', frameId: 'attack0' });
  });
  it('keeps static/reduced presentation on its first pose and normalizes bad clocks', () => {
    expect(selectClipFrame(asset, { state: 'attack', elapsedMs: 250, animate: false })?.frameId).toBe('attack0');
    for (const elapsedMs of [-1, NaN, Infinity, -Infinity]) expect(selectClipFrame(asset, { state: 'attack', elapsedMs, animate: true })?.frameId).toBe('attack0');
  });
});
