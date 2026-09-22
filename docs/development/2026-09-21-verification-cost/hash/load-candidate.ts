import { existsSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type * as Save from '../../../../packages/sim/src/save';

/** Evidence only. Original traversal with Zod's own compiled primitive parsers. */
export async function loadCandidate(mode: 'before' | 'local-primitives' | 'known-primitives' | 'whole-schema'): Promise<typeof Save> {
  const evidence = dirname(fileURLToPath(import.meta.url)), repository = resolve(evidence, '../../../..');
  const require = createRequire(resolve(repository, 'packages/sim/src/save.ts'));
  const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-primitive-compile-'));
  let source = await readFile(resolve(evidence, 'save-before.ts.txt'), 'utf8');
  if (mode === 'local-primitives') {
    source = source.replace(/const (integer|id|cell) = (z\.[^;]+);/g, 'const $1 = z.compile($2);');
  }
  if (mode === 'known-primitives') {
    source = source.replace('emptyLandState, landStateSchema,', 'emptyLandState, knownLandSchema, landStateSchema,');
    source = source.replace('function canonicalLand(state: GameState)', `const primitiveKnownLand = knownLandSchema.extend({
  biome: z.compile(knownLandSchema.shape.biome),
  settlementId: z.compile(knownLandSchema.shape.settlementId.unwrap()).nullable(),
  factionId: z.compile(knownLandSchema.shape.factionId.unwrap()).nullable(),
  improvementId: z.compile(knownLandSchema.shape.improvementId.unwrap()).nullable(),
});
const primitiveLand = landStateSchema.extend({ known: z.record(landStateSchema.shape.known.keyType, z.record(landStateSchema.shape.known.valueType.keyType, primitiveKnownLand)) });
function canonicalLand(state: GameState)`);
    source = source.replace('const land = landStateSchema.parse(source);', 'const land = primitiveLand.parse(source);');
  }
  if (mode === 'whole-schema') {
    source = source.replace('function canonicalLand(state: GameState)', `const compiledLand = z.compile(landStateSchema);
const compiledBattle = z.compile(campaignBattleSchema);
function canonicalLand(state: GameState)`);
    source = source.replace('const land = landStateSchema.parse(source);', 'const land = compiledLand.parse(source);');
    source = source.replace('battleReports: state.battleReports.map(battle => campaignBattleSchema.parse(battle)),', 'battleReports: state.battleReports.map(battle => compiledBattle.parse(battle)),');
  }
  source = source.replace(/from '([^']+)'/g, (match, specifier: string) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('@theandril/')) return match.replace(`'${specifier}'`, `'${pathToFileURL(require.resolve(specifier)).href}'`);
    let target = specifier.startsWith('@theandril/') ? resolve(repository, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
      : resolve(repository, 'packages/sim/src', `${specifier}.ts`);
    if (!existsSync(target)) target = resolve(repository, 'packages/sim/src', specifier, 'index.ts');
    return `from '${pathToFileURL(target).href}'`;
  });
  await writeFile(resolve(temporary, 'save.mts'), source);
  return await import(pathToFileURL(resolve(temporary, 'save.mts')).href) as typeof Save;
}
