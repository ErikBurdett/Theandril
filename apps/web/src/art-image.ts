import { validatePngDimensions } from '@theandril/render/image-validation';

export interface ArtImageExpectation { width: number; height: number; sha256: string }
const MAX_IMAGE_BYTES = 64 * 1024 * 1024;

/** Check encoded dimensions before browser decode, including unnormalized candidates. */
export async function loadArtImageBytes(url: string, signal: AbortSignal, expected?: ArtImageExpectation): Promise<{ bytes: Uint8Array<ArrayBuffer>; width: number; height: number }> {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`Cannot load art image (${response.status}): ${url}`);
  if (Number(response.headers.get('content-length')) > MAX_IMAGE_BYTES) throw new Error('Art preview exceeds the 64 MiB download limit.');
  const chunks: Uint8Array[] = []; let length = 0;
  const reader = response.body?.getReader();
  if (reader) {
    try {
      while (true) {
        const next = await reader.read(); if (next.done) break;
        length += next.value.length;
        if (length > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error('Art preview exceeds the 64 MiB download limit.'); }
        chunks.push(next.value);
      }
    } finally { reader.releaseLock(); }
  } else {
    const chunk = new Uint8Array(await response.arrayBuffer()); length = chunk.length;
    if (length > MAX_IMAGE_BYTES) throw new Error('Art preview exceeds the 64 MiB download limit.');
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const { width, height } = validatePngDimensions(bytes, expected);
  if (expected) {
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
    if (hash !== expected.sha256) throw new Error('Atlas image hash mismatch. The approved catalog and image do not match; preview withheld.');
  }
  return { bytes, width, height };
}
