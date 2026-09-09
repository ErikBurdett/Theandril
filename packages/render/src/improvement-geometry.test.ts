import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cropImage, decodePng, parseAssetManifest, parseRuntimeCatalog, sha256, validateAsset } from '@theandril/art-pipeline';
import { IMPROVEMENTS } from '../../content/src/index';
import { registeredImprovementFit, IMPROVEMENT_FILL } from './improvement-geometry';
import { fitTileArtwork, measureOpaqueGeometry, TILE_ART_INSET, TILE_RADIUS, tileFootprintContained } from './tile-footprint';
import data from './improvement-geometry-data.json';

const root = resolve(import.meta.dirname, '../../..');
const catalog = parseRuntimeCatalog(JSON.parse(await readFile(resolve(root, 'assets/art/runtime/catalog.json'), 'utf8')));
const assets = catalog.assets.filter(asset => asset.id.startsWith('improvement.') || asset.id.startsWith('building.') || asset.id.startsWith('resource.'));

describe('registered improvement and civic silhouettes', () => {
  it('measures exact approved/published frame unions and contains every visible pixel at a readable size', async () => {
    expect(assets.filter(asset => asset.id.startsWith('improvement.')).map(asset => asset.id).sort()).toEqual(IMPROVEMENTS.map(item => item.id).sort());
    expect(Object.keys(data.assets).sort()).toEqual(assets.map(asset => asset.id).sort());
    const pages = new Map(await Promise.all(catalog.atlases.map(async page => [page.id, decodePng(await readFile(resolve(root, 'assets/art/runtime', page.imageUrl.split('/').at(-1)!)))] as const)));
    for (const asset of assets) {
      const page = catalog.atlases.find(page => page.id === asset.atlasId)!;
      const manifest = parseAssetManifest(JSON.parse(await readFile(resolve(root, `assets/art/approved/${asset.id}.json`), 'utf8')));
      const frames = await Promise.all(manifest.frames.map(async frame => ({ id: frame.id, image: decodePng(await readFile(resolve(root, frame.sourcePath))) })));
      const report = validateAsset(manifest, frames, catalog.palette);
      expect(report.passed).toBe(true); expect(report.inputHash).toBe(asset.review.inputHash);
      for (const frame of frames) expect(sha256(cropImage(pages.get(page.id)!, asset.frames.find(item => item.id === frame.id)!.frame).data)).toBe(sha256(frame.image.data));
      const record = data.assets[asset.id as keyof typeof data.assets];
      expect(record.geometry).toEqual(measureOpaqueGeometry(frames.map(frame => frame.image)));
      const fit = registeredImprovementFit(asset, page.sha256)!;
      expect(fit.boundsKind, asset.id).toBe('opaque-union');
      expect(tileFootprintContained(fit), asset.id).toBe(true);
      expect(fit.bounds.width, asset.id).toBeGreaterThanOrEqual(30);
      expect(fit.bounds.width, asset.id).toBeLessThanOrEqual(40);
      const radius = (TILE_RADIUS - TILE_ART_INSET) * IMPROVEMENT_FILL;
      let violations = 0;
      for (const { image } of frames) for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) if (image.data[(y * image.width + x) * 4 + 3]) {
        for (const dx of [0, 1]) for (const dy of [0, 1]) {
          const px = fit.x + (x + dx - asset.pivot[0]) * fit.scale, py = fit.y + (y + dy - asset.pivot[1]) * fit.scale;
          if (Math.abs(px) > Math.sqrt(3) * radius / 2 + 1e-8 || Math.abs(py) + Math.abs(px) / Math.sqrt(3) > radius + 1e-8) violations++;
        }
      }
      expect(violations, asset.id).toBe(0);
      expect(Math.max(fit.horizontalExtent! / (Math.sqrt(3) * (TILE_RADIUS - TILE_ART_INSET) / 2), fit.diagonalExtent! / (TILE_RADIUS - TILE_ART_INSET)), asset.id).toBeCloseTo(IMPROVEMENT_FILL, 10);
    }
  });
  it('falls back safely if atlas, approval, canvas, pivot or frame identity changes', () => {
    const asset = assets.find(asset => asset.id === 'improvement.polder')!, hash = catalog.atlases.find(page => page.id === asset.atlasId)!.sha256;
    const fallback = { ...fitTileArtwork(asset.nativeResolution, asset.pivot, 'improvement'), boundsKind: 'canvas' };
    expect(registeredImprovementFit(asset, 'changed')).toEqual(fallback);
    for (const changed of [
      { ...asset, atlasId: 'unknown' }, { ...asset, review: { ...asset.review, inputHash: 'changed' } },
      { ...asset, id: 'improvement.unknown' }, { ...asset, frames: asset.frames.slice(1) },
      { ...asset, frames: asset.frames.map(frame => ({ ...frame, id: 'changed' })) },
      { ...asset, frames: asset.frames.map(frame => ({ ...frame, frame: { ...frame.frame, x: frame.frame.x + 1 } })) },
    ]) expect(registeredImprovementFit(changed, hash)).toEqual(fallback);
    for (const changed of [{ ...asset, pivot: [31, 48] as [number, number] }, { ...asset, nativeResolution: { width: 65, height: 64 } }]) {
      const fitted = registeredImprovementFit(changed, hash)!; expect(fitted.boundsKind).toBe('canvas'); expect(tileFootprintContained(fitted)).toBe(true);
    }
    expect(registeredImprovementFit({ ...asset, id: 'unit.guard' }, hash)).toBeUndefined();
  });
});
