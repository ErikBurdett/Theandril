// Replays a headline campaign and reports every change of hands of a hearth whose borders hold an arcane seam:
// who lost it, to whom, how, and what the loser could have done about it afterwards.
import { applyCommand, createGame, getObservation, arcaneSites, type GameCommand, type GameState } from '/home/telephoneheater/Work/Theandril/packages/sim/src/index';
import { armyStrength } from '/home/telephoneheater/Work/Theandril/packages/sim/src/army-composition';
import { hexDistance } from '/home/telephoneheater/Work/Theandril/packages/mapgen/src/index';
import { planTurn } from '/home/telephoneheater/Work/Theandril/packages/ai/src/index';
const pace = (process.argv[2] ?? 'epic') as 'epic' | 'long' | 'standard';
const state: GameState = createGame({ seed: 20260905, pace, size: 'standard', factionCount: 12 });
const width = state.world.width;
const issue = (command: GameCommand) => applyCommand(state, command);
const sites = arcaneSites(state.world);
const owner = (cell: number): { settlementId: string; factionId: string } | null => {
  for (const [settlementId, land] of Object.entries(state.land.settlements)) {
    const town = state.settlements[settlementId];
    if (town && land.claimed.includes(cell)) return { settlementId, factionId: town.factionId };
  }
  return null;
};
const surveyed = (factionId: string, cell: number) => (state.arcaneSurveys[factionId] ?? []).includes(cell);
const wars = (a: string) => state.wars.filter(pair => pair.includes(a)).map(pair => pair[0] === a ? pair[1] : pair[0]);
const short = (id: string) => id.replace('faction.', '');
let previous = new Map<string, string>(); // site id -> owner key
const captures: { turn: number; settlementId: string; by: string; from: string }[] = [];
const watch: { loser: string; settlementId: string; cell: number; path: string; since: number; holder: string }[] = [];
const noncombatant = new Set(['unit.colonist', 'unit.scout', 'unit.transport', 'unit.coastal_warship', 'unit.ocean_warship']);
const fieldArmies = (factionId: string) => Object.values(state.armies).filter(a => a.factionId === factionId && a.formations.some(f => !noncombatant.has(f.unitId)));
for (let round = 0; round < 900 && !state.victory; round++) {
  for (const faction of state.factions) {
    for (const command of planTurn(getObservation(state, faction.id))) {
      issue(command);
      for (let d = 0; state.battle || state.pendingCapture; d++) {
        if (d >= 4) throw new Error('bound');
        if (state.battle) { const b = state.battle; const c = [b.attackerFactionId, b.defenderFactionId].includes(state.turnOwnerId) ? state.turnOwnerId : b.attackerFactionId; issue({ type: 'autoResolveBattle', factionId: c }); }
        else if (state.pendingCapture) { const p = state.pendingCapture; captures.push({ turn: state.turn, settlementId: p.settlementId, by: p.factionId, from: p.previousOwnerId }); const choice = planTurn(getObservation(state, p.factionId))[0]!; issue(choice); }
      }
    }
  }
  issue({ type: 'endTurn', factionId: state.turnOwnerId });
  const current = new Map<string, string>();
  for (const site of sites) {
    const o = owner(site.cell);
    const key = o ? `${o.factionId}|${o.settlementId}` : '-';
    current.set(site.id, key);
    const before = previous.get(site.id);
    if (before !== undefined && before !== key && before !== '-') {
      const [loser, settlementId] = before.split('|') as [string, string];
      if (!surveyed(loser, site.cell)) continue; // the loser never knew the seam was there
      const cap = captures.find(c => c.settlementId === settlementId && c.turn >= state.turn - 1);
      const town = state.settlements[settlementId];
      const how = cap ? `captured by ${short(cap.by)}` : town ? (town.factionId === loser ? 'borders moved' : `passed to ${short(town.factionId)} (no capture seen)`) : 'razed';
      const armies = fieldArmies(loser);
      const near = Math.min(...armies.map(a => hexDistance(a.cell, site.cell, width)), 999);
      const held = sites.filter(s => surveyed(loser, s.cell) && owner(s.cell)?.factionId === loser).map(s => s.pathId.replace('path.', ''));
      console.log(`turn ${state.turn} LOSS ${short(loser)} loses ${site.pathId.replace('path.', '')} seam hearth ${settlementId}${town ? ` (${town.name})` : ''} at ${site.cell}: ${how}; loser wars [${wars(loser).map(short).join(',')}] field armies ${armies.length} strength ${armies.reduce((s, a) => s + armyStrength(a), 0)} nearest ${near}; still holds [${held.join(',')}]; theater ${(state.theaters ?? []).filter(t => t.factionId === loser).map(t => `${t.settlementIds.includes(settlementId) ? 'covers' : 'omits'} guards ${t.armyIds.length}`).join(';') || 'none'}`);
      if (town && town.factionId !== loser) watch.push({ loser, settlementId, cell: site.cell, path: site.pathId, since: state.turn, holder: town.factionId });
    }
  }
  previous = current;
  if (state.turn % 10 === 0) for (const w of watch) {
    const town = state.settlements[w.settlementId];
    if (!town) continue;
    if (town.factionId === w.loser) { console.log(`turn ${state.turn} RETAKEN ${short(w.loser)} holds ${w.settlementId} again`); watch.splice(watch.indexOf(w), 1); continue; }
    const armies = fieldArmies(w.loser);
    const near = armies.map(a => ({ a, d: hexDistance(a.cell, w.cell, width) })).sort((x, y) => x.d - y.d)[0];
    const garrison = Object.values(state.armies).filter(a => a.cell === town.cell && a.factionId === town.factionId).reduce((s, a) => s + armyStrength(a), 0);
    const siege = state.sieges[w.settlementId];
    const own = Object.values(state.settlements).filter(t => t.factionId === w.loser);
    const dist = Math.min(...own.map(t => hexDistance(t.cell, w.cell, width)), 999);
    console.log(`turn ${state.turn} LOST ${short(w.loser)} ${w.path.replace('path.', '')} ${w.settlementId} held by ${short(town.factionId)} atWar ${wars(w.loser).includes(town.factionId)} wars [${wars(w.loser).map(short).join(',')}] garrison ${garrison} siege ${siege ? short(siege.factionId) : '-'} nearestArmy ${near ? `${near.d} (${armyStrength(near.a)})` : '-'} fieldStrength ${armies.reduce((s, a) => s + armyStrength(a), 0)} hearthDistance ${dist} knowledge ${state.factions.find(f => f.id === w.loser)?.knowledge}`);
  }
}
console.log('ended turn', state.turn, state.victory?.path, state.victory?.factionId);
