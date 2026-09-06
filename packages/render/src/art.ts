import { ImageSource, Spritesheet, Texture } from 'pixi.js';
import { FACTION_ART_IDS, parseRuntimeCatalog, type RuntimeAsset, type RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { validateAtlasData } from './art-validation';
import { validatePngDimensions } from './image-validation';

export const BIOME_ART_IDS = ['terrain.ocean', 'terrain.grassland', 'terrain.temperate_forest', 'terrain.taiga', 'terrain.tundra', 'terrain.desert', 'terrain.steppe', 'terrain.marsh', 'terrain.rainforest', 'terrain.alpine', 'terrain.ash_scrub', 'terrain.chalkland'] as const;
export const LIVE_ART_IDS = new Set<string>([...BIOME_ART_IDS, 'improvement.terraced_fields', 'improvement.managed_woodlot', 'improvement.quarry', 'improvement.reedworks', 'improvement.shore_fishery', 'unit.guard', 'unit.scout', 'unit.colonist', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry', 'settlement.village', 'settlement.town', 'settlement.city', 'map.ruin', ...FACTION_ART_IDS]);
export interface ArtStatus {
  state: 'loading' | 'ready' | 'fallback'; message: string; atlasPages: number;
  residentBytesEstimate: number; downloadBytes: number; loadMs: number; warnings: string[];
}
export interface ArtFrame { texture: Texture; asset: RuntimeAsset; frameId: string }

async function boundedBytes(response: Response, limit: number, label: string): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(response.headers.get('content-length')) > limit) throw new Error(`${label} exceeds its supported download size.`);
  const reader = response.body?.getReader();
  if (!reader) { const bytes = new Uint8Array(await response.arrayBuffer()); if (bytes.length > limit) throw new Error(`${label} exceeds its supported download size.`); return bytes; }
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) { const next = await reader.read(); if (next.done) break; length += next.value.length; if (length > limit) { await reader.cancel(); throw new Error(`${label} exceeds its supported download size.`); } chunks.push(next.value); }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

/** Approved public catalog only. Source/candidate assets never enter this loader. */
export class RuntimeArt {
  readonly sheets = new Map<string, Spritesheet>();
  readonly byContent = new Map<string, RuntimeAsset>();
  readonly assets: RuntimeAsset[];
  private destroyed = false;
  private constructor(readonly catalog: RuntimeCatalog, readonly status: ArtStatus) {
    this.assets = catalog.assets.filter(asset => asset.contentIds.some(id => LIVE_ART_IDS.has(id)) || LIVE_ART_IDS.has(asset.id));
    for (const asset of this.assets) {
      if (!asset.validation.passed) throw new Error(`Approved asset failed validation: ${asset.id}`);
      for (const id of new Set([...asset.contentIds, asset.id])) if (LIVE_ART_IDS.has(id)) {
        if (this.byContent.has(id)) throw new Error(`Duplicate approved artwork for ${id}`);
        this.byContent.set(id, asset);
      }
    }
  }
  static async load(url = '/art/catalog.json'): Promise<RuntimeArt> {
    const started = performance.now();
    const response = await fetch(url); if (!response.ok) throw new Error(`Approved art catalog unavailable (${response.status}).`);
    const catalogBytes = await boundedBytes(response, 8 * 1024 * 1024, 'Art catalog');
    const catalog = parseRuntimeCatalog(JSON.parse(new TextDecoder().decode(catalogBytes)));
    const status: ArtStatus = { state: 'ready', message: 'Approved pixel atlases loaded.', atlasPages: 0, residentBytesEstimate: 0, downloadBytes: catalogBytes.byteLength, loadMs: 0, warnings: [] };
    const art = new RuntimeArt(catalog, status);
    try {
      const needed = new Set(art.assets.map(asset => asset.atlasId));
      const budget = (window.innerWidth < 750 ? 64 : 128) * 1024 * 1024;
      if (catalog.atlases.filter(page => needed.has(page.id)).reduce((sum, page) => sum + page.width * page.height * 4, 0) > budget) throw new Error('Approved atlases exceed this display profile’s residency budget. Procedural artwork is retained.');
      for (const atlas of catalog.atlases.filter(page => needed.has(page.id))) {
        const [jsonResponse, pngResponse] = await Promise.all([fetch(atlas.jsonUrl), fetch(atlas.imageUrl)]);
        if (!jsonResponse.ok || !pngResponse.ok) throw new Error(`Atlas ${atlas.id} failed to load.`);
        const jsonBytes = await boundedBytes(jsonResponse, 8 * 1024 * 1024, 'Atlas metadata');
        const data = validateAtlasData(JSON.parse(new TextDecoder().decode(jsonBytes)), atlas, catalog.assets.filter(asset => asset.atlasId === atlas.id));
        const bytes = await boundedBytes(pngResponse, 64 * 1024 * 1024, 'Atlas image');
        validatePngDimensions(bytes, atlas);
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
        if (digest !== atlas.sha256) throw new Error(`Atlas image hash mismatch: ${atlas.id}`);
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
        const image = new Image(); image.src = blobUrl;
        try { await image.decode(); } finally { URL.revokeObjectURL(blobUrl); }
        if (image.naturalWidth !== atlas.width || image.naturalHeight !== atlas.height) throw new Error(`Atlas image dimensions mismatch: ${atlas.id}`);
        const texture = new Texture({ source: new ImageSource({ resource: image, scaleMode: 'nearest', autoGenerateMipmaps: false }) });
        const sheet = new Spritesheet({ texture, data, cachePrefix: `theandril-${atlas.sha256}/` });
        art.sheets.set(atlas.id, sheet); await sheet.parse();
        status.atlasPages++; status.residentBytesEstimate += atlas.width * atlas.height * 4; status.downloadBytes += bytes.byteLength + jsonBytes.byteLength;
      }
      const missing = [...LIVE_ART_IDS].filter(id => !art.byContent.has(id));
      if (missing.length) status.warnings.push(`Artwork unavailable; generic or procedural role fallback: ${missing.join(', ')}.`);
      status.loadMs = performance.now() - started;
      return art;
    } catch (error) { art.destroy(); throw error; }
  }
  frame(contentId: string, elapsedMs = 0, animate = false, direction = 'se'): ArtFrame | undefined {
    const asset = this.byContent.get(contentId); if (!asset) return;
    const clip = asset.clips.find(item => item.state === 'idle' && item.direction === direction) ?? asset.clips.find(item => item.state === 'idle') ?? asset.clips[0];
    let frameId = clip?.frames[0] ?? asset.frames[0]?.id;
    if (clip && animate && clip.frames.length > 1) {
      const duration = clip.durationsMs.reduce((sum, ms) => sum + ms, 0);
      let cursor = clip.loop ? elapsedMs % duration : Math.min(elapsedMs, duration - 1);
      for (let index = 0; index < clip.frames.length; index++) { cursor -= clip.durationsMs[index]!; if (cursor < 0) { frameId = clip.frames[index]; break; } }
    }
    const texture = frameId ? this.sheets.get(asset.atlasId)?.textures[frameId] : undefined;
    return texture && frameId ? { texture, asset, frameId } : undefined;
  }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; for (const sheet of this.sheets.values()) sheet.destroy(true); this.sheets.clear(); }
}
