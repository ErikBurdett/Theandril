/** Presentation geometry only. The canonical odd-row cell and its pick area do
 * not change when a building is fitted into this inset. Units use another scale. */
export const TILE_RADIUS = 29;
export const TILE_ART_INSET = 2;
export type TileArtworkRole = 'improvement' | 'village' | 'town' | 'city' | 'ruin';
export interface TileBounds { x: number; y: number; width: number; height: number }
export interface OpaqueGeometry {
  bounds: TileBounds;
  /** maxima of x, -x, y+x/√3, y-x/√3, -y+x/√3, -y-x/√3 */
  support: readonly [number, number, number, number, number, number];
}
export interface TileArtworkFit {
  scale: number; x: number; y: number; bounds: TileBounds; inset: number;
  /** Only nontransparent pixels are bounded when opaque-union metadata is used.
   * The untouched transparent canvas can extend outside that rectangle. */
  canvasBounds?: TileBounds;
  boundsKind?: 'opaque-union' | 'canvas';
  horizontalExtent?: number;
  diagonalExtent?: number;
}
export interface TileFootprint {
  cell: number; contentId: string; assetId: string | null; role: TileArtworkRole;
  presentation: 'approved' | 'procedural'; bounds: TileBounds; scale: number;
  anchor: { x: number; y: number }; alpha: number;
  canvasBounds?: TileBounds; boundsKind?: 'opaque-union' | 'canvas';
  horizontalExtent?: number; diagonalExtent?: number;
}
const CAPS: Readonly<Record<TileArtworkRole, number>> = { improvement: 30, village: 26, town: 30, city: 34, ruin: 28 };
/** Fraction of the usable hex support planes. Architectural silhouettes remain
 * different; progression expands their space instead of forcing equal shapes. */
export const SETTLEMENT_FILL = Object.freeze({ village: .82, town: .92, city: 1 });

/** Corners suffice for a rectangle inside this convex pointy hex. The inset is
 * measured on the sloping-line intercept; it also leaves horizontal clearance. */
export function tileBoundsContained(bounds: TileBounds, inset = TILE_ART_INSET): boolean {
  const radius = TILE_RADIUS - inset;
  if (![bounds.x, bounds.y, bounds.width, bounds.height, inset].every(Number.isFinite)
    || bounds.width < 0 || bounds.height < 0 || inset < 0 || radius <= 0) return false;
  for (const x of [bounds.x, bounds.x + bounds.width]) for (const y of [bounds.y, bounds.y + bounds.height]) {
    if (Math.abs(x) > Math.sqrt(3) * radius / 2 + 1e-9 || Math.abs(y) + Math.abs(x) / Math.sqrt(3) > radius + 1e-9) return false;
  }
  return true;
}

/** A nonrectangular silhouette can fill the hex's wider middle without putting
 * pixels into the bounding rectangle's empty corners. These two union support
 * extents check all six half-planes, including entire opaque pixel squares. */
export function tileFootprintContained(footprint: Pick<TileArtworkFit, 'bounds' | 'boundsKind' | 'horizontalExtent' | 'diagonalExtent'>, inset = TILE_ART_INSET): boolean {
  if (footprint.boundsKind !== 'opaque-union') return tileBoundsContained(footprint.bounds, inset);
  const { horizontalExtent: x, diagonalExtent: d } = footprint, radius = TILE_RADIUS - inset;
  return Number.isFinite(x) && Number.isFinite(d) && Number.isFinite(inset) && inset >= 0 && radius > 0
    && x! >= 0 && d! >= 0 && x! <= Math.sqrt(3) * radius / 2 + 1e-9 && d! <= radius + 1e-9;
}

/** Offline/test-only measurement. Runtime uses the identity-checked compact
 * table, never this pixel loop. One union across frames retains real motion. */
export function measureOpaqueGeometry(frames: readonly { width: number; height: number; data: Uint8Array }[]): OpaqueGeometry {
  const first = frames[0];
  if (!first || frames.length > 64 || first.width < 1 || first.height < 1 || first.width > 192 || first.height > 192 || !Number.isInteger(first.width) || !Number.isInteger(first.height)) throw new Error('Invalid bounded settlement frames.');
  let minX = first.width, minY = first.height, maxX = -1, maxY = -1;
  for (const frame of frames) {
    if (frame.width !== first.width || frame.height !== first.height || frame.data.length !== frame.width * frame.height * 4) throw new Error('Settlement frame canvases differ.');
    for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) if (frame.data[(y * frame.width + x) * 4 + 3]) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x + 1); maxY = Math.max(maxY, y + 1);
    }
  }
  if (maxX < 0) throw new Error('Settlement frames contain no visible pixels.');
  const support: [number, number, number, number, number, number] = [maxX, -minX, -Infinity, -Infinity, -Infinity, -Infinity];
  for (const frame of frames) for (let y = 0; y < frame.height; y++) for (let x = 0; x < frame.width; x++) if (frame.data[(y * frame.width + x) * 4 + 3]) {
    // Select the maximizing corner of the WHOLE pixel square for each plane.
    support[2] = Math.max(support[2], y + 1 + (x + 1) / Math.sqrt(3));
    support[3] = Math.max(support[3], y + 1 - x / Math.sqrt(3));
    support[4] = Math.max(support[4], -y + (x + 1) / Math.sqrt(3));
    support[5] = Math.max(support[5], -y - x / Math.sqrt(3));
  }
  return { bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }, support };
}

const determinant = (a: readonly number[], b: readonly number[], c: readonly number[]) => a[0]! * (b[1]! * c[2]! - b[2]! * c[1]!) - a[1]! * (b[0]! * c[2]! - b[2]! * c[0]!) + a[2]! * (b[0]! * c[1]! - b[1]! * c[0]!);

export function fitOpaqueSettlement(native: { width: number; height: number }, pivot: readonly number[], role: keyof typeof SETTLEMENT_FILL, geometry: OpaqueGeometry): TileArtworkFit {
  // Keep the same input validation as the safe canvas fallback.
  fitTileArtwork(native, pivot, role);
  const b = geometry.bounds, support = geometry.support;
  if (![b.x, b.y, b.width, b.height, ...support].every(Number.isFinite) || support.length !== 6 || b.x < 0 || b.y < 0 || b.width <= 0 || b.height <= 0 || b.x + b.width > native.width || b.y + b.height > native.height
    || support[0] !== b.x + b.width || support[1] !== -b.x) throw new Error('Invalid settlement opaque union.');
  const radius = (TILE_RADIUS - TILE_ART_INSET) * SETTLEMENT_FILL[role];
  const h = Math.sqrt(3) * radius / 2, k = 1 / Math.sqrt(3);
  // Uniform scale + translation form a three-variable linear program. Its
  // optimum is a vertex of these six planes (plus the no-upscale plane): at
  // most 35 triples, computed ONCE per asset, not per town or animation tick.
  const planes = [[support[0], 1, 0, h], [support[1], -1, 0, h], [support[2], k, 1, radius], [support[3], -k, 1, radius], [support[4], k, -1, radius], [support[5], -k, -1, radius], [1, 0, 0, 1]];
  let scale = 0, tx = 0, ty = 0, centering = Infinity;
  for (let i = 0; i < planes.length; i++) for (let j = i + 1; j < planes.length; j++) for (let l = j + 1; l < planes.length; l++) {
    const a = planes[i]!, d = planes[j]!, c = planes[l]!, det = determinant(a, d, c);
    if (Math.abs(det) < 1e-10) continue;
    const s = determinant([a[3]!, a[1]!, a[2]!], [d[3]!, d[1]!, d[2]!], [c[3]!, c[1]!, c[2]!]) / det;
    const x = determinant([a[0]!, a[3]!, a[2]!], [d[0]!, d[3]!, d[2]!], [c[0]!, c[3]!, c[2]!]) / det;
    const y = determinant([a[0]!, a[1]!, a[3]!], [d[0]!, d[1]!, d[3]!], [c[0]!, c[1]!, c[3]!]) / det;
    if (s <= 0 || planes.some(p => p[0]! * s + p[1]! * x + p[2]! * y > p[3]! + 1e-8)) continue;
    const center = (x + (b.x + b.width / 2) * s) ** 2 + (y + (b.y + b.height / 2) * s) ** 2;
    if (s > scale + 1e-10 || Math.abs(s - scale) <= 1e-10 && center < centering) { scale = s; tx = x; ty = y; centering = center; }
  }
  if (!scale) throw new Error('Settlement opaque union has no bounded fit.');
  const horizontalExtent = Math.max(support[0] * scale + tx, support[1] * scale - tx);
  const diagonalExtent = Math.max(support[2] * scale + tx * k + ty, support[3] * scale - tx * k + ty, support[4] * scale + tx * k - ty, support[5] * scale - tx * k - ty);
  return { scale, x: tx + pivot[0]! * scale, y: ty + pivot[1]! * scale, inset: TILE_ART_INSET, boundsKind: 'opaque-union', horizontalExtent, diagonalExtent,
    bounds: { x: tx + b.x * scale, y: ty + b.y * scale, width: b.width * scale, height: b.height * scale },
    canvasBounds: { x: tx, y: ty, width: native.width * scale, height: native.height * scale } };
}

/** Uniformly fit the ENTIRE declared canvas, including every animation frame.
 * No alpha readback, texture crop, pivot rewrite or catalog metadata is needed.
 * Reposition the registered anchor so the canvas is centered in its own hex.
 * Non-square future props use the actual inset-hex constraints, not a square mask.
 */
export function fitTileArtwork(native: { width: number; height: number }, pivot: readonly number[], role: TileArtworkRole): TileArtworkFit {
  const { width, height } = native, [px, py] = pivot;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0
    || !Number.isFinite(px) || !Number.isFinite(py) || px! < 0 || py! < 0 || px! > width || py! > height) throw new Error('Invalid tile artwork canvas or pivot.');
  const radius = TILE_RADIUS - TILE_ART_INSET;
  const scale = Math.min(1, CAPS[role] / Math.max(width, height), Math.sqrt(3) * radius / width, 2 * radius / (height + width / Math.sqrt(3)));
  return { scale, x: (px! - width / 2) * scale, y: (py! - height / 2) * scale,
    bounds: { x: -width * scale / 2, y: -height * scale / 2, width: width * scale, height: height * scale }, inset: TILE_ART_INSET };
}

export function tileArtworkRole(contentId: string): TileArtworkRole | undefined {
  if (contentId.startsWith('improvement.')) return 'improvement';
  if (contentId === 'map.ruin') return 'ruin';
  if (contentId === 'settlement.village') return 'village';
  if (contentId === 'settlement.town') return 'town';
  if (contentId === 'settlement.city') return 'city';
  return undefined;
}

/** Existing distinct code-native improvement identifiers, with their backing. */
export const IMPROVEMENT_GLYPH_BOUNDS: Readonly<TileBounds> = Object.freeze({ x: -11, y: -10, width: 22, height: 22 });
