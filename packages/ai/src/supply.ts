import { hexDistance } from '@theandril/mapgen';
import { DEPOT_SPACING, MAX_REALM_DEPOTS, type Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 28. A realm at war whose force is wasting outside supply raises a depot
 * under it rather than abandon the operation. One a turn, out of surplus, and only
 * under a force that is actually suffering. A realm at peace walks its companies
 * home instead: a depot and its upkeep are a war expense, not a standing line. */
const DEPOT_RESERVE = 60;

export function planDepot(view: Observation, busy: ReadonlySet<string>): AiPlan | null {
  if (!view.depotCoinCost || !view.wars.length || view.treasury < view.depotCoinCost + DEPOT_RESERVE) return null;
  if (!view.settlements.some(town => town.factionId === view.factionId)) return null;
  const starving = new Set(view.supply.filter(item => !item.supplied).map(item => item.armyId));
  if (!starving.size) return null;
  const own = view.depots.filter(depot => depot.factionId === view.factionId);
  if (own.length >= MAX_REALM_DEPOTS) return null;
  const hearths = new Set(view.settlements.map(item => item.cell));
  const candidates = view.armies.filter(item => item.factionId === view.factionId && item.domain !== 'naval' && starving.has(item.id) && item.movement > 0 && !item.carrierId && !busy.has(item.id)
    && !hearths.has(item.cell) && !view.depots.some(depot => depot.cell === item.cell)
    && own.every(depot => hexDistance(depot.cell, item.cell, view.width) >= DEPOT_SPACING));
  if (!candidates.length) return null;
  // Ground another realm has claimed is refused by the rules, so never ask for it.
  const wanted = new Set(candidates.map(item => item.cell));
  const foreign = new Set(view.cells.filter(cell => wanted.has(cell.cell) && cell.factionId && cell.factionId !== view.factionId).map(cell => cell.cell));
  const army = candidates.filter(item => !foreign.has(item.cell))
    .sort((a, b) => b.formations.length - a.formations.length || (a.id < b.id ? -1 : 1))[0];
  if (!army) return null;
  return {
    commands: [{ type: 'buildDepot', factionId: view.factionId, armyId: army.id }],
    reasons: [`Raise a depot under ${army.name} for ${view.depotCoinCost} coin: it stands outside supply and wastes away where it is.`],
  };
}
