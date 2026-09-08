import { expect, test } from 'vitest';
import { geographicDiversity } from './geography-metrics';
import { type World } from './index';

function diagnosticWorld(width: number, terrain: number[], biome: number[]): World {
  return { seed: 0, generatorVersion: 6, layout: 'continents', width, height: terrain.length / width,
    terrain: Uint8Array.from(terrain), biome: Uint8Array.from(biome), hydrology: new Uint8Array(terrain.length),
    fertility: new Uint8Array(terrain.length), waterDepth: new Uint8Array(terrain.length), starts: [] };
}

test('biome agreement explicitly samples east-west pairs, not differently colored neighboring rows', () => {
  const world = diagnosticWorld(3, Array(9).fill(1), [1, 1, 1, 2, 2, 2, 1, 1, 1]);
  const original = structuredClone(world);
  expect(geographicDiversity(world)).toMatchObject({
    landBiomeNeighborAgreement: 1, landBiomeNeighborSampling: 'east-west-same-row-land-edges',
    landBiomeSampledEdges: 6, landBiomeMatchingEdges: 6,
  });
  expect(world).toEqual(original);
});

test('the historical directional sample excludes water and row wraps, and includes mountain land', () => {
  const world = diagnosticWorld(3, [1, 0, 1, 1, 1, 4], [1, 0, 1, 1, 2, 2]);
  expect(geographicDiversity(world)).toMatchObject({
    landBiomeNeighborAgreement: .5, landBiomeSampledEdges: 2, landBiomeMatchingEdges: 1,
  });
});

test('no sampled land edge produces zero agreement, not a claim of perfect cohesion', () => {
  expect(geographicDiversity(diagnosticWorld(3, [1, 0, 1], [1, 0, 1]))).toMatchObject({
    landBiomeNeighborAgreement: 0, landBiomeSampledEdges: 0, landBiomeMatchingEdges: 0,
  });
});
