import { neighbors, TERRAIN } from '@theandril/mapgen';
import type { Observation } from '@theandril/sim';
import { observedCells } from './observation-index';

export const MAX_WATER_KNOWLEDGE_NODES = 8192;
export type BasinStatus = 'open' | 'enclosed' | 'unknown';
export type BasinRelation = 'connected' | 'separate' | 'unknown';

/** A proof about observed geography, not the hidden canonical water components. */
export function createSeaKnowledge(view: Pick<Observation, 'cells' | 'width' | 'height'>,
  cells: ReadonlyMap<number, Observation['cells'][number]> = observedCells(view)) {
  interface Component { parent: Component | null; queue: number[]; cursor: number; unknownBoundary: boolean; edge: boolean; shallow: boolean }
  // Adaptive to charted input, never world area. Every node is expanded at most
  // once across all requests; partial connected paths remain useful at the cap.
  const nodeBudget = Math.min(MAX_WATER_KNOWLEDGE_NODES, Math.max(1024, cells.size));
  const known = new Map<number, Component>();
  let expandedNodes = 0;
  const root = (component: Component): Component => {
    let current = component;
    while (current.parent) current = current.parent;
    while (component.parent) { const next = component.parent; component.parent = current; component = next; }
    return current;
  };
  const complete = (component: Component) => component.cursor === component.queue.length && !component.unknownBoundary;
  const inspect = (origin: number, enough?: (component: Component) => boolean): Component | null => {
    if (cells.get(origin)?.terrain !== TERRAIN.water) return null;
    const previous = known.get(origin);
    const component: Component = previous ? root(previous) : { parent: null, queue: [origin], cursor: 0, unknownBoundary: false, edge: false, shallow: true };
    if (!previous) known.set(origin, component);
    while (component.cursor < component.queue.length && expandedNodes < nodeBudget && !enough?.(component)) {
      const cellId = component.queue[component.cursor++]!;
      expandedNodes++;
      const x = cellId % view.width, y = Math.floor(cellId / view.width);
      if (x === 0 || x === view.width - 1 || y === 0 || y === view.height - 1) component.edge = true;
      if (cells.get(cellId)!.waterDepth === 2) component.shallow = false;
      for (const adjacent of neighbors(cellId, view.width, view.height)) {
        const cell = cells.get(adjacent);
        if (!cell) { component.unknownBoundary = true; continue; }
        if (cell.terrain !== TERRAIN.water) continue;
        const seen = known.get(adjacent);
        if (!seen) { known.set(adjacent, component); component.queue.push(adjacent); continue; }
        const other = root(seen);
        if (other === component) continue;
        // Join only across an actually observed water edge. Previously expanded
        // nodes contribute their facts, not another traversal of their shoreline.
        other.parent = component;
        component.queue.push(...other.queue.slice(other.cursor));
        component.unknownBoundary ||= other.unknownBoundary;
        component.edge ||= other.edge;
        component.shallow &&= other.shallow;
      }
    }
    return component;
  };
  const relation = (a: number, b: number): BasinRelation => {
    if (cells.get(a)?.terrain !== TERRAIN.water || cells.get(b)?.terrain !== TERRAIN.water) return 'unknown';
    if (a === b) return 'connected';
    const resolve = (): BasinRelation => {
      const first = known.get(a), second = known.get(b);
      const left = first && root(first), right = second && root(second);
      if (left && right && left === right) return 'connected';
      return left && complete(left) || right && complete(right) ? 'separate' : 'unknown';
    };
    let result = resolve();
    if (result !== 'unknown') return result;
    const connectedTo = (cell: number) => (component: Component) => { const other = known.get(cell); return Boolean(other && root(other) === component); };
    inspect(a, connectedTo(b)); result = resolve();
    if (result !== 'unknown') return result;
    inspect(b, connectedTo(a)); return resolve();
  };
  return {
    get expandedNodes() { return expandedNodes; },
    nodeBudget,
    basinStatus(origin: number): BasinStatus { const component = inspect(origin, component => component.edge); return component?.edge ? 'open' : component && complete(component) ? 'enclosed' : 'unknown'; },
    basinRelation: relation,
    fullyCharted(origin: number): boolean { const component = inspect(origin); return Boolean(component && complete(component)); },
    enclosed(origin: number): boolean { const component = inspect(origin, component => component.edge); return Boolean(component && complete(component) && !component.edge); },
    shallowEnclosed(origin: number): boolean { const component = inspect(origin, component => component.edge || !component.shallow); return Boolean(component && complete(component) && !component.edge && component.shallow); },
    separateBasins(a: number, b: number): boolean { return relation(a, b) === 'separate'; },
  };
}
