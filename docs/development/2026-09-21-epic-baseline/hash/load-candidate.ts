import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as Save from '../../../../packages/sim/src/save';

export async function loadCandidate(mode: 'arrays' | 'fold4' | 'fold8' | 'both4'): Promise<typeof Save> {
  const evidence = dirname(fileURLToPath(import.meta.url)), repository = resolve(evidence, '../../../..');
  const require = createRequire(resolve(repository, 'packages/sim/src/save.ts'));
  const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-hash-kernel-'));
  let source = await readFile(resolve(evidence, 'save-before.ts.txt'), 'utf8');
  source = source.replace(/from '([^']+)'/g, (match, specifier: string) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@theandril/')) return match.replace(`'${specifier}'`, `'${pathToFileURL(require.resolve(specifier)).href}'`);
    let target = specifier.startsWith('@theandril/') ? resolve(repository, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
      : resolve(repository, 'packages/sim/src', `${specifier}.ts`);
    if (!existsSync(target)) target = resolve(repository, 'packages/sim/src', specifier, 'index.ts');
    return `from '${pathToFileURL(target).href}'`;
  });
  source = `import { copyWorldLayer, ${mode === 'fold8' ? 'fold8' : 'fold4'} as candidateFold } from '${pathToFileURL(resolve(evidence, 'kernels.ts')).href}';\n` + source;
  if (mode === 'arrays' || mode === 'both4') {
    for (const key of ['terrain', 'fertility', 'biome', 'waterDepth', 'hydrology']) source = source.replace(`[...state.world.${key}]`, `copyWorldLayer(state.world.${key})`);
  }
  if (mode !== 'arrays') {
    source = source.replace('stateChecksum: checksum(stateText)', "stateChecksum: (candidateFold(2166136261, stateText) >>> 0).toString(16).padStart(8, '0')");
    source = source.replace('for (let index = 0; index < part.length; index++) hash = Math.imul(hash ^ part.charCodeAt(index), 16777619);', 'hash = candidateFold(hash, part);');
  }
  await writeFile(resolve(temporary, 'save.mts'), source);
  return await import(pathToFileURL(resolve(temporary, 'save.mts')).href) as typeof Save;
}
