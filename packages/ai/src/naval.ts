import { BUILDINGS, UNITS } from '@theandril/content';
import { hexDistance, isLake, isPassable, neighbors, TERRAIN } from '@theandril/mapgen';
import { getMovementQuery, type ArmyView, type GameCommand, type Observation } from '@theandril/sim';
import { settlementSpacing } from './expansion';
import { protectedFactions, type AiPlan } from './diplomacy';
import { createNavigation } from './navigation';
import { createSeaKnowledge, type BasinRelation, type BasinStatus } from './sea-knowledge';

export const MAX_NAVAL_FLEETS = 8;
export const MAX_NAVAL_ROUTE_QUERIES = 8;
export const MAX_NAVAL_LAND_NODES = 4096;
export const MAX_PORT_SEARCH_NODES = 1024;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const units = new Map(UNITS.map(unit => [unit.id, unit]));
const containsFounder = (army: ArmyView): boolean => army.formations.some(formation => units.get(formation.unitId)?.canFound);
const transportHulls = (fleets: ArmyView[]): number => fleets.reduce((sum, fleet) => sum + fleet.formations.filter(formation => (units.get(formation.unitId)?.naval?.transportCapacity ?? 0) > 0).length, 0);
const charterRequirement = (armies: ArmyView[]): number => Math.min(3, Math.max(1, ...armies.map(army => Math.ceil(army.formations.length / 8))));
const charteredHulls = (fleets: ArmyView[], harborCell: number, required: number, width: number): number => {
  const local = fleets.filter(fleet => !fleet.cargo.length && hexDistance(fleet.cell, harborCell, width) <= 1);
  // A large expedition assembling at a port cannot borrow the capacity of ships
  // already deployed elsewhere. A returning single ferry still serves normal traffic.
  return required > 1 && local.some(fleet => fleet.transportCapacity) ? transportHulls(local) : transportHulls(fleets);
};
const prices = new Map([...UNITS, ...BUILDINGS].map(item => [item.id, item.coinCost]));
const isSea = (cell: Observation['cells'][number] | undefined): boolean => cell?.terrain === TERRAIN.water && !isLake(cell.hydrology ?? 0);
type SeaKnowledge = ReturnType<typeof createSeaKnowledge>;
type ObservedCells = ReadonlyMap<number, Observation['cells'][number]>;
const coastalWaters = (view: Observation, cell: number, cells: ObservedCells): number[] =>
  neighbors(cell, view.width, view.height).filter(next => cells.get(next)?.terrain === TERRAIN.water);
const portWaters = (view: Observation, town: Observation['settlements'][number], cells: ObservedCells): number[] => {
  const launches = view.productionOptions.filter(option => option.settlementId === town.id && option.kind === 'naval' && option.launchCell != null)
    .map(option => option.launchCell!);
  return launches.length ? [...new Set(launches)] : coastalWaters(view, town.cell, cells);
};
// Use current authoritative launches at built ports. Before prerequisites are met,
// mixed-basin adjacency remains uncertain rather than copying the launch algorithm.
const portStatus = (view: Observation, cell: number, cells: ObservedCells, sea: SeaKnowledge): BasinStatus => {
  const town = view.settlements.find(town => town.factionId === view.factionId && town.cell === cell);
  const water = town ? portWaters(view, town, cells) : coastalWaters(view, cell, cells);
  if (!water.length || water.some(next => !isSea(cells.get(next)))) return 'enclosed';
  const statuses = water.map(next => sea.basinStatus(next));
  return statuses.every(status => status === 'open') ? 'open' : statuses.some(status => status === 'enclosed') ? 'enclosed' : 'unknown';
};
const portRank = { enclosed: 0, unknown: 1, open: 2 } as const;
function relationToPort(water: readonly number[], cell: number, sea: SeaKnowledge): BasinRelation {
  let unknown = water.length === 0;
  for (const origin of water) {
    const relation = sea.basinRelation(origin, cell);
    if (relation === 'connected') return relation;
    unknown ||= relation === 'unknown';
  }
  return unknown ? 'unknown' : 'separate';
}
function preferredPort(view: Observation, cells: ObservedCells, sea: SeaKnowledge) {
  return view.settlements.filter(town => town.factionId === view.factionId && !town.occupationTurns
    && !view.visibleSiegeSettlementIds.includes(town.id) && coastalWaters(view, town.cell, cells).some(cell => isSea(cells.get(cell))))
    .map(town => ({ town, status: portStatus(view, town.cell, cells, sea) }))
    .sort((a, b) => portRank[b.status] - portRank[a.status]
      || Number(b.town.buildings.includes('building.harbor')) - Number(a.town.buildings.includes('building.harbor'))
      || Number(b.town.buildings.includes('building.workshop')) - Number(a.town.buildings.includes('building.workshop'))
      || Number(b.town.buildings.includes('building.granary')) - Number(a.town.buildings.includes('building.granary')) || byId(a.town, b.town))[0]?.town;
}
export interface NavalPlan extends AiPlan { coinSpent: number; heldArmyIds: Set<string>; queuedSettlementIds: Set<string>; interrupts: boolean }
export interface NavalPlanOptions { heldArmyIds?: ReadonlySet<string>; knowledgeBudget?: number }

/** Match the existing broad-theater expansion scale. Compact seas can be charted
 * by the ferry and later ocean escort; a third permanent hull needs space or a threat. */
export function coastalReconnaissanceUseful(view: Pick<Observation, 'width' | 'height' | 'factionCount' | 'factionId' | 'armies'>): boolean {
  return view.width * view.height / Math.max(1, view.factionCount) > 3000
    || view.armies.some(army => army.factionId !== view.factionId && army.domain === 'naval');
}

/** One prospective harbor, not an empire-wide building policy. No hidden coast scan.
 * A single island hearth must be able to start the chain before a second town exists. */
export function hasNavalOpportunity(view: Observation): boolean {
  const fleetCells = new Set(view.armies.filter(army => army.factionId === view.factionId && army.domain === 'naval').map(army => army.cell));
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  const shores = new Set(towns.flatMap(town => neighbors(town.cell, view.width, view.height)));
  return view.cells.some(cell => isSea(cell) && (shores.has(cell.cell) || fleetCells.has(cell.cell)));
}

/** Next researched-or-saved-for link in the paid maritime chain. Returning an
 * unaffordable goal reserves knowledge; it does not authorize a research order. */
export function navalResearchChoice(view: Observation) {
  if (view.progression.technologies.includes('technology.ocean_navigation') || !hasNavalOpportunity(view)) return undefined;
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  // An isolated modern realm's open-sea harbor is a concrete first-contact goal.
  // Reserve its quoted research before cheaper land techniques spend the same
  // knowledge; the naval planner still validates and pays the actual order.
  const firstContact = Boolean(view.growth && view.factionCount > 1 && view.factions.length === 1);
  return researchChoice(view, cells, createSeaKnowledge(view, cells), firstContact);
}
function researchChoice(view: Observation, cells: ObservedCells, sea: SeaKnowledge, harborReconnaissance = false) {
  if (view.progression.technologies.includes('technology.ocean_navigation')) return undefined;
  const potential = view.armies.filter(army => army.factionId === view.factionId && army.domain === 'naval').map(army => army.cell)
    .concat(view.settlements.filter(town => town.factionId === view.factionId).flatMap(town => coastalWaters(view, town.cell, cells)));
  const id = !view.progression.technologies.includes('technology.coastal_navigation') ? 'technology.coastal_navigation'
    : (view.armies.some(army => army.factionId === view.factionId && army.domain === 'naval'
      && army.formations.some(formation => units.get(formation.unitId)?.naval?.oceanCapable))
      || view.settlements.some(town => town.factionId === view.factionId && (town.queue.some(order => order.itemId === 'unit.transport')
        || harborReconnaissance && coastalReconnaissanceUseful(view) && town.buildings.includes('building.harbor'))))
      && potential.some(cell => isSea(cells.get(cell)) && !sea.shallowEnclosed(cell)) ? 'technology.ocean_navigation' : null;
  return view.progression.technologyChoices.find(choice => choice.id === id && !view.progression.technologies.includes(choice.id)
    && choice.requires.every(id => view.progression.technologies.includes(id)));
}

/** A temporary funding need, not a permanent license to consume the victory reserve. */
export function needsNavalInvestment(view: Observation): boolean {
  if (!hasNavalOpportunity(view)) return false;
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const sea = createSeaKnowledge(view, cells), prospective = preferredPort(view, cells, sea);
  if (!prospective) return false;
  const harbor = prospective.buildings.includes('building.harbor') ? prospective : undefined;
  const water = portWaters(view, prospective, cells).filter(cell => isSea(cells.get(cell)));
  const sameSea = (cell: number) => relationToPort(water, cell, sea) === 'connected';
  const operatingTowns = towns.filter(town => coastalWaters(view, town.cell, cells).some(sameSea));
  const queued = (itemId: string) => operatingTowns.some(town => town.queue.some(order => order.itemId === itemId));
  if (!harbor) return !prospective.queue.some(order => order.itemId === 'building.harbor');
  const armies = view.armies.filter(army => army.factionId === view.factionId);
  const fleets = armies.filter(army => army.domain === 'naval' && isSea(cells.get(army.cell)) && sameSea(army.cell));
  const allFleets = armies.filter(army => army.domain === 'naval');
  const uncertainFleet = allFleets.some(fleet => relationToPort(water, fleet.cell, sea) === 'unknown');
  const canFundHull = !uncertainFleet || allFleets.reduce((sum, army) => sum + army.formations.length, 0)
    + towns.reduce((sum, town) => sum + town.queue.filter(order => units.get(order.itemId)?.movementDomain === 'naval').length, 0) < MAX_NAVAL_FLEETS;
  const ocean = water.some(cell => !sea.shallowEnclosed(cell));
  const protectedIds = protectedFactions(view);
  const enemies = view.settlements.some(town => town.factionId !== view.factionId && !protectedIds.has(town.factionId));
  const localCargo = armies.filter(army => army.domain === 'land' && !army.carrierId && !army.movementBlocker
    && hexDistance(army.cell, harbor.cell, view.width) <= 8 && towns.some(town => hexDistance(army.cell, town.cell, view.width) <= 3)
    && (army.canFound || army.canAttack && army.formations.length >= 2 && enemies));
  const required = charterRequirement(localCargo);
  if (canFundHull && charteredHulls(fleets, harbor.cell, required, view.width) < required && !queued('unit.transport') && transportHulls(fleets) < MAX_NAVAL_FLEETS) return true;
  if (canFundHull && ocean && (coastalReconnaissanceUseful(view) || view.progression.technologies.includes('technology.ocean_navigation'))
    && !fleets.some(fleet => fleet.formations.some(formation => (units.get(formation.unitId)?.naval?.transportCapacity ?? 0) === 0))
    && !queued('unit.coastal_warship') && !queued('unit.ocean_warship')) return true;
  if (canFundHull && ocean && view.progression.technologies.includes('technology.ocean_navigation')
    && !fleets.some(fleet => fleet.formations.some(formation => formation.unitId === 'unit.ocean_warship')) && !queued('unit.ocean_warship')) return true;
  return fleets.some(fleet => fleet.transportCapacity > 0 && !fleet.cargo.length && hexDistance(fleet.cell, harbor.cell, view.width) <= 8)
    && !queued('unit.colonist') && !armies.some(army => containsFounder(army)
      && (army.carrierId ? fleets.some(fleet => fleet.id === army.carrierId) : hexDistance(army.cell, harbor.cell, view.width) <= 8));
}

/** A second founding party may establish a port on reachable charted land. This bounded
 * search does not cross water or infer a coastline from undiscovered canonical cells. */
export function coastalFoundingSite(view: Observation, army: ArmyView): number | null {
  if (!army.canFound || army.carrierId) return null;
  const towns = view.settlements.filter(town => town.factionId === view.factionId);
  if (!towns.length) return null;
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const sea = createSeaKnowledge(view, cells);
  const currentRank = Math.max(...towns.map(town => portRank[portStatus(view, town.cell, cells, sea)]));
  // A charting gap is not evidence that an existing port needs replacing. Keep
  // normal land expansion until every existing coastal opportunity is positively
  // enclosed; otherwise a distant edge proof can divert a ready founder forever.
  if (currentRank >= portRank.unknown) return null;
  const occupied = new Set([...view.armies, ...view.settlements].filter(entity => entity.factionId !== view.factionId).map(entity => entity.cell));
  const unavailable = new Set<number>();
  for (const town of view.settlements) {
    const seen = new Set([town.cell]); let edge = [town.cell];
    for (let radius = 0; radius < (view.growth ? 2 : 3); radius++) {
      const next: number[] = [];
      for (const cell of edge) for (const adjacent of neighbors(cell, view.width, view.height)) if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); }
      edge = next;
    }
    for (const cell of seen) unavailable.add(cell);
  }
  const queue = [army.cell], visited = new Set(queue);
  for (let cursor = 0; cursor < queue.length && cursor < MAX_PORT_SEARCH_NODES; cursor++) {
    const cell = queue[cursor]!, adjacent = neighbors(cell, view.width, view.height);
    if (!unavailable.has(cell) && !cells.get(cell)?.settlementId && (!view.growth || view.settlements.every(town => hexDistance(cell, town.cell, view.width) >= settlementSpacing(view, cell))) && portRank[portStatus(view, cell, cells, sea)] > currentRank) return cell;
    for (const next of adjacent) if (!visited.has(next) && !occupied.has(next) && isPassable(cells.get(next)?.terrain ?? 0)) { visited.add(next); queue.push(next); }
  }
  return null;
}

/** Public proposals only. No persistent ghost operation, canonical writes or hidden map access. */
export function planNaval(view: Observation, coinBudget: number, options: NavalPlanOptions = {}): NavalPlan {
  const commands: GameCommand[] = [], reasons: string[] = [], heldArmyIds = new Set(options.heldArmyIds), queuedSettlementIds = new Set<string>();
  let budget = Math.max(0, coinBudget), interrupts = false;
  const result = (): NavalPlan => ({ commands, reasons, heldArmyIds, queuedSettlementIds, coinSpent: Math.max(0, coinBudget) - budget, interrupts });
  if (view.victory || view.battle || view.pendingCapture || !hasNavalOpportunity(view)) return result();
  const factionId = view.factionId, cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const own = view.armies.filter(army => army.factionId === factionId).sort(byId);
  const fleets = own.filter(army => army.domain === 'naval' && isSea(cells.get(army.cell)));
  const foreign = view.armies.filter(army => army.factionId !== factionId && !army.carrierId);
  const protectedIds = protectedFactions(view), wars = new Set(view.wars);
  const towns = view.settlements.filter(town => town.factionId === factionId).sort(byId);
  const seaKnowledge = createSeaKnowledge(view, cells);
  // Unknown remote hulls cannot satisfy a local charter, but uncertainty must
  // not create an unbounded realm-wide shipbuilding subsidy either.
  const committedHullCount = own.filter(army => army.domain === 'naval').reduce((sum, fleet) => sum + fleet.formations.length, 0)
    + towns.reduce((sum, town) => sum + town.queue.filter(order => units.get(order.itemId)?.movementDomain === 'naval').length, 0);
  let canFundSpeculativeHull = true;
  const coastTowns = towns.filter(town => coastalWaters(view, town.cell, cells).some(cell => isSea(cells.get(cell))));
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
    if (units.get(itemId)?.movementDomain === 'naval' && !canFundSpeculativeHull) return false;
    commands.push({ type: 'queue', factionId, settlementId: townId, itemId }); budget -= cost; queuedSettlementIds.add(townId);
    reasons.push(`Fund ${itemId} at ${townId} for a bounded coastal expedition (${cost} coin).`); return true;
  };
  const knowledge = options.knowledgeBudget ?? view.knowledge;
  // A ready broad-theater harbor can use spare knowledge for its first ocean
  // scout. An actual charter keeps the existing strategic research reservation.
  const nextResearch = researchChoice(view, cells, seaKnowledge, true);
  const research = nextResearch?.available && nextResearch.knowledgeCost <= knowledge ? nextResearch : undefined;
  if (research) { commands.push({ type: 'research', factionId, technologyId: research.id }); reasons.push(`Research ${research.name} for the observed coastal expedition; hull restrictions still apply.`); }
  const prospective = preferredPort(view, cells, seaKnowledge);
  const harbor = prospective?.buildings.includes('building.harbor') ? prospective : undefined;
  const portWater = prospective ? portWaters(view, prospective, cells).filter(cell => isSea(cells.get(cell))) : [];
  const sameSea = (cell: number) => relationToPort(portWater, cell, seaKnowledge) === 'connected';
  canFundSpeculativeHull = !fleets.some(fleet => relationToPort(portWater, fleet.cell, seaKnowledge) === 'unknown') || committedHullCount < MAX_NAVAL_FLEETS;
  const operatingFleets = fleets.filter(fleet => sameSea(fleet.cell));
  const operatingTowns = towns.filter(town => coastalWaters(view, town.cell, cells).some(sameSea));
  const queuedCount = (itemId: string) => operatingTowns.reduce((sum, town) => sum + town.queue.filter(order => order.itemId === itemId).length, 0);
  const ocean = portWater.some(cell => !seaKnowledge.shallowEnclosed(cell));
  // Wait for fresh prerequisite facts; research and construction are never assumed completed.
  if (prospective && !harbor && !prospective.queue.some(order => order.itemId === 'building.harbor')) queue(prospective.id, 'building.harbor');
  const transports = transportHulls(fleets);
  if (harbor) {
    const nearbyCargo = cargoCandidates.filter(army => hexDistance(army.cell, harbor.cell, view.width) <= 8);
    const required = charterRequirement(nearbyCargo);
    // Reconnoitre a broad theater before committing a passenger expedition. A
    // compact inland ferry still takes precedence over an unnecessary warship.
    const unscouted = ocean && !operatingFleets.some(fleet => fleet.formations.some(formation => (units.get(formation.unitId)?.naval?.transportCapacity ?? 0) === 0))
      && !queuedCount('unit.coastal_warship') && !queuedCount('unit.ocean_warship');
    const needsOceanScout = ocean && view.progression.technologies.includes('technology.ocean_navigation')
      && !operatingFleets.some(fleet => fleet.canEnterDeepWater && fleet.formations.some(formation => (units.get(formation.unitId)?.naval?.transportCapacity ?? 0) === 0)) && !queuedCount('unit.ocean_warship');
    // Coastal galleys cannot chart the ocean after that research is unlocked.
    // Reserve its scout before another passenger caravan perpetually occupies the harbor.
    if ((unscouted || needsOceanScout) && coastalReconnaissanceUseful(view) && !(required > 1 && charteredHulls(operatingFleets, harbor.cell, required, view.width) < required)) queue(harbor.id, view.progression.technologies.includes('technology.ocean_navigation') ? 'unit.ocean_warship' : 'unit.coastal_warship');
    else if (charteredHulls(operatingFleets, harbor.cell, required, view.width) + queuedCount('unit.transport') < required
      && transports + queuedCount('unit.transport') < MAX_NAVAL_FLEETS) queue(harbor.id, 'unit.transport');
    else if (operatingFleets.some(fleet => fleet.transportCapacity && !fleet.cargo.length)
      // A distant land expedition is not the harbor's passenger supply. Reserve a local
      // caravan without interfering with that independent, already paid colonist.
      && !own.some(army => containsFounder(army) && (army.carrierId ? operatingFleets.some(fleet => fleet.id === army.carrierId) : hexDistance(army.cell, harbor.cell, view.width) <= 8))
      && !harbor.queue.some(order => order.itemId === 'unit.colonist')) queue(harbor.id, 'unit.colonist');
    else if (unscouted) {
      // A fast coastal scout discovers local neighbors before Ocean research; an
      // ocean-capable successor later covers routes the galley cannot enter.
      if (view.progression.technologies.includes('technology.ocean_navigation')) queue(harbor.id, 'unit.ocean_warship');
      else if (coastalReconnaissanceUseful(view)) queue(harbor.id, 'unit.coastal_warship');
    } else if (ocean && view.progression.technologies.includes('technology.ocean_navigation')
      && !operatingFleets.some(fleet => fleet.formations.some(formation => formation.unitId === 'unit.ocean_warship'))
      && !queuedCount('unit.ocean_warship')) queue(harbor.id, 'unit.ocean_warship');
  }
  const awaitingFounder = Boolean(harbor && (harbor.queue.some(order => order.itemId === 'unit.colonist')
    || commands.some(command => command.type === 'queue' && command.settlementId === harbor.id && command.itemId === 'unit.colonist')));

  // One O(observed cells) shoreline pass; at most256 sampled objectives and8 fleets per plan.
  const allShores = view.cells.filter(cell => isPassable(cell.terrain) && !occupied.has(cell.cell)
    && neighbors(cell.cell, view.width, view.height).some(next => isSea(cells.get(next))));
  const stride = Math.max(1, Math.ceil(allShores.length / 256)), shores = allShores.filter((_, index) => index % stride === 0);
  // Prefer land not already connected to an owned hearth through observed land. A fixed
  // flood budget is a heuristic, never a claim that unknown geography is an island.
  const homeLand = new Set(towns.map(town => town.cell)), landQueue = [...homeLand];
  for (let cursor = 0; cursor < landQueue.length && cursor < MAX_NAVAL_LAND_NODES; cursor++) {
    for (const next of neighbors(landQueue[cursor]!, view.width, view.height)) if (!homeLand.has(next) && isPassable(cells.get(next)?.terrain ?? 0)) { homeLand.add(next); landQueue.push(next); }
  }
  const navigation = createNavigation(view), claimed = new Set<number>();
  const coastalFrontier = new Set(allShores.filter(cell => neighbors(cell.cell, view.width, view.height).some(next => !cells.has(next))).map(cell => cell.cell));
  const shoreDiscovery = new Map<number, boolean>();
  const nearCoastalFrontier = (cell: number): boolean => {
    const cached = shoreDiscovery.get(cell); if (cached !== undefined) return cached;
    const row = Math.floor(cell / view.width), column = cell % view.width;
    for (let y = Math.max(0, row - 5); y <= Math.min(view.height - 1, row + 5); y++) for (let x = Math.max(0, column - 5); x <= Math.min(view.width - 1, column + 5); x++) {
      const next = y * view.width + x;
      if (coastalFrontier.has(next) && hexDistance(cell, next, view.width) <= 5) { shoreDiscovery.set(cell, true); return true; }
    }
    shoreDiscovery.set(cell, false); return false;
  };
  // Prefer discoveries near unfinished charted shorelines. Across open water a
  // modest inward bearing uses public dimensions, never hidden starts/enemies.
  // Fully charted destinations still use the bounded frontier fallback, not a
  // permanent center objective that can trap a fleet in already-known water.
  const chartCenter = Math.floor(view.height / 2) * view.width + Math.floor(view.width / 2);
  const explore = (fleet: ArmyView) => navigation.destination(fleet, fleet.sight, claimed, undefined,
    fleet.transportCapacity ? undefined : cell => -hexDistance(cell, chartCenter, view.width),
    (cell, gain) => gain * (nearCoastalFrontier(cell) ? 250 : 100)
      + (gain > 0 && fleet.canEnterDeepWater ? (hexDistance(fleet.cell, chartCenter, view.width) - hexDistance(cell, chartCenter, view.width)) * 200 : 0),
    // Independent reconnaissance uses observed local identity. Preserve the
    // established expedition tie order for fleets that can carry passengers.
    fleet.transportCapacity ? fleet.id : `${fleet.factionId}:${fleet.formations.map(formation => formation.unitId).sort().join('|')}:${fleet.cell}`);
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
  if (harbor) {
    const local = fleets.filter(fleet => fleet.transportCapacity && !fleet.cargo.length && hexDistance(fleet.cell, harbor.cell, view.width) <= 1);
    const expedition = cargoCandidates.find(army => hexDistance(army.cell, harbor.cell, view.width) <= 8
      && army.formations.length > Math.max(0, ...local.map(fleet => fleet.transportCapacity)));
    const assembly = local[0];
    if (expedition && assembly) {
      heldArmyIds.add(expedition.id); // Do not scatter a waiting twenty-company column.
      if (!heldArmyIds.has(assembly.id)) for (const other of local.slice(1, MAX_NAVAL_FLEETS)) {
        if (other.cell !== assembly.cell && other.movement > 0 && !other.movementBlocker && !heldArmyIds.has(other.id)) move(other, toward(other, assembly.cell), 'assemble chartered transport capacity at the expedition berth');
      }
      heldArmyIds.add(assembly.id);
    }
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
      // A proved, fully charted inland basin has no undiscovered sea exit. Its
      // ferry can still found a safely separated town on the surrounding land;
      // unknown boundaries or exhausted search budgets never authorize this fallback.
      const enclosed = colonizing && seaKnowledge.enclosed(fleet.cell);
      const viableLanding = (cell: number) => isPassable(cells.get(cell)?.terrain ?? 0) && !occupied.has(cell)
        && (colonizing ? !cells.get(cell)?.settlementId && nearest(cell, view.settlements) >= settlementSpacing(view, cell) : nearest(cell, towns) >= 4)
        // Do not unload at the first free beach on the departure landmass. A cell outside
        // the bounded observed component is an expedition candidate, not proof of an island.
        && (!colonizing || !homeLand.has(cell) || enclosed)
        && !foreign.some(enemy => enemy.domain !== 'naval' && hexDistance(cell, enemy.cell, view.width) <= 2);
      const viableShores = shores.filter(shore => viableLanding(shore.cell));
      const landingScore = (cell: number): number => (homeLand.has(cell) ? 0 : 200) + (colonizing ? Math.min(8, nearest(cell, view.settlements)) * 10 : enemyTowns.length ? -nearest(cell, enemyTowns) * 30 : 0)
        + (cells.get(cell)?.fertility ?? 0) - hexDistance(fleet.cell, cell, view.width) * 15;
      const landings = [...viableShores].sort((a, b) => landingScore(b.cell) - landingScore(a.cell) || a.cell - b.cell);
      const passenger = passengers.find(army => !heldArmyIds.has(army.id));
      // Long-range objectives are sampled, immediate authoritative landings are not.
      const permitted = passenger?.disembarkOptions.filter(option => option.canDisembark && viableLanding(option.cell)).sort((a, b) => landingScore(b.cell) - landingScore(a.cell) || a.cell - b.cell)[0];
      if (passenger && permitted) {
        commands.push({ type: 'disembarkArmy', factionId, armyId: passenger.id, target: permitted.cell }); heldArmyIds.add(fleet.id); heldArmyIds.add(passenger.id);
        reasons.push(`${fleet.name} lands ${passenger.name} on an unoccupied shore away from existing hearths.`); continue;
      }
      let destination: number | undefined;
      for (const shore of landings.slice(0, 4)) {
        const water = neighbors(shore.cell, view.width, view.height).filter(cell => isSea(cells.get(cell)) && !occupied.has(cell)).sort((a, b) => hexDistance(fleet.cell, a, view.width) - hexDistance(fleet.cell, b, view.width) || a - b);
        for (const cell of water.slice(0, 2)) { destination = toward(fleet, cell); if (destination !== undefined) break; }
        if (destination !== undefined) break;
      }
      if (move(fleet, destination, 'sail the known water route toward a viable landing')) continue;
      if (move(fleet, explore(fleet), 'chart water while seeking a safe landing')) continue;
      // A failed bounded frontier search is not evidence that no overseas land exists.
      // In particular, do not unload/reboard at home while waiting for Ocean navigation.
      if (reasons.length < 20) reasons.push(`${fleet.name} holds its passengers while no currently charted expedition step is available${fleet.canEnterDeepWater ? '' : '; deep-water access may still require research'}.`);
      continue;
    }
    const candidates = cargoCandidates.filter(army => !heldArmyIds.has(army.id) && army.formations.length <= fleet.transportCapacity
      && (containsFounder(army) || !awaitingFounder)
      && hexDistance(army.cell, fleet.cell, view.width) <= 32).sort((a, b) => Number(b.canFound) - Number(a.canFound) || hexDistance(a.cell, fleet.cell, view.width) - hexDistance(b.cell, fleet.cell, view.width) || byId(a, b));
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
        for (const cell of neighbors(shore.cell, view.width, view.height).filter(cell => isSea(cells.get(cell)))) { destination = toward(fleet, cell); if (destination !== undefined) break; }
        if (destination !== undefined) break;
      }
      move(fleet, destination, 'meet the waiting land expedition at its shore'); continue;
    }
    if (fleet.transportCapacity) {
      const home = coastTowns.filter(town => coastalWaters(view, town.cell, cells).some(cell => seaKnowledge.basinRelation(cell, fleet.cell) === 'connected'))
        .sort((a, b) => hexDistance(a.cell, fleet.cell, view.width) - hexDistance(b.cell, fleet.cell, view.width) || byId(a, b))[0];
      const rendezvous = home && (cargoCandidates.some(army => hexDistance(army.cell, home.cell, view.width) <= 8)
        || home.queue.some(order => order.itemId === 'unit.colonist') || commands.some(command => command.type === 'queue' && command.settlementId === home.id && command.itemId === 'unit.colonist'));
      if (home && rendezvous && hexDistance(home.cell, fleet.cell, view.width) > 1) {
        const approach = neighbors(home.cell, view.width, view.height).filter(cell => isSea(cells.get(cell))).sort((a, b) => hexDistance(a, fleet.cell, view.width) - hexDistance(b, fleet.cell, view.width));
        for (const cell of approach.slice(0, 2)) if (move(fleet, toward(fleet, cell), 'return to a harbor for the next expedition')) break;
      } else if (!rendezvous) move(fleet, explore(fleet), 'chart unknown water while no passengers await a rendezvous');
    } else move(fleet, explore(fleet), 'patrol and chart permitted coastal water');
  }
  return result();
}
