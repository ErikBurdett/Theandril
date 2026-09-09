import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { applyCommand, createArmyFormation, deserializeGame, getMovementQuery, getObservation, serializeGame } from '../../packages/sim/src/index';
import { borderBattleCampaign } from '../../packages/test-fixtures/src/combat-fixture';
import { refreshAuthoredSight } from '../../packages/test-fixtures/src/authored-land';
import { planTurn } from '../../packages/ai/src/index';

// Authored R03 interface diagnostic; not a sparse-contact campaign input.
let state = borderBattleCampaign();
const defender = state.armies['army.4']!;
defender.formations = [{ ...createArmyFormation(defender.id, 'unit.scout'), strength: 1, morale: 1 }];
for (let i = 1; i < 21; i++) {
  const id = `army.${state.nextId++}`;
  state.armies[id] = { ...defender, id, formations: [{ ...createArmyFormation(id, 'unit.scout'), strength: 1, morale: 1 }] };
}
refreshAuthoredSight(state); state = deserializeGame(serializeGame(state));
assert.equal(applyCommand(state, { type: 'declareWar', factionId: state.turnOwnerId, targetFactionId: defender.factionId }).ok, true);
const view = getObservation(state, state.turnOwnerId);
const defense = view.armies.find(army => army.id === defender.id)!.battleDefense;
const movement = getMovementQuery(view, 'army.2', defender.cell).preview;
const plan = planTurn(view);
const direct = applyCommand(state, { type: 'attack', factionId: state.turnOwnerId, armyId: 'army.2', targetArmyId: defender.id });
assert.equal(direct.ok, true);
assert.equal(state.battle!.combat.defender.length, 20);
const report = { defense, movement, aiAttacks: plan.some(command => command.type === 'attack'), directAttackAccepted: direct.ok, tacticalDefenders: state.battle!.combat.defender.length,
  requiredInterface: 'getMovementQuery must honor the current canonical battleDefense contingent rather than deny all >20 stacks; AI can then consume that preview without bypassing the shared movement API.' };
writeFileSync(new URL('./contact-r03-interface.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
