import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as Save from '../../../../packages/sim/src/save';

/** Experimental module shares unchanged dependencies, without replacing source. */
export async function loadHashCandidate(): Promise<typeof Save> {
  const evidence = dirname(fileURLToPath(import.meta.url)), repository = resolve(evidence, '../../../..');
  const require = createRequire(resolve(repository, 'packages/sim/src/save.ts'));
  const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-hash-candidate-'));
  let original = await readFile(resolve(evidence, 'save-before-projection.ts.txt'), 'utf8');
  original = original.replace(/from '([^']+)'/g, (match, specifier: string) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@theandril/')) return match.replace(`'${specifier}'`, `'${pathToFileURL(require.resolve(specifier)).href}'`);
    let target = specifier.startsWith('@theandril/') ? resolve(repository, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
      : resolve(repository, 'packages/sim/src', `${specifier}.ts`);
    if (!existsSync(target)) target = resolve(repository, 'packages/sim/src', specifier, 'index.ts');
    return `from '${pathToFileURL(target).href}'`;
  });
  const start = original.indexOf('function canonicalLand(state: GameState) {');
  const end = original.indexOf('\nfunction canonicalRoads(', start);
  assert.ok(start > 0 && end > start);
  const land = original.slice(start, end).replace('function canonicalLand(state: GameState) {', 'const projectLand = validatedProjection((source: GameState["land"]) => {')
    .replace('  const source = state.land;\n', '').replace(/\}\s*$/, '});\nfunction canonicalLand(state: GameState, reuse: boolean) { return projectLand(state.land, reuse); }\n');
  original = original.slice(0, start) + land + original.slice(end);
  original = `import { unchangedPrototypes, validatedProjection, stringifyPayload } from '${pathToFileURL(resolve(evidence, 'encoded-projection-candidate.ts')).href}';\n` + original;
  original = original.replace('function canonicalPayload(state: GameState) {', 'const projectReport = validatedProjection((battle: CampaignBattle) => campaignBattleSchema.parse(battle));\nfunction canonicalPayload(state: GameState) {\n  const reuse = unchangedPrototypes();');
  original = original.replace('battleReports: state.battleReports.map(battle => campaignBattleSchema.parse(battle)),', 'battleReports: state.battleReports.map(battle => projectReport(battle, reuse)),');
  original = original.replace('land: canonicalLand(state),', 'land: canonicalLand(state, reuse),');
  original = original.replace('const stateText = JSON.stringify(payload);', 'const stateText = stringifyPayload(payload);');
  await writeFile(resolve(temporary, 'save.mts'), original);
  return await import(pathToFileURL(resolve(temporary, 'save.mts')).href) as typeof Save;
}
