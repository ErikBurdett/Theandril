import { paletteSchema, type Palette } from './runtime';
import { assertImage, type RgbaImage } from './png';

export function paletteRgb(palette: Palette): readonly (readonly [number, number, number])[] {
  return paletteSchema.parse(palette).colors.map((color) => [Number.parseInt(color.slice(1, 3), 16), Number.parseInt(color.slice(3, 5), 16), Number.parseInt(color.slice(5, 7), 16)] as const);
}

export function normalizePalette(source: RgbaImage, palette: Palette, options: { alphaThreshold?: number } = {}): { image: RgbaImage; changedPixels: number } {
  assertImage(source);
  const threshold = options.alphaThreshold ?? 128;
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 255) throw new Error('Alpha threshold must be an integer from 1 to 255');
  const colors = paletteRgb(palette);
  const data = new Uint8Array(source.data.length);
  let changedPixels = 0;
  const memo = new Map<number, readonly [number, number, number]>();
  for (let at = 0; at < data.length; at += 4) {
    if (source.data[at + 3]! >= threshold) {
      const key = source.data[at]! * 65536 + source.data[at + 1]! * 256 + source.data[at + 2]!;
      let nearest = memo.get(key);
      if (!nearest) {
        let distance = Infinity;
        for (const color of colors) {
          const current = (source.data[at]! - color[0]) ** 2 + (source.data[at + 1]! - color[1]) ** 2 + (source.data[at + 2]! - color[2]) ** 2;
          if (current < distance) { nearest = color; distance = current; }
        }
        nearest ??= colors[0]!;
        if (memo.size < 65536) memo.set(key, nearest);
      }
      data.set(nearest, at); data[at + 3] = 255;
    }
    if (data[at] !== source.data[at] || data[at + 1] !== source.data[at + 1] || data[at + 2] !== source.data[at + 2] || data[at + 3] !== source.data[at + 3]) changedPixels++;
  }
  return { image: { width: source.width, height: source.height, data }, changedPixels };
}
