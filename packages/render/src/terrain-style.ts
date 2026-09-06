export type TerrainRelief = 'none' | 'hill-ridges' | 'pixel-mountains' | 'procedural-peak';

/** Presentation only: preserve canonical physical relief without painting over approved biome art. */
export function terrainRelief(terrain: number, biome: number, approvedBiome: boolean): TerrainRelief {
  if (terrain === 4) return approvedBiome && biome === 9 ? 'pixel-mountains' : 'procedural-peak';
  if (terrain === 3) return approvedBiome ? 'hill-ridges' : 'procedural-peak';
  return 'none';
}
