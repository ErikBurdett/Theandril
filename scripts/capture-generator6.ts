import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { CONTENT_HASH } from '@theandril/content';
import { GENERATOR_VERSION } from '@theandril/mapgen';
import { createGame, getObservation, SAVE_VERSION, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';

// Historical capture tool: deliberately refuses to regenerate evidence after v7.
assert.equal(GENERATOR_VERSION, 6); assert.equal(SAVE_VERSION, 12); assert.equal(CONTENT_HASH, '3c54fb02');
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const cases: { name: string; save: string; archive: ReturnType<typeof createArchive>; hash: string; saveSha256: string; saveBytes: number }[] = [];
for (const layout of ['continents', 'islands', 'archipelago'] as const) {
  const game = createGame({ seed: 74, size: 'tiny', factionCount: 4, layout, generatorVersion: 6, pace: 'epic' });
  const archive = createArchive(game, { mode: 'watch', coverage: 'complete' });
  const capture = (stage: string) => {
    const save = serializeGame(game);
    assert.equal(serializeGame(replayArchive(archive)), save);
    cases.push({ name: `${layout}-${stage}`, save, archive: structuredClone(archive), hash: stateHash(game), saveSha256: sha(save), saveBytes: Buffer.byteLength(save) });
  };
  const issue = (command: GameCommand) => { const result = applyRecordedCommand(game, archive, command); assert.ok(result.ok, result.error); };
  capture('origin');
  for (const faction of game.factions) {
    const caravan = getObservation(game, faction.id).armies.find(army => army.factionId === faction.id && army.canFound)!;
    issue({ type: 'found', factionId: faction.id, armyId: caravan.id, name: `${faction.name.slice(0, 30)} Haven` });
  }
  for (let turn = 0; turn < 12; turn++) {
    for (const faction of game.factions) {
      const view = getObservation(game, faction.id), town = view.settlements.find(town => town.factionId === faction.id)!;
      const build = view.productionOptions.find(option => option.settlementId === town.id && option.kind === 'building' && option.canQueue);
      if (!town.queue.length && build) issue({ type: 'queue', factionId: faction.id, settlementId: town.id, itemId: build.itemId });
      const technology = view.progression.technologyChoices.find(choice => choice.available);
      if (technology) issue({ type: 'research', factionId: faction.id, technologyId: technology.id });
    }
    issue({ type: 'endTurn', factionId: game.turnOwnerId });
  }
  capture('developed');
}
const payload = { saveVersion: SAVE_VERSION, generatorVersion: GENERATOR_VERSION, contentHash: CONTENT_HASH, cases };
const packed = { capturedBefore: 'generator7 inland seas; current b17900d-based schema12/generator6 implementation, ordinary orders only', hashes: Object.fromEntries(cases.map(item => [item.name, item.hash])), payload: gzipSync(JSON.stringify(payload), { level: 9 }).toString('base64') };
writeFileSync('packages/chronicle/src/fixtures/v12-generator6-history.json', JSON.stringify(packed, null, 2) + '\n');
console.log(JSON.stringify(cases.map(({ name, hash, saveSha256, saveBytes, archive }) => ({ name, hash, saveSha256, saveBytes, commands: archive.records.length })), null, 2));
