import { PNG } from 'pngjs';
import { inflateSync } from 'node:zlib';

export interface RgbaImage { width: number; height: number; data: Uint8Array }
export interface ImageRect { x: number; y: number; w: number; h: number }
export const MAX_IMAGE_DIMENSION = 4096;
export const MAX_IMAGE_PIXELS = 16_777_216;
export const MAX_PNG_BYTES = 80 * 1024 * 1024;
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function assertImage(image: RgbaImage): void {
  if (!Number.isSafeInteger(image.width) || !Number.isSafeInteger(image.height) || image.width < 1 || image.height < 1 || image.width > MAX_IMAGE_DIMENSION || image.height > MAX_IMAGE_DIMENSION || image.width * image.height > MAX_IMAGE_PIXELS || !(image.data instanceof Uint8Array) || image.data.byteLength !== image.width * image.height * 4) throw new Error('Invalid or oversized RGBA image');
}

export function decodePng(bytes: Uint8Array): RgbaImage {
  if (!(bytes instanceof Uint8Array) || bytes.length < 45 || bytes.length > MAX_PNG_BYTES) throw new Error('Invalid or oversized PNG input');
  const input = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || input.readUInt32BE(8) !== 13 || input.toString('ascii', 12, 16) !== 'IHDR') throw new Error('Invalid PNG signature/header');
  const width = input.readUInt32BE(16), height = input.readUInt32BE(20);
  if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) throw new Error('PNG dimensions exceed bounded decode limits');
  const depth = input[24]!, colorType = input[25]!, interlace = input[28]!;
  const channels = new Map([[0, 1], [2, 3], [3, 1], [4, 2], [6, 4]]).get(colorType);
  const depths = colorType === 0 ? [1, 2, 4, 8, 16] : colorType === 3 ? [1, 2, 4, 8] : [8, 16];
  if (!channels || !depths.includes(depth) || input[26] !== 0 || input[27] !== 0 || interlace > 1) throw new Error('Unsupported or invalid PNG header modes');
  // pngjs' noninterlaced inflate truncates excess output and its interlaced path has no limit.
  // Verify all chunks and exact bounded inflated size first, including every Adam7 pass.
  let offset = 8, chunks = 0, ended = false, idatEnded = false, paletteSeen = false, transparencySeen = false;
  const idat: Buffer[] = [];
  while (offset < input.length) {
    if (++chunks > 65536 || offset + 12 > input.length) throw new Error('Truncated or excessive PNG chunks');
    const length = input.readUInt32BE(offset), type = input.toString('ascii', offset + 4, offset + 8);
    if (length > MAX_PNG_BYTES || offset + length + 12 > input.length) throw new Error('PNG chunk length exceeds input');
    if (crc32(input.subarray(offset + 4, offset + 8 + length)) !== input.readUInt32BE(offset + 8 + length)) throw new Error('PNG chunk CRC mismatch');
    if (type === 'IHDR' && offset !== 8) throw new Error('Duplicate PNG header');
    if (['acTL', 'fcTL', 'fdAT'].includes(type)) throw new Error('APNG requires explicit frame extraction; a static import may not discard animation');
    if (type === 'PLTE') {
      if (paletteSeen || idat.length || colorType === 0 || colorType === 4 || !length || length % 3 !== 0 || length > 768) throw new Error('Invalid PNG palette/order');
      paletteSeen = true;
    }
    if (type === 'tRNS') {
      if (transparencySeen || idat.length || colorType === 4 || colorType === 6 || (colorType === 3 && !paletteSeen)) throw new Error('Invalid PNG transparency/order');
      transparencySeen = true;
    }
    if (type === 'IDAT') { if (idatEnded) throw new Error('Non-contiguous PNG image chunks'); idat.push(input.subarray(offset + 8, offset + 8 + length)); }
    else if (idat.length) idatEnded = true;
    offset += length + 12;
    if (type === 'IEND') { if (length !== 0 || offset !== input.length) throw new Error('Invalid PNG end/trailing data'); ended = true; break; }
  }
  if (!ended || !idat.length) throw new Error('Incomplete PNG stream');
  const passes = interlace ? [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]] : [[0, 0, 1, 1]];
  let expected = 0;
  for (const [startX, startY, strideX, strideY] of passes) {
    const passWidth = Math.max(0, Math.ceil((width - startX!) / strideX!)), passHeight = Math.max(0, Math.ceil((height - startY!) / strideY!));
    if (passWidth && passHeight) expected += (1 + Math.ceil(passWidth * channels * depth / 8)) * passHeight;
  }
  if (inflateSync(Buffer.concat(idat), { maxOutputLength: expected + 1 }).length !== expected) throw new Error('PNG inflated size differs from declared dimensions');
  // pngjs now handles validated filters, sample formats, palette and interlacing.
  const decoded = PNG.sync.read(input, { checkCRC: true });
  const result = { width: decoded.width, height: decoded.height, data: new Uint8Array(decoded.data) };
  assertImage(result);
  return result;
}

export function encodePng(image: RgbaImage): Uint8Array {
  assertImage(image);
  const png = new PNG({ width: image.width, height: image.height });
  png.data = Buffer.from(image.data);
  return new Uint8Array(PNG.sync.write(png, { colorType: 6, inputColorType: 6, bitDepth: 8, filterType: 0, deflateLevel: 9, deflateStrategy: 3 }));
}

export function cropImage(image: RgbaImage, rect: ImageRect): RgbaImage {
  assertImage(image);
  if (![rect.x, rect.y, rect.w, rect.h].every(Number.isSafeInteger) || rect.x < 0 || rect.y < 0 || rect.w < 1 || rect.h < 1 || rect.x + rect.w > image.width || rect.y + rect.h > image.height) throw new Error('Crop outside source image');
  const data = new Uint8Array(rect.w * rect.h * 4);
  for (let y = 0; y < rect.h; y++) data.set(image.data.subarray(((rect.y + y) * image.width + rect.x) * 4, ((rect.y + y) * image.width + rect.x + rect.w) * 4), y * rect.w * 4);
  return { width: rect.w, height: rect.h, data };
}
