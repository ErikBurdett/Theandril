import { createHash } from 'node:crypto';
import { lstat, realpath, readFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { sourcePathSchema } from './schema';

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  throw new Error('Cache/provenance metadata must be finite plain JSON');
}
export const sha256 = (input: string | Uint8Array): string => createHash('sha256').update(input).digest('hex');
export const cacheKey = (settings: unknown): string => sha256(canonicalJson(settings));

/** Reject symlink components, including dangling links; missing final output paths are permitted. */
export async function safeAssetPath(root: string, relativePath: string): Promise<string> {
  const parsed = sourcePathSchema.parse(relativePath);
  const rootPath = await realpath(root);
  const destination = resolve(rootPath, parsed);
  const relation = relative(rootPath, destination);
  if (relation === '..' || relation.startsWith(`..${sep}`) || !relation) throw new Error('Asset path escapes root');
  let current = rootPath;
  for (const part of parsed.split('/')) {
    current = resolve(current, part);
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('Symlinked asset path is forbidden'); }
    catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
  }
  return destination;
}

export async function verifyCachedFiles(root: string, files: readonly { path: string; sha256: string }[]): Promise<boolean> {
  if (!files.length || files.length > 4096 || new Set(files.map((file) => file.path)).size !== files.length) return false;
  let totalBytes = 0;
  for (const file of files) {
    if (!/^[a-f0-9]{64}$/.test(file.sha256)) return false;
    try {
      const path = await safeAssetPath(root, file.path), info = await lstat(path);
      totalBytes += info.size;
      if (!info.isFile() || info.size > 128 * 1024 * 1024 || totalBytes > 256 * 1024 * 1024 || sha256(await readFile(path)) !== file.sha256) return false;
    } catch { return false; }
  }
  return true;
}
