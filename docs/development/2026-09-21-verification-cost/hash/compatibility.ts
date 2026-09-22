import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { z } from '../../../../packages/sim/node_modules/zod/index.js';
import { deserializeGame, type GameState } from '@theandril/sim';
import { loadCandidate } from './load-candidate';

const captured = gunzipSync(readFileSync('docs/hermes-analysis/campaigns/runs/D-tiny4-seed99-epic/final.json.gz')).toString('utf8');
const before = await loadCandidate('before');
const candidates = await Promise.all((['local-primitives', 'known-primitives'] as const).map(async mode => ({ mode, save: await loadCandidate(mode) })));
const pristine = deserializeGame(captured);
const fresh = () => structuredClone(pristine);
const result = (operation: () => unknown) => {
  try { return { ok: true, value: operation() }; }
  catch (error) { return error instanceof z.ZodError ? { ok: false, issues: error.issues } : { ok: false, message: String(error) }; }
};
const fields = ['id', 'attackerCell', 'turn'] as const;
const invalid = [null, undefined, true, '', 'BAD', 'a'.repeat(101), Number.NaN, Infinity, -1, 0.5, {}, []];
let cases = 0;
for (const { mode, save } of candidates) {
  const baseline = fresh();
  assert.equal(save.serializeGame(baseline), before.serializeGame(baseline));
  for (const field of fields) for (const value of invalid) {
    const game = fresh();
    (game.battleReports[0] as unknown as Record<string, unknown>)[field] = value;
    assert.deepEqual(result(() => save.stateHash(game)), result(() => before.stateHash(game)), `${mode}:${field}:${String(value)}`);
    cases++;
  }
  for (const field of ['biome', 'settlementId', 'factionId', 'improvementId']) for (const value of invalid) {
    const game = fresh();
    const entry = Object.values(Object.values(game.land.known)[0]!)[0]!;
    (entry as unknown as Record<string, unknown>)[field] = value;
    assert.deepEqual(result(() => save.stateHash(game)), result(() => before.stateHash(game)), `${mode}:land:${field}:${String(value)}`);
    cases++;
  }
  // A changing getter must be read equally often and in the same order on both
  // success and failure. No object schema is compiled by these candidates.
  for (const bad of [false, true]) {
    const run = (implementation: typeof before) => {
      const game = fresh(), calls: string[] = [], report = game.battleReports[0]!;
      let reads = 0;
      Object.defineProperty(report, 'id', { enumerable: true, get() { calls.push(`id:${++reads}`); return bad ? 'BAD' : `battle.${100 + reads}`; } });
      Object.defineProperty(report, 'attackerCell', { enumerable: true, get() { calls.push('attackerCell'); return bad ? -1 : 0; } });
      const value = result(() => implementation.serializeGame(game));
      return { value, calls };
    };
    assert.deepEqual(run(save), run(before), `${mode}:accessors:${bad}`);
    cases++;
  }
  for (const mutate of [
    (game: GameState) => { (game.land as unknown as Record<string, unknown>).extra = 1; },
    (game: GameState) => { const known = Object.values(Object.values(game.land.known)[0]!)[0]!; (known as unknown as Record<string, unknown>).extra = 1; },
    (game: GameState) => { const key = Object.keys(game.land.known)[0]!; game.land.known[key] = Object.create({ 1: { biome: 1, factionId: null, settlementId: null, improvementId: null } }); },
    (game: GameState) => { Object.setPrototypeOf(game.land.known, null); },
  ]) {
    const game = fresh(); mutate(game);
    assert.deepEqual(result(() => save.stateHash(game)), result(() => before.stateHash(game)), `${mode}:land-shape`);
    cases++;
  }
  const oldError = z.config().customError;
  try {
    z.config({ customError: issue => `${issue.path?.join('.')}:${issue.code}:${issue.inst?.constructor.name}` });
    const game = fresh(); game.battleReports[0]!.id = 'BAD';
    Object.values(Object.values(game.land.known)[0]!)[0]!.settlementId = 'BAD';
    assert.deepEqual(result(() => save.stateHash(game)), result(() => before.stateHash(game)), `${mode}:global-error`);
    const report = game.battleReports[0]!;
    const options: NonNullable<Parameters<typeof before.campaignBattleSchema.parse>[1]> = { reportInput: true, error: issue => `${issue.path?.join('.')}:${issue.code}:${issue.inst?.constructor.name}` };
    assert.deepEqual(result(() => save.campaignBattleSchema.parse(report, options)), result(() => before.campaignBattleSchema.parse(report, options)), `${mode}:parse-error`);
    cases += 2;
  } finally { z.config({ customError: oldError }); }
}
console.log(JSON.stringify({ cases, candidates: candidates.map(item => item.mode), productionChanged: false }));
