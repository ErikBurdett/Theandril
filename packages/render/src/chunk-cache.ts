import type { Container, Graphics } from 'pixi.js';

export interface ChunkCacheSize { width: number; height: number; bytesEstimate: number }

/** Empty Graphics bounds include (0,0) in Pixi, unlike an empty Container. */
export function finishChunkBorders(root: Container, borders: Graphics, edgeCount: number): void {
  if (edgeCount > 0) root.addChild(borders);
  else { borders.removeFromParent(); borders.destroy(); }
}

/** Construction-time only; matches cache resolution1, no MSAA/mipmaps. */
export function measureChunkCache(root: Container, cellCount: number): ChunkCacheSize {
  if (!cellCount) return { width: 0, height: 0, bytesEstimate: 0 };
  const bounds = root.getLocalBounds();
  const width = Math.ceil(bounds.maxX) - Math.floor(bounds.minX);
  const height = Math.ceil(bounds.maxY) - Math.floor(bounds.minY);
  // Pixi's TexturePool rounds each backing dimension to the next power of two.
  const backingWidth = 2 ** Math.ceil(Math.log2(Math.max(1, width)));
  const backingHeight = 2 ** Math.ceil(Math.log2(Math.max(1, height)));
  return { width, height, bytesEstimate: backingWidth * backingHeight * 4 };
}
