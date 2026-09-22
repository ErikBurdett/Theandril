import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as Simulation from '../../../../packages/sim/src/simulation';
import type * as Territory from '../../../../packages/sim/src/territory';

/** Tool-only: load the retained pre-change observation implementations without
 * replacing working source. Current unchanged dependencies are shared. */
export async function loadBaseline(): Promise<{ simulation: typeof Simulation; territory: typeof Territory }> {
  const evidence = dirname(fileURLToPath(import.meta.url)), repository = resolve(evidence, '../../../..');
  const require = createRequire(resolve(repository, 'packages/sim/src/simulation.ts'));
  const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-observations-before-'));
  for (const name of ['territory', 'simulation']) {
    const original = await readFile(resolve(evidence, `${name}-before.ts.txt`), 'utf8');
    const resolved = original.replace(/from '([^']+)'/g, (match, specifier: string) => {
      if (!specifier.startsWith('.') && !specifier.startsWith('@theandril/')) return match.replace(`'${specifier}'`, `'${pathToFileURL(require.resolve(specifier)).href}'`);
      const target = specifier === './territory' ? resolve(temporary, 'territory.mts')
        : specifier.startsWith('@theandril/') ? resolve(repository, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
          : resolve(repository, 'packages/sim/src', `${specifier}.ts`);
      return `from '${pathToFileURL(target).href}'`;
    });
    await writeFile(resolve(temporary, `${name}.mts`), resolved);
  }
  return { simulation: await import(pathToFileURL(resolve(temporary, 'simulation.mts')).href) as typeof Simulation,
    territory: await import(pathToFileURL(resolve(temporary, 'territory.mts')).href) as typeof Territory };
}
