import { beforeAll, describe, expect, it } from 'vitest';
import { generateWorld, neighbors, TERRAIN, type World } from '@theandril/mapgen';
import type { Observation } from '@theandril/sim';
import { createSeaKnowledge, MAX_WATER_KNOWLEDGE_NODES } from './sea-knowledge';

const seaCenter = 11145, outerOcean = 0;
let world: World, basin: Set<number>, shore: Set<number>, chart: Pick<Observation, 'width' | 'height' | 'cells'>;
beforeAll(() => {
  world = generateWorld(20260905, 'small', 12, 7, { layout: 'continents' });
  // Canonical traversal is an independent TEST oracle. The helper receives only
  // the explicit observed-cell chart below, never this world or component set.
  basin = new Set([seaCenter]); shore = new Set();
  const queue = [seaCenter];
  for (let at = 0; at < queue.length; at++) for (const adjacent of neighbors(queue[at]!, world.width, world.height)) {
    if (world.terrain[adjacent] !== TERRAIN.water) { shore.add(adjacent); continue; }
    if (!basin.has(adjacent)) { basin.add(adjacent); queue.push(adjacent); }
  }
  chart = { width: world.width, height: world.height, cells: [...basin, ...shore, outerOcean].sort((a, b) => a - b).map(cell => ({
    cell, terrain: world.terrain[cell]!, biome: world.biome[cell]!, waterDepth: world.waterDepth[cell]!, fertility: world.fertility[cell]!, visible: false,
  })) };
});

describe('actual generator7 inland-sea knowledge, not an authored voyage or omniscient planner', () => {
  it('proves the 1074-cell salt sea enclosed using the whole known boundary beyond the old1024 cap', () => {
    expect(basin.size).toBe(1074); expect(basin.has(outerOcean)).toBe(false);
    expect(world.waterDepth[seaCenter]).toBe(2);
    const before = structuredClone(chart), knowledge = createSeaKnowledge(chart);
    expect(knowledge.nodeBudget).toBe(Math.min(MAX_WATER_KNOWLEDGE_NODES, Math.max(1024, chart.cells.length)));
    expect(knowledge.basinStatus(seaCenter)).toBe('enclosed');
    expect(knowledge.expandedNodes).toBe(basin.size);
    const otherShoreWater = [...basin].at(-1)!;
    expect(knowledge.basinRelation(seaCenter, otherShoreWater)).toBe('connected');
    expect(knowledge.basinRelation(seaCenter, outerOcean)).toBe('separate');
    expect(knowledge.basinRelation(outerOcean, seaCenter)).toBe('separate');
    expect(knowledge.fullyCharted(otherShoreWater)).toBe(true);
    expect(knowledge.enclosed(otherShoreWater)).toBe(true);
    expect(knowledge.shallowEnclosed(otherShoreWater)).toBe(false);
    expect(knowledge.expandedNodes).toBe(basin.size);
    expect(chart).toEqual(before);
    expect(createSeaKnowledge(chart).expandedNodes).toBe(0);
  });
  it('does not treat an unseen shoreline as closed or an unproved remote ocean as connected', () => {
    const omitted = [...shore][0]!, partial = { ...chart, cells: chart.cells.filter(cell => cell.cell !== omitted) };
    const before = structuredClone(partial), knowledge = createSeaKnowledge(partial);
    expect(knowledge.basinStatus(seaCenter)).toBe('unknown');
    expect(knowledge.fullyCharted(seaCenter)).toBe(false);
    expect(knowledge.enclosed(seaCenter)).toBe(false);
    expect(knowledge.shallowEnclosed(seaCenter)).toBe(false);
    expect(knowledge.basinRelation(seaCenter, outerOcean)).toBe('unknown');
    expect(knowledge.separateBasins(seaCenter, outerOcean)).toBe(false);
    // The map-edge cell is positive open-ocean evidence, even though its other
    // boundaries remain unknown. It does not prove any route from the salt sea.
    expect(knowledge.basinStatus(outerOcean)).toBe('open');
    const expanded = knowledge.expandedNodes;
    for (let repeat = 0; repeat < 8; repeat++) {
      expect(knowledge.basinRelation(outerOcean, seaCenter)).toBe('unknown');
      expect(knowledge.basinStatus(seaCenter)).toBe('unknown');
    }
    expect(expanded).toBe(basin.size + 1); expect(knowledge.expandedNodes).toBe(expanded);
    expect(knowledge.expandedNodes).toBeLessThanOrEqual(knowledge.nodeBudget);
    expect(partial).toEqual(before);
  });
});
