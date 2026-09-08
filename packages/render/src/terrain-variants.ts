/** Presentation-only slots. Keep this order stable: catalog order/availability
 * must never reshuffle a world's tiles. Slot zero is the original approved tile. */
export const BIOME_ART_IDS = ['terrain.ocean', 'terrain.grassland', 'terrain.temperate_forest', 'terrain.taiga', 'terrain.tundra', 'terrain.desert', 'terrain.steppe', 'terrain.marsh', 'terrain.rainforest', 'terrain.alpine', 'terrain.ash_scrub', 'terrain.chalkland'] as const;
export const BIOME_ART_VARIANTS = Object.freeze(BIOME_ART_IDS.map(baseId => Object.freeze([baseId, `${baseId}.variant_1`, `${baseId}.variant_2`] as const)));
export const TERRAIN_ART_IDS: readonly string[] = Object.freeze(BIOME_ART_VARIANTS.flat());
export type TerrainVariantIndex = 0 | 1 | 2;

/** No simulation RNG, hidden neighbors, turn, camera or runtime catalog reads. */
export function terrainVariantIndex(seed: number, cell: number, biome: number): TerrainVariantIndex {
  let hash = (seed ^ Math.imul(cell, 0x9e3779b1) ^ Math.imul(biome + 1, 0x85ebca6b)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  return ((hash ^ (hash >>> 16)) >>> 0) % 3 as TerrainVariantIndex;
}

export function selectTerrainArt<T>(seed: number, cell: number, biome: number, reader?: { frame(id: string): T | undefined }) {
  const variants = BIOME_ART_VARIANTS[biome];
  if (!variants) return { baseId: null, requestedAssetId: null, variantIndex: null, renderedVariantIndex: null, frame: undefined, fallback: false };
  const variantIndex = terrainVariantIndex(seed, cell, biome), requestedAssetId = variants[variantIndex], baseId = variants[0];
  const chosen = reader?.frame(requestedAssetId);
  // A missing chosen original falls back only to this biome's unchanged base.
  // Never modulo the available catalog or borrow another family's tile.
  const frame = chosen ?? (variantIndex === 0 ? undefined : reader?.frame(baseId));
  return { baseId, requestedAssetId, variantIndex, renderedVariantIndex: frame ? chosen ? variantIndex : 0 : null, frame, fallback: !chosen };
}
