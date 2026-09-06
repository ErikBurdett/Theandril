import { describe, expect, it } from 'vitest';
import { FACTIONS } from '@theandril/content';
import { generateWorld } from '@theandril/mapgen';
import { createGame, deserializeGame, serializeGame } from './index';
import { factionStarts } from './faction-starts';

describe('culture-aware fair starting sites', () => {
  it('uses all six cultures, permits a chosen player culture, and preserves every viable candidate', () => {
    const world = generateWorld(20260905, 'tiny', 6);
    const game = createGame({ seed: 20260905, size: 'tiny', factionCount: 6, factionDefinitionId: 'faction.iron_covenant' });
    expect(game.turnOwnerId).toBe('faction.iron_covenant'); expect(new Set(game.factions.map(faction => faction.definitionId)).size).toBe(6);
    expect([...game.world.starts].sort((a, b) => a - b)).toEqual([...world.starts].sort((a, b) => a - b));
    expect(game.world.terrain).toEqual(world.terrain); expect(game.world.biome).toEqual(world.biome); expect(game.world.waterDepth).toEqual(world.waterDepth);
    expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  });
  it('is deterministic and freezes original catalogs and seat order with independent explicit roster versions', () => {
    const world = generateWorld(74, 'tiny', 8, 3);
    expect(factionStarts(world, FACTIONS.map(faction => faction.id))).toEqual(world.starts);
    const old = createGame({ seed: 74, size: 'tiny', factionCount: 8, generatorVersion: 3, rosterVersion: 1 });
    expect(old.factions[4]!.definitionId).toBe('faction.ashen_compact'); expect(old.world.starts).toEqual(world.starts);
    const modern = createGame({ seed: 74, size: 'tiny', factionCount: 6 });
    expect(serializeGame(createGame({ seed: 74, size: 'tiny', factionCount: 6 }))).toBe(serializeGame(modern));
    expect(() => createGame({ seed: 74, size: 'tiny', generatorVersion: 3, rosterVersion: 1, factionDefinitionId: 'faction.iron_covenant' })).toThrow(/historical/);
  });
});
