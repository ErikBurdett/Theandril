import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync, gzipSync } from 'node:zlib';
import { strict as assert } from 'node:assert';
import { applyCommand, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
const root = '/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa';
const captured = JSON.parse(gunzipSync(await readFile(`${root}/captured-tiny-standard-20260905.json.gz`)).toString('utf8'));
const state = deserializeGame(captured.archive.initialSave), samples = [];
for (const record of captured.archive.records) {
  assert.equal(record.rulesVersion, 16);
  if (record.sequence === 5661) {
    const saved = serializeGame(state);
    deserializeGame(saved); // prove the minimal input still passes current validation
    await writeFile(`${root}/pre-first-battle.json.gz`, gzipSync(saved));
    await writeFile(`${root}/first-battle-commands.json`, JSON.stringify(captured.archive.records.filter(item => item.sequence >= 5661 && item.sequence <= 5662).map(item => item.command), null, 2) + '\n');
  }
  const result = applyCommand(state, record.command);
  assert.equal(result.ok, record.ok, `sequence ${record.sequence}`);
  if (record.sequence >= 5660) {
    let restoreError = null;
    try { deserializeGame(serializeGame(state)); } catch (error) { restoreError = String(error); }
    samples.push({ sequence: record.sequence, command: record.command, turn: state.turn, hash: stateHash(state), ok: result.ok, restoreError, army8Morale: state.armies['army.8']?.formations[0]?.morale, battleMorale: state.battle?.combat.defender.find(item => item.id === 'formation.8')?.morale });
  }
}
assert.equal(stateHash(state), captured.archive.finalHash);
await writeFile(`${root}/save-replay-diagnostic.json`, JSON.stringify({ finalHash: stateHash(state), samples }, null, 2) + '\n');
console.log(JSON.stringify({ finalHash: stateHash(state), samples }, null, 2));
