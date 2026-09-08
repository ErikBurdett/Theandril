import { describe, expect, it, vi } from 'vitest';
import { BIOME_ART_IDS, BIOME_ART_VARIANTS, selectTerrainArt, TERRAIN_ART_IDS, terrainVariantIndex } from './terrain-variants';

describe('deterministic approved biome variants', () => {
  it('keeps exactly three frozen explicit slots for each of the twelve stable biomes', () => {
    expect(BIOME_ART_VARIANTS).toHaveLength(12);
    expect(TERRAIN_ART_IDS).toHaveLength(36);
    expect(new Set(TERRAIN_ART_IDS).size).toBe(36);
    for (const [biome, variants] of BIOME_ART_VARIANTS.entries()) {
      expect(variants).toEqual([BIOME_ART_IDS[biome], `${BIOME_ART_IDS[biome]}.variant_1`, `${BIOME_ART_IDS[biome]}.variant_2`]);
      expect(Object.isFrozen(variants)).toBe(true);
    }
    expect(TERRAIN_ART_IDS).not.toContain('terrain.river');
    expect(TERRAIN_ART_IDS).not.toContain('terrain.coast');
    expect(TERRAIN_ART_IDS).not.toContain('terrain.grassland.variant_3');
  });

  it('selects all three slots across each biome without time, RNG or catalog-order dependencies', () => {
    expect([0, 1, 2, 31, 48, 500, 50497, 196607, 307199].map(cell => terrainVariantIndex(74, cell, 1))).toEqual([1, 0, 0, 1, 1, 0, 1, 1, 2]);
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Presentation must not consume RNG'); });
    try {
      for (let biome = 0; biome < 12; biome++) {
        const cells = Array.from({ length: 4096 }, (_, cell) => terrainVariantIndex(20260905, cell, biome));
        const counts = [0, 1, 2].map(slot => cells.filter(value => value === slot).length);
        counts.forEach(count => { expect(count).toBeGreaterThan(1100); expect(count).toBeLessThan(1600); });
        expect(Array.from({ length: 4096 }, (_, cell) => terrainVariantIndex(20260905, cell, biome))).toEqual(cells);
        expect(Array.from({ length: 4096 }, (_, cell) => terrainVariantIndex(20260906, cell, biome))).not.toEqual(cells);
      }
    } finally { random.mockRestore(); }
  });

  it('uses the exact selected original and does not rotate to a different available variant', () => {
    const biome = 1, seed = 74;
    const cell = Array.from({ length: 30 }, (_, value) => value).find(value => terrainVariantIndex(seed, value, biome) === 1)!;
    const baseId = BIOME_ART_IDS[biome], frame = vi.fn((id: string) => id === `${baseId}.variant_1` ? { id } : undefined);
    expect(selectTerrainArt(seed, cell, biome, { frame })).toMatchObject({ baseId, requestedAssetId: `${baseId}.variant_1`, variantIndex: 1, renderedVariantIndex: 1, frame: { id: `${baseId}.variant_1` }, fallback: false });
    expect(frame.mock.calls).toEqual([[`${baseId}.variant_1`]]);
    const missing = vi.fn((id: string) => [baseId, `${baseId}.variant_2`].includes(id) ? { id } : undefined);
    expect(selectTerrainArt(seed, cell, biome, { frame: missing })).toMatchObject({ requestedAssetId: `${baseId}.variant_1`, variantIndex: 1, renderedVariantIndex: 0, frame: { id: baseId }, fallback: true });
    expect(missing.mock.calls).toEqual([[`${baseId}.variant_1`], [baseId]]);
  });

  it('reports procedural fallback if neither selected art nor original is approved', () => {
    const reader = { frame: vi.fn(() => undefined) };
    expect(selectTerrainArt(0xffffffff, 307199, 11, reader)).toMatchObject({ baseId: 'terrain.chalkland', frame: undefined, renderedVariantIndex: null, fallback: true });
    expect(reader.frame.mock.calls.length).toBeLessThanOrEqual(2);
    expect(selectTerrainArt(74, 500, 5)).toMatchObject({ frame: undefined, renderedVariantIndex: null, fallback: true });
    expect(selectTerrainArt(74, 500, 99, reader)).toEqual({ baseId: null, requestedAssetId: null, variantIndex: null, renderedVariantIndex: null, frame: undefined, fallback: false });
  });
});
