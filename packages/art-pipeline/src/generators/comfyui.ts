import { z } from 'zod';
import { readArtFile, sha256 } from '../toolchain/process';
import { fetchBounded, fetchJson, localBackendUrl, storeCandidate, validateRequest } from './shared';
import type { ArtGenerationRequest, ArtGenerator, GeneratedCandidate, ProviderCapabilities } from './types';

const binding = z.object({ node: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/), input: z.string().regex(/^[a-zA-Z0-9_]{1,80}$/) }).strict();
export const comfyWorkflowSchema = z.object({
  model: z.string().min(1).max(200), licenseNotes: z.array(z.string().min(1).max(2000)).min(1).max(20),
  workflow: z.record(z.string(), z.object({ class_type: z.string().min(1), inputs: z.record(z.string(), z.unknown()) }).passthrough()),
  bindings: z.object({ prompt: binding, seed: binding, width: binding, height: binding }).strict(),
}).strict();
/** Local-only ComfyUI API-format workflow; no model download or remote execution endpoint is guessed. */
export class ComfyUIGenerator implements ArtGenerator {
  readonly id = 'comfyui';
  constructor(private options: { env?: NodeJS.ProcessEnv; timeoutMs?: number; pollMs?: number } = {}) {}
  capabilities(): ProviderCapabilities { return { autonomous: true, references: false, seeded: true, animation: false, maxWidth: 2048, maxHeight: 2048, limitations: ['Requires an operator-authored API-format workflow, installed models, explicit input bindings and model license notes.', 'Current adapter is text-to-image only; model-specific reference, animation and transparent-background workflows are not advertised.'] }; }
  async generate(request: ArtGenerationRequest): Promise<GeneratedCandidate[]> {
    const checked = await validateRequest(request), env = this.options.env ?? process.env;
    if (!env.COMFYUI_WORKFLOW) throw new Error('COMFYUI_WORKFLOW is missing; supply an API-format workflow with explicit bindings and model license notes.');
    if (checked.references?.length || checked.width > 2048 || checked.height > 2048) throw new Error('This ComfyUI adapter supports text-only still images up to 2048×2048.');
    const root = localBackendUrl(env.COMFYUI_URL), source = await readArtFile(env.COMFYUI_WORKFLOW);
    const config = comfyWorkflowSchema.parse(JSON.parse(source.toString()));
    if (Object.keys(config.workflow).length > 256) throw new Error('ComfyUI workflow exceeds 256 nodes.');
    const seed = Number(checked.seed ?? '0'); if (!Number.isSafeInteger(seed) || seed < 0) throw new Error('ComfyUI seed must be a safe nonnegative integer.');
    for (const [name, value] of Object.entries({ prompt: checked.prompt, seed, width: checked.width, height: checked.height })) {
      const target = config.bindings[name as keyof typeof config.bindings], node = config.workflow[target.node];
      if (!node || !Object.hasOwn(node.inputs, target.input)) throw new Error('A ComfyUI input binding does not exist in the supplied workflow.');
      node.inputs[target.input] = value;
    }
    const timeoutMs = this.options.timeoutMs ?? 180_000, pollMs = this.options.pollMs ?? 1500;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600_000 || !Number.isInteger(pollMs) || pollMs < 1 || pollMs > 10_000) throw new Error('Invalid bounded ComfyUI timeout/poll interval.');
    const deadline = Date.now() + timeoutMs;
    const remaining = () => { const left = deadline - Date.now(); if (left < 1) throw new Error('ComfyUI generation timed out; its server-side job may still be running.'); return left; };
    const queued = z.object({ prompt_id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/) }).parse(await fetchJson(new URL('prompt', root), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: config.workflow }) }, remaining()));
    for (let polls = 0; polls < 400; polls++) {
      const history = z.record(z.string(), z.object({ outputs: z.record(z.string(), z.object({ images: z.array(z.object({ filename: z.string().max(200), subfolder: z.string().max(300), type: z.string() })).max(16).optional() }).passthrough()).default({}), status: z.object({ completed: z.boolean(), status_str: z.string().optional() }).passthrough().optional() }).passthrough()).parse(await fetchJson(new URL(`history/${queued.prompt_id}`, root), {}, remaining()));
      const completed = history[queued.prompt_id];
      if (completed?.status?.status_str === 'error') throw new Error('ComfyUI workflow failed. Check its local server; response bodies are not logged.');
      if (completed && (completed.status?.completed || Object.keys(completed.outputs).length)) {
        const files = Object.keys(completed.outputs).sort().flatMap(id => completed.outputs[id]!.images ?? []).filter(file => file.type === 'output');
        if (!files.length || files.length > 16) throw new Error('ComfyUI returned no supported output PNGs or too many images.');
        const images: Uint8Array[] = [];
        for (const file of files) {
          if (!/^[a-zA-Z0-9_. -]+\.png$/i.test(file.filename) || file.filename.includes('..') || file.subfolder.startsWith('/') || file.subfolder.split(/[\\/]/).includes('..') || /[\0\r\n]/.test(file.subfolder)) throw new Error('ComfyUI returned an unsafe output filename.');
          const url = new URL('view', root); url.search = new URLSearchParams({ filename: file.filename, subfolder: file.subfolder, type: 'output' }).toString();
          images.push(await fetchBounded(url, {}, remaining()));
        }
        return [await storeCandidate(checked, this.id, images, { model: config.model, seed: String(seed), licenseNotes: [...config.licenseNotes, 'Workflow SHA-256: ' + sha256(source), 'Local generation reproducibility depends on recorded model/workflow and installed backend; model weights are not copied into provenance.'] })];
      }
      await new Promise(resolve => setTimeout(resolve, Math.min(pollMs, remaining())));
    }
    throw new Error('ComfyUI polling reached its 400-request limit; the server-side job may still be running.');
  }
}
