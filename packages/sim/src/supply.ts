import { UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import type { DomainEvent, GameState, Observation } from './types';
import { DEPOT_BUDGET, depotsOf } from './depots';
import { hasRoadEdge } from './roads';
import { indexes } from './visibility';
import { atWar } from './warfare';
import { rulesVersion } from './rules';
import { FLEET_PROVISION_TURNS } from './fleet-provisions';
import { supplyAccessSources, type SupplyAccessSource } from './supply-access';
export { FLEET_PROVISION_TURNS } from './fleet-provisions';

/** Rules 27: a realm feeds its armies from its hearths, from rules 28 also from
 * the depots it builds, and from rules 30 a hearth with a harbour carries supply
 * out over the water as well as the land. Supply spreads outward
 * over passable ground, runs twice as far along a built road, and stops at an
 * enemy company. A hearth under siege feeds nobody. An army standing outside
 * supply recovers nothing and wastes away until it comes back inside one.
 * Supply is derived from the map every time it is asked: nothing is stored. */
const units = new Map(UNITS.map(item => [item.id, item]));
/** Half-steps: four ordinary hexes, or eight along a road. */
export const SUPPLY_BUDGET = 8;
export const SUPPLY_OPEN_COST = 2;
export const SUPPLY_ROAD_COST = 1;
/** Strength a formation loses each turn it stands outside supply. */
export const SUPPLY_ATTRITION = 4;
/** Attrition wears a company down to a fifth of its strength and no further. */
export const SUPPLY_FLOOR = 0.2;
/** Outside supply a force still rests, but badly: it recovers at a third of the
 * ordinary rate, so it falls behind a fed enemy rather than collapsing outright. */
export const SUPPLY_MORALE_RECOVERY = 3;
export const SUPPLY_FATIGUE_RECOVERY = 5;
/** Supply is the price of massing a force, never a tax on scouting or settling:
 * a force of fewer than three companies, or any expedition carrying a caravan,
 * lives off the land wherever it goes. */
export const SUPPLY_MIN_FORMATIONS = 3;
/** Rules 30: only a harbour carries supply over water, and only its own line does. */
export const HARBOR_BUILDING_ID = 'building.harbor';

export interface ArmySupply {
  armyId: string;
  supplied: boolean;
  sourceSettlementId: string | null;
  reason: string;
  /** Private to this realm; also shown on its embarked armies. */
  fleetProvisions?: { remaining: number; capacity: number; refilling: boolean };
}

const isNaval = (state: GameState, armyId: string): boolean =>
  state.armies[armyId]?.formations.some(item => units.get(item.unitId)?.movementDomain === 'naval') ?? false;
/** A realm that holds no hearth has no line to cut: its forces live off the land
 * entirely. This is also every realm's opening, before the first hearth stands. */
const landless = (state: GameState, factionId: string): boolean =>
  !Object.values(state.settlements).some(town => town.factionId === factionId) && !depotsOf(state, factionId).length;
/** Small forces and settling expeditions feed themselves. */
const forages = (state: GameState, armyId: string): boolean => {
  const army = state.armies[armyId];
  return !army || army.formations.length < SUPPLY_MIN_FORMATIONS || army.formations.some(item => units.get(item.unitId)?.canFound);
};

// Query-local labels preserve the agreement's disclosure without repeated
// agreement scans per army or looking up a foreign hearth's current name.
const importedLabels = new WeakMap<Map<number, string>, Map<string, SupplyAccessSource>>();
type SupplySeed = { cell: number; source: string; spent: number };
type SupplyGraph = { width: number; height: number; terrain: (cell: number) => number; road: (cell: number) => number; known?: (cell: number) => boolean; blocked: (cell: number) => boolean };
/** Bucketed bounded propagation shared by actual supply and the contracted
 * forecast. The latter passes only permitted cells, blockers and remembered roads. */
function spreadSupply(state: GameState, reached: Map<number, string>, seeds: readonly SupplySeed[], overWater: boolean,
  blocked: (cell: number) => boolean, knownOnly?: string): void {
  spreadGraph({ width: state.world.width, height: state.world.height, terrain: cell => state.world.terrain[cell] ?? 0,
    road: cell => knownOnly ? state.roads.known[knownOnly]?.[cell] ?? 0 : state.roads.edges[cell] ?? 0,
    known: knownOnly ? cell => state.explored[knownOnly]?.has(cell) ?? false : undefined, blocked }, reached, seeds, overWater);
}
function spreadGraph(graph: SupplyGraph, reached: Map<number, string>, seeds: readonly SupplySeed[], overWater: boolean): void {
  const { width, height } = graph;
  const buckets: number[][] = Array.from({ length: SUPPLY_BUDGET + 1 }, () => []);
  const spent = new Map<number, number>(), source = new Map<number, string>();
  for (const seed of [...seeds].sort((a, b) => a.cell - b.cell)) {
    if ((spent.get(seed.cell) ?? Infinity) <= seed.spent) continue;
    spent.set(seed.cell, seed.spent); source.set(seed.cell, seed.source); buckets[seed.spent]!.push(seed.cell);
  }
  for (let cost = 0; cost <= SUPPLY_BUDGET; cost++) for (const cell of buckets[cost]!.sort((a, b) => a - b)) {
    if ((spent.get(cell) ?? Infinity) < cost) continue;
    for (const next of neighbors(cell, width, height).sort((a, b) => a - b)) {
      if (graph.known && !graph.known(next)) continue;
      if (!overWater && !isPassable(graph.terrain(next))) continue;
      if (graph.blocked(next)) continue;
      const mask = graph.road(cell);
      const step = hasRoadEdge(cell, next, width, mask) ? SUPPLY_ROAD_COST : SUPPLY_OPEN_COST;
      const total = cost + step;
      if (total > SUPPLY_BUDGET || total >= (spent.get(next) ?? Infinity)) continue;
      spent.set(next, total); source.set(next, source.get(cell)!); buckets[total]!.push(next);
    }
  }
  for (const [cell, owner] of source) if (!reached.has(cell)) reached.set(cell, owner);
}

const previewGraphs = new WeakMap<Observation, SupplyGraph>();
/** Prospective contracted reach from a currently observed foreign hearth.
 * Uses the exact supply propagation above, with only permitted terrain, roads
 * and blockers. This is a forecast, never proof against unseen disruption. */
export function previewSupplyAccessCells(view: Observation, settlementId: string): number[] {
  if (!view.supplyAccess) return [];
  const town = view.settlements.find(item => item.id === settlementId && item.factionId !== view.factionId);
  if (!town || view.wars.includes(town.factionId) || view.sieges.some(siege => siege.settlementId === town.id)
    || view.visibleSiegeSettlementIds.includes(town.id) || !view.cells.some(cell => cell.cell === town.cell && cell.visible)) return [];
  let graph = previewGraphs.get(view);
  if (!graph) {
    const cells = new Map(view.cells.map(cell => [cell.cell, { terrain: cell.terrain, road: cell.roadMask ?? 0 }]));
    const blocked = new Set([...view.settlements.filter(item => item.factionId !== view.factionId).map(item => item.cell),
      ...view.armies.filter(army => !army.carrierId && view.wars.includes(army.factionId)).map(army => army.cell)]);
    graph = { width: view.width, height: view.height, terrain: cell => cells.get(cell)?.terrain ?? 0,
      road: cell => cells.get(cell)?.road ?? 0, known: cell => cells.has(cell), blocked: cell => blocked.has(cell) };
    previewGraphs.set(view, graph);
  }
  const reached = new Map<number, string>(), seeds = [{ cell: town.cell, source: town.id, spent: 0 }];
  spreadGraph(graph, reached, seeds, false);
  if (town.buildings.includes(HARBOR_BUILDING_ID)) spreadGraph(graph, reached, seeds, true);
  return [...reached.keys()].sort((a, b) => a - b);
}

/** Every hex a realm can feed, and the hearth that feeds it. Bounded by the
 * realm's own hearths and the supply budget, never by the size of the map. */
export function suppliedCells(state: GameState, factionId: string): Map<number, string> {
  const reached = new Map<number, string>();
  if (rulesVersion(state) < 27) return reached;
  const index = indexes(state);
  const blocked = (cell: number): boolean => {
    const other = index.settlements.get(cell);
    if (other !== undefined && state.settlements[other]?.factionId !== factionId) return true;
    for (const armyId of index.armies.get(cell) ?? []) {
      const owner = state.armies[armyId]?.factionId;
      if (owner && owner !== factionId && atWar(state, factionId, owner)) return true;
    }
    return false;
  };
  const spread = (seeds: readonly SupplySeed[], overWater: boolean) => spreadSupply(state, reached, seeds, overWater, blocked);

  const hearths = Object.values(state.settlements).filter(town => town.factionId === factionId && !state.sieges[town.id]);
  spread([
    ...hearths.map(town => ({ cell: town.cell, source: town.id, spent: 0 })),
    // A depot is seeded with only its own shorter budget left to spend.
    ...depotsOf(state, factionId).map(depot => ({ cell: depot.cell, source: `depot.${depot.cell}`, spent: SUPPLY_BUDGET - DEPOT_BUDGET })),
  ], false);
  // Rules 30: a hearth with a harbour carries its line out over the water too,
  // so a fleet or a landing near a friendly coast is fed without building a post.
  if (rulesVersion(state) >= 30) {
    const ports = hearths.filter(town => town.buildings.includes(HARBOR_BUILDING_ID));
    if (ports.length) spread(ports.map(town => ({ cell: town.cell, source: town.id, spent: 0 })), true);
  }
  if (rulesVersion(state) >= 34) {
    const agreements = supplyAccessSources(state, factionId);
    const labels = new Map(agreements.map(agreement => [agreement.id, { ...agreement.source }]));
    importedLabels.set(reached, labels);
    spread(agreements.map(agreement => ({ cell: agreement.source.cell, source: agreement.id, spent: 0 })), false);
    spread(agreements.filter(agreement => agreement.source.harbor && state.settlements[agreement.source.settlementId]?.buildings.includes(HARBOR_BUILDING_ID))
      .map(agreement => ({ cell: agreement.source.cell, source: agreement.id, spent: 0 })), true);
  }
  return reached;
}

/** Own supply retains its historical projection. Imported reach is a forecast
 * from frozen contractual facts, explored terrain and visible blockers. An
 * unseen siege/army/road/source change cannot reveal itself as map geometry.
 * Actual own-army status continues to use suppliedCells, not this forecast. */
export function observedSuppliedCells(state: GameState, factionId: string, actual = suppliedCells(state, factionId)): Map<number, string> {
  if (rulesVersion(state) < 34) return actual;
  const reached = new Map([...actual].filter(([, source]) => !source.startsWith('supply-access.')));
  const index = indexes(state), visible = index.visible.get(factionId);
  const agreements = state.supplyAccess.agreements.filter(agreement => agreement.buyerId === factionId && agreement.expiresTurn > state.turn
    && !atWar(state, factionId, agreement.providerId) && state.explored[factionId]?.has(agreement.source.cell)
    && (!visible?.has(agreement.source.cell) || state.settlements[agreement.source.settlementId]?.factionId === agreement.providerId && !state.sieges[agreement.source.settlementId]));
  const blocked = (cell: number) => {
    if (!visible?.has(cell)) return false;
    const town = index.settlements.get(cell);
    if (town && state.settlements[town]?.factionId !== factionId) return true;
    for (const id of index.armies.get(cell) ?? []) if (!state.transports[id] && state.armies[id]?.factionId !== factionId && atWar(state, factionId, state.armies[id]!.factionId)) return true;
    return false;
  };
  const seed = (agreement: typeof agreements[number]): SupplySeed => ({ cell: agreement.source.cell, source: agreement.id, spent: 0 });
  spreadSupply(state, reached, agreements.map(seed), false, blocked, factionId);
  spreadSupply(state, reached, agreements.filter(agreement => agreement.source.harbor
    && (!visible?.has(agreement.source.cell) || state.settlements[agreement.source.settlementId]?.buildings.includes(HARBOR_BUILDING_ID))).map(seed), true, blocked, factionId);
  importedLabels.set(reached, new Map(agreements.map(agreement => [agreement.id, { ...agreement.source }])));
  return reached;
}

function sourceFacts(state: GameState, supplied: Map<number, string>, source: string): { settlementId: string | null; name: string } {
  const contracted = importedLabels.get(supplied)?.get(source);
  if (contracted) return { settlementId: contracted.settlementId, name: contracted.name };
  return { settlementId: source.startsWith('depot.') || source.startsWith('supply-access.') ? null : source, name: state.settlements[source]?.name ?? source };
}

/** Why one army eats or does not, in the order a player meets the question. */
export function armySupply(state: GameState, armyId: string, supplied = suppliedCells(state, state.armies[armyId]?.factionId ?? '')): ArmySupply {
  const army = state.armies[armyId];
  if (!army) return { armyId, supplied: true, sourceSettlementId: null, reason: '' };
  if (rulesVersion(state) < 27) return { armyId, supplied: true, sourceSettlementId: null, reason: 'Supply lines are not kept under these rules.' };
  if (rulesVersion(state) >= 31) {
    const carrierId = state.transports[armyId];
    if (carrierId) {
      const carrier = armySupply(state, carrierId, supplied);
      return { ...carrier, armyId, reason: `Aboard ${state.armies[carrierId]?.name ?? 'its carrier'}. ${carrier.reason}` };
    }
    if (isNaval(state, armyId)) {
      const source = supplied.get(army.cell);
      const facts = source ? sourceFacts(state, supplied, source) : null;
      const remaining = army.provisions ?? FLEET_PROVISION_TURNS;
      return { armyId, supplied: Boolean(source) || remaining > 0, sourceSettlementId: facts?.settlementId ?? null,
        fleetProvisions: { remaining, capacity: FLEET_PROVISION_TURNS, refilling: Boolean(source) },
        reason: source ? `Supplied from ${facts!.name}. Stores refill to ${FLEET_PROVISION_TURNS} turns at the end of the turn.`
          : remaining > 0 ? `Stores feed this fleet and its passengers for ${remaining} more turn${remaining === 1 ? '' : 's'} beyond harbour supply. Return to resupply before they run out.`
            : `Out of stores: this fleet and its passengers lose ${SUPPLY_ATTRITION} strength a turn and recover slowly. Return to friendly harbour supply.` };
    }
  }
  if (isNaval(state, armyId)) return { armyId, supplied: true, sourceSettlementId: null, reason: 'A fleet carries its own stores.' };
  if (state.transports[armyId]) return { armyId, supplied: true, sourceSettlementId: null, reason: 'The army is aboard a fleet and draws on its stores.' };
  const source = supplied.get(army.cell);
  if (source) return { armyId, supplied: true, sourceSettlementId: sourceFacts(state, supplied, source).settlementId,
    reason: source.startsWith('depot.') ? `Supplied from the depot at hex ${source.slice(6)}.` : `Supplied from ${sourceFacts(state, supplied, source).name}.` };
  if (landless(state, army.factionId)) return { armyId, supplied: true, sourceSettlementId: null, reason: 'The realm holds no hearth; its forces live off the land.' };
  if (forages(state, armyId)) return { armyId, supplied: true, sourceSettlementId: null, reason: `A force of fewer than ${SUPPLY_MIN_FORMATIONS} companies, or one escorting a caravan, forages for itself.` };
  return { armyId, supplied: false, sourceSettlementId: null,
    reason: `Out of supply: no hearth of this realm reaches this ground. The company loses ${SUPPLY_ATTRITION} strength a turn and recovers nothing until it returns.` };
}

export function observeSupply(state: GameState, factionId: string, supplied = suppliedCells(state, factionId)): ArmySupply[] {
  if (rulesVersion(state) < 27) return [];
  return Object.values(state.armies).filter(army => army.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1)
    .map(army => armySupply(state, army.id, supplied));
}

/** Attrition, and the armies that recover nothing this turn. One notice a realm. */
export function advanceSupply(state: GameState, emitted: DomainEvent[]): Set<string> {
  const starving = new Set<string>();
  if (rulesVersion(state) < 27) return starving;
  const modern = rulesVersion(state) >= 31;
  for (const faction of state.factions) {
    const noHearth = landless(state, faction.id);
    if (!modern && noHearth) continue;
    const supplied = suppliedCells(state, faction.id);
    const armies = Object.values(state.armies).filter(item => item.factionId === faction.id).sort((a, b) => a.id < b.id ? -1 : 1);
    // Resolve all carriers before their passengers, so army ID ordering cannot
    // charge cargo a turn earlier when its carrier consumes the last ration.
    if (modern) for (const army of armies) {
      if (!isNaval(state, army.id)) continue;
      const previous = army.provisions ?? FLEET_PROVISION_TURNS;
      if (supplied.has(army.cell)) {
        army.provisions = FLEET_PROVISION_TURNS;
        if (previous < FLEET_PROVISION_TURNS) emitted.push({ turn: state.turn, factionId: faction.id, type: 'fleet_resupplied', cell: army.cell,
          message: `${army.name} replenished its stores to ${FLEET_PROVISION_TURNS} turns at friendly harbour supply.` });
      } else {
        army.provisions = Math.max(0, previous - 1);
        if (previous === 0) starving.add(army.id);
        if (previous === 1) emitted.push({ turn: state.turn, factionId: faction.id, type: 'fleet_stores_empty', cell: army.cell,
          message: `${army.name} consumed its last stores. Return to friendly harbour supply before the next turn to avoid losses aboard.` });
      }
    }
    let worn = 0;
    for (const army of armies) {
      const carrier = state.transports[army.id];
      if (modern && (isNaval(state, army.id) || carrier)) {
        if (!starving.has(carrier ?? army.id)) continue;
      } else if (noHearth || isNaval(state, army.id) || carrier || supplied.has(army.cell) || forages(state, army.id)) continue;
      starving.add(army.id);
      let lost = false;
      for (const formation of army.formations) {
        const floor = Math.ceil((units.get(formation.unitId)?.strength ?? 1) * SUPPLY_FLOOR);
        const next = Math.max(floor, formation.strength - SUPPLY_ATTRITION);
        if (next < formation.strength) { formation.strength = next; lost = true; }
      }
      if (lost) worn++;
    }
    if (worn) emitted.push({ turn: state.turn, factionId: faction.id, type: 'supply_attrition',
      message: modern ? `${worn} force${worn === 1 ? ' is' : 's are'} out of supply and wasting away. Return fleets to harbour supply; bring land forces within reach of a hearth, depot or road.`
        : `${worn} compan${worn === 1 ? 'y is' : 'ies are'} out of supply and wasting away. Bring them within reach of a hearth, take one, or build a road.` });
  }
  return starving;
}
