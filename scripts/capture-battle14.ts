import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { CONTENT_HASH } from '@theandril/content';
import { createGame, deserializeGame, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';
import { characterBattleCampaign } from '../packages/test-fixtures/src/character-fixture';
import { conquestCampaign } from '../packages/test-fixtures/src/conquest-fixture';

// Run only before battle9/ability content changes. Future engines must not recreate
// historical evidence by projecting new behavior back into old envelopes.
if (Number(SAVE_VERSION) !== 13 || CONTENT_HASH !== '07a58d4f') throw new Error('Capture requires genuine schema13/content07a58d4f.');
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
function recorded(game: GameState, coverage: 'complete' | 'from-save') {
  const archive = createArchive(game, { mode: 'player', coverage });
  const issue = (command: GameCommand) => {
    const result = applyRecordedCommand(game, archive, command);
    if (!result.ok) throw new Error(`${JSON.stringify(command)}: ${result.error}`);
  };
  const capture = () => {
    const save = serializeGame(game), replay = serializeGame(replayArchive(archive));
    if (replay !== save || serializeGame(deserializeGame(save)) !== save) throw new Error('Genuine capture does not replay/restore exactly.');
    return { archive: structuredClone(archive), save, hash: stateHash(game), saveBytes: Buffer.byteLength(save), saveSha256: sha256(save), replaySha256: sha256(replay) };
  };
  return { game, archive, issue, capture };
}

const field = recorded(characterBattleCampaign(), 'from-save');
const factionId = field.game.turnOwnerId, enemy = field.game.factions[1]!.id;
const marshal = Object.values(field.game.characters).find(character => character.definitionId === 'character.marshal')!;
const fieldOrigin = field.capture();
field.issue({ type: 'declareWar', factionId, targetFactionId: enemy });
field.issue({ type: 'attack', factionId, armyId: 'army.2', targetArmyId: 'army.4' });
const fieldPending = field.capture();
field.issue({ type: 'useCommanderAbility', factionId, characterId: marshal.id, abilityId: 'ability.rally' });
const fieldRally = field.capture();
field.issue({ type: 'battleOrder', factionId, order: 'brace' });
if (field.game.battle?.combat.round !== 1) throw new Error('Expected genuine saved tactical round one.');
const fieldRoundOne = field.capture();
field.issue({ type: 'autoResolveBattle', factionId });
const fieldCompleted = field.capture();

const siege = recorded(conquestCampaign(), 'from-save');
const siegeOrigin = siege.capture();
siege.issue({ type: 'declareWar', factionId, targetFactionId: enemy });
siege.issue({ type: 'besiege', factionId, armyId: 'army.2', settlementId: 'settlement.6' });
siege.issue({ type: 'endTurn', factionId });
siege.issue({ type: 'assault', factionId, settlementId: 'settlement.6' });
const siegePending = siege.capture();
siege.issue({ type: 'battleOrder', factionId, order: 'brace' });
if (siege.game.battle?.combat.round !== 1) throw new Error('Expected genuine saved assault round one.');
const siegeRoundOne = siege.capture();
siege.issue({ type: 'autoResolveBattle', factionId });
const siegeCompleted = siege.capture();

const generated = recorded(createGame({ seed: 74, size: 'tiny', factionCount: 24, factionDefinitionId: 'faction.vesper_court', generatorVersion: 7, rosterVersion: 4, pace: 'short' }), 'complete');
const generatedOrigin = generated.capture();
generated.issue({ type: 'found', factionId: generated.game.turnOwnerId, armyId: 'army.1', name: 'Vesper battle-era witness' });
generated.issue({ type: 'endTurn', factionId: generated.game.turnOwnerId });
const generatedDeveloped = generated.capture();

const cases = { fieldOrigin, fieldPending, fieldRally, fieldRoundOne, fieldCompleted, siegeOrigin, siegePending, siegeRoundOne, siegeCompleted, generatedOrigin, generatedDeveloped };
const payload = { saveVersion: SAVE_VERSION, contentHash: CONTENT_HASH,
  provenance: 'Captured by unchanged schema13/content07a58d4f before battle9 rules. Field/siege origins are explicitly authored, funded existing fixtures; every recorded war, Rally, round and aftermath uses accepted ordinary commands. The Vesper24 origin is genuinely generated with ordinary founding/endTurn. All checkpoints independently strict-load and fully replay byte-exact.',
  cases };
process.stdout.write(JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload)).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, value.hash])) }));
