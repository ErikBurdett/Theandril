import { hexDistance } from '@theandril/mapgen';
import { getMovementPreview, type ArmyView, type GameCommand, type Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';
import { heldDelegatedArmyIds } from './theaters';
import { planPatrolRecovery } from './patrol-recovery';
export { MAX_PATROL_RECOVERY_ROUTE_QUERIES, MAX_PATROL_RECOVERY_COMMANDS } from './patrol-recovery';

export const MAX_PATROL_ADOPTION_ARMIES = 2;
export const MAX_PATROL_ADOPTION_HEARTHS = 4;
export const MAX_PATROL_ADOPTION_ROUTE_QUERIES = 4;
const MAX_HOME_PATROL_DISTANCE = 6;
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
export interface PatrolPlan extends AiPlan { heldArmyIds: Set<string>; routeQueries: number; targetSearchExpandedNodes: number }

/** Adopt one nearby circuit during peace and retain it through war. Subsequent
 * movement belongs to the saved canonical patrol. Review a blocked home leg
 * explicitly, without rewriting configuration or enabling a paused policy. */
export function planPatrol(view: Observation, reservedArmyIds: ReadonlySet<string> = heldDelegatedArmyIds(view)): PatrolPlan {
  const heldArmyIds = new Set([...heldDelegatedArmyIds(view), ...reservedArmyIds]);
  let routeQueries = 0, targetSearchExpandedNodes = 0;
  const result = (commands: GameCommand[] = [], reasons: string[] = []): PatrolPlan => ({ commands, reasons, heldArmyIds, routeQueries, targetSearchExpandedNodes });
  if (!view.patrols || view.victory || view.battle || view.pendingCapture) return result();
  if (view.patrols.some(patrol => patrol.factionId === view.factionId)) return { ...result(), ...planPatrolRecovery(view) };
  if (view.wars.length) return result();
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  if (towns.length < 2) return result();
  const military = view.armies.filter(army => army.factionId === view.factionId && army.domain === 'land'
    && !army.carrierId && army.canAttack && !army.canFound && !army.formations.some(formation => formation.unitId === 'unit.scout'))
    .sort((a, b) => b.strength - a.strength || b.formations.length - a.formations.length || byId(a, b));
  const committed = new Set([
    ...heldArmyIds, ...military.slice(0, 2).map(army => army.id),
    ...view.routes.map(route => route.armyId), ...view.postings.map(posting => posting.armyId),
    ...view.sieges.map(siege => siege.armyId),
    ...(view.theaters ?? []).flatMap(theater => theater.armyIds),
    ...view.characters.flatMap(character => character.mission ? [character.mission.armyId] : []),
  ]);
  const spares = military.filter(army => !committed.has(army.id) && army.formations.length === 1
    && !army.commander && !army.agents.length && !army.movementBlocker && !army.reorganizationBlocker)
    .sort((a, b) => a.strength - b.strength || byId(a, b)).slice(0, MAX_PATROL_ADOPTION_ARMIES);
  if (!spares.length) return result();
  // One hearth scan and sort around at most two candidate companies, then a
  // constant-size pair search. No realm-wide army/hearth Cartesian routing.
  const candidates = towns.map(town => ({ town, distance: Math.min(...spares.map(army => hexDistance(army.cell, town.cell, view.width))) }))
    .filter(item => item.distance <= MAX_HOME_PATROL_DISTANCE)
    .sort((a, b) => a.distance - b.distance || byId(a.town, b.town))
    .slice(0, MAX_PATROL_ADOPTION_HEARTHS).map(item => item.town);
  const reachability = new Map<string, boolean>();
  const reaches = (army: ArmyView, target: number): boolean => {
    if (army.cell === target) return true;
    const key = `${army.id}:${target}`, previous = reachability.get(key);
    if (previous !== undefined) return previous;
    if (routeQueries >= MAX_PATROL_ADOPTION_ROUTE_QUERIES) return false;
    const preview = getMovementPreview(view, army.id, target);
    routeQueries++; targetSearchExpandedNodes += preview.expandedNodes;
    const allowed = preview.canQueue && preview.action === 'move';
    reachability.set(key, allowed);
    return allowed;
  };
  for (const army of spares) for (let first = 0; first < candidates.length; first++) for (let second = first + 1; second < candidates.length; second++) {
    const a = candidates[first]!, b = candidates[second]!;
    if (a.cell === b.cell || hexDistance(a.cell, b.cell, view.width) > MAX_HOME_PATROL_DISTANCE) continue;
    if (!reaches(army, a.cell) || !reaches(army, b.cell)) continue;
    heldArmyIds.add(army.id);
    return result([{ type: 'setPatrol', factionId: view.factionId, armyId: army.id, firstCell: a.cell, secondCell: b.cell, enabled: true, pauseOnWar: false }],
      [`Post ${army.name} during peace to a defensive circuit between ${a.name} and ${b.name}, retained through war, with two observed safe approaches; retain scouts, delegated guards and the two strongest field armies.`]);
  }
  return result([], routeQueries ? [`No spare company can reach both nearby home-patrol hearths after ${routeQueries} bounded route reviews.`] : []);
}
