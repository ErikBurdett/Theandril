import assert from 'node:assert/strict';
import { replayArchive, resumeJournal } from '@theandril/chronicle';
import { deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { armyOrderFilterScene } from './army-order-filter-fixture';

/** Authored 101-company infrastructure, followed by ordinary recorded orders.
 * Reuses the real foreign obstruction and spent movement from the registry
 * fixture. Adds policies only; never authors route status or movement blockers.
 */
export function groupPatrolScene() {
  const base = armyOrderFilterScene();
  const { game, factionId } = base;
  const journal = resumeJournal(game, base.archive);
  const own = Object.values(game.armies).filter(army => army.factionId === factionId)
    .sort((a, b) => a.id.localeCompare(b.id));
  const beforeRoutes = structuredClone(game.routes), beforeArmies = structuredClone(game.armies);
  for (let index = 2; index < 99; index++) {
    const result = journal.record(game, {
      type: 'setPatrol', factionId, armyId: own[index]!.id,
      firstCell: 495, secondCell: 497, enabled: index % 2 === 1,
      pauseOnWar: index === 3,
    });
    assert(result.ok, result.error);
  }
  assert.deepEqual(game.routes, beforeRoutes);
  assert.deepEqual(game.armies, beforeArmies);
  const archive = journal.materialize();
  assert.equal(archive.records.length, 105);
  assert.equal(serializeGame(deserializeGame(serializeGame(game))), serializeGame(game));
  assert.equal(serializeGame(replayArchive(archive)), serializeGame(game));
  const policies = game.patrols.filter(patrol => patrol.factionId === factionId);
  const enabledIds = policies.filter(patrol => patrol.enabled).map(patrol => patrol.armyId).sort();
  const pausedIds = policies.filter(patrol => !patrol.enabled).map(patrol => patrol.armyId).sort();
  assert.equal(enabledIds.length, 49);
  assert.equal(pausedIds.length, 50);
  assert.equal(policies.find(patrol => patrol.armyId === own[3]!.id)!.pauseOnWar, true);
  assert.equal(game.routes[base.waiting.id]!.status, 'paused');
  assert.equal(game.routes[base.paused.id]!.status, 'active');
  assert.equal(game.armies[base.paused.id]!.movement, 0);
  const view = getObservation(game, factionId);
  assert.equal(view.patrols!.find(patrol => patrol.armyId === base.waiting.id)!.status, 'waiting');
  return {
    game, archive, factionId, hash: stateHash(game), enabledIds, pausedIds,
    policyIds: policies.map(patrol => patrol.armyId).sort(),
    noPolicy: [base.posted, base.blockedPosting], warPause: own[3]!,
    waiting: base.waiting, travelling: base.paused,
    counts: { armies: 101, policies: 99, enabled: 49, paused: 50, setupCommands: 105 },
  };
}
