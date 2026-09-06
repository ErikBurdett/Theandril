import { assertImage, type RgbaImage } from './png';
import { assetManifestSchema, type AssetManifest } from './schema';
import type { FrameImage } from './validation';

/** Review-only sheet: checkerboard, one-pixel cell borders and unfiltered integer scaling. No approval is implied. */
export function buildContactSheet(assets: readonly { manifest: AssetManifest; frames: readonly FrameImage[] }[], options: { scale: 1 | 2 | 4; columns: number }): RgbaImage {
  if (![1, 2, 4].includes(options.scale) || !Number.isInteger(options.columns) || options.columns < 1 || options.columns > 32) throw new Error('Contact sheet scale/column limits exceeded');
  if (!assets.length || assets.length > 4096 || assets.reduce((sum, asset) => sum + asset.frames.length, 0) > 4096) throw new Error('Contact sheet requires 1–4096 total frames');
  const ordered = [...assets].sort((a, b) => a.manifest.id < b.manifest.id ? -1 : a.manifest.id > b.manifest.id ? 1 : 0);
  if (new Set(ordered.map((item) => item.manifest.id)).size !== ordered.length) throw new Error('Duplicate contact sheet asset IDs');
  const frames: FrameImage[] = [];
  for (const item of ordered) {
    const manifest = assetManifestSchema.parse(item.manifest);
    if (item.frames.length !== manifest.frames.length || new Set(item.frames.map((frame) => frame.id)).size !== item.frames.length) throw new Error('Contact sheet frame count/identity mismatch');
    const images = new Map(item.frames.map((frame) => [frame.id, frame]));
    for (const source of [...manifest.frames].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
      const frame = images.get(source.id);
      if (!frame) throw new Error('Missing contact sheet frame');
      assertImage(frame.image);
      if (frame.image.width !== manifest.nativeResolution.width || frame.image.height !== manifest.nativeResolution.height) throw new Error('Contact sheet source dimensions differ from brief');
      frames.push(frame);
    }
  }
  if (!frames.length || frames.length > 4096) throw new Error('Contact sheet requires 1–4096 frames');
  const scale = options.scale, margin = 8;
  const cellWidth = Math.max(...frames.map((frame) => frame.image.width)) * scale + margin * 2;
  const cellHeight = Math.max(...frames.map((frame) => frame.image.height)) * scale + margin * 2;
  const columns = Math.min(options.columns, frames.length), rows = Math.ceil(frames.length / columns);
  const width = columns * cellWidth, height = rows * cellHeight;
  if (width > 4096 || height > 4096) throw new Error('Contact sheet exceeds 4096 pixels; split the review pack');
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const border = x % cellWidth === 0 || y % cellHeight === 0;
    const value = border ? 112 : (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 46 : 64;
    data.set([value, value, value, 255], (y * width + x) * 4);
  }
  for (const [index, frame] of frames.entries()) {
    const left = (index % columns) * cellWidth + Math.floor((cellWidth - frame.image.width * scale) / 2);
    const top = Math.floor(index / columns) * cellHeight + Math.floor((cellHeight - frame.image.height * scale) / 2);
    for (let y = 0; y < frame.image.height * scale; y++) for (let x = 0; x < frame.image.width * scale; x++) {
      const from = (Math.floor(y / scale) * frame.image.width + Math.floor(x / scale)) * 4;
      const to = ((top + y) * width + left + x) * 4, alpha = frame.image.data[from + 3]!;
      for (let channel = 0; channel < 3; channel++) data[to + channel] = Math.round((frame.image.data[from + channel]! * alpha + data[to + channel]! * (255 - alpha)) / 255);
    }
  }
  return { width, height, data };
}
