import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PixelLabGenerator, PerfectPixelGenerator, ComfyUIGenerator, CodexSourceGenerator, importCodexCandidate } from './index';
import { fetchBounded, localBackendUrl } from './shared';
import { sha256 } from '../toolchain/process';
import { encodePng } from '../png';
import type { ArtGenerationRequest } from './types';

const temporary: string[] = [];
async function setup(): Promise<{ request: ArtGenerationRequest; bytes: Uint8Array; source: string }> {
  const directory = await mkdtemp(join(tmpdir(), 'theandril-provider-test-')); temporary.push(directory);
  const bytes = encodePng({ width: 32, height: 32, data: new Uint8Array(32 * 32 * 4).fill(255) }), source = join(directory, 'source.png'); await writeFile(source, bytes);
  return { request: { assetId: 'unit.guard', prompt: 'An original weathered guard with an iron shield.', width: 32, height: 32, outputDirectory: directory }, bytes, source };
}
afterEach(async () => { vi.unstubAllGlobals(); for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true }); });

describe('actual built-in output import bridge', () => {
  it('preserves source bytes and recorded provenance instead of claiming to invoke generation', async () => {
    const { request, source, bytes } = await setup(); const { outputDirectory, ...metadata } = request;
    const candidate = await importCodexCandidate(source, { ...metadata, references: [{ path: source, sha256: sha256(bytes) }], licenseNotes: ['Original test contract fixture, not production art.'] }, outputDirectory);
    expect(candidate.provider).toBe('codex-built-in'); expect(candidate.promptHash).toBe(sha256(request.prompt)); expect(candidate.referenceHashes).toEqual([sha256(bytes)]);
    expect(await readFile(candidate.files[0]!.path)).toEqual(Buffer.from(bytes)); expect(candidate.files[0]!.sha256).toBe(sha256(bytes));
    await expect(new CodexSourceGenerator().generate(request)).rejects.toThrow('actual Codex');
  });
  it('rejects mismatched references, invalid asset IDs and corrupted PNG output', async () => {
    const { request, source } = await setup(); const { outputDirectory, ...metadata } = request;
    await expect(importCodexCandidate(source, { ...metadata, references: [{ path: source, sha256: 'a'.repeat(64) }], licenseNotes: ['Fixture.'] }, outputDirectory)).rejects.toThrow('reference hash');
    await expect(importCodexCandidate(source, { ...metadata, assetId: '../escape', licenseNotes: ['Fixture.'] }, outputDirectory)).rejects.toThrow();
    await writeFile(source, new Uint8Array(30)); await expect(importCodexCandidate(source, { ...metadata, licenseNotes: ['Fixture.'] }, outputDirectory)).rejects.toThrow('PNG');
  });
});

describe('credential-gated real provider contracts', () => {
  it('fails before requests when credentials, local workflow or executable are unavailable', async () => {
    const { request } = await setup(), fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(new PixelLabGenerator({ env: {} }).generate(request)).rejects.toThrow('PIXELLAB_API_KEY');
    await expect(new PerfectPixelGenerator({ env: {} }).generate(request)).rejects.toThrow('PERFECTPIXEL_BIN');
    await expect(new ComfyUIGenerator({ env: {} }).generate(request)).rejects.toThrow('COMFYUI_WORKFLOW'); expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the official fixed PixelLab endpoint and captures only actual returned PNG bytes', async () => {
    const { request, bytes } = await setup(); const fetch = vi.fn(async (_url: URL | string, _options?: RequestInit) => new Response(JSON.stringify({ image: { base64: 'data:image/png;base64,' + Buffer.from(bytes).toString('base64') } }), { status: 200 })); vi.stubGlobal('fetch', fetch);
    const [candidate] = await new PixelLabGenerator({ env: { PIXELLAB_API_KEY: 'test-key' } }).generate({ ...request, seed: '42' });
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.pixellab.ai/v2/create-image-pixflux');
    const options = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1]; expect(options.redirect).toBe('error');
    expect(JSON.parse(options.body as string)).toMatchObject({ seed: 42, image_size: { width: 32, height: 32 } });
    expect(candidate).toMatchObject({ provider: 'pixellab', seed: '42', promptHash: sha256(request.prompt) }); expect(JSON.stringify(candidate)).not.toContain('test-key');
  });
  it('redacts provider failures and enforces streaming output and timeout bounds', async () => {
    const { request } = await setup(); vi.stubGlobal('fetch', vi.fn(async () => new Response('upstream-secret-key', { status: 401 })));
    await expect(new PixelLabGenerator({ env: { PIXELLAB_API_KEY: 'upstream-secret-key' } }).generate(request)).rejects.toThrow('HTTP 401');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(9)))); await expect(fetchBounded('http://127.0.0.1/', {}, 1000, 8)).rejects.toThrow('byte limit');
    await expect(fetchBounded('http://127.0.0.1/', {}, Infinity)).rejects.toThrow('timeout');
  });
  it('does not allow credentials or arbitrary remote URLs in a local backend address', () => {
    expect(localBackendUrl(undefined).origin).toBe('http://127.0.0.1:8188');
    for (const value of ['https://remote.example', 'http://key@localhost:8188', 'http://localhost:8188/?token=key', 'file:///tmp/backend', 'http://localhost:8188/private']) expect(() => localBackendUrl(value)).toThrow();
  });
  it('uses a real API-format ComfyUI queue/history/view contract with bounded polling and authored bindings', async () => {
    const { request, bytes } = await setup(), workflowPath = join(request.outputDirectory, 'workflow.json');
    await writeFile(workflowPath, JSON.stringify({ model: 'operator-owned-test-model', licenseNotes: ['Test transport fixture; no actual model inference claimed.'], workflow: { '1': { class_type: 'FixtureNode', inputs: { text: '', seed: 0, width: 0, height: 0 } } }, bindings: { prompt: { node: '1', input: 'text' }, seed: { node: '1', input: 'seed' }, width: { node: '1', input: 'width' }, height: { node: '1', input: 'height' } } }));
    const fetch = vi.fn(async (url: URL | string) => {
      const path = new URL(url).pathname;
      return path === '/prompt' ? Response.json({ prompt_id: 'job-1' }) : path === '/history/job-1' ? Response.json({ 'job-1': { status: { completed: true }, outputs: { '2': { images: [{ filename: 'result.png', subfolder: '', type: 'output' }] } } } }) : new Response(Buffer.from(bytes));
    }); vi.stubGlobal('fetch', fetch);
    const [candidate] = await new ComfyUIGenerator({ env: { COMFYUI_WORKFLOW: workflowPath }, pollMs: 1 }).generate({ ...request, seed: '7' });
    expect(candidate).toMatchObject({ provider: 'comfyui', model: 'operator-owned-test-model', seed: '7' }); expect(fetch).toHaveBeenCalledTimes(3);
  });
});
