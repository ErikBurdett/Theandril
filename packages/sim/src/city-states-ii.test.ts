import { describe, expect, it } from 'vitest';
import { CITY_STATES, cityStatesForRules, CONTENT_HASH } from '@theandril/content';
import { createGame, deserializeGame, serializeGame, stateHash } from './index';
import { PRE_CITY_STATES_II_CONTENT_HASH, serializeGameForVersion } from './save';

const first = new Set(cityStatesForRules(68).map(item => item.id)), second = new Set(CITY_STATES.filter(item => item.sinceRules === 69).map(item => item.id));
const seated = (state: ReturnType<typeof createGame>) => state.factions.filter(faction => faction.id.startsWith('citystate.')).map(faction => faction.id);

describe('rules 69: the second city-state roster', () => {
  it('seats from forty-eight under rules 69, from the first twenty-four under older rules with the same draws as before, and refuses more than the rules know', () => {
    const current = createGame({ seed: 20260905, size: 'standard', factionCount: 12, cityStateCount: 16 });
    expect(seated(current)).toHaveLength(16);
    expect(seated(current).some(id => second.has(id))).toBe(true);
    const older = createGame({ seed: 20260905, size: 'standard', factionCount: 12, cityStateCount: 16, rulesVersion: 68 });
    expect(seated(older).every(id => first.has(id))).toBe(true);
    expect(seated(createGame({ seed: 20260905, size: 'standard', factionCount: 12, cityStateCount: 16, rulesVersion: 68 }))).toEqual(seated(older));
    expect(() => createGame({ seed: 1, size: 'standard', factionCount: 12, cityStateCount: 25, rulesVersion: 68 })).toThrow('seat at most 24 city-states');
    expect(createGame({ seed: 1, size: 'standard', factionCount: 16, cityStateCount: 48 }).factions.filter(faction => faction.id.startsWith('citystate.'))).toHaveLength(48);
    expect(() => createGame({ seed: 1, size: 'standard', factionCount: 17, cityStateCount: 48 })).toThrow(/64/);
    // Every seat of the second roster carries its own name, colour and culture.
    for (const seat of current.factions.filter(faction => second.has(faction.id))) {
      const definition = CITY_STATES.find(item => item.id === seat.id)!;
      expect(seat).toMatchObject({ name: definition.name, color: definition.color, definitionId: definition.cultureId });
    }
    expect(stateHash(deserializeGame(serializeGame(current)))).toBe(stateHash(current));
  });

  it('seals a campaign of the first roster under rules 68 and refuses one that seats the second', () => {
    const older = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 2, pace: 'short', generatorVersion: 4, rulesVersion: 68 });
    const sealed = serializeGameForVersion(older, 68);
    expect(JSON.parse(sealed)).toMatchObject({ version: 68, contentHash: PRE_CITY_STATES_II_CONTENT_HASH });
    const loaded = deserializeGame(sealed);
    expect(stateHash(loaded)).toBe(stateHash(older));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 82, contentHash: CONTENT_HASH });
    let withSecond = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 2, pace: 'short', generatorVersion: 4 });
    for (let seed = 75; !seated(withSecond).some(id => second.has(id)) && seed < 120; seed++) withSecond = createGame({ seed, size: 'tiny', factionCount: 4, cityStateCount: 2, pace: 'short', generatorVersion: 4 });
    expect(seated(withSecond).some(id => second.has(id))).toBe(true);
    expect(() => serializeGameForVersion(withSecond, 68)).toThrow('city-states unavailable in historical rules');
  });
});
