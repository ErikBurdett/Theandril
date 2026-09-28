/** Run once on unchanged rules33, before reinforcement/logistics rules change.
 * node --import tsx scripts/capture-reinforcement-logistics34.ts FULL_SOURCE_SHA
 * Exact JSON is retained in lossless gzip; existing evidence is never replaced.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { isDeepStrictEqual } from 'node:util';
import { CITY_STATES, CONTENT_HASH } from '@theandril/content';
import { applyRecordedCommand, createArchive, parseArchive, replayArchive, type CampaignArchive } from '@theandril/chronicle';
import { applyCommandForVersion, createGame, deserializeGame, getObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { theaterCampaign } from '../packages/test-fixtures/src/theater-fixture';

const sourceRevision = process.argv[2];
const sourcePaths = ['packages/sim', 'packages/chronicle', 'packages/content', 'packages/mapgen', 'packages/test-fixtures'];
const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
assert(sourceRevision && /^[a-f0-9]{40}$/.test(sourceRevision) && git('rev-parse', 'HEAD') === sourceRevision, 'Pass the exact current full source HEAD.');
git('diff', '--exit-code', sourceRevision!, '--', ...sourcePaths);
assert(Number(SAVE_VERSION) === 33 && CONTENT_HASH === '015468d1', 'Capture requires genuine unchanged rules33/content015468d1.');
const output = 'docs/development/2026-09-27-reinforcement-logistics/historical';
assert(!existsSync(output), 'Historical capture already exists; preserve its bytes.');
mkdirSync(output, { recursive: true });
const sha256 = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const sourceFingerprints = Object.fromEntries(git('ls-files', '--', ...sourcePaths).split('\n').map(path => [path, sha256(readFileSync(path))]));
const cases: Record<string, unknown> = {};
const continuationPairs: [string, string][] = [];
let acceptedCommands = 0;
function retain(name: string, suffix: string, raw: string) {
  const file = `${name}.${suffix}.json.gz`, bytes = gzipSync(Buffer.from(raw), { level: 9 });
  writeFileSync(`${output}/${file}`, bytes, { flag: 'wx' });
  return { file, bytes: Buffer.byteLength(raw), sha256: sha256(raw), gzipBytes: bytes.length, gzipSha256: sha256(bytes) };
}
function recorder(game: GameState, coverage: CampaignArchive['coverage']) {
  const archive = createArchive(game, { mode: 'player', coverage });
  const commandSeals: { sequence: number; beforeHash: string; afterHash: string; resultSha256: string }[] = [];
  let previousCapture: string | undefined;
  const issue = (command: GameCommand) => {
    // Independent deserialization before every accepted command verifies the
    // original implementation's exact continuation, including domain events.
    const fork = deserializeGame(serializeGame(game)), beforeHash = stateHash(game);
    const result = applyRecordedCommand(game, archive, command);
    assert(result.ok, `Historical command refused: ${JSON.stringify(command)}: ${result.error}`);
    const replayed = applyCommandForVersion(fork, command, 33);
    assert(JSON.stringify(replayed) === JSON.stringify(result), 'Independent command result/event mismatch.');
    assert(serializeGame(fork) === serializeGame(game), 'Independent command continuation mismatch.');
    commandSeals.push({ sequence: archive.records.length, beforeHash, afterHash: stateHash(game), resultSha256: sha256(JSON.stringify(result)) });
    acceptedCommands++;
  };
  const capture = (name: string, setup: string) => {
    const save = serializeGame(game), archiveText = JSON.stringify(archive);
    assert(serializeGame(deserializeGame(save)) === save, `Checkpoint ${name} fails strict byte-identical load.`);
    const parsed = parseArchive(JSON.parse(archiveText), game);
    assert(isDeepStrictEqual(parsed, JSON.parse(archiveText)), `Checkpoint ${name} archive parsing rewrote records.`);
    assert(serializeGame(replayArchive(parsed)) === save, `Checkpoint ${name} fails full byte-identical replay.`);
    if (previousCapture) continuationPairs.push([previousCapture, name]);
    previousCapture = name;
    cases[name] = { setup, coverage, hash: stateHash(game), turn: game.turn, records: archive.records.length,
      factions: game.factions.length, majorFactions: game.factions.filter(faction => !CITY_STATES.some(city => city.id === faction.id)).length,
      selectionGroups: structuredClone(game.selectionGroups), postings: structuredClone(game.postings),
      routes: structuredClone(game.routes), theaters: structuredClone(game.theaters), nextTheaterId: game.nextTheaterId,
      observedTheaters: getObservation(game, game.turnOwnerId).theaters,
      commandSeals: structuredClone(commandSeals), save: retain(name, 'save', save), archive: retain(name, 'archive', archiveText) };
    console.log(JSON.stringify({ name, hash: stateHash(game), records: archive.records.length, turn: game.turn, bytes: Buffer.byteLength(save) }));
  };
  return { issue, capture };
}

const generated = createGame({ seed: 20260927, generatorVersion: 4, size: 'tiny', factionCount: 2, cityStateCount: 0, pace: 'standard' });
const ordinary = recorder(generated, 'complete'), factionId = generated.turnOwnerId;
ordinary.capture('generated-origin', 'Untouched generated tiny two-major-realm campaign, seed20260927, generator4, no city states.');
ordinary.issue({ type: 'setSelectionGroup', factionId, kind: 'armies', name: 'First watch', memberIds: ['army.1', 'army.2'] });
ordinary.issue({ type: 'found', factionId, armyId: 'army.1', name: 'Remembered gate' });
const town = Object.values(generated.settlements).find(value => value.factionId === factionId)!;
ordinary.issue({ type: 'setSelectionGroup', factionId, kind: 'settlements', name: 'Remembered hearths', memberIds: [town.id] });
ordinary.issue({ type: 'setCharter', factionId, settlementId: town.id, focus: 'wealth', ceiling: 24 });
ordinary.issue({ type: 'setPosting', factionId, armyId: 'army.2', cell: generated.armies['army.2']!.cell, mode: 'hold' });
ordinary.issue({ type: 'setTheater', factionId, name: 'Home watch', settlementIds: [town.id], armyIds: ['army.2'], reserveCell: town.cell, guardsPerSettlement: 1, enabled: true });
ordinary.capture('generated-delegated', 'Ordinary saved groups, founding with consumed-caravan membership pruning, wealth charter, hold posting and enabled theater.');
for (let index = 0; index < 3; index++) ordinary.issue({ type: 'endTurn', factionId });
ordinary.capture('generated-continued', 'Exact three-end-turn rules33 continuation; the enabled theater preserves its member’s direct hold posting.');

const authored = theaterCampaign(8), travel = recorder(authored, 'from-save'), owner = authored.turnOwnerId;
const [active, paused, donor, posted, ...idle] = Object.keys(authored.armies).sort() as [string, string, string, string, ...string[]];
const west = Object.values(authored.settlements).find(value => value.cell === 500)!, east = Object.values(authored.settlements).find(value => value.cell === 510)!;
travel.capture('theaters-origin', 'Explicit authored tiny open-land gallery, seed20260927 generator4: all rewritten cells flat and resource deposits cleared, treasury100000, two founded hearths at500/510 and eight guard armies at495. Not an organically earned realm.');
travel.issue({ type: 'setSelectionGroup', factionId: owner, kind: 'armies', name: 'March watch', memberIds: [active, paused, donor, posted, ...idle] });
travel.issue({ type: 'setSelectionGroup', factionId: owner, kind: 'settlements', name: 'Twin hearths', memberIds: [west.id, east.id] });
travel.issue({ type: 'queueMovement', factionId: owner, armyId: active, target: 520 });
travel.issue({ type: 'queueMovement', factionId: owner, armyId: active, target: 530, append: true });
travel.issue({ type: 'queueMovement', factionId: owner, armyId: paused, target: west.cell });
travel.issue({ type: 'moveTo', factionId: owner, armyId: donor, target: authored.armies[paused]!.cell });
travel.issue({ type: 'mergeArmies', factionId: owner, sourceArmyId: donor, targetArmyId: paused });
assert(authored.routes[paused]?.status === 'paused', 'Actual merge must leave a composition-paused route.');
travel.issue({ type: 'setPosting', factionId: owner, armyId: posted, cell: 495, mode: 'hold' });
const enabled = { type: 'setTheater' as const, factionId: owner, name: 'West watch', settlementIds: [west.id], armyIds: [active, paused, posted, ...idle.slice(0, -1)], reserveCell: 495, guardsPerSettlement: 1, enabled: true };
const disabled = { ...enabled, name: 'East reserve', settlementIds: [east.id], armyIds: idle.slice(-1), enabled: false };
travel.issue(enabled); travel.issue(disabled);
travel.capture('theaters-ordered', 'Ordinary saved groups, active appended direct travel, actual merge-induced paused route, hold posting, enabled west theater and paused east theater; consumed donor pruned from saved membership.');
travel.issue({ type: 'endTurn', factionId: owner });
assert(authored.theaters[0]!.lastDispatches.some(row => row.accepted), 'Enabled watch must actually dispatch a guard.');
assert(authored.routes[paused]?.status === 'paused' && authored.routes[active]?.status === 'active', 'Direct active/paused overrides must persist.');
travel.capture('theaters-allocated', 'First automatic ordinary-command allocation under rules33, with ongoing routes and recorded dispatch outcomes; active/paused direct routes and held posting remain authoritative.');
travel.issue({ ...enabled, theaterId: 'theater.1', enabled: false });
travel.issue({ type: 'endTurn', factionId: owner });
assert(authored.theaters.every(theater => !theater.enabled), 'Both theaters must be paused.');
travel.capture('theaters-paused', 'Pausing the enabled theater stops future allocation while its already-issued travel continues; the other theater remains paused and existing overrides persist.');
travel.issue({ type: 'resumeMovement', factionId: owner, armyId: paused });
travel.issue({ ...enabled, theaterId: 'theater.1', armyIds: enabled.armyIds.filter(id => id !== active) });
travel.issue({ ...disabled, theaterId: 'theater.2', enabled: true });
travel.issue({ type: 'endTurn', factionId: owner });
travel.capture('theaters-continued', 'Exact continuation through explicit route resume, detaching the active direct traveler, re-enabling west/east watches and one end turn; detachment preserves the ordinary active route.');

const crowded = createGame({ seed: 20260925, generatorVersion: 8, size: 'standard', factionCount: 40, cityStateCount: 24, pace: 'standard' });
const sixtyFour = recorder(crowded, 'complete');
assert(crowded.factions.length === 64, 'Expected forty major realms plus twenty-four city states.');
sixtyFour.capture('sixty-four-origin', 'Untouched generated standard world seed20260925 generator8, forty major realms plus twenty-four city states: genuine64-seat rules33 save/replay boundary.');
sixtyFour.issue({ type: 'endTurn', factionId: crowded.turnOwnerId });
sixtyFour.capture('sixty-four-continued', 'Exact64-seat rules33 continuation through one ordinary endTurn; no AI campaign, maturity or frame-performance claim.');

git('diff', '--exit-code', sourceRevision!, '--', ...sourcePaths);
assert(git('rev-parse', 'HEAD') === sourceRevision, 'Source HEAD changed during capture.');
for (const [path, hash] of Object.entries(sourceFingerprints)) assert(sha256(readFileSync(path)) === hash, `Source changed during capture: ${path}`);
const manifest = { version: 33, contentHash: CONTENT_HASH, sourceRevision,
  captureCommand: `node --import tsx scripts/capture-reinforcement-logistics34.ts ${sourceRevision}`,
  scriptSha256: sha256(readFileSync('scripts/capture-reinforcement-logistics34.ts')), sourceFingerprints,
  provenance: 'Captured before reinforcement/logistics changes on the unchanged genuine rules33 implementation. Every checkpoint strictly loads and fully replays to its original byte-identical save. Every accepted command is independently repeated from a strict save reload under explicit rules33, comparing complete command results/events and full save bytes. Historical raw JSON and lossless gzip hashes are separately retained. Generated complete histories and authored from-save theater history are distinguished.',
  acceptedCommands, continuationPairs, cases };
const manifestText = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync(`${output}/manifest.json`, manifestText, { flag: 'wx' });
console.log(JSON.stringify({ output, sourceRevision, saveVersion: SAVE_VERSION, acceptedCommands, checkpoints: Object.keys(cases).length, continuationPairs, manifestSha256: sha256(manifestText) }));
