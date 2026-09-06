import { join, resolve } from 'node:path';
import { z } from 'zod';
import { MAX_ART_BYTES, pngDimensions, readArtFile, redact, sha256, writeArtFile } from '../toolchain/process';
import type { ArtGenerationRequest, GeneratedCandidate } from './types';

const requestSchema = z.object({
  assetId: z.string().regex(/^[a-z][a-z0-9_.-]{0,119}$/), prompt: z.string().min(1).max(12_000),
  width: z.number().int().min(1).max(8192), height: z.number().int().min(1).max(8192), seed: z.string().regex(/^\d{1,16}$/).optional(),
  references: z.array(z.object({ path: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict()).max(8).optional(), outputDirectory: z.string().min(1),
}).strict();
export async function validateRequest(request: ArtGenerationRequest): Promise<ArtGenerationRequest> {
  const checked = requestSchema.parse(request);
  if (checked.width * checked.height > 16_777_216 || checked.outputDirectory.includes('\0')) throw new Error('Generation request exceeds supported dimensions or has an invalid output directory.');
  for (const reference of checked.references ?? []) if (sha256(await readArtFile(reference.path)) !== reference.sha256) throw new Error('Generation reference hash does not match its source.');
  return checked;
}
export async function storeCandidate(request: ArtGenerationRequest, provider: string, images: Uint8Array[], metadata: { model?: string; licenseNotes: string[]; seed?: string }): Promise<GeneratedCandidate> {
  if (!images.length || images.length > 16) throw new Error('Provider returned an unsupported candidate count.');
  const files: GeneratedCandidate['files'] = [];
  for (const [index, bytes] of images.entries()) {
    if (bytes.length > MAX_ART_BYTES) throw new Error('Provider image exceeds 64 MiB.'); pngDimensions(bytes);
    const hash = sha256(bytes), path = join(resolve(request.outputDirectory), `${request.assetId}.${hash.slice(0, 16)}.${index}.png`);
    await writeArtFile(path, bytes); files.push({ path, sha256: hash });
  }
  const result: GeneratedCandidate = { assetId: request.assetId, provider, ...(metadata.model ? { model: redact(metadata.model) } : {}), ...(metadata.seed ? { seed: metadata.seed } : {}), promptHash: sha256(request.prompt), referenceHashes: (request.references ?? []).map(reference => reference.sha256), files, createdAt: new Date().toISOString(), licenseNotes: metadata.licenseNotes.map(note => redact(note)) };
  // Timestamp is not part of the content-addressed image identity; retain all invocation metadata separately.
  const path = join(resolve(request.outputDirectory), `${request.assetId}.${sha256(JSON.stringify(result)).slice(0, 16)}.candidate.json`);
  await writeArtFile(path, JSON.stringify(result, null, 2)); return result;
}
export function localBackendUrl(value: string | undefined): URL {
  let url: URL;
  try { url = new URL(value ?? 'http://127.0.0.1:8188'); } catch { throw new Error('COMFYUI_URL is malformed.'); }
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('ComfyUI must use a plain loopback HTTP origin without credentials, paths or query strings.');
  return url;
}
export async function fetchBounded(url: URL | string, options: RequestInit = {}, timeoutMs = 120_000, maxBytes = MAX_ART_BYTES): Promise<Uint8Array> {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600_000) throw new Error('Provider timeout must be 1–600000 ms.');
  try {
    const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`Provider request failed with HTTP ${response.status}.`);
    if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Provider response exceeds the byte limit.');
    const reader = response.body?.getReader(); if (!reader) throw new Error('Provider returned no response body.');
    const chunks: Uint8Array[] = []; let total = 0;
    try { while (true) { const part = await reader.read(); if (part.done) break; total += part.value.length; if (total > maxBytes) { await reader.cancel(); throw new Error('Provider response exceeds the byte limit.'); } chunks.push(part.value); } }
    finally { reader.releaseLock(); }
    const result = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; } return result;
  } catch (error) {
    const message = error instanceof Error && /^Provider (request failed with HTTP|response exceeds|returned no response)/.test(error.message) ? error.message : 'Provider request failed or timed out. Endpoint response bodies and credentials are not logged.';
    throw new Error(message);
  }
}
export async function fetchJson(url: URL | string, options: RequestInit = {}, timeoutMs = 120_000): Promise<unknown> {
  const bytes = await fetchBounded(url, options, timeoutMs); try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; } catch { throw new Error('Provider returned invalid JSON.'); }
}
