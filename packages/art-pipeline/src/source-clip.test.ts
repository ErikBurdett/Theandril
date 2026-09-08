import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parseAssetManifest } from './schema';
import { singleSourceClip } from './source-clip';

const brief = parseAssetManifest(JSON.parse(await readFile(new URL('../../../assets/art/briefs/unit.scout.ashen_compact.json', import.meta.url), 'utf8')));

describe('authored single-clip source processing', () => {
  it('preserves the existing four-frame idle tag', () => {
    expect(singleSourceClip(brief)).toEqual({ name: 'idle', from: 0, to: 3 });
  });
  it('accepts real attack/cast one-shots without relabelling their poses as idle', () => {
    for (const state of ['attack', 'cast']) {
      const action = structuredClone(brief);
      action.animation.states = { [state]: { frames: 4, fps: 8, loop: false } };
      action.frames.forEach(frame => { frame.state = state; frame.durationMs = 125; });
      expect(singleSourceClip(action)).toEqual({ name: state, from: 0, to: 3 });
      expect(action.animation.states[state]!.loop).toBe(false);
    }
  });
  it('refuses mixed states, directions, missing or reordered frames', () => {
    const mixedState = structuredClone(brief); mixedState.frames[1]!.state = 'cast';
    const mixedFacing = structuredClone(brief); mixedFacing.frames[1]!.direction = 'nw';
    const reordered = structuredClone(brief); reordered.frames.reverse();
    const missing = structuredClone(brief); missing.frames.pop();
    const extraClip = structuredClone(brief); extraClip.animation.states.attack = { frames: 4, fps: 8, loop: false };
    for (const invalid of [mixedState, mixedFacing, reordered, missing, extraClip]) expect(() => singleSourceClip(invalid)).toThrow(/Source/);
  });
});
