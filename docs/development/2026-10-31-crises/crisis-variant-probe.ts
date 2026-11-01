import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { CRISES } from '/home/telephoneheater/Work/Theandril/packages/content/src/index';
import { planTurn } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';
// args: variant pace seed — mutates the crisis catalogue in place for the measurement.
const [variant, pace, seedArg] = [process.argv[2]!, process.argv[3] as 'standard' | 'long' | 'epic', process.argv[4]];
const seed = Number(seedArg ?? 20260905);
const mutable = CRISES as { id: string; turns: number; blight: { food: number; coin: number; knowledge: number; devastation: number } }[];
for (const crisis of mutable) {
  if (variant === 'no-devastation' && crisis.blight.devastation) { crisis.blight.devastation = 0; crisis.blight.coin = 1; }
  if (variant === 'half-tolls') { for (const key of ['food', 'coin', 'knowledge'] as const) crisis.blight[key] = Math.ceil(crisis.blight[key] / 2); if (crisis.blight.devastation) crisis.turns = 4; }
  if (variant === 'short-terms') crisis.turns = Math.max(4, Math.round(crisis.turns / 2));
}
const state: GameState = createGame({ seed, pace, size: 'standard', factionCount: 12 });
const issue = (command: GameCommand) => applyCommand(state, command);
let projectStart = '';
for (let round = 0; round < 900 && !state.victory; round++) {
  for (const faction of state.factions) {
    for (const command of planTurn(getObservation(state, faction.id))) {
      const result = issue(command);
      if (result.ok && command.type === 'startVictoryProject' && !projectStart) projectStart = `${command.factionId.replace('faction.', '')}@${state.turn}`;
      for (let d = 0; state.battle || state.pendingCapture; d++) {
        if (d >= 4) throw new Error('bound');
        if (state.battle) { const b = state.battle; const c = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; issue({ type: 'autoResolveBattle', factionId: c }); }
        else if (state.pendingCapture) { const choice = planTurn(getObservation(state, state.pendingCapture.factionId))[0]!; issue(choice); }
      }
    }
  }
  issue({ type: 'endTurn', factionId: state.turnOwnerId });
}
console.log(`${variant} ${pace} seed ${seed} -> turn ${state.turn} ${state.victory?.path} ${state.victory?.factionId?.replace('faction.', '')}; first project ${projectStart}`);
