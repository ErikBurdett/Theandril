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

/** Exact contiguous authored clips. No frames, facings or timing are synthesized. */
export function sourceClips(asset: AssetManifest) {
  const groups: { state: string; direction: string; from: number; to: number }[] = [];
  const seen = new Set<string>();
  for (const [offset, frame] of asset.frames.entries()) {
    let group = groups.at(-1);
    if (!group || group.state !== frame.state || group.direction !== frame.direction) {
      const key = `${frame.state}/${frame.direction}`;
      if (seen.has(key)) throw new Error('Source clip frames must be contiguous.');
      seen.add(key); group = { state: frame.state, direction: frame.direction, from: offset, to: offset }; groups.push(group);
    }
    const definition = asset.animation.states[frame.state];
    if (!definition || frame.index !== offset - group.from || Math.abs(frame.durationMs - 1000 / definition.fps) > .001)
      throw new Error('Source clip indices or timing differ from the authored definition.');
    group.to = offset;
  }
  const directions = new Set(asset.frames.map(frame => frame.direction));
  if (!groups.length || groups.length !== Object.keys(asset.animation.states).length * directions.size
    || groups.some(group => group.to - group.from + 1 !== asset.animation.states[group.state]!.frames))
    throw new Error('Source clip matrix is incomplete.');
  return groups.map(group => ({ name: groups.length === 1 ? group.state : `${group.state}.${group.direction}`, from: group.from, to: group.to }));
}
