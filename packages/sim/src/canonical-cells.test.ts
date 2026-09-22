import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { checksum } from '@theandril/content';
import { sortedExploredCells } from './canonical-cells';
import { createGame, serializeGame, stateHash } from './index';

/** Pre-change helper retained independently of the optimized implementation. */
function original(cells: Iterable<number>): number[] {
  const copied = [...cells];
  for (let index = 1; index < copied.length; index++) {
    const previous = copied[index - 1], next = copied[index];
    if (typeof previous !== 'number' || typeof next !== 'number' || !(previous <= next)) return copied.sort((a, b) => a - b);
  }
  return copied;
}

describe('canonical explored-cell ordering', () => {
  it('matches the original sort for unsigned cell sequences and preserves every duplicate', () => {
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 0xffff_ffff }), { minLength: 256, maxLength: 4000 }), cells => {
      expect(sortedExploredCells(cells)).toEqual(original(cells));
      expect(sortedExploredCells([...cells].reverse())).toEqual(original([...cells].reverse()));
    }), { seed: 20260921, numRuns: 100 });
  });

  it('retains floating, signed, nonfinite and coercible values on the original path', () => {
    for (const unusual of [-0, -1, 1.5, Infinity, -Infinity, NaN, 0x1_0000_0000, '9', undefined, null]) {
      const cells = [300, ...Array.from({ length: 300 }, (_, index) => index), unusual] as number[];
      expect(sortedExploredCells(cells)).toEqual(original(cells));
    }
    const coercions = (sort: typeof original) => {
      const seen: number[] = [];
      const cells = [{ valueOf() { seen.push(3); return 3; } }, 1, 2] as number[];
      const result = sort(cells);
      return { result: result.map(Number), seen };
    };
    expect(coercions(sortedExploredCells)).toEqual(coercions(original));
    const invalid = [300, ...Array.from({ length: 300 }, (_, index) => index), Symbol('invalid')] as number[];
    expect(() => original(invalid)).toThrow(TypeError);
    expect(() => sortedExploredCells(invalid)).toThrow(TypeError);
  });

  it('iterates once, leaves its input untouched and never reuses a previous mutable result', () => {
    const source = Object.freeze(Array.from({ length: 4096 }, (_, index) => 4095 - index));
    let traversals = 0;
    const input = { *[Symbol.iterator]() { traversals++; yield* source; } };
    const result = sortedExploredCells(input);
    expect(traversals).toBe(1);
    expect(result).toEqual(original(source));
    result[0] = 9999;
    expect(sortedExploredCells(input)[0]).toBe(0);
    expect(source[0]).toBe(4095);
  });

  it('keeps complete save bytes and hashes exact after exploring and replacing cells at the same size', () => {
    const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 2 });
    const cells = new Set(Array.from({ length: 800 }, (_, index) => 800 - index));
    game.explored[game.turnOwnerId] = cells;
    const check = () => {
      const saved = serializeGame(game);
      const envelope = JSON.parse(saved) as { state: { explored: { factionId: string; cells: number[] }[] }; stateChecksum: string };
      envelope.state.explored.find(item => item.factionId === game.turnOwnerId)!.cells = original(cells);
      envelope.stateChecksum = checksum(JSON.stringify(envelope.state));
      expect(saved).toBe(JSON.stringify(envelope));
      expect(stateHash(game)).toBe(checksum(saved));
    };
    check(); cells.delete(800); cells.add(0); check();
    cells.clear(); cells.add(42); check();
  });
});
