import assert from 'node:assert/strict';
import { createJournal, replayArchive } from '@theandril/chronicle';
import { deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { empireDelegationCampaign } from '../../packages/test-fixtures/src/empire-delegation-fixture';

/** Authored mature ownership/infrastructure, not earned conquest. The existing
 * delegation fixture supplies 30 own hearths, 128 companies and two real wars.
 * Only a finite treasury is authored before this from-save journal;
 * every subsequent queue/charter configuration is an ordinary recorded command.
 */
export function settlementOrderScene() {
  const base = empireDelegationCampaign();
  let game = base.game;
  const factionId = game.turnOwnerId;
  const towns = Object.values(game.settlements).filter(town => town.factionId === factionId)
    .sort((a, b) => a.id.localeCompare(b.id));
  assert.equal(towns.length, 30);
  game.factions.find(faction => faction.id === factionId)!.treasury = 4_000;
  game = deserializeGame(serializeGame(game));
  const owned = towns.map(town => game.settlements[town.id]!);
  const alreadyQueued = owned.filter(town => town.queue.length > 0);
  assert.equal(alreadyQueued.length, 1);
  const empty = owned.filter(town => town.queue.length === 0);
  const direct = [...alreadyQueued, ...empty.slice(0, 9)];
  const chartered = empty.slice(9);
  const queuedCharters = chartered.slice(0, 4), ready = chartered.slice(4, 15), waiting = chartered.slice(15);
  assert.equal(waiting.length, 5);
  const baseHash = stateHash(game);
  const journal = createJournal(game, { mode: 'player', coverage: 'from-save' });
  const issue = (command: GameCommand) => {
    const result = journal.record(game, command);
    assert(result.ok, `${command.type}: ${result.error}`);
  };
  for (const town of direct) issue({ type: 'setCharter', factionId, settlementId: town.id, focus: 'none', ceiling: 4 });
  for (const town of [...queuedCharters, ...ready]) issue({ type: 'setCharter', factionId, settlementId: town.id, focus: 'muster', ceiling: 24 });
  for (const town of [direct[1]!, ...queuedCharters]) issue({ type: 'queue', factionId, settlementId: town.id, itemId: 'unit.guard' });
  const archive = journal.materialize(), hash = stateHash(game);
  assert.equal(archive.records.length, 30);
  game = deserializeGame(serializeGame(game));
  assert.equal(serializeGame(replayArchive(archive)), serializeGame(game));
  const view = getObservation(game, factionId, { landDetails: 'none', developmentCandidates: false });
  const ownView = view.settlements.filter(town => town.factionId === factionId);
  assert.equal(ownView.length, 30);
  assert.equal(view.armies.filter(army => army.factionId === factionId).length, 128);
  assert.equal(view.wars.length, 2);
  const charters = new Map(view.charters.map(charter => [charter.settlementId, charter]));
  const counts = {
    all: ownView.length,
    empty: ownView.filter(town => town.queue.length === 0).length,
    unchartered: ownView.filter(town => !charters.has(town.id)).length,
    waiting: ownView.filter(town => town.queue.length === 0 && charters.get(town.id)?.blocker != null).length,
  };
  assert.deepEqual(counts, { all: 30, empty: 24, unchartered: 10, waiting: 5 });
  for (const town of queuedCharters) {
    assert.equal(charters.get(town.id)!.blocker, null);
    assert.equal(charters.get(town.id)!.itemName, null);
  }
  for (const town of ready) { assert.equal(charters.get(town.id)!.blocker, null); assert(charters.get(town.id)!.itemName); }
  for (const town of waiting) assert.match(charters.get(town.id)!.blocker!, /raise the ceiling/);
  const actor = (town: typeof owned[number]) => ({ id: town.id, name: town.name });
  return { game, archive, hash, baseHash, factionId, counts,
    authored: `${base.authored} 4,000 coin is authored before this from-save archive; its 30 setup records revoke ten charters, raise fifteen ceilings and purchase five guard queues.`,
    direct: direct.map(actor), queuedCharters: queuedCharters.map(actor), ready: ready.map(actor), waiting: waiting.map(actor),
    first: actor(owned[0]!), last: actor(owned.at(-1)!),
    waitingReason: charters.get(waiting[0]!.id)!.blocker!, candidate: charters.get(ready[0]!.id)!.itemName!,
  };
}
