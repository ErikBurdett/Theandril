import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IMPROVEMENTS } from '../../content/src/index';
import type { RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import { cropImage, decodePng } from '../../art-pipeline/src/png';
import { fitOpaqueSettlement, fitTileArtwork, IMPROVEMENT_GLYPH_BOUNDS, measureOpaqueGeometry, SETTLEMENT_FILL, TILE_ART_INSET, TILE_RADIUS, tileArtworkRole, tileBoundsContained, tileFootprintContained } from './tile-footprint';
import { IMPROVEMENT_GLYPHS } from './territory-style';
import { registeredSettlementFit } from './settlement-geometry';

describe('canonical-tile artwork footprints', () => {
  it('fits complete 64/96/128 canvases with uniform scale and unchanged registered pivots', () => {
    for (const [width, height, px, py] of [[64, 64, 32, 48], [96, 96, 48, 80], [128, 128, 64, 112], [64, 96, 32, 80], [128, 48, 40, 32]]) {
      for (const role of ['improvement', 'village', 'town', 'city', 'ruin'] as const) {
        const native = { width: width!, height: height! }, pivot = [px!, py!], original = structuredClone({ native, pivot });
        const fit = fitTileArtwork(native, pivot, role);
        expect(tileBoundsContained(fit.bounds)).toBe(true);
        expect(fit.bounds.width / fit.bounds.height).toBeCloseTo(width! / height!);
        expect(fit.x - px! * fit.scale).toBeCloseTo(fit.bounds.x);
        expect(fit.y - py! * fit.scale).toBeCloseTo(fit.bounds.y);
        expect({ native, pivot }).toEqual(original);
        expect(fit).toEqual(fitTileArtwork(native, pivot, role));
      }
    }
  });
  it('gives village, town and city progressively larger screen footprints without changing armies', () => {
    const fits = [fitTileArtwork({ width: 96, height: 96 }, [48, 80], 'village'), fitTileArtwork({ width: 96, height: 96 }, [48, 80], 'town'), fitTileArtwork({ width: 128, height: 128 }, [64, 112], 'city')];
    expect(fits.map(fit => fit.bounds.width)).toEqual([26, 30, 34]);
    for (const unit of ['unit.guard', 'unit.cavalry', 'unit.transport', 'character.waykeeper']) expect(tileArtworkRole(unit)).toBeUndefined();
    for (const zoom of [.4, .65, 1, 1.25, 2.4]) for (const fit of fits) {
      // Camera scale multiplies the hex and sprite together, not a constant-size overhang.
      const b = fit.bounds;
      expect(tileBoundsContained({ x: b.x * zoom / zoom, y: b.y * zoom / zoom, width: b.width * zoom / zoom, height: b.height * zoom / zoom })).toBe(true);
    }
  });
  it('covers every published town/ruin/prop frame and every canonical improvement presentation', () => {
    const root = resolve(import.meta.dirname, '../../..');
    const catalog = JSON.parse(readFileSync(resolve(root, 'assets/art/runtime/catalog.json'), 'utf8')) as RuntimeCatalog;
    const assets = catalog.assets.filter(asset => /^(settlement\.|improvement\.|map\.ruin)/.test(asset.id));
    expect(assets.filter(asset => asset.id.startsWith('settlement.'))).toHaveLength(75);
    for (const asset of assets) {
      const role = tileArtworkRole(asset.id.startsWith('settlement.') ? asset.id.split('.').slice(0, 2).join('.') : asset.id)!;
      expect(role).toBeDefined();
      const fit = fitTileArtwork(asset.nativeResolution, asset.pivot, role);
      const report = JSON.parse(readFileSync(resolve(root, asset.validation.reportPath), 'utf8')) as { metrics: { bounds: { x: number; y: number; w: number; h: number } }[] };
      expect(report.metrics).toHaveLength(asset.frames.length);
      for (const { bounds } of report.metrics) {
        expect(tileBoundsContained({ x: fit.x + (bounds.x - asset.pivot[0]!) * fit.scale, y: fit.y + (bounds.y - asset.pivot[1]!) * fit.scale, width: bounds.w * fit.scale, height: bounds.h * fit.scale })).toBe(true);
      }
    }
    expect(assets.filter(asset => asset.id.startsWith('improvement.')).map(asset => asset.id).sort()).toEqual(IMPROVEMENTS.map(item => item.id).sort());
    for (const improvement of IMPROVEMENTS) {
      expect(IMPROVEMENT_GLYPHS[improvement.id]).toBeDefined();
      expect(tileArtworkRole(improvement.id)).toBe('improvement');
    }
    expect(tileBoundsContained(IMPROVEMENT_GLYPH_BOUNDS)).toBe(true);
    // Full procedural building and ruin stroke envelopes; capital and ownership accents.
    expect(tileBoundsContained(fitTileArtwork({ width: 32, height: 34 }, [16, 22], 'city').bounds)).toBe(true);
    expect(tileBoundsContained(fitTileArtwork({ width: 32, height: 28 }, [16, 14], 'ruin').bounds)).toBe(true);
    expect(tileBoundsContained({ x: -5.5, y: -23.5, width: 11, height: 5 })).toBe(true);
    expect(tileBoundsContained({ x: -4, y: 16, width: 8, height: 8 })).toBe(true);
  });
  it('rejects actual hex-corner overhang and invalid dimensions rather than clipping pixels', () => {
    expect(tileBoundsContained({ x: -20, y: -20, width: 40, height: 40 })).toBe(false);
    expect(tileBoundsContained({ x: -1, y: 28, width: 2, height: 2 })).toBe(false);
    expect(tileBoundsContained({ x: NaN, y: 0, width: 1, height: 1 })).toBe(false);
    expect(TILE_ART_INSET).toBe(2);
    for (const width of [0, -1, Infinity, NaN]) expect(() => fitTileArtwork({ width, height: 64 }, [32, 48], 'improvement')).toThrow('Invalid tile artwork');
    expect(() => fitTileArtwork({ width: 64, height: 64 }, [65, 48], 'improvement')).toThrow('Invalid tile artwork');
  });

  it('verifies all 75 exact registered silhouettes against retained PNGs and actual published atlas pixels', () => {
    const root = resolve(import.meta.dirname, '../../..');
    const catalog = JSON.parse(readFileSync(resolve(root, 'assets/art/runtime/catalog.json'), 'utf8')) as RuntimeCatalog;
    const atlas = catalog.atlases.find(page => page.id === 'foundation')!;
    const pixels = decodePng(readFileSync(resolve(root, 'apps/web/public', atlas.imageUrl.slice(1))));
    const assets = catalog.assets.filter(asset => asset.id.startsWith('settlement.'));
    expect(assets).toHaveLength(75);
    const families = new Map<string, { role: string; width: number; height: number }[]>();
    for (const asset of assets) {
      const manifest = JSON.parse(readFileSync(resolve(root, 'assets/art/approved', `${asset.id}.json`), 'utf8')) as { frames: { id: string; sourcePath: string }[] };
      expect(manifest.frames).toHaveLength(asset.frames.length);
      const frames = manifest.frames.map(frame => decodePng(readFileSync(resolve(root, frame.sourcePath))));
      frames.forEach((frame, i) => {
        expect(manifest.frames[i]!.id).toBe(asset.frames[i]!.id);
        expect(frame.width).toBe(asset.nativeResolution.width); expect(frame.height).toBe(asset.nativeResolution.height);
        const packed = cropImage(pixels, asset.frames[i]!.frame);
        expect(Buffer.from(packed.data).equals(Buffer.from(frame.data)), asset.id).toBe(true);
      });
      const geometry = measureOpaqueGeometry(frames), role = asset.id.split('.')[1] as keyof typeof SETTLEMENT_FILL;
      const fitted = registeredSettlementFit(asset, atlas.sha256)!;
      expect(fitted.boundsKind, asset.id).toBe('opaque-union');
      expect(fitted).toEqual(fitOpaqueSettlement(asset.nativeResolution, asset.pivot, role, geometry));
      expect(tileFootprintContained(fitted), asset.id).toBe(true);
      // Independent exhaustive point test, not merely re-running the metadata
      // helper. Include all four corners of every visible pixel in every frame.
      let violations = 0;
      for (const frame of frames) for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) if (frame.data[(y * frame.width + x) * 4 + 3]) {
        for (const dx of [0, 1]) for (const dy of [0, 1]) {
          const px = fitted.x + (x + dx - asset.pivot[0]!) * fitted.scale, py = fitted.y + (y + dy - asset.pivot[1]!) * fitted.scale;
          if (Math.abs(px) > Math.sqrt(3) * (TILE_RADIUS - TILE_ART_INSET) / 2 + 1e-8 || Math.abs(py) + Math.abs(px) / Math.sqrt(3) > TILE_RADIUS - TILE_ART_INSET + 1e-8) violations++;
        }
      }
      expect(violations, asset.id).toBe(0);
      const used = Math.max(fitted.horizontalExtent! / (Math.sqrt(3) * (TILE_RADIUS - TILE_ART_INSET) / 2), fitted.diagonalExtent! / (TILE_RADIUS - TILE_ART_INSET));
      expect(used, asset.id).toBeCloseTo(SETTLEMENT_FILL[role], 10);
      const family = asset.id.split('.').slice(2).join('.') || 'generic';
      families.set(family, [...families.get(family) ?? [], { role, width: fitted.bounds.width, height: fitted.bounds.height }]);
      // Returning diagnostics can never mutate the registered geometry.
      fitted.bounds.width = -1;
      expect(registeredSettlementFit(asset, atlas.sha256)!.bounds.width).toBeGreaterThan(0);
    }
    expect(families.size).toBe(25);
    for (const [family, stages] of families) {
      const ordered = ['village', 'town', 'city'].map(role => stages.find(stage => stage.role === role)!);
      for (let i = 1; i < ordered.length; i++) {
        // Distinct architectural shapes need not become taller AND wider: a
        // broad steppe city is lower than its town, while filling more width.
        expect(ordered[i]!.width > ordered[i - 1]!.width || ordered[i]!.height > ordered[i - 1]!.height, family).toBe(true);
      }
    }
  });

  it('uses a single complete motion union and preserves its pivot transform at every frame', () => {
    const frame = () => ({ width: 96, height: 96, data: new Uint8Array(96 * 96 * 4) });
    const a = frame(), b = frame();
    for (const image of [a, b]) for (let y = 30; y < 80; y++) for (let x = 35; x < 60; x++) image.data[(y * 96 + x) * 4 + 3] = 255;
    a.data[(20 * 96 + 12) * 4 + 3] = 1; // even faint nonzero pixels count
    b.data[(15 * 96 + 83) * 4 + 3] = 255;
    const before = [a.data.slice(), b.data.slice()], geometry = measureOpaqueGeometry([a, b]);
    const fit = fitOpaqueSettlement(a, [48, 80], 'city', geometry);
    expect(geometry.bounds).toEqual({ x: 12, y: 15, width: 72, height: 65 });
    expect(fit).toEqual(fitOpaqueSettlement(b, [48, 80], 'city', geometry));
    expect(fit.x - 48 * fit.scale).toBeCloseTo(fit.canvasBounds!.x);
    expect(fit.y - 80 * fit.scale).toBeCloseTo(fit.canvasBounds!.y);
    expect(tileFootprintContained(fit)).toBe(true);
    expect(Buffer.from(a.data).equals(before[0]!)).toBe(true); expect(Buffer.from(b.data).equals(before[1]!)).toBe(true);
    expect(() => measureOpaqueGeometry([frame()])).toThrow('no visible pixels');
    expect(() => measureOpaqueGeometry([a, { ...b, width: 64 }])).toThrow('canvases differ');
  });

  it('safely falls back on any changed approved image identity without touching improvements or units', () => {
    const root = resolve(import.meta.dirname, '../../..');
    const catalog = JSON.parse(readFileSync(resolve(root, 'assets/art/runtime/catalog.json'), 'utf8')) as RuntimeCatalog;
    const asset = catalog.assets.find(item => item.id === 'settlement.town.ashen_compact')!, hash = catalog.atlases.find(page => page.id === asset.atlasId)!.sha256;
    const expected = { ...fitTileArtwork(asset.nativeResolution, asset.pivot, 'town'), boundsKind: 'canvas' };
    expect(registeredSettlementFit(asset, 'changed')).toEqual(expected);
    for (const changed of [
      { ...asset, review: { ...asset.review, inputHash: 'changed' } },
      { ...asset, id: 'settlement.town.unregistered' },
      { ...asset, frames: [...asset.frames, asset.frames[0]!] },
      { ...asset, frames: asset.frames.map(frame => ({ ...frame, frame: { ...frame.frame, x: frame.frame.x + 1 } })) },
    ]) expect(registeredSettlementFit(changed, hash)).toEqual(expected);
    for (const changed of [{ ...asset, pivot: [47, 79] as [number, number] }, { ...asset, nativeResolution: { width: 128, height: 128 } }]) {
      const fallback = registeredSettlementFit(changed, hash)!;
      expect(fallback.boundsKind).toBe('canvas'); expect(tileBoundsContained(fallback.bounds)).toBe(true);
    }
    expect(registeredSettlementFit({ ...asset, id: 'improvement.quarry' }, hash)).toBeUndefined();
    expect(registeredSettlementFit({ ...asset, id: 'unit.guard' }, hash)).toBeUndefined();
  });
});
