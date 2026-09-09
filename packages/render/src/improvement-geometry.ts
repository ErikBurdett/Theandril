import type { RuntimeAsset } from '@theandril/art-pipeline/runtime';
import data from './improvement-geometry-data.json';
import { fitOpaqueSettlement, fitTileArtwork, type OpaqueGeometry, type TileArtworkFit, type TileBounds } from './tile-footprint';

interface GeometryRecord { approvalHash: string; atlasId: string; atlasHash: string; native: number[]; pivot: number[]; frames: (string | number)[][]; geometry: OpaqueGeometry }
const records = data.assets as unknown as Readonly<Record<string, GeometryRecord>>;
export const IMPROVEMENT_FILL = .85;
type MapAsset = Pick<RuntimeAsset, 'id' | 'atlasId' | 'nativeResolution' | 'pivot' | 'frames' | 'review'>;

/** Exact offline all-frame union. Original textures and pivots stay untouched;
 * a changed atlas, approval or frame rectangle uses the safe full-canvas fit. */
export function registeredImprovementFit(asset: MapAsset, atlasHash: string): TileArtworkFit | undefined {
  if (!asset.id.startsWith('improvement.') && !asset.id.startsWith('building.') && !asset.id.startsWith('resource.')) return;
  const record = records[asset.id];
  if (!record || record.atlasHash !== atlasHash || record.atlasId !== asset.atlasId || record.approvalHash !== asset.review.inputHash
    || record.native[0] !== asset.nativeResolution.width || record.native[1] !== asset.nativeResolution.height
    || record.pivot[0] !== asset.pivot[0] || record.pivot[1] !== asset.pivot[1] || record.frames.length !== asset.frames.length
    || record.frames.some((frame, index) => {
      const actual = asset.frames[index]!;
      return frame[0] !== actual.id || frame[1] !== actual.frame.x || frame[2] !== actual.frame.y || frame[3] !== actual.frame.w || frame[4] !== actual.frame.h;
    })) return { ...fitTileArtwork(asset.nativeResolution, asset.pivot, 'improvement'), boundsKind: 'canvas' };
  // The existing support-plane fitter solves the full inset hex. A uniform
  // 85% scale of that fit preserves every plane, anchor and animation union.
  const fit = fitOpaqueSettlement(asset.nativeResolution, asset.pivot, 'city', record.geometry);
  const bounds = (value: TileBounds): TileBounds => ({ x: value.x * IMPROVEMENT_FILL, y: value.y * IMPROVEMENT_FILL, width: value.width * IMPROVEMENT_FILL, height: value.height * IMPROVEMENT_FILL });
  return { ...fit, scale: fit.scale * IMPROVEMENT_FILL, x: fit.x * IMPROVEMENT_FILL, y: fit.y * IMPROVEMENT_FILL,
    bounds: bounds(fit.bounds), canvasBounds: fit.canvasBounds ? bounds(fit.canvasBounds) : undefined,
    horizontalExtent: fit.horizontalExtent! * IMPROVEMENT_FILL, diagonalExtent: fit.diagonalExtent! * IMPROVEMENT_FILL };
}
