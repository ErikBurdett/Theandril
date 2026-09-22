import assert from 'node:assert/strict';
import { z } from '../../../../packages/sim/node_modules/zod/index.js';
import { knownLandSchema } from '../../../../packages/sim/src/territory';
import { candidateKnownLand } from './primitive-candidate';

const base = z.object({ cell: knownLandSchema });
const candidate = z.object({ cell: candidateKnownLand });
const bad = { cell: { biome: 2, settlementId: 'BAD', factionId: null, improvementId: null } };
function result(schema: typeof base | typeof candidate, data: unknown, custom = false) {
  const parsed = custom
    ? schema.safeParse(data, { error: issue => `Path:${issue.path?.join('.') ?? ''};type:${issue.code}` })
    : schema.safeParse(data);
  return parsed.success ? parsed.data : parsed.error.issues;
}
let defaultCases = 0;
for (const id of [null, 'faction.a', 'settlement.1', '', 'BAD', 'a'.repeat(101), undefined, 7, {}, []]) {
  const data = { cell: { biome: 2, settlementId: id, factionId: null, improvementId: null } };
  assert.deepEqual(result(candidate, data), result(base, data));
  defaultCases++;
}
const originalGlobal = z.config().customError;
let globalResult: { before: unknown; after: unknown };
try {
  z.config({ customError: issue => `Path:${issue.path?.join('.') ?? ''};type:${issue.code}` });
  globalResult = { before: result(base, bad), after: result(candidate, bad) };
} finally { z.config({ customError: originalGlobal }); }
console.log(JSON.stringify({ defaultCases, globalResult, perParseResult: { before: result(base, bad, true), after: result(candidate, bad, true) },
  productionChanged: false }));
