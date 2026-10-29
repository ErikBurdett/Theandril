import { applyCommand, createGame, getObservation } from '../../../packages/sim/src/index';
import { withRules } from '../../../packages/sim/src/rules';
import { aiObservationOptions, planTurn } from '../../../packages/ai/src/index';

/** Observation bytes with and without natural features in sight, on the headline
 * map after fifty AI rounds. JSON length is an upper bound on the worker packet. */
const state = createGame({ seed: 20260905, size: 'standard', factionCount: 12, pace: 'standard' });
for (let round = 0; round < 50 && !state.victory; round++) {
  for (const faction of state.factions) for (const command of planTurn(getObservation(state, faction.id, aiObservationOptions(state.turn)))) {
    applyCommand(state, command);
    for (let guard = 0; (state.battle || state.pendingCapture) && guard < 8; guard++) {
      if (state.battle) applyCommand(state, { type: 'autoResolveBattle', factionId: [state.battle.attackerFactionId, state.battle.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : state.battle.attackerFactionId });
      else if (state.pendingCapture) { const choice = planTurn(getObservation(state, state.pendingCapture.factionId, aiObservationOptions(state.turn))).find(c => c.type === 'resolveCapture'); if (choice) applyCommand(state, choice); else break; }
    }
  }
  applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId });
}
const rows: string[] = [];
for (const faction of state.factions.slice(0, 4)) {
  const modern = getObservation(state, faction.id), historical = withRules(state, 38, () => getObservation(state, faction.id));
  const visible = modern.cells.filter(cell => cell.visible).length, featured = modern.cells.filter(cell => cell.featureMask !== undefined).length;
  const started = performance.now(); for (let i = 0; i < 5; i++) getObservation(state, faction.id); const modernMs = (performance.now() - started) / 5;
  const started2 = performance.now(); for (let i = 0; i < 5; i++) withRules(state, 38, () => getObservation(state, faction.id)); const historicalMs = (performance.now() - started2) / 5;
  rows.push(`${faction.id}: turn ${state.turn}, explored ${modern.cells.length}, visible ${visible}, featured ${featured}; JSON bytes rules 38 ${JSON.stringify(historical).length} → rules 39 ${JSON.stringify(modern).length}; observation ms ${historicalMs.toFixed(1)} → ${modernMs.toFixed(1)}`);
}
console.log(rows.join('\n'));
