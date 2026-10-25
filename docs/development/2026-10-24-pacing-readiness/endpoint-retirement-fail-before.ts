/** Standalone draft, outside test discovery. Intentionally fails on the retained
 * missing-retirement policy after proving genuine input and ordinary cleanup. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { hexDistance } from '../../../packages/mapgen/src';
import { applyCommand, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameCommand } from '../../../packages/sim/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';
import { planPatrol } from '../../../packages/ai/src/patrols';
import { planTurnWithReasons } from '../../../packages/ai/src';
import { heldDelegatedArmyIds } from '../../../packages/ai/src/theaters';

const capturedPath = new URL('../2026-10-24-patrol-recovery/diagnosis-recovered/snapshot-3-turn-150.json', import.meta.url);
const bytes = readFileSync(capturedPath, 'utf8'), sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, 'e8b68f936e8f7042f04465f879e669ef038cc27a9c927781fe368075a9e92b25');
const game = deserializeGame(bytes), factionId = 'faction.wardhall_remnant', armyId = 'army.408';
assert.equal(stateHash(game), '4f60f2e3');
const view = getObservation(game, factionId), unchanged = structuredClone(view);
const patrol = view.patrols!.find(item => item.armyId === armyId)!;
const town = view.settlements.find(item => item.cell === patrol.secondCell)!;
assert.equal(town.id, 'settlement.517'); assert.equal(town.factionId, 'faction.ashen_compact');
assert.equal(view.cells.find(cell => cell.cell === town.cell)?.visible, true, 'Captured owner must be currently observed, not inferred from hidden current state.');
assert.equal(view.settlements.find(item => item.cell === patrol.firstCell)?.factionId, factionId);
assert(patrol.enabled && !patrol.pauseOnWar);
assert.equal(patrol.status, 'waiting');
const route = structuredClone(game.routes[armyId]);
assert.equal(route?.status, 'paused'); assert.deepEqual(route.waypoints, [patrol.targetCell]);
assert.equal(patrol.targetCell, town.cell);
const preview = getMovementPreview(view, armyId, town.cell);
assert.equal(preview.action, 'besiege'); assert.equal(preview.canQueue, false);
assert(heldDelegatedArmyIds(view).has(armyId));
const before = planPatrol(view), full = planTurnWithReasons(view);
assert.deepEqual(view, unchanged); assert.equal(stateHash(game), '4f60f2e3');
const actorOrders = full.commands.filter(command => 'armyId' in command && command.armyId === armyId
  || 'sourceArmyId' in command && (command.sourceArmyId === armyId || command.targetArmyId === armyId));

const plans = readFileSync(new URL('../2026-10-24-patrol-recovery/diagnosis-recovered/proposals.jsonl', import.meta.url), 'utf8')
  .trim().split('\n').map(line => JSON.parse(line) as { planSequence: number; turn: number; commands: GameCommand[] });
const capture = plans.find(plan => plan.turn === 150 && plan.commands.some(command => command.type === 'resolveCapture'
  && command.settlementId === town.id && command.factionId === town.factionId));
assert.equal(capture?.planSequence, 1794);

// Demonstrate legal cleanup separately; do not inject it into the retained run.
const branch = deserializeGame(bytes), mirror = deserializeGame(bytes), journal = createJournal(branch, { mode: 'watch', coverage: 'from-save' });
const clear = { type: 'clearPatrol' as const, factionId, armyId };
const result = journal.record(branch, clear); assert(result.ok, result.error);
assert.deepEqual(applyCommand(mirror, clear), result);
assert.deepEqual(branch.routes[armyId], route, 'Clearing the future circuit must preserve every direct-route field.');
assert(!heldDelegatedArmyIds(getObservation(branch, factionId)).has(armyId));
assert.equal(stateHash(mirror), stateHash(branch));
assert.equal(stateHash(deserializeGame(serializeGame(branch))), stateHash(branch));
assert.equal(stateHash(replayArchive(journal.materialize())), stateHash(branch));

// Controls use real configuration commands, not fabricated observation flags.
const disabled = deserializeGame(bytes);
assert(applyCommand(disabled, { type: 'setPatrolEnabled', factionId, armyId, enabled: false }).ok);
const disabledPlan = planPatrol(getObservation(disabled, factionId));
assert.deepEqual(disabledPlan.commands, [], 'An explicitly disabled policy must remain configured.');
const optedIn = deserializeGame(bytes);
assert(applyCommand(optedIn, { type: 'setPatrol', factionId, armyId, firstCell: patrol.secondCell, secondCell: patrol.firstCell, enabled: true, pauseOnWar: true }).ok);
const optedInView = getObservation(optedIn, factionId);
assert.equal(optedInView.patrols!.find(item => item.armyId === armyId)!.targetCell, route.waypoints[0]);
assert.deepEqual(planPatrol(optedInView).commands, [], 'The explicit wartime-pause policy is not the persistent home-circuit default.');

const direct = deserializeGame(bytes), army = view.armies.find(item => item.id === armyId)!;
const targets = view.cells.filter(cell => cell.cell !== patrol.firstCell && cell.cell !== patrol.secondCell && cell.terrain !== 0
  && hexDistance(army.cell, cell.cell, view.width) >= 5 && hexDistance(army.cell, cell.cell, view.width) <= 8).slice(0, 24);
const alternative = targets.find(cell => { const quote = getMovementPreview(view, armyId, cell.cell); return quote.action === 'move' && quote.canQueue && quote.cost > army.movement; });
assert(alternative, 'A real distinct direct route is required for the control.');
assert(applyCommand(direct, { type: 'queueMovement', factionId, armyId, target: alternative.cell }).ok);
const directRoute = structuredClone(direct.routes[armyId]); assert(directRoute);
assert.notDeepEqual(directRoute.waypoints, [patrol.targetCell]);
const directPlan = planPatrol(getObservation(direct, factionId));
assert.deepEqual(directPlan.commands, [], 'Different direct travel does not identify a stranded home leg.');
assert.deepEqual(direct.routes[armyId], directRoute);

const output = new URL('endpoint-retirement-fail-before.json', import.meta.url);
assert(!existsSync(output), 'Preserve existing fail-before evidence.');
const evidence = { scope: 'Genuine corrected campaign snapshot; local clear-command branch and explicit-policy controls, not a pacing run.',
  snapshot: capturedPath.pathname, sha256, stateHash: stateHash(game), captureProposal: capture, armyId, factionId,
  observedCapturedHearth: { id: town.id, cell: town.cell, factionId: town.factionId, currentlyVisible: true }, patrol, route, preview,
  actualPatrolPlan: { ...before, heldArmyIds: [...before.heldArmyIds] }, actualFullPlanActorCommands: actorOrders,
  cleanup: { command: clear, result, routeExact: true, heldAfter: false, mirrorAndReplayExact: true, hash: stateHash(branch) },
  controls: { disabledCommands: disabledPlan.commands, pauseOnWarCommands: planPatrol(optedInView).commands, differentDirectRouteCommands: directPlan.commands, differentDirectRoute: directRoute },
};
writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ snapshotHash: stateHash(game), capturedTown: town.id, currentlyVisible: true, actualCommands: before.commands,
  held: before.heldArmyIds.has(armyId), fullActorOrders: actorOrders, cleanupHash: stateHash(branch), controlsPassed: true }));
assert.deepEqual(before.commands, [clear], 'FAIL BEFORE: an AI-controlled persistent home circuit still reserves its company after its currently visible endpoint was captured.');
