import { hexDistance } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import { getMovementQuery } from '@theandril/sim';

/** Rules 80 readiness: a conquered hearth whose lanes may rise for its founder
 * is garrisoned before they do. The observation names the founder a hearth may
 * rise for; once its unrest reaches the watch level, a company standing in it
 * is held there and, if none stands there, the nearest free land company is
 * ordered in by a road the rules say can be queued. Everything is read from
 * the holder's own observation; the simulation still decides the rising. */
export const GARRISON_UNREST = 50;
export const MAX_GARRISON_ORDERS = 2;
const byId = <T extends { id: string }>(a: T, b: T): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export function planGarrisons(view: Observation, held: ReadonlySet<string>): { commands: GameCommand[]; reasons: string[]; heldArmyIds: Set<string> } {
  const commands: GameCommand[] = [], reasons: string[] = [], heldArmyIds = new Set<string>();
  const rising = (view.unrest ?? []).filter(item => item.rising && item.level >= GARRISON_UNREST).sort((a, b) => a.settlementId < b.settlementId ? -1 : 1);
  if (!rising.length || view.battle || view.pendingCapture) return { commands, reasons, heldArmyIds };
  const routed = new Set(view.routes.map(route => route.armyId));
  const besieging = new Set(view.sieges.filter(siege => siege.factionId === view.factionId).map(siege => siege.armyId));
  const own = view.armies.filter(army => army.factionId === view.factionId && army.domain === 'land' && !army.carrierId && !besieging.has(army.id)).sort(byId);
  for (const item of rising) {
    const town = view.settlements.find(town => town.id === item.settlementId && town.factionId === view.factionId);
    if (!town) continue;
    const standing = item.garrisoned ? own.find(army => army.cell === town.cell) : undefined;
    if (standing) { heldArmyIds.add(standing.id); reasons.push(`${standing.name} holds ${town.name}, whose lanes may rise for ${item.rising} at unrest ${item.level}.`); continue; }
    if (item.garrisoned || commands.length >= MAX_GARRISON_ORDERS) continue;
    const candidates = own.filter(army => !held.has(army.id) && !heldArmyIds.has(army.id) && !army.movementBlocker && !routed.has(army.id))
      .sort((a, b) => hexDistance(a.cell, town.cell, view.width) - hexDistance(b.cell, town.cell, view.width) || byId(a, b));
    for (const army of candidates) {
      const preview = getMovementQuery(view, army.id, town.cell).preview;
      if (!preview?.canQueue || preview.action !== 'move') continue;
      commands.push({ type: 'queueMovement', factionId: view.factionId, armyId: army.id, target: town.cell });
      heldArmyIds.add(army.id);
      reasons.push(`Send ${army.name} to garrison ${town.name} (${hexDistance(army.cell, town.cell, view.width)} hexes): its lanes may rise for ${item.rising} at unrest ${item.level}.`);
      break;
    }
  }
  return { commands, reasons, heldArmyIds };
}
