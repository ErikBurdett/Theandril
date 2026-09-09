export interface BattleCameraPoint { x: number; y: number }
export interface BattleCameraTransform extends BattleCameraPoint { zoom: number }

const finite = (value: number, fallback: number): number => Number.isFinite(value) ? value : fallback;

/** Inspect native ranks within the battlefield; the canonical layout never moves.
 * One pan unit traverses one visible viewport in world coordinates at this zoom.
 */
export function battleCameraTransform(width: number, height: number, worldHeight: number, zoom: number, focus: BattleCameraPoint, pan: BattleCameraPoint): BattleCameraTransform {
  const scale = Math.max(1, Math.min(4, finite(zoom, 1)));
  if (scale === 1) return { zoom: 1, x: 0, y: 0 };
  const viewportWidth = Math.max(1, finite(width, 1)), viewportHeight = Math.max(1, finite(height, 1));
  const fieldHeight = Math.max(1, finite(worldHeight, viewportHeight));
  const centerX = finite(focus.x, viewportWidth / 2) + finite(pan.x, 0) * viewportWidth / scale;
  const centerY = finite(focus.y, fieldHeight / 2) + finite(pan.y, 0) * viewportHeight / scale;
  const x = Math.max(viewportWidth - viewportWidth * scale, Math.min(0, viewportWidth / 2 - centerX * scale));
  const y = Math.max(Math.min(0, viewportHeight - fieldHeight * scale), Math.min(0, viewportHeight / 2 - centerY * scale));
  return { zoom: scale, x, y };
}

/** Convert a viewport pointer into the unchanged formation/soldier layout. */
export function battleCameraPoint(point: BattleCameraPoint, transform: BattleCameraTransform): BattleCameraPoint {
  return { x: (point.x - transform.x) / transform.zoom, y: (point.y - transform.y) / transform.zoom };
}
