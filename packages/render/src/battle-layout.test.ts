import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { BattlePresentation, BattleSceneSnapshot } from '@theandril/sim';
import { battleActorBounds, battleEffect, battleLayout, battleSceneHeight, battleSeekRequested, battleSpriteContract, BATTLE_FX_LIMIT, presentedEventCount, presentationDuration, presentationSnapshot } from './battle-layout';

function scene(): BattleSceneSnapshot {
  return { round: 0, terrain: 1, domain: 'land', settlementId: null, fortification: 0, result: null, characters: [],
    formations: Array.from({ length: 40 }, (_, i) => ({ id: `formation.${i + 1}`, unitId: 'unit.guard', armyId: i < 20 ? 'army.1' : 'army.2', side: i < 20 ? 'attacker' as const : 'defender' as const, factionId: i < 20 ? 'faction.ashen_compact' : 'faction.reedbound_council', factionDefinitionId: i < 20 ? 'faction.ashen_compact' : 'faction.reedbound_council', unitName: 'Guard', armyName: 'Witness', strength: 60, maxStrength: 60, morale: 60, fatigue: 0, row: Math.floor(i % 20 / 5), column: i % 5, attack: 10, armor: 4, initiative: 3, range: 1, ward: 0 })) };
}
function packet(): BattlePresentation {
  const before = scene(), after = structuredClone(before);
  after.formations[20]!.strength -= 7; after.formations[0]!.fatigue += 3; after.round = 1;
  return { battleId: 'battle.1', before, after, events: [{ sequence: 0, round: 1, type: 'attack', sourceId: 'formation.1', sourceKind: 'formation', targetIds: ['formation.21'], abilityId: null, attackKind: 'projectile', changes: [{ formationId: 'formation.21', strengthDelta: -7, moraleDelta: 0, fatigueDelta: 0, wardDelta: 0 }, { formationId: 'formation.1', strengthDelta: 0, moraleDelta: 0, fatigueDelta: 3, wardDelta: 0 }], winner: null, reason: null }] };
}

describe('bounded battlefield presentation, never a second combat engine', () => {
  it('does not carry a prior skip into a new packet, another battle, or a reopened replay', () => {
    const previous = { battleId: 'battle.1', revision: 2, seekEnd: 1 };
    expect(battleSeekRequested(previous, { ...previous, seekEnd: 2 })).toBe(true);
    expect(battleSeekRequested(previous, previous)).toBe(false);
    expect(battleSeekRequested(previous, { ...previous, revision: 3, seekEnd: 2 })).toBe(false);
    expect(battleSeekRequested(previous, { ...previous, battleId: 'battle.2', seekEnd: 2 })).toBe(false);
    expect(battleSeekRequested(undefined, previous)).toBe(false);
  });
  it('fits all forty real formation slots at desktop and 390px without mirroring or duplicate entities', () => {
    const snapshot = scene(), copy = structuredClone(snapshot);
    for (const width of [1100, 390]) {
      const height = battleSceneHeight(snapshot, width);
      const layout = battleLayout(snapshot, width, height);
      expect(layout.points.size).toBe(40);
      expect(new Set([...layout.points.values()].map(point => `${point.x}:${point.y}`)).size).toBe(40);
      for (const point of layout.points.values()) { expect(point.x).toBeGreaterThan(24); expect(point.x).toBeLessThan(width - 24); expect(point.y).toBeGreaterThan(24); expect(point.y).toBeLessThan(height - 24); }
      expect(layout.scale).toBe(width < 720 ? .5 : 1);
    }
    expect(snapshot).toEqual(copy);
  });
  it('matches the published native contracts and separates complete sprites, annotations and motion envelopes', () => {
    const catalog = JSON.parse(readFileSync(new URL('../../../apps/web/public/art/catalog.json', import.meta.url), 'utf8')) as { assets: { id: string; nativeResolution: { width: number; height: number }; pivot: number[] }[] };
    for (const asset of catalog.assets.filter(asset => (asset.id.startsWith('unit.') || asset.id.startsWith('character.')) && (asset.id.split('.').length === 3 || asset.id === 'character.waykeeper'))) {
      const contract = battleSpriteContract(asset.id.split('.').slice(0, 2).join('.'));
      expect(asset.nativeResolution, asset.id).toEqual({ width: contract.width, height: contract.height });
      expect(asset.pivot, asset.id).toEqual([contract.pivotX, contract.pivotY]);
    }
    for (const role of ['unit.guard', 'unit.cavalry', 'unit.transport']) {
      const snapshot = scene(); snapshot.formations.forEach(item => { item.unitId = role; });
      snapshot.characters = Array.from({ length: 14 }, (_, i) => ({ id: `officer.${i}`, name: 'Longname Witness', definitionId: 'character.waykeeper', factionId: 'faction.ashen_compact', factionDefinitionId: 'faction.ashen_compact', armyId: 'army.1', side: i % 2 ? 'attacker' : 'defender', anchorFormationId: null, strain: 0, maxStrain: 10 }));
      for (const width of [1440, 1100, 900, 720, 390, 320]) {
        const height = battleSceneHeight(snapshot, width), layout = battleLayout(snapshot, width, height);
        const bounds = [...snapshot.formations, ...snapshot.characters].map(entity => battleActorBounds('unitId' in entity ? entity.unitId : entity.definitionId, layout.points.get(entity.id)!, layout.scale));
        for (const [index, box] of bounds.entries()) {
          expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width); expect(box.y + box.height).toBeLessThanOrEqual(height);
          if (layout.portrait) expect(box.y + box.height).toBeLessThanOrEqual(height - 56);
          for (const other of bounds.slice(index + 1)) expect(box.x + box.width <= other.x || other.x + other.width <= box.x || box.y + box.height <= other.y || other.y + other.height <= box.y, `${role}/${width}: ${JSON.stringify([box, other])}`).toBe(true);
        }
      }
    }
  });
  it('holds health until actual presentation impact and applies only recorded deltas', () => {
    const trace = packet(), original = structuredClone(trace);
    expect(presentedEventCount(0, 1)).toBe(0); expect(presentedEventCount(399, 1)).toBe(0);
    expect(presentedEventCount(400, 1)).toBe(1); expect(presentedEventCount(800, 1)).toBe(1);
    expect(presentationSnapshot(trace, 0).formations[20]!.strength).toBe(60);
    expect(presentationSnapshot(trace, 1)).toEqual(trace.after);
    expect(presentationDuration(trace)).toBe(800); expect(trace).toEqual(original);
  });
  it('wraps large support cohorts into bounded rails while keeping every actual officer inspectable', () => {
    const snapshot = scene();
    snapshot.characters = Array.from({ length: 42 }, (_, i) => ({ id: `character.${i}`, name: `Witness ${i}`, definitionId: 'character.waykeeper', factionId: 'faction.reedbound_council', factionDefinitionId: 'faction.reedbound_council', armyId: 'army.2', side: 'defender', anchorFormationId: 'formation.21', strain: 0, maxStrain: 10 }));
    for (const width of [1100, 390]) {
      const height = battleSceneHeight(snapshot, width), layout = battleLayout(snapshot, width, height);
      expect(height).toBeGreaterThan(500); expect(layout.points.size).toBe(82);
      for (const character of snapshot.characters) { const point = layout.points.get(character.id)!; expect(point.x).toBeGreaterThanOrEqual(30); expect(point.x).toBeLessThan(width - 24); expect(point.y).toBeGreaterThanOrEqual(40); expect(point.y).toBeLessThan(height); }
    }
  });
  it('maps only actual attack and ability facts to registered FX; never result prose', () => {
    const event = packet().events[0]!;
    expect(battleEffect(event)).toBe('effect.battle_projectile');
    expect(battleEffect({ ...event, type: 'ability', attackKind: 'fire' })).toBe('effect.battle_ember');
    expect(battleEffect({ ...event, type: 'ability', attackKind: 'ward' })).toBe('effect.battle_ward');
    expect(battleEffect({ ...event, type: 'ability', attackKind: 'rally' })).toBe('effect.battle_rally');
    expect(battleEffect({ ...event, type: 'result' })).toBeUndefined();
    expect(battleEffect({ ...event, attackKind: null })).toBeUndefined();
    expect(BATTLE_FX_LIMIT).toBe(12);
  });
});
