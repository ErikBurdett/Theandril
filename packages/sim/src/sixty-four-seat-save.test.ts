import { describe, expect, it } from 'vitest';
import { checksum } from '@theandril/content';
import { createGame, deserializeGame, serializeGame, serializeGameForVersion, stateHash } from './index';

describe('rules32 saves at the supported 64-seat bound', () => {
  it.each([
    { factionCount: 64, cityStateCount: 0 },
    { factionCount: 40, cityStateCount: 24 },
  ])('roundtrips generated $factionCount realms and $cityStateCount city-states with all per-realm registers', options => {
    const game = createGame({ seed: 20260925, size: 'standard', generatorVersion: 8, ...options });
    expect(game.factions).toHaveLength(64);
    expect(Object.keys(game.arcaneResearch)).toHaveLength(64);
    const saved = serializeGame(game), loaded = deserializeGame(saved);
    expect(serializeGame(loaded)).toBe(saved); expect(stateHash(loaded)).toBe(stateHash(game));
    expect(Object.keys(loaded.arcaneResearch).sort()).toEqual(loaded.factions.map(faction => faction.id).sort());
    expect(Object.keys(loaded.arcaneSurveys)).toHaveLength(64);
    expect(Object.keys(loaded.progression)).toHaveLength(64);
    expect(Object.keys(loaded.explored)).toHaveLength(64);
    expect(() => serializeGameForVersion(game, 31)).toThrow(/48/);
    const old = JSON.parse(saved); old.version = 31;
    delete old.state.selectionGroups; delete old.state.nextSelectionGroupId;
    old.stateChecksum = checksum(JSON.stringify(old.state));
    expect(() => deserializeGame(JSON.stringify(old))).toThrow();
  });

  it('keeps the 64-seat and 64-research-record ceilings strict', () => {
    expect(() => createGame({ seed: 1, size: 'standard', factionCount: 65 })).toThrow();
    expect(() => createGame({ seed: 1, size: 'standard', factionCount: 41, cityStateCount: 24 })).toThrow(/64/);
    const game = createGame({ seed: 1, size: 'tiny', factionCount: 1 });
    const raw = JSON.parse(serializeGame(game));
    raw.state.arcaneResearch = Array.from({ length: 65 }, (_, index) => ({ factionId: `faction.authored_${index}`, discoveries: [] }));
    raw.stateChecksum = checksum(JSON.stringify(raw.state));
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow();
  });
});
