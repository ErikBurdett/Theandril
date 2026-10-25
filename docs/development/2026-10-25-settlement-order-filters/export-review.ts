import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { replayArchive, resumeJournal } from '@theandril/chronicle';
import { deserializeCampaign, importSave } from '@theandril/persistence';
import { deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';

const packet = 'docs/development/2026-10-25-settlement-order-filters';
const resultRoot = process.argv[2] ?? 'browser-results';
const outputName = process.argv[3] ?? 'export-review.json';
const directory = join(packet, resultRoot, 'production-settlement-orde-82614-anges-and-saved-restoration');
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const facts = JSON.parse(readFileSync(join(directory, 'settlement-order-evidence.json'), 'utf8')) as {
  initialHash: string; finalHash: string; commands: GameCommand[]; submittedIds: string[];
};
function counts(game: GameState) {
  const view = getObservation(game, game.turnOwnerId, { landDetails: 'none', developmentCandidates: false });
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  const charters = new Map(view.charters.map(charter => [charter.settlementId, charter]));
  return { all: towns.length, empty: towns.filter(town => town.queue.length === 0).length,
    unchartered: towns.filter(town => !charters.has(town.id)).length,
    waiting: towns.filter(town => town.queue.length === 0 && charters.get(town.id)?.blocker != null).length };
}
async function review() {
  const exports = [];
  for (const phase of ['browsed', 'changed', 'restored']) {
    const path = join(directory, `settlement-order-${phase}.theandril`), bytes = readFileSync(path);
    const campaign = deserializeCampaign(await importSave(bytes));
    assert.equal(serializeGame(replayArchive(campaign.archive)), serializeGame(campaign.game));
    assert.equal(stateHash(campaign.game), phase === 'browsed' ? facts.initialHash : facts.finalHash);
    assert.equal(campaign.archive.records.length, phase === 'browsed' ? 30 : 36);
    assert(campaign.archive.records.every(record => record.ok && record.error === null && record.rulesVersion === 35));
    assert.deepEqual(counts(campaign.game), phase === 'browsed'
      ? { all: 30, empty: 24, unchartered: 10, waiting: 5 } : { all: 30, empty: 24, unchartered: 9, waiting: 0 });
    exports.push({ phase, path, bytes: bytes.length, sha256: sha256(bytes), hash: stateHash(campaign.game),
      records: campaign.archive.records.length, counts: counts(campaign.game), exactReplay: true, campaign });
  }
  const initial = exports[0]!.campaign, changed = exports[1]!.campaign, restored = exports[2]!.campaign;
  assert.equal(initial.game.turn, 2); assert.equal(changed.game.turn, 2);
  assert.equal(initial.game.factions.find(faction => faction.id === initial.game.turnOwnerId)!.treasury, 3940);
  const expected = deserializeGame(serializeGame(initial.game)), journal = resumeJournal(expected, initial.archive);
  assert.equal(facts.commands.length, 6);
  for (const command of facts.commands) assert(journal.record(expected, command).ok);
  assert.equal(serializeGame(expected), serializeGame(changed.game));
  assert.deepEqual(journal.materialize(), changed.archive);
  assert.equal(serializeGame(restored.game), serializeGame(changed.game));
  assert.deepEqual(restored.archive, changed.archive);
  for (const key of ['settlements', 'factions', 'armies', 'routes', 'postings', 'patrols'] as const) assert.deepEqual(initial.game[key], changed.game[key]);
  assert.equal(Object.values(initial.game.settlements).filter(town => town.factionId === initial.game.turnOwnerId && town.queue.length > 0).length, 6);
  const added = changed.archive.records.slice(initial.archive.records.length);
  assert.deepEqual(added.map(record => record.command), facts.commands);
  assert.deepEqual(facts.submittedIds, ['settlement.65', 'settlement.90', 'settlement.91', 'settlement.92', 'settlement.93', 'settlement.94']);
  const images = ['settlement-waiting-desktop.png', 'settlement-waiting-narrow-130.png', 'settlement-order-selector-native.png', 'settlement-charters-ready-narrow-130.png'].map(name => {
    const path = join(directory, name), bytes = readFileSync(path);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    return { path, bytes: bytes.length, sha256: sha256(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  });
  const sourcePaths = ['tests/gameplay/settlement-order-fixture.ts', 'tests/production/settlement-order-filters.spec.ts',
    'apps/web/src/settlement-order-status.ts', 'apps/web/src/realm-navigation.tsx'];
  const output = { scope: 'Read-only strict decoding and independent exact replay of three retained public production exports; no browser rerun or fixture regeneration.',
    authoredTestReviewer: true, turn: 2, treasury: 3940, queuedHearths: 6, submittedIds: facts.submittedIds,
    exactSixCommandJournal: true, savedRestorationExact: true, settlementsFactionsArmiesRoutesPostingsPatrolsPreserved: true,
    exports: exports.map(({ campaign: _campaign, ...entry }) => entry), images,
    sources: Object.fromEntries(sourcePaths.map(path => [path, sha256(readFileSync(path))])) };
  writeFileSync(join(packet, outputName), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ exportsReplayed: 3, checkpoints: output.exports.map(({ phase, hash, records, counts }) => ({ phase, hash, records, counts })), images, output: join(packet, outputName) }, null, 2));
}
void review();
