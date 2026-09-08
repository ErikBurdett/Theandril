import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { CONTENT_HASH, FACTIONS, ROSTER_VERSION } from '@theandril/content';
import { GENERATOR_VERSION } from '@theandril/mapgen';
import { createGame, deserializeGame, getObservation, SAVE_VERSION, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';

// Genuine pre-expansion evidence, never regenerated with newer rules/content.
// Emits the fixture to stdout; the caller must retain it without overwriting an
// existing historical fixture. No canonical state or resources are authored.
assert.equal(GENERATOR_VERSION, 7);
assert.equal(SAVE_VERSION, 12);
assert.equal(CONTENT_HASH, '3c54fb02');
assert.equal(ROSTER_VERSION, 3);
assert.equal(FACTIONS.length, 12);

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const cases: {
  name: string; options: Parameters<typeof createGame>[0]; save: string;
  archive: ReturnType<typeof createArchive>; hash: string; saveSha256: string;
  replaySha256: string; saveBytes: number;
}[] = [];

for (const layout of ['continents', 'islands', 'archipelago'] as const) {
  const options = { seed: 74, size: 'tiny', factionCount: 4, layout, generatorVersion: 7, rosterVersion: 3, pace: 'short' } as const;
  const game = createGame(options);
  const archive = createArchive(game, { mode: 'watch', coverage: 'complete' });
  assert.equal(serializeGame(createGame(options)), archive.initialSave);
  const capture = (stage: string) => {
    const save = serializeGame(game), replay = serializeGame(replayArchive(archive));
    assert.equal(replay, save);
    assert.equal(serializeGame(deserializeGame(save)), save);
    cases.push({ name: `${layout}-${stage}`, options, save, archive: structuredClone(archive), hash: stateHash(game),
      saveSha256: sha256(save), replaySha256: sha256(replay), saveBytes: Buffer.byteLength(save) });
  };
  const issue = (command: GameCommand) => {
    const result = applyRecordedCommand(game, archive, command);
    assert.ok(result.ok, JSON.stringify(command) + ': ' + result.error);
  };
  capture('origin');
  for (const faction of game.factions) {
    const caravan = getObservation(game, faction.id, { landDetails: 'none' }).armies.find(army => army.factionId === faction.id && army.canFound);
    assert.ok(caravan, 'Generated faction requires its actual founder.');
    issue({ type: 'found', factionId: faction.id, armyId: caravan.id, name: `${faction.name.slice(0, 30)} Haven` });
  }
  for (let turn = 0; turn < 12; turn++) {
    for (const faction of game.factions) {
      const view = getObservation(game, faction.id, { landDetails: 'none' });
      const town = view.settlements.find(town => town.factionId === faction.id);
      assert.ok(town);
      const builds = view.productionOptions.filter(option => option.settlementId === town.id && option.kind === 'building' && option.canQueue);
      const build = builds.find(option => option.itemId === 'building.archive') ?? builds[0];
      if (!town.queue.length && build) issue({ type: 'queue', factionId: faction.id, settlementId: town.id, itemId: build.itemId });
      const technology = view.progression.technologyChoices.find(choice => choice.available);
      if (technology) issue({ type: 'research', factionId: faction.id, technologyId: technology.id });
    }
    issue({ type: 'endTurn', factionId: game.turnOwnerId });
  }
  assert.equal(game.turn, 13);
  assert.ok(archive.records.some(record => (record.command as GameCommand).type === 'queue'));
  assert.ok(archive.records.some(record => (record.command as GameCommand).type === 'research'));
  capture('developed');
}

const payload = {
  saveVersion: SAVE_VERSION, generatorVersion: GENERATOR_VERSION, rosterVersion: ROSTER_VERSION, contentHash: CONTENT_HASH,
  factionDefinitionIds: FACTIONS.map(faction => faction.id), cases,
};
const packed = {
  encoding: 'gzip-base64',
  capturedBefore: 'Schema13/roster4 expansion from twelve to twenty-four playable cultures; genuine current generator7 and old twelve definitions.',
  provenance: 'Three actual generated Tiny layouts at explicit Short regression pace. Original complete origins and twelve rounds of accepted ordinary founding, paid construction and research commands; no resource, research, population, exploration or canonical-state grants. Bounded historical compatibility evidence, not campaign-pacing or performance evidence.',
  hashes: Object.fromEntries(cases.map(item => [item.name, item.hash])),
  payload: gzipSync(JSON.stringify(payload), { level: 9 }).toString('base64'),
};
process.stdout.write(JSON.stringify(packed, null, 2) + '\n');
