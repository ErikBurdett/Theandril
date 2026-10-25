import { hexDistance } from '@theandril/mapgen';
import { getMovementPreview, type ArmyView, type Observation } from '@theandril/sim';
import type { PatrolPlan } from './patrols';

export const MAX_PATROL_RECOVERY_ROUTE_QUERIES = 4;
export const MAX_PATROL_RECOVERY_COMMANDS = 4;
export const MAX_HOME_PATROL_DISTANCE = 6;

/** An AI seat may explicitly review a paused home-patrol leg through commands.
 * Canonical/player travel never resumes itself; safe resume keeps its policy.
 * Routes and patrols have no source marker: an identical manual home circuit
 * is reviewed too when control is handed to AI. A stranded persistent circuit
 * may be cleared, preserving current travel; other destinations and waypoints
 * stay put. Retirement and safe resume share the same command budget. */
export function planPatrolRecovery(view: Observation): Omit<PatrolPlan, 'heldArmyIds'> {
  const result: Omit<PatrolPlan, 'heldArmyIds'> = { commands: [], reasons: [], routeQueries: 0, targetSearchExpandedNodes: 0 };
  const patrols = (view.patrols ?? []).filter(patrol => patrol.factionId === view.factionId)
    .sort((a, b) => a.armyId < b.armyId ? -1 : a.armyId > b.armyId ? 1 : 0);
  if (!patrols.length || view.victory || view.battle || view.pendingCapture) return result;
  // Index observed global collections once; bounded local sight checks avoid
  // a patrol-by-enemy Cartesian scan even at the 128-record realm limit.
  const armies = new Map(view.armies.map(army => [army.id, army]));
  const routes = new Map(view.routes.map(route => [route.armyId, route]));
  const hearths = new Map(view.settlements.map(town => [town.cell, town]));
  const ownHearths = new Set(view.settlements.filter(town => town.factionId === view.factionId).map(town => town.cell));
  // Foreign settlement rows are currently observed in canonical observations.
  // Check explicit visibility as well, indexing cells only when a candidate
  // actually has a foreign target. Ordinary recovery avoids this O(cells) pass.
  let visibleCells: Set<number> | undefined;
  const supplied = new Set(view.supply.filter(item => item.supplied).map(item => item.armyId));
  const overridden = new Set([
    ...view.postings.map(posting => posting.armyId), ...view.sieges.map(siege => siege.armyId),
    ...view.characters.flatMap(character => character.mission ? [character.mission.armyId] : []),
  ]);
  const enemies = new Set(view.wars);
  const hostileCells = new Set([...view.armies, ...view.settlements]
    .filter(entity => enemies.has(entity.factionId)).map(entity => entity.cell));
  const nearbyHostile = (army: ArmyView): boolean => {
    if (!hostileCells.size) return false;
    const x = army.cell % view.width, y = Math.floor(army.cell / view.width);
    for (let row = Math.max(0, y - army.sight); row <= Math.min(view.height - 1, y + army.sight); row++) {
      for (let column = Math.max(0, x - army.sight - 1); column <= Math.min(view.width - 1, x + army.sight + 1); column++) {
        const cell = row * view.width + column;
        if (hostileCells.has(cell) && hexDistance(army.cell, cell, view.width) <= army.sight) return true;
      }
    }
    return false;
  };
  const offset = ((view.turn - 1) * MAX_PATROL_RECOVERY_ROUTE_QUERIES) % patrols.length;
  for (let i = 0; i < patrols.length; i++) {
    if (result.commands.length >= MAX_PATROL_RECOVERY_COMMANDS || result.routeQueries >= MAX_PATROL_RECOVERY_ROUTE_QUERIES) break;
    const patrol = patrols[(offset + i) % patrols.length]!;
    const army = armies.get(patrol.armyId), route = routes.get(patrol.armyId);
    if (!patrol.enabled || patrol.status !== 'waiting' || !army || army.factionId !== view.factionId
      || army.domain !== 'land' || army.carrierId || !army.canAttack || army.canFound
      || overridden.has(army.id)
      || route?.status !== 'paused' || route.waypoints.length !== 1 || route.waypoints[0] !== patrol.targetCell) continue;
    const target = hearths.get(patrol.targetCell);
    const otherCell = patrol.target === 'first' ? patrol.secondCell : patrol.firstCell;
    if (!patrol.pauseOnWar && target && target.factionId !== view.factionId && ownHearths.has(otherCell)
      && hexDistance(patrol.firstCell, patrol.secondCell, view.width) <= MAX_HOME_PATROL_DISTANCE) {
      visibleCells ??= new Set(view.cells.filter(cell => cell.visible).map(cell => cell.cell));
      if (visibleCells.has(target.cell)) {
        // Administrative cleanup spends no movement and issues no attack. Keep
        // this actor reserved for the current batch; only a fresh observation
        // may release it, including any independent theater reservation.
        result.commands.push({ type: 'clearPatrol', factionId: view.factionId, armyId: army.id });
        result.reasons.push(`Retire ${army.name}'s stranded home patrol: ${target.name} is visibly foreign, the other hearth remains owned, and the matching single leg is paused. Preserve current travel for a fresh decision.`);
        continue;
      }
    }
    if (army.movement <= 0 || army.movementBlocker || !supplied.has(army.id)
      || !ownHearths.has(patrol.firstCell) || !ownHearths.has(patrol.secondCell) || nearbyHostile(army)) continue;
    if (army.cell !== patrol.targetCell) {
      const preview = getMovementPreview(view, army.id, patrol.targetCell);
      result.routeQueries++; result.targetSearchExpandedNodes += preview.expandedNodes;
      if (!preview.canQueue || preview.action !== 'move') continue;
    }
    // resumeMovement also clears an already-arrived single leg. It never
    // replaces the destination or silently abandons a later waypoint.
    result.commands.push({ type: 'resumeMovement', factionId: view.factionId, armyId: army.id });
    result.reasons.push(`Review ${army.name}'s interrupted home patrol: both hearths remain owned, the army is supplied, no observed wartime force or hearth is within sight, and the single saved leg is safe to resume.`);
  }
  return result;
}
