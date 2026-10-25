import assert from 'node:assert/strict';
import { createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { createJournal, replayArchive } from '@theandril/chronicle';
import { theaterCampaign } from '../../packages/test-fixtures/src/theater-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';

/** Authored open terrain, two hearths, treasury and 101 companies, not earned
 * recruitment. One foreign guard and names are authored before the archive.
 * Every posting, patrol, obstruction, route and spent movement below then comes
 * from real commands. No hand-authored blocker, route status or movement=0.
 */
export function armyOrderFilterScene() {
  let game = theaterCampaign(101);
  const factionId = game.turnOwnerId;
  const own = Object.values(game.armies).filter(army => army.factionId === factionId)
    .sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(own.length, 101);
  own.forEach((army, index) => { army.name = `Registry company ${String(index + 1).padStart(3, '0')}`; });
  const posted = own[0]!, blockedPosting = own[1]!, waiting = own[99]!, paused = own[100]!;
  const foreignId = game.factions.find(faction => faction.id !== factionId)!.id;
  const obstructionId = `army.${game.nextId++}`;
  game.armies[obstructionId] = { id: obstructionId, factionId: foreignId, name: 'Authored road obstruction', cell: 547, movement: 3,
    formations: [createArmyFormation(obstructionId, 'unit.guard')] };
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const issue = (command: GameCommand) => {
    const result = journal.record(game, command);
    assert(result.ok, `${command.type}: ${result.error}`);
  };
  issue({ type: 'setPatrol', factionId, armyId: waiting.id, firstCell: 495, secondCell: 510, enabled: true });
  issue({ type: 'queueMovement', factionId, armyId: waiting.id, target: 510 });
  assert.equal(game.armies[waiting.id]!.movement, 0);
  assert.equal(game.routes[waiting.id]!.path[0], 499);
  issue({ type: 'move', factionId: foreignId, armyId: obstructionId, target: 499 });
  issue({ type: 'endTurn', factionId });
  assert.equal(game.routes[waiting.id]!.status, 'paused');
  issue({ type: 'setPosting', factionId, armyId: posted.id, cell: 495, mode: 'hold' });
  issue({ type: 'setPosting', factionId, armyId: blockedPosting.id, cell: 0, mode: 'hold' });
  issue({ type: 'setPatrol', factionId, armyId: paused.id, firstCell: 495, secondCell: 497, enabled: false });
  issue({ type: 'queueMovement', factionId, armyId: paused.id, target: 510 });

  const archive = journal.materialize(), hash = stateHash(game);
  game = deserializeGame(serializeGame(game));
  assert.equal(stateHash(game), hash);
  assert.equal(serializeGame(replayArchive(archive)), serializeGame(game));
  const view = getObservation(game, factionId);
  assert.equal(view.armies.filter(army => army.factionId === factionId).length, 101);
  assert.equal(game.armies[paused.id]!.movement, 0);
  assert.equal(game.routes[paused.id]!.status, 'active');
  assert.equal(game.routes[paused.id]!.waypoints.at(-1), 510);
  assert.equal(view.patrols!.find(patrol => patrol.armyId === paused.id)!.status, 'paused');
  assert.equal(view.patrols!.find(patrol => patrol.armyId === waiting.id)!.status, 'waiting');
  assert.equal(view.postings.find(posting => posting.armyId === posted.id)!.blocker, null);
  assert(view.postings.find(posting => posting.armyId === blockedPosting.id)!.blocker);
  const actualWaiting = new Set([
    ...view.postings.filter(posting => posting.blocker !== null).map(posting => posting.armyId),
    ...view.patrols!.filter(patrol => patrol.enabled && patrol.status === 'waiting').map(patrol => patrol.armyId),
    ...view.routes.filter(route => route.status === 'paused').map(route => route.armyId),
  ]);
  assert.deepEqual([...actualWaiting].sort(), [blockedPosting.id, waiting.id].sort());
  const actors = [posted, blockedPosting, waiting, paused].map(army => ({ id: army.id, name: army.name }));
  return { game, archive, hash, factionId, posted: actors[0]!, blockedPosting: actors[1]!, waiting: actors[2]!, paused: actors[3]!,
    postingReason: view.postings.find(posting => posting.armyId === blockedPosting.id)!.blocker!,
    waitingReason: view.patrols!.find(patrol => patrol.armyId === waiting.id)!.blocker!,
    route: structuredClone(game.routes[paused.id]!), counts: { all: 101, standing: 4, waiting: 2, paused: 1 } };
}
