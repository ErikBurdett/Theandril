import { BUILDINGS, UNITS } from '@theandril/content';
import { hexDistance, isPassable, neighbors, TERRAIN } from '@theandril/mapgen';
import { getMovementQuery, type ArmyView, type GameCommand, type Observation } from '@theandril/sim';
import { protectedFactions, type AiPlan } from './diplomacy';
import { createNavigation } from './navigation';

export const MAX_NAVAL_FLEETS = 8;
export const MAX_NAVAL_ROUTE_QUERIES = 8;
export const MAX_NAVAL_LAND_NODES = 4096;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const units = new Map(UNITS.map(unit => [unit.id, unit]));
const containsFounder = (army: ArmyView): boolean => army.formations.some(formation => units.get(formation.unitId)?.canFound);
const prices = new Map([...UNITS, ...BUILDINGS].map(item => [item.id, item.coinCost]));
export interface NavalPlan extends AiPlan { coinSpent: number; heldArmyIds: Set<string>; queuedSettlementIds: Set<string>; interrupts: boolean }
export interface NavalPlanOptions { heldArmyIds?: ReadonlySet<string>; knowledgeBudget?: number }

/** One prospective harbor, not an empire-wide building policy. No hidden coast scan. */
export function hasNavalOpportunity(view: Observation): boolean {
  if (view.armies.some(army => army.factionId === view.factionId && army.domain === 'naval')) return true;
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  if (towns.length < 2) return false;
  const shores = new Set(towns.filter(town => town.buildings.includes('building.workshop') && town.buildings.includes('building.granary'))
    .flatMap(town => neighbors(town.cell, view.width, view.height)));
  return shores.size > 0 && view.cells.some(cell => cell.terrain === TERRAIN.water && shores.has(cell.cell));
}

/** Public proposals only. No persistent ghost operation, canonical writes or hidden map access. */
export function planNaval(view: Observation, coinBudget: number, options: NavalPlanOptions = {}): NavalPlan {
  const commands: GameCommand[] = [], reasons: string[] = [], heldArmyIds = new Set(options.heldArmyIds), queuedSettlementIds = new Set<string>();
  let budget = Math.max(0, coinBudget), interrupts = false;
  const result = (): NavalPlan => ({ commands, reasons, heldArmyIds, queuedSettlementIds, coinSpent: Math.max(0, coinBudget) - budget, interrupts });
  if (view.victory || view.battle || view.pendingCapture || !hasNavalOpportunity(view)) return result();
  const factionId = view.factionId, cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const own = view.armies.filter(army => army.factionId === factionId).sort(byId);
  const fleets = own.filter(army => army.domain === 'naval');
  const foreign = view.armies.filter(army => army.factionId !== factionId && !army.carrierId);
  const protectedIds = protectedFactions(view), wars = new Set(view.wars);
  const towns = view.settlements.filter(town => town.factionId === factionId).sort(byId);
  const coastTowns = towns.filter(town => neighbors(town.cell, view.width, view.height).some(cell => cells.get(cell)?.terrain === TERRAIN.water));
  const enemyTowns = view.settlements.filter(town => town.factionId !== factionId && !protectedIds.has(town.factionId)).slice(0, 64);
  const occupied = new Set([...foreign, ...view.settlements.filter(town => town.factionId !== factionId)].map(entity => entity.cell));
  const siegeArmies = new Set(view.sieges.map(siege => siege.armyId));
  const cargoCandidates = own.filter(army => army.domain !== 'naval' && !army.carrierId && !heldArmyIds.has(army.id) && !army.movementBlocker && !siegeArmies.has(army.id)
    // Outbound rendezvous is near an owned hearth. Newly landed troops must found/invade,
    // not immediately board again in a stateless embark/disembark loop.
    && towns.some(town => hexDistance(army.cell, town.cell, view.width) <= 3)
    && (army.canFound || army.canAttack && army.formations.length >= 2 && enemyTowns.length > 0));
  const nearest = (cell: number, locations: readonly { cell: number }[], limit = 1000): number => Math.min(limit, ...locations.map(other => hexDistance(cell, other.cell, view.width)));
  const queue = (townId: string, itemId: string): boolean => {
    const option = view.productionOptions.find(option => option.settlementId === townId && option.itemId === itemId);
    const cost = prices.get(itemId) ?? Infinity;
    if (!option?.canQueue || cost > budget || queuedSettlementIds.has(townId) || towns.find(town => town.id === townId)?.queue.length) return false;
    commands.push({ type: 'queue', factionId, settlementId: townId, itemId }); budget -= cost; queuedSettlementIds.add(townId);
    reasons.push(`Fund ${itemId} at ${townId} for a bounded coastal expedition (${cost} coin).`); return true;
  };
  const queuedCount = (itemId: string) => towns.reduce((sum, town) => sum + town.queue.filter(order => order.itemId === itemId).length, 0);
  const knowledge = options.knowledgeBudget ?? view.knowledge;
  const researchId = !view.progression.technologies.includes('technology.coastal_navigation') ? 'technology.coastal_navigation'
    : fleets.some(fleet => fleet.formations.some(formation => units.get(formation.unitId)?.naval?.oceanCapable)) ? 'technology.ocean_navigation' : null;
  const research = view.progression.technologyChoices.find(choice => choice.id === researchId && choice.available && choice.knowledgeCost <= knowledge);
  if (research) { commands.push({ type: 'research', factionId, technologyId: research.id }); reasons.push(`Research ${research.name} for the observed coastal expedition; hull restrictions still apply.`); }
  const harbor = coastTowns.find(town => town.buildings.includes('building.harbor'));
  const prospective = harbor ?? coastTowns.find(town => town.buildings.includes('building.workshop') && town.buildings.includes('building.granary'));
  // Wait for fresh prerequisite facts; research and construction are never assumed completed.
  if (prospective && !harbor && !coastTowns.some(town => town.queue.some(order => order.itemId === 'building.harbor'))) queue(prospective.id, 'building.harbor');
  const transports = fleets.reduce((sum, fleet) => sum + fleet.formations.filter(formation => (units.get(formation.unitId)?.naval?.transportCapacity ?? 0) > 0).length, 0);
  if (harbor) {
    const nearbyCargo = cargoCandidates.filter(army => hexDistance(army.cell, harbor.cell, view.width) <= 8);
    const required = Math.min(3, Math.max(1, ...nearbyCargo.map(army => Math.ceil(army.formations.length / 8))));
    if (transports + queuedCount('unit.transport') < required) queue(harbor.id, 'unit.transport');
    else if (fleets.some(fleet => fleet.transportCapacity && !fleet.cargo.length && hexDistance(fleet.cell, harbor.cell, view.width) <= 2)
      && !own.some(containsFounder) && !queuedCount('unit.colonist')) queue(harbor.id, 'unit.colonist');
    else if (foreign.some(enemy => enemy.domain === 'naval' && nearest(enemy.cell, fleets, 20) <= 12)
      && !fleets.some(fleet => fleet.formations.some(formation => (units.get(formation.unitId)?.naval?.transportCapacity ?? 0) === 0))
      && !queuedCount('unit.coastal_warship') && !queuedCount('unit.ocean_warship')) {
      queue(harbor.id, view.progression.technologies.includes('technology.ocean_navigation') ? 'unit.ocean_warship' : 'unit.coastal_warship');
    }
  }

  // One O(observed cells) shoreline pass; at most256 sampled objectives and8 fleets per plan.
  const allShores = view.cells.filter(cell => isPassable(cell.terrain) && !occupied.has(cell.cell)
    && neighbors(cell.cell, view.width, view.height).some(next => cells.get(next)?.terrain === TERRAIN.water));
  const stride = Math.max(1, Math.ceil(allShores.length / 256)), shores = allShores.filter((_, index) => index % stride === 0);
  // Prefer land not already connected to an owned hearth through observed land. A fixed
  // flood budget is a heuristic, never a claim that unknown geography is an island.
  const homeLand = new Set(towns.map(town => town.cell)), landQueue = [...homeLand];
  for (let cursor = 0; cursor < landQueue.length && cursor < MAX_NAVAL_LAND_NODES; cursor++) {
    for (const next of neighbors(landQueue[cursor]!, view.width, view.height)) if (!homeLand.has(next) && isPassable(cells.get(next)?.terrain ?? 0)) { homeLand.add(next); landQueue.push(next); }
  }
  const navigation = createNavigation(view), claimed = new Set<number>();
  let routeQueries = 0;
  const toward = (army: ArmyView, target: number): number | undefined => {
    if (routeQueries >= MAX_NAVAL_ROUTE_QUERIES || target === army.cell) return undefined;
    routeQueries++;
    const preview = getMovementQuery(view, army.id, target).preview;
    if (!preview?.canQueue || preview.action !== 'move') return undefined;
    let spent = 0, destination: number | undefined;
    for (const cell of preview.path) {
      // Do not let earlier same-batch discoveries invalidate a route through remembered fog.
      const known = cells.get(cell); if (!known?.visible) break;
      spent += known.terrain === 2 || known.terrain === 3 ? 2 : 1;
      if (spent > army.movement) break;
      if (!claimed.has(cell)) destination = cell;
    }
    return destination;
  };
  const move = (army: ArmyView, target: number | undefined, reason: string): boolean => {
    if (target === undefined) return false;
    commands.push({ type: 'moveTo', factionId, armyId: army.id, target }); heldArmyIds.add(army.id); claimed.add(target);
    if (reasons.length < 20) reasons.push(`${army.name}: ${reason}.`); return true;
  };
  // Recombine paid hulls at a shared port without downgrading ocean capability or changing cargo.
  for (const target of fleets.filter(fleet => !fleet.cargo.length && !heldArmyIds.has(fleet.id)).slice(0, MAX_NAVAL_FLEETS)) {
    if (heldArmyIds.has(target.id)) continue; // A previous merge may have consumed this original-view ID.
    const source = fleets.find(other => other.id !== target.id && other.cell === target.cell && !heldArmyIds.has(other.id) && !other.cargo.length
      && other.formations.every(formation => units.get(formation.unitId)?.naval?.oceanCapable) === target.formations.every(formation => units.get(formation.unitId)?.naval?.oceanCapable)
      && other.mergeOptions.some(option => option.armyId === target.id && option.canMerge));
    if (!source) continue;
    commands.push({ type: 'mergeArmies', factionId, sourceArmyId: source.id, targetArmyId: target.id }); heldArmyIds.add(source.id); heldArmyIds.add(target.id);
    reasons.push(`Combine co-located compatible hulls in ${target.name}; reassess capacity before loading.`);
  }
  for (const fleet of fleets.filter(fleet => heldArmyIds.has(fleet.id) && fleet.transportCapacity > 0)) {
    const waiting = cargoCandidates.find(army => army.formations.length <= fleet.transportCapacity && hexDistance(army.cell, fleet.cell, view.width) <= 1);
    if (waiting) heldArmyIds.add(waiting.id); // Preserve the rendezvous during officer attachment or hull reorganization.
  }
  const offset = fleets.length ? ((view.turn - 1) * MAX_NAVAL_FLEETS) % fleets.length : 0;
  for (const fleet of [...fleets.slice(offset), ...fleets.slice(0, offset)].slice(0, MAX_NAVAL_FLEETS)) {
    if (heldArmyIds.has(fleet.id) || fleet.movement <= 0 || fleet.movementBlocker) continue;
    const passengers = fleet.cargo.flatMap(cargo => own.find(army => army.id === cargo.armyId) ?? []);
    if (!passengers.length && fleet.canAttack && !fleet.commandBlocker && fleet.morale >= 40 && fleet.fatigue <= 60) {
      const target = foreign.find(enemy => enemy.domain === 'naval' && wars.has(enemy.factionId) && !protectedIds.has(enemy.factionId)
        && neighbors(fleet.cell, view.width, view.height).includes(enemy.cell)
        && foreign.filter(other => other.cell === enemy.cell).reduce((sum, other) => sum + other.strength, 0) <= fleet.strength
        && foreign.filter(other => other.cell === enemy.cell).reduce((sum, other) => sum + other.formations.length, 0) <= 20);
      if (target && getMovementQuery(view, fleet.id, target.cell).preview?.canMoveNow) {
        commands.push({ type: 'attack', factionId, armyId: fleet.id, targetArmyId: target.id }); interrupts = true;
        reasons.push(`${fleet.name} engages a visible weaker enemy fleet in the existing war.`); return result();
      }
    }
    if (passengers.length) {
      const colonizing = passengers.some(containsFounder); // Legal canFound is intentionally false while aboard.
      const viableShores = shores.filter(shore => (colonizing ? nearest(shore.cell, view.settlements) >= 4 : nearest(shore.cell, towns) >= 4)
        && !foreign.some(enemy => enemy.domain !== 'naval' && hexDistance(shore.cell, enemy.cell, view.width) <= 2));
      const landingScore = (cell: number): number => (homeLand.has(cell) ? 0 : 200) + (colonizing ? Math.min(8, nearest(cell, view.settlements)) * 10 : enemyTowns.length ? -nearest(cell, enemyTowns) * 30 : 0)
        + (cells.get(cell)?.fertility ?? 0) - hexDistance(fleet.cell, cell, view.width) * 15;
      const landings = [...viableShores].sort((a, b) => landingScore(b.cell) - landingScore(a.cell) || a.cell - b.cell);
      const passenger = passengers.find(army => !heldArmyIds.has(army.id));
      const permitted = passenger?.disembarkOptions.filter(option => option.canDisembark && viableShores.some(shore => shore.cell === option.cell)).sort((a, b) => landingScore(b.cell) - landingScore(a.cell) || a.cell - b.cell)[0];
      if (passenger && permitted) {
        commands.push({ type: 'disembarkArmy', factionId, armyId: passenger.id, target: permitted.cell }); heldArmyIds.add(fleet.id); heldArmyIds.add(passenger.id);
        reasons.push(`${fleet.name} lands ${passenger.name} on an unoccupied shore away from existing hearths.`); continue;
      }
      let destination: number | undefined;
      for (const shore of landings.slice(0, 4)) {
        const water = neighbors(shore.cell, view.width, view.height).filter(cell => cells.get(cell)?.terrain === TERRAIN.water && !occupied.has(cell)).sort((a, b) => hexDistance(fleet.cell, a, view.width) - hexDistance(fleet.cell, b, view.width) || a - b);
        for (const cell of water.slice(0, 2)) { destination = toward(fleet, cell); if (destination !== undefined) break; }
        if (destination !== undefined) break;
      }
      if (move(fleet, destination, 'sail the known water route toward a viable landing')) continue;
      if (move(fleet, navigation.destination(fleet, fleet.sight, claimed), 'chart water while seeking a safe landing')) continue;
      // If no destination or unexplored frontier remains, recover cargo instead of storing it forever.
      if (!landings.length && passenger) {
        const recovery = passenger.disembarkOptions.find(option => option.canDisembark);
        if (recovery) { commands.push({ type: 'disembarkArmy', factionId, armyId: passenger.id, target: recovery.cell }); heldArmyIds.add(fleet.id); heldArmyIds.add(passenger.id); reasons.push('No viable expedition shore remains; recover passengers on a safe shore.'); }
      }
      continue;
    }
    const candidates = cargoCandidates.filter(army => !heldArmyIds.has(army.id) && army.formations.length <= fleet.transportCapacity
      && hexDistance(army.cell, fleet.cell, view.width) <= 12).sort((a, b) => Number(b.canFound) - Number(a.canFound) || hexDistance(a.cell, fleet.cell, view.width) - hexDistance(b.cell, fleet.cell, view.width) || byId(a, b));
    const cargo = candidates[0];
    if (cargo) {
      // Reserve prospective passengers even while waiting for fresh movement, so land AI cannot scatter them.
      heldArmyIds.add(cargo.id);
      const embark = cargo.embarkOptions.find(option => option.fleetId === fleet.id && option.canEmbark);
      if (embark) { commands.push({ type: 'embarkArmy', factionId, armyId: cargo.id, fleetId: fleet.id }); heldArmyIds.add(fleet.id); reasons.push(`${fleet.name} boards ${cargo.name} using ${cargo.formations.length}/${fleet.transportCapacity} real transport slots.`); continue; }
      const boarding = shores.filter(shore => hexDistance(shore.cell, cargo.cell, view.width) <= 8).sort((a, b) => hexDistance(a.cell, cargo.cell, view.width) * 2 + hexDistance(a.cell, fleet.cell, view.width) - hexDistance(b.cell, cargo.cell, view.width) * 2 - hexDistance(b.cell, fleet.cell, view.width) || a.cell - b.cell).slice(0, 2);
      for (const shore of boarding) {
        if (cargo.movement > 0 && move(cargo, toward(cargo, shore.cell), 'gather at the observed embarkation shore')) break;
      }
      let destination: number | undefined;
      for (const shore of boarding) {
        for (const cell of neighbors(shore.cell, view.width, view.height).filter(cell => cells.get(cell)?.terrain === TERRAIN.water)) { destination = toward(fleet, cell); if (destination !== undefined) break; }
        if (destination !== undefined) break;
      }
      move(fleet, destination, 'meet the waiting land expedition at its shore'); continue;
    }
    if (fleet.transportCapacity) {
      const home = coastTowns.sort((a, b) => hexDistance(a.cell, fleet.cell, view.width) - hexDistance(b.cell, fleet.cell, view.width) || byId(a, b))[0];
      if (home && hexDistance(home.cell, fleet.cell, view.width) > 1) {
        const approach = neighbors(home.cell, view.width, view.height).filter(cell => cells.get(cell)?.terrain === TERRAIN.water).sort((a, b) => hexDistance(a, fleet.cell, view.width) - hexDistance(b, fleet.cell, view.width));
        for (const cell of approach.slice(0, 2)) if (move(fleet, toward(fleet, cell), 'return to a harbor for the next expedition')) break;
      }
    } else move(fleet, navigation.destination(fleet, fleet.sight, claimed), 'patrol and chart permitted coastal water');
  }
  return result();
}
