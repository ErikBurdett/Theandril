import type { SpritesheetData } from 'pixi.js';
import type { RuntimeAsset, RuntimeCatalog } from '@theandril/art-pipeline/runtime';

/** Cross-check the Pixi page against the approved catalog before creating textures. */
export function validateAtlasData(raw: unknown, atlas: Pick<RuntimeCatalog['atlases'][number], 'id' | 'width' | 'height'> & { imageUrl?: string }, assets: Pick<RuntimeAsset, 'nativeResolution' | 'pivot' | 'frames' | 'clips'>[]): SpritesheetData {
  if (!raw || typeof raw !== 'object') throw new Error('Atlas JSON must be an object.');
  const data = raw as SpritesheetData;
  if (!data.frames || typeof data.frames !== 'object' || !data.meta || String(data.meta.scale) !== '1' || data.meta.size?.w !== atlas.width || data.meta.size.h !== atlas.height) throw new Error(`Atlas ${atlas.id} has incompatible metadata.`);
  const expectedIds = new Set(assets.flatMap(asset => asset.frames.map(frame => frame.id)));
  if (Object.keys(data.frames).length !== expectedIds.size || Object.keys(data.frames).some(id => !expectedIds.has(id))) throw new Error(`Atlas ${atlas.id} contains undeclared or missing frames.`);
  if (atlas.imageUrl && data.meta.image !== atlas.imageUrl.split('/').at(-1)) throw new Error(`Atlas ${atlas.id} has a different image reference.`);
  const clips = assets.flatMap(asset => asset.clips);
  if (!data.animations || Object.keys(data.animations).length !== clips.length || clips.some(clip => JSON.stringify(data.animations?.[clip.id]) !== JSON.stringify(clip.frames))) throw new Error(`Atlas ${atlas.id} animation order differs from its approved catalog.`);
  for (const asset of assets) for (const expected of asset.frames) {
    const frame = data.frames[expected.id];
    if (!frame?.frame || frame.rotated || frame.frame.x !== expected.frame.x || frame.frame.y !== expected.frame.y || frame.frame.w !== expected.frame.w || frame.frame.h !== expected.frame.h) throw new Error(`Atlas rectangle mismatch: ${expected.id}`);
    const r = frame.frame;
    if (![r.x, r.y, r.w, r.h].every(Number.isInteger) || r.x < 0 || r.y < 0 || r.w <= 0 || r.h <= 0 || r.x + r.w > atlas.width || r.y + r.h > atlas.height) throw new Error(`Atlas rectangle outside page: ${expected.id}`);
    if (frame.trimmed || frame.sourceSize?.w !== asset.nativeResolution.width || frame.sourceSize.h !== asset.nativeResolution.height || (frame.spriteSourceSize?.x ?? 0) !== 0 || (frame.spriteSourceSize?.y ?? 0) !== 0 || frame.spriteSourceSize?.w !== r.w || frame.spriteSourceSize?.h !== r.h) throw new Error(`Unsupported source canvas or trimming: ${expected.id}`);
    if (frame.anchor?.x !== asset.pivot[0] / asset.nativeResolution.width || frame.anchor.y !== asset.pivot[1] / asset.nativeResolution.height) throw new Error(`Atlas pivot mismatch: ${expected.id}`);
  }
  return data;
}
