import { describe, expect, it } from 'vitest';
import { Container, Graphics } from 'pixi.js';
import { finishChunkBorders, measureChunkCache } from './chunk-cache';

describe('bounded Pixi chunk cache geometry', () => {
  it('reproduces Pixi empty Graphics origin inflation, then discards that unused border before caching', () => {
    const root = new Container(), tiles = new Graphics().rect(16000, 4200, 810, 712).fill(0xffffff), borders = new Graphics();
    root.addChild(tiles, new Container(), borders);
    expect(root.getLocalBounds().width).toBe(16810);
    expect(root.getLocalBounds().height).toBe(4912);
    finishChunkBorders(root, borders, 0);
    expect(borders.destroyed).toBe(true);
    expect(measureChunkCache(root, 256)).toEqual({ width: 810, height: 712, bytesEstimate: 4 * 1024 * 1024 });
    root.destroy({ children: true });
  });
  it('retains genuine borders and props at distant world positions without widening to the world origin', () => {
    for (const origin of [0, 16000, 30000]) {
      const root = new Container(), terrain = new Graphics().rect(origin, 9000, 820, 714).fill(0x747658), props = new Container();
      props.addChild(new Graphics().rect(origin + 400, 9300, 32, 32).fill(0xdbce95));
      root.addChild(terrain, props);
      const borders = new Graphics().moveTo(origin + 2, 9002).lineTo(origin + 2, 9020).stroke({ width: 2, color: 0xe0cc88 });
      finishChunkBorders(root, borders, 1);
      expect(borders.destroyed).toBe(false); expect(borders.parent).toBe(root);
      const cache = measureChunkCache(root, 256);
      expect(cache.width).toBeLessThanOrEqual(900); expect(cache.height).toBeLessThanOrEqual(760);
      expect(cache.bytesEstimate).toBe(4 * 1024 * 1024);
      root.destroy({ children: true });
    }
  });
  it('does not allocate a cache for a neighbor chunk with no observed cells', () => {
    const root = new Container(), borders = new Graphics(); root.addChild(new Container());
    finishChunkBorders(root, borders, 0);
    expect(measureChunkCache(root, 0)).toEqual({ width: 0, height: 0, bytesEstimate: 0 });
    root.destroy({ children: true });
  });
});
