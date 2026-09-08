import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { BUILDINGS, CONTENT_HASH, FACTION_ECOLOGIES } from '@theandril/content';
import { createGame, deserializeGame, getMovementQuery, getObservation, getSettlementLandObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { cellsWithin } from '../packages/sim/src/visibility';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';

// Historical evidence must be captured by the actual old rules, not reconstructed
// from a future engine. This guard deliberately prevents later regeneration.
if (Number(SAVE_VERSION) !== 11 || CONTENT_HASH !== '3c54fb02') throw new Error('Capture requires untouched schema11/content3c54fb02.');
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
function campaign(game: GameState) {
  const archive = createArchive(game, { mode: 'player', coverage: 'complete' });
  const issue = (command: GameCommand): void => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) throw new Error(JSON.stringify(command) + ': ' + result.error);
  };
  const advance = () => issue({ type: 'endTurn', factionId: game.turnOwnerId });
  const until = (ready: () => boolean, label: string): void => {
    for (let count = 0; !ready() && count < 120; count++) advance();
    if (!ready()) throw new Error('Ordinary-command capture could not reach ' + label);
  };
  const capture = () => {
    const save = serializeGame(game), hash = stateHash(game), replayed = serializeGame(replayArchive(archive));
    if (replayed !== save || serializeGame(deserializeGame(save)) !== save) throw new Error('Pre-change exact replay/restore mismatch.');
    return { archive: structuredClone(archive), save, hash, saveBytes: Buffer.byteLength(save), saveSha256: sha256(save), replaySha256: sha256(replayed) };
  };
  return { game, archive, issue, advance, until, capture };
}

const land = campaign(createGame({ seed: 20260905, size: 'tiny', factionCount: 12, factionDefinitionId: 'faction.reedbound_council', pace: 'short', generatorVersion: 4, rosterVersion: 3 }));
const twelveOrigin = land.capture(), owner = land.game.turnOwnerId;
for (const faction of land.game.factions) {
  const army = Object.values(land.game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
  land.issue({ type: 'found', factionId: faction.id, armyId: army.id, name: faction.name + ' Witness' });
}
const town = Object.values(land.game.settlements).find(town => town.factionId === owner)!;
const view = () => getSettlementLandObservation(land.game, owner, town.id)!;
const site = view().cells.find(cell => cell.canWork && cell.improvementOptions.some(option => option.canStart));
if (!site) throw new Error('Generated region lacks an affordable improvement.');
land.issue({ type: 'setWorkedTiles', factionId: owner, settlementId: town.id, cells: [site.cell] });
land.issue({ type: 'improveTile', factionId: owner, settlementId: town.id, cell: site.cell, improvementId: site.improvementOptions.find(option => option.canStart)!.improvementId });
const activeImprovement = land.capture();
land.advance();
const partialImprovement = land.capture();
land.until(() => !land.game.land.settlements[town.id]!.work, 'completed improvement');
const improved = land.capture();
const targets = FACTION_ECOLOGIES['faction.reedbound_council']!.terraformBiomeIds;
const claim = () => view().cells.find(cell => cell.claim.canStart && cell.terrain !== 0 && cell.terrain !== 4 && targets.some(biome => biome !== cell.biome));
land.until(() => Boolean(claim()), 'funded contiguous claim');
const target = claim()!.cell;
land.issue({ type: 'claimCell', factionId: owner, settlementId: town.id, cell: target });
const cultivation = () => view().cells.find(cell => cell.cell === target)!.terraformOptions.find(option => option.canStart);
land.until(() => Boolean(cultivation()), 'funded cultivation');
land.issue({ type: 'terraformTile', factionId: owner, settlementId: town.id, cell: target, biome: cultivation()!.biome });
land.advance();
const activeCultivation = land.capture();
land.until(() => !land.game.land.settlements[town.id]!.work, 'completed cultivation');
const cultivated = land.capture();

const development = campaign(createGame({ seed: 74, size: 'tiny', factionCount: 1, factionDefinitionId: 'faction.morrow_spore', pace: 'short', generatorVersion: 4, rosterVersion: 3 }));
const developmentOrigin = development.capture(), factionId = development.game.turnOwnerId;
development.issue({ type: 'found', factionId, armyId: 'army.1', name: 'Morrow knowledge witness' });
const home = Object.values(development.game.settlements)[0]!;
for (const itemId of ['building.archive', 'building.market', 'building.workshop', 'building.granary']) {
  const cost = BUILDINGS.find(item => item.id === itemId)!.coinCost;
  development.until(() => development.game.factions[0]!.treasury >= cost, 'funded building queue');
  development.issue({ type: 'queue', factionId, settlementId: home.id, itemId });
}
development.advance();
const queuedConstruction = development.capture();
development.until(() => home.queue.length === 0, 'completed building queue');
const built = development.capture();
for (const technologyId of ['technology.cinder_masonry', 'technology.civic_accounts', 'technology.coastal_navigation', 'technology.ocean_navigation']) {
  development.until(() => Boolean(getObservation(development.game, factionId, { landDetails: 'none' }).progression.technologyChoices.find(item => item.id === technologyId)?.available), 'affordable ' + technologyId);
  development.issue({ type: 'research', factionId, technologyId });
}
development.until(() => development.game.factions[0]!.treasury >= 54, 'funded institution and doctrine');
development.issue({ type: 'adoptInstitution', factionId, institutionId: 'institution.common_stewardship' });
development.issue({ type: 'adoptDoctrine', factionId, doctrineId: 'doctrine.march_columns' });
const researched = development.capture();
development.until(() => development.game.factions[0]!.treasury >= 20, 'surveyor appointment');
development.issue({ type: 'recruitCharacter', factionId, settlementId: home.id, definitionId: 'character.surveyor' });
const character = Object.values(development.game.characters)[0]!;
development.issue({ type: 'assignCharacter', factionId, characterId: character.id, armyId: 'army.2' });
const survey = () => {
  development.until(() => development.game.factions[0]!.treasury >= 4, 'funded survey');
  const radius = character.skillId ? 7 : 6;
  const unexplored = (cell: number) => cellsWithin(development.game, cell, radius).filter(cell => !development.game.explored[factionId]!.has(cell)).length;
  for (let walk = 0; !unexplored(development.game.armies['army.2']!.cell) && walk < 30; walk++) {
    const observation = getObservation(development.game, factionId, { landDetails: 'none' });
    const origin = development.game.armies['army.2']!.cell;
    const options = getMovementQuery(observation, 'army.2').reachable.filter(item => item.cell !== origin).sort((a, b) => unexplored(b.cell) - unexplored(a.cell) || b.cost - a.cost || a.cell - b.cell);
    if (options[0]) development.issue({ type: 'moveTo', factionId, armyId: 'army.2', target: options[0].cell });
    if (!unexplored(development.game.armies['army.2']!.cell)) development.advance();
  }
  development.issue({ type: 'startCharacterMission', factionId, characterId: character.id, missionId: 'mission.survey', targetCell: development.game.armies['army.2']!.cell });
};
survey(); development.advance();
const activeMission = development.capture();
development.advance();
for (let i = 0; i < 2; i++) { survey(); development.advance(); development.advance(); }
development.issue({ type: 'promoteCharacter', factionId, characterId: character.id, skillId: 'skill.fieldcraft' });
const specialization = development.capture();
survey(); development.advance();
const skilledMission = development.capture();
development.advance();
const completed = development.capture();
const cases = { twelveOrigin, activeImprovement, partialImprovement, improved, activeCultivation, cultivated, developmentOrigin, queuedConstruction, built, researched, activeMission, specialization, skilledMission, completed };
const payload = {
  capturedBefore: 'Version-five geography, settlement roads and overseas campaigns', saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  provenance: 'Generated starts and ordinary recorded commands only; no authored resource, population, experience or technology grants. Short pacing is a regression setting, not campaign-duration evidence. Captured before content mutation.',
  ...cases,
};
process.stdout.write(JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload)).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([name, item]) => [name, item.hash])) }));

