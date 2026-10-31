import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '../../../packages/sim/src/index';
import { planTurn, planTurnWithReasons } from '../../../packages/ai/src/index';
/** Replays a headline campaign and counts, per realm, the turns on which a seam war objective was named,
 * the wars declared and sieges laid on those turns, and the paths held at the end. */
const pace = (process.argv[2] ?? 'epic') as 'epic' | 'long' | 'standard';
const state: GameState = createGame({ seed: 20260905, pace, size: 'standard', factionCount: 12 });
const stats: Record<string, { objectiveTurns: number; firstTurn: number | null; wars: number; sieges: number; attunement: number | null }> = {};
const stat = (id: string) => stats[id] ??= { objectiveTurns: 0, firstTurn: null, wars: 0, sieges: 0, attunement: null };
const issue = (command: GameCommand) => applyCommand(state, command);
for (let round = 0; round < 900 && !state.victory; round++) {
  for (const faction of state.factions) {
    const plan = planTurnWithReasons(getObservation(state, faction.id));
    const objective = plan.reasons.some(reason => reason.includes('objective of war'));
    if (objective) { const s = stat(faction.id); s.objectiveTurns++; s.firstTurn ??= state.turn; }
    for (const command of plan.commands) {
      const result = issue(command);
      if (result.ok && objective && command.type === 'declareWar') stat(faction.id).wars++;
      if (result.ok && objective && command.type === 'besiege') stat(faction.id).sieges++;
      if (result.ok && command.type === 'startAttunement') stat(faction.id).attunement = state.turn;
      for (let d = 0; state.battle || state.pendingCapture; d++) {
        if (d >= 4) throw new Error('bound');
        if (state.battle) { const b = state.battle; const c = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; issue({ type: 'autoResolveBattle', factionId: c }); }
        else if (state.pendingCapture) { const choice = planTurn(getObservation(state, state.pendingCapture.factionId))[0]!; issue(choice); }
      }
    }
  }
  issue({ type: 'endTurn', factionId: state.turnOwnerId });
}
console.log('ended turn', state.turn, state.victory?.path, state.victory?.factionId);
for (const faction of state.factions) {
  const view = getObservation(state, faction.id), s = stat(faction.id);
  const held = [...new Set(view.arcaneSites.filter(site => site.controlled).map(site => site.pathId.replace('path.', '')))].sort();
  console.log(faction.id.replace('faction.', '').padEnd(20), 'objective turns', String(s.objectiveTurns).padStart(3), 'first', s.firstTurn ?? '-', 'wars', s.wars, 'sieges', s.sieges, 'attunement', s.attunement ?? '-', 'held', held.join(',') || '-');
}
