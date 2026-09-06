import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { totalmem } from 'node:os';
import { join } from 'node:path';
import { asepriteVersion } from './aseprite';
import { findPixelSnapper } from './pixelsnapper';
import { executable, findExecutable, readArtFile, runTool } from './process';
import { PERFECTPIXEL_KEYS } from '../generators/perfectpixel';
import { comfyWorkflowSchema } from '../generators/comfyui';
import { fetchJson, localBackendUrl } from '../generators/shared';

export type DoctorStatus = 'FOUND' | 'MISSING' | 'OPTIONAL' | 'MISCONFIGURED';
export interface DoctorCheck { id: string; status: DoctorStatus; detail: string; version?: string; path?: string }
export interface DoctorReport { checks: DoctorCheck[]; readyForProcessing: boolean; credentialPresence: Record<string, boolean>; memoryMiB: number }
export async function doctor(options: { repoRoot: string; env?: NodeJS.ProcessEnv }): Promise<DoctorReport> {
  const env = options.env ?? process.env, checks: DoctorCheck[] = [], local = join(options.repoRoot, 'tools/art/.local');
  try { const tool = await asepriteVersion({ env }); checks.push({ id: 'aseprite', status: 'FOUND', detail: 'Existing headless Aseprite is available.', version: tool.version, path: tool.binary }); }
  catch { checks.push({ id: 'aseprite', status: env.ASEPRITE_BIN !== undefined ? 'MISCONFIGURED' : 'MISSING', detail: env.ASEPRITE_BIN !== undefined ? 'ASEPRITE_BIN does not resolve to a working Aseprite executable.' : 'Locate the existing Steam install; no reinstall is performed.' }); }
  try {
    const binary = await findPixelSnapper({ repoRoot: options.repoRoot, env });
    if (!binary) checks.push({ id: 'pixel-snapper', status: 'MISSING', detail: 'Install the pinned open-source CLI with tools/art/install-pixel-snapper.sh.' });
    else { const version = (await runTool(binary, ['--version'], { env, timeoutMs: 5000 })).stdout.trim(); if (!/^spritefusion-pixel-snapper \d/.test(version)) throw new Error('Unexpected tool'); checks.push({ id: 'pixel-snapper', status: 'FOUND', path: binary, version, detail: 'Real upstream pixel-grid cleanup is available.' }); }
  } catch { checks.push({ id: 'pixel-snapper', status: 'MISCONFIGURED', detail: 'Configured Pixel Snapper executable could not report its version.' }); }
  for (const [id, required] of [['node', true], ['pnpm', true], ['cargo', false], ['rustc', false], ['go', false]] as const) {
    let binary = await findExecutable(id, env), toolEnv = env;
    if (!binary && (id === 'cargo' || id === 'rustc')) {
      const candidate = join(local, 'cargo/bin', id);
      if (await executable(candidate)) { binary = candidate; toolEnv = { ...env, CARGO_HOME: join(local, 'cargo'), RUSTUP_HOME: join(local, 'rustup') }; }
    }
    if (!binary) { checks.push({ id, status: required ? 'MISSING' : 'OPTIONAL', detail: required ? 'Required CLI runtime is missing.' : 'Optional build dependency is absent; installed native tools can still run.' }); continue; }
    try { const version = (await runTool(binary, [id === 'go' ? 'version' : '--version'], { env: toolEnv, timeoutMs: 5000 })).stdout.trim().slice(0, 200); checks.push({ id, status: 'FOUND', path: binary, version, detail: 'Version command succeeded.' }); }
    catch { checks.push({ id, status: 'MISCONFIGURED', detail: 'Executable is present but its version command failed.' }); }
  }
  const credentialNames = [...PERFECTPIXEL_KEYS, 'PIXELLAB_API_KEY'];
  const credentialPresence = Object.fromEntries(credentialNames.map(name => [name, Boolean(env[name]?.trim())]));
  checks.push({ id: 'pixellab', status: credentialPresence.PIXELLAB_API_KEY ? 'FOUND' : env.PIXELLAB_API_KEY !== undefined ? 'MISCONFIGURED' : 'OPTIONAL', detail: credentialPresence.PIXELLAB_API_KEY ? 'Credential is present; billing/authentication and generation have not been tested.' : 'No usable PixelLab credential; no request will be sent.' });
  if (!env.PERFECTPIXEL_BIN) checks.push({ id: 'perfectpixel-studio', status: env.PERFECTPIXEL_BIN === '' ? 'MISCONFIGURED' : 'OPTIONAL', detail: 'Set PERFECTPIXEL_BIN to the upstream ppvalidate headless executable to enable this adapter.' });
  else {
    try {
      if (!await executable(env.PERFECTPIXEL_BIN)) throw new Error('No executable');
      const result = JSON.parse((await runTool(env.PERFECTPIXEL_BIN, ['-dump'], { env, timeoutMs: 5000 })).stdout) as { presets?: unknown; directions?: unknown };
      if (!Array.isArray(result.presets) || !Array.isArray(result.directions)) throw new Error('Not ppvalidate');
      checks.push({ id: 'perfectpixel-studio', status: PERFECTPIXEL_KEYS.some(name => credentialPresence[name]) ? 'FOUND' : 'MISSING', detail: PERFECTPIXEL_KEYS.some(name => credentialPresence[name]) ? 'Headless ppvalidate and an environment credential are present; generation is untested.' : 'Headless ppvalidate is available but its provider credentials are missing.' });
    } catch { checks.push({ id: 'perfectpixel-studio', status: 'MISCONFIGURED', detail: 'PERFECTPIXEL_BIN is not a working ppvalidate headless executable.' }); }
  }
  try {
    const url = localBackendUrl(env.COMFYUI_URL);
    if (!env.COMFYUI_WORKFLOW) checks.push({ id: 'comfyui-workflow', status: 'OPTIONAL', detail: 'No model workflow is configured; no local generation is claimed.' });
    else { comfyWorkflowSchema.parse(JSON.parse((await readArtFile(env.COMFYUI_WORKFLOW)).toString())); checks.push({ id: 'comfyui-workflow', status: 'FOUND', detail: 'Workflow schema and declared provenance are valid; model availability is not verified.' }); }
    const response = await fetchJson(new URL('system_stats', url), {}, 1200);
    if (!response || typeof response !== 'object' || !('system' in response)) throw new Error('Unexpected ComfyUI response');
    checks.push({ id: 'comfyui', status: 'FOUND', detail: 'Loopback ComfyUI system_stats responds; this is not a model-quality or VRAM sufficiency claim.' });
  } catch { checks.push({ id: 'comfyui', status: env.COMFYUI_URL !== undefined || env.COMFYUI_WORKFLOW !== undefined ? 'MISCONFIGURED' : 'OPTIONAL', detail: 'No working configured loopback ComfyUI workflow/backend was verified.' }); }
  const nvidia = await findExecutable('nvidia-smi', env);
  if (!nvidia) checks.push({ id: 'gpu', status: 'OPTIONAL', detail: 'NVIDIA probe unavailable. No accelerator or VRAM availability is assumed.' });
  else {
    try { const result = await runTool(nvidia, ['--query-gpu=name,memory.total,driver_version', '--format=csv,noheader'], { env, timeoutMs: 5000 }); checks.push({ id: 'gpu', status: 'FOUND', detail: result.stdout.trim().slice(0, 500) }); }
    catch { checks.push({ id: 'gpu', status: 'MISCONFIGURED', detail: 'nvidia-smi exists but cannot query a working driver. GPU generation is not available by this probe.' }); }
  }
  for (const path of ['assets/art/source', 'assets/art/candidates', 'assets/art/approved', 'assets/art/runtime', 'assets/art/briefs']) {
    try { if (!(await stat(join(options.repoRoot, path))).isDirectory()) throw new Error('Not directory'); await access(join(options.repoRoot, path), constants.W_OK); checks.push({ id: path, status: 'FOUND', detail: 'Output directory is writable.' }); }
    catch { checks.push({ id: path, status: 'MISSING', detail: 'Output directory is missing or not writable.' }); }
  }
  try {
    const path = join(options.repoRoot, 'assets/palettes/theandril-master.json'), palette = JSON.parse(await readFile(path, 'utf8')) as { colors?: unknown[] };
    if (!Array.isArray(palette.colors) || palette.colors.length < 1 || palette.colors.length > 256) throw new Error('Invalid palette');
    checks.push({ id: 'palette', status: 'FOUND', detail: 'Master palette JSON has a bounded colors array; production validation checks each color.' });
  } catch { checks.push({ id: 'palette', status: 'MISSING', detail: 'A readable master palette with a bounded colors array is required.' }); }
  try {
    await mkdir(local, { recursive: true }); const probe = await mkdtemp(join(local, 'doctor-'));
    try { await writeFile(join(probe, 'write-probe'), 'ok', { flag: 'wx' }); } finally { await rm(probe, { recursive: true, force: true }); }
    checks.push({ id: 'cache', status: 'FOUND', detail: 'Ignored project-local tool/cache directory passed a temporary write probe.' });
  } catch { checks.push({ id: 'cache', status: 'MISCONFIGURED', detail: 'Project-local cache is not writable.' }); }
  checks.push({ id: 'atlas-tooling', status: 'FOUND', detail: 'The project deterministic atlas compiler is installed with this package; approved assets are still required.' });
  checks.push({ id: 'codex-built-in', status: 'OPTIONAL', detail: 'Source-file bridge is installed. Only the actual Codex session can verify/run its built-in generation tool; CLI doctor does not claim a callable API.' });
  return { checks, credentialPresence, memoryMiB: Math.floor(totalmem() / 1024 / 1024), readyForProcessing: ['aseprite', 'pixel-snapper', 'node', 'palette', 'cache'].every(id => checks.some(check => check.id === id && check.status === 'FOUND')) };
}
