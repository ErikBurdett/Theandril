import { BUILDINGS, UNITS } from '@theandril/content';
import { hexDistance, neighbors } from '@theandril/mapgen';
import { MAX_ARMY_FORMATIONS, foundingCoinCost, getMovementQuery, planDevelopment, type GameCommand, type Observation } from '@theandril/sim';
import { planDiplomacy, protectedFactions, type AiPlan } from './diplomacy';
import { planConquestDecision } from './conquest';
import { planProgression } from './progression';
import { createNavigation } from './navigation';
import { planCharacters } from './characters';
import { coastalFoundingSite, oceanScoutReserve as reserveOceanScout, planNaval, sparseContactNeeded } from './naval';
import { planLand } from './land';
import { recruitmentRoster } from './recruitment';
import { planRoadAcceleration } from './roads';
import { settlementSpacing, settlementSiteValue } from './expansion';

export { chooseCaptureOption } from './conquest';
export { aiObservationOptions, landPlanningTowns, LAND_PLANNING_TOWN_LIMIT } from './observation-options';
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
  const oceanScoutReserve = reserveOceanScout(view);
  const pendingFounder = view.armies.some(army => army.factionId === view.factionId && army.formations.some(formation => units.get(formation.unitId)?.canFound)) || view.settlements.some(town => town.factionId === view.factionId && town.queue.some(order => order.itemId === 'unit.colonist'));
  const expansionAffordable = Boolean(view.growth && view.treasury >= view.growth.founding.coinCost + UNITS[0]!.coinCost + view.growth.founding.additionalUpkeep * 6 + 24);
  const foundingReserve = view.growth && (pendingFounder || expansionAffordable) ? Math.min(Math.max(0, view.treasury - oceanScoutReserve), view.growth.founding.coinCost) : 0;
  // Save toward the next useful expedition before optional purchases, even
  // below its full funding threshold. Otherwise cheap upgrades repeatedly spend
  // the coins needed to reach that threshold and an inland realm never departs.
  const basicBuildingPurse = Math.max(0, ...view.settlements.filter(town => town.factionId === view.factionId && !town.queue.length).map(town => BUILDINGS.find(building => !building.coastalOnly && !town.buildings.includes(building.id)
    && view.productionOptions.some(option => option.settlementId === town.id && option.itemId === building.id && option.canQueue))?.coinCost ?? 0));
  const expeditionSavings = view.growth && view.factionCount > 1 && view.factions.length === 1 && !pendingFounder && !expansionAffordable && view.settlements.some(town => town.factionId === view.factionId)
    ? Math.max(0, view.treasury - oceanScoutReserve - basicBuildingPurse) : 0;
  const advancement = planProgression(view, foundingReserve + expeditionSavings + oceanScoutReserve);
  if (advancement.commands.some(command => command.type === 'startVictoryProject')) return advancement;
  const factionId = view.factionId;
  const plans: GameCommand[] = [...advancement.commands];
  const reasons: string[] = [...advancement.reasons];
  if (expeditionSavings > 0) reasons.push(`Retain ${expeditionSavings} coin toward a caravan, its ${view.growth!.founding.coinCost}-coin founding fee and the next hearth’s running costs; fund basic buildings while saving.`);
  const market = view.resources?.marketSettlementIds[0];
  const surplus = market ? view.resources?.stockpiles.filter(stock => stock.amount > 12).sort((a, b) => b.salePrice * (b.amount - 6) - a.salePrice * (a.amount - 6) || (a.resourceId < b.resourceId ? -1 : a.resourceId > b.resourceId ? 1 : 0))[0] : undefined;
  if (market && surplus) {
    const amount = Math.min(1_000_000, surplus.amount - 6, Math.floor((Number.MAX_SAFE_INTEGER - view.treasury) / surplus.salePrice));
    if (amount > 0) {
      plans.push({ type: 'sellResource', factionId: view.factionId, settlementId: market, resourceId: surplus.resourceId, amount });
      reasons.push(`Sell ${amount} ${surplus.name} at the quoted ${surplus.salePrice} coin each, retaining six for development. Proceeds enter the next planning purse.`);
    }
  }
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const ownSettlements = view.settlements.filter(town => town.factionId === factionId);
  const allOwnArmies = view.armies.filter(army => army.factionId === factionId);
  const ownArmies = allOwnArmies.filter(army => army.domain !== 'naval' && !army.carrierId);
  const protectedIds = protectedFactions(view);
  const enemies = view.armies.filter(army => army.factionId !== factionId && army.domain !== 'naval' && !army.carrierId);
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
  // An embarked founder belongs to a separate expedition. It must not freeze
  // affordable overland expansion while a distant fleet searches for a landing.
  const hasColonist = ownArmies.some(army => army.formations.some(formation => units.get(formation.unitId)?.canFound));
  let plannedColonist = hasColonist || ownSettlements.some(town => town.queue.some(order => order.itemId === 'unit.colonist'));
  const formations = allOwnArmies.filter(army => army.domain !== 'naval').flatMap(army => army.formations);
  const militaryCount = formations.filter(formation => !units.get(formation.unitId)?.canFound).length;
  const areaPerFaction = view.width * view.height / Math.max(1, view.factionCount);
  const settlementTarget = areaPerFaction > 12_000 ? 8 : areaPerFaction > 3000 ? 6 : 4;
  const expand = view.growth ? expansionAffordable : ownSettlements.length < settlementTarget;
  const formationTarget = ownSettlements.length * 3 + 1;
  const roster = recruitmentRoster(view.factions.find(faction => faction.id === factionId)?.definitionId);
  const rosterCounts = new Map(UNITS.map(unit => [unit.id, formations.filter(formation => formation.unitId === unit.id).length + ownSettlements.reduce((sum, town) => sum + town.queue.filter(order => order.itemId === unit.id).length, 0)]));
  const rotate = <T,>(items: T[], stride: number): T[] => {
    const offset = items.length ? ((view.turn - 1) * stride) % items.length : 0;
    return [...items.slice(offset), ...items.slice(0, offset)];
  };
  let budget = Math.max(0, view.treasury - advancement.coinSpent - advancement.reserve - foundingReserve - expeditionSavings);
  // Protect the next expansion caravan and one basic building before optional appointments.
  const production = new Map(view.productionOptions.map(option => [option.settlementId + ':' + option.itemId, option.canQueue]));
  const canQueue = (settlementId: string, itemId: string): boolean => production.get(settlementId + ':' + itemId) === true;
  const economyReserve = (expand && !plannedColonist ? UNITS[0]!.coinCost : 0)
    + Math.max(0, ...ownSettlements.filter(town => !town.queue.length).map(town => BUILDINGS.find(item => !item.coastalOnly && !town.buildings.includes(item.id) && canQueue(town.id, item.id))?.coinCost ?? 0));
  // A researched ocean scout is a real expansion need. Preserve its current legal
  // quote before optional officers spend the same coins; do not reserve for a
  // blocked harbor, queued hull or an already operating deep-water escort.
  const recurringBudget = view.growth ? Math.max(0, view.growth.economy.net - view.growth.economy.queuedUpkeep - 2) : Infinity;
  // Preserve a small positive cash flow for existing caravans and civic growth.
  // Recruit quotes stay canonical; this only ranks optional new obligations.
  const characterView = view.growth ? { ...view, characterRecruitment: view.characterRecruitment.filter(option => option.upkeep <= recurringBudget) } : view;
  const specialists = planCharacters(characterView, Math.max(0, budget - economyReserve - oceanScoutReserve));
  plans.push(...specialists.commands); reasons.push(...specialists.reasons);
  budget -= specialists.coinSpent;
  let plannedUpkeep = specialists.commands.reduce((sum, command) => sum + (command.type === 'recruitCharacter' ? view.characterRecruitment.find(option => option.definitionId === command.definitionId)?.upkeep ?? 0 : 0), 0);
  const knowledgeSpent = advancement.commands.reduce((sum, command) => sum + (command.type === 'research' ? view.progression.technologyChoices.find(choice => choice.id === command.technologyId)?.knowledgeCost ?? 0 : command.type === 'researchArcane' ? view.arcaneResearch.choices.find(choice => choice.id === command.discoveryId)?.knowledgeCost ?? 0 : 0), 0);
  // Normally retain a caravan's funding; honor a legally quoted first ocean
  // scout before generic economic reserves can repeatedly consume its coins.
  // This never spends the progression reserve already removed from budget.
  const naval = planNaval(view, Math.max(0, budget - Math.min(economyReserve, 16), Math.min(budget, oceanScoutReserve)), { heldArmyIds: specialists.heldArmyIds, knowledgeBudget: Math.max(0, view.knowledge - knowledgeSpent) });
  plans.push(...naval.commands); reasons.push(...naval.reasons); budget -= naval.coinSpent;
  plannedUpkeep += naval.commands.reduce((sum, command) => sum + (command.type === 'queue' ? units.get(command.itemId)?.upkeep ?? 0 : 0), 0);
  if (naval.interrupts) return { commands: plans, reasons };
  if (naval.commands.some(command => command.type === 'queue' && command.itemId === 'unit.colonist')) plannedColonist = true;
  let plannedMilitary = ownSettlements.reduce((count, town) => count + town.queue.filter(order => units.has(order.itemId) && units.get(order.itemId)?.movementDomain !== 'naval' && order.itemId !== 'unit.colonist').length, 0);
  const productionLimit = Math.min(112, plans.length + 96);
  for (const town of rotate(ownSettlements, 96)) {
    if (plans.length >= productionLimit) break;
    if (town.queue.length || naval.queuedSettlementIds.has(town.id)) continue;
    const building = BUILDINGS.find(item => !item.coastalOnly && !town.buildings.includes(item.id) && item.coinCost <= budget && canQueue(town.id, item.id));
    const desired = [...new Set(roster)].sort((a, b) => (rosterCounts.get(a) ?? 0) / roster.filter(id => id === a).length - (rosterCounts.get(b) ?? 0) / roster.filter(id => id === b).length || roster.indexOf(a) - roster.indexOf(b));
    const recruit = desired.map(id => units.get(id)).find(unit => unit && unit.coinCost <= budget && unit.upkeep + plannedUpkeep <= recurringBudget && canQueue(town.id, unit.id));
    // A newly unlocked role may enter an existing army even when the current
    // force-count target is met. Its real cost/upkeep still uses the shared purse.
    const missingRole = Boolean(view.growth && recruit && (rosterCounts.get(recruit.id) ?? 0) === 0);
    const item = building ?? (expand && !plannedColonist && canQueue(town.id, UNITS[0]!.id) ? UNITS[0] : militaryCount + plannedMilitary < formationTarget || missingRole ? recruit : undefined);
    if (item && budget >= item.coinCost) {
      plans.push({ type: 'queue', factionId, settlementId: town.id, itemId: item.id });
      budget -= item.coinCost;
      if (units.has(item.id)) plannedUpkeep += units.get(item.id)!.upkeep;
      if (item.id === 'unit.colonist') plannedColonist = true;
      if (units.has(item.id) && item.id !== 'unit.colonist') { plannedMilitary++; rosterCounts.set(item.id, (rosterCounts.get(item.id) ?? 0) + 1); }
    }
  }
  const development = planDevelopment(view, Math.max(0, view.treasury - budget + 24), Math.max(0, recurringBudget - plannedUpkeep));
  // Training quotes were observed before this batch's missions/embarkation.
  // Execute paid development first so those later transitions cannot stale them.
  plans.unshift(...development.commands); budget -= development.coinSpent;
  const road = planRoadAcceleration(view, Math.max(0, budget - 24));
  // Its quote depends on current worker sight. Execute before any officer/boarding/march
  // proposal can remove that sight; the total budget already accounts for every order.
  if (road.command) { plans.unshift(road.command); reasons.push(road.reason!); budget -= road.coinSpent; }
  const land = planLand(view, Math.max(0, budget - 24), new Set(plans.flatMap(command => command.type === 'queue' ? [command.settlementId] : [])));
  plans.push(...land.commands); reasons.push(...land.reasons); budget -= land.coinSpent;
  const claimed = new Set<number>();
  const navigation = createNavigation(view);
  const wars = new Set(view.wars);
  const settlementNames = new Set(ownSettlements.map(town => town.name));
  const foundingCells = view.settlements.map(town => town.cell);
  let hearthNumber = ownSettlements.length;
  let foundingCount = ownSettlements.length, foundingBudget = budget + foundingReserve;
  const reorganized = new Set<string>();
  const ownTownCells = new Set(ownSettlements.map(town => town.cell));
  // A charted foreign border is a discovery clue, not permission to attack or a
  // revealed settlement. A nearby wayfinder can approach it to establish contact.
  const foreignBorders = view.cells.filter(cell => cell.factionId && cell.factionId !== factionId);
  const borderStride = Math.max(1, Math.ceil(foreignBorders.length / 64));
  const contactClues = foreignBorders.filter((_, index) => index % borderStride === 0).slice(0, 64);
  // Keep one fast reconnaissance detachment independent. Other recruits join real field armies.
  const explorerId = ownArmies.find(army => army.formations.length === 1 && army.unitId === 'unit.scout')?.id;
  const groups = new Map<number, typeof ownArmies>();
  const desiredConcentration = (army: typeof ownArmies[number]): number => army.commander
    ? Math.min(army.formationCapacity, Math.max(12, ...enemies.filter(enemy => hexDistance(army.cell, enemy.cell, view.width) <= 18).map(enemy => enemy.formations.length + 2)))
    : Math.min(6, army.formationCapacity);
  for (const army of ownArmies) if (!army.canFound && army.id !== explorerId && !besiegers.has(army.id) && !naval.heldArmyIds.has(army.id) && !army.reorganizationBlocker) {
    const group = groups.get(army.cell) ?? []; group.push(army); groups.set(army.cell, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => Number(Boolean(b.commander)) - Number(Boolean(a.commander)) || b.formations.length - a.formations.length || (a.id < b.id ? -1 : 1));
    const target = group[0]; if (!target) continue;
    let size = target.formations.length;
    let commanderCount = Number(Boolean(target.commander));
    let companionCount = target.agents.length;
    for (const source of group.slice(1)) {
      const option = source.mergeOptions.find(option => option.armyId === target.id);
      if (plans.length >= 112 || !option?.canMerge || size + source.formations.length > Math.min(desiredConcentration(target), option.resultCapacity) || commanderCount + Number(Boolean(source.commander)) > 1 || companionCount + source.agents.length > 2) continue;
      plans.push({ type: 'mergeArmies', factionId, sourceArmyId: source.id, targetArmyId: target.id });
      reorganized.add(source.id); reorganized.add(target.id); size += source.formations.length;
      commanderCount += Number(Boolean(source.commander)); companionCount += source.agents.length;
      if (reasons.length < 16) reasons.push(`Concentrate ${source.name} with ${target.name}: ${size} formations in one field army.`);
    }
  }
  for (const army of rotate(ownArmies, 32).slice(0, 128)) {
    if (plans.length >= 128) break;
    if (besiegers.has(army.id) || reorganized.has(army.id) || naval.heldArmyIds.has(army.id)) continue; // Composition/assignment/transport changes need fresh facts.
    const portSite = coastalFoundingSite(view, army);
    if (army.canFound && portSite !== null && portSite !== army.cell && view.growth && sparseContactNeeded(view) && view.factions.length === 1) {
      const route = view.routes.find(route => route.armyId === army.id);
      if (route?.status === 'active') continue;
      const preview = getMovementQuery(view, army.id, portSite).preview;
      if (preview?.canQueue && preview.action === 'move') {
        plans.push({ type: 'queueMovement', factionId, armyId: army.id, target: portSite });
        reasons.push(`${army.id} retains a charted ${preview.cost}-movement route to a second maritime outlet; pay founding and harbor costs on arrival.`);
      }
      continue;
    }
    if (army.canFound && (portSite === null || portSite === army.cell) && army.movement > 0 && !cells.get(army.cell)?.settlementId && foundingCells.every(cell => hexDistance(cell, army.cell, view.width) >= settlementSpacing(view, army.cell)) && (!view.growth || foundingBudget >= foundingCoinCost(foundingCount))) {
      let name: string;
      do { name = `Hearth ${++hearthNumber}`; } while (settlementNames.has(name));
      settlementNames.add(name);
      foundingCells.push(army.cell);
      if (view.growth) foundingBudget -= foundingCoinCost(foundingCount++);
      plans.push({ type: 'found', factionId, armyId: army.id, name });
      continue;
    }
    if (army.movement <= 0) continue;
    const adjacent = neighbors(army.cell, view.width, view.height);
    const targets = adjacent.flatMap(cell => {
      const stack = enemyByCell.get(cell) ?? [];
      return stack.reduce((sum, defender) => sum + defender.formations.length, 0) <= MAX_ARMY_FORMATIONS ? stack : [];
    });
    const military = army.canAttack && !army.canFound && army.id !== explorerId && !army.commandBlocker;
    if (military) {
      if (army.morale < 35 || army.fatigue > 65) {
        if (reasons.length < 16) reasons.push(`${army.id} rests to recover morale and fatigue.`);
        continue;
      }
      const target = targets.find(other => {
        const defenders = enemyByCell.get(other.cell) ?? [];
        const terrain = cells.get(other.cell)?.terrain;
        const cost = terrain === 2 || terrain === 3 ? 2 : 1;
        return !protectedIds.has(other.factionId) && cost <= army.movement && defenders.reduce((sum, defender) => sum + defender.formations.length, 0) <= MAX_ARMY_FORMATIONS && (strengthByCell.get(other.cell) ?? 0) <= army.strength && !townByCell.has(other.cell);
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
      if (ownTownCells.has(army.cell) && army.formations.length < (army.commander ? desiredConcentration(army) : 3) && militaryCount + plannedMilitary < formationTarget + 3) {
        const reinforcements = ownSettlements.find(town => town.cell === army.cell)?.queue.some(order => units.has(order.itemId) && order.itemId !== 'unit.colonist') || plans.some(command => command.type === 'queue' && command.settlementId === ownSettlements.find(town => town.cell === army.cell)?.id && units.has(command.itemId) && command.itemId !== 'unit.colonist');
        if (reinforcements) { if (reasons.length < 16) reasons.push(`${army.id} holds its recruitment point for a mixed formation column.`); continue; }
      }
    }
    const nearbyObjectives = military ? objectives.filter(town => hexDistance(army.cell, town.cell, view.width) <= 18) : [];
    const nearbyContacts = army.id === explorerId && !enemyTowns.length && !enemies.length
      ? contactClues.filter(cell => hexDistance(army.cell, cell.cell, view.width) <= 18) : [];
    const nearbyThreat = enemies.filter(enemy => wars.has(enemy.factionId) && hexDistance(army.cell, enemy.cell, view.width) <= 10 && enemy.strength > army.strength).slice(0, 64);
    const score = (cell: number): number => {
      const distance = Math.min(20, ...ownSettlements.map(town => hexDistance(cell, town.cell, view.width)));
      const invading = nearbyObjectives.length > 0;
      const approach = invading ? Math.max(...nearbyObjectives.map(town => (projectHosts.has(town.id) ? 1000 : 0) - hexDistance(cell, town.cell, view.width) * 500))
        : military && approachCells.length ? -Math.min(...approachCells.map(enemy => hexDistance(cell, enemy, view.width))) * 100 : 0;
      const danger = nearbyThreat.reduce((sum, enemy) => sum + Math.max(0, 5 - hexDistance(cell, enemy.cell, view.width)) * 1200, 0);
      return (portSite !== null ? -hexDistance(cell, portSite, view.width) * 500 : army.canFound ? view.growth ? settlementSiteValue(view, cell) : distance * 100
        : nearbyContacts.length ? -Math.min(...nearbyContacts.map(clue => hexDistance(cell, clue.cell, view.width))) * 500 : approach) - danger;
    };
    const strategic = army.canFound || nearbyContacts.length > 0 || military && approachCells.length > 0 || enemies.some(enemy => wars.has(enemy.factionId) && hexDistance(army.cell, enemy.cell, view.width) <= 10);
    const distantContact = !strategic && sparseContactNeeded(view) && army.id === explorerId && view.factions.length === 1;
    const chartCenter = Math.floor(view.height / 2) * view.width + Math.floor(view.width / 2);
    const target = navigation.destination(army, army.sight, claimed, strategic ? score : undefined, undefined,
      distantContact ? (cell, gain) => gain * 100 + (gain > 0 ? (hexDistance(army.cell, chartCenter, view.width) - hexDistance(cell, chartCenter, view.width)) * 500 : 0) : undefined);
    if (target !== undefined) {
      claimed.add(target);
      plans.push({ type: 'moveTo', factionId, armyId: army.id, target });
      if (reasons.length < 16) reasons.push(`${army.id} ${strategic ? 'advances toward its visible objective' : 'explores new ground'} using its available movement budget.`);
    }
  }
  return { commands: plans, reasons };
}
