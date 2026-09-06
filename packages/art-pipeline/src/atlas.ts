import { assetManifestSchema, type AssetManifest } from './schema';
import { runtimeCatalogSchema, paletteSchema, type Palette, type RuntimeAsset, type RuntimeCatalog } from './runtime';
import { encodePng } from './png';
import { sha256 } from './provenance';
import { validateAsset, type FrameImage } from './validation';

export interface PixiAtlas {
  frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; rotated: false; trimmed: false; spriteSourceSize: { x: number; y: number; w: number; h: number }; sourceSize: { w: number; h: number }; anchor: { x: number; y: number } }>;
  animations: Record<string, string[]>;
  meta: { image: string; size: { w: number; h: number }; scale: '1'; app: 'Theandril offline art factory'; version: '1' };
}
export interface AtlasOptions { id: string; pageSize: 1024 | 2048; imageUrl: string; jsonUrl: string; palette: Palette; extrusion?: number; padding?: number }
export interface AtlasBuild { png: Uint8Array; json: PixiAtlas; catalog: RuntimeCatalog }

/** Stable ID-order shelf packing; no rotation/trimming. Two extruded pixels plus two clear pixels separate frames. */
export function buildAtlas(input: readonly { manifest: AssetManifest; frames: readonly FrameImage[] }[], options: AtlasOptions): AtlasBuild {
  if (![1024, 2048].includes(options.pageSize)) throw new Error('Atlas pages must be 1024 or 2048 pixels');
  const extrusion = options.extrusion ?? 2, padding = options.padding ?? 2;
  if (!Number.isInteger(extrusion) || extrusion < 2 || extrusion > 8 || !Number.isInteger(padding) || padding < 2 || padding > 16) throw new Error('Atlas requires 2–8 pixel extrusion and 2–16 pixel transparent gutters');
  if (!input.length || input.length > 4096) throw new Error('Atlas requires 1–4096 approved assets');
  if (input.reduce((sum, item) => sum + item.frames.length, 0) > 8192) throw new Error('Atlas exceeds the 8192 frame bound; split the asset pack');
  const palette = paletteSchema.parse(options.palette), size = options.pageSize;
  const data = new Uint8Array(size * size * 4);
  const json: PixiAtlas = { frames: {}, animations: {}, meta: { image: options.imageUrl.split('/').at(-1)!, size: { w: size, h: size }, scale: '1', app: 'Theandril offline art factory', version: '1' } };
  const assets: RuntimeAsset[] = [];
  let x = padding, y = padding, shelfHeight = 0;
  const ordered = [...input].sort((a, b) => a.manifest.id < b.manifest.id ? -1 : a.manifest.id > b.manifest.id ? 1 : 0);
  if (new Set(ordered.map((asset) => asset.manifest.id)).size !== ordered.length) throw new Error('Duplicate asset IDs');
  for (const item of ordered) {
    const manifest = assetManifestSchema.parse(item.manifest);
    if (!['APPROVED', 'ATLASED', 'INTEGRATED'].includes(manifest.status) || !manifest.review || !manifest.validation?.passed) throw new Error(`Asset ${manifest.id} has no explicit approval`);
    const report = validateAsset(manifest, item.frames, palette);
    if (!report.passed || report.inputHash !== manifest.review.inputHash) throw new Error(`Asset ${manifest.id} changed since validation/review`);
    const sources = new Map(item.frames.map((frame) => [frame.id, frame.image]));
    const frames: RuntimeAsset['frames'] = [];
    for (const source of [...manifest.frames].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
      if (json.frames[source.id]) throw new Error('Duplicate global atlas frame ID');
      const image = sources.get(source.id)!;
      const packedWidth = image.width + extrusion * 2, packedHeight = image.height + extrusion * 2;
      if (packedWidth + padding * 2 > size || packedHeight + padding * 2 > size) throw new Error('Frame exceeds atlas page; split the asset pack');
      if (x + packedWidth + padding > size) { x = padding; y += shelfHeight + padding; shelfHeight = 0; }
      if (y + packedHeight + padding > size) throw new Error('Atlas page exhausted; split the asset pack');
      const rect = { x: x + extrusion, y: y + extrusion, w: image.width, h: image.height };
      for (let row = -extrusion; row < image.height + extrusion; row++) for (let col = -extrusion; col < image.width + extrusion; col++) {
        const from = (Math.max(0, Math.min(image.height - 1, row)) * image.width + Math.max(0, Math.min(image.width - 1, col))) * 4;
        const to = ((rect.y + row) * size + rect.x + col) * 4;
        data.set(image.data.subarray(from, from + 4), to);
      }
      json.frames[source.id] = { frame: rect, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: image.width, h: image.height }, sourceSize: { w: image.width, h: image.height }, anchor: { x: source.pivot[0] / image.width, y: source.pivot[1] / image.height } };
      frames.push({ id: source.id, frame: rect, direction: source.direction, state: source.state, index: source.index, durationMs: source.durationMs });
      x += packedWidth + padding; shelfHeight = Math.max(shelfHeight, packedHeight);
    }
    const clips: RuntimeAsset['clips'] = [];
    for (const state of Object.keys(manifest.animation.states).sort()) for (const direction of [...new Set(manifest.frames.map((frame) => frame.direction))].sort()) {
      const sequence = manifest.frames.filter((frame) => frame.state === state && frame.direction === direction).sort((a, b) => a.index - b.index);
      const id = `${manifest.id}/${state}/${direction}`;
      const ids = sequence.map((frame) => frame.id);
      json.animations[id] = ids;
      clips.push({ id, state, direction, frames: ids, durationsMs: sequence.map((frame) => frame.durationMs), loop: manifest.animation.states[state]!.loop });
    }
    const pivot = manifest.frames[0]!.pivot;
    if (manifest.frames.some((frame) => frame.pivot[0] !== pivot[0] || frame.pivot[1] !== pivot[1])) throw new Error('Runtime atlas requires a shared exact pivot across frames');
    assets.push({ id: manifest.id, type: manifest.type, status: 'ATLASED', contentIds: manifest.contentIds, nativeResolution: manifest.nativeResolution, pivot, atlasId: options.id, frames, clips, validation: manifest.validation, provenance: manifest.provenance, review: manifest.review });
  }
  const png = encodePng({ width: size, height: size, data });
  const catalog = runtimeCatalogSchema.parse({ schemaVersion: 1, palette, atlases: [{ id: options.id, imageUrl: options.imageUrl, jsonUrl: options.jsonUrl, width: size, height: size, sha256: sha256(png) }], assets });
  return { png, json, catalog };
}
