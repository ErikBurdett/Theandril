import { describe, expect, it } from 'vitest';
import { armyRepresentatives, groupVisibleMarkers, observedFormationCount, orderVisibleMarkers } from './army-size';

describe('observed army size representatives', () => {
  it('reads public counts or observed formations without inspecting private roles', () => {
    expect(observedFormationCount({ formationCount: 12 })).toBe(12);
    expect(observedFormationCount({ formations: [{ unitId: 'unit.guard' }, {}] })).toBe(2);
    expect(observedFormationCount({})).toBe(1);
    for (const formationCount of [NaN, Infinity, -1, 0, 1.5]) expect(observedFormationCount({ formationCount })).toBe(1);
  });
  it('caps representative figures at three and preserves stable rear-to-front order', () => {
    for (const count of [1, 2, 5, 6, 12, 16, 20, 1000]) {
      const figures = armyRepresentatives(count);
      expect(figures.length).toBe(count === 1 ? 1 : count < 6 ? 2 : 3);
      expect(armyRepresentatives(count, true)).toEqual([{ x: 0, y: 0 }]);
      expect(figures.map(point => point.y)).toEqual(figures.map(point => point.y).sort((a, b) => a - b));
      expect(figures.every(point => Math.abs(point.x) <= 11 && Math.abs(point.y) <= 9)).toBe(true);
      expect(armyRepresentatives(count)).toBe(figures);
    }
  });
  it('keeps a selected stack member visible without mutating canonical input order', () => {
    const entries = [{ id: 'army.2', cell: 5, settlement: false }, { id: 'town.1', cell: 5, settlement: true }, { id: 'army.1', cell: 5, settlement: false }];
    expect(orderVisibleMarkers(entries, 'army.1', false).map(item => item.id)).toEqual(['town.1', 'army.2', 'army.1']);
    expect(orderVisibleMarkers(entries, 'army.1', true)[0]!.id).toBe('army.1');
    expect(entries[0]!.id).toBe('army.2');
  });
  it('groups only identical observed cell, realm and domain while retaining every member', () => {
    const army = { id: 'army.1', cell: 10, factionId: 'realm.a', settlement: false, formationCount: 12 };
    const entries = [army, { ...army, id: 'army.2', formationCount: 1 }, { ...army, id: 'army.3', factionId: 'realm.b' },
      { ...army, id: 'army.4', domain: 'naval' as const }, { ...army, id: 'army.5', cell: 11 },
      { ...army, id: 'town.1', settlement: true }, { ...army, id: 'ruin.1', ruin: true }];
    const before = structuredClone(entries), groups = groupVisibleMarkers(entries);
    expect(groups).toHaveLength(6);
    expect(groups[0]).toMatchObject({ representative: army, armyCount: 2, formationCount: 13 });
    expect(groups[0]!.members.map(member => member.id)).toEqual(['army.1', 'army.2']);
    expect(groups.slice(-2).every(group => group.armyCount === 0 && group.formationCount === 0)).toBe(true);
    expect(entries).toEqual(before);
  });
  it('preserves a selected smaller army and its role instead of presenting summed formations as its size', () => {
    const entries = [{ id: 'army.2', cell: 10, factionId: 'realm.a', settlement: false, formationCount: 12, unitId: 'unit.guard' },
      { id: 'army.1', cell: 10, factionId: 'realm.a', settlement: false, formationCount: 1, unitId: 'unit.scout' }];
    const group = groupVisibleMarkers(entries, 'army.1')[0]!;
    expect(group.representative).toBe(entries[1]); expect(group.formationCount).toBe(13);
    expect(armyRepresentatives(group.representative.formationCount)).toHaveLength(1);
    expect(groupVisibleMarkers(entries)[0]!.representative).toBe(entries[0]);
    expect(groupVisibleMarkers([...entries].reverse(), 'army.1')[0]!.representative).toBe(entries[1]);
  });
  it('uses stable ID ties and bounded groups for dense observed stacks', () => {
    const entries = Array.from({ length: 1500 }, (_, index) => ({ id: `army.${index + 1}`, cell: index % 91,
      factionId: 'realm.a', settlement: false, formationCount: 12 }));
    const groups = groupVisibleMarkers(entries), reverse = groupVisibleMarkers([...entries].reverse());
    expect(groups).toHaveLength(91);
    expect(groups.reduce((sum, group) => sum + group.armyCount, 0)).toBe(1500);
    expect(groups.reduce((sum, group) => sum + group.formationCount, 0)).toBe(18000);
    expect(groups.reduce((sum, group) => sum + armyRepresentatives(group.representative.formationCount).length, 0)).toBe(273);
    expect(groups.map(group => group.representative.id).sort()).toEqual(reverse.map(group => group.representative.id).sort());
  });
});
