/** Authored positioning/infrastructure; paid progression and actual turn progress. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { isPassable, neighbors } from '../../../packages/mapgen/src';
import { applyCommand, deserializeGame, getMovementPreview, getObservation, serializeGame, stateHash, type GameCommand } from '../../../packages/sim/src';
import { createArmyFormation } from '../../../packages/sim/src/army-composition';
import { prosperityCampaign, PROSPERITY_FIXTURE } from '../../../packages/test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../../packages/test-fixtures/src/authored-land';
import { planTurnWithReasons } from '../../../packages/ai/src';
import { createJournal, replayArchive } from '../../../packages/chronicle/src';

const dir = new URL('./', import.meta.url);
let game = prosperityCampaign(35);
const projectOwner = game.turnOwnerId, actor = game.factions.find(faction => faction.id !== projectOwner)!.id;
const host = game.settlements[PROSPERITY_FIXTURE.hostId]!;
const army = Object.values(game.armies).find(army => army.factionId === actor)!;
const position = neighbors(host.cell, game.world.width, game.world.height).find(cell => isPassable(game.world.terrain[cell]!)
  && !Object.values(game.armies).some(army => army.cell === cell) && !Object.values(game.settlements).some(town => town.cell === cell));
assert(position !== undefined);
army.formations = [createArmyFormation(army.id, 'unit.guard')]; army.name = 'Project interruption guard'; army.cell = position; army.movement = 3;
refreshAuthoredSight(game); game = deserializeGame(serializeGame(game));
const authoredInitial = serializeGame(game), journal = createJournal(game, { mode: 'watch', coverage: 'from-save' });
const commands: GameCommand[] = [];
function issue(command: GameCommand) {
  const result = journal.record(game, command); assert(result.ok, JSON.stringify({ command, result })); commands.push(command);
  assert.equal(stateHash(deserializeGame(serializeGame(game))), stateHash(game));
  return result;
}
issue({ type: 'declareWar', factionId: actor, targetFactionId: projectOwner });
for (let i = 0; i < 8; i++) issue({ type: 'endTurn', factionId: game.turnOwnerId });
const fundsBefore = game.factions.find(faction => faction.id === projectOwner)!.treasury;
issue({ type: 'research', factionId: projectOwner, technologyId: 'technology.civic_accounts' });
issue({ type: 'adoptInstitution', factionId: projectOwner, institutionId: 'institution.charter_compact' });
const quote = getObservation(game, projectOwner).progression.project;
issue({ type: 'startVictoryProject', factionId: projectOwner, settlementId: host.id });
const fundsAfter = game.factions.find(faction => faction.id === projectOwner)!.treasury;
for (let i = 0; i < quote.activeTurns - 1; i++) issue({ type: 'endTurn', factionId: game.turnOwnerId });
const view = getObservation(game, actor), originalHash = stateHash(game), observationBefore = structuredClone(view);
const outgoing = planTurnWithReasons(view);
assert.deepEqual(view, observationBefore);
const preview = getMovementPreview(view, army.id, host.cell);
const interruption = deserializeGame(serializeGame(game));
const besiege: GameCommand = { type: 'besiege', factionId: actor, armyId: army.id, settlementId: host.id };
const interruptionResult = applyCommand(interruption, besiege);
const incoming = deserializeGame(serializeGame(game));
assert(applyCommand(incoming, { type: 'proposePeace', factionId: projectOwner, targetFactionId: actor, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } }).ok);
const incomingPlan = planTurnWithReasons(getObservation(incoming, actor));
const result = { authored: true, scope: 'Prepared infrastructure and adjacent guard; ordinary paid project and actual end-turn progress. No campaign pacing attribution.', originalHash, turn: game.turn,
  projectOwner, actor, army: view.armies.find(item => item.id === army.id), host: view.settlements.find(item => item.id === host.id),
  project: view.projects[0], fundsBefore, fundsAfter, projectQuote: quote, preview, outgoing, incomingPlan, interruptionResult, interruptedProject: interruption.projects[0] };
writeFileSync(new URL('probe-initial.json', dir), JSON.stringify(result, null, 2)+'\n');
writeFileSync(new URL('authored-initial.theandril', dir), authoredInitial);
writeFileSync(new URL('near-complete.theandril', dir), serializeGame(game));
writeFileSync(new URL('setup-commands.json', dir), JSON.stringify(commands,null,2)+'\n');
assert.equal(stateHash(replayArchive(journal.materialize())), originalHash);
console.log(JSON.stringify(result, null, 2));
