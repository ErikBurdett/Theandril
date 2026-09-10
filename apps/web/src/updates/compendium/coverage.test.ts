import { describe, expect, it } from 'vitest';
import data from './data.json';

const assets = data.assets as Record<string, { atlasId: string; frame: { w: number; h: number } }>;

describe('compendium sprite coverage', () => {
  it('projects every published sprite the overview actually asks for', () => {
    for (const id of ['terrain.ocean', 'terrain.grassland', 'terrain.temperate_forest', 'terrain.taiga', 'terrain.tundra', 'terrain.desert', 'terrain.steppe', 'terrain.marsh', 'terrain.rainforest', 'terrain.alpine', 'terrain.ash_scrub', 'terrain.chalkland',
      'monster.quarry_ogre', 'monster.revenant', 'monster.slateback', 'character.waykeeper', 'map.resource', 'map.ruin', 'map.watchtower', 'settlement.village', 'settlement.town', 'settlement.city']) {
      expect(assets[id], id).toBeDefined();
      expect(assets[id]!.frame.w, id).toBeGreaterThan(0);
    }
  });
  it('does not pretend a sprite exists where the catalog has none', () => {
    for (const id of ['unit.skirmisher.ashen_compact', 'unit.lancer.vesper_court', 'effect.magic.flame', 'mission.survey']) expect(assets[id]).toBeUndefined();
  });
});
