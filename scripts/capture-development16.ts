import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { CONTENT_HASH, UNITS } from '@theandril/content';
import { createGame, deserializeGame, getObservation, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';
import { characterBattleCampaign } from '../packages/test-fixtures/src/character-fixture';

if (Number(SAVE_VERSION) !== 15 || CONTENT_HASH !== 'eec4003a') throw new Error('Capture requires genuine rules15/eec4003a before development16 changes.');
const cases: Record<string, unknown> = {};
function record(game: GameState, prefix: string, coverage: 'complete' | 'from-save') {
  const archive = createArchive(game, { mode: 'player', coverage });
  const issue = (command: GameCommand) => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) throw new Error(`${prefix}: ${JSON.stringify(command)} ${result.error}`);
  };
  const capture = (stage: string) => {
    const save = serializeGame(game);
    if (serializeGame(deserializeGame(save)) !== save || serializeGame(replayArchive(archive)) !== save) throw new Error('Capture is not exact.');
    cases[prefix + stage] = { save, hash: stateHash(game), sha256: createHash('sha256').update(save).digest('hex'), archive: structuredClone(archive) };
  };
  return { issue, capture };
}
const game = createGame({ seed: 20260908, size: 'tiny', factionCount: 1, pace: 'epic' });
const { issue, capture } = record(game, 'generated', 'complete'), factionId = game.turnOwnerId;
const advance = () => issue({ type: 'endTurn', factionId });
const until = (ready: () => boolean) => { for (let i = 0; !ready() && i < 300; i++) advance(); if (!ready()) throw new Error('Capture did not become ready'); };
capture('Origin');
issue({ type: 'found', factionId, armyId: 'army.1', name: 'Unbroken hearth' });
const town = Object.values(game.settlements)[0]!;
for (const itemId of ['building.granary', 'building.workshop', 'building.market', 'building.archive']) issue({ type: 'queue', factionId, settlementId: town.id, itemId });
capture('PaidConstruction'); until(() => !town.queue.length);
for (const technologyId of ['technology.cinder_masonry', 'technology.stewardship', 'technology.quarry_cranes', 'technology.surveyed_estates']) {
  until(() => getObservation(game, factionId).progression.technologyChoices.some(item => item.id === technologyId && item.available));
  issue({ type: 'research', factionId, technologyId });
}
for (const unit of UNITS.filter(unit => unit.introducedInRules === 15)) {
  until(() => getObservation(game, factionId).productionOptions.some(option => option.settlementId === town.id && option.itemId === unit.id && option.canQueue));
  issue({ type: 'queue', factionId, settlementId: town.id, itemId: unit.id });
}
capture('SpecialistQueue'); until(() => !town.queue.length); capture('SpecialistsCompleted');
const capped = deserializeGame(serializeGame(game));
capped.settlements[town.id]!.population = 20; capped.settlements[town.id]!.food = 10_000;
const boundary = record(deserializeGame(serializeGame(capped)), 'populationLimit', 'from-save');
boundary.capture('Origin');
for (let i = 0; i < 8; i++) boundary.issue({ type: 'endTurn', factionId });
boundary.capture('Continued');

const battle = characterBattleCampaign(), field = record(battle, 'field', 'from-save');
const owner = battle.turnOwnerId, enemy = battle.factions[1]!.id;
field.capture('Origin');
field.issue({ type: 'declareWar', factionId: owner, targetFactionId: enemy });
field.issue({ type: 'attack', factionId: owner, armyId: 'army.2', targetArmyId: 'army.4' });
field.capture('Pending');
field.issue({ type: 'battleOrder', factionId: owner, order: 'brace' }); field.capture('RoundOne');
field.issue({ type: 'autoResolveBattle', factionId: owner }); field.capture('Completed');
const payload = { version: 15, contentHash: CONTENT_HASH, provenance: 'Captured on unchanged rules15/eec4003a before development16. Generated cases use genuine seeded geography and paid recorded commands through all four specialist recruits. Population-limit origin explicitly authors population20 and10000food in an otherwise developed strict-loaded save; eight ordinary turns prove the old cap. Field origin uses the existing authored character fixture; war, battle and rounds are real recorded commands. Every checkpoint strict-loads and fully replays exact original bytes.', cases };
const target = 'packages/chronicle/src/fixtures/v15-development-baseline.json';
writeFileSync(target, JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload)).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, (value as {hash:string}).hash])) }, null, 2) + '\n');
console.log({ target, cases: Object.keys(cases), population: town.population, turn: game.turn, contentHash: CONTENT_HASH });
