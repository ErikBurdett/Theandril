import { FACTION_ECOLOGIES } from '@theandril/content';
import { neighbors, type World } from '@theandril/mapgen';

/** Assign cultures to the generator's already spaced, viable candidate sites. */
export function factionStarts(world: World, factionDefinitionIds: readonly string[]): number[] {
  if (world.generatorVersion < 4) return [...world.starts];
  const rings = new Map<number, number[]>();
  for (const start of world.starts) {
    const cells = new Set([start]);
    for (let radius = 0; radius < 2; radius++) for (const cell of [...cells]) for (const next of neighbors(cell, world.width, world.height)) cells.add(next);
    rings.set(start, [...cells]);
  }
  const remaining = new Set(world.starts);
  return factionDefinitionIds.map(id => {
    const ecology = FACTION_ECOLOGIES[id];
    const score = (start: number): number => (rings.get(start) ?? []).reduce((sum, cell) => {
      const biome = world.biome[cell] ?? 0;
      const affinity = ecology?.affinities.find(item => item.biomeId === biome);
      return sum + (affinity ? Object.values(affinity.yields).reduce((a, b) => a + b, 0) : 0);
    }, 0);
    const chosen = [...remaining].sort((a, b) => score(b) - score(a) || a - b)[0];
    if (chosen === undefined) throw new Error('No viable culture start remains.');
    remaining.delete(chosen); return chosen;
  });
}
