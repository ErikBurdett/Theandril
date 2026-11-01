import { applyCommand, createGame, getObservation, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { planTurnWithReasons } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';
const pace = process.argv[2] as 'standard' | 'long' | 'epic', seed = Number(process.argv[3] ?? 20260905);
const state: GameState = createGame({ seed, pace, size: 'standard', factionCount: 12 });
let ashore = 0, holds = 0, landings = 0;
for (let round = 0; round < 900 && !state.victory; round++) {
  for (const faction of state.factions) {
    const plan = planTurnWithReasons(getObservation(state, faction.id));
    for (const reason of plan.reasons) { if (reason.includes('proved enclosed with no landing')) ashore++; if (reason.includes('holds its passengers')) holds++; if (reason.includes('lands ') && reason.includes('unoccupied shore')) landings++; }
    for (const command of plan.commands) {
      applyCommand(state, command);
      for (let d = 0; state.battle || state.pendingCapture; d++) {
        if (d >= 4) throw new Error('bound');
        if (state.battle) { const b = state.battle; const c = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; applyCommand(state, { type: 'autoResolveBattle', factionId: c }); }
        else if (state.pendingCapture) { const choice = planTurnWithReasons(getObservation(state, state.pendingCapture.factionId)).commands[0]!; applyCommand(state, choice); }
      }
    }
  }
  applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId });
}
console.log(`${pace} seed ${seed} -> turn ${state.turn} ${state.victory?.path}; passengers put ashore in a proved basin ${ashore}; turns a ferry held its passengers ${holds}; landings on an unoccupied shore ${landings}`);
