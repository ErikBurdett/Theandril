import { hexDistance } from '@theandril/mapgen';
import { getMovementPreview, type ArmyView, type GameCommand, type Observation, type ObservedDefenseTheater } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** A theater's direct overrides remain the player's orders, not spare AI actors. */
export function heldTheaterArmyIds(view: Observation): Set<string> {
  return new Set((view.theaters ?? []).filter(theater => theater.factionId === view.factionId && theater.enabled)
    .flatMap(theater => theater.armyIds));
}

/** Enabled standing delegation keeps an army out of competing actor planners. */
export function heldDelegatedArmyIds(view: Observation): Set<string> {
  return new Set([...heldTheaterArmyIds(view), ...(view.patrols ?? [])
    .filter(patrol => patrol.factionId === view.factionId && patrol.enabled).map(patrol => patrol.armyId)]);
}

export const MAX_THEATER_ADOPTION_HEARTHS = 4;
export const MAX_THEATER_ADOPTION_ROUTE_QUERIES = 8;
export interface TheaterPlan extends AiPlan { heldArmyIds: Set<string>; routeQueries: number; targetSearchExpandedNodes: number }

/** Establish one small home watch from spare companies. The canonical theater
 * owns subsequent distribution; the AI neither duplicates its routing nor
 * rewrites a player's existing (including paused) theater configuration. */
export function planDefenseTheater(view: Observation): TheaterPlan {
  const heldArmyIds = heldDelegatedArmyIds(view);
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
  const limit = Math.min(view.theaterReinforcement ? 3 : 2, Math.floor(military.length / 3));
  if (!limit) return result();
  const committed = new Set([
    ...heldArmyIds,
    ...(view.patrols ?? []).map(patrol => patrol.armyId),
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
  // A cheap distance ranking selects four local alternatives. At most eight
  // ordinary permitted previews cover the bounded spares; no realm-wide
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
    reserveCell: reserve.cell, guardsPerSettlement: 1, enabled: true, ...(view.theaterReinforcement ? { reinforcementLimit: 1 } : {}) }],
  [`Delegate ${armyIds.length} spare compan${armyIds.length === 1 ? 'y' : 'ies'} to a home watch of ${settlementIds.length} hearth${settlementIds.length === 1 ? '' : 's'}, one army each; retain scouts and the two strongest field armies.`]);
}

/** The AI's own home watch, by the name it gives it; a player's theaters are never rewritten. */
export const HOME_WATCH_NAME = 'Home watch';
const spareCompanies = (view: Observation, heldArmyIds: ReadonlySet<string>): ArmyView[] => {
  const military = view.armies.filter(army => army.factionId === view.factionId && army.domain === 'land'
    && !army.carrierId && army.canAttack && !army.canFound && !army.formations.some(formation => formation.unitId === 'unit.scout'))
    .sort((a, b) => b.strength - a.strength || b.formations.length - a.formations.length || byId(a, b));
  const committed = new Set([
    ...heldArmyIds,
    ...(view.patrols ?? []).map(patrol => patrol.armyId),
    ...(view.theaters ?? []).flatMap(theater => theater.armyIds),
    ...military.slice(0, 2).map(army => army.id),
    ...view.routes.map(route => route.armyId),
    ...view.postings.map(posting => posting.armyId),
    ...view.sieges.map(siege => siege.armyId),
  ]);
  return military.filter(army => !committed.has(army.id) && army.formations.length === 1
    && !army.commander && !army.agents.length && !army.movementBlocker && !army.reorganizationBlocker);
};

/** A hearth whose borders hold a surveyed seam is what the realm's arcane road
 * stands on, and it was lost, in every measured case, to a company too small to
 * besiege a guarded hearth. Once the realm holds one, its own home watch adopts
 * it, and one spare company for each hearth the watch is short, so the
 * canonical theater keeps a guard there; the watch's other hearths, reserve and
 * policy are kept. At most the adoption bound of hearths and route reviews;
 * nothing is rewritten when every held seam hearth is already watched. */
export function planSeamWatch(view: Observation, heldArmyIds: ReadonlySet<string> = heldDelegatedArmyIds(view)): TheaterPlan | null {
  if (!view.theaters || view.victory || view.battle || view.pendingCapture) return null;
  const watch: ObservedDefenseTheater | undefined = view.theaters.find(theater => theater.factionId === view.factionId && theater.enabled && theater.name === HOME_WATCH_NAME);
  if (!watch) return null;
  const watched = new Set(view.theaters.filter(theater => theater.factionId === view.factionId).flatMap(theater => theater.settlementIds));
  const own = new Map(view.settlements.filter(town => town.factionId === view.factionId).map(town => [town.id, town]));
  const paths = new Map<string, Set<string>>();
  for (const site of view.arcaneSites) if (site.controlled && site.settlementId && own.has(site.settlementId)) paths.set(site.settlementId, (paths.get(site.settlementId) ?? new Set()).add(site.pathId));
  const room = Math.max(0, MAX_THEATER_ADOPTION_HEARTHS - watch.settlementIds.length);
  const adopted = [...paths.keys()].filter(id => !watched.has(id))
    .sort((a, b) => paths.get(b)!.size - paths.get(a)!.size || (a < b ? -1 : a > b ? 1 : 0)).slice(0, room);
  if (!adopted.length) return null;
  const settlementIds = [...watch.settlementIds, ...adopted].sort();
  const held = new Set(heldArmyIds);
  let routeQueries = 0, targetSearchExpandedNodes = 0;
  const shortfall = Math.max(0, settlementIds.length - watch.armyIds.length);
  const members: string[] = [];
  if (shortfall) {
    const towns = adopted.map(id => own.get(id)!);
    const spares = spareCompanies(view, held)
      .sort((a, b) => Math.min(...towns.map(town => hexDistance(a.cell, town.cell, view.width))) - Math.min(...towns.map(town => hexDistance(b.cell, town.cell, view.width))) || byId(a, b));
    for (const army of spares) {
      if (members.length >= shortfall || routeQueries >= MAX_THEATER_ADOPTION_ROUTE_QUERIES) break;
      const nearest = towns.sort((a, b) => hexDistance(army.cell, a.cell, view.width) - hexDistance(army.cell, b.cell, view.width) || byId(a, b))[0]!;
      if (army.cell !== nearest.cell) {
        const preview = getMovementPreview(view, army.id, nearest.cell);
        routeQueries++; targetSearchExpandedNodes += preview.expandedNodes;
        if (!preview.canQueue || preview.action !== 'move') continue;
      }
      members.push(army.id);
    }
  }
  const armyIds = [...watch.armyIds, ...members].sort();
  for (const id of members) held.add(id);
  const names = adopted.map(id => own.get(id)!.name);
  return { commands: [{ type: 'setTheater', theaterId: watch.id, factionId: view.factionId, name: watch.name, settlementIds, armyIds,
    reserveCell: watch.reserveCell, guardsPerSettlement: watch.guardsPerSettlement, enabled: true, ...(watch.reinforcementLimit ? { reinforcementLimit: watch.reinforcementLimit } : {}) }],
  reasons: [`The home watch adopts ${names.join(' and ')}: ${adopted.length === 1 ? 'its borders hold' : 'their borders hold'} a surveyed seam${members.length ? `, with ${members.length} spare compan${members.length === 1 ? 'y' : 'ies'} to guard it` : shortfall ? ', though no spare company is free to guard it yet' : ''}.`],
  heldArmyIds: held, routeQueries, targetSearchExpandedNodes };
}
