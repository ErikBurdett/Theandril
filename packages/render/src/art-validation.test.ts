import { describe, expect, it } from 'vitest';
import { validateAtlasData } from './art-validation';

const atlas = { id: 'foundation', width: 128, height: 128 };
const assets = [{ nativeResolution: { width: 64, height: 64 }, pivot: [32, 56] as [number, number], frames: [{ id: 'unit.guard/idle/se/0', frame: { x: 4, y: 4, w: 64, h: 64 }, direction: 'se', state: 'idle', index: 0, durationMs: 200 }], clips: [{ id: 'unit.guard/idle/se', frames: ['unit.guard/idle/se/0'], durationsMs: [200], state: 'idle', direction: 'se', loop: false }] }];
function data() { return { frames: { 'unit.guard/idle/se/0': { frame: { x: 4, y: 4, w: 64, h: 64 }, rotated: false, trimmed: false, sourceSize: { w: 64, h: 64 }, spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 }, anchor: { x: .5, y: .875 } } }, animations: { 'unit.guard/idle/se': ['unit.guard/idle/se/0'] }, meta: { scale: '1', size: { w: 128, h: 128 } } }; }
describe('approved Pixi atlas boundary', () => {
  it('accepts an exact native source canvas and catalog rectangle', () => { const input = data(); expect(validateAtlasData(input, atlas, assets)).toBe(input); });
  it('rejects unlisted or missing texture frames', () => {
    expect(() => validateAtlasData({ ...data(), frames: {} }, atlas, assets)).toThrow('missing frames');
    expect(() => validateAtlasData({ ...data(), frames: { ...data().frames, candidate: data().frames['unit.guard/idle/se/0'] } }, atlas, assets)).toThrow('undeclared');
  });
  it('rejects shifted, rotated, and trimmed artwork', () => {
    const shifted = data(); shifted.frames['unit.guard/idle/se/0'].frame.x++;
    expect(() => validateAtlasData(shifted, atlas, assets)).toThrow('rectangle mismatch');
    const rotated = data(); rotated.frames['unit.guard/idle/se/0'].rotated = true;
    expect(() => validateAtlasData(rotated, atlas, assets)).toThrow('rectangle mismatch');
    const trimmed = data(); trimmed.frames['unit.guard/idle/se/0'].trimmed = true;
    expect(() => validateAtlasData(trimmed, atlas, assets)).toThrow('trimming');
  });
  it('rejects wrong source dimensions, scale, page bounds, and malformed JSON', () => {
    const wrongSize = data(); wrongSize.frames['unit.guard/idle/se/0'].sourceSize.w = 32;
    expect(() => validateAtlasData(wrongSize, atlas, assets)).toThrow('source canvas');
    expect(() => validateAtlasData({ ...data(), meta: { scale: '2', size: { w: 128, h: 128 } } }, atlas, assets)).toThrow('metadata');
    const oversized = data(); oversized.frames['unit.guard/idle/se/0'].frame.x = 100;
    expect(() => validateAtlasData(oversized, atlas, [{ ...assets[0]!, frames: [{ ...assets[0]!.frames[0]!, frame: { x: 100, y: 4, w: 64, h: 64 } }] }])).toThrow('outside page');
    expect(() => validateAtlasData(null, atlas, assets)).toThrow('object');
  });
  it('rejects altered animation order and source-canvas pivot', () => {
    const wrongPivot = data(); wrongPivot.frames['unit.guard/idle/se/0'].anchor.y = .5;
    expect(() => validateAtlasData(wrongPivot, atlas, assets)).toThrow('pivot mismatch');
    const wrongClip = data(); wrongClip.animations['unit.guard/idle/se'] = [];
    expect(() => validateAtlasData(wrongClip, atlas, assets)).toThrow('animation order');
  });
});
