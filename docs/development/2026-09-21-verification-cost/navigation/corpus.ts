import { hexDistance } from '../../../../packages/mapgen/src/index';
import { createGame, getObservation, type Observation } from '../../../../packages/sim/src/index';
import type { createNavigation } from '../../../../packages/ai/src/navigation';
import { navalCampaign } from '../../../../packages/test-fixtures/src/naval-fixture';

type Mode = 'ordinary' | 'strategic' | 'utility' | 'both' | 'tie-pure' | 'tie-sideeffect' | 'score-nan' | 'score-inf' | 'score-overflow' | 'utility-nan';
export interface NavigationCase { name: string; view: Observation; mode: Mode; attempts: number; sight?: number; identity?: string }
export function navigationCorpus(): NavigationCase[] {
  const cases: NavigationCase[] = [];
  for (const seed of [74, 99, 748291]) {
    const state = createGame({ seed, size: 'tiny', factionCount: 4 });
    cases.push({ name: `generated-${seed}`, view: getObservation(state, state.turnOwnerId), mode: 'ordinary', attempts: 6 });
  }
  const sea = navalCampaign();
  cases.push({ name: 'naval-strategic', view: getObservation(sea, sea.turnOwnerId), mode: 'strategic', attempts: 8 });
  const source = cases[0]!.view, scout = source.armies.find(army => army.factionId === source.factionId && army.unitId === 'unit.scout')!;
  const width = 64, height = 64, origin = 32 * width + 24;
  const chart = (known: (cell: number) => boolean, visible = known): Observation => ({ ...structuredClone(source), width, height, routes: [], sieges: [], wars: [], settlements: [],
    armies: [{ ...structuredClone(scout), cell: origin, movement: 5 }],
    cells: Array.from({ length: width * height }, (_, cell) => cell).filter(known).map(cell => ({ cell, terrain: 1, biome: 1, waterDepth: 0, fertility: 60, visible: visible(cell) })),
  });
  const frontier = chart(cell => hexDistance(cell, origin, width) <= 6);
  for (const mode of ['ordinary', 'strategic', 'utility', 'both', 'tie-pure', 'tie-sideeffect', 'score-nan', 'score-inf', 'score-overflow', 'utility-nan'] as const) {
    cases.push({ name: `frontier-${mode}`, view: structuredClone(frontier), mode, attempts: 5 });
  }
  cases.push({ name: 'custom-identity', view: structuredClone(frontier), mode: 'ordinary', attempts: 5, identity: 'faction.local:scout:observed-position' });
  cases.push({ name: 'secondary-frontier', view: chart(cell => hexDistance(cell, origin, width) <= 12, cell => hexDistance(cell, origin, width) <= 3), mode: 'ordinary', sight: 0, attempts: 5 });
  cases.push({ name: 'all-frontier-budgets', view: chart(() => true, cell => hexDistance(cell, origin, width) <= 3), mode: 'ordinary', sight: 0, attempts: 10 });
  const large = chart(() => true); large.armies[0]!.movement = 30;
  cases.push({ name: 'large-weighted-objective', view: large, mode: 'strategic', attempts: 2 });
  return cases;
}

/** Complete deterministic destination sequence, reservations, counters and callback order. */
export function runNavigation(factory: typeof createNavigation, item: NavigationCase, traceCallbacks = true) {
  const navigation = factory(item.view), claimed = new Set<number>();
  const armies = item.view.armies.filter(army => army.factionId === item.view.factionId);
  const trace: string[] = [], results: { destination: number | null; expandedNodes: number; gain: number | null }[] = [];
  let calls = 0;
  const record = (kind: string, cell: number) => { calls++; if (traceCallbacks) trace.push(`${kind}:${cell}`); return calls; };
  for (let attempt = 0; attempt < item.attempts; attempt++) {
    const army = armies[attempt % armies.length]!;
    const strategic = ['strategic', 'both', 'score-nan', 'score-inf', 'score-overflow'].includes(item.mode) ? (cell: number) => {
      const order = record('strategic', cell);
      if (item.mode === 'score-nan') return cell % 3 === 0 ? NaN : cell % 5;
      if (item.mode === 'score-inf') return cell % 3 === 0 ? Infinity : -Infinity;
      if (item.mode === 'score-overflow') return Number.MAX_VALUE;
      return (cell % 17) * 3 + order % 3;
    } : undefined;
    const utility = item.mode !== 'ordinary' && item.mode !== 'strategic' ? (cell: number, gain: number) => {
      const order = record('utility', cell);
      if (item.mode === 'score-overflow') return Number.MAX_VALUE;
      if (item.mode === 'utility-nan') return cell % 3 === 0 ? NaN : gain;
      if (item.mode.startsWith('tie-')) return 0;
      return gain * 100 + order % 5;
    } : undefined;
    const tieBreak = item.mode.startsWith('tie-') ? (cell: number) => {
      const order = record('tie', cell);
      return item.mode === 'tie-sideeffect' ? order % 7 : cell % 7;
    } : undefined;
    const destination = navigation.destination(army, item.sight ?? army.sight, claimed, strategic, tieBreak, utility, item.identity ?? army.id);
    results.push({ destination: destination ?? null, expandedNodes: navigation.expandedNodes, gain: destination === undefined ? null : navigation.informationGain(destination, item.sight ?? army.sight) });
    if (destination !== undefined) claimed.add(destination);
    if (attempt % 3 === 2) claimed.clear();
  }
  return { results, calls, trace };
}
