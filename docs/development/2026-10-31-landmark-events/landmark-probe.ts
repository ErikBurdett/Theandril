import { applyCommand, createGame, getObservation, landmarks, type GameCommand, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { planTurn } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';
// args: pace  — counts AI landmark claims and landmark events on the headline seed.
const pace = process.argv[2] as 'standard' | 'long' | 'epic';
const state: GameState = createGame({ seed: 20260905, pace, size: 'standard', factionCount: 12 });
const sites = new Set(landmarks(state.world).map(site => site.cell));
const claims = new Map<string, number[]>(), events = new Map<string, number>(), allClaims = new Map<number, number>();
const issue = (command: GameCommand) => {
  const result = applyCommand(state, command);
  if (result.ok && command.type === 'claimCell') allClaims.set(Math.floor(state.turn / 50) * 50, (allClaims.get(Math.floor(state.turn / 50) * 50) ?? 0) + 1);
  if (result.ok && command.type === 'claimCell' && sites.has(command.cell)) claims.set(command.factionId, [...(claims.get(command.factionId) ?? []), state.turn]);
  for (const event of result.events) if (event.type === 'hearth_event_offered') { const name = event.message.split(' at ')[0]!; events.set(name, (events.get(name) ?? 0) + 1); }
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
console.log(`${pace} -> turn ${state.turn} ${state.victory?.path} ${state.victory?.factionId}; landmarks ${sites.size}`);
for (const [faction, turns] of [...claims].sort()) console.log(`  claims ${faction.padEnd(28)} ${turns.length} on turns ${turns.join(' ')}`);
console.log('  all claims by fifty turns:', [...allClaims].sort((a, b) => a[0] - b[0]).map(([bucket, count]) => `${bucket}+: ${count}`).join(', '));
const held = landmarks(state.world).map(site => { const entry = Object.entries(state.land.settlements).find(([, land]) => land.claimed.includes(site.cell)); return entry ? `${site.id}:${state.settlements[entry[0]]?.factionId.replace('faction.', '')}` : null; }).filter(Boolean);
console.log(`  held at the end: ${held.length} of ${sites.size} — ${held.join(' ')}`);
const policies = state.land.policies ? Object.keys(state.land.policies).length : -1;
console.log('  land policies:', policies);
console.log('  events:', [...events].sort((a, b) => b[1] - a[1]).map(([name, count]) => `${name} ×${count}`).join(', '));
