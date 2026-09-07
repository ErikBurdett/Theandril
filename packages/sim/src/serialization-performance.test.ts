import { gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checksum } from '@theandril/content';
import { createGame, applyCommandForVersion, deserializeGame, serializeGameForVersion, stateHashForVersion, type GameState } from './index';
import type { RulesVersion } from './rules';

// Actual complete serializer outputs captured before the one-pass envelope edit.
// Synthetic campaigns, not historical user files. The two cases retain every
// version 4–11 byte, including quotes, controls, Unicode and a lone surrogate.
const captured = JSON.parse(gunzipSync(Buffer.from(
  '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',
  'base64',
)).toString('utf8')) as { escaped: boolean; saves: string[] }[];
const versions: RulesVersion[] = [4, 5, 6, 7, 8, 9, 10, 11];

function campaign(escaped: boolean): GameState {
  const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 2, pace: 'short', generatorVersion: 1, rosterVersion: 1 });
  const name = escaped ? 'Rune "Gate" \\ Àsh \u2028 \u2029 🜂 \ud800' : 'First Hearth';
  const result = applyCommandForVersion(game, { type: 'found', factionId: game.turnOwnerId, armyId: 'army.1', name }, 4);
  if (!result.ok) throw new Error(result.error);
  for (let turn = 0; turn < 3; turn++) {
    const result = applyCommandForVersion(game, { type: 'endTurn', factionId: game.turnOwnerId }, 4);
    if (!result.ok) throw new Error(result.error);
  }
  if (escaped) {
    game.factions[0]!.name = name;
    game.armies['army.2']!.name = name;
    game.events.push({ turn: game.turn, type: 'diagnostic', factionId: game.turnOwnerId,
      message: 'Quotes " slash \\ backspace\b newline\n tab\t carriage\r formfeed\f nul\u0000 🜂 \ud800 \u2028 \u2029' });
  }
  return game;
}

afterEach(() => vi.restoreAllMocks());

describe('single-pass exact save envelope serialization', () => {
  it.each(versions)('preserves every captured schema-%i byte, envelope key order, payload checksum and state seal', version => {
    for (const fixture of captured) {
      const expected = fixture.saves[version - 4]!, game = campaign(fixture.escaped);
      const actual = serializeGameForVersion(game, version);
      expect(actual).toBe(expected);
      expect(stateHashForVersion(game, version)).toBe(checksum(expected));
      const saved = JSON.parse(actual) as { version: number; gameVersion: string; contentHash: string; stateChecksum: string; state: object };
      expect(Object.keys(saved)).toEqual(['version', 'gameVersion', 'contentHash', 'stateChecksum', 'state']);
      expect(saved.stateChecksum).toBe(checksum(JSON.stringify(saved.state)));
      // Independent original envelope operation; checks punctuation/escaping,
      // while the captured whole file above also seals the state projection.
      expect(actual).toBe(JSON.stringify({
        version: saved.version, gameVersion: saved.gameVersion, contentHash: saved.contentHash,
        stateChecksum: checksum(JSON.stringify(saved.state)), state: saved.state,
      }));
      expect(serializeGameForVersion(deserializeGame(actual), version)).toBe(expected);
    }
  });
  it.each(versions)('never stringifies an envelope containing its already serialized schema-%i payload', version => {
    const game = campaign(true), stringify = vi.spyOn(JSON, 'stringify');
    const actual = serializeGameForVersion(game, version);
    const argumentsSeen: unknown[] = stringify.mock.calls.map(call => call[0]);
    const has = (value: unknown, key: string) => value !== null && typeof value === 'object' && Object.hasOwn(value, key);
    expect(argumentsSeen.filter(value => has(value, 'world'))).toHaveLength(1);
    expect(argumentsSeen.filter(value => has(value, 'stateChecksum'))).toHaveLength(1);
    expect(argumentsSeen.some(value => has(value, 'state'))).toBe(false);
    expect(actual).toBe(captured.find(fixture => fixture.escaped)!.saves[version - 4]);
  });
  it.each(versions)('retains strict schema-%i rejection before producing any envelope', version => {
    const malformed: ((game: GameState) => void)[] = [
      game => { Object.assign(game.land, { unknownCanonicalField: undefined }); },
      game => { game.land.cultivation[game.turnOwnerId] = NaN; },
      game => { Object.values(game.armies)[0]!.formations[0]!.strength = Infinity; },
      game => { Object.assign(Object.values(game.armies)[0]!.formations[0]!, { unknownCanonicalField: 1 }); },
    ];
    for (const corrupt of malformed) {
      const game = campaign(false); corrupt(game);
      expect(() => serializeGameForVersion(game, version)).toThrow();
      expect(() => stateHashForVersion(game, version)).toThrow();
    }
    const game = campaign(false), toJSON = vi.fn(() => ({}));
    Object.assign(game.land, { toJSON });
    expect(() => serializeGameForVersion(game, version)).toThrow();
    expect(toJSON).not.toHaveBeenCalled();
  });
});

