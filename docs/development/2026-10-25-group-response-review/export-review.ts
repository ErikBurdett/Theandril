import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { replayArchive, resumeJournal } from '@theandril/chronicle';
import { deserializeCampaign, importSave } from '@theandril/persistence';
import { deserializeGame, serializeGame, stateHash, type GameCommand } from '@theandril/sim';

const packet = 'docs/development/2026-10-25-group-response-review';
const resultsRoot = join(packet, 'pages-results');
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

async function review() {
  const folders = readdirSync(resultsRoot).filter(name => name.startsWith('production-group-response-')).sort();
  assert.equal(folders.length, 6, 'Wait for all six production cases before running this review.');
  const cases = [];
  for (const folder of folders) {
    const directory = join(resultsRoot, folder);
    const files = readdirSync(directory);
    const replyName = files.find(name => name.endsWith('-reply.json'))!;
    assert(replyName);
    const stem = replyName.slice(0, -'-reply.json'.length);
    const replyPath = join(directory, replyName);
    const reply = JSON.parse(readFileSync(replyPath, 'utf8')) as {
      initialHash: string; expectedMutatedHash: string; commands: GameCommand[];
      originalReply: { hash: string; results: unknown[]; damagedResults: unknown[] };
      actualResultsText: string | null; actualPanelText: string; endTurnDisabled: boolean;
    };
    assert.equal(reply.actualResultsText, null);
    assert.equal(reply.endTurnDisabled, true);
    assert(reply.actualPanelText.includes(stem.startsWith('posting-') ? '2 armies selected' : '2 hearths selected'));
    assert.match(reply.actualPanelText, /restore a saved campaign/i);
    assert.equal(reply.commands.length, 2);
    assert.equal(reply.originalReply.hash, reply.expectedMutatedHash);
    assert.equal(reply.originalReply.results.length, 2);
    const exports = [];
    for (const phase of ['restored', 'retried']) {
      const path = join(directory, `${stem}-${phase}.theandril`);
      const bytes = readFileSync(path);
      const campaign = deserializeCampaign(await importSave(bytes));
      assert.equal(serializeGame(replayArchive(campaign.archive)), serializeGame(campaign.game));
      assert.equal(stateHash(campaign.game), phase === 'restored' ? reply.initialHash : reply.expectedMutatedHash);
      assert.equal(campaign.archive.records.length, phase === 'restored' ? 0 : 2);
      assert(campaign.archive.records.every(record => record.ok && record.error === null && record.rulesVersion === 35));
      exports.push({ phase, path, bytes: bytes.length, sha256: sha256(bytes), hash: stateHash(campaign.game),
        records: campaign.archive.records.length, exactReplay: true, campaign });
    }
    const restored = exports[0]!.campaign, retried = exports[1]!.campaign;
    const expected = deserializeGame(serializeGame(restored.game));
    const journal = resumeJournal(expected, restored.archive);
    for (const command of reply.commands) assert(journal.record(expected, command).ok);
    assert.equal(serializeGame(expected), serializeGame(retried.game));
    assert.deepEqual(journal.materialize(), retried.archive);
    assert.deepEqual(restored.game.armies, retried.game.armies);
    assert.deepEqual(restored.game.routes, retried.game.routes);
    if (stem.startsWith('charter-')) {
      assert.deepEqual(restored.game.settlements, retried.game.settlements);
      assert.deepEqual(restored.game.factions, retried.game.factions);
    }
    const imagePath = join(directory, `${stem}-reply.png`), image = readFileSync(imagePath);
    cases.push({ name: stem, replyPath, replySha256: sha256(readFileSync(replyPath)),
      initialHash: reply.initialHash, mutatedHash: reply.expectedMutatedHash,
      uncertaintyPreserved: true, exactExpectedOrdinaryJournal: true, armiesAndRoutesPreserved: true,
      image: { path: imagePath, width: image.readUInt32BE(16), height: image.readUInt32BE(20), bytes: image.length, sha256: sha256(image) },
      exports: exports.map(item => ({ phase: item.phase, path: item.path, bytes: item.bytes, sha256: item.sha256,
        hash: item.hash, records: item.records, exactReplay: item.exactReplay })) });
  }
  const sourcePaths = ['apps/web/src/group-posting-requests.ts', 'apps/web/src/main.tsx', 'tests/production/group-response-recovery.spec.ts',
    'tests/gameplay/group-movement-fixture.ts', 'packages/test-fixtures/src/theater-fixture.ts'];
  const evidence = { scope: 'Read-only decoding and independent exact replay of 12 retained public production exports; six completed fault cases. No browser rerun.',
    cases, sourceSha256: Object.fromEntries(sourcePaths.map(path => [path, sha256(readFileSync(path))])) };
  writeFileSync(join(packet, 'export-review.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ cases: cases.length, exportsReplayed: cases.length * 2,
    hashes: cases.map(item => ({ case: item.name, restored: item.initialHash, retried: item.mutatedHash })),
    output: join(packet, 'export-review.json') }, null, 2));
}
void review();
