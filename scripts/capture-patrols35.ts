/** Capture genuine rules34 before patrol implementation; never overwrite evidence. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { CONTENT_HASH } from '@theandril/content';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';
import { applyCommandForVersion, createGame, deserializeGame, serializeGame, SAVE_VERSION, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { theaterCampaign } from '../packages/test-fixtures/src/theater-fixture';

const root = 'docs/development/2026-10-24-patrols/historical';
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const sourceRevision = git('rev-parse', 'HEAD');
const paths = ['packages/sim', 'packages/chronicle', 'packages/content', 'packages/mapgen', 'packages/test-fixtures'];
git('diff', '--exit-code', sourceRevision, '--', ...paths);
assert(Number(SAVE_VERSION) === 34 && CONTENT_HASH === '015468d1', 'Requires unchanged rules34.');
assert(!existsSync(root), 'Historical evidence already exists.');
mkdirSync(root, { recursive: true });
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const fingerprints = Object.fromEntries(git('ls-files', '--', ...paths).split('\n').map(path => [path, hash(readFileSync(path))]));
const cases: Record<string, unknown> = {};
function retain(name: string, suffix: string, raw: string) {
  const file = `${name}.${suffix}.json.gz`, bytes = gzipSync(raw, { level: 9 });
  writeFileSync(`${root}/${file}`, bytes, { flag: 'wx' });
  return { file, sha256: hash(raw), gzipSha256: hash(bytes), bytes: Buffer.byteLength(raw) };
}
function recorder(game: GameState, coverage: 'complete' | 'from-save') {
  const archive = createArchive(game, { mode: 'player', coverage });
  const seals: { command: GameCommand; before: string; after: string; result: string }[] = [];
  const capture = (name: string) => {
    const save = serializeGame(game);
    assert(serializeGame(deserializeGame(save)) === save, 'Load must preserve bytes.');
    assert(serializeGame(replayArchive(archive)) === save, 'Replay must preserve bytes.');
    cases[name] = { save: retain(name, 'save', save), archive: retain(name, 'archive', JSON.stringify(archive)), hash: stateHash(game), seals: [...seals] };
  };
  const issue = (command: GameCommand) => {
    const mirror = deserializeGame(serializeGame(game)), before = stateHash(game);
    const result = applyRecordedCommand(game, archive, command);
    assert(result.ok, `Refused: ${JSON.stringify(command)} ${result.error}`);
    assert(JSON.stringify(applyCommandForVersion(mirror, command, 34)) === JSON.stringify(result), 'Result/event divergence.');
    assert(serializeGame(mirror) === serializeGame(game), 'Command boundary divergence.');
    seals.push({ command, before, after: stateHash(game), result: hash(JSON.stringify(result)) });
  };
  return { capture, issue };
}
const generated = createGame({ seed: 20261024, size: 'tiny', factionCount: 4 });
const start = recorder(generated, 'complete');
start.capture('generated-origin');
start.issue({ type: 'found', factionId: generated.turnOwnerId, armyId: 'army.1', name: 'Patrol origin' });
for (let i = 0; i < 3; i++) start.issue({ type: 'endTurn', factionId: generated.turnOwnerId });
start.capture('generated-continued');
const watch = theaterCampaign(6), owner = watch.turnOwnerId, armies = Object.values(watch.armies).sort((a, b) => a.id.localeCompare(b.id));
const towns = Object.values(watch.settlements).sort((a, b) => a.id.localeCompare(b.id));
const orders = recorder(watch, 'from-save');
orders.capture('orders-origin');
orders.issue({ type: 'setPosting', factionId: owner, armyId: armies[0]!.id, cell: towns[0]!.cell, mode: 'hold' });
orders.issue({ type: 'setTheater', factionId: owner, name: 'Historical watch', settlementIds: towns.map(town => town.id), armyIds: armies.slice(1).map(army => army.id), reserveCell: towns[0]!.cell, guardsPerSettlement: 1, reinforcementLimit: 1, enabled: true });
orders.capture('orders-configured');
orders.issue({ type: 'endTurn', factionId: owner });
orders.capture('orders-allocated');
orders.issue({ type: 'endTurn', factionId: owner });
orders.issue({ type: 'endTurn', factionId: owner });
orders.capture('orders-continued');
git('diff', '--exit-code', sourceRevision, '--', ...paths);
for (const [path, fingerprint] of Object.entries(fingerprints)) assert(hash(readFileSync(path)) === fingerprint, `Source changed: ${path}`);
writeFileSync(`${root}/manifest.json`, JSON.stringify({ version: 34, sourceRevision, contentHash: CONTENT_HASH, fingerprints, cases,
  capture: 'Genuine unchanged rules34; original raw bytes and lossless gzip; generated complete and authored from-save histories. Every accepted command independently repeated after reload, matching complete result/events and save bytes.' }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ sourceRevision, cases: Object.keys(cases), output: root }));
