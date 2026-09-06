import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { executable, readArtFile, runTool, sha256 } from '../toolchain/process';
import { storeCandidate, validateRequest } from './shared';
import type { ArtGenerationRequest, ArtGenerator, GeneratedCandidate, ProviderCapabilities } from './types';

export const PERFECTPIXEL_KEYS = ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'FAL_KEY', 'FAL_API_KEY', 'BYTEPLUS_API_KEY', 'ARK_API_KEY'] as const;
/** Invokes upstream cmd/ppvalidate, not the Wails GUI or an invented HTTP service. */
export class PerfectPixelGenerator implements ArtGenerator {
  readonly id = 'perfectpixel-studio';
  constructor(private options: { env?: NodeJS.ProcessEnv; timeoutMs?: number } = {}) {}
  capabilities(): ProviderCapabilities { return { autonomous: true, references: false, seeded: false, animation: false, maxWidth: 1024, maxHeight: 1024, limitations: ['This bounded adapter invokes ppvalidate base-only mode. Upstream animation/directional generation is not yet exposed here.', 'Upstream output resolution and palette differ from the requested native profile and require validation/normalization.', 'The upstream 8-direction harness mirrors three directions; it must not be used blindly for asymmetric equipment.'] }; }
  async generate(request: ArtGenerationRequest): Promise<GeneratedCandidate[]> {
    const checked = await validateRequest(request), env = this.options.env ?? process.env, binary = env.PERFECTPIXEL_BIN;
    if (!binary || !await executable(binary)) throw new Error('PERFECTPIXEL_BIN must identify the upstream ppvalidate executable, not its GUI.');
    if (!PERFECTPIXEL_KEYS.some(name => env[name]?.trim())) throw new Error('PerfectPixel provider credentials are missing. No generation request was sent.');
    if (checked.seed !== undefined || checked.references?.length) throw new Error('The upstream ppvalidate command does not accept an explicit seed or supplied references; these must not be silently discarded.');
    if (checked.width > 1024 || checked.height > 1024) throw new Error('PerfectPixel candidate request exceeds this adapter’s 1024-pixel bound.');
    await mkdir(resolve(checked.outputDirectory), { recursive: true });
    const directory = join(resolve(checked.outputDirectory), `${checked.assetId}.perfectpixel-${sha256(checked.prompt).slice(0, 16)}`);
    // A distinct work directory prevents clobbering another generation or reading a repo .env.
    try { await mkdir(directory, { recursive: false }); } catch { throw new Error('PerfectPixel work directory exists or cannot be created; choose a fresh candidate directory.'); }
    const timeoutMs = this.options.timeoutMs ?? 300_000;
    const result = await runTool(resolve(binary), ['-percat', '0', '-desc', checked.prompt, '-style', 'pixel', '-attempts', '1', '-timeout', `${Math.ceil(timeoutMs / 1000)}s`, '-out', directory], { cwd: directory, env: { ...env, XDG_CONFIG_HOME: join(directory, 'isolated-config') }, timeoutMs });
    // Upstream reports the actual selected model on stdout; never infer it from a missing configuration.
    const model = /모델:\s*([^\s·]+)/u.exec(result.stdout)?.[1];
    return [await storeCandidate(checked, this.id, [await readArtFile(join(directory, 'base.png'))], { model, licenseNotes: ['PerfectPixel Studio tooling is MIT; generated output remains subject to the actual backend/model terms and reference rights.', 'CLI binary SHA-256: ' + sha256(await readArtFile(binary)), 'Base-only adapter; upstream does not expose seed control or requested native canvas size.'] })];
  }
}
