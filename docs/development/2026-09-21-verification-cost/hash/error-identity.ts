import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { z } from '../../../../packages/sim/node_modules/zod/index.js';
import { deserializeGame } from '@theandril/sim';
import { knownLandSchema } from '../../../../packages/sim/src/territory';
import { loadCandidate } from './load-candidate';

const before = await loadCandidate('before'), local = await loadCandidate('local-primitives'), known = await loadCandidate('known-primitives');
const game = deserializeGame(gunzipSync(readFileSync('docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/final.json.gz')).toString('utf8'));
const report = { ...game.battleReports[0]!, id: null };
function localIssue(save: typeof before) {
  const result = save.campaignBattleSchema.safeParse(report, { error: issue => issue.inst === save.campaignBattleSchema.shape.id ? 'report identifier' : 'other schema' });
  assert.equal(result.success, false);
  return result.error!.issues[0]!.message;
}
const originalGlobal = z.config().customError;
let knownResult: { before: string; after: string };
try {
  z.config({ customError: issue => issue.inst === knownLandSchema ? 'known-land object' : 'other schema' });
  Object.assign(Object.values(Object.values(game.land.known)[0]!)[0]!, { extra: true });
  const message = (save: typeof before) => {
    try { save.serializeGame(game); throw new Error('Expected invalid land'); }
    catch (error) { assert.ok(error instanceof z.ZodError); return error.issues[0]!.message; }
  };
  knownResult = { before: message(before), after: message(known) };
} finally { z.config({ customError: originalGlobal }); }
const localResult = { before: localIssue(before), after: localIssue(local) };
assert.notEqual(localResult.before, localResult.after);
assert.notEqual(knownResult.before, knownResult.after);
console.log(JSON.stringify({ localResult, knownResult, verdict: 'Both candidates alter messages for schema-identity-sensitive public error maps. Not equivalent to the required interface.', productionChanged: false }));
