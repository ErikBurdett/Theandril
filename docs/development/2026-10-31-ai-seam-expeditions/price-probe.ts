import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '../../../packages/sim/src/index';
import { ATTUNEMENT_VICTORY, CAMPAIGN_PACES } from '../../../packages/content/src/index';
import { planTurn } from '../../../packages/ai/src/index';
// args: pace attunementKnowledge prosperityCoin  (e.g. standard 1800 18000)
const [pace, knowledge, coin] = [process.argv[2] as 'standard' | 'long' | 'epic', Number(process.argv[3]), Number(process.argv[4])];
(ATTUNEMENT_VICTORY.knowledgeCost as Record<string, number>)[pace] = knowledge;
(CAMPAIGN_PACES[pace] as { projectCoinCost: number }).projectCoinCost = coin;
const state: GameState = createGame({ seed: 20260905, pace, size: 'standard', factionCount: 12 });
const starts: string[] = [];
const issue = (command: GameCommand) => {
  const result = applyCommand(state, command);
  if (result.ok && (command.type === 'startAttunement' || command.type === 'startVictoryProject')) starts.push(`${command.type.replace('start', '')}:${command.factionId.replace('faction.', '')}@${state.turn}`);
  return result;
};
const started = Date.now();
for (let round = 0; round < 900 && !state.victory; round++) {
  for (const faction of state.factions) {
    for (const command of planTurn(getObservation(state, faction.id))) {
      issue(command);
      for (let d = 0; state.battle || state.pendingCapture; d++) {
        if (d >= 4) throw new Error('bound');
        if (state.battle) { const b = state.battle; const c = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; issue({ type: 'autoResolveBattle', factionId: c }); }
        else if (state.pendingCapture) { const choice = planTurn(getObservation(state, state.pendingCapture.factionId))[0]!; issue(choice); }
      }
    }
  }
  issue({ type: 'endTurn', factionId: state.turnOwnerId });
}
console.log(`${pace} attune=${knowledge} prosperity=${coin} -> turn ${state.turn} ${state.victory?.path} ${state.victory?.factionId?.replace('faction.', '')} | starts ${starts.join(' ')} | ${Math.round((Date.now() - started) / 1000)}s`);
