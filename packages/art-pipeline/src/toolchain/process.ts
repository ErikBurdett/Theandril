import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { decodePng } from '../png';

export const MAX_ART_BYTES = 64 * 1024 * 1024;
export const sha256 = (value: string | Uint8Array): string => createHash('sha256').update(value).digest('hex');
export function stableSettings(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b, 'en'))) : item);
}
export function redact(value: string, env: NodeJS.ProcessEnv = process.env): string {
  let clean = value;
  for (const [name, secret] of Object.entries(env)) if (/KEY|TOKEN|SECRET|PASSWORD/i.test(name) && secret && secret.length >= 4) clean = clean.split(secret).join('[REDACTED]');
  return clean.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
}
export async function runTool(binary: string, args: readonly string[], options: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; maxOutputBytes?: number } = {}): Promise<{ stdout: string; stderr: string }> {
  const timeoutMs = options.timeoutMs ?? 30_000, maxOutputBytes = options.maxOutputBytes ?? 1024 * 1024;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600_000) throw new Error('Tool timeout must be 1–600000 ms.');
  if (!Number.isInteger(maxOutputBytes) || maxOutputBytes < 1 || maxOutputBytes > 16 * 1024 * 1024) throw new Error('Tool output limit must be 1–16777216 bytes.');
  if (!binary || [binary, ...args].some(value => value.includes('\0'))) throw new Error('Invalid tool argument.');
  return new Promise((accept, reject) => {
    const child = spawn(binary, [...args], { cwd: options.cwd, env: options.env ?? process.env, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', bytes = 0, failed = false;
    const fail = (message: string) => { if (failed) return; failed = true; child.kill('SIGKILL'); clearTimeout(timer); reject(new Error(message)); };
    const timer = setTimeout(() => fail('Art tool exceeded its timeout.'), timeoutMs);
    child.on('error', () => fail('Art tool could not be started. Check its executable configuration.'));
    const collect = (chunk: Buffer, error: boolean) => { bytes += chunk.length; if (bytes > maxOutputBytes) { fail('Art tool output exceeded its safety limit.'); return; } if (error) stderr += chunk.toString(); else stdout += chunk.toString(); };
    child.stdout.on('data', chunk => collect(chunk as Buffer, false)); child.stderr.on('data', chunk => collect(chunk as Buffer, true));
    child.on('close', code => { clearTimeout(timer); if (failed) return; if (code !== 0) { reject(new Error(`Art tool exited unsuccessfully (${code ?? 'signal'}). No provider output or credentials are included in diagnostics.`)); return; } accept({ stdout: redact(stdout, options.env), stderr: redact(stderr, options.env) }); });
  });
}
export async function executable(path: string): Promise<boolean> {
  try { await access(path, constants.X_OK); return (await stat(path)).isFile(); } catch { return false; }
}
export async function findExecutable(name: string, env: NodeJS.ProcessEnv = process.env): Promise<string | undefined> {
  if (name.includes('/')) return await executable(name) ? resolve(name) : undefined;
  for (const directory of (env.PATH ?? '').split(':').filter(Boolean)) { const candidate = join(directory, name); if (await executable(candidate)) return resolve(candidate); }
  return undefined;
}
export async function readArtFile(path: string): Promise<Buffer> {
  if (path.includes('\0')) throw new Error('Invalid art file path.');
  const info = await stat(path);
  if (!info.isFile() || info.size < 1 || info.size > MAX_ART_BYTES) throw new Error('Art source must be a nonempty file no larger than 64 MiB.');
  const data = await readFile(path); if (data.length > MAX_ART_BYTES) throw new Error('Art source exceeded the file limit.'); return data;
}
export function pngDimensions(data: Uint8Array): { width: number; height: number } {
  const { width, height } = decodePng(data);
  return { width, height };
}
/** No silent replacement of a source or an earlier candidate. Equal output is idempotent. */
export async function writeArtFile(path: string, data: Uint8Array | string): Promise<void> {
  if (!isAbsolute(path) || path.includes('\0')) throw new Error('Output path must be absolute.');
  if (Buffer.byteLength(data) > MAX_ART_BYTES) throw new Error('Art output exceeds 64 MiB.');
  await mkdir(dirname(path), { recursive: true });
  try { await writeFile(path, data, { flag: 'wx' }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || sha256(await readArtFile(path)) !== sha256(data)) throw new Error('Art output already exists or could not be written; choose a new candidate directory.');
  }
}
export async function prepareOutput(input: string, output: string): Promise<{ input: string; output: string }> {
  const source = await realpath(input), target = resolve(output);
  if (source === target || target.includes('\0')) throw new Error('Art processing must not replace its input.');
  try { await lstat(target); throw new Error('Output already exists; choose a new candidate path.'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  await mkdir(dirname(target), { recursive: true });
  return { input: source, output: target };
}
