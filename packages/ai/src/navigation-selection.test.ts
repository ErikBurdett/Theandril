import { describe, expect, it } from 'vitest';
import { createNavigation, MAX_FRONTIER_NODES } from './navigation';
import { navigationCorpus, runNavigation } from '../../../docs/development/2026-09-21-verification-cost/navigation/corpus';
import baseline from '../../../docs/development/2026-09-21-verification-cost/navigation/baseline.json';

describe('destination selection retains the original complete ordered decisions', () => {
  const cases = navigationCorpus();
  it.each(cases)('$name preserves reservations, nodes, gains and all callback evaluations', item => {
    const input = JSON.stringify(item.view);
    const expected = baseline.entries.find(entry => entry.name === item.name)!;
    const result = runNavigation(createNavigation, item);
    expect(result).toStrictEqual({ results: expected.results, calls: expected.calls, trace: expected.trace });
    expect(JSON.stringify(item.view)).toBe(input);
    expect(result.results.every(entry => entry.expandedNodes <= MAX_FRONTIER_NODES)).toBe(true);
    if (item.name === 'all-frontier-budgets') expect(result.results.map(entry => entry.expandedNodes)).toEqual([1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192, 8192, 8192]);
    if (item.name === 'secondary-frontier') expect(result.results.some(entry => entry.destination !== null && entry.expandedNodes > 0)).toBe(true);
    if (item.name === 'frontier-tie-sideeffect') expect(result.trace.some(entry => entry.startsWith('tie:'))).toBe(true);
  });

  it.each([0, false, ''])('retains the original callback error for malformed falsy input %j', value => {
    const item = cases.find(entry => entry.name === 'frontier-ordinary')!, army = item.view.armies[0]!;
    const malformed = value as unknown as (cell: number) => number;
    expect(() => createNavigation(item.view).destination(army, army.sight, new Set(), undefined, malformed, () => 0)).toThrow(TypeError);
  });
});
