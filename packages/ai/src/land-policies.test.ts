import { expect, test } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { createArchive, applyRecordedCommand, parseArchive, replayArchive } from '../../chronicle/src/index';
import { planLand } from './land';

function scene() {
  const game = createGame({ seed: 74, size: 'tiny', factionCount: 1, pace: 'epic' });
  const factionId = game.turnOwnerId;
  expect(applyCommand(game, { type: 'found', factionId, armyId: 'army.1', name: 'Commission witness' }).ok).toBe(true);
  game.factions[0]!.treasury = 500; // Authored budget; geography, quotes and orders remain canonical.
  for (const command of planLand(getObservation(game, factionId), 0).commands) expect(applyCommand(game, command).ok).toBe(true);
  return game;
}

test('AI commissions exactly its existing paid choice, consumes its one-job allowance and preserves saved replay', () => {
  const game = scene(), factionId = game.turnOwnerId;
  const view = getObservation(game, factionId), before = stateHash(game);
  const old = structuredClone(view); delete old.landPolicies;
  const direct = planLand(old, 100), plan = planLand(view, direct.coinSpent);
  const manual = direct.commands.find(command => command.type === 'improveTile');
  const commission = plan.commands.find(command => command.type === 'setLandPolicy');
  expect(manual).toBeDefined(); expect(commission).toBeDefined();
  if (manual?.type !== 'improveTile' || commission?.type !== 'setLandPolicy') throw new Error('Missing paired land choice');
  expect(commission).toMatchObject({ settlementId: manual.settlementId, improvementId: manual.improvementId, allowance: direct.coinSpent, reserve: 0 });
  expect(plan.coinSpent).toBe(direct.coinSpent); expect(stateHash(game)).toBe(before);
  const mirror = deserializeGame(serializeGame(game));
  // Earlier planner purchases reduce the actual balance; the remaining budget
  // already includes them. A second reserve based on old view.treasury would
  // incorrectly leave this order waiting instead of paying its quoted cost.
  const earlier: GameCommand = { type: 'queue', factionId, settlementId: manual.settlementId, itemId: 'building.granary' };
  expect(applyCommand(game, earlier).ok).toBe(true); expect(applyCommand(mirror, earlier).ok).toBe(true);
  const archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
  const issued = applyRecordedCommand(game, archive, commission);
  expect(issued.ok).toBe(true); expect(issued.events.some(event => event.type === 'land_work_started')).toBe(true);
  expect(applyCommand(mirror, manual).ok).toBe(true);
  expect(game.land.settlements[manual.settlementId]!.work).toEqual(mirror.land.settlements[manual.settlementId]!.work);
  expect(game.factions[0]!.treasury).toBe(mirror.factions[0]!.treasury);
  expect(game.landPolicies[0]!.allowance).toBe(0);
  const end = { type: 'endTurn', factionId } as const;
  for (let turn = 0; turn < 8; turn++) {
    expect(applyRecordedCommand(game, archive, end).ok).toBe(true); expect(applyCommand(mirror, end).ok).toBe(true);
    expect(game.land.settlements[manual.settlementId]).toEqual(mirror.land.settlements[manual.settlementId]);
    expect(game.factions[0]!.treasury).toBe(mirror.factions[0]!.treasury);
  }
  expect(stateHash(deserializeGame(serializeGame(game)))).toBe(stateHash(game));
  expect(stateHash(replayArchive(parseArchive(archive, game)))).toBe(stateHash(game));
});

test('AI keeps direct work when a worker change or incomplete view prevents identical-candidate proof', () => {
  const game = scene(), view = getObservation(game, game.turnOwnerId);
  expect(planLand(view, 100).commands.some(command => command.type === 'setLandPolicy')).toBe(true);
  const changing = structuredClone(view); changing.land.settlements[0]!.worked = [];
  const changedPlan = planLand(changing, 100);
  expect(changedPlan.commands.some(command => command.type === 'setWorkedTiles')).toBe(true);
  expect(changedPlan.commands.some(command => command.type === 'setLandPolicy')).toBe(false);
  const incomplete = structuredClone(view), land = incomplete.land.settlements[0]!;
  // An off-page worker is retained by the existing paged allocation planner.
  // Its missing quote prevents proving which cell a commission would select.
  const offPage = land.cells.find(cell => cell.claimed && cell.canWork && !land.worked.includes(cell.cell));
  expect(offPage).toBeDefined();
  land.worked.push(offPage!.cell); land.workerCapacity++;
  land.cells = land.cells.filter(cell => cell.cell !== offPage!.cell);
  land.cellWindow = { offset: 0, limit: 64, total: 65 };
  expect(planLand(incomplete, 100).commands.some(command => command.type === 'setLandPolicy')).toBe(false);
});

test('AI respects an existing funded commission and never treats it as free discretionary work', () => {
  const game = scene(), view = getObservation(game, game.turnOwnerId), town = view.land.settlements[0]!;
  view.landPolicies = [{ settlementId: town.settlementId, factionId: view.factionId, improvementId: 'improvement.terraced_fields', allowance: 100, reserve: 40, blocker: null }];
  const plan = planLand(view, 200);
  expect(plan.coinSpent).toBe(0);
  expect(plan.commands.some(command => command.type === 'setLandPolicy' || command.type === 'improveTile' || command.type === 'terraformTile' || command.type === 'claimCell')).toBe(false);
});
