import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { applyCommandForVersion, deserializeGame, serializeGameForVersion, stateHashForVersion, type GameCommand } from '@theandril/sim';

// Capture original rule-16 semantics, never regenerate to bless changed results.
const source = 'docs/hermes-analysis/qa/pre-first-battle.json.gz';
const directory = 'packages/sim/src/fixtures';
await mkdir(directory, { recursive: true });
const bytes = await readFile(source);
const initialSave = gunzipSync(bytes).toString('utf8');
const game = deserializeGame(initialSave);
const commands = JSON.parse(await readFile('docs/hermes-analysis/qa/first-battle-commands.json', 'utf8')) as GameCommand[];
const initialHash = stateHashForVersion(game, 16);
const records = commands.map(command => ({ command, result: applyCommandForVersion(game, command, 16), hash: stateHashForVersion(game, 16) }));
const finalSave = serializeGameForVersion(game, 16);
let error: string | null = null;
try { deserializeGame(finalSave); } catch (cause) { error = (cause as Error).message; }
if (initialHash !== '602413fe' || records.at(-1)!.hash !== '58a2012d' || !error) throw new Error('Captured baseline does not match independent audit evidence');
await copyFile(source, `${directory}/v16-trained-battle.json.gz`);
const evidence = { source, baseline: 'b0a4cd86cdb30cd9e2d3a1f0c8a78da38f7987cd', sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, initialHash, records, finalSaveError: error };
await writeFile(`${directory}/v16-trained-battle-trace.json`, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence));
