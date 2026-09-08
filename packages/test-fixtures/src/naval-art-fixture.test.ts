import { describe, expect, it } from 'vitest';
import { FACTIONS } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash } from '@theandril/sim';
import { NAVAL_ART_CARGO_NAME, NAVAL_ART_COHORTS, NAVAL_ART_HIDDEN_NAME, NAVAL_ART_ROLES, navalArtGallery } from './naval-art-fixture';

describe('authored naval art gallery', () => {
  it('exposes every real hull/culture through sight, retains one genuinely unseen ship and real embarked cargo', () => {
    const state = navalArtGallery(), before = serializeGame(state);
    const view = getObservation(state, state.turnOwnerId, { landDetails: 'none' });
    expect(view.armies.filter(army => army.domain === 'naval')).toHaveLength(72);
    expect(Object.values(state.armies).filter(army => army.name === NAVAL_ART_HIDDEN_NAME)).toHaveLength(1);
    expect(view.armies.some(army => army.name === NAVAL_ART_HIDDEN_NAME)).toBe(false);
    expect(view.factions).toHaveLength(24);
    expect(NAVAL_ART_COHORTS.map(cohort => cohort.offset)).toEqual([0, 60, 120, 180]);
    expect(NAVAL_ART_COHORTS.every(cohort => cohort.families.length === 6)).toBe(true);
    const families = NAVAL_ART_COHORTS.flatMap(cohort => cohort.families);
    expect(families).toEqual(FACTIONS.map(faction => faction.id.slice('faction.'.length)));
    expect(new Set(families).size).toBe(24);
    expect(families).toContain('vesper_court');
    for (const faction of view.factions) for (const role of NAVAL_ART_ROLES) {
      const matching = view.armies.filter(army => army.factionId === faction.id && army.unitId === role);
      expect(matching).toHaveLength(1);
      const hull = matching[0]!;
      expect(state.world.terrain[hull.cell]).toBe(0); expect(state.world.waterDepth[hull.cell]).toBe(1);
    }
    const cargo = view.armies.find(army => army.name === NAVAL_ART_CARGO_NAME)!;
    expect(cargo.carrierId).not.toBeNull(); expect(cargo.movement).toBe(0);
    expect(state.events.some(event => event.type === 'army_embarked')).toBe(true);
    expect(serializeGame(state)).toBe(before);
  });

  it('keeps exact saves and deterministic real turn continuation independent of gallery reads', () => {
    const state = navalArtGallery(), same = navalArtGallery(), mirror = deserializeGame(serializeGame(state));
    expect(stateHash(state)).toBe(stateHash(same));
    expect(serializeGame(mirror)).toBe(serializeGame(state));
    getObservation(state, state.turnOwnerId);
    for (const current of [state, mirror]) expect(applyCommand(current, { type: 'endTurn', factionId: current.turnOwnerId }).ok).toBe(true);
    expect(serializeGame(mirror)).toBe(serializeGame(state));
  });
});
