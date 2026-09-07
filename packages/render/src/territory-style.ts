import { PROCEDURAL_IMPROVEMENT_GLYPHS } from './improvement-glyphs';

/** Presentation only: these helpers never see canonical hidden territory. */
export interface ObservedOwner { cell: number; settlementId?: string | null; factionId?: string | null }
export interface TerritoryEdge { kind: 'realm' | 'settlement'; factionId: string; angle: number }
const adjacent = (cell: number, width: number) => {
  const row = Math.floor(cell / width), col = cell % width, odd = row & 1;
  return [[col + 1, row], [col + odd, row + 1], [col - 1 + odd, row + 1], [col - 1, row], [col - 1 + odd, row - 1], [col + odd, row - 1]] as const;
};

export function territoryEdges(cell: ObservedOwner, width: number, height: number, lookup: (id: number) => ObservedOwner | undefined, mode: 'all' | 'realm' = 'all'): TerritoryEdge[] {
  if (!cell.settlementId || !cell.factionId) return [];
  const edges: TerritoryEdge[] = [];
  adjacent(cell.cell, width).forEach(([x, y], side) => {
    const id = y * width + x, next = x >= 0 && y >= 0 && x < width && y < height ? lookup(id) : undefined;
    if (next?.settlementId === cell.settlementId) return;
    if (mode === 'realm' && next?.settlementId && next.factionId === cell.factionId) return;
    // One line for a shared observed edge. Unknown neighbors never disclose an owner.
    if (next?.settlementId && id < cell.cell) return;
    edges.push({ kind: next?.factionId === cell.factionId ? 'settlement' : 'realm', factionId: cell.factionId!, angle: side * Math.PI / 3 });
  });
  return edges;
}

/** Six local lookups only: outlines the set, not each interior reachable hex. */
export function hexPerimeterAngles(cell: number, width: number, height: number, contains: (id: number) => boolean): number[] {
  const edges: number[] = [];
  adjacent(cell, width).forEach(([x, y], side) => {
    if (x < 0 || y < 0 || x >= width || y >= height || !contains(y * width + x)) edges.push(side * Math.PI / 3);
  });
  return edges;
}

/** Ownership changes can invalidate an edge stored by an adjacent chunk. */
export function dirtyTerritoryChunks(cell: number, width: number, height: number, chunkSize = 16): string[] {
  const key = (x: number, y: number) => `${Math.floor(x / chunkSize)},${Math.floor(y / chunkSize)}`;
  const chunks = new Set([key(cell % width, Math.floor(cell / width))]);
  for (const [x, y] of adjacent(cell, width)) if (x >= 0 && y >= 0 && x < width && y < height) chunks.add(key(x, y));
  return [...chunks].sort();
}

export const IMPROVEMENT_GLYPHS: Readonly<Record<string, string>> = {
  'improvement.terraced_fields': 'fields', 'improvement.managed_woodlot': 'woodlot',
  'improvement.quarry': 'quarry', 'improvement.reedworks': 'reeds', 'improvement.shore_fishery': 'fishery',
  ...PROCEDURAL_IMPROVEMENT_GLYPHS,
};
export function settlementArtRole(population: number): string {
  return population >= 8 ? 'settlement.city' : population >= 3 ? 'settlement.town' : 'settlement.village';
}
