import { describe, expect, it } from 'vitest';
import { validatePngDimensions } from './image-validation';

function header(width = 1024, height = 512): Uint8Array {
  const bytes = new Uint8Array(33); bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer); view.setUint32(8, 13); bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width); view.setUint32(20, height); bytes[24] = 8; bytes[25] = 6;
  return bytes;
}
describe('PNG pre-decode allocation guard', () => {
  it('accepts bounded declared dimensions, including a byte-offset view', () => {
    const padded = new Uint8Array(40); padded.set(header(), 7);
    expect(validatePngDimensions(padded.subarray(7), { width: 1024, height: 512 })).toEqual({ width: 1024, height: 512 });
  });
  it('rejects malformed signature, missing/invalid IHDR, and truncation', () => {
    const wrongSignature = header(); wrongSignature[0] = 0;
    const wrongChunk = header(); wrongChunk[12] = 0;
    const wrongLength = header(); wrongLength[11] = 12;
    for (const bytes of [wrongSignature, wrongChunk, wrongLength, header().subarray(0, 32)]) expect(() => validatePngDimensions(bytes)).toThrow('PNG');
  });
  it('rejects an oversized compressed-image header even if catalog dimensions match it', () => {
    expect(() => validatePngDimensions(header(8192, 8192), { width: 8192, height: 8192 })).toThrow('4,096');
    expect(() => validatePngDimensions(header(0, 512))).toThrow('4,096');
    expect(() => validatePngDimensions(header(1024, 0xffffffff))).toThrow('4,096');
  });
  it('rejects a bounded image that disagrees with the approved atlas dimensions', () => {
    expect(() => validatePngDimensions(header(512, 512), { width: 1024, height: 1024 })).toThrow('dimensions mismatch');
  });
  it('rejects illegal color-depth, compression, filter, and interlace encoding', () => {
    for (const [index, value] of [[24, 3], [25, 5], [26, 1], [27, 1], [28, 2]]) {
      const bytes = header(); bytes[index!] = value!;
      expect(() => validatePngDimensions(bytes)).toThrow('IHDR encoding');
    }
  });
});
