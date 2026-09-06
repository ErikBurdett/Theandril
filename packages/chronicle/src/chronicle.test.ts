import { expect, test } from 'vitest';
import { createGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { applyRecordedCommand, createArchive, generateChronicles, parseArchive, replayArchive } from './index';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';

test('retains every command and event after the bounded campaign feed rotates', () => {
  const game = createGame({ seed: 17, size: 'tiny' });
  const archive = createArchive(game, { mode: 'watch' });
  for (let i = 0; i < 65; i++) expect(applyRecordedCommand(game, archive, { type: 'endTurn', factionId: game.turnOwnerId }).ok).toBe(true);
  expect(game.events).toHaveLength(200);
  expect(archive.records).toHaveLength(65);
  expect(archive.records.flatMap(record => record.events).filter(event => event.type === 'turn_started')).toHaveLength(260);
  expect(archive.records.flatMap(record => record.events)).toHaveLength(400); // Includes late upkeep shortfalls.
  expect(archive.records[0]?.turn).toBe(1);
  expect(archive.records.at(-1)?.afterTurn).toBe(66);
  expect(stateHash(replayArchive(parseArchive(JSON.parse(JSON.stringify(archive)) as unknown, game)))).toBe(stateHash(game));
  expect(getObservation(game, game.turnOwnerId)).not.toHaveProperty('archive');
  expect(() => generateChronicles(game, archive)).toThrow(/until victory/);
});

test('records refused orders without state changes, detaches caller data, and verifies exact replay', () => {
  const game = createGame({ seed: 19, size: 'tiny', factionCount: 2 });
  const archive = createArchive(game, { mode: 'player' });
  const hash = stateHash(game);
  const command = { type: 'move' as const, factionId: game.turnOwnerId, armyId: 'army.missing', target: 1 };
  expect(applyRecordedCommand(game, archive, command).ok).toBe(false);
  command.target = 20;
  expect(archive.records[0]?.command).toMatchObject({ target: 1 });
  expect(archive.records[0]?.error).toBeTruthy();
  expect(stateHash(game)).toBe(hash);
  expect(stateHash(replayArchive(archive))).toBe(hash);
  const changed = structuredClone(archive);
  changed.records[0]!.error = 'invented';
  expect(() => replayArchive(changed)).toThrow(/result mismatch/);
});

test('preserves completed tactical rounds, capture consequences and archive continuation', () => {
  const game = conquestCampaign();
  const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
  const factionId = CONQUEST_FIXTURE.playerFactionId;
  const issue = (command: Parameters<typeof applyRecordedCommand>[2]) => expect(applyRecordedCommand(game, archive, command).ok).toBe(true);
  issue({ type: 'declareWar', factionId, targetFactionId: CONQUEST_FIXTURE.enemyFactionId });
  issue({ type: 'besiege', factionId, armyId: CONQUEST_FIXTURE.playerArmyId, settlementId: CONQUEST_FIXTURE.settlementId });
  for (let i = 0; i < 3; i++) issue({ type: 'endTurn', factionId });
  issue({ type: 'assault', factionId, settlementId: CONQUEST_FIXTURE.settlementId });
  issue({ type: 'autoResolveBattle', factionId });
  expect(game.pendingCapture).not.toBeNull();
  issue({ type: 'resolveCapture', factionId, settlementId: CONQUEST_FIXTURE.settlementId, outcome: 'occupy' });
  const restored = parseArchive(JSON.parse(JSON.stringify(archive)) as unknown, game);
  expect(restored.records.flatMap(record => record.battles)).toHaveLength(1);
  expect(restored.records.flatMap(record => record.battles)[0]?.combat.log.length).toBeGreaterThan(0);
  expect(serializeGame(replayArchive(restored))).toBe(serializeGame(game));
  const missingReport = structuredClone(restored);
  missingReport.records.find(record => record.battles.length)!.battles = [];
  expect(() => parseArchive(missingReport, game)).toThrow(/battle report/);
  expect(() => replayArchive(missingReport)).toThrow(/battle mismatch/);
});

test('rejects discontinuity, mismatched campaign, and false complete-history claims', () => {
  const game = createGame({ seed: 21, size: 'tiny', factionCount: 2 });
  const archive = createArchive(game, { mode: 'player' });
  applyRecordedCommand(game, archive, { type: 'endTurn', factionId: game.turnOwnerId });
  const broken = structuredClone(archive);
  broken.records[0]!.sequence = 7;
  expect(() => parseArchive(broken, game)).toThrow(/sequence/);
  const foreign = createGame({ seed: 22, size: 'tiny', factionCount: 2 });
  expect(() => parseArchive(archive, foreign)).toThrow(/different campaign/);
  expect(() => parseArchive(createArchive(game, { mode: 'watch' }), game)).toThrow(/generated campaign start/);
  expect(parseArchive(createArchive(game, { mode: 'watch', coverage: 'from-save' }), game).coverage).toBe('from-save');
  const other = createGame({ seed: 21, size: 'tiny', factionCount: 2 });
  const otherArchive = createArchive(other, { mode: 'watch' });
  applyRecordedCommand(other, otherArchive, { type: 'found', factionId: other.turnOwnerId, armyId: 'army.1', name: 'Different history' });
  applyRecordedCommand(other, otherArchive, { type: 'endTurn', factionId: other.turnOwnerId });
  expect(() => parseArchive(archive, other)).toThrow(/latest checkpoint/);
});
