// Frozen schema-4/5 compatibility planner captured 2026-09-05; never used by runtime AI.
import { BUILDINGS, UNITS } from '@theandril/content';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import { planDiplomacy, protectedFactions, type AiPlan } from './legacy-diplomacy';
import { planConquestDecision } from './legacy-conquest';
import { planProgression } from './legacy-progression';

export { chooseCaptureOption } from './legacy-conquest';
export type { AiPlan } from './legacy-diplomacy';
const units = new Map(UNITS.map(unit => [unit.id, unit]));

/** Bounded proposals use only this faction's filtered observation. Sim validates every one. */
export function planTurn(view: Observation): GameCommand[] {
  return planTurnWithReasons(view).commands;
}

export function planTurnWithReasons(view: Observation): AiPlan {
  if (view.victory) return { commands: [], reasons: ['The campaign has ended; no further orders are proposed.'] };
  if (view.battle) return { commands: [{ type: 'autoResolveBattle', factionId: view.factionId }], reasons: ['Resolve the current battle through shared tactical rules.'] };
  const capture = view.pendingCapture ? planConquestDecision(view) : null;
  if (capture) return capture;
  const diplomatic = planDiplomacy(view);
  if (diplomatic) return diplomatic;
  const siegeDecision = planConquestDecision(view);
  if (siegeDecision) return siegeDecision;
  const advancement = planProgression(view);
  if (advancement.commands.some(command => command.type === 'startVictoryProject')) return advancement;
  const plans: GameCommand[] = [...advancement.commands];
  const reasons: string[] = [...advancement.reasons];
  const factionId = view.factionId;
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const ownSettlements = view.settlements.filter(town => town.factionId === factionId);
  const ownArmies = view.armies.filter(army => army.factionId === factionId);
  const protectedIds = protectedFactions(view);
  const enemies = view.armies.filter(army => army.factionId !== factionId);
  const enemyTowns = view.settlements.filter(town => town.factionId !== factionId);
  const enemyByCell = new Map<number, typeof enemies>();
  const strengthByCell = new Map<number, number>();
  for (const enemy of enemies) {
    const stack = enemyByCell.get(enemy.cell) ?? [];
    stack.push(enemy); enemyByCell.set(enemy.cell, stack);
    strengthByCell.set(enemy.cell, (strengthByCell.get(enemy.cell) ?? 0) + enemy.strength);
  }
  const townByCell = new Map(enemyTowns.map(town => [town.cell, town]));
  const besiegers = new Set(view.sieges.map(siege => siege.armyId));
  const besiegedTowns = new Set([...view.sieges.map(siege => siege.settlementId), ...view.visibleSiegeSettlementIds]);
  const projectHosts = new Set(view.projects.filter(project => project.factionId !== factionId && (project.status === 'active' || project.status === 'paused')).map(project => project.settlementId));
  const objectives = enemyTowns.filter(town => !protectedIds.has(town.factionId)).sort((a, b) => Number(projectHosts.has(b.id)) - Number(projectHosts.has(a.id)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, 64);
  const approachCells = [...new Set([...enemies, ...enemyTowns].filter(entity => !protectedIds.has(entity.factionId)).map(entity => entity.cell))].slice(0, 64);
  const enemyCells = new Set(view.armies.filter(army => army.factionId !== factionId).map(army => army.cell));
  for (const town of view.settlements) if (town.factionId !== factionId) enemyCells.add(town.cell);
  const hasColonist = ownArmies.some(army => army.unitId === 'unit.colonist');
  let plannedColonist = hasColonist || ownSettlements.some(town => town.queue.some(order => order.itemId === 'unit.colonist'));
  const militaryCount = ownArmies.filter(army => army.unitId === 'unit.guard').length;
  const rotate = <T,>(items: T[], stride: number): T[] => {
    const offset = items.length ? ((view.turn - 1) * stride) % items.length : 0;
    return [...items.slice(offset), ...items.slice(0, offset)];
  };
  let budget = Math.max(0, view.treasury - advancement.coinSpent - advancement.reserve);
  let plannedGuards = ownSettlements.reduce((count, town) => count + town.queue.filter(order => order.itemId === 'unit.guard').length, 0);
  const productionLimit = plans.length + 96;
  for (const town of rotate(ownSettlements, 96)) {
    if (plans.length >= productionLimit) break;
    if (town.queue.length) continue;
    const building = BUILDINGS.find(item => !town.buildings.includes(item.id) && item.coinCost <= budget);
    const item = building ?? (ownSettlements.length < 4 && !plannedColonist ? UNITS[0] : militaryCount + plannedGuards < ownSettlements.length * 2 ? UNITS.find(unit => unit.id === 'unit.guard') : undefined);
    if (item && budget >= item.coinCost) {
      plans.push({ type: 'queue', factionId, settlementId: town.id, itemId: item.id });
      budget -= item.coinCost;
      if (item.id === 'unit.colonist') plannedColonist = true;
      if (item.id === 'unit.guard') plannedGuards++;
    }
  }
  const claimed = new Set<number>();
  const wars = new Set(view.wars);
  const settlementNames = new Set(ownSettlements.map(town => town.name));
  let hearthNumber = ownSettlements.length;
  for (const army of rotate(ownArmies, 32).slice(0, 128)) {
    if (plans.length >= 128) break;
    const unit = units.get(army.unitId);
    if (besiegers.has(army.id)) continue; // Maintaining pressure is an intentional siege order.
    if (unit?.canFound && army.movement > 0 && view.settlements.every(town => hexDistance(town.cell, army.cell, view.width) >= 4)) {
      let name: string;
      do { name = `Hearth ${++hearthNumber}`; } while (settlementNames.has(name));
      settlementNames.add(name);
      plans.push({ type: 'found', factionId, armyId: army.id, name });
      continue;
    }
    if (army.movement <= 0) continue;
    const adjacent = neighbors(army.cell, view.width, view.height);
    const targets = adjacent.flatMap(cell => {
      const stack = enemyByCell.get(cell) ?? [];
      return stack.length <= 12 ? stack : [];
    });
    if (army.unitId === 'unit.guard') {
      if (army.morale < 35 || army.fatigue > 65) {
        if (reasons.length < 16) reasons.push(`${army.id} rests to recover morale and fatigue.`);
        continue;
      }
      const target = targets.find(other => {
        const defenders = enemyByCell.get(other.cell) ?? [];
        const terrain = cells.get(other.cell)?.terrain;
        const cost = terrain === 2 || terrain === 3 ? 2 : 1;
        return !protectedIds.has(other.factionId) && cost <= army.movement && defenders.length <= 12 && (strengthByCell.get(other.cell) ?? 0) <= army.strength && !townByCell.has(other.cell);
      });
      if (target && plans.length <= 126) {
        if (!wars.has(target.factionId)) {
          plans.push({ type: 'declareWar', factionId, targetFactionId: target.factionId });
          wars.add(target.factionId);
        }
        plans.push({ type: 'attack', factionId, armyId: army.id, targetArmyId: target.id });
        // Retreats can change occupancy beyond the attacked hex: the next pass needs fresh sight.
        return { commands: plans, reasons };
      }
      const town = adjacent.map(cell => townByCell.get(cell)).find(town => town && !protectedIds.has(town.factionId) && !besiegedTowns.has(town.id) &&
        (strengthByCell.get(town.cell) ?? 0) <= army.strength);
      if (town && plans.length <= 126) {
        if (!wars.has(town.factionId)) {
          plans.push({ type: 'declareWar', factionId, targetFactionId: town.factionId });
          wars.add(town.factionId);
        }
        plans.push({ type: 'besiege', factionId, armyId: army.id, settlementId: town.id });
        besiegedTowns.add(town.id);
        reasons.push(`${army.id} invests visible settlement ${town.id}; assess its defenses next pass.`);
        continue;
      }
    }
    const options = neighbors(army.cell, view.width, view.height).filter(cell => {
      const known = cells.get(cell);
      const cost = known?.terrain === 2 || known?.terrain === 3 ? 2 : 1;
      return known?.visible && isPassable(known.terrain) && cost <= army.movement && !claimed.has(cell) && !enemyCells.has(cell);
    });
    const nearbyObjectives = army.unitId === 'unit.guard' ? objectives.filter(town => hexDistance(army.cell, town.cell, view.width) <= 12) : [];
    const score = (cell: number): number => {
      const unexplored = neighbors(cell, view.width, view.height).filter(next => !cells.has(next)).length;
      const distance = Math.min(20, ...ownSettlements.map(town => hexDistance(cell, town.cell, view.width)));
      // Stable, turn-varying tie breaker avoids a fixed directional bias without hidden randomness.
      const tie = ((Math.imul(cell + 1, 1103515245) ^ Math.imul(view.turn + 1, 2654435761)) >>> 0) % 31;
      const invading = nearbyObjectives.length > 0;
      const approach = invading ? Math.max(...nearbyObjectives.map(town => (projectHosts.has(town.id) ? 1000 : 0) - hexDistance(cell, town.cell, view.width) * 500))
        : army.unitId === 'unit.guard' && approachCells.length ? -Math.min(...approachCells.map(enemy => hexDistance(cell, enemy, view.width))) * 100 : 0;
      return unexplored * (invading ? 30 : 1000) + (unit?.canFound ? distance * 100 : approach) + tie;
    };
    options.sort((a, b) => score(b) - score(a) || a - b);
    const target = options[0];
    if (target !== undefined) {
      claimed.add(target);
      plans.push({ type: 'move', factionId, armyId: army.id, target });
    }
  }
  return { commands: plans, reasons };
}
