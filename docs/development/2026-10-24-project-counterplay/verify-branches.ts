import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { applyCommand, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameCommand } from '../../../packages/sim/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';
import { planTurnWithReasons } from '../../../packages/ai/src';
const dir = new URL('./', import.meta.url), bytes = readFileSync(new URL('near-complete.theandril', dir), 'utf8');
const actor = 'faction.reedbound_council', rival = 'faction.ashen_compact', armyId = 'army.4', settlementId = 'settlement.5';
const siege: GameCommand = { type: 'besiege', factionId: actor, armyId, settlementId };
const offer: GameCommand = { type: 'proposePeace', factionId: rival, targetFactionId: actor, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } };
function branch() {
  const game = deserializeGame(bytes), mirror = deserializeGame(bytes), journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
  const history: unknown[] = [];
  const issue = (command: GameCommand, accepted = true) => {
    const result = journal.record(game, command); assert.equal(result.ok, accepted, JSON.stringify({ command, result }));
    assert.deepEqual(applyCommand(mirror, command), result);
    assert.equal(stateHash(game), stateHash(mirror)); assert.equal(stateHash(deserializeGame(serializeGame(game))), stateHash(game));
    history.push({ command, result }); return result;
  };
  const seal = () => {
    assert.equal(stateHash(replayArchive(journal.materialize())), stateHash(game));
    return { finalHash: stateHash(game), turn: game.turn, project: game.projects[0], victory: game.victory, history };
  };
  return { game, issue, seal };
}
const incoming = branch(); incoming.issue(offer);
const incomingPlan = planTurnWithReasons(getObservation(incoming.game, actor));
assert.deepEqual(incomingPlan.commands.map(command => [command.type, 'accept' in command && command.accept]), [['respondPeace', true]]);
for (const command of incomingPlan.commands) incoming.issue(command);
const peaceBlocker = incoming.issue({ type: 'declareWar', factionId: actor, targetFactionId: rival }, false).error;
incoming.issue(siege, false); incoming.issue({ type: 'endTurn', factionId: incoming.game.turnOwnerId });
assert.equal(incoming.game.victory?.factionId, rival);

const outgoing = branch(), outgoingPlan = planTurnWithReasons(getObservation(outgoing.game, actor));
assert.equal(outgoingPlan.commands[0]?.type, 'proposePeace');
for (const command of outgoingPlan.commands) outgoing.issue(command);
const answer = planTurnWithReasons(getObservation(outgoing.game, rival));
assert.deepEqual(answer.commands.map(command => [command.type, 'accept' in command && command.accept]), [['respondPeace', true]]);
for (const command of answer.commands) outgoing.issue(command);
outgoing.issue({ type: 'endTurn', factionId: outgoing.game.turnOwnerId });
assert.equal(outgoing.game.victory?.factionId, rival);

const interruption = branch(); interruption.issue(siege);
assert.equal(interruption.game.projects[0]!.status, 'paused');
for (let i = 0; i < 2; i++) interruption.issue({ type: 'endTurn', factionId: interruption.game.turnOwnerId });
assert.equal(interruption.game.projects[0]!.progress, 4); assert.equal(interruption.game.victory, null);

// A real paid survey consumes this company's movement. With no other actor
// adjacent to the host, no immediate establishment opportunity remains.
// If survey eligibility is absent on foreign ground, an actual ordinary move
// to a neighboring observed hex instead spends movement and breaks adjacency.
const unavailable = branch();
const originalView = getObservation(unavailable.game, actor), originalArmy = originalView.armies.find(army => army.id === armyId)!;
const target = originalView.cells.map(cell => ({ cell: cell.cell, preview: getMovementPreview(originalView, armyId, cell.cell) }))
  .find(item => item.preview.action === 'move' && item.preview.canMoveNow && item.preview.cost === originalArmy.movement);
assert(target, 'Need a real movement-spending control');
unavailable.issue({ type: 'moveTo', factionId: actor, armyId, target: target.cell });
assert.equal(unavailable.game.armies[armyId]!.movement, 0);
const blockedSiege = unavailable.issue(siege, false);
unavailable.issue(offer);
const unavailablePlan = planTurnWithReasons(getObservation(unavailable.game, actor));
assert.equal(unavailablePlan.commands[0]?.type, 'respondPeace');

// Rejecting the incoming offer alone is not a complete fix: inspect the next
// ordinary planner after the refusal and retain whatever it really proposes.
const rejection = branch(); rejection.issue(offer);
rejection.issue({ type: 'respondPeace', factionId: actor, offerId: rejection.game.diplomacy.offers[0]!.id, accept: false });
const afterRejection = planTurnWithReasons(getObservation(rejection.game, actor));
for (const command of afterRejection.commands) rejection.issue(command);
const result = { scope: 'Saved branches of the paid near-complete project; every recorded accepted/refused command mirrors and replays exactly.',
  initialHash: stateHash(deserializeGame(bytes)), incomingPlan, outgoingPlan, rivalAnswer: answer, peaceBlocker,
  incoming: incoming.seal(), outgoing: outgoing.seal(), interrupted: interruption.seal(),
  blocked: { target: target.cell, blocker: blockedSiege.error, plan: unavailablePlan, ...unavailable.seal() },
  rejectedIncoming: { plan: afterRejection, ...rejection.seal() } };
writeFileSync(new URL('branch-evidence.json', dir), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
