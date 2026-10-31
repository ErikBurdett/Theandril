import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '../../../packages/sim/src/index';
import { planTurn } from '../../../packages/ai/src/index';
const pace = (process.argv[2] ?? 'epic') as 'epic' | 'long' | 'standard';
const state: GameState = createGame({ seed: 20260905, pace, size: 'standard', factionCount: 12 });
const issue = (command: GameCommand) => applyCommand(state, command);
const seen = new Map<string, string>();
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
  if (state.turn % 40 === 0) for (const faction of state.factions) {
    if (faction.id !== 'faction.glass_tide') continue;
    for (const ch of Object.values(state.characters).filter(c => c.factionId === faction.id && c.definitionId === 'character.waykeeper')) {
      const land = ch.settlementId ? state.land.settlements[ch.settlementId] : undefined;
      const seams = land ? (state.arcaneSurveys[faction.id] ?? []).filter(cell => land.claimed.includes(cell)).length : 0;
      console.log(`turn ${state.turn} knowledge ${faction.knowledge} caster ${ch.name} exp ${ch.experience} skills ${JSON.stringify(ch.skills ?? [])} aptitudes ${JSON.stringify(ch.aptitudes ?? {})} at ${ch.settlementId ?? ch.armyId ?? '-'} seamsHeldThere ${seams} wounded ${ch.woundedTurns ?? 0}`);
    }
  }
  if (state.turn % 10 === 0) for (const faction of state.factions) {
    const a = getObservation(state, faction.id).progression.attunement;
    if (!a || !a.paths.every(p => p.held)) continue;
    const key = `${faction.id}|${a.blockers.join(';')}|${a.discoveries.researched}/${a.discoveries.total}|casters ${a.casters.map(c => `${c.degree}${c.qualified ? 'q' : ''}`).join(',')}`;
    if (seen.get(faction.id) !== key) { seen.set(faction.id, key); console.log(`turn ${state.turn} ${faction.id.replace('faction.', '')} knowledge ${faction.knowledge} discoveries ${a.discoveries.researched}/${a.discoveries.total} casters [${a.casters.map(c => `${c.name}:${c.degree}${c.qualified ? 'q' : ''}${c.settlementId ? '@' + c.settlementId : ''}`).join(', ')}] hosts ${a.hostSettlementIds.length} eligible ${a.eligibleSettlementIds.length} blockers: ${a.blockers.join(' | ') || 'none'}`); }
  }
}
console.log('ended turn', state.turn, state.victory?.path, state.victory?.factionId);
