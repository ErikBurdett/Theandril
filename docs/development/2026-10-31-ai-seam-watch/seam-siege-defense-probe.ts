// Whenever a hearth holding a seam of some realm is under siege, what the holder could do about it: casters, rites, ashglass, garrison, wards.
import { applyCommand, createGame, getObservation, arcaneSites, type GameCommand, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { armyStrength } from '/home/telephoneheater/Work/Theandril/packages/sim/src/army-composition';
import { planTurn } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';
const pace = (process.argv[2] ?? 'epic') as 'epic' | 'long' | 'standard';
const state: GameState = createGame({ seed: 20260905, pace, size: 'standard', factionCount: 12 });
const issue = (command: GameCommand) => applyCommand(state, command);
const sites = arcaneSites(state.world);
const short = (id: string) => id.replace('faction.', '').replace('character.', 'c').replace('settlement.', 's');
const seamHearth = (settlementId: string, factionId: string) => { const land = state.land.settlements[settlementId]; return land ? sites.filter(s => land.claimed.includes(s.cell) && (state.arcaneSurveys[factionId] ?? []).includes(s.cell)).map(s => s.pathId.replace('path.', '')) : []; };
let sieges = 0, defended = 0;
const seen = new Set<string>();
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
  for (const siege of Object.values(state.sieges)) {
    const town = state.settlements[siege.settlementId]; if (!town) continue;
    const paths = seamHearth(town.id, town.factionId); if (!paths.length) continue;
    const key = `${siege.settlementId}|${siege.factionId}|${siege.startedTurn}`;
    const first = !seen.has(key); seen.add(key); if (first) sieges++;
    const view = getObservation(state, town.factionId);
    const casters = view.characters.filter(c => c.role === 'waykeeper' && !c.dead).map(c => `${c.name}@${c.location?.kind === 'settlement' ? short(c.location.settlementId) : c.location?.kind === 'army' ? c.location.armyId : '-'} ${JSON.stringify(state.characters[c.id]?.aptitudes ?? {})}${c.woundedTurns ? ' wounded' : ''}`);
    const rites = (view.rites ?? []).filter(r => r.settlementId === town.id || r.settlementId === null).map(r => `${r.riteId.replace('rite.', '')}:${r.canPerform ? 'CAN' : r.blocker}`);
    const ash = view.resources?.stockpiles.find(s => s.resourceId === 'resource.ashglass')?.amount ?? 0;
    const ward = state.wards.find(w => w.settlementId === town.id);
    const besieger = state.armies[siege.armyId];
    const garrison = Object.values(state.armies).filter(a => a.cell === town.cell && a.factionId === town.factionId).reduce((s, a) => s + armyStrength(a), 0);
    const discoveries = (state.arcaneResearch[town.factionId] ?? []).map(d => d.replace('arcane.', ''));
    if (ward) defended++;
    if (first || ward) console.log(`turn ${state.turn} ${short(town.factionId)} ${short(town.id)} [${paths}] besieged by ${short(siege.factionId)} (${besieger ? armyStrength(besieger) : '?'}) since ${siege.startedTurn} defenses ${siege.defenses} militia ${siege.militiaStrength} garrison ${garrison} ward ${ward ? ward.riteId.replace('rite.', '') + ' to ' + ward.expiresTurn : '-'} ashglass ${ash} discoveries [${discoveries}] casters [${casters.join('; ')}] rites [${rites.join(' ')}] theater ${(state.theaters ?? []).filter(t => t.factionId === town.factionId).map(t => `${t.settlementIds.includes(town.id) ? 'covers' : 'omits'}/${t.armyIds.length}`).join(',') || 'none'}`);
  }
}
console.log('ended', state.turn, state.victory?.path, state.victory?.factionId, 'seam-hearth sieges', sieges, 'turns under a ward', defended);
