import { gzipSync } from 'node:zlib';
import { CONTENT_HASH } from '@theandril/content';
import { createGame, deserializeGame, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';
import { navalCampaign, NAVAL_FIXTURE as N } from '../packages/test-fixtures/src/naval-fixture';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../packages/test-fixtures/src/victory-fixture';

// Retained capture entry point, not a way to regenerate old evidence with future rules.
if (Number(SAVE_VERSION) !== 8 || CONTENT_HASH !== '257e1e91') throw new Error('Capture requires untouched schema8/content257e1e91.');
function record(game: GameState, coverage: 'complete' | 'from-save', play: (issue: (command: GameCommand) => void) => void) {
  const archive = createArchive(game, { mode: 'player', coverage });
  play(command => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) throw new Error(JSON.stringify(command) + ': ' + result.error);
  });
  if (stateHash(replayArchive(archive)) !== stateHash(game)) throw new Error('Pre-change replay mismatch.');
  return { archive, save: serializeGame(game), hash: stateHash(game) };
}
const journeyGame = navalCampaign({ enemyFleet: false });
journeyGame.characters[N.marshalId]!.experience = 80; // Authored veteran setup, never claimed as earned history.
const journey = record(deserializeGame(serializeGame(journeyGame)), 'from-save', issue => {
  const factionId = journeyGame.turnOwnerId;
  issue({ type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId });
  for (const skillId of ['skill.decisive', 'skill.muster_rolls', 'skill.field_orders']) issue({ type: 'promoteCharacter', factionId, characterId: N.marshalId, skillId });
  issue({ type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  issue({ type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
  issue({ type: 'queueMovement', factionId, armyId: N.fleetId, target: N.landingWaterCell });
});
const landedGame = deserializeGame(journey.save);
const landing = record(landedGame, 'from-save', issue => {
  const factionId = landedGame.turnOwnerId;
  issue({ type: 'endTurn', factionId }); issue({ type: 'endTurn', factionId });
  issue({ type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.landingCell });
});
let battleGame = navalCampaign();
battleGame.armies[N.enemyFleetId]!.cell = N.shallowCell;
battleGame = deserializeGame(serializeGame(battleGame));
const battle = record(battleGame, 'from-save', issue => {
  const factionId = battleGame.turnOwnerId;
  issue({ type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId });
  issue({ type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
  issue({ type: 'declareWar', factionId, targetFactionId: battleGame.factions[1]!.id });
  issue({ type: 'attack', factionId, armyId: N.fleetId, targetArmyId: N.enemyFleetId });
});
const finishedGame = deserializeGame(battle.save);
const aftermath = record(finishedGame, 'from-save', issue => {
  issue({ type: 'autoResolveBattle', factionId: finishedGame.turnOwnerId });
  issue({ type: 'endTurn', factionId: finishedGame.turnOwnerId });
});
const growthGame = createGame({ seed: 74, size: 'tiny', factionCount: 1, pace: 'epic' });
const growth = record(growthGame, 'complete', issue => {
  const factionId = growthGame.turnOwnerId;
  issue({ type: 'found', factionId, armyId: 'army.1', name: 'Last old hearth' });
  issue({ type: 'queue', factionId, settlementId: Object.keys(growthGame.settlements)[0]!, itemId: 'building.workshop' });
  for (let turn = 0; turn < 14; turn++) issue({ type: 'endTurn', factionId });
});
const epicGame = prosperityCampaign(); epicGame.pace = 'epic';
epicGame.factions[0]!.knowledge = 1600; epicGame.factions[0]!.treasury = 75_030;
const epic = record(epicGame, 'from-save', issue => {
  const factionId = epicGame.turnOwnerId;
  issue({ type: 'research', factionId, technologyId: 'technology.civic_accounts' });
  issue({ type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' });
  issue({ type: 'startVictoryProject', factionId, settlementId: PROSPERITY_FIXTURE.hostId });
  issue({ type: 'endTurn', factionId });
});
const cases = { journey, landing, battle, aftermath, growth, epic };
const payload = { capturedBefore: 'Schema9 territories and dynamic faction ecology', contentHash: CONTENT_HASH, ...cases };
process.stdout.write(JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload)).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([name, item]) => [name, item.hash])) }));
