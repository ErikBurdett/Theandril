import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { CONTENT_HASH } from '@theandril/content';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';
import { createGame, deserializeGame, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { navalCampaign, NAVAL_FIXTURE as N } from '../packages/test-fixtures/src/naval-fixture';

if (Number(SAVE_VERSION) !== 30 || CONTENT_HASH !== '015468d1') throw new Error('Capture requires unchanged rules30/content015468d1 before fleet provisions.');
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
const generated = createGame({ seed: 20260923, size: 'tiny', factionCount: 2, pace: 'standard' });
const ordinary = record(generated, 'generated', 'complete');
ordinary.capture('Origin');
ordinary.issue({ type: 'found', factionId: generated.turnOwnerId, armyId: 'army.1', name: 'Unbroken harbour' });
for (let turn = 0; turn < 3; turn++) ordinary.issue({ type: 'endTurn', factionId: generated.turnOwnerId });
ordinary.capture('Continued');

const naval = navalCampaign({ enemyFleet: false }), factionId = naval.turnOwnerId;
const voyage = record(naval, 'naval', 'from-save');
voyage.capture('Origin');
voyage.issue({ type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId });
voyage.issue({ type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
voyage.issue({ type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
voyage.issue({ type: 'queueMovement', factionId, armyId: N.fleetId, target: N.landingWaterCell });
voyage.capture('Embarked');
for (let turn = 0; turn < 12; turn++) voyage.issue({ type: 'endTurn', factionId });
voyage.capture('AtSeaTwelveTurns');
voyage.issue({ type: 'disembarkArmy', factionId, armyId: N.cargoId, target: N.landingCell });
voyage.capture('Landed');

const payload = { version: 30, contentHash: CONTENT_HASH,
  provenance: 'Captured on unchanged rules30/content015468d1 before rules31 fleet provisions. Generated cases use seeded geography and recorded founding/end-turn commands. Naval cases use the existing authored navalCampaign fixture with funded harbours and ships, then real recorded assignment, research, boarding, a queued ocean voyage, twelve end turns and landing. Every checkpoint strict-loads and fully replays byte-identically before capture; neither stores nor outcomes are authored.', cases };
const target = 'packages/chronicle/src/fixtures/v30-fleet-provisions-baseline.json';
writeFileSync(target, JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload)).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, (value as { hash: string }).hash])) }, null, 2) + '\n');
console.log({ target, cases: Object.keys(cases), contentHash: CONTENT_HASH, saveVersion: SAVE_VERSION });
