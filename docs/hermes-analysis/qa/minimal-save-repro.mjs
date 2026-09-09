// Minimal red regression loop from a real AI campaign checkpoint. No state mutation.
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { strict as assert } from 'node:assert';
import { applyCommand, deserializeGame, serializeGame, stateHash } from '@theandril/sim';
const root = '/home/telephoneheater/Work/Theandril/docs/hermes-analysis/qa';
const game = deserializeGame(gunzipSync(await readFile(`${root}/pre-first-battle.json.gz`)).toString('utf8'));
const commands = JSON.parse(await readFile(`${root}/first-battle-commands.json`, 'utf8'));
console.log('VALID_INPUT', stateHash(game), 'turn', game.turn, 'morale', game.armies['army.8'].formations[0].morale);
for (const command of commands) { const result = applyCommand(game, command); assert(result.ok, result.error); console.log('ACCEPTED', JSON.stringify(command), stateHash(game)); }
console.log('POST_BATTLE_MORALE', game.armies['army.8'].formations[0].morale);
const restored = deserializeGame(serializeGame(game)); // currently throws: required red assertion, not swallowed
assert.equal(stateHash(restored), stateHash(game));
console.log('ROUNDTRIP_PASSED');
