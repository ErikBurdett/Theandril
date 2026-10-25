/** Outside test discovery: draft read-model contracts, not delivered UI proof. */
import assert from 'node:assert/strict';
import { applyCommand, getObservation } from '../../../packages/sim/src';
import { theaterCampaign } from '../../../packages/test-fixtures/src/theater-fixture';
import { armyOrderCounts, buildArmyOrderIndex, matchesArmyOrderFilter } from './army-order-status.draft';

const game = theaterCampaign(101), factionId = game.turnOwnerId;
const armies = Object.values(game.armies).filter(army => army.factionId === factionId);
const first = armies[0]!, last = armies[100]!;
assert(applyCommand(game, { type: 'setPosting', factionId, armyId: first.id, cell: 497, mode: 'hold' }).ok);
assert(applyCommand(game, { type: 'setPatrol', factionId, armyId: last.id, firstCell: 495, secondCell: 497, enabled: false }).ok);
const view = getObservation(game, factionId), before = structuredClone(view);
const index = buildArmyOrderIndex(view);
assert.equal(index.size, 101);
assert.equal(index.get(first.id)!.posting!.blocker, view.postings[0]!.blocker);
assert(matchesArmyOrderFilter(index.get(last.id)!, 'paused-patrols'));
assert(!matchesArmyOrderFilter(index.get(last.id)!, 'waiting'));
assert.deepEqual(armyOrderCounts([first.id, last.id, last.id, 'missing'], index), { all: 2, standing: 2, waiting: 1, 'paused-patrols': 1 });
assert.deepEqual(view, before);

// Explicit observation contracts below isolate facts independently of attention
// eligibility. They are not represented as strict saved campaign fixtures.
const paused = structuredClone(view);
paused.armies.find(army => army.id === last.id)!.movement = 0;
paused.routes = [{ armyId: last.id, origin: 495, waypoints: [0], path: [496], status: 'active', pauseReason: null, knownHostileIds: [] }];
let status = buildArmyOrderIndex(paused).get(last.id)!;
assert.equal(status.pausedPatrol, true); assert.equal(status.waiting, false); assert.equal(status.route!.targetCell, 0);
paused.routes[0]!.status = 'paused'; paused.routes[0]!.pauseReason = 'Observed route interruption.';
status = buildArmyOrderIndex(paused).get(last.id)!;
assert.equal(status.waiting, true); assert.equal(status.route!.pauseReason, 'Observed route interruption.');

const active = structuredClone(view), patrol = active.patrols![0]!;
patrol.enabled = true; patrol.status = 'waiting'; patrol.blocker = 'Canonical patrol refusal.';
assert.equal(buildArmyOrderIndex(active).get(last.id)!.waiting, true);
for (const state of ['ready', 'traveling', 'overridden'] as const) {
  patrol.status = state; patrol.lastError = 'A stale prior refusal.';
  assert.equal(buildArmyOrderIndex(active).get(last.id)!.waiting, false);
}

const filtered = structuredClone(view), foreign = { ...filtered.armies[0]!, id: 'foreign.army', factionId: 'foreign.realm' };
filtered.armies.push(foreign);
filtered.postings.push({ ...filtered.postings[0]!, armyId: foreign.id }, { ...filtered.postings[0]!, armyId: 'missing.army' });
filtered.patrols!.push({ ...filtered.patrols![0]!, armyId: first.id, factionId: foreign.factionId });
filtered.routes.push({ ...paused.routes[0]!, armyId: foreign.id });
const safe = buildArmyOrderIndex(filtered);
assert.equal(safe.size, 101); assert.equal(safe.get(first.id)!.patrol, null); assert(!safe.has(foreign.id));

const historical = { ...view, patrols: undefined };
assert.equal(buildArmyOrderIndex(historical).get(last.id)!.patrol, null);
const detached = buildArmyOrderIndex(view).get(first.id)!.posting!;
assert.notEqual(detached, view.postings[0]);
assert.deepEqual(armyOrderCounts([], index), { all: 0, standing: 0, waiting: 0, 'paused-patrols': 0 });
console.log('Draft owned-only projection contracts passed; no application or browser acceptance claimed.');
