import { UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import type { DomainEvent, GameState } from './types';
import { DEPOT_BUDGET, depotsOf } from './depots';
import { hasRoadEdge } from './roads';
import { indexes } from './visibility';
import { atWar } from './warfare';
import { rulesVersion } from './rules';

/** Rules 27: a realm feeds its armies from its hearths, and from rules 28 also
 * from the depots it builds. Supply spreads outward
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

export interface ArmySupply { armyId: string; supplied: boolean; sourceSettlementId: string | null; reason: string }

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

/** Every hex a realm can feed, and the hearth that feeds it. Bounded by the
 * realm's own hearths and the supply budget, never by the size of the map. */
export function suppliedCells(state: GameState, factionId: string): Map<number, string> {
  const reached = new Map<number, string>();
  if (rulesVersion(state) < 27) return reached;
  const { width, height } = state.world;
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
  // A bucketed search: costs are one or two, so the frontier needs no heap.
  const buckets: number[][] = Array.from({ length: SUPPLY_BUDGET + 1 }, () => []);
  const spent = new Map<number, number>();
  for (const town of Object.values(state.settlements).sort((a, b) => a.id < b.id ? -1 : 1)) {
    if (town.factionId !== factionId || state.sieges[town.id]) continue;
    if (!spent.has(town.cell)) { spent.set(town.cell, 0); reached.set(town.cell, town.id); buckets[0]!.push(town.cell); }
  }
  // A depot is seeded with only its own shorter budget left to spend.
  for (const depot of depotsOf(state, factionId)) {
    const start = SUPPLY_BUDGET - DEPOT_BUDGET;
    if ((spent.get(depot.cell) ?? Infinity) <= start) continue;
    spent.set(depot.cell, start); reached.set(depot.cell, `depot.${depot.cell}`); buckets[start]!.push(depot.cell);
  }
  for (let cost = 0; cost <= SUPPLY_BUDGET; cost++) {
    for (const cell of buckets[cost]!.sort((a, b) => a - b)) {
      if ((spent.get(cell) ?? Infinity) < cost) continue;
      const source = reached.get(cell)!;
      for (const next of neighbors(cell, width, height).sort((a, b) => a - b)) {
        if (!isPassable(state.world.terrain[next] ?? 0) || blocked(next)) continue;
        const step = hasRoadEdge(cell, next, width, state.roads.edges[cell] ?? 0) ? SUPPLY_ROAD_COST : SUPPLY_OPEN_COST;
        const total = cost + step;
        if (total > SUPPLY_BUDGET || total >= (spent.get(next) ?? Infinity)) continue;
        spent.set(next, total); reached.set(next, source); buckets[total]!.push(next);
      }
    }
  }
  return reached;
}

/** Why one army eats or does not, in the order a player meets the question. */
export function armySupply(state: GameState, armyId: string, supplied = suppliedCells(state, state.armies[armyId]?.factionId ?? '')): ArmySupply {
  const army = state.armies[armyId];
  if (!army) return { armyId, supplied: true, sourceSettlementId: null, reason: '' };
  if (rulesVersion(state) < 27) return { armyId, supplied: true, sourceSettlementId: null, reason: 'Supply lines are not kept under these rules.' };
  if (isNaval(state, armyId)) return { armyId, supplied: true, sourceSettlementId: null, reason: 'A fleet carries its own stores.' };
  if (state.transports[armyId]) return { armyId, supplied: true, sourceSettlementId: null, reason: 'The army is aboard a fleet and draws on its stores.' };
  const source = supplied.get(army.cell);
  if (source) return { armyId, supplied: true, sourceSettlementId: source.startsWith('depot.') ? null : source,
    reason: source.startsWith('depot.') ? `Supplied from the depot at hex ${source.slice(6)}.` : `Supplied from ${state.settlements[source]?.name ?? source}.` };
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
  for (const faction of state.factions) {
    if (landless(state, faction.id)) continue;
    const supplied = suppliedCells(state, faction.id);
    let worn = 0;
    for (const army of Object.values(state.armies).filter(item => item.factionId === faction.id).sort((a, b) => a.id < b.id ? -1 : 1)) {
      if (isNaval(state, army.id) || state.transports[army.id] || supplied.has(army.cell) || forages(state, army.id)) continue;
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
      message: `${worn} compan${worn === 1 ? 'y is' : 'ies are'} out of supply and wasting away. Bring them within reach of a hearth, take one, or build a road.` });
  }
  return starving;
}
