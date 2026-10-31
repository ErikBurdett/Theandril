import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '../../../packages/sim/src/index';
import { planTurn, planTurnWithReasons } from '../../../packages/ai/src/index';
const state: GameState = createGame({ seed: 20260905, pace: 'epic', size: 'standard', factionCount: 12 });
const issue = (command: GameCommand) => applyCommand(state, command);
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
  if ([300, 330, 350, 365].includes(state.turn)) {
    const view = getObservation(state, 'faction.glass_tide');
    const a = view.progression.attunement!;
    console.log(`turn ${state.turn} knowledge ${view.knowledge} price ${a.knowledgeCost} blockers [${a.blockers.join(' | ')}] hosts ${a.hostSettlementIds.join(',')} eligible ${a.eligibleSettlementIds.join(',')} casters ${a.casters.map(c => `${c.name}:${c.degree}${c.qualified ? 'q' : ''}@${c.settlementId}`).join(';')} projects ${view.projects.filter(p => p.factionId === view.factionId).map(p => `${p.projectId}:${p.status}`).join(',')} wars ${view.wars.length}`);
    const reasons = planTurnWithReasons(view).reasons.filter(r => /Seal|working|knowledge|Research/i.test(r));
    console.log('  reasons:', reasons.slice(0, 4).join(' || '));
  }
}
console.log('ended', state.turn, state.victory?.path);
