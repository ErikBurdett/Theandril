import { describe, expect, it } from 'vitest';
import { compactMapName, layoutMapLabels, MAX_MAP_LABELS, type MapLabelCandidate } from './map-overlays';
import { hexPerimeterAngles, territoryEdges, type ObservedOwner } from './territory-style';

const town = (id: string, x = 100, y = 100): MapLabelCandidate => ({ id, cell: Number(id) || 10, x, y, name: `Settlement ${id}`, settlement: true, own: true, hostile: false });
const measure = (text: string) => ({ width: Array.from(text).length * 6, height: 14 });
const context = { width: 1000, height: 600, zoom: 1 };

describe('quiet observation-only map overlays', () => {
  it('shows realm perimeter, not individual towns within one realm; inspection can still expose both boundaries', () => {
    const owners = new Map<number, ObservedOwner>([[100, { cell: 100, settlementId: 'town.a', factionId: 'realm.a' }], [101, { cell: 101, settlementId: 'town.b', factionId: 'realm.a' }]]);
    const a = owners.get(100)!;
    expect(territoryEdges(a, 32, 32, id => owners.get(id)).find(edge => edge.angle === 0)?.kind).toBe('settlement');
    expect(territoryEdges(a, 32, 32, id => owners.get(id), 'realm').some(edge => edge.angle === 0)).toBe(false);
    owners.get(101)!.factionId = 'realm.b';
    expect(territoryEdges(a, 32, 32, id => owners.get(id), 'realm').find(edge => edge.angle === 0)?.kind).toBe('realm');
    owners.delete(101); // Unseen ownership is absent, never inferred from a canonical registry.
    expect(territoryEdges(a, 32, 32, id => owners.get(id), 'realm').find(edge => edge.angle === 0)?.kind).toBe('realm');
  });
  it('outlines seven reachable hexes with 18 edges instead of 42 and never requests out-of-bounds cells', () => {
    for (const row of [10, 11]) {
      const width = 48, center = row * width + 20, cells = new Set([center]);
      hexPerimeterAngles(center, width, 32, id => { cells.add(id); return false; });
      expect(cells.size).toBe(7);
      expect([...cells].reduce((sum, cell) => sum + hexPerimeterAngles(cell, width, 32, id => cells.has(id)).length, 0)).toBe(18);
      expect(hexPerimeterAngles(center, width, 32, id => cells.has(id))).toEqual([]);
    }
    const queried: number[] = [];
    expect(hexPerimeterAngles(0, 48, 32, id => { queried.push(id); return false; })).toHaveLength(6);
    expect(queried).toEqual([1, 48]);
  });
  it('prefers the explicitly selected army over overlapping hover and town names without changing input order', () => {
    const candidates = [town('1'), { ...town('2'), settlement: false, own: false }, town('3')];
    const before = structuredClone(candidates);
    const labels = layoutMapLabels(candidates, { ...context, selected: 2, selectedEntityId: '2', hovered: 3 }, measure);
    expect(labels.map(item => item.id)).toEqual(['2']); expect(labels[0]!.priority).toBe(0);
    expect(candidates).toEqual(before);
  });
  it('does not label unrelated foreign armies; selected and hovered labels remain available at far zoom', () => {
    const candidates = [{ ...town('1'), own: false, settlement: false, hostile: true }, town('2', 350), { ...town('3', 550), settlement: false }];
    expect(layoutMapLabels(candidates, context, measure).map(item => item.id)).toEqual(['2']);
    const labels = layoutMapLabels(candidates, { ...context, zoom: .35, selectedEntityId: '3', hovered: 1 }, measure);
    expect(labels.map(item => item.id)).toEqual(['3', '1']); expect(labels[1]!.text).toMatch(/^⚔ /u);
  });
  it('keeps the selected member name and exact group count in contextual stack labels', () => {
    const entries = [{ ...town('1'), settlement: false, name: 'Chosen scout', stackArmyCount: 17 },
      { ...town('2'), settlement: false, name: 'Other army', stackArmyCount: 17 }];
    const labels = layoutMapLabels(entries, { ...context, selectedEntityId: '1' }, measure);
    expect(labels).toHaveLength(1); expect(labels[0]!.text).toBe('◆ Chosen scout · 17 armies');
    expect(layoutMapLabels([{ ...entries[0]!, domain: 'naval' }], { ...context, selectedEntityId: '1' }, measure)[0]!.text).toContain('17 fleets');
  });
  it('ellipsizes long names without broken Unicode and preserves the complete name for diagnostics/DOM', () => {
    expect(compactMapName('  Long\n name  ', 12)).toBe('Long name');
    expect(compactMapName('A🜁BCDEF', 5)).toBe('A🜁BC…');
    const candidate = { ...town('1'), name: 'The extraordinarily lengthy charter name of this coastal settlement' };
    const label = layoutMapLabels([candidate], context, measure)[0]!;
    expect(label.name).toBe(candidate.name); expect(label.text.endsWith('…')).toBe(true);
    expect(Array.from(label.text)).toHaveLength(24);
  });
  it('clamps native-sized text to narrow canvas bounds and suppresses remaining collisions', () => {
    const labels = layoutMapLabels([town('1', -10, -10), town('2', 388, 590), town('3', 388, 590)], { ...context, width: 390 }, measure);
    expect(labels).toHaveLength(2);
    for (const label of labels) { expect(label.x - label.width / 2).toBeGreaterThanOrEqual(6); expect(label.x + label.width / 2).toBeLessThanOrEqual(384); expect(label.y).toBeGreaterThanOrEqual(6); expect(label.y + label.height).toBeLessThanOrEqual(594); }
  });
  it('caps displayed labels and measurement work when a large visible cohort has no overlaps', () => {
    let calls = 0;
    const candidates = Array.from({ length: 100 }, (_, i) => town(String(i), 100 + i % 10 * 250, 20 + Math.floor(i / 10) * 50));
    const labels = layoutMapLabels(candidates, { width: 2600, height: 800, zoom: 1 }, text => { calls++; return measure(text); });
    expect(labels).toHaveLength(MAX_MAP_LABELS); expect(calls).toBe(MAX_MAP_LABELS);
  });
});
