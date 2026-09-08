import type { AssetManifest } from './schema';

/** The source CLI imports one genuinely authored clip; it never manufactures poses. */
export function singleSourceClip(asset: AssetManifest) {
  const first = asset.frames[0];
  if (!first || Object.keys(asset.animation.states).length !== 1
    || asset.frames.some((frame, index) => frame.state !== first.state || frame.direction !== first.direction || frame.index !== index)) {
    throw new Error('Source processing requires one declared state, one facing and consecutive supplied frames; use explicit tagged exports for multi-clip assets.');
  }
  const clip = asset.animation.states[first.state];
  if (!clip || clip.frames !== asset.frames.length) throw new Error('Source clip frame count differs from the supplied frames.');
  return { name: first.state, from: 0, to: asset.frames.length - 1 };
}
