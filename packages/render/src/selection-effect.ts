export const SELECTION_CYCLE_MS = 4800;
export const SELECTION_MASK_LIMIT = 256;
export const SELECTION_MASK_PADDING = 2;

/** A one-native-pixel external contour, never a rectangle or a hex-shaped wash.
 * Used only on approved visible entity frames, not on terrain or atlas pages. */
export function selectionSilhouette(rgba: ArrayLike<number>, width: number, height: number) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > SELECTION_MASK_LIMIT || height > SELECTION_MASK_LIMIT || rgba.length !== width * height * 4) throw new Error('Invalid selected frame dimensions.');
  const padding = SELECTION_MASK_PADDING, outputWidth = width + padding * 2, outputHeight = height + padding * 2;
  const pixels = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && rgba[(y * width + x) * 4 + 3]! >= 128;
  let left = width, top = height, right = -1, bottom = -1, contourPixels = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (opaque(x, y)) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!opaque(x + dx, y + dy)) {
      const offset = ((y + dy + padding) * outputWidth + x + dx + padding) * 4;
      if (!pixels[offset + 3]) { pixels.set([255, 255, 255, 255], offset); contourPixels++; }
    }
  }
  const points: { x: number; y: number }[] = [];
  if (right >= left) {
    // Three fixed silhouette extremities; they twinkle in place, never orbit,
    // float, bounce the artwork, or multiply with the global army count.
    const targets = [{ x: left, y: top + (bottom - top) * .25 }, { x: right, y: top + (bottom - top) * .15 }, { x: right, y: top + (bottom - top) * .8 }];
    for (const target of targets) {
      let best = Infinity, point = { x: left, y: top };
      for (let y = top - 1; y <= bottom + 1; y++) for (let x = left - 1; x <= right + 1; x++) if (pixels[((y + padding) * outputWidth + x + padding) * 4 + 3]) {
        const distance = (x - target.x) ** 2 + (y - target.y) ** 2;
        if (distance < best) { best = distance; point = { x, y }; }
      }
      points.push(point);
    }
  }
  return { pixels, width: outputWidth, height: outputHeight, sourceWidth: width, sourceHeight: height, padding, points, contourPixels,
    bounds: right < left ? null : { x: left - 1, y: top - 1, width: right - left + 3, height: bottom - top + 3 } };
}

/** Fixed slow fade. Far zoom and reduced motion hold an unchanging contour. */
export function selectionContourAlpha(time: number, animated: boolean): number {
  return animated ? .46 + .1 * Math.sin(time / SELECTION_CYCLE_MS * Math.PI * 2) : .5;
}
export function selectionGlintAlpha(time: number, index: number, animated: boolean): number {
  if (!animated) return 0;
  const phase = ((time / SELECTION_CYCLE_MS + index / 3) % 1 + 1) % 1;
  return phase < .36 ? Math.sin(phase / .36 * Math.PI) ** 2 * .8 : 0;
}
