import { describe, expect, it } from 'vitest';
import { CONTENT_HASH, landmarkKind } from '@theandril/content';
import { hexDistance, isPassable, naturalFeatures, neighbors, TERRAIN } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash } from './index';
import { arcaneSites, GLASS_SHARDS } from './arcane-sites';
import { landmarkAt, landmarks, LANDMARK_RULES, landmarkYieldAt, MAX_LANDMARKS, observeLandmarks } from './landmarks';
import { landmarkKindsForRules } from '@theandril/content';
import { landCellYields } from './territory';
import { withRules } from './rules';
import { PRE_LANDMARKS_CONTENT_HASH, serializeGameForVersion } from './save';

describe('rules 51: landmarks', () => {
  it('derives the same landmarks from the same world, on passable unglassed ground away from starts, seams and each other, each of a kind that fits', () => {
    const state = createGame({ seed: 20260905, size: 'standard', factionCount: 12 });
    const sites = landmarks(state.world);
    expect(sites.length).toBeGreaterThanOrEqual(4);
    expect(sites.length).toBeLessThanOrEqual(MAX_LANDMARKS);
    expect(landmarks(createGame({ seed: 20260905, size: 'standard', factionCount: 12 }).world)).toEqual(sites);
    expect(landmarks(createGame({ seed: 20260906, size: 'standard', factionCount: 12 }).world)).not.toEqual(sites);
    const { world } = state, width = world.width;
    const seams = arcaneSites(world).map(site => site.cell);
    for (const [index, site] of sites.entries()) {
      expect(site.id).toBe(`landmark.${index + 1}`);
      expect(isPassable(world.terrain[site.cell]!)).toBe(true);
      expect((naturalFeatures(world, site.cell) & GLASS_SHARDS) === GLASS_SHARDS).toBe(false);
      expect(world.starts.every(start => hexDistance(site.cell, start, width) >= 4)).toBe(true);
      expect(seams.every(seam => hexDistance(site.cell, seam, width) >= 2)).toBe(true);
      expect(sites.every(other => other === site || hexDistance(site.cell, other.cell, width) >= 8)).toBe(true);
      const kind = landmarkKind(site.kindId)!;
      expect(kind.terrains).toContain(world.terrain[site.cell]);
      if (kind.coastal) expect(neighbors(site.cell, width, world.height).some(next => world.terrain[next] === TERRAIN.water)).toBe(true);
      expect(landmarkAt(world, site.cell)).toEqual(site);
    }
    expect(sites.every((site, index) => !index || site.cell > sites[index - 1]!.cell)).toBe(true);
    expect(landmarkAt(world, world.starts[0]!)).toBeUndefined();
    // Rules 57: the second catalogue is placed from rules 57; a rules 56 reading of the same world keeps to the first twelve kinds and is read the same way again.
    const older = landmarks(world, 56), first = new Set(landmarkKindsForRules(56).map(kind => kind.id));
    expect(older.every(site => first.has(site.kindId))).toBe(true);
    expect(landmarks(world, 56)).toBe(older);
    expect(landmarks(world)).toBe(landmarks(world, LANDMARK_RULES));
    expect(sites.some(site => !first.has(site.kindId)) || landmarks(createGame({ seed: 20260906, size: 'standard', factionCount: 12 }).world).some(site => !first.has(site.kindId))).toBe(true);
    withRules(state, 56, () => expect(getObservation(state, state.turnOwnerId).landmarks!.every(site => first.has(site.kindId))).toBe(true));
  });

  it('is seen once its ground is explored, in full, and is nothing under older rules', () => {
    const state = createGame({ seed: 20260905, size: 'standard', factionCount: 12 }), player = state.turnOwnerId;
    const site = landmarks(state.world)[0]!, kind = landmarkKind(site.kindId)!;
    state.explored[player]!.delete(site.cell);
    expect(observeLandmarks(state, player)!.some(item => item.id === site.id)).toBe(false);
    state.explored[player]!.add(site.cell);
    const seen = getObservation(state, player).landmarks!.find(item => item.id === site.id)!;
    expect(seen).toMatchObject({ cell: site.cell, kindId: kind.id, name: kind.name, description: kind.description, yields: kind.yields });
    expect(landmarkYieldAt(state, site.cell)).toEqual(kind.yields);
    expect(landmarkYieldAt(state, state.world.starts[0]!)).toEqual({ food: 0, industry: 0, coin: 0, knowledge: 0 });
    withRules(state, 50, () => {
      expect(landmarkYieldAt(state, site.cell)).toEqual({ food: 0, industry: 0, coin: 0, knowledge: 0 });
      expect(getObservation(state, player).landmarks).toBeUndefined();
    });
  });

  it('is read from the world, so a v50 envelope loads to the same state and sees the same landmarks', () => {
    const state = createGame({ seed: 74, size: 'tiny', factionCount: 2 }), player = state.turnOwnerId;
    const loaded = deserializeGame(serializeGame(state));
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(landmarks(loaded.world)).toEqual(landmarks(state.world));
    const sealed = serializeGameForVersion(state, 50);
    expect(JSON.parse(sealed)).toMatchObject({ version: 50, contentHash: PRE_LANDMARKS_CONTENT_HASH });
    const older = deserializeGame(sealed);
    expect(stateHash(older)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(older))).toMatchObject({ version: 67, contentHash: CONTENT_HASH });
    expect(observeLandmarks(older, player)).toEqual(observeLandmarks(state, player));
    // A worked landmark hex yields its kind on top of the ground.
    const site = landmarks(state.world)[0];
    if (site) {
      const town = Object.values(state.settlements)[0];
      if (town) {
        const breakdown = landCellYields(state, town, site.cell);
        const kind = landmarkKind(site.kindId)!;
        for (const key of ['food', 'industry', 'coin', 'knowledge'] as const) expect(breakdown.features[key]).toBeGreaterThanOrEqual(kind.yields[key]);
      }
    }
    expect(applyCommand(state, { type: 'endTurn', factionId: player })).toMatchObject({ ok: true });
  });
});
