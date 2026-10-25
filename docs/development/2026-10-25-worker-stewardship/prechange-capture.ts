/** Run once against pristine 4717420 before rules 36 implementation. Frozen output is evidence, not a regenerated fixture. */
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createGame, getObservation, serializeGame, deserializeGame, stateHash, SAVE_VERSION, type GameCommand } from '../../../packages/sim/src/index';
import { createArchive, applyRecordedCommand, parseArchive, replayArchive } from '../../../packages/chronicle/src/index';

const baseline = '47174209f633a92930b8076b0b1ce7db13c3e38e';
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), baseline);
assert.equal(SAVE_VERSION, 35);
const game = createGame({ seed: 41, size: 'tiny', factionCount: 2, pace: 'standard' });
const archive = createArchive(game, { mode: 'player', coverage: 'complete' });
const issue = (command: GameCommand) => {
  const result = applyRecordedCommand(game, archive, command);
  assert.equal(result.ok, true, JSON.stringify({ command, result }));
};
const factionId = game.turnOwnerId;
const colonist = Object.values(game.armies).find(army => army.factionId === factionId && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
issue({ type: 'found', factionId, armyId: colonist.id, name: 'Pre-policy Hearth' });
const town = Object.values(game.settlements).find(settlement => settlement.factionId === factionId)!;
const land = getObservation(game, factionId).land.settlements.find(entry => entry.settlementId === town.id)!;
const cells = land.cells.filter(cell => cell.claimed && cell.canWork).slice(0, land.workerCapacity).map(cell => cell.cell).sort((a, b) => a - b);
assert(cells.length > 0);
issue({ type: 'setWorkedTiles', factionId, settlementId: town.id, cells });
issue({ type: 'queue', factionId, settlementId: town.id, itemId: 'building.granary' });
issue({ type: 'setCharter', factionId, settlementId: town.id, focus: 'works', ceiling: 24 });
for (let turn = 0; turn < 8; turn++) issue({ type: 'endTurn', factionId });
issue({ type: 'setWorkedTiles', factionId, settlementId: town.id, cells: cells.slice(0, 1) });
issue({ type: 'endTurn', factionId });
const rawSave = serializeGame(game);
assert.equal(serializeGame(deserializeGame(rawSave)), rawSave);
assert.equal(serializeGame(replayArchive(parseArchive(archive, game))), rawSave);
const archiveText = JSON.stringify(archive, null, 2) + '\n';
const rawSaveText = rawSave + '\n';
const files = {
  'packages/sim/src/fixtures/worker-policy-v35-archive.json': archiveText,
  'packages/sim/src/fixtures/worker-policy-v35-save.json': rawSaveText,
};
for (const [path, text] of Object.entries(files)) writeFileSync(path, text);
const metadata = {
  baseline, capturedAt: new Date().toISOString(), rulesVersion: 35, saveVersion: 35,
  description: 'Generated tiny two-realm campaign. No authored state mutation, no AI commands. Ordinary founding, worker assignments, production, charter and nine end-turn commands. Complete archive independently replayed against unmodified rules 35.',
  initialHash: archive.initialHash, initialSaveVersion: archive.initialSaveVersion,
  finalStateHash: stateHash(game), finalTurn: game.turn,
  victoryFinalHash: archive.finalHash, victoryFinalHashVersion: archive.finalHashVersion,
  rawStateChecksum: JSON.parse(rawSave).stateChecksum, contentHash: JSON.parse(rawSave).contentHash,
  checkpoints: archive.records.filter(record => record.checkpoint).map(record => ({ sequence: record.sequence, turn: record.afterTurn, hash: record.checkpoint, version: record.checkpointVersion })),
  records: archive.records.length, commands: archive.records.map(record => record.command),
  finalTown: { id: town.id, population: town.population, food: town.food, buildings: town.buildings, queue: town.queue, land: game.land.settlements[town.id] },
  files: Object.entries(files).map(([path, text]) => ({ path, bytes: Buffer.byteLength(text), sha256: createHash('sha256').update(text).digest('hex') })),
};
writeFileSync('docs/development/2026-10-25-worker-stewardship/prechange-metadata.json', JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify({ baseline, records: metadata.records, initialHash: metadata.initialHash, finalStateHash: metadata.finalStateHash, finalTurn: metadata.finalTurn, files: metadata.files }));
