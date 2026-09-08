import { ImageSource, Spritesheet, Texture } from 'pixi.js';
import { FACTION_ART_IDS, parseRuntimeCatalog, type RuntimeAsset, type RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { validateAtlasData } from './art-validation';
import { validatePngDimensions } from './image-validation';
import { TERRAIN_ART_IDS } from './terrain-variants';
import { BATTLE_EFFECT_IDS, selectClipFrame } from './animation';
import { registeredSettlementFit } from './settlement-geometry';
import type { TileArtworkFit } from './tile-footprint';

export { BIOME_ART_IDS } from './terrain-variants';
export const LIVE_ART_IDS = new Set<string>([...TERRAIN_ART_IDS, 'improvement.terraced_fields', 'improvement.managed_woodlot', 'improvement.quarry', 'improvement.reedworks', 'improvement.shore_fishery', 'unit.guard', 'unit.scout', 'unit.colonist', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry', 'settlement.village', 'settlement.town', 'settlement.city', 'map.ruin', 'character.waykeeper', ...FACTION_ART_IDS, ...Object.values(BATTLE_EFFECT_IDS)]);
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
  private battleLoad?: Promise<void>;
  private readonly settlementFits = new Map<string, TileArtworkFit>();
  private constructor(readonly catalog: RuntimeCatalog, readonly status: ArtStatus, private readonly resolveUrl: (url: string) => string) {
    this.assets = catalog.assets.filter(asset => asset.contentIds.some(id => LIVE_ART_IDS.has(id)) || LIVE_ART_IDS.has(asset.id));
    for (const asset of this.assets) {
      if (!asset.validation.passed) throw new Error(`Approved asset failed validation: ${asset.id}`);
      for (const id of new Set([...asset.contentIds, asset.id])) if (LIVE_ART_IDS.has(id)) {
        if (this.byContent.has(id)) throw new Error(`Duplicate approved artwork for ${id}`);
        this.byContent.set(id, asset);
      }
    }
  }
  static async load(url = '/art/catalog.json', resolveUrl: (url: string) => string = url => url): Promise<RuntimeArt> {
    const started = performance.now();
    const response = await fetch(resolveUrl(url)); if (!response.ok) throw new Error(`Approved art catalog unavailable (${response.status}).`);
    const catalogBytes = await boundedBytes(response, 8 * 1024 * 1024, 'Art catalog');
    const catalog = parseRuntimeCatalog(JSON.parse(new TextDecoder().decode(catalogBytes)));
    const status: ArtStatus = { state: 'ready', message: 'Approved pixel atlases loaded.', atlasPages: 0, residentBytesEstimate: 0, downloadBytes: catalogBytes.byteLength, loadMs: 0, warnings: [] };
    const art = new RuntimeArt(catalog, status, resolveUrl);
    try {
      const needed = new Set(art.assets.map(asset => asset.atlasId));
      const budget = (window.innerWidth < 750 ? 64 : 128) * 1024 * 1024;
      if (catalog.atlases.filter(page => needed.has(page.id)).reduce((sum, page) => sum + page.width * page.height * 4, 0) > budget) throw new Error('Approved atlases exceed this display profile’s residency budget. Procedural artwork is retained.');
      for (const atlas of catalog.atlases.filter(page => needed.has(page.id) && page.id !== 'battle')) await art.loadPage(atlas);
      const missing = [...LIVE_ART_IDS].filter(id => !art.byContent.has(id));
      if (missing.length) status.warnings.push(`Artwork unavailable; terrain variants use their original biome tile, other roles use generic or procedural fallback: ${missing.join(', ')}.`);
      status.loadMs = performance.now() - started;
      return art;
    } catch (error) { art.destroy(); throw error; }
  }
  /** One shared deferred page; ordinary world play never downloads battle pixels. */
  ensureBattle(): Promise<void> {
    return this.battleLoad ??= (async () => {
      const atlas = this.catalog.atlases.find(page => page.id === 'battle');
      if (!atlas || this.destroyed) return;
      try { await this.loadPage(atlas); }
      catch (cause) { this.status.warnings.push(`Battle artwork unavailable; recorded actions and role markers remain available: ${String(cause)}`); }
    })();
  }
  private async loadPage(atlas: RuntimeCatalog['atlases'][number]): Promise<void> {
    if (this.destroyed || this.sheets.has(atlas.id)) return;
    // Prefix browser requests only. Catalog/atlas metadata stays byte-identical,
    // and deferred pages use the same deployment resolver as the initial page.
    const [jsonResponse, pngResponse] = await Promise.all([fetch(this.resolveUrl(atlas.jsonUrl)), fetch(this.resolveUrl(atlas.imageUrl))]);
    if (!jsonResponse.ok || !pngResponse.ok) throw new Error(`Atlas ${atlas.id} failed to load.`);
    const jsonBytes = await boundedBytes(jsonResponse, 8 * 1024 * 1024, 'Atlas metadata');
    const data = validateAtlasData(JSON.parse(new TextDecoder().decode(jsonBytes)), atlas, this.catalog.assets.filter(asset => asset.atlasId === atlas.id));
    const bytes = await boundedBytes(pngResponse, 64 * 1024 * 1024, 'Atlas image');
    validatePngDimensions(bytes, atlas);
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (digest !== atlas.sha256) throw new Error(`Atlas image hash mismatch: ${atlas.id}`);
    const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    const image = new Image(); image.src = blobUrl;
    try { await image.decode(); } finally { URL.revokeObjectURL(blobUrl); }
    if (this.destroyed) return;
    if (image.naturalWidth !== atlas.width || image.naturalHeight !== atlas.height) throw new Error(`Atlas image dimensions mismatch: ${atlas.id}`);
    const texture = new Texture({ source: new ImageSource({ resource: image, scaleMode: 'nearest', autoGenerateMipmaps: false }) });
    const sheet = new Spritesheet({ texture, data, cachePrefix: `theandril-${atlas.sha256}/` });
    try { await sheet.parse(); }
    catch (cause) { sheet.destroy(true); throw cause; }
    if (this.destroyed) { sheet.destroy(true); return; }
    this.sheets.set(atlas.id, sheet);
    this.status.atlasPages++; this.status.residentBytesEstimate += atlas.width * atlas.height * 4; this.status.downloadBytes += bytes.byteLength + jsonBytes.byteLength;
  }
  frame(contentId: string, elapsedMs = 0, animate = false, direction = 'se', state = 'idle'): ArtFrame | undefined {
    const asset = this.byContent.get(contentId); if (!asset) return;
    const frameId = selectClipFrame(asset, { elapsedMs, animate, direction, state })?.frameId;
    const texture = frameId ? this.sheets.get(asset.atlasId)?.textures[frameId] : undefined;
    return texture && frameId ? { texture, asset, frameId } : undefined;
  }
  /** One identity check/fit per loaded settlement asset, shared by all towns and
   * frames. The table already bounds the entire approved animation union. */
  settlementFit(asset: RuntimeAsset): TileArtworkFit | undefined {
    const cached = this.settlementFits.get(asset.id); if (cached) return cached;
    const fit = registeredSettlementFit(asset, this.catalog.atlases.find(atlas => atlas.id === asset.atlasId)?.sha256 ?? '');
    if (fit) this.settlementFits.set(asset.id, fit);
    return fit;
  }
  destroy(): void { if (this.destroyed) return; this.destroyed = true; for (const sheet of this.sheets.values()) sheet.destroy(true); this.sheets.clear(); this.settlementFits.clear(); }
}
