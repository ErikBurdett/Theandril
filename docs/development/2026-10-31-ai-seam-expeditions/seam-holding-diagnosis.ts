import { applyCommand, createGame, getObservation, type GameCommand, type GameState } from '../../../packages/sim/src/index';
import { arcaneSites } from '../../../packages/sim/src/arcane-sites';
import { hexDistance } from '../../../packages/mapgen/src/index';
import { planTurn } from '../../../packages/ai/src/index';

const pace = (process.argv[2] ?? 'epic') as 'epic' | 'long' | 'standard'; const size = (process.argv[3] ?? 'standard') as 'tiny' | 'standard'; const seats = Number(process.argv[4] ?? 12);
const checkpoints = (process.argv[5] ?? '100,200,300').split(',').map(Number);
const state: GameState = createGame({ seed: 20260905, pace, size, factionCount: seats });
const sites = arcaneSites(state.world);
console.log('seams', sites.length, 'by path', Object.entries(sites.reduce((m, s) => ({ ...m, [s.pathId]: (m[s.pathId] ?? 0) + 1 }), {} as Record<string, number>)));
const attune: Record<string, number[]> = {};
const issue = (command: GameCommand) => {
  const result = applyCommand(state, command);
  if (command.type === 'startAttunement' && result.ok) (attune[command.factionId] ??= []).push(state.turn);
  return result;
};
const owner = (cell: number): { settlementId: string; factionId: string } | null => {
  for (const [settlementId, land] of Object.entries(state.land.settlements)) if (land.claimed.includes(cell)) return { settlementId, factionId: state.settlements[settlementId]!.factionId };
  return null;
};
const report = (label: string) => {
  console.log(`--- ${label}: turn ${state.turn}`);
  for (const faction of state.factions) {
    const view = getObservation(state, faction.id);
    const towns = Object.values(state.settlements).filter(t => t.factionId === faction.id);
    const held = [...new Set(view.arcaneSites.filter(s => s.controlled).map(s => s.pathId))].sort();
    const unheld = view.arcaneSites.filter(s => !s.controlled && !held.includes(s.pathId));
    const lines = unheld.map(s => {
      const o = owner(s.cell);
      const nearestOwn = towns.length ? Math.min(...towns.map(t => hexDistance(t.cell, s.cell, state.world.width))) : -1;
      const nearestOwnId = towns.length ? towns.sort((a, b) => hexDistance(a.cell, s.cell, state.world.width) - hexDistance(b.cell, s.cell, state.world.width))[0]!.id : '-';
      const landView = view.land.settlements.find(l => l.cells.some(c => c.cell === s.cell));
      const claimable = landView?.cells.find(c => c.cell === s.cell)?.claim;
      const wars = view.wars.includes(o?.factionId ?? '');
      return `${s.pathId.replace('path.', '')}@${s.cell} owner=${o ? `${o.factionId.replace('faction.', '')}${o.factionId === faction.id ? '(self)' : wars ? '(war)' : '(peace)'}` : 'none'} nearestOwn=${nearestOwn}(${nearestOwnId}) claim=${claimable ? `${claimable.canStart ? 'canStart' : claimable.blocker ?? 'blocked'}/${claimable.coinCost}` : 'n/a'}`;
    });
    console.log(faction.id.replace('faction.', '').padEnd(20), 'towns', String(towns.length).padStart(2), 'held', held.map(p => p.replace('path.', '')).join(',').padEnd(10), 'treasury', String(faction.treasury).padStart(5), '| unheld:', lines.join(' ; ') || '-');
  }
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
  if (checkpoints.includes(state.turn)) report(`checkpoint`);
}
report('end');
console.log('ended turn', state.turn, state.victory?.path, state.victory?.factionId, 'attunements', JSON.stringify(attune));
