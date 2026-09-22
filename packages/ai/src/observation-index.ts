import type { Observation } from '@theandril/sim';

type ObservedCell = Observation['cells'][number];
const indexes = new WeakMap<readonly ObservedCell[], { length: number; cells: ReadonlyMap<number, ObservedCell> }>();

/** One cell lookup per observation, shared by every planner that reads it.
 * Planners never modify observations; a changed array length still rebuilds. */
export function observedCells(view: Pick<Observation, 'cells'>): ReadonlyMap<number, ObservedCell> {
  const cached = indexes.get(view.cells);
  if (cached && cached.length === view.cells.length) return cached.cells;
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  indexes.set(view.cells, { length: view.cells.length, cells });
  return cells;
}
