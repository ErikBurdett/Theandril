/** Screen-size bounds preserve readable armies through continuous camera zoom.
 * Uniform scale retains the native aspect ratio; a mounted figure does not use
 * a terrain tile's nonuniform hex transform. Detailed art never shrinks to a dot.
 */
export function armySpriteScale(nativeHeight: number, zoom: number, garrison = false): number {
  const screenCanvas = Math.max(42, Math.min(78, 54 * zoom));
  return screenCanvas / nativeHeight / zoom * (garrison ? .85 : 1);
}
export function strategicSpriteScale(nativeWidth: number, nativeHeight: number, zoom: number): number {
  return 44 / Math.max(nativeWidth, nativeHeight) / zoom;
}
