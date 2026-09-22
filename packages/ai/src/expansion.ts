import { hexDistance } from '@theandril/mapgen';
import type { Observation } from '@theandril/sim';
import { observedCells } from './observation-index';

const geography = new WeakMap<Observation, { cells: ReadonlyMap<number, Observation['cells'][number]>; towns: Observation['settlements']; claims: ReadonlyMap<string, number> }>();
function facts(view: Observation) {
  let result = geography.get(view);
  if (!result) {
    result = { cells: observedCells(view), towns: view.settlements.filter(town => town.factionId === view.factionId), claims: new Map(view.land.settlements.map(land => [land.settlementId, land.claimed.length])) };
    geography.set(view, result);
  }
  return result;
}

/** Site preference depends on observed local productivity and a neighboring
 * hearth's developed footprint. Three hexes remains the universal legal minimum. */
export function settlementSpacing(view: Observation, cell: number): number {
  if (!view.growth) return 4;
  const context = facts(view), own = context.towns;
  let nearest: typeof own[number] | undefined, distance = Infinity;
  for (const town of own) {
    const separation = hexDistance(cell, town.cell, view.width);
    if (separation < distance) { nearest = town; distance = separation; }
  }
  const claims = nearest ? context.claims.get(nearest.id) ?? 7 : 7;
  const fertility = context.cells.get(cell)?.fertility ?? 50;
  // Settle a hex further apart than the legal minimum: civic borders fill the
  // gaps, so a realm paints connected territory instead of a tight cluster.
  return Math.max(4, 3 + Math.ceil(Math.sqrt(Math.max(claims / 3, nearest?.population ?? 1))) + Number(fertility < 40) - Number(fertility >= 75));
}
export function settlementSiteValue(view: Observation, cell: number): number {
  const desired = settlementSpacing(view, cell);
  const context = facts(view);
  let distance = Infinity;
  for (const town of context.towns) distance = Math.min(distance, hexDistance(cell, town.cell, view.width));
  const candidate = context.cells.get(cell);
  return Math.min(desired, distance) * 180 - Math.max(0, distance - desired) * 25 + (candidate?.fertility ?? 0) * 2 - (candidate?.settlementId ? 2000 : 0);
}
