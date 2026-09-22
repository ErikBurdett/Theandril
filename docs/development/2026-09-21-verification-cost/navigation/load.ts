import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { createNavigation } from '../../../../packages/ai/src/navigation';

export const evidence = dirname(fileURLToPath(import.meta.url)), root = resolve(evidence, '../../../..');
export async function loadNavigation(filename: string): Promise<{ createNavigation: typeof createNavigation }> {
  const source = await readFile(resolve(evidence, filename), 'utf8');
  const rewritten = source.replace(/from '@theandril\/([^']+)'/g, (_match, name: string) => `from '${pathToFileURL(resolve(root, `packages/${name}/src/index.ts`)).href}'`);
  const directory = await mkdtemp(resolve(tmpdir(), 'theandril-navigation-cost-'));
  const file = resolve(directory, 'navigation.mts');
  await writeFile(file, rewritten);
  return import(pathToFileURL(file).href);
}
