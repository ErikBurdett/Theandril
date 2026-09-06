export interface ImageDimensions { width: number; height: number }

/** Allocation guard only: the browser still validates/decodes the remaining PNG stream. */
export function validatePngDimensions(bytes: Uint8Array, expected?: ImageDimensions): ImageDimensions {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || signature.some((value, index) => bytes[index] !== value) || new TextDecoder().decode(bytes.subarray(12, 16)) !== 'IHDR') throw new Error('Art image must begin with a valid PNG header.');
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (header.getUint32(8) !== 13) throw new Error('Art image has an invalid PNG IHDR length.');
  const width = header.getUint32(16), height = header.getUint32(20);
  if (width < 1 || height < 1 || width > 4096 || height > 4096) throw new Error('Art image dimensions exceed the supported 4,096-pixel edge limit.');
  if (expected && (width !== expected.width || height !== expected.height)) throw new Error(`Atlas image dimensions mismatch: expected ${expected.width}×${expected.height}, received ${width}×${height}.`);
  const depths: Record<number, readonly number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
  if (!depths[bytes[25]!]?.includes(bytes[24]!) || bytes[26] !== 0 || bytes[27] !== 0 || (bytes[28] !== 0 && bytes[28] !== 1)) throw new Error('Art image has unsupported or invalid PNG IHDR encoding.');
  return { width, height };
}
