import { BUILDINGS, UNITS } from '@theandril/content';
import { hexDistance, neighbors } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import { planDiplomacy, protectedFactions, type AiPlan } from './diplomacy';
import { planConquestDecision } from './conquest';
import { planProgression } from './progression';
import { createNavigation } from './navigation';
import { planCharacters } from './characters';

export { chooseCaptureOption } from './conquest';
export type { AiPlan } from './diplomacy';
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
  const hasColonist = ownArmies.some(army => army.canFound);
  let plannedColonist = hasColonist || ownSettlements.some(town => town.queue.some(order => order.itemId === 'unit.colonist'));
  const formations = ownArmies.flatMap(army => army.formations);
  const militaryCount = formations.filter(formation => !units.get(formation.unitId)?.canFound).length;
  const areaPerFaction = view.width * view.height / Math.max(1, view.factionCount);
  const settlementTarget = areaPerFaction > 12_000 ? 8 : areaPerFaction > 3000 ? 6 : 4;
  const formationTarget = ownSettlements.length * 3 + 1;
  const roster = ['unit.guard', 'unit.spearman', 'unit.scout', 'unit.heavy_infantry', 'unit.cavalry', 'unit.guard'];
  const rosterCounts = new Map(UNITS.map(unit => [unit.id, formations.filter(formation => formation.unitId === unit.id).length + ownSettlements.reduce((sum, town) => sum + town.queue.filter(order => order.itemId === unit.id).length, 0)]));
  const rotate = <T,>(items: T[], stride: number): T[] => {
    const offset = items.length ? ((view.turn - 1) * stride) % items.length : 0;
    return [...items.slice(offset), ...items.slice(0, offset)];
  };
  let budget = Math.max(0, view.treasury - advancement.coinSpent - advancement.reserve);
  // Protect the next expansion caravan and one basic building before optional appointments.
  const economyReserve = (ownSettlements.length < settlementTarget && !plannedColonist ? UNITS[0]!.coinCost : 0)
    + Math.max(0, ...ownSettlements.filter(town => !town.queue.length).map(town => BUILDINGS.find(item => !town.buildings.includes(item.id))?.coinCost ?? 0));
  const specialists = planCharacters(view, Math.max(0, budget - economyReserve));
  plans.push(...specialists.commands); reasons.push(...specialists.reasons);
  budget -= specialists.coinSpent;
  let plannedMilitary = ownSettlements.reduce((count, town) => count + town.queue.filter(order => units.has(order.itemId) && order.itemId !== 'unit.colonist').length, 0);
  const productionLimit = plans.length + 96;
  for (const town of rotate(ownSettlements, 96)) {
    if (plans.length >= productionLimit) break;
    if (town.queue.length) continue;
    const building = BUILDINGS.find(item => !town.buildings.includes(item.id) && item.coinCost <= budget);
    const desired = [...new Set(roster)].sort((a, b) => (rosterCounts.get(a) ?? 0) / roster.filter(id => id === a).length - (rosterCounts.get(b) ?? 0) / roster.filter(id => id === b).length || roster.indexOf(a) - roster.indexOf(b));
    const recruit = desired.map(id => units.get(id)).find(unit => unit && unit.coinCost <= budget);
    const item = building ?? (ownSettlements.length < settlementTarget && !plannedColonist ? UNITS[0] : militaryCount + plannedMilitary < formationTarget ? recruit : undefined);
    if (item && budget >= item.coinCost) {
      plans.push({ type: 'queue', factionId, settlementId: town.id, itemId: item.id });
      budget -= item.coinCost;
      if (item.id === 'unit.colonist') plannedColonist = true;
      if (units.has(item.id) && item.id !== 'unit.colonist') { plannedMilitary++; rosterCounts.set(item.id, (rosterCounts.get(item.id) ?? 0) + 1); }
    }
  }
  const claimed = new Set<number>();
  const navigation = createNavigation(view);
  const wars = new Set(view.wars);
  const settlementNames = new Set(ownSettlements.map(town => town.name));
  const foundingCells = view.settlements.map(town => town.cell);
  let hearthNumber = ownSettlements.length;
  const reorganized = new Set<string>();
  const ownTownCells = new Set(ownSettlements.map(town => town.cell));
  // Keep one fast reconnaissance detachment independent. Other recruits join real field armies.
  const explorerId = ownArmies.find(army => army.formations.length === 1 && army.unitId === 'unit.scout')?.id;
  const groups = new Map<number, typeof ownArmies>();
  for (const army of ownArmies) if (!army.canFound && army.id !== explorerId && !besiegers.has(army.id) && !specialists.heldArmyIds.has(army.id)) {
    const group = groups.get(army.cell) ?? []; group.push(army); groups.set(army.cell, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => b.formations.length - a.formations.length || (a.id < b.id ? -1 : 1));
    const target = group[0]; if (!target) continue;
    let size = target.formations.length;
    let commanderCount = Number(Boolean(target.commander));
    let companionCount = target.agents.length;
    for (const source of group.slice(1)) {
      if (plans.length >= 112 || size + source.formations.length > 6 || commanderCount + Number(Boolean(source.commander)) > 1 || companionCount + source.agents.length > 2) continue;
      plans.push({ type: 'mergeArmies', factionId, sourceArmyId: source.id, targetArmyId: target.id });
      reorganized.add(source.id); reorganized.add(target.id); size += source.formations.length;
      commanderCount += Number(Boolean(source.commander)); companionCount += source.agents.length;
      if (reasons.length < 16) reasons.push(`Concentrate ${source.name} with ${target.name}: ${size} formations in one field army.`);
    }
  }
  for (const army of rotate(ownArmies, 32).slice(0, 128)) {
    if (plans.length >= 128) break;
    if (besiegers.has(army.id) || reorganized.has(army.id) || specialists.heldArmyIds.has(army.id)) continue; // Composition/assignment changes need fresh facts; missions commit the carrier.
    if (army.canFound && army.movement > 0 && foundingCells.every(cell => hexDistance(cell, army.cell, view.width) >= 4)) {
      let name: string;
      do { name = `Hearth ${++hearthNumber}`; } while (settlementNames.has(name));
      settlementNames.add(name);
      foundingCells.push(army.cell);
      plans.push({ type: 'found', factionId, armyId: army.id, name });
      continue;
    }
    if (army.movement <= 0) continue;
    const adjacent = neighbors(army.cell, view.width, view.height);
    const targets = adjacent.flatMap(cell => {
      const stack = enemyByCell.get(cell) ?? [];
      return stack.reduce((sum, defender) => sum + defender.formations.length, 0) <= 12 ? stack : [];
    });
    const military = army.canAttack && !army.canFound && army.id !== explorerId;
    if (military) {
      if (army.morale < 35 || army.fatigue > 65) {
        if (reasons.length < 16) reasons.push(`${army.id} rests to recover morale and fatigue.`);
        continue;
      }
      const target = targets.find(other => {
        const defenders = enemyByCell.get(other.cell) ?? [];
        const terrain = cells.get(other.cell)?.terrain;
        const cost = terrain === 2 || terrain === 3 ? 2 : 1;
        return !protectedIds.has(other.factionId) && cost <= army.movement && defenders.reduce((sum, defender) => sum + defender.formations.length, 0) <= 12 && (strengthByCell.get(other.cell) ?? 0) <= army.strength && !townByCell.has(other.cell);
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
      if (ownTownCells.has(army.cell) && army.formations.length < 3 && militaryCount + plannedMilitary < formationTarget + 3) {
        const reinforcements = ownSettlements.find(town => town.cell === army.cell)?.queue.some(order => units.has(order.itemId) && order.itemId !== 'unit.colonist') || plans.some(command => command.type === 'queue' && command.settlementId === ownSettlements.find(town => town.cell === army.cell)?.id && units.has(command.itemId) && command.itemId !== 'unit.colonist');
        if (reinforcements) { if (reasons.length < 16) reasons.push(`${army.id} holds its recruitment point for a mixed formation column.`); continue; }
      }
    }
    const nearbyObjectives = military ? objectives.filter(town => hexDistance(army.cell, town.cell, view.width) <= 18) : [];
    const nearbyThreat = enemies.filter(enemy => wars.has(enemy.factionId) && hexDistance(army.cell, enemy.cell, view.width) <= 10 && enemy.strength > army.strength).slice(0, 64);
    const score = (cell: number): number => {
      const distance = Math.min(20, ...ownSettlements.map(town => hexDistance(cell, town.cell, view.width)));
      const invading = nearbyObjectives.length > 0;
      const approach = invading ? Math.max(...nearbyObjectives.map(town => (projectHosts.has(town.id) ? 1000 : 0) - hexDistance(cell, town.cell, view.width) * 500))
        : military && approachCells.length ? -Math.min(...approachCells.map(enemy => hexDistance(cell, enemy, view.width))) * 100 : 0;
      const danger = nearbyThreat.reduce((sum, enemy) => sum + Math.max(0, 5 - hexDistance(cell, enemy.cell, view.width)) * 1200, 0);
      return (army.canFound ? distance * 100 : approach) - danger;
    };
    const strategic = army.canFound || military && approachCells.length > 0 || enemies.some(enemy => wars.has(enemy.factionId) && hexDistance(army.cell, enemy.cell, view.width) <= 10);
    const target = navigation.destination(army, army.sight, claimed, strategic ? score : undefined);
    if (target !== undefined) {
      claimed.add(target);
      plans.push({ type: 'moveTo', factionId, armyId: army.id, target });
      if (reasons.length < 16) reasons.push(`${army.id} ${strategic ? 'advances toward its visible objective' : 'explores new ground'} using its available movement budget.`);
    }
  }
  return { commands: plans, reasons };
}
