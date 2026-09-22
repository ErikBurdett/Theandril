import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serializeGame } from '../../../../packages/sim/src/index';
import type { queueMovement } from '../../../../packages/sim/src/movement';
import { withRules } from '../../../../packages/sim/src/rules';
import { canonicalCorpus } from './canonical-corpus';

const evidence = dirname(fileURLToPath(import.meta.url)), root = resolve(evidence, '../../../..');
const require = createRequire(resolve(root, 'packages/sim/src/movement.ts'));
const original = await readFile(resolve(evidence, 'movement-before.ts.txt'), 'utf8');
const rewritten = original.replace(/from '([^']+)'/g, (_match, specifier: string) => {
  const target = specifier.startsWith('@theandril/') ? resolve(root, `packages/${specifier.slice('@theandril/'.length)}/src/index.ts`)
    : specifier.startsWith('.') ? resolve(root, 'packages/sim/src', `${specifier}.ts`) : require.resolve(specifier);
  return `from '${pathToFileURL(target).href}'`;
});
const temporary = await mkdtemp(resolve(tmpdir(), 'theandril-movement-cost-'));
await writeFile(resolve(temporary, 'before.mts'), rewritten);
const before = await import(pathToFileURL(resolve(temporary, 'before.mts')).href) as { queueMovement: typeof queueMovement };
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const entries = canonicalCorpus().map(item => {
  const result = withRules(item.state, item.version, () => before.queueMovement(item.state, item.factionId, item.armyId, item.target));
  return { name: item.name, result, route: item.state.routes[item.armyId] ?? null, stateSha256: digest(serializeGame(item.state)) };
});
console.log(JSON.stringify({ sourceSha256: digest(original), node: process.version, scope: 'Original complete queue result, route and serialized state digest. Historical execution contexts are selected explicitly; serialization uses current schema for the authored state.', entries }, null, 2));
