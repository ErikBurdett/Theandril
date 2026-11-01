import { applyCommand, createGame, getObservation, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { aiObservationOptions, planTurn } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';

const state: GameState = createGame({ seed: 20260905, size: 'standard', factionCount: 12, pace: 'epic' });
const counts = new Map<string, number>(); const marks: string[] = [];
const settle = () => {
  for (let guard = 0; (state.battle || state.pendingCapture) && guard < 8; guard++) {
    if (state.battle) { const b = state.battle; const controller = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; applyCommand(state, { type: 'autoResolveBattle', factionId: controller }); }
    else if (state.pendingCapture) { const c = planTurn(getObservation(state, state.pendingCapture.factionId, aiObservationOptions(state.turn))).find(x => x.type === 'resolveCapture'); if (c) applyCommand(state, c); else break; }
  }
};
for (let round = 0; round < 420 && !state.victory; round++) {
  settle();
  for (const faction of state.factions) {
    if (state.victory) break;
    for (const command of planTurn(getObservation(state, faction.id, aiObservationOptions(state.turn)))) {
      if (state.victory) break;
      const r = applyCommand(state, command);
      counts.set(command.type, (counts.get(command.type) ?? 0) + 1);
      if (command.type === 'shareMaps' && r.ok) counts.set('shareMaps:ok', (counts.get('shareMaps:ok') ?? 0) + 1);
      settle();
    }
  }
  if ([50, 100, 150, 200, 250, 300, 350].includes(state.turn)) marks.push(`t${state.turn}: hearths ${Object.keys(state.settlements).length}, armies ${Object.keys(state.armies).length}, explored avg ${Math.round(state.factions.reduce((s, f) => s + (state.explored[f.id]?.size ?? 0), 0) / state.factions.length)}, pacts ${state.alliances.pacts.length}, wars ${state.diplomacy.wars?.length ?? '?'}`);
  if (!state.victory) applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId });
}
console.log('victory turn', state.turn, state.victory?.path);
for (const line of marks) console.log(line);
console.log([...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([k, v]) => `${k}=${v}`).join(' '));
