import { expect, test } from 'vitest';
import { createArchive, applyRecordedCommand, replayArchive } from '../../chronicle/src/index';
import { borderBattleCampaign } from '../../test-fixtures/src/combat-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { roadsCampaign } from '../../test-fixtures/src/roads-fixture';
import { conquestCampaign, CONQUEST_FIXTURE } from '../../test-fixtures/src/conquest-fixture';
import { applyCommand, deserializeGame, getMovementQuery, getObservation, serializeGame, stateHash, type GameCommand } from './index';
import { observeRoads, roadDirection } from './roads';
import { assaultObjection } from './siege';

test.each(['attack', 'moveTo'] as const)('%s honors the previewed road cost when only one movement remains', type => {
  const game = borderBattleCampaign(), attacker = game.armies['army.2']!, defender = game.armies['army.4']!;
  // Authored battlefield infrastructure; ordinary road construction is separately
  // covered. Strict save validation checks both physical and remembered edges.
  game.world.terrain[defender.cell] = 3; game.world.biome[defender.cell] = 3; game.world.waterDepth[defender.cell] = 0;
  game.roads.edges[attacker.cell] = 1 << roadDirection(attacker.cell, defender.cell, game.world.width);
  game.roads.edges[defender.cell] = 1 << roadDirection(defender.cell, attacker.cell, game.world.width);
  attacker.movement = 1; refreshAuthoredSight(game);
  expect(applyCommand(game, { type: 'declareWar', factionId: attacker.factionId, targetFactionId: defender.factionId }).ok).toBe(true);
  const restored = deserializeGame(serializeGame(game)), archive = createArchive(restored, { mode: 'player', coverage: 'from-save' });
  expect(getMovementQuery(getObservation(restored, attacker.factionId), attacker.id, defender.cell).preview).toMatchObject({ action: 'attack', cost: 1, canMoveNow: true });
  const command: GameCommand = type === 'attack' ? { type, factionId: attacker.factionId, armyId: attacker.id, targetArmyId: defender.id }
    : { type, factionId: attacker.factionId, armyId: attacker.id, target: defender.cell };
  const result = applyRecordedCommand(restored, archive, command);
  expect(result.ok, result.error).toBe(true); expect(result.events.some(event => event.type === 'battle_started')).toBe(true);
  expect(restored.battle).toMatchObject({ attackerId: attacker.id, defenderId: defender.id });
  expect(restored.armies[attacker.id]?.movement).toBe(0);
  expect(serializeGame(replayArchive(archive))).toBe(serializeGame(restored));
  expect(stateHash(deserializeGame(serializeGame(restored)))).toBe(stateHash(restored));
});

test('a project reusing a completed physical segment refuses duplicate payment and advances freely', () => {
  let game = roadsCampaign();
  const project = Object.values(game.roads.projects)[0]!;
  const order: GameCommand = { type: 'accelerateRoad', factionId: game.turnOwnerId, settlementId: project.settlementId };
  expect(applyCommand(game, order).ok).toBe(true);
  // A newly surveyed project may follow a road completed by another project.
  // Author only its unfinished work cursor, retaining the ordinarily paid edge.
  project.completed = 0; project.progress = 1;
  game = deserializeGame(serializeGame(game));
  const before = serializeGame(game), roads = structuredClone(game.roads.edges);
  const quote = observeRoads(game, game.turnOwnerId)[0]!;
  expect(quote).toMatchObject({ canAccelerate: false, coinCost: 0 });
  expect(quote.blocker).toMatch(/already built/);
  expect(applyCommand(game, order).ok).toBe(false); expect(serializeGame(game)).toBe(before);
  const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
  const result = applyRecordedCommand(game, archive, { type: 'endTurn', factionId: game.turnOwnerId });
  expect(result.ok).toBe(true); expect(game.roads.edges).toEqual(roads);
  expect(game.roads.projects[project.settlementId]).toMatchObject({ completed: 1, progress: 0 });
  expect(result.events.some(event => event.type === 'road_segment_reused')).toBe(true);
  expect(observeRoads(game, game.turnOwnerId)[0]).toMatchObject({ canAccelerate: true, coinCost: 24 });
  expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
});

test('a siege assault applies the same road entry cost and records the real battle', () => {
  const game = conquestCampaign(), attacker = game.armies[CONQUEST_FIXTURE.playerArmyId]!, town = game.settlements[CONQUEST_FIXTURE.settlementId]!;
  game.world.terrain[town.cell] = 3; game.world.biome[town.cell] = 3;
  game.roads.edges[attacker.cell] = 1 << roadDirection(attacker.cell, town.cell, game.world.width);
  game.roads.edges[town.cell] = 1 << roadDirection(town.cell, attacker.cell, game.world.width);
  refreshAuthoredSight(game);
  for (const command of [
    { type: 'declareWar', factionId: attacker.factionId, targetFactionId: town.factionId },
    { type: 'besiege', factionId: attacker.factionId, armyId: attacker.id, settlementId: town.id },
    { type: 'endTurn', factionId: game.turnOwnerId },
  ] satisfies GameCommand[]) expect(applyCommand(game, command).ok).toBe(true);
  attacker.movement = 1;
  const restored = deserializeGame(serializeGame(game)), archive = createArchive(restored, { mode: 'player', coverage: 'from-save' });
  expect(assaultObjection(restored, attacker.factionId, town.id)).toBeNull();
  expect(applyRecordedCommand(restored, archive, { type: 'assault', factionId: attacker.factionId, settlementId: town.id }).ok).toBe(true);
  expect(restored.battle?.settlementId).toBe(town.id);
  expect(serializeGame(replayArchive(archive))).toBe(serializeGame(restored));
});
