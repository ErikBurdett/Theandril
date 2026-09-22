import { getMovementQuery, type getMovementPreview, type Observation } from '../../../../packages/sim/src/index';

export const probes: { turn: number; factionId: string; observedCells: number; fleets: number; passengers: number; groups: { armyId: string; calls: number; targets: number[]; rangeNodes: number; previewNodes: number }[] }[] = [];
/** Tool-only accounting. The extra full range read is outside benchmark timing. */
export function previewProbe(view: Observation, query: typeof getMovementPreview): typeof getMovementPreview {
  const groups = new Map<string, typeof probes[number]['groups'][number]>();
  const plan = { turn: view.turn, factionId: view.factionId, observedCells: view.cells.length,
    fleets: view.armies.filter(army => army.factionId === view.factionId && army.domain === 'naval').length,
    passengers: view.armies.filter(army => army.factionId === view.factionId && army.carrierId).length, groups: [] as typeof probes[number]['groups'] };
  probes.push(plan);
  return (input, armyId, target, options) => {
    let group = groups.get(armyId);
    if (!group) {
      group = { armyId, calls: 0, targets: [], rangeNodes: getMovementQuery(input, armyId).expandedNodes, previewNodes: 0 };
      groups.set(armyId, group); plan.groups.push(group);
    }
    const result = query(input, armyId, target, options);
    group.calls++; group.targets.push(target); group.previewNodes += result.expandedNodes;
    return result;
  };
}
