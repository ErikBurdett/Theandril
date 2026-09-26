import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { CONTENT_HASH } from '@theandril/content';
import { applyRecordedCommand, createArchive, replayArchive } from '@theandril/chronicle';
import { createGame, deserializeGame, serializeGame, stateHash, SAVE_VERSION, type GameCommand, type GameState } from '@theandril/sim';
import { navalCampaign, NAVAL_FIXTURE as N } from '../packages/test-fixtures/src/naval-fixture';

if (Number(SAVE_VERSION) !== 31 || CONTENT_HASH !== '015468d1') throw new Error('Capture requires unchanged rules31/content015468d1 before saved groups.');
const sourceRevision = process.argv[2];
if (!sourceRevision || !/^[a-f0-9]{40}$/.test(sourceRevision)) throw new Error('Pass the independently checked full source HEAD as the first argument.');
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
const generated = createGame({ seed: 20260925, size: 'tiny', factionCount: 2, pace: 'standard' });
const ordinary = record(generated, 'generated', 'complete');
ordinary.capture('Origin');
ordinary.issue({ type: 'found', factionId: generated.turnOwnerId, armyId: 'army.1', name: 'Remembered hearth' });
const town = Object.values(generated.settlements)[0]!;
ordinary.issue({ type: 'setCharter', factionId: generated.turnOwnerId, settlementId: town.id, focus: 'wealth', ceiling: 24 });
ordinary.issue({ type: 'setPosting', factionId: generated.turnOwnerId, armyId: 'army.2', cell: generated.armies['army.2']!.cell, mode: 'hold' });
for (let turn = 0; turn < 3; turn++) ordinary.issue({ type: 'endTurn', factionId: generated.turnOwnerId });
ordinary.capture('Continued');
const naval = navalCampaign({ enemyFleet: false }), factionId = naval.turnOwnerId;
const voyage = record(naval, 'naval', 'from-save');
voyage.capture('Origin');
voyage.issue({ type: 'assignCharacter', factionId, characterId: N.marshalId, armyId: N.cargoId });
voyage.issue({ type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
voyage.issue({ type: 'embarkArmy', factionId, armyId: N.cargoId, fleetId: N.fleetId });
voyage.issue({ type: 'queueMovement', factionId, armyId: N.fleetId, target: N.landingWaterCell });
for (let turn = 0; turn < 3; turn++) voyage.issue({ type: 'endTurn', factionId });
voyage.capture('Embarked');
const target = 'packages/chronicle/src/fixtures/v31-selection-groups-baseline.json';
const payload = { version: 31, contentHash: CONTENT_HASH,
  sourceRevision,
  provenance: 'Captured before any canonical rules32 changes. Generated seeded origin and ordinary founding, charter, posting and turn commands; separately authored navalCampaign origin followed by recorded character assignment, research, boarding, travel and three turns under genuine finite rules31 provisions. Every checkpoint strict-loaded and fully replayed byte-identically before capture.', cases };
writeFileSync(target, JSON.stringify({ encoding: 'gzip-base64', payload: gzipSync(JSON.stringify(payload)).toString('base64'), hashes: Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, (value as { hash: string }).hash])) }, null, 2) + '\n');
console.log({ target, sourceRevision: payload.sourceRevision, hashes: Object.fromEntries(Object.entries(cases).map(([key, value]) => [key, (value as { hash: string }).hash])), saveVersion: SAVE_VERSION });
