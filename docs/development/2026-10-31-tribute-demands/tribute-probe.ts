import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { planTurn } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';
const pace = process.argv[2] as 'standard' | 'long' | 'epic', seed = Number(process.argv[3] ?? 20260905);
const cityStates = Number(process.argv[4] ?? 0);
const state: GameState = createGame({ seed, pace, size: 'standard', factionCount: 12, ...(cityStates ? { cityStateCount: cityStates } : {}) });
const notes: string[] = [], shelters = new Map<string, number>(); let refusedShelters = 0, projectStart = '', migrations = 0, alliedPeaces = 0, calls = 0, guarantees = 0, unanswered = 0, goods = 0, paidDemands = 0, refusedDemands = 0;
const issue = (command: GameCommand) => {
  const result = applyCommand(state, command);
  if (command.type === 'shelterFromCrisis') { if (result.ok) shelters.set(command.factionId, (shelters.get(command.factionId) ?? 0) + 1); else refusedShelters++; }
  if (result.ok && command.type === 'startVictoryProject' && !projectStart) projectStart = `${command.factionId}@${state.turn}`;
  for (const event of result.events) { if (event.type === 'crisis_migration') migrations++; if (event.type === 'allied_peace' && event.factionId === command.factionId) alliedPeaces++; if (event.type === 'alliance_answered' && event.factionId === command.factionId) calls++; if (event.type === 'patronage_answered' && event.factionId === command.factionId) guarantees++; if (event.type === 'patronage_unanswered' && event.factionId === command.factionId) unanswered++; if (event.type === 'client_goods_promised' && event.factionId === command.factionId) goods++; if (event.type === 'tribute_paid' && event.factionId === command.factionId) paidDemands++; if (event.type === 'tribute_refused' && event.factionId === command.factionId) refusedDemands++; }
  for (const event of result.events) if ((event.type === 'crisis_begun' || event.type === 'crisis_ended') && event.factionId === state.factions[0]!.id) notes.push(`t${state.turn} ${event.type === 'crisis_begun' ? 'BEGIN' : 'end'} ${event.message.split(/ comes| passes/)[0]}`);
  return result;
};
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
console.log(`${pace} seed ${seed} -> turn ${state.turn} ${state.victory?.path} ${state.victory?.factionId}; first project ${projectStart}; sheltered ${[...shelters].map(([f, n]) => f.replace('faction.', '') + '×' + n).join(' ')}; refused shelters ${refusedShelters}; migrations ${migrations / 2}; calls answered ${calls}; allied peaces ${alliedPeaces}; guarantees answered ${guarantees}, unanswered ${unanswered}; city-state goods promised ${goods}; tribute demands paid ${paidDemands}, refused ${refusedDemands}; city-states ${state.factions.filter(f => f.id.startsWith('citystate.')).length}`);
console.log('  ' + notes.join(' | '));
