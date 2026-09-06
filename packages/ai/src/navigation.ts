import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { getMovementQuery, type Observation } from '@theandril/sim';

type ObservedArmy = Observation['armies'][number];
export const MAX_FRONTIER_NODES = 8192;
const MAX_ARMY_FRONTIER_NODES = 1024;
const costOf = (terrain: number): number => terrain === 2 || terrain === 3 ? 2 : 1;

/** Shared per-plan knowledge and work budget. Never reads a canonical world or hidden occupants. */
export function createNavigation(view: Observation) {
  const cells = new Map(view.cells.map(cell => [cell.cell, cell]));
  const occupied = new Set([...view.armies, ...view.settlements].filter(entity => entity.factionId !== view.factionId).map(entity => entity.cell));
  // A batch can reveal previously remembered enemies between proposals. Prove each immediate
  // journey through currently visible ground, so those revelations cannot invalidate its cost.
  const travelView = { ...view, cells: view.cells.filter(cell => cell.visible) };
  const gains = new Map<string, number>();
  let expandedNodes = 0;
  const canEnter = (cell: number): boolean => {
    const known = cells.get(cell);
    return Boolean(known && isPassable(known.terrain) && !occupied.has(cell));
  };
  const informationGain = (cell: number, sight: number): number => {
    const key = cell + ':' + sight;
    const cached = gains.get(key); if (cached !== undefined) return cached;
    const row = Math.floor(cell / view.width); const column = cell % view.width;
    let gain = 0;
    for (let y = Math.max(0, row - sight); y <= Math.min(view.height - 1, row + sight); y++) {
      for (let x = Math.max(0, column - sight); x <= Math.min(view.width - 1, column + sight); x++) {
        const next = y * view.width + x;
        if (!cells.has(next) && hexDistance(cell, next, view.width) <= sight) gain++;
      }
    }
    gains.set(key, gain); return gain;
  };
  const frontierStep = (army: ObservedArmy, claimed: Set<number>): number | undefined => {
    // Integer edge costs permit deterministic cost buckets without an unbounded sorted frontier.
    const costs = new Map([[army.cell, 0]]); const parents = new Map<number, number>();
    const buckets: number[][] = [[army.cell]];
    let localNodes = 0;
    for (let distance = 0; distance < buckets.length; distance++) for (const cell of buckets[distance] ?? []) {
      if (costs.get(cell) !== distance) continue;
      if (expandedNodes >= MAX_FRONTIER_NODES || localNodes >= MAX_ARMY_FRONTIER_NODES) return undefined;
      expandedNodes++; localNodes++;
      if (cell !== army.cell && neighbors(cell, view.width, view.height).some(next => !cells.has(next))) {
        const path: number[] = []; let cursor = cell;
        while (cursor !== army.cell) { path.push(cursor); cursor = parents.get(cursor)!; }
        path.reverse();
        return path.filter(next => (costs.get(next) ?? Infinity) <= army.movement && !claimed.has(next)).at(-1);
      }
      for (const next of neighbors(cell, view.width, view.height)) {
        if (!canEnter(next)) continue;
        const cost = distance + costOf(cells.get(next)!.terrain);
        if (cost >= (costs.get(next) ?? Infinity)) continue;
        costs.set(next, cost); parents.set(next, cell); (buckets[cost] ??= []).push(next);
      }
    }
    return undefined;
  };
  return {
    get expandedNodes() { return expandedNodes; },
    informationGain,
    destination(army: ObservedArmy, sight: number, claimed: Set<number>, strategicScore?: (cell: number) => number): number | undefined {
      const range = getMovementQuery(travelView, army.id).reachable.filter(item => canEnter(item.cell) && !claimed.has(item.cell));
      const candidates = range.map(item => ({ ...item, gain: informationGain(item.cell, sight), strategic: strategicScore?.(item.cell) ?? 0 }));
      // Stable per-army tie breaking spreads scouts without changing their objective each turn.
      let salt = 0; for (let i = 0; i < army.id.length; i++) salt = Math.imul(salt, 31) + army.id.charCodeAt(i) | 0;
      const tie = (cell: number): number => (Math.imul(cell + 1, 1103515245) ^ salt) >>> 0;
      candidates.sort((a, b) => (b.strategic + b.gain * 100) - (a.strategic + a.gain * 100) || b.cost - a.cost || tie(a.cell) - tie(b.cell) || a.cell - b.cell);
      const best = candidates[0];
      if (!best) return undefined;
      if (strategicScore || best.gain > 0) return best.cell;
      const step = frontierStep(army, claimed);
      if (range.some(item => item.cell === step)) return step;
      // The long frontier path may extend outside current sight; approach it by a proved step.
      if (step !== undefined) return candidates.sort((a, b) => hexDistance(a.cell, step, view.width) - hexDistance(b.cell, step, view.width) || a.cost - b.cost || a.cell - b.cell)[0]?.cell;
      return undefined;
    },
  };
}
