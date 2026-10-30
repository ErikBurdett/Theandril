import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { arcaneSites, GLASS_SHARDS } from '/home/telephoneheater/Work/Theandril/packages/sim/src/arcane-sites';
import { naturalFeatures, hexDistance } from '/home/telephoneheater/Work/Theandril/packages/mapgen/src/index';
import { planTurn } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';

const pace = (process.argv[2] ?? 'epic') as 'epic' | 'long' | 'standard'; const size = (process.argv[3] ?? 'standard') as 'tiny' | 'standard'; const seats = Number(process.argv[4] ?? 12);
const state: GameState = createGame({ seed: 20260905, pace, size, factionCount: seats });
const sites = arcaneSites(state.world);
console.log('seams', sites.length, 'by path', Object.entries(sites.reduce((m, s) => ({ ...m, [s.pathId]: (m[s.pathId] ?? 0) + 1 }), {} as Record<string, number>)));
const stats: Record<string, { found: number; empty: number; emptyOnGlass: number; emptyOffGlass: number; firstEmpty: number; attunement: number[] }> = {};
const stat = (id: string) => stats[id] ??= { found: 0, empty: 0, emptyOnGlass: 0, emptyOffGlass: 0, firstEmpty: 0, attunement: [] };
const issue = (command: GameCommand) => {
  const before = command.type === 'searchArcane' ? state.armies[command.armyId]?.cell : undefined;
  const held = command.type === 'searchArcane' ? (state.arcaneSurveys[command.factionId] ?? []).length : 0;
  const result = applyCommand(state, command);
  if (command.type === 'searchArcane' && result.ok && before !== undefined) {
    const s = stat(command.factionId);
    const glass = (naturalFeatures(state.world, before) & GLASS_SHARDS) === GLASS_SHARDS;
    if (result.events.some(e => e.type === 'arcane_site_found')) s.found++;
    else { s.empty++; if (glass) s.emptyOnGlass++; else s.emptyOffGlass++; if (!held) s.firstEmpty++; }
  }
  if (command.type === 'startAttunement' && result.ok) stat(command.factionId).attunement.push(state.turn);
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
console.log('ended turn', state.turn, state.victory?.path, state.victory?.factionId);
for (const faction of state.factions) {
  const view = getObservation(state, faction.id);
  const heldPaths = [...new Set(view.arcaneSites.filter(s => s.controlled).map(s => s.pathId))].sort();
  const surveyedPaths = [...new Set(view.arcaneSites.map(s => s.pathId))].sort();
  const s = stat(faction.id);
  const towns = Object.values(state.settlements).filter(t => t.factionId === faction.id);
  const nearestGlass = towns.length ? Math.min(...towns.map(t => { let best = 99; for (let c = 0; c < state.world.terrain.length; c++) if ((naturalFeatures(state.world, c) & GLASS_SHARDS) === GLASS_SHARDS) best = Math.min(best, hexDistance(t.cell, c, state.world.width)); return best; })) : -1;
  console.log(faction.id.padEnd(28), 'towns', String(towns.length).padStart(2), 'surveys found/empty', s.found, '/', s.empty, 'emptyOnGlass', s.emptyOnGlass, 'emptyOffGlass', s.emptyOffGlass, 'firstEmpty', s.firstEmpty,
    'held', heldPaths.join(','), '| surveyed', surveyedPaths.join(','), '| arcane', (state.arcaneResearch[faction.id] ?? []).length, '| attune', s.attunement.join(','), '| nearestGlass', nearestGlass);
}
