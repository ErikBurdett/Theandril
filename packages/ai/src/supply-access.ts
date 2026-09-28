import { hexDistance, isPassable, TERRAIN, WATER_DEPTH } from '@theandril/mapgen';
import { assessSupplyAccess, assessSupplyAccessOffer, getMovementPreview, MAX_SUPPLY_ACCESS_IMPORTS,
  previewSupplyAccessCells, SUPPLY_ACCESS_COIN_PER_TURN, type Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';
import { observedCells } from './observation-index';

const TERM_TURNS = 10;
const RESERVE_COIN = 24;
export const SUPPLY_ACCESS_REQUEST_INTERVAL = 10;
export const MAX_SUPPLY_ACCESS_ROUTE_QUERIES = 8;
export interface SupplyAccessPlan extends AiPlan { heldArmyIds: Set<string> }
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Pending requests are promises to keep their entire fees available. */
export function pendingSupplyAccessFees(view: Observation): number {
  return (view.supplyAccess?.offers ?? []).filter(offer => offer.buyerId === view.factionId && offer.expiresTurn > view.turn)
    .reduce((total, offer) => total + offer.feeCoin, 0);
}

/** Settle one incoming request, then let the caller observe the new purse and
 * supply facts before planning the realm's ordinary work. */
export function answerSupplyAccess(view: Observation): AiPlan | null {
  const offer = [...(view.supplyAccess?.offers ?? [])].filter(item => item.providerId === view.factionId && item.expiresTurn > view.turn)
    .sort((a, b) => a.createdTurn - b.createdTurn || byId(a, b))[0];
  if (!offer) return null;
  const assessment = assessSupplyAccessOffer(view, offer), accept = assessment.band === 'likely';
  return { commands: [{ type: 'respondSupplyAccess', factionId: view.factionId, offerId: offer.id, accept }],
    reasons: [`${accept ? 'Accept' : 'Refuse'} ${offer.id}: ${[...assessment.reasons, ...assessment.objections].join(' ')}`] };
}

/** One occasional source-specific purchase beside normal turn work. It never
 * moves the needy actor or replaces a direct route, posting or theater. Each
 * source's benefit comes from the sim's permitted supply forecast; route
 * feasibility comes from the ordinary bounded command preview. */
export function planSupplyAccess(view: Observation, reservedCoin = 0): SupplyAccessPlan | null {
  const access = view.supplyAccess, feeCoin = TERM_TURNS * SUPPLY_ACCESS_COIN_PER_TURN;
  const slot = [...view.factionId].reduce((total, char) => total + char.charCodeAt(0), 0) % SUPPLY_ACCESS_REQUEST_INTERVAL;
  if (!access || view.victory || view.battle || view.pendingCapture || view.turn % SUPPLY_ACCESS_REQUEST_INTERVAL !== slot
    || access.offers.some(offer => offer.buyerId === view.factionId && offer.expiresTurn > view.turn)
    || access.agreements.filter(agreement => agreement.buyerId === view.factionId && agreement.expiresTurn > view.turn).length >= MAX_SUPPLY_ACCESS_IMPORTS
    || view.treasury - reservedCoin < feeCoin + RESERVE_COIN) return null;
  const supply = new Map(view.supply.map(item => [item.armyId, item]));
  const routed = new Set(view.routes.map(route => route.armyId));
  const actors = view.armies.filter(army => army.factionId === view.factionId && !army.carrierId && !routed.has(army.id) && !army.movementBlocker
    && (army.domain === 'naval' ? Boolean(supply.get(army.id)?.fleetProvisions && !supply.get(army.id)!.fleetProvisions!.refilling
      && supply.get(army.id)!.fleetProvisions!.remaining <= supply.get(army.id)!.fleetProvisions!.capacity / 2) : supply.get(army.id)?.supplied === false))
    .sort((a, b) => Number(b.domain === 'naval') - Number(a.domain === 'naval') || byId(a, b)).slice(0, 2);
  if (!actors.length) return null;
  const contracted = new Set(access.agreements.filter(agreement => agreement.buyerId === view.factionId).map(agreement => agreement.source.settlementId));
  const sources = view.settlements.filter(town => town.factionId !== view.factionId && !view.wars.includes(town.factionId) && !contracted.has(town.id))
    .map(town => ({ town, distance: Math.min(...actors.map(army => hexDistance(army.cell, town.cell, view.width))) }))
    .sort((a, b) => a.distance - b.distance || byId(a.town, b.town)).slice(0, 4);
  const cells = observedCells(view);
  let routeQueries = 0;
  for (const { town } of sources) {
    const command = { type: 'proposeSupplyAccess' as const, factionId: view.factionId, targetFactionId: town.factionId,
      settlementId: town.id, feeCoin, termTurns: TERM_TURNS };
    if (assessSupplyAccess(view, command).band !== 'likely') continue;
    const reach = previewSupplyAccessCells(view, town.id);
    for (const army of actors) {
      const compatible = (cell: number) => {
        const known = cells.get(cell);
        return known && (army.domain === 'naval' ? known.terrain === TERRAIN.water && (known.waterDepth !== WATER_DEPTH.deep || army.canEnterDeepWater) : isPassable(known.terrain));
      };
      const target = reach.filter(cell => cell !== town.cell && compatible(cell))
        .sort((a, b) => hexDistance(army.cell, a, view.width) - hexDistance(army.cell, b, view.width) || a - b)[0];
      if (target === undefined) continue;
      const distance = hexDistance(army.cell, target, view.width);
      // Existing known supply gets first use, including other active contracts.
      // This conservative distance veto spends no extra navigation queries and
      // does not pretend geometric proximity proves an unobstructed own route.
      if (view.suppliedCells.some(cell => compatible(cell) && hexDistance(army.cell, cell, view.width) <= distance)) continue;
      if (target !== army.cell) {
        if (routeQueries >= MAX_SUPPLY_ACCESS_ROUTE_QUERIES) return null;
        const preview = getMovementPreview(view, army.id, target); routeQueries++;
        if (!preview.canQueue || preview.action !== 'move') continue;
      }
      return { commands: [command], heldArmyIds: new Set([army.id]), reasons: [`Request ${TERM_TURNS} turns of supply from ${town.name} for ${feeCoin} coin: ${army.name} needs ${army.domain === 'naval' ? 'a harbor refill' : 'field provisions'} and can reach the observed contracted line. Retain the fee until the provider answers.`] };
    }
  }
  return null;
}
