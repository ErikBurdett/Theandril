import { expect, test } from 'vitest';
import { createGame, getObservation } from '@theandril/sim';
import { createSeaKnowledge, MAX_WATER_KNOWLEDGE_NODES } from './sea-knowledge';

function chart(width: number, height: number, water: ReadonlySet<number>) {
  const view = getObservation(createGame({ seed: 74, size: 'tiny', factionCount: 1 }), 'faction.ashen_compact');
  const template = view.cells[0]!;
  return { width, height, cells: Array.from({ length: width * height }, (_, cell) => ({ ...template, cell, terrain: water.has(cell) ? 0 : 1, waterDepth: water.has(cell) ? 1 : 0 })) };
}

test('an observed enclosed basin is proved without granting unseen geography', () => {
  const view = chart(7, 5, new Set([16, 17, 18]));
  const original = structuredClone(view), knowledge = createSeaKnowledge(view);
  expect(knowledge.fullyCharted(17)).toBe(true);
  expect(knowledge.expandedNodes).toBe(3);
  expect(knowledge.fullyCharted(18)).toBe(true);
  expect(knowledge.enclosed(16)).toBe(true);
  expect(knowledge.basinStatus(16)).toBe('enclosed');
  expect(knowledge.basinRelation(16, 18)).toBe('connected');
  expect(knowledge.shallowEnclosed(18)).toBe(true);
  expect(knowledge.separateBasins(16, 18)).toBe(false);
  expect(knowledge.expandedNodes).toBe(3);
  expect(view).toEqual(original);
  view.cells = view.cells.filter(cell => cell.cell !== 10); // An unknown shoreline is not a closed boundary.
  expect(createSeaKnowledge(view).fullyCharted(17)).toBe(false);
  expect(createSeaKnowledge(view).enclosed(17)).toBe(false);
  expect(createSeaKnowledge(view).shallowEnclosed(17)).toBe(false);
  expect(createSeaKnowledge(view).basinStatus(17)).toBe('unknown');
});

test('bounded water search exhaustion is uncertainty, including repeated fleet queries', () => {
  const view = chart(128, 128, new Set(Array.from({ length: 16384 }, (_, cell) => cell)));
  const knowledge = createSeaKnowledge(view);
  expect(knowledge.fullyCharted(0)).toBe(false);
  expect(knowledge.expandedNodes).toBe(MAX_WATER_KNOWLEDGE_NODES);
  for (const cell of [129, 1000, 16383]) expect(knowledge.fullyCharted(cell)).toBe(false);
  expect(knowledge.enclosed(65)).toBe(false);
  expect(knowledge.shallowEnclosed(1000)).toBe(false);
  expect(knowledge.separateBasins(0, 16383)).toBe(false);
  expect(knowledge.basinRelation(0, 1)).toBe('connected');
  expect(knowledge.basinRelation(0, 16383)).toBe('unknown');
  expect(knowledge.expandedNodes).toBe(MAX_WATER_KNOWLEDGE_NODES);
});

test('a charted map-edge ocean is not enclosed and an enclosed deep basin is not shallow', () => {
  const view = chart(9, 7, new Set([0, 20, 21]));
  view.cells[21]!.waterDepth = 2;
  const original = structuredClone(view), knowledge = createSeaKnowledge(view);
  expect(knowledge.fullyCharted(0)).toBe(true);
  expect(knowledge.enclosed(0)).toBe(false);
  expect(knowledge.shallowEnclosed(0)).toBe(false);
  expect(knowledge.fullyCharted(20)).toBe(true);
  expect(knowledge.enclosed(21)).toBe(true);
  expect(knowledge.shallowEnclosed(20)).toBe(false);
  expect(knowledge.separateBasins(0, 20)).toBe(true);
  expect(knowledge.expandedNodes).toBe(3);
  expect(view).toEqual(original);
});

test('separation needs a completed component proof, not distant water or an unknown shoreline', () => {
  const view = chart(9, 7, new Set([20, 21, 42, 43]));
  const knowledge = createSeaKnowledge(view);
  expect(knowledge.separateBasins(20, 43)).toBe(true);
  expect(knowledge.separateBasins(43, 20)).toBe(true);
  expect(knowledge.expandedNodes).toBe(2); // The first completed membership proof suffices in either direction.
  expect(knowledge.separateBasins(20, 21)).toBe(false);
  expect(knowledge.separateBasins(20, 20)).toBe(false);
  expect(knowledge.separateBasins(20, 22)).toBe(false); // Land is not a basin.
  expect(knowledge.separateBasins(20, -1)).toBe(false);

  const firstUnknown = { ...view, cells: view.cells.filter(cell => cell.cell !== 22) };
  const oneProof = createSeaKnowledge(firstUnknown);
  expect(oneProof.fullyCharted(20)).toBe(false);
  expect(oneProof.separateBasins(20, 43)).toBe(true); // The other basin supplies the proof.
  const bothUnknown = { ...view, cells: view.cells.filter(cell => cell.cell !== 22 && cell.cell !== 44) };
  expect(createSeaKnowledge(bothUnknown).separateBasins(20, 43)).toBe(false);
  expect(createSeaKnowledge(bothUnknown).basinRelation(20, 43)).toBe('unknown');
});

test('completed membership survives later budget exhaustion without exposing mutable cache objects', () => {
  const water = new Set(Array.from({ length: 16384 }, (_, cell) => cell).filter(cell => cell % 128 > 10));
  water.add(258); // A one-cell enclosed pond, separated from the broad ocean by known land.
  const view = chart(128, 128, water), knowledge = createSeaKnowledge(view);
  expect(knowledge.shallowEnclosed(258)).toBe(true);
  expect(knowledge.fullyCharted(127)).toBe(false);
  expect(knowledge.expandedNodes).toBe(MAX_WATER_KNOWLEDGE_NODES);
  expect(knowledge.separateBasins(127, 258)).toBe(true);
  expect(knowledge.separateBasins(258, 127)).toBe(true);
  expect(knowledge.separateBasins(127, 16383)).toBe(false);
  expect(knowledge.enclosed(258)).toBe(true);
  expect(knowledge.expandedNodes).toBe(MAX_WATER_KNOWLEDGE_NODES);
  expect(Object.values(knowledge).every(value => typeof value === 'function' || typeof value === 'number')).toBe(true);
  const separate = createSeaKnowledge(view);
  expect(separate.expandedNodes).toBe(0); // No persistent/global knowledge cache.
});

test('open-edge and connecting-path proofs stop early, then merge without expanding a cell twice', () => {
  const view = chart(11, 3, new Set(Array.from({ length: 11 }, (_, cell) => cell))), before = structuredClone(view);
  const knowledge = createSeaKnowledge(view);
  expect(knowledge.basinStatus(0)).toBe('open');
  expect(knowledge.expandedNodes).toBe(1);
  expect(knowledge.basinStatus(10)).toBe('open');
  expect(knowledge.expandedNodes).toBe(2);
  expect(knowledge.basinRelation(0, 10)).toBe('connected');
  expect(knowledge.expandedNodes).toBeLessThan(11);
  expect(knowledge.fullyCharted(0)).toBe(true);
  expect(knowledge.expandedNodes).toBe(11);
  for (const cell of [0, 3, 10]) {
    expect(knowledge.basinStatus(cell)).toBe('open');
    expect(knowledge.basinRelation(cell, 10)).toBe('connected');
  }
  expect(knowledge.expandedNodes).toBe(11); expect(view).toEqual(before);
});
