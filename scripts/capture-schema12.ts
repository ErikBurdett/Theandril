import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { CONTENT_HASH, ROSTER_VERSION } from '@theandril/content';
import { createGame, deserializeGame, getObservation, getSettlementLandObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand } from '@theandril/sim';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';

// Genuine old-engine evidence. A later schema/content/roster must never recapture it.
assert.equal(SAVE_VERSION, 12); assert.equal(CONTENT_HASH, '3c54fb02'); assert.equal(ROSTER_VERSION, 3);
const options = { seed: 20260905, size: 'tiny', factionCount: 14, factionDefinitionId: 'faction.reedbound_council', pace: 'short', generatorVersion: 6, rosterVersion: 3, layout: 'continents' } as const;
const game = createGame(options), archive = createArchive(game, { mode: 'watch', coverage: 'complete' });
const owner = game.turnOwnerId;
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const issue = (command: GameCommand) => {
  const result = applyRecordedCommand(game, archive, command);
  assert.ok(result.ok, JSON.stringify(command) + ': ' + result.error);
};
const capture = () => {
  const save = serializeGame(game), replay = serializeGame(replayArchive(archive));
  assert.equal(replay, save); assert.equal(serializeGame(deserializeGame(save)), save);
  return { save, archive: structuredClone(archive), hash: stateHash(game), saveBytes: Buffer.byteLength(save), saveSha256: sha256(save), replaySha256: sha256(replay) };
};
const origin = capture();
for (const faction of game.factions) {
  const founder = getObservation(game, faction.id, { landDetails: 'none' }).armies.find(army => army.factionId === faction.id && army.canFound);
  assert.ok(founder);
  issue({ type: 'found', factionId: faction.id, armyId: founder.id, name: faction.name + ' Witness' });
}
const home = Object.values(game.settlements).find(town => town.factionId === owner)!;
const scout = Object.values(game.armies).find(army => army.factionId === owner)!;
const land = () => getSettlementLandObservation(game, owner, home.id)!;
const site = land().cells.find(cell => cell.canWork && cell.improvementOptions.some(option => option.canStart));
assert.ok(site, 'Generated home needs a legally affordable worked improvement.');
const work = site.improvementOptions.find(option => option.canStart)!;
issue({ type: 'setWorkedTiles', factionId: owner, settlementId: home.id, cells: [site.cell] });
issue({ type: 'improveTile', factionId: owner, settlementId: home.id, cell: site.cell, improvementId: work.improvementId });
issue({ type: 'recruitCharacter', factionId: owner, settlementId: home.id, definitionId: 'character.surveyor' });
const character = Object.values(game.characters).find(character => character.factionId === owner)!;
issue({ type: 'assignCharacter', factionId: owner, characterId: character.id, armyId: scout.id });
const survey = getObservation(game, owner, { landDetails: 'none' }).characters.find(item => item.id === character.id)!.missions.find(option => option.missionId === 'mission.survey' && option.canStart);
assert.ok(survey, 'Generated camp needs a legal paid survey.');
issue({ type: 'startCharacterMission', factionId: owner, characterId: character.id, missionId: 'mission.survey', targetCell: scout.cell });
const activeWork = capture();
issue({ type: 'endTurn', factionId: owner });
const partialWork = capture();
for (let round = 1; round < 12; round++) {
  for (const faction of game.factions) {
    const view = getObservation(game, faction.id, { landDetails: 'none' });
    const town = view.settlements.find(item => item.factionId === faction.id)!;
    const builds = view.productionOptions.filter(option => option.settlementId === town.id && option.kind === 'building' && option.canQueue);
    const build = builds.find(option => option.itemId === 'building.archive') ?? builds[0];
    if (!town.queue.length && build) issue({ type: 'queue', factionId: faction.id, settlementId: town.id, itemId: build.itemId });
    const technology = view.progression.technologyChoices.find(choice => choice.available);
    if (technology) issue({ type: 'research', factionId: faction.id, technologyId: technology.id });
  }
  issue({ type: 'endTurn', factionId: owner });
}
assert.equal(game.turn, 13); assert.equal(game.factions.length, 14);
assert.equal(game.land.settlements[home.id]!.improvements[site.cell], work.improvementId);
assert.equal(character.mission, null); assert.equal(character.experience, 4);
assert.ok(game.progression[owner]!.technologies.length > 0, 'Twelve ordinary rounds must include paid research.');
const developed = capture();
const cases = { origin, activeWork, partialWork, developed };
const payload = {
  capturedBefore: 'Two additional playable cultures; all source data captured before content or roster mutation.',
  provenance: 'Generated 14-seat origin, explicitly selected Reedbound first seat, generator6/roster3. Twelve rounds of accepted ordinary paid commands only; no resource, experience, territory, research, population or exploration grants. Short pace is a bounded regression setting, not pacing evidence.',
  saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH, options,
  evidence: { settlementId: home.id, workedCell: site.cell, improvementId: work.improvementId, characterId: character.id, characterName: character.name, scoutId: scout.id },
  ...cases,
};
process.stdout.write(JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload), { level: 9 }).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([name, value]) => [name, value.hash])) }));
