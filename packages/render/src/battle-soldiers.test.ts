import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Texture } from 'pixi.js';
import type { BattlePresentation, BattleSceneSnapshot } from '@theandril/sim';
import type { RuntimeCatalog } from '@theandril/art-pipeline/runtime';
import type { RuntimeArt } from './art';
import { selectClipFrame } from './animation';
import { BattleSoldierLayer } from './battle-soldiers';
import { battleLayout, presentedEventCount, presentationSnapshot } from './battle-layout';

// Real published clips and anchors; only the GPU texture allocation is replaced.
const catalog = JSON.parse(readFileSync(new URL('../../../apps/web/public/art/catalog.json', import.meta.url), 'utf8')) as RuntimeCatalog;
const art = { frame(id: string, elapsedMs: number, animate: boolean, direction: string, state = 'idle') {
  const asset = catalog.assets.find(asset => asset.id === id);
  const frameId = asset && selectClipFrame(asset, { elapsedMs, animate, direction, state })?.frameId;
  return asset && frameId ? { asset, frameId, texture: Texture.EMPTY } : undefined;
} } as unknown as RuntimeArt;

function packet(hulls = false): BattlePresentation {
  const before: BattleSceneSnapshot = { round: 0, terrain: hulls ? 0 : 1, domain: hulls ? 'naval' : 'land', settlementId: null, fortification: 0, result: null, characters: [], formations: [], soldiers: [] };
  for (const [index, side] of ['attacker', 'defender'].entries()) {
    const id = `formation.${index}`, members = hulls ? undefined : [0, 1, 2];
    before.formations.push({ id, armyId: `army.${index}`, side: side as 'attacker' | 'defender', factionId: `faction.${index}`, factionDefinitionId: 'faction.ashen_compact', unitId: hulls ? 'unit.transport' : 'unit.guard', unitName: 'Fixture', armyName: 'Fixture', strength: hulls ? 80 : 3, maxStrength: hulls ? 80 : 3, morale: 80, fatigue: 0, row: 0, column: 2, attack: 10, armor: 4, initiative: 3, range: 1, ward: 0, cohesion: 100, position: { forward: 0, lateral: 0 }, ...(members ? { members } : {}) });
    for (const slot of members ?? [0]) before.soldiers!.push({ id: `${id}.soldier.${slot}`, formationId: id, slot, x: hulls ? 0 : (slot - 1) / 3, y: 0, alive: true });
  }
  const after = structuredClone(before), victim = `formation.1.soldier.${hulls ? 0 : 1}`;
  after.formations[0]!.position = { forward: 2, lateral: 1 };
  after.formations[1]!.strength -= hulls ? 80 : 1;
  if (!hulls) after.formations[1]!.members = [0, 2];
  after.soldiers = after.soldiers!.filter(soldier => soldier.id !== victim);
  const base = { round: 1, sourceId: 'formation.0', sourceKind: 'formation' as const, targetIds: ['formation.1'], abilityId: null, winner: null, reason: null };
  return { battleId: 'battle.test', before, after, events: [
    { ...base, sequence: 0, type: 'move', attackKind: null, changes: [], movement: { formationId: 'formation.0', before: { forward: 0, lateral: 0 }, after: { forward: 2, lateral: 1 } } },
    { ...base, sequence: 1, type: 'attack', attackKind: 'melee', sourceSoldierIds: ['formation.0.soldier.0'], targetSoldierIds: [victim], killedSoldierIds: [victim], changes: [{ formationId: 'formation.1', strengthDelta: hulls ? -80 : -1, moraleDelta: 0, fatigueDelta: 0, wardDelta: 0 }] },
  ] };
}

describe('pooled authoritative soldier artwork', () => {
  it.each([false, true])('uses only exact participants, movement and death facts (hulls=%s)', hulls => {
    const trace = packet(hulls), original = structuredClone(trace), layer = new BattleSoldierLayer();
    const render = (time: number, reduced = false) => {
      layer.setPacket(trace); layer.sync(presentationSnapshot(trace, presentedEventCount(time, trace.events.length)), 1100, 700, art); layer.tick(time, time, reduced);
      return layer.diagnostics();
    };
    try {
      const initial = render(0), sourceId = 'formation.0.soldier.0', victimId = trace.events[1]!.killedSoldierIds![0]!;
      expect(initial.soldiers).toHaveLength(hulls ? 2 : 6);
      expect(initial.soldiers.map(soldier => soldier.id)).toEqual(trace.before.soldiers!.map(soldier => soldier.id));
      expect(initial.soldiers.every(soldier => soldier.frameId?.startsWith(soldier.assetId))).toBe(true);
      const walking = render(100), start = initial.soldiers.find(soldier => soldier.id === sourceId)!, moved = walking.soldiers.find(soldier => soldier.id === sourceId)!;
      expect(moved.state).toBe(hulls ? 'sail' : 'walk'); expect(moved.x).toBeGreaterThan(start.x);
      expect(moved.frameId).toContain(`/${moved.state}/e/2`);
      const action = render(250);
      expect(action.soldiers.filter(soldier => soldier.state === (hulls ? 'fire' : 'attack')).map(soldier => soldier.id)).toEqual([sourceId]);
      expect(action.soldiers.find(soldier => soldier.id === victimId)!.alive).toBe(true);
      const struck = render(650), dead = struck.soldiers.find(soldier => soldier.id === victimId)!;
      expect(dead.alive).toBe(false); expect(dead.frameId).toContain(`/${hulls ? 'sink' : 'death'}/w/1`);
      expect(struck.soldiers.filter(soldier => !soldier.alive).map(soldier => soldier.id)).toEqual([victimId]);
      const end = render(3000, true);
      expect(end.soldiers.find(soldier => soldier.id === victimId)!.frameId).toContain(`/${hulls ? 'sink' : 'death'}/w/7`);
      expect(end.soldiers.filter(soldier => soldier.alive).every(soldier => soldier.state === 'idle')).toBe(true);
      const expected = battleLayout(trace.after, 1100, 700).soldierPoints.get(sourceId)!;
      expect(end.soldiers.find(soldier => soldier.id === sourceId)).toMatchObject(expected);
      expect(layer.pick(dead.x, dead.y - 20 * dead.scale)).toBe('formation.1');
      expect(end.pooledSoldiers).toBe(initial.soldiers.length);
      layer.clear(); expect(layer.diagnostics().soldiers).toEqual([]);
      layer.sync(trace.after, 390, 900, art); layer.tick(3000, 3000, true);
      expect(layer.diagnostics().pooledSoldiers).toBe(initial.soldiers.length);
      expect(layer.diagnostics().soldiers.filter(soldier => soldier.alive)).toHaveLength(trace.after.soldiers!.length);
      expect(trace).toEqual(original);
    } finally { layer.container.destroy({ children: true }); layer.shadows.destroy(); layer.fallback.destroy(); }
  });
});
