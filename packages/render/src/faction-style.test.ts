import { describe, expect, it } from 'vitest';
import { FACTIONS } from '../../content/src/index';
import { FACTION_ART_FAMILIES, FACTION_ART_IDS, FACTION_ART_ROLES, factionArtId, SHARED_UNIT_ART } from '@theandril/art-pipeline/runtime';
import { createGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { selectEntityArt } from './faction-style';

describe('authored faction artwork selection', () => {
  it('defines unique qualified bindings for every culture without claiming generic content IDs', () => {
    expect(FACTION_ART_FAMILIES.map(family => `faction.${family}`)).toEqual(FACTIONS.map(faction => faction.id));
    expect(FACTION_ART_ROLES).toHaveLength(18); expect(FACTION_ART_IDS).toHaveLength(FACTIONS.length * 18);
    expect(new Set(FACTION_ART_IDS).size).toBe(FACTIONS.length * 18);
    for (const family of FACTION_ART_FAMILIES) for (const role of FACTION_ART_ROLES) expect(factionArtId(role, `faction.${family}`)).toBe(`${role}.${family}`);
  });
  it('uses only exact authored definition IDs, never seat numbers, names or arbitrary suffixes', () => {
    for (const invalid of ['faction.1', 'Ashen Compact', 'ashen_compact', 'faction.ashen_compact.extra', 'faction.unknown']) expect(factionArtId('unit.guard', invalid)).toBeUndefined();
    expect(factionArtId('unit.made_up', 'faction.ashen_compact')).toBeUndefined();
    expect(factionArtId('map.ruin', 'faction.ashen_compact')).toBeUndefined();
  });
  it('prefers the exact role and culture, never a different available culture', () => {
    const approved = new Set(['unit.guard', 'unit.guard.ashen_compact', 'unit.guard.reedbound_council']);
    expect(selectEntityArt('unit.guard', 'faction.reedbound_council', false, id => approved.has(id))).toEqual({ requestedId: 'unit.guard.reedbound_council', contentId: 'unit.guard.reedbound_council', presentation: 'faction', warning: null });
    const missing = selectEntityArt('unit.guard', 'faction.glass_tide', false, id => approved.has(id));
    expect(missing.contentId).toBe('unit.guard'); expect(missing.warning).toContain('unit.guard.glass_tide');
  });
  it('falls back visibly to the generic role or procedural marker, including unknown definitions', () => {
    expect(selectEntityArt('unit.cavalry', 'faction.unknown', false, id => id === 'unit.cavalry')).toMatchObject({ contentId: 'unit.cavalry', presentation: 'generic', warning: expect.stringContaining('Unrecognized') });
    expect(selectEntityArt('unit.cavalry', 'faction.cinder_march', false, () => false)).toMatchObject({ contentId: null, presentation: 'procedural', warning: expect.stringContaining('procedural') });
  });
  it('uses one static badge/banner representation at far zoom, not the near unit body', () => {
    expect(selectEntityArt('unit.cavalry', 'faction.glass_tide', true, () => true).contentId).toBe('ui.badge.glass_tide');
    expect(selectEntityArt('settlement.city', 'faction.reedbound_council', true, () => true).contentId).toBe('ui.banner.reedbound_council');
    expect(selectEntityArt('unit.guard', 'faction.ashen_compact', true, id => id === 'unit.guard').contentId).toBeNull();
    expect(selectEntityArt('map.ruin', undefined, true, () => true)).toMatchObject({ contentId: null, warning: null });
  });
  it('reports specialists as shared silhouettes and keeps the same culture and far badge', () => {
    for (const [role, shared] of Object.entries(SHARED_UNIT_ART)) for (const family of FACTION_ART_FAMILIES) {
      const definitionId = `faction.${family}`, assetId = `${shared.role}.${family}`;
      expect(selectEntityArt(role, definitionId, false, id => id === assetId)).toEqual({ requestedId: assetId, contentId: assetId, presentation: 'shared', warning: null });
      expect(selectEntityArt(role, definitionId, true, id => id === `ui.badge.${family}`)).toMatchObject({ contentId: `ui.badge.${family}`, presentation: 'strategic' });
      expect(selectEntityArt(role, definitionId, false, id => id === `${shared.role}.unknown`)).toMatchObject({ contentId: null, presentation: 'procedural' });
    }
  });
  it('selects exact approved naval hulls near and badges far, without substituting an infantry role', () => {
    for (const family of FACTION_ART_FAMILIES) for (const role of ['unit.transport', 'unit.coastal_warship', 'unit.ocean_warship']) {
      expect(selectEntityArt(role, `faction.${family}`, false, id => id === `${role}.${family}`)).toMatchObject({ contentId: `${role}.${family}`, presentation: 'faction', warning: null });
      expect(selectEntityArt(role, `faction.${family}`, true, id => id === `ui.badge.${family}`)).toMatchObject({ contentId: `ui.badge.${family}`, presentation: 'strategic' });
      expect(selectEntityArt(role, `faction.${family}`, false, id => id.startsWith('unit.guard'))).toMatchObject({ contentId: null, presentation: 'procedural', warning: expect.stringContaining(`${role}.${family}`) });
    }
  });
  it('adds culture only to already-observed faction metadata without changing saves or revealing unknown seats', () => {
    const game = createGame({ seed: 748291, size: 'standard', factionCount: 24 });
    const before = serializeGame(game), hash = stateHash(game);
    const view = getObservation(game, game.turnOwnerId);
    expect(view.factions).toHaveLength(1);
    expect(view.factions[0]?.definitionId).toBe(game.factions[0]?.definitionId);
    expect(stateHash(game)).toBe(hash); expect(serializeGame(game)).toBe(before);
    const generated = game.factions[8]!;
    expect(getObservation(game, generated.id).factions.find(faction => faction.id === generated.id)?.definitionId).toBe(generated.definitionId);
  });
});
