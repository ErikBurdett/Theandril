import { directionNeighbor, hydrologyDownstream, isLake, riverSize } from '@theandril/mapgen';

export interface GeographicCell { cell: number; visible: boolean; terrain?: number; hydrology?: number; roadMask?: number }
export interface GeographicConnection { neighbor: number; size: number; alpha: number }
type Point = readonly [number, number];
export interface RiverHalfCurve { start: Point; control1: Point; control2: Point; end: Point }

/** Stable sub-hex meander only. Shared cell anchors keep confluences joined;
 * exact edge midpoints and normal tangents join independently cached halves.
 * Controls stay inside the cell; this never chooses a different drainage route.
 */
export function riverHalfCurve(cell: number, neighbor: number, center: (cell: number) => Point): RiverHalfCurve {
  const [x, y] = center(cell), [nx, ny] = center(neighbor), dx = nx - x, dy = ny - y;
  const hash = Math.imul(cell + 1, 0x45d9f3b) >>> 0;
  const start: Point = [x + ((hash & 7) - 3.5) * .6, y + (((hash >>> 3) & 7) - 3.5) * .6];
  const end: Point = [(x + nx) / 2, (y + ny) / 2];
  const bend = ((hash >>> 6) & 1 ? 1 : -1) * .055;
  return {
    start, end,
    control1: [start[0] + (end[0] - start[0]) * .38 - dy * bend, start[1] + (end[1] - start[1]) * .38 + dx * bend],
    control2: [end[0] - dx * .14, end[1] - dy * .14],
  };
}

/** Only observed land creates a shoreline; no outline between lake tiles or
 * across a fog boundary whose neighboring terrain has not been revealed.
 */
export function lakeShoreAngles(cell: GeographicCell, width: number, height: number, lookup: (cell: number) => GeographicCell | undefined): number[] {
  if (!isLake(cell.hydrology ?? 0)) return [];
  const angles: number[] = [];
  for (let direction = 1; direction <= 6; direction++) {
    const id = directionNeighbor(cell.cell, width, height, direction), next = id === null ? undefined : lookup(id);
    if (next?.terrain !== undefined && next.terrain !== 0) angles.push((direction - 1) * Math.PI / 3);
  }
  return angles;
}

/** Six local lookups, with both endpoints coming from the supplied map view.
 * Each tile draws its center-to-edge half, including across cached chunks.
 * Lake drainage pointers are not rivers and never produce decorative lines.
 */
export function geographicConnections(cell: GeographicCell, width: number, height: number, lookup: (cell: number) => GeographicCell | undefined): { rivers: GeographicConnection[]; roads: GeographicConnection[] } {
  const rivers: GeographicConnection[] = [], roads: GeographicConnection[] = [];
  const downstream = hydrologyDownstream(cell.cell, width, height, cell.hydrology ?? 0);
  for (let direction = 1; direction <= 6; direction++) {
    const id = directionNeighbor(cell.cell, width, height, direction);
    const next = id === null ? undefined : lookup(id);
    if (!next) continue;
    const alpha = cell.visible && next.visible ? 1 : .4;
    const size = downstream === next.cell ? riverSize(cell.hydrology ?? 0)
      : hydrologyDownstream(next.cell, width, height, next.hydrology ?? 0) === cell.cell ? riverSize(next.hydrology ?? 0) : 0;
    if (size) rivers.push({ neighbor: next.cell, size, alpha });
    const bit = direction - 1, opposite = (bit + 3) % 6;
    if ((cell.roadMask ?? 0) & (1 << bit) && (next.roadMask ?? 0) & (1 << opposite)) roads.push({ neighbor: next.cell, size: 1, alpha });
  }
  return { rivers, roads };
}
