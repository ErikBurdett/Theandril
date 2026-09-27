/** Run once on the unchanged rules32 implementation, before defense theaters.
 * node --import tsx scripts/capture-defense-theaters33.ts FULL_SOURCE_SHA
 * Existing captures are never overwritten. Saves/archives retain exact JSON
 * bytes inside lossless gzip; manifest seals cover both raw and stored bytes.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { CONTENT_HASH } from '@theandril/content';
import { applyRecordedCommand, createArchive, replayArchive, type CampaignArchive } from '@theandril/chronicle';
import { createGame, deserializeGame, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { refreshAuthoredSight } from '../packages/test-fixtures/src/authored-land';

const sourceRevision = process.argv[2];
if (!sourceRevision || !/^[a-f0-9]{40}$/.test(sourceRevision)
  || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== sourceRevision) throw new Error('Pass the exact current full source HEAD.');
execFileSync('git', ['diff', '--exit-code', sourceRevision, '--', 'packages/sim', 'packages/chronicle', 'packages/content']);
if (Number(SAVE_VERSION) !== 32 || CONTENT_HASH !== '015468d1') throw new Error('Capture requires genuine unchanged rules32/content015468d1.');
const output = 'docs/development/2026-09-27-defense-theaters/historical';
if (existsSync(output)) throw new Error('Historical capture already exists; preserve its bytes.');
mkdirSync(output, { recursive: true });
const sha256 = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
const cases: Record<string, unknown> = {};
function retain(name: string, suffix: string, text: string) {
  const file = `${name}.${suffix}.json.gz`, bytes = gzipSync(Buffer.from(text), { level: 9 });
  writeFileSync(`${output}/${file}`, bytes, { flag: 'wx' });
  return { file, bytes: Buffer.byteLength(text), sha256: sha256(text), gzipBytes: bytes.length, gzipSha256: sha256(bytes) };
}
function recorder(game: GameState, coverage: CampaignArchive['coverage']) {
  const archive = createArchive(game, { mode: 'player', coverage });
  const issue = (command: GameCommand) => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) throw new Error(`Historical capture command refused: ${JSON.stringify(command)}: ${result.error}`);
  };
  const capture = (name: string, setup: string) => {
    const save = serializeGame(game), archiveText = JSON.stringify(archive);
    if (serializeGame(deserializeGame(save)) !== save || serializeGame(replayArchive(archive)) !== save) throw new Error(`Historical checkpoint ${name} does not strictly load/replay byte-identically.`);
    cases[name] = { setup, hash: stateHash(game), turn: game.turn, records: archive.records.length,
      factions: game.factions.length, selectionGroups: structuredClone(game.selectionGroups),
      postings: structuredClone(game.postings), routes: structuredClone(game.routes),
      save: retain(name, 'save', save), archive: retain(name, 'archive', archiveText) };
    console.log(JSON.stringify({ name, hash: stateHash(game), records: archive.records.length, bytes: Buffer.byteLength(save) }));
  };
  return { issue, capture };
}

const generated = createGame({ seed: 20260927, generatorVersion: 4, size: 'tiny', factionCount: 2, cityStateCount: 0, pace: 'standard' });
const ordinary = recorder(generated, 'complete'), factionId = generated.turnOwnerId;
ordinary.capture('generated-origin', 'Generated tiny two-realm standard campaign, seed20260927, generator4, no city states; untouched start.');
ordinary.issue({ type: 'setSelectionGroup', factionId, kind: 'armies', name: 'First company', memberIds: ['army.1', 'army.2'] });
ordinary.issue({ type: 'found', factionId, armyId: 'army.1', name: 'Remembered gate' });
const town = Object.values(generated.settlements).find(value => value.factionId === factionId)!;
ordinary.issue({ type: 'setSelectionGroup', factionId, kind: 'settlements', name: 'Old hearths', memberIds: [town.id] });
ordinary.issue({ type: 'setCharter', factionId, settlementId: town.id, focus: 'wealth', ceiling: 24 });
ordinary.issue({ type: 'setPosting', factionId, armyId: 'army.2', cell: generated.armies['army.2']!.cell, mode: 'hold' });
ordinary.capture('generated-delegated', 'Ordinary group creation, founding prunes its consumed caravan, hearth group, wealth charter and held scout posting.');
for (let index = 0; index < 3; index++) ordinary.issue({ type: 'endTurn', factionId });
ordinary.capture('generated-continued', 'Exact continuation of generated-delegated through three ordinary endTurn commands under rules32.');

const gallery = createGame({ seed: 20260927, generatorVersion: 4, size: 'tiny', factionCount: 2, cityStateCount: 0, pace: 'standard' });
gallery.world.terrain.fill(1); gallery.world.biome.fill(1); gallery.world.waterDepth.fill(0); gallery.world.fertility.fill(60);
gallery.resources.deposits = {}; // Complete authored geography: no generated deposits remain on rewritten cells.
gallery.armies['army.1']!.cell = 500; gallery.armies['army.2']!.cell = 500;
gallery.armies['army.3']!.cell = 900; gallery.armies['army.4']!.cell = 900;
for (const faction of gallery.factions) gallery.explored[faction.id] = new Set(gallery.world.terrain.keys());
refreshAuthoredSight(gallery);
const routed = deserializeGame(serializeGame(gallery)), travel = recorder(routed, 'from-save'), owner = routed.turnOwnerId;
travel.issue({ type: 'setSelectionGroup', factionId: owner, kind: 'armies', name: 'Road watch', memberIds: ['army.1', 'army.2'] });
travel.issue({ type: 'setPosting', factionId: owner, armyId: 'army.2', cell: 500, mode: 'hold' });
travel.issue({ type: 'queueMovement', factionId: owner, armyId: 'army.2', target: 514 });
travel.issue({ type: 'queueMovement', factionId: owner, armyId: 'army.2', target: 520, append: true });
if (!routed.routes['army.2']) throw new Error('Capture needs a live route.');
travel.capture('travel-ordered', 'Authored flat resource-free tiny gallery; generated cultures/economy, relocated starts, revealed map. Ordinary saved group, hold posting, direct queued route and appended waypoint.');
travel.issue({ type: 'cancelMovement', factionId: owner, armyId: 'army.2' });
travel.issue({ type: 'endTurn', factionId: owner });
travel.issue({ type: 'queueMovement', factionId: owner, armyId: 'army.2', target: 508 });
travel.issue({ type: 'endTurn', factionId: owner });
travel.capture('travel-continued', 'Exact continuation of travel-ordered: ordinary cancel, end turn, replacement direct route and end turn; saved membership and independent hold posting persist.');

const crowded = createGame({ seed: 20260925, generatorVersion: 8, size: 'standard', factionCount: 40, cityStateCount: 24, pace: 'standard' });
const sixtyFour = recorder(crowded, 'complete');
sixtyFour.capture('sixty-four-origin', 'Generated standard world seed20260925, generator8, forty major realms and twenty-four city states; actual 64-seat research/save boundary.');
sixtyFour.issue({ type: 'endTurn', factionId: crowded.turnOwnerId });
sixtyFour.capture('sixty-four-continued', 'Exact generated 64-seat continuation through one ordinary endTurn; no AI campaign or maturity claim.');

const manifest = { version: 32, contentHash: CONTENT_HASH, sourceRevision,
  captureCommand: `node --import tsx scripts/capture-defense-theaters33.ts ${sourceRevision}`,
  provenance: 'Independently captured before canonical rules33 changes. Every checkpoint was strictly loaded and fully replayed byte-identically on the genuine rules32 implementation. Gzip is lossless storage; raw save/archive hashes and compressed-file hashes are retained. Generated complete histories and explicitly authored from-save travel history are distinguished.', cases };
writeFileSync(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, sourceRevision, saveVersion: SAVE_VERSION, cases: Object.keys(cases), manifestSha256: sha256(JSON.stringify(manifest, null, 2) + '\n') }));
