import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { SELECTION_MASK_LIMIT, selectionContourAlpha, selectionGlintAlpha, selectionSilhouette } from './selection-effect';

interface Mask { texture: Texture; shape: ReturnType<typeof selectionSilhouette> }
export interface SelectedAssetTarget { entityId: string; factionId: string; color: number; sprite: Sprite }
export interface SelectedFallback { entityId: string; factionId: string; color: number; x: number; y: number; width: number; height: number }

/** One selected entity, at most three drawn representatives. No filters, full
 * atlas readback, per-frame geometry generation, or simulation state are used. */
export class SelectedAssetVisual {
  readonly container = new Container({ eventMode: 'none' });
  private contours: Sprite[] = [];
  private glints: Graphics[] = [];
  private fallback = new Graphics();
  private targets: SelectedAssetTarget[] = [];
  private masks = new Map<Texture, Mask>();
  private active: { target: SelectedAssetTarget; mask: Mask; outline: Sprite }[] = [];
  private animated = false;
  private fallbackTarget: SelectedFallback | undefined;
  private failed = false;
  private time = 0;

  constructor() {
    this.container.addChild(this.fallback);
    for (let index = 0; index < 3; index++) {
      const glint = new Graphics().rect(-.5, -2.5, 1, 5).fill({ color: 0xffffff, alpha: .8 }).rect(-2.5, -.5, 5, 1).fill({ color: 0xffffff, alpha: .8 });
      glint.visible = false; this.glints.push(glint); this.container.addChild(glint);
    }
  }

  set(targets: SelectedAssetTarget[], fallback: SelectedFallback | undefined, animated: boolean): void {
    this.targets = targets.slice(0, 3); this.animated = animated; this.fallbackTarget = fallback; this.failed = false;
    this.synchronize(); this.paintFallback(); this.tick(this.time);
  }
  clear(): void { this.set([], undefined, false); }

  private mask(texture: Texture): Mask | undefined {
    const previous = this.masks.get(texture);
    if (previous) { this.masks.delete(texture); this.masks.set(texture, previous); return previous; }
    try {
      const frame = texture.frame;
      if (frame.width > SELECTION_MASK_LIMIT || frame.height > SELECTION_MASK_LIMIT) { this.failed = true; return; }
      const canvas = document.createElement('canvas'); canvas.width = frame.width; canvas.height = frame.height;
      // RuntimeArt already verified this same-origin image and frame rectangle.
      const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) return;
      context.drawImage(texture.source.resource as CanvasImageSource, frame.x, frame.y, frame.width, frame.height, 0, 0, frame.width, frame.height);
      const shape = selectionSilhouette(context.getImageData(0, 0, frame.width, frame.height).data, frame.width, frame.height);
      if (!shape.bounds) return;
      canvas.width = shape.width; canvas.height = shape.height;
      context.putImageData(new ImageData(shape.pixels, shape.width, shape.height), 0, 0);
      const outline = Texture.from(canvas, true); outline.source.scaleMode = 'nearest'; outline.source.autoGenerateMipmaps = false;
      const mask = { texture: outline, shape }; this.masks.set(texture, mask);
      // LRU touch happens before eviction. Three current targets fit safely.
      while (this.masks.size > 16) { const key = [...this.masks.keys()].find(key => !this.targets.some(target => target.sprite.texture === key))!; this.masks.get(key)!.texture.destroy(true); this.masks.delete(key); }
      return mask;
    } catch { this.failed = true; return; }
  }

  private synchronize(): void {
    this.contours.forEach(sprite => { sprite.visible = false; }); this.active = [];
    for (const target of this.targets) {
      const mask = this.mask(target.sprite.texture); if (!mask) continue;
      const index = this.active.length;
      let outline = this.contours[index];
      if (!outline) { outline = new Sprite(); this.contours.push(outline); this.container.addChildAt(outline, index); }
      const { shape } = mask, sprite = target.sprite;
      outline.texture = mask.texture;
      outline.anchor.set((sprite.anchor.x * shape.sourceWidth + shape.padding) / shape.width, (sprite.anchor.y * shape.sourceHeight + shape.padding) / shape.height);
      outline.position.copyFrom(sprite.position); outline.scale.copyFrom(sprite.scale); outline.tint = target.color; outline.roundPixels = true; outline.visible = sprite.visible;
      this.active.push({ target, mask, outline });
    }
  }
  private paintFallback(): void {
    this.fallback.clear();
    if (this.active.length || !this.fallbackTarget) return;
    const { x, y, width, height, color } = this.fallbackTarget, length = Math.min(5, width / 4, height / 4);
    for (const [dx, dy] of [[0, 0], [width, 0], [0, height], [width, height]]) {
      const sx = dx ? -1 : 1, sy = dy ? -1 : 1;
      this.fallback.moveTo(x + dx! + sx * length, y + dy!).lineTo(x + dx!, y + dy!).lineTo(x + dx!, y + dy! + sy * length);
    }
    this.fallback.stroke({ color, width: 1.3, alpha: .65 });
  }
  tick(time: number): void {
    this.time = time;
    if (this.active.some(({ target, mask }) => this.masks.get(target.sprite.texture) !== mask)) { this.synchronize(); this.paintFallback(); }
    const alpha = selectionContourAlpha(time, this.animated);
    for (const { outline } of this.active) outline.alpha = alpha;
    for (let index = 0; index < this.glints.length; index++) {
      const glint = this.glints[index]!, selected = this.active[index % Math.max(1, this.active.length)];
      glint.visible = Boolean(selected && this.animated);
      if (!selected || !this.animated) continue;
      const { sprite } = selected.target, shape = selected.mask.shape, point = shape.points[index]!;
      glint.position.set(sprite.x + (point.x - sprite.anchor.x * shape.sourceWidth) * sprite.scale.x, sprite.y + (point.y - sprite.anchor.y * shape.sourceHeight) * sprite.scale.y);
      glint.tint = selected.target.color; glint.alpha = selectionGlintAlpha(time, index, true);
    }
  }
  diagnostics() {
    const target = this.targets[0] ?? this.fallbackTarget;
    const boxes = this.active.map(({ target, mask }) => {
      const { sprite } = target, { shape } = mask, bounds = shape.bounds!;
      return { x: sprite.x + (bounds.x - sprite.anchor.x * shape.sourceWidth) * sprite.scale.x, y: sprite.y + (bounds.y - sprite.anchor.y * shape.sourceHeight) * sprite.scale.y, width: bounds.width * sprite.scale.x, height: bounds.height * sprite.scale.y };
    });
    if (!boxes.length && this.fallbackTarget) boxes.push(this.fallbackTarget);
    const width = boxes.length ? Math.max(...boxes.map(box => box.x + box.width)) - Math.min(...boxes.map(box => box.x)) : 0;
    const height = boxes.length ? Math.max(...boxes.map(box => box.y + box.height)) - Math.min(...boxes.map(box => box.y)) : 0;
    return { entityId: target?.entityId ?? null, factionId: target?.factionId ?? null, color: target?.color ?? null,
      mode: this.active.length ? 'silhouette' : this.fallbackTarget ? 'procedural-brackets' : 'none', contours: this.active.length, glints: this.glints.filter(glint => glint.visible).length,
      animated: this.active.length > 0 && this.animated, contourAlpha: selectionContourAlpha(this.time, this.animated), failed: this.failed,
      cacheEntries: this.masks.size, textureBytes: [...this.masks.values()].reduce((sum, mask) => sum + mask.shape.width * mask.shape.height * 4, 0),
      bounds: { width, height },
      sourceFrames: this.active.map(({ target }) => ({ x: target.sprite.texture.frame.x, y: target.sprite.texture.frame.y, width: target.sprite.texture.frame.width, height: target.sprite.texture.frame.height })),
    };
  }
  destroy(): void {
    this.container.removeFromParent(); this.container.destroy({ children: true });
    for (const mask of this.masks.values()) mask.texture.destroy(true);
    this.masks.clear(); this.active = []; this.targets = [];
  }
}
