/** Run once against pristine 657a4a5 before rules 37 implementation. Preserve output bytes. */
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createGame, getObservation, serializeGame, deserializeGame, stateHash, SAVE_VERSION, type GameCommand } from '../../../packages/sim/src/index';
import { createArchive, applyRecordedCommand, parseArchive, replayArchive } from '../../../packages/chronicle/src/index';

const baseline = '657a4a55c8d1fabe0f64fd2544c422a90995bf21';
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), baseline);
assert.equal(SAVE_VERSION, 36);
const game = createGame({ seed: 41, size: 'tiny', factionCount: 2, pace: 'standard' });
const archive = createArchive(game, { mode: 'player', coverage: 'complete' });
const events: { sequence: number; types: string[] }[] = [];
const issue = (command: GameCommand) => {
  const result = applyRecordedCommand(game, archive, command);
  assert.equal(result.ok, true, JSON.stringify({ command, result }));
  events.push({ sequence: archive.records.length, types: result.events.map(event => event.type) });
};
const factionId = game.turnOwnerId;
const colonist = Object.values(game.armies).find(army => army.factionId === factionId && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
issue({ type: 'found', factionId, armyId: colonist.id, name: 'Pre-commission Hearth' });
const town = Object.values(game.settlements).find(settlement => settlement.factionId === factionId)!;
issue({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'food' });
const choice = () => {
  const land = getObservation(game, factionId).land.settlements.find(entry => entry.settlementId === town.id)!;
  return land.cells.filter(cell => cell.worked && !cell.improvementId)
    .flatMap(cell => cell.improvementOptions.filter(option => option.canStart).map(option => ({ cell: cell.cell, option })))
    .sort((a, b) => a.option.coinCost - b.option.coinCost || a.cell - b.cell || a.option.improvementId.localeCompare(b.option.improvementId))[0];
};
const first = choice(); assert(first, 'The generated hearth must have a legal, affordable worked improvement.');
issue({ type: 'improveTile', factionId, settlementId: town.id, cell: first.cell, improvementId: first.option.improvementId });
for (let turn = 0; turn < 7; turn++) issue({ type: 'endTurn', factionId });
assert.equal(game.land.settlements[town.id]!.improvements[first.cell], first.option.improvementId);
issue({ type: 'setWorkerPolicy', factionId, settlementId: town.id, focus: 'industry' });
const second = choice(); assert(second, 'Growth must expose another affordable unimproved worked tile.');
issue({ type: 'improveTile', factionId, settlementId: town.id, cell: second.cell, improvementId: second.option.improvementId });
issue({ type: 'endTurn', factionId });
assert(game.land.settlements[town.id]!.work, 'Keep real paid work underway at the captured boundary.');
const rawSave = serializeGame(game);
assert.equal(serializeGame(deserializeGame(rawSave)), rawSave);
assert.equal(serializeGame(replayArchive(parseArchive(archive, game))), rawSave);
const files = {
  'packages/sim/src/fixtures/land-policy-v36-archive.json': JSON.stringify(archive, null, 2) + '\n',
  'packages/sim/src/fixtures/land-policy-v36-save.json': rawSave + '\n',
};
for (const [path, content] of Object.entries(files)) writeFileSync(path, content);
const metadata = {
  baseline, capturedAt: new Date().toISOString(), rulesVersion: 36, saveVersion: 36,
  description: 'Generated tiny two-realm campaign, seed 41. No authored state mutation or AI commands. Ordinary founding, Food then Industry worker policies, two paid improvements and eight end turns. One completed improvement and one paid work order remain; exact complete archive replay verified on unmodified rules 36.',
  initialHash: archive.initialHash, initialSaveVersion: archive.initialSaveVersion,
  finalStateHash: stateHash(game), finalTurn: game.turn,
  finalHash: archive.finalHash, finalHashVersion: archive.finalHashVersion,
  rawStateChecksum: JSON.parse(rawSave).stateChecksum, contentHash: JSON.parse(rawSave).contentHash,
  checkpoints: archive.records.filter(record => record.checkpoint).map(record => ({ sequence: record.sequence, turn: record.afterTurn, hash: record.checkpoint, version: record.checkpointVersion })),
  records: archive.records.length, commands: archive.records.map(record => record.command), events,
  finalTown: { id: town.id, population: town.population, food: town.food, buildings: town.buildings, queue: town.queue, land: game.land.settlements[town.id] },
  workerPolicies: game.workerPolicies,
  files: Object.entries(files).map(([path, content]) => ({ path, bytes: Buffer.byteLength(content), sha256: createHash('sha256').update(content).digest('hex') })),
};
writeFileSync('docs/development/2026-10-25-land-commissions/prechange-metadata.json', JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify({ baseline, records: metadata.records, initialHash: metadata.initialHash, finalStateHash: metadata.finalStateHash, finalTurn: metadata.finalTurn, files: metadata.files }));
