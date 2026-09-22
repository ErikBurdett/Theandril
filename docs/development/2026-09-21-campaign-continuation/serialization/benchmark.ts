import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { sortedExploredCells } from '../../../../packages/sim/src/canonical-cells';

// Exact helper from the starting working tree, before this prompt's extraction.
function original(cells: Iterable<number>): number[] {
  const copied = [...cells];
  for (let index = 1; index < copied.length; index++) {
    const previous = copied[index - 1], next = copied[index];
    if (typeof previous !== 'number' || typeof next !== 'number' || !(previous <= next)) return copied.sort((a, b) => a - b);
  }
  return copied;
}
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const results: object[] = [];
for (const count of [32, 256, 1536, 10_000, 100_000, 307_200]) for (const order of ['shuffled', 'sorted'] as const) {
  const values = Array.from({ length: count }, (_, index) => index);
  if (order === 'shuffled') {
    let random = 20260921;
    for (let index = count - 1; index > 0; index--) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      const other = random % (index + 1);
      [values[index], values[other]] = [values[other]!, values[index]!];
    }
  }
  const cells = new Set(values);
  const expected = original(cells);
  assert.deepEqual(sortedExploredCells(cells), expected);
  const samples: [number[], number[]] = [[], []];
  for (let sample = -5; sample < 30; sample++) for (const position of sample % 2 ? [1, 0] : [0, 1]) {
    const start = performance.now();
    const actual = (position ? sortedExploredCells : original)(cells);
    const elapsed = performance.now() - start;
    assert.deepEqual(actual, expected);
    if (sample >= 0) samples[position]!.push(elapsed);
  }
  results.push({ count, order, beforeMedianMs: median(samples[0]), afterMedianMs: median(samples[1]), resultSha256: createHash('sha256').update(JSON.stringify(expected)).digest('hex') });
}
console.log(JSON.stringify({ node: process.version, date: '2026-09-21', fixture: 'Synthetic cell sets; exact-output checks excluded from paired timing; five warmups and thirty alternating samples', results }, null, 2));
