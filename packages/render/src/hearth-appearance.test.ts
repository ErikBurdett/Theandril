import { describe, expect, it } from 'vitest';
import { neighbors } from '@theandril/mapgen';
import type { MapObservation } from '@theandril/sim';
import { changedHearthCells, hearthAppearance } from './hearth-appearance';
import { armySpriteScale, strategicSpriteScale } from './entity-scale';

function scene() {
  const width = 20, height = 20, center = 210;
  const claims = new Set([center, ...neighbors(center, width, height)]);
  for (const cell of [...claims]) for (const adjacent of neighbors(cell, width, height)) claims.add(adjacent);
  const cells = new Map([...claims].map(cell => [cell, { cell, terrain: 1, biome: 1, waterDepth: 0, fertility: 80, visible: true, settlementId: 'town.1', factionId: 'faction.1' }]));
  const observation: Pick<MapObservation, 'width' | 'height' | 'settlements' | 'land'> = { width, height,
    settlements: [{ id: 'town.1', name: 'Hearth', factionId: 'faction.1', cell: center, population: 12, buildings: ['building.workshop', 'building.archive', 'building.market', 'building.granary'], queue: [] }],
    land: { capitalSettlementId: 'town.1', settlements: [{ settlementId: 'town.1', worked: [], work: null }] },
  };
  return { observation, cells, claims: new Map([['town.1', claims]]), center };
}

describe('observed hearth development', () => {
  it('sprawls into claimed land with distinct completed districts without changing inputs', () => {
    const { observation, cells, claims, center } = scene(), before = JSON.stringify(observation);
    const districts = hearthAppearance(observation, claims, cell => cells.get(cell));
    expect(districts.size).toBe(15);
    expect(districts.get(center)?.kind).toBe('hearth');
    expect([...districts.values()].filter(district => district.kind === 'housing')).toHaveLength(10);
    expect([...districts.values()].map(district => district.kind)).toEqual(expect.arrayContaining(['archive', 'workshop', 'market', 'granary']));
    for (const district of districts.values()) {
      expect(claims.get('town.1')!.has(district.cell)).toBe(true);
      expect(district.links.every(cell => districts.get(cell)?.settlementId === district.settlementId)).toBe(true);
    }
    expect(JSON.stringify(observation)).toBe(before);
    expect(hearthAppearance(observation, claims, cell => cells.get(cell))).toEqual(districts);
  });
  it('preserves actual improvements, water, mountains and worked land; omits stale fog knowledge', () => {
    const { observation, cells, claims, center } = scene();
    const adjacent = neighbors(center, observation.width, observation.height);
    cells.get(adjacent[0]!)!.terrain = 0;
    cells.get(adjacent[1]!)!.terrain = 4;
    cells.get(adjacent[2]!)!.visible = false;
    Object.assign(cells.get(adjacent[3]!)!, { improvementId: 'improvement.terraced_fields' });
    observation.land.settlements![0]!.worked = [adjacent[4]!];
    const districts = hearthAppearance(observation, claims, cell => cells.get(cell));
    for (const cell of adjacent.slice(0, 4)) expect(districts.has(cell)).toBe(false);
    const worked = districts.get(adjacent[4]!)!;
    expect(worked.kind === 'worked' || worked.worked).toBe(true);
    cells.get(center)!.visible = false;
    expect(hearthAppearance(observation, claims, cell => cells.get(cell)).size).toBe(0);
  });
  it('replaces construction with completed work, removes cancelled scaffolds and invalidates only changed districts', () => {
    const { observation, cells, claims, center } = scene(), target = neighbors(center, observation.width, observation.height)[0]!;
    const initial = hearthAppearance(observation, claims, cell => cells.get(cell));
    observation.land.settlements![0]!.work = { kind: 'improve', cell: target, improvementId: 'improvement.terraced_fields', coinCost: 20, turns: 4, remainingTurns: 2, startedTurn: 1 };
    const building = hearthAppearance(observation, claims, cell => cells.get(cell));
    expect(building.get(target)).toMatchObject({ kind: 'construction', progress: .5, buildingId: 'improvement.terraced_fields' });
    expect(changedHearthCells(initial, building)).toContain(target);
    expect(changedHearthCells(building, building)).toEqual([]);
    observation.land.settlements![0]!.work = null;
    expect(hearthAppearance(observation, claims, cell => cells.get(cell))).toEqual(initial);
    Object.assign(cells.get(target)!, { improvementId: 'improvement.terraced_fields' });
    expect(hearthAppearance(observation, claims, cell => cells.get(cell)).has(target)).toBe(false);
  });
  it('grows from an undeveloped colony and does not invent private foreign queues', () => {
    const { observation, cells, claims } = scene();
    const town = observation.settlements[0]!;
    town.population = 1; delete town.buildings; delete town.queue; observation.land.settlements = [];
    expect(hearthAppearance(observation, claims, cell => cells.get(cell)).size).toBe(1);
    town.population = 4;
    expect(hearthAppearance(observation, claims, cell => cells.get(cell)).size).toBe(3);
    town.queue = [{ itemId: 'building.market', progress: 2 }];
    expect([...hearthAppearance(observation, claims, cell => cells.get(cell)).values()].filter(district => district.kind === 'construction')).toHaveLength(1);
    town.queue = [{ itemId: 'unit.guard', progress: 2 }, { itemId: 'building.market', progress: 0 }];
    expect([...hearthAppearance(observation, claims, cell => cells.get(cell)).values()].some(district => district.kind === 'construction')).toBe(false);
  });
  it('keeps civic growth visible when every small-hearth plot is worked and reserves the coast for a harbor', () => {
    const { observation, cells, claims, center } = scene();
    const ring = neighbors(center, observation.width, observation.height);
    claims.set('town.1', new Set([center, ...ring]));
    observation.land.settlements![0]!.worked = ring;
    observation.settlements[0]!.buildings = ['building.archive', 'building.harbor', 'building.granary'];
    const water = neighbors(ring[0]!, observation.width, observation.height).find(cell => !claims.get('town.1')!.has(cell))!;
    cells.get(water)!.terrain = 0;
    const districts = hearthAppearance(observation, claims, cell => cells.get(cell));
    expect(districts.size).toBe(7);
    expect([...districts.values()].map(district => district.kind)).toEqual(expect.arrayContaining(['archive', 'harbor', 'granary', 'housing']));
    expect([...districts.values()].filter(district => district.worked)).toHaveLength(6);
    const harbor = [...districts.values()].find(district => district.kind === 'harbor')!;
    expect(neighbors(harbor.cell, observation.width, observation.height)).toContain(water);
  });
});

it('bounds screen-sized figures across zoom while keeping 64/96px silhouettes proportional', () => {
  for (const zoom of [.65, .8, 1, 1.25, 1.8, 2.2]) {
    for (const height of [64, 96]) {
      const screen = height * armySpriteScale(height, zoom) * zoom;
      expect(screen).toBeGreaterThanOrEqual(42); expect(screen).toBeLessThanOrEqual(78);
      expect(armySpriteScale(height, zoom, true)).toBeCloseTo(armySpriteScale(height, zoom) * .85);
    }
  }
  for (const zoom of [.35, .5, .64]) expect(64 * strategicSpriteScale(48, 64, zoom) * zoom).toBeCloseTo(44);
});
