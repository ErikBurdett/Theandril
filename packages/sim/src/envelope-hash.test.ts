import { afterEach, describe, expect, it, vi } from 'vitest';
import fc from 'fast-check';
import { checksum } from '@theandril/content';
import { createGame, deserializeGame, serializeGame, stateHash, stateHashForVersion, SAVE_VERSION, type GameState } from './index';

const baseline = (state: GameState) => checksum(serializeGame(state));
afterEach(() => vi.restoreAllMocks());

describe('streamed current-envelope state hash', () => {
  it('matches the original complete-envelope checksum for arbitrary UTF-16, including controls and lone surrogates', () => {
    const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 2 });
    const values = ['plain', 'quotes " slash \\ backspace\b nul\0 newline\n tab\t', '\ud800', '\udfff', '🜂\u2028\u2029', '界𐐀café'];
    const check = (text: string) => {
      game.factions[0]!.name = text;
      game.events = [{ turn: 1, type: 'diagnostic', factionId: game.turnOwnerId, message: text }];
      const saved = serializeGame(game), expected = checksum(saved);
      expect(stateHash(game)).toBe(expected); expect(stateHashForVersion(game, SAVE_VERSION)).toBe(expected);
      expect(serializeGame(game)).toBe(saved);
    };
    for (const text of values) check(text);
    fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 0xffff }), { maxLength: 100 }), units => {
      check(String.fromCharCode(...units));
    }), { numRuns: 40, seed: 20260906 });
  });

  it('retains strict validation and never calls executable hooks on malformed land', () => {
    const mutations: ((game: GameState) => void)[] = [
      game => { Object.assign(game.land, { unexpected: undefined }); },
      game => { game.land.cultivation[game.turnOwnerId] = NaN; },
      game => { Object.setPrototypeOf(game.land.known, { inherited: {} }); },
      game => { game.armies['army.1']!.formations[0]!.strength = Infinity; },
    ];
    for (const mutate of mutations) {
      const game = createGame({ seed: 17, size: 'tiny' }); mutate(game);
      expect(() => baseline(game)).toThrow(); expect(() => stateHash(game)).toThrow();
    }
    const game = createGame({ seed: 17, size: 'tiny' }), toJSON = vi.fn(() => ({}));
    Object.assign(game.land, { toJSON });
    expect(() => stateHash(game)).toThrow(); expect(toJSON).not.toHaveBeenCalled();
  });

  it('traverses canonical payload and explored iterable once and leaves the source detached', () => {
    const game = createGame({ seed: 17, size: 'tiny', factionCount: 1 });
    const saved = serializeGame(game), cells = [...game.explored[game.turnOwnerId]!];
    let iterations = 0;
    game.explored[game.turnOwnerId] = { *[Symbol.iterator]() { iterations++; yield* cells; } } as Set<number>;
    const stringify = vi.spyOn(JSON, 'stringify');
    expect(stateHash(game)).toBe(checksum(saved)); expect(iterations).toBe(1);
    const objects = stringify.mock.calls.map(call => call[0]);
    const has = (value: unknown, key: string) => value !== null && typeof value === 'object' && Object.hasOwn(value, key);
    expect(objects.filter(value => has(value, 'world'))).toHaveLength(1);
    expect(objects.filter(value => has(value, 'stateChecksum'))).toHaveLength(1);
    expect(objects.some(value => has(value, 'state'))).toBe(false);
    stringify.mockRestore();
    expect(serializeGame(game)).toBe(saved);
    expect(stateHash(deserializeGame(saved))).toBe(checksum(saved));
  });
});
