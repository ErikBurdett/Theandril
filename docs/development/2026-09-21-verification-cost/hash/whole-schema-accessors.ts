import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { z } from '../../../../packages/sim/node_modules/zod/index.js';
import { deserializeGame } from '@theandril/sim';
import { loadCandidate } from './load-candidate';

const original = await loadCandidate('before'), compiled = await loadCandidate('whole-schema');
const pristine = deserializeGame(gunzipSync(readFileSync('docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/final.json.gz')).toString('utf8'));
assert.equal(compiled.serializeGame(pristine), original.serializeGame(pristine));
const results = [];
for (const target of ['land', 'report'] as const) {
  const run = (save: typeof original) => {
    const game = structuredClone(pristine);
    let reads = 0;
    if (target === 'land') {
      const known = Object.values(Object.values(game.land.known)[0]!)[0]!;
      Object.defineProperty(known, 'biome', { enumerable: true, get() { return ++reads === 1 ? 'BAD' : 2; } });
    } else {
      const report = game.battleReports[0]!, id = report.id;
      Object.defineProperty(report, 'id', { enumerable: true, get() { return ++reads === 1 ? 'BAD' : id; } });
    }
    try { save.serializeGame(game); return { accepted: true, getterReads: reads }; }
    catch (error) { assert.ok(error instanceof z.ZodError); return { accepted: false, getterReads: reads, issues: error.issues }; }
  };
  const before = run(original), after = run(compiled);
  assert.equal(before.accepted, false);
  assert.equal(before.getterReads, 1);
  assert.equal(after.accepted, true);
  assert.equal(after.getterReads, 2);
  results.push({ target, before, after });
}
console.log(JSON.stringify({ results, verdict: 'Whole-schema compilation changes save acceptance and getter reads through fallback. Rejected before timing.', productionChanged: false }));
