import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as Naval from '../../../../packages/ai/src/naval';

const folder = dirname(fileURLToPath(import.meta.url)), repository = resolve(folder, '../../../..');
const replaceOnce = (source: string, old: string, next: string): string => {
  if (source.split(old).length !== 2) throw new Error(`Ambiguous source transform: ${old}`);
  return source.replace(old, next);
};
export async function candidateSource(): Promise<string> {
  let source = await readFile(resolve(folder, 'naval-before.ts.txt'), 'utf8');
  source = replaceOnce(source, '  // One O(observed cells) shoreline pass;', '  if (!fleets.length) return result();\n\n  // One O(observed cells) shoreline pass;');
  source = replaceOnce(source, '  const allShores = view.cells.filter', '  let shoreFacts: { allShores: Observation[\'cells\']; shores: Observation[\'cells\'] } | undefined;\n  const shoreline = () => {\n    if (shoreFacts) return shoreFacts;\n    const allShores = view.cells.filter');
  source = replaceOnce(source, '  const stride = Math.max(1, Math.ceil(allShores.length / 256)), shores = allShores.filter((_, index) => index % stride === 0);', '    const stride = Math.max(1, Math.ceil(allShores.length / 256)), shores = allShores.filter((_, index) => index % stride === 0);\n    return shoreFacts = { allShores, shores };\n  };');
  source = replaceOnce(source, '  const homeLand = new Set(towns.map(town => town.cell)), landQueue = [...homeLand];', '  let homeLand: Set<number> | undefined;\n  const knownHomeLand = (): Set<number> => {\n    if (!homeLand) {\n      homeLand = new Set(towns.map(town => town.cell));\n      const landQueue = [...homeLand];');
  source = replaceOnce(source, '  const navigation = createNavigation(view), claimed = new Set<number>();', '    }\n    return homeLand;\n  };\n  let navigation: ReturnType<typeof createNavigation> | undefined;\n  const claimed = new Set<number>();');
  source = replaceOnce(source, '  const coastalFrontier = new Set(allShores.filter(cell => neighbors(cell.cell, view.width, view.height).some(next => !cells.has(next))).map(cell => cell.cell));', '  let coastalFrontier: Set<number> | undefined;');
  source = replaceOnce(source, '    const cached = shoreDiscovery.get(cell); if (cached !== undefined) return cached;', '    const cached = shoreDiscovery.get(cell); if (cached !== undefined) return cached;\n    coastalFrontier ??= new Set(shoreline().allShores.filter(cell => neighbors(cell.cell, view.width, view.height).some(next => !cells.has(next))).map(cell => cell.cell));');
  source = replaceOnce(source, 'const explore = (fleet: ArmyView) => navigation.destination', 'const explore = (fleet: ArmyView) => (navigation ??= createNavigation(view)).destination');
  source = replaceOnce(source, '    if (passengers.length) {', '    if (passengers.length) {\n      const homeLand = knownHomeLand();');
  source = source.replaceAll('= shores.filter(', '= shoreline().shores.filter(');
  return source;
}
export async function loadCandidate(useRuntime = false): Promise<{ baseline: typeof Naval; candidate: typeof Naval; instrumented: typeof Naval }> {
  const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-lazy-naval-'));
  const original = await readFile(resolve(folder, 'naval-before.ts.txt'), 'utf8');
  const candidate = useRuntime ? await readFile(resolve(repository, 'packages/ai/src/naval.ts'), 'utf8') : await candidateSource();
  await writeFile(resolve(folder, 'naval-lazy-candidate.ts.txt'), candidate);
  const split = original.indexOf('export function planNaval');
  const instrumented = original.slice(0, split) + original.slice(split)
    .replace('  const commands: GameCommand[] = []', '  const queryPreview = previewProbe(view, getMovementPreview);\n  const commands: GameCommand[] = []')
    .replaceAll('= getMovementPreview(view,', '= queryPreview(view,');
  const sources = { baseline: original, candidate, instrumented: `import { previewProbe } from '${pathToFileURL(resolve(folder, 'preview-probe.ts')).href}';\n${instrumented}` };
  for (const [name, source] of Object.entries(sources)) {
    const rewritten = source.replace(/from '([^']+)'/g, (match, specifier: string) => {
      if (!specifier.startsWith('.') && !specifier.startsWith('@theandril/')) return match;
      const target = specifier.startsWith('@theandril/') ? resolve(repository, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
        : resolve(repository, 'packages/ai/src', `${specifier}.ts`);
      return `from '${pathToFileURL(target).href}'`;
    });
    await writeFile(resolve(temporary, `${name}.mts`), rewritten);
  }
  return { baseline: await import(pathToFileURL(resolve(temporary, 'baseline.mts')).href), candidate: await import(pathToFileURL(resolve(temporary, 'candidate.mts')).href), instrumented: await import(pathToFileURL(resolve(temporary, 'instrumented.mts')).href) };
}
