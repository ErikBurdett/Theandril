import { hexDistance } from '@theandril/mapgen';
import { getMovementPreview, type ArmyView, type GameCommand, type Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** A theater's direct overrides remain the player's orders, not spare AI actors. */
export function heldTheaterArmyIds(view: Observation): Set<string> {
  return new Set((view.theaters ?? []).filter(theater => theater.factionId === view.factionId && theater.enabled)
    .flatMap(theater => theater.armyIds));
}

export const MAX_THEATER_ADOPTION_HEARTHS = 4;
export const MAX_THEATER_ADOPTION_ROUTE_QUERIES = 8;
export interface TheaterPlan extends AiPlan { heldArmyIds: Set<string>; routeQueries: number; targetSearchExpandedNodes: number }

/** Establish one small home watch from spare companies. The canonical theater
 * owns subsequent distribution; the AI neither duplicates its routing nor
 * rewrites a player's existing (including paused) theater configuration. */
export function planDefenseTheater(view: Observation): TheaterPlan {
  const heldArmyIds = heldTheaterArmyIds(view);
  let routeQueries = 0, targetSearchExpandedNodes = 0;
  const result = (commands: GameCommand[] = [], reasons: string[] = []): TheaterPlan => ({ commands, reasons, heldArmyIds, routeQueries, targetSearchExpandedNodes });
  if (!view.theaters || view.theaters.some(theater => theater.factionId === view.factionId)
    || view.victory || view.battle || view.pendingCapture) return result();
  const towns = view.settlements.filter(town => town.factionId === view.factionId).sort(byId);
  if (towns.length < 2) return result();
  // Scouts and caravans retain exploration/settlement duties. Keep the two
  // strongest ordinary containers for field operations, including a commander.
  const military = view.armies.filter(army => army.factionId === view.factionId && army.domain === 'land'
    && !army.carrierId && army.canAttack && !army.canFound
    && !army.formations.some(formation => formation.unitId === 'unit.scout'))
    .sort((a, b) => b.strength - a.strength || b.formations.length - a.formations.length || byId(a, b));
  const limit = Math.min(2, Math.floor(military.length / 3));
  if (!limit) return result();
  const committed = new Set([
    ...military.slice(0, 2).map(army => army.id),
    ...view.routes.map(route => route.armyId),
    ...view.postings.map(posting => posting.armyId),
    ...view.sieges.map(siege => siege.armyId),
  ]);
  const spares = military.filter(army => !committed.has(army.id) && army.formations.length === 1
    && !army.commander && !army.agents.length && !army.movementBlocker && !army.reorganizationBlocker)
    .sort((a, b) => hexDistance(a.cell, towns[0]!.cell, view.width) - hexDistance(b.cell, towns[0]!.cell, view.width) || byId(a, b))
    .slice(0, limit);
  if (!spares.length) return result();
  // A cheap distance ranking selects four local alternatives. At most two
  // spares × four hearths use ordinary permitted previews; no realm-wide
  // Cartesian route search, synthetic terrain rule or hidden connectivity.
  const candidates = towns.map(town => ({ town, distance: Math.min(...spares.map(army => hexDistance(army.cell, town.cell, view.width))) }))
    .sort((a, b) => a.distance - b.distance || byId(a.town, b.town)).slice(0, MAX_THEATER_ADOPTION_HEARTHS).map(item => item.town);
  const reachability = new Map<string, boolean>();
  const reaches = (army: ArmyView, target: number): boolean => {
    if (army.cell === target) return true; // A stationed guard needs no travel order.
    const key = `${army.id}:${target}`, cached = reachability.get(key);
    if (cached !== undefined) return cached;
    if (routeQueries >= MAX_THEATER_ADOPTION_ROUTE_QUERIES) return false;
    const preview = getMovementPreview(view, army.id, target);
    routeQueries++; targetSearchExpandedNodes += preview.expandedNodes;
    const accepted = preview.canQueue && preview.action === 'move';
    reachability.set(key, accepted);
    return accepted;
  };
  let reserve: typeof towns[number] | undefined, members: typeof spares = [];
  for (const town of candidates) {
    const reachable = spares.filter(army => reaches(army, town.cell));
    if (reachable.length) { reserve = town; members = reachable; break; }
  }
  if (!reserve) return result([], [`No spare company has a safe observed route to a candidate home-watch hearth after ${routeQueries} bounded route reviews.`]);
  const protectedTowns = [reserve];
  if (members.length > 1) {
    const additional = candidates.find(town => town.id !== reserve.id && members.some(army => reaches(army, town.cell)));
    if (additional) protectedTowns.push(additional);
  }
  const armyIds = members.map(army => army.id).sort();
  for (const armyId of armyIds) heldArmyIds.add(armyId);
  const settlementIds = protectedTowns.map(town => town.id).sort();
  return result([{ type: 'setTheater', factionId: view.factionId, name: 'Home watch', settlementIds, armyIds,
    reserveCell: reserve.cell, guardsPerSettlement: 1, enabled: true }],
  [`Delegate ${armyIds.length} spare compan${armyIds.length === 1 ? 'y' : 'ies'} to a home watch of ${settlementIds.length} hearth${settlementIds.length === 1 ? '' : 's'}, one army each; retain scouts and the two strongest field armies.`]);
}
