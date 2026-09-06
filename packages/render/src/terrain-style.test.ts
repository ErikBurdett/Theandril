import { describe, expect, it } from 'vitest';
import { terrainRelief } from './terrain-style';

describe('observed terrain presentation', () => {
  it('keeps approved biome hills as compact ridges, not large opaque mountain triangles', () => {
    for (let biome = 1; biome <= 8; biome++) expect(terrainRelief(3, biome, true)).toBe('hill-ridges');
  });
  it('uses alpine pixels only for actual canonical mountains', () => {
    expect(terrainRelief(4, 9, true)).toBe('pixel-mountains');
    expect(terrainRelief(4, 5, true)).toBe('procedural-peak');
    expect(terrainRelief(3, 9, true)).toBe('hill-ridges');
  });
  it('retains recognizable hill and mountain fallbacks when approved art is unavailable', () => {
    expect(terrainRelief(3, 5, false)).toBe('procedural-peak');
    expect(terrainRelief(4, 9, false)).toBe('procedural-peak');
    for (const terrain of [0, 1, 2]) expect(terrainRelief(terrain, 1, false)).toBe('none');
  });
});
