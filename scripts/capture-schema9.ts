import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { CONTENT_HASH, FACTION_ECOLOGIES } from '@theandril/content';
import { createGame, deserializeGame, getSettlementLandObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';

// This captures genuine current evidence, not synthetic future reconstructions.
// Refuse to regenerate it once either the rules or content have changed.
if (Number(SAVE_VERSION) !== 9 || CONTENT_HASH !== '9418e598') throw new Error('Capture requires untouched schema9/content9418e598.');
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

function campaign(game: GameState) {
  const archive = createArchive(game, { mode: 'player', coverage: 'complete' });
  const issue = (command: GameCommand): void => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) throw new Error(JSON.stringify(command) + ': ' + result.error);
  };
  const advance = () => issue({ type: 'endTurn', factionId: game.turnOwnerId });
  const until = (ready: () => boolean, label: string): void => {
    for (let count = 0; !ready() && count < 40; count++) advance();
    if (!ready()) throw new Error('Capture could not reach ' + label + ' through ordinary turns.');
  };
  const capture = () => {
    const save = serializeGame(game), hash = stateHash(game), replayed = serializeGame(replayArchive(archive));
    if (replayed !== save || serializeGame(deserializeGame(save)) !== save) throw new Error('Pre-change exact replay/restore mismatch.');
    return { archive: structuredClone(archive), save, hash, saveBytes: Buffer.byteLength(save), saveSha256: sha256(save), replaySha256: sha256(replayed) };
  };
  return { game, archive, issue, advance, until, capture };
}

const six = campaign(createGame({ seed: 20260905, size: 'tiny', factionCount: 6, factionDefinitionId: 'faction.reedbound_council', pace: 'short', generatorVersion: 4 }));
const sixOrigin = six.capture(), owner = six.game.turnOwnerId;
for (const faction of six.game.factions) {
  const army = Object.values(six.game.armies).find(army => army.factionId === faction.id && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
  six.issue({ type: 'found', factionId: faction.id, armyId: army.id, name: faction.name + ' Witness' });
}
const townId = Object.values(six.game.settlements).find(town => town.factionId === owner)!.id;
const land = () => getSettlementLandObservation(six.game, owner, townId)!;
const site = land().cells.find(cell => cell.canWork && cell.improvementOptions.some(option => option.canStart));
if (!site) throw new Error('Generated six-seat region has no affordable improvement site.');
const improvement = site.improvementOptions.find(option => option.canStart)!;
six.issue({ type: 'setWorkedTiles', factionId: owner, settlementId: townId, cells: [site.cell] });
six.issue({ type: 'improveTile', factionId: owner, settlementId: townId, cell: site.cell, improvementId: improvement.improvementId });
const activeImprovement = six.capture();
six.until(() => !six.game.land.settlements[townId]!.work, 'completed improvement');
const improved = six.capture();

const targets = FACTION_ECOLOGIES['faction.reedbound_council']!.terraformBiomeIds;
const claimSite = () => land().cells.find(cell => cell.claim.canStart && cell.terrain !== 0 && cell.terrain !== 4 && targets.some(biome => biome !== cell.biome));
six.until(() => Boolean(claimSite()), 'grown and funded contiguous claim');
const claimedCell = claimSite()!.cell;
six.issue({ type: 'claimCell', factionId: owner, settlementId: townId, cell: claimedCell });
const cultivate = () => land().cells.find(cell => cell.cell === claimedCell)!.terraformOptions.find(option => option.canStart);
six.until(() => Boolean(cultivate()), 'funded cultivation');
six.issue({ type: 'terraformTile', factionId: owner, settlementId: townId, cell: claimedCell, biome: cultivate()!.biome });
six.advance();
const activeCultivation = six.capture();
six.until(() => !six.game.land.settlements[townId]!.work, 'completed cultivation');
six.issue({ type: 'setWorkedTiles', factionId: owner, settlementId: townId, cells: [site.cell, claimedCell].sort((a, b) => a - b) });
const cultivated = six.capture();

const eight = campaign(createGame({ seed: 74, size: 'tiny', factionCount: 8, factionDefinitionId: 'faction.sepulchral_synod', pace: 'short', generatorVersion: 4 }));
const eightOrigin = eight.capture();
eight.issue({ type: 'found', factionId: eight.game.turnOwnerId, armyId: 'army.1', name: 'Eighth-seat witness' });
const eightFounded = eight.capture();
const cases = { sixOrigin, activeImprovement, improved, activeCultivation, cultivated, eightOrigin, eightFounded };
const payload = {
  capturedBefore: 'Expanded faction roster and distinctive faction rules', saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  provenance: 'Generated starts and ordinary recorded commands only; no authored state grants, no AI/balance claim. Captured by the guarded script before content mutation.',
  ...cases,
};
process.stdout.write(JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload)).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([name, item]) => [name, item.hash])) }));
