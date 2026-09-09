/** Verify retained audit traces without changing their files or executing new AI. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createGunzip, gunzipSync } from 'node:zlib';
import { applyCommandForVersion, deserializeGame, serializeGameForVersion, stateHashForVersion } from '@theandril/sim';
const source = 'docs/hermes-analysis/campaigns';
// Use a fresh output directory for each integrated-source checkpoint.
const out = process.env.THEANDRIL_LEGACY_EVIDENCE_DIR ?? 'docs/development/legacy-replays';
mkdirSync(out, { recursive: true });
const names = (JSON.parse(readFileSync(`${source}/aggregate.json`, 'utf8')) as { name: string }[]).map(row => row.name);
assert.equal(names.length, 8); assert.equal(new Set(names).size, names.length);
const results = [];
for (const name of names) {
  const root = `${source}/runs/${name}`;
  const summary = JSON.parse(readFileSync(`${root}/summary.json`, 'utf8'));
  const initial = gunzipSync(readFileSync(`${root}/initial.json.gz`)).toString();
  const final = gunzipSync(readFileSync(`${root}/final.json.gz`)).toString();
  assert.equal(JSON.parse(initial).version, 16);
  const state = deserializeGame(initial);
  const digest = createHash('sha256');
  let commands = 0, accepted = 0, failure: string | null = null;
  try {
    const stream = createReadStream(`${root}/commands.jsonl.gz`).pipe(createGunzip());
    for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
      digest.update(line + '\n');
      const record = JSON.parse(line);
      assert.deepEqual(applyCommandForVersion(state, record.command, 16), record.result, `Command ${record.sequence}`);
      commands++; if (record.result.ok) accepted++;
    }
    assert.equal(commands, summary.commandCount);
    assert.equal(digest.digest('hex'), summary.commandResultSha256);
    assert.equal(stateHashForVersion(state, 16), summary.finalHash);
    assert.equal(serializeGameForVersion(state, 16), final);
  } catch (error) { failure = String(error); }
  // Historical bad saves stay bad. Exact replay is a separate claim from loading.
  let historicalLoadError: string | null = null;
  try { deserializeGame(final); } catch (error) { historicalLoadError = String(error); }
  const result = { name, rulesVersion: 16, commands, accepted, expectedCommands: summary.commandCount, exactFinalBytes: failure === null, failure, historicalLoadError, finalHash: stateHashForVersion(state, 16) };
  results.push(result);
  writeFileSync(`${out}/${name}.json`, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
const totals = { campaigns: results.length, exactReplays: results.filter(row => row.exactFinalBytes).length, commands: results.reduce((sum, row) => sum + row.commands, 0), accepted: results.reduce((sum, row) => sum + row.accepted, 0), historicalFinalLoadFailures: results.filter(row => row.historicalLoadError).length, scope: 'Explicit rule-16 recorded commands against the modified engine; no new AI invoked and no audit artifact overwritten. Does not certify current-rule campaign trajectories.' };
writeFileSync(`${out}/summary.json`, JSON.stringify(totals, null, 2) + '\n');
console.log(JSON.stringify(totals));
if (totals.exactReplays !== names.length) process.exitCode = 1;
