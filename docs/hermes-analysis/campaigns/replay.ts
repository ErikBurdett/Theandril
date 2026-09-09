/** Replay archived ordinary commands, and independently test save continuation. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { createGunzip, gunzipSync } from 'node:zlib';
import { applyCommand, deserializeGame, serializeGame, stateHash, type GameState } from '@theandril/sim';
const root = resolve(process.argv[2] ?? 'docs/hermes-analysis/campaigns/runs/C-tiny4-seed99');
const summary = JSON.parse(readFileSync(resolve(root, 'summary.json'), 'utf8'));
const initial = gunzipSync(readFileSync(resolve(root, 'initial.json.gz'))).toString();
const final = gunzipSync(readFileSync(resolve(root, 'final.json.gz'))).toString();
const replay = deserializeGame(initial), errors: unknown[] = [];
const midpoint = summary.verification.midpoint;
let mirror: GameState | undefined;
if (midpoint && existsSync(resolve(root, 'midpoint.json.gz'))) {
  try { mirror = deserializeGame(gunzipSync(readFileSync(resolve(root, 'midpoint.json.gz'))).toString()); assert.equal(stateHash(mirror), midpoint.hash); }
  catch (error) { errors.push({ stage: 'midpoint-load', error: String(error) }); }
}
try { const restored = deserializeGame(final); assert.equal(stateHash(restored), summary.finalHash); assert.equal(serializeGame(restored), final); }
catch (error) { errors.push({ stage: 'final-load', error: String(error) }); }
const plain = resolve(root, 'commands.jsonl');
const stream = existsSync(plain) ? createReadStream(plain) : createReadStream(plain + '.gz').pipe(createGunzip());
let count = 0, mirrorCount = 0, refusals = 0;
const digest = createHash('sha256');
for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
  digest.update(line + '\n'); const r = JSON.parse(line);
  const before = r.result.ok ? null : stateHash(replay);
  assert.deepEqual(applyCommand(replay, r.command), r.result, `Command ${r.sequence} diverged`);
  if (before) { assert.equal(stateHash(replay), before); refusals++; }
  if (mirror && r.sequence > midpoint.commandSequence) { assert.deepEqual(applyCommand(mirror, r.command), r.result); mirrorCount++; }
  count++;
}
assert.equal(count, summary.commandCount); assert.equal(digest.digest('hex'), summary.commandResultSha256);
assert.equal(stateHash(replay), summary.finalHash); assert.equal(serializeGame(replay), final);
if (mirror) { assert.equal(stateHash(mirror), summary.finalHash); assert.equal(serializeGame(mirror), final); }
console.log(JSON.stringify({ root, replayedCommands: count, rejectedCommandsProvenImmutable: refusals, replayHash: stateHash(replay), exactFinalBytes: true, midpointMirroredCommands: mirrorCount, midpointFinalExact: Boolean(mirror), errors }, null, 2));
if (errors.length) process.exitCode = 1;
