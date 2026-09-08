export interface CameraExtent { viewportWidth: number; viewportHeight: number; worldWidth: number; worldHeight: number }

/** Report the actual presentation, not just the scale: a Tiny world can reach
 * its raster fit while its zoom still overlaps the strategic-marker interval. */
export function cameraPresentation(zoom: number, overview: boolean) {
  return overview ? 'world-overview' : zoom < .65 ? 'strategic-glyphs' : zoom < 1.2 ? 'static-sprites' : 'near-sprites';
}

/** Presentation geometry only: a 12px margin remains around the whole world. */
export function worldFitScale(extent: CameraExtent): number {
  return Math.max(.001, Math.min((Math.max(1, extent.viewportWidth) - 24) / extent.worldWidth, (Math.max(1, extent.viewportHeight) - 24) / extent.worldHeight));
}

/** Swap to the bounded raster before zooming out would expose unbounded chunks.
 * At most six chunk-widths plus the edge/padding chunks enter the detail view.
 */
export function detailScaleFloor(viewportWidth: number, viewportHeight: number, chunkWidth: number, chunkHeight: number): number {
  return Math.max(.35, viewportWidth / (chunkWidth * 6), viewportHeight / (chunkHeight * 6));
}

export function nextCameraScale(current: number, factor: number, fit: number, detailFloor: number) {
  const scale = Math.max(fit, Math.min(2.2, current * factor));
  return { scale, atFit: scale <= fit, overview: scale < detailFloor || scale <= fit };
}
