import { hexDistance, neighbors } from '@theandril/mapgen';
import type { MapObservation } from '@theandril/sim';

export type HearthDistrictKind = 'hearth' | 'housing' | 'granary' | 'workshop' | 'market' | 'archive' | 'harbor' | 'construction' | 'cultivation' | 'worked';
export interface HearthDistrict {
  cell: number; settlementId: string; kind: HearthDistrictKind; density: number;
  buildingId?: string; progress?: number; worked?: boolean; links: number[];
}
const BUILDING_DISTRICTS: Readonly<Record<string, HearthDistrictKind>> = {
  'building.granary': 'granary', 'building.workshop': 'workshop', 'building.market': 'market',
  'building.archive': 'archive', 'building.harbor': 'harbor',
};
type Cell = MapObservation['cells'][number];

/** Derived from the already observed town and its indexed claims, never from
 * hidden canonical state. Claims are indexed per town; called on publications,
 * not frames. Districts are cosmetic occupation, not new buildings or roads.
 */
export function hearthAppearance(
  observation: Pick<MapObservation, 'width' | 'height' | 'settlements' | 'land'>,
  claims: ReadonlyMap<string, ReadonlySet<number>>,
  cellAt: (cell: number) => Cell | undefined,
): Map<number, HearthDistrict> {
  const result = new Map<number, HearthDistrict>();
  const landByTown = new Map(observation.land.settlements?.map(land => [land.settlementId, land]));
  const centers = new Set(observation.settlements.map(town => town.cell));
  for (const town of observation.settlements) {
    const core = cellAt(town.cell);
    // A last-seen claim is not permission to reveal current district growth.
    if (!core?.visible || core.settlementId !== town.id) continue;
    const density = town.population >= 8 ? 3 : town.population >= 4 ? 2 : 1;
    const land = landByTown.get(town.id);
    const worked = new Set(land?.worked ?? []);
    result.set(town.cell, { cell: town.cell, settlementId: town.id, kind: 'hearth', density, links: [] });
    const known = [...(claims.get(town.id) ?? [])].filter(cell => {
      const tile = cellAt(cell);
      return tile?.visible && tile.settlementId === town.id && !centers.has(cell);
    }).sort((a, b) => hexDistance(town.cell, a, observation.width) - hexDistance(town.cell, b, observation.width) || a - b);
    const available = known.filter(cell => { const tile = cellAt(cell)!; return tile.terrain !== 0 && tile.terrain !== 4 && !tile.improvementId && !tile.resourceId && land?.work?.cell !== cell; })
      .sort((a, b) => Number(worked.has(a)) - Number(worked.has(b)));
    let allocated = 0;
    const place = (kind: HearthDistrictKind, buildingId?: string) => {
      const cell = available[allocated++];
      if (cell !== undefined) result.set(cell, { cell, settlementId: town.id, kind, density, buildingId, ...(worked.has(cell) ? { worked: true } : {}), links: [] });
    };
    // Reserve shoreline infrastructure before other civic districts consume it.
    const buildingIds = [...town.buildings ?? []].sort((a, b) => Number(b === 'building.harbor') - Number(a === 'building.harbor') || (a < b ? -1 : a > b ? 1 : 0));
    for (const buildingId of buildingIds) {
      const kind = BUILDING_DISTRICTS[buildingId];
      if (!kind) continue;
      if (kind === 'harbor') {
        const coast = available.findIndex((cell, index) => index >= allocated && neighbors(cell, observation.width, observation.height).some(adjacent => cellAt(adjacent)?.terrain === 0));
        if (coast < 0) continue;
        if (coast > allocated) [available[allocated], available[coast]] = [available[coast]!, available[allocated]!];
      }
      place(kind, buildingId);
    }
    const firstOrder = town.queue?.[0];
    const nextBuilding = firstOrder && BUILDING_DISTRICTS[firstOrder.itemId] ? firstOrder : undefined;
    if (nextBuilding) place('construction', nextBuilding.itemId);
    const houses = Math.min(available.length - allocated, Math.max(0, town.population - 2));
    for (let index = 0; index < houses; index++) place('housing');
    const knownSet = new Set(known);
    for (const cell of worked) if (knownSet.has(cell) && !cellAt(cell)?.improvementId && !result.has(cell)) result.set(cell, { cell, settlementId: town.id, kind: 'worked', density, links: [] });
    if (land?.work && knownSet.has(land.work.cell)) {
      const work = land.work;
      result.set(work.cell, { cell: work.cell, settlementId: town.id, kind: work.kind === 'terraform' ? 'cultivation' : 'construction', density,
        buildingId: work.kind === 'improve' ? work.improvementId : undefined, progress: (work.turns - work.remainingTurns) / work.turns, links: [] });
    }
  }
  const townCenters = new Map(observation.settlements.map(town => [town.id, town.cell]));
  for (const district of result.values()) {
    if (district.kind === 'worked' || district.kind === 'cultivation') continue;
    const center = townCenters.get(district.settlementId)!;
    const distance = hexDistance(center, district.cell, observation.width);
    const candidates = neighbors(district.cell, observation.width, observation.height).filter(cell => {
      const other = result.get(cell);
      const adjacentDistance = hexDistance(center, cell, observation.width);
      return other?.settlementId === district.settlementId && other.kind !== 'worked' && other.kind !== 'cultivation'
        && (adjacentDistance < distance || adjacentDistance === distance && cell < district.cell);
    }).sort((a, b) => hexDistance(center, a, observation.width) - hexDistance(center, b, observation.width) || a - b);
    // One approach lane per block keeps a town's street hierarchy legible.
    const parent = candidates[0];
    if (parent !== undefined) { district.links.push(parent); result.get(parent)!.links.push(district.cell); }
  }
  return result;
}

/** Dirty only districts whose derived appearance actually changed. */
export function changedHearthCells(previous: ReadonlyMap<number, HearthDistrict>, next: ReadonlyMap<number, HearthDistrict>): number[] {
  const changed: number[] = [];
  for (const cell of new Set([...previous.keys(), ...next.keys()])) if (JSON.stringify(previous.get(cell)) !== JSON.stringify(next.get(cell))) changed.push(cell);
  return changed;
}
