import { describe, expect, it } from 'vitest';
import { createGame, deserializeGame, serializeGame, type GameState } from './index';

const original = (cells: Iterable<number>): number[] => [...cells].sort((a, b) => a - b);
function exploredJson(game: GameState): string {
  const data = JSON.parse(serializeGame(game)) as { state: { explored: { factionId: string; cells: unknown[] }[] } };
  return JSON.stringify(data.state.explored.find(entry => entry.factionId === game.turnOwnerId)!.cells);
}
function outcome(run: () => string): { result: string } | { error: string; message: string } {
  try { return { result: run() }; } catch (error) {
    if (!(error instanceof Error)) throw error;
    return { error: error.constructor.name, message: error.message };
  }
}

describe('exact explored-cell copy and monotonic fast path', () => {
  it('matches the independent original sort for empty, singleton, ordered, reversed and late-inversion sequences', () => {
    const sorted = Array.from({ length: 4096 }, (_, index) => index * 2);
    const cases = [[], [0], [5], [1, 2, 3], [3, 2, 1], sorted, [...sorted].reverse(), [...sorted, 3], [4, 1, 3, 2], [-0, 0], [0, -0]];
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 1 });
    for (const values of cases) {
      const cells = new Set(values), before = [...cells];
      game.explored[game.turnOwnerId] = cells;
      expect(exploredJson(game)).toBe(JSON.stringify(original(cells)));
      expect([...cells]).toEqual(before);
    }
  });

  it('retains original malformed-value JSON/coercion/error behavior instead of repairing or converting values', () => {
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 1 });
    // The serializer historically projects these values; the strict loader
    // remains responsible for rejecting invalid explored-cell data afterward.
    const cases: unknown[][] = [
      [NaN], [1, NaN, 0], [-Infinity, 1, Infinity], [Infinity, 1, -Infinity], [1, -1, 0],
      [1, .5, 2], [1, 0x100000000, 2], [1, '2', 0], [1, null, 0], [1, undefined, 0],
      [Symbol('cell')], [Symbol('cell'), 1], [2n], [2n, 1n],
    ];
    for (const values of cases) {
      const cells = new Set(values) as Set<number>, before = [...cells];
      game.explored[game.turnOwnerId] = cells;
      expect(outcome(() => exploredJson(game))).toEqual(outcome(() => JSON.stringify(original(cells))));
      expect([...cells]).toEqual(before);
      // Every successful malformed projection still fails existing strict load
      // validation: the fast path neither certifies nor silently cleans a save.
      const serialized = outcome(() => serializeGame(game));
      if ('result' in serialized) expect(() => deserializeGame(serialized.result)).toThrow();
    }
  });

  it('copies its iterable once, even when the first descending pair triggers fallback', () => {
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 1 });
    let iterations = 0;
    const cells = { *[Symbol.iterator]() { iterations++; yield 9; yield 4; yield 8; } };
    game.explored[game.turnOwnerId] = cells as Set<number>;
    expect(exploredJson(game)).toBe('[4,8,9]'); expect(iterations).toBe(1);
  });
});
