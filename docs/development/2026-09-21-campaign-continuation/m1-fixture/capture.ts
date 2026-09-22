import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyRecordedCommand, createArchive, parseArchive, replayArchive } from '@theandril/chronicle';
import { createGame, deserializeGame, serializeGame, SAVE_VERSION, stateHashForVersion, type GameCommand } from '@theandril/sim';
import { refreshAuthoredSight } from '../../../../packages/test-fixtures/src/authored-land';

// A one-time historical producer. Never overwrite these bytes after rules advance.
assert.equal(SAVE_VERSION, 17, 'Capture must run on the genuine pre-client version 17 implementation.');
const output = (name: string): URL => new URL(name, import.meta.url);
for (const name of ['initial-save.json', 'pending-save.json', 'archive.json', 'continuation.json', 'metadata.json']) {
  assert.equal(existsSync(output(name)), false, `Refusing to overwrite historical ${name}.`);
}
const options = { seed: 20260905, size: 'tiny', factionCount: 3, pace: 'short', rulesVersion: 17 } as const;
let game = createGame(options);
const [a, b, c] = game.factions;
assert.ok(a && b && c);
const founderA = Object.values(game.armies).find(army => army.factionId === a.id && army.formations.some(formation => formation.unitId === 'unit.colonist'));
assert.ok(founderA);
const occupied = new Set(Object.values(game.armies).map(army => army.cell));
const contactCells = neighbors(founderA.cell, game.world.width, game.world.height).filter(cell => isPassable(game.world.terrain[cell]!) && !occupied.has(cell));
assert.ok(contactCells.length >= 2, 'Authored contact requires two free adjacent land cells.');
const authoredMoves = [b, c].map((faction, index) => {
  const scout = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.scout'));
  assert.ok(scout);
  const from = scout.cell;
  scout.cell = contactCells[index]!;
  return { armyId: scout.id, factionId: scout.factionId, from, to: scout.cell };
});
// Authored position only, following the existing borderBattleCampaign pattern.
// No terrain, resources, treasuries, diplomacy or founding result is inserted.
refreshAuthoredSight(game);
game = deserializeGame(serializeGame(game));
const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
const issue = (command: GameCommand): void => {
  const result = applyRecordedCommand(game, archive, command);
  assert.equal(result.ok, true, `${command.type}: ${result.error ?? ''}`);
};
for (const [index, faction] of game.factions.entries()) {
  const founder = Object.values(game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'));
  assert.ok(founder);
  issue({ type: 'found', factionId: faction.id, armyId: founder.id, name: ['Ashen witness', 'Reed witness', 'Third witness'][index]! });
}
issue({ type: 'declareWar', factionId: a.id, targetFactionId: b.id });
issue({ type: 'proposePeace', factionId: a.id, targetFactionId: b.id, terms: { offerCoin: 7, requestCoin: 0, truceTurns: 10 } });
const accepted = game.diplomacy.offers[0]!;
const beforePayment = game.factions.map(faction => faction.treasury);
issue({ type: 'respondPeace', factionId: b.id, offerId: accepted.id, accept: true });
assert.deepEqual(game.factions.map(faction => faction.treasury), [beforePayment[0]! - 7, beforePayment[1]! + 7, beforePayment[2]!]);
issue({ type: 'declareWar', factionId: a.id, targetFactionId: c.id });
issue({ type: 'proposePeace', factionId: c.id, targetFactionId: a.id, terms: { offerCoin: 0, requestCoin: 11, truceTurns: 5 } });
issue({ type: 'endTurn', factionId: game.turnOwnerId });
assert.equal(Object.keys(game.settlements).length, 3);
assert.equal(game.diplomacy.treaties.length, 1);
assert.equal(game.diplomacy.offers.length, 1);
assert.equal(game.turn, 2);
assert.equal(archive.initialSaveVersion, 17);
assert.ok(archive.records.every(record => record.rulesVersion === 17));
const pendingSave = serializeGame(game);
const pendingArchive = JSON.stringify(archive);
const pendingHash = stateHashForVersion(game, 17);
assert.equal(serializeGame(deserializeGame(pendingSave)), pendingSave);
assert.equal(serializeGame(replayArchive(parseArchive(archive, game))), pendingSave);
assert.equal(archive.records.at(-1)?.checkpoint, pendingHash);
const pendingState = {
  turn: game.turn, hash: pendingHash,
  settlements: Object.values(game.settlements).map(town => ({ id: town.id, factionId: town.factionId, cell: town.cell, name: town.name })),
  treasuries: game.factions.map(faction => ({ factionId: faction.id, coin: faction.treasury })),
  diplomacy: structuredClone(game.diplomacy), wars: structuredClone(game.wars),
};
const continuationStart = archive.records.length;
while (game.turn < 11) issue({ type: 'endTurn', factionId: game.turnOwnerId });
assert.equal(game.diplomacy.offers.length, 0);
assert.equal(game.diplomacy.treaties.length, 0);
assert.equal(game.wars.length, 1);
const continuedSave = serializeGame(game);
assert.equal(serializeGame(replayArchive(parseArchive(archive, game))), continuedSave);
const continuation = JSON.stringify({ records: archive.records.slice(continuationStart), finalSave: continuedSave, finalHash: stateHashForVersion(game, 17) });
assert.ok(archive.records.slice(continuationStart).some(record => record.events.some(event => event.type === 'peace_offer_expired')));
assert.ok(archive.records.slice(continuationStart).some(record => record.events.some(event => event.type === 'peace_expired')));
const digest = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
const files = { 'initial-save.json': archive.initialSave, 'pending-save.json': pendingSave, 'archive.json': pendingArchive, 'continuation.json': continuation };
const sourcePaths = ['packages/sim/src/save.ts', 'packages/sim/src/simulation.ts', 'packages/sim/src/diplomacy.ts', 'packages/sim/src/rules.ts', 'packages/sim/src/canonical-cells.ts', 'packages/chronicle/src/index.ts', 'packages/chronicle/src/json-equivalence.ts', 'packages/test-fixtures/src/authored-land.ts'];
const metadata = {
  capturedAt: new Date().toISOString(), runtime: process.version,
  producerHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  producerDirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
  producerSha256: digest(readFileSync(fileURLToPath(import.meta.url))),
  sourceSha256: Object.fromEntries(sourcePaths.map(path => [path, digest(readFileSync(path))])),
  options, rulesVersion: SAVE_VERSION,
  contentHash: (JSON.parse(pendingSave) as { contentHash: string }).contentHash,
  coverage: archive.coverage, authoredMoves,
  setup: 'Generated v17 tiny world with three factions. Only two opposing scout cells were authored into visible local contact; existing authored-sight helper refreshed knowledge before the initial snapshot. Terrain, resources, founders, treasuries, diplomacy and wars were not authored. All founding and diplomacy outcomes use recorded ordinary commands. This is an authored from-save scenario, not generated-start travel or pacing evidence.',
  initialHash: archive.initialHash, pending: pendingState,
  continuation: { turn: game.turn, hash: stateHashForVersion(game, 17), records: archive.records.length - continuationStart, offers: game.diplomacy.offers.length, treaties: game.diplomacy.treaties.length, wars: game.wars },
  pendingRecords: continuationStart,
  files: Object.fromEntries(Object.entries(files).map(([name, text]) => [name, { bytes: Buffer.byteLength(text), sha256: digest(text) }])),
  verified: ['All recorded commands accepted under rules 17', 'Paid acceptance moved exactly seven coin once', 'Three settlements, active treaty and pending offer at turn 2', 'Pending save exact deserialize/serialize bytes', 'Pending archive exact replay/save bytes and recorded turn checkpoint', 'Old-rule continuation offer expiry at turn 4 and treaty expiry at turn 11', 'Continued complete archive exact replay/save bytes'],
};
for (const [name, text] of Object.entries(files)) writeFileSync(output(name), text, { flag: 'wx' });
writeFileSync(output('metadata.json'), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(metadata, null, 2));
