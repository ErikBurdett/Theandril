import fc from 'fast-check';
import { expect, test } from 'vitest';
import { describeGeography, directionNeighbor, FEATURE, generateWorld, hydrologyDownstream, isLake, isPassable, naturalFeatures, neighbors,
  riverSize, TERRAIN, validateHydrology, type MapLayout, type World } from './index';

const layouts = ['continents', 'islands', 'archipelago'] as const;
function reachable(world: World, start: number): Set<number> {
  const seen = new Set([start]), queue = [start];
  for (let index = 0; index < queue.length; index++) for (const next of neighbors(queue[index]!, world.width, world.height)) {
    if (!seen.has(next) && isPassable(world.terrain[next]!)) { seen.add(next); queue.push(next); }
  }
  return seen;
}
/** Physical land includes mountains: impassable ridges cannot masquerade as
 * ocean-separated islands in either the proof or the starting-body count. */
function physicalLandmasses(world: World) {
  const labels = new Int32Array(world.terrain.length), sizes = [0];
  for (let cell = 0; cell < labels.length; cell++) {
    if (!world.terrain[cell] || labels[cell]) continue;
    const id = sizes.length, pending = [cell]; labels[cell] = id;
    for (let at = 0; at < pending.length; at++) for (const next of neighbors(pending[at]!, world.width, world.height)) {
      if (world.terrain[next] && !labels[next]) { labels[next] = id; pending.push(next); }
    }
    sizes.push(pending.length);
  }
  return { labels, sizes };
}
function proveTopology(world: World): void {
  expect(() => validateHydrology(world)).not.toThrow();
  const done = new Set<number>(), lakeSeen = new Set<number>();
  expect(world.hydrology.every(value => value < 64)).toBe(true);
  for (let origin = 0; origin < world.terrain.length; origin++) {
    const value = world.hydrology[origin]!;
    if (!value) continue;
    if (!done.has(origin)) {
      const path = new Set<number>(); let cell = origin;
      while (world.hydrology[cell] && !done.has(cell)) {
        expect(path.has(cell)).toBe(false); path.add(cell);
        const next = hydrologyDownstream(cell, world.width, world.height, world.hydrology[cell]!);
        expect(next).not.toBeNull(); expect(neighbors(cell, world.width, world.height)).toContain(next);
        cell = next!;
      }
      if (!done.has(cell)) { expect(world.terrain[cell]).toBe(TERRAIN.water); expect(isLake(world.hydrology[cell]!)).toBe(false); }
      for (const visited of path) done.add(visited);
    }
    if (isLake(value) && !lakeSeen.has(origin)) {
      const lake = new Set([origin]), queue = [origin]; lakeSeen.add(origin);
      for (let index = 0; index < queue.length; index++) for (const next of neighbors(queue[index]!, world.width, world.height)) {
        if (isLake(world.hydrology[next]!) && !lakeSeen.has(next)) { lake.add(next); lakeSeen.add(next); queue.push(next); }
      }
      let outlets = 0, upland = false;
      for (const cell of lake) {
        expect(world.terrain[cell]).toBe(TERRAIN.water); expect(world.waterDepth[cell]).toBe(1); expect(riverSize(world.hydrology[cell]!)).toBe(0);
        const downstream = hydrologyDownstream(cell, world.width, world.height, world.hydrology[cell]!)!;
        if (!lake.has(downstream)) { outlets++; expect(riverSize(world.hydrology[downstream]!)).toBeGreaterThan(0); }
        for (const neighbor of neighbors(cell, world.width, world.height)) if (!lake.has(neighbor)) {
          expect(world.terrain[neighbor]).not.toBe(TERRAIN.water);
          if (world.terrain[neighbor] === TERRAIN.hills || world.terrain[neighbor] === TERRAIN.mountain) upland = true;
        }
      }
      expect(lake.size).toBeGreaterThanOrEqual(3); expect(outlets).toBe(1); expect(upland).toBe(true);
    }
  }
}

test('fixed compass positions agree with odd-row neighbors without compact-index ambiguity', () => {
  for (let cell = 0; cell < 35; cell++) {
    const fixed = Array.from({ length: 6 }, (_, index) => directionNeighbor(cell, 7, 5, index + 1)).filter(next => next !== null);
    expect(fixed).toEqual(neighbors(cell, 7, 5));
  }
  expect(directionNeighbor(0, 7, 5, 6)).toBeNull(); expect(directionNeighbor(0, 7, 5, 0)).toBeNull();
});

// Byte-exact generator5 worlds (Tiny/Small/Standard) are sealed in historical-seals.test.ts.
test.each(layouts)('%s preserves hydrology topology and viable distributed starts across seeds', layout => {
  fc.assert(fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), fc.integer({ min: 1, max: 48 }), (seed, factions) => {
    const world = generateWorld(seed, 'tiny', factions, 5, { layout }), report = describeGeography(world);
    expect(world.generatorVersion).toBe(5); expect(world.layout).toBe(layout);
    expect(new Set(world.starts).size).toBe(factions);
    expect(report.landCells / report.cells).toBeGreaterThan(.23); expect(report.landCells / report.cells).toBeLessThan(.78);
    expect(report.riverCells).toBeGreaterThan(0);
    expect(report.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3)).toBe(true);
    for (const start of world.starts) {
      expect(isPassable(world.terrain[start]!)).toBe(true); expect(world.fertility[start]).toBeGreaterThanOrEqual(75);
      const access = neighbors(start, world.width, world.height).filter(cell => isPassable(world.terrain[cell]!));
      expect(access.length).toBeGreaterThanOrEqual(4); expect(access.some(cell => world.fertility[cell]! >= 70)).toBe(true);
      const region = reachable(world, start);
      expect([...region].some(cell => neighbors(cell, world.width, world.height).some(next => world.terrain[next] === 0 && !isLake(world.hydrology[next]!)))).toBe(true);
    }
    proveTopology(world);
  }), { numRuns: 12, seed: 20260907 });
});

test.each(['pangaea', 'fractal', 'inland-sea', 'earthlike'] as const)('generator8 %s keeps real mountain lakes, single-outlet lakes and sea-bound rivers', layout => {
  const world = generateWorld(20260905, 'small', 8, 8, { layout }), report = describeGeography(world);
  expect(report.lakeBodies).toBeGreaterThan(0); expect(report.riverCells).toBeGreaterThan(0);
  proveTopology(world);
});

test.each([13, 57, 116])('dense Tiny archipelago seed%s retains 48 actual viable starts', seed => {
  const world = generateWorld(seed, 'tiny', 48, 5, { layout: 'archipelago' }), report = describeGeography(world);
  expect(world.starts).toHaveLength(48); expect(new Set(world.starts).size).toBe(48);
  expect(report.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3)).toBe(true);
});

test('Tiny archipelagos remain physically separated at four seats and at the full48-seat density', () => {
  const prove = (seed: number) => {
    for (const factions of [4, 48]) {
      const world = generateWorld(seed, 'tiny', factions, 5, { layout: 'archipelago' });
      const physical = physicalLandmasses(world), report = describeGeography(world);
      expect(physical.sizes.filter(size => size >= 24).length).toBeGreaterThanOrEqual(3);
      expect(new Set(world.starts.map(cell => physical.labels[cell])).size).toBeGreaterThanOrEqual(3);
      expect(world.starts).toHaveLength(factions); expect(new Set(world.starts).size).toBe(factions);
      expect(report.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3)).toBe(true);
      for (const start of world.starts) {
        expect(world.fertility[start]).toBeGreaterThanOrEqual(75);
        expect(physical.sizes[physical.labels[start]!]).toBeGreaterThanOrEqual(24);
      }
      proveTopology(world);
    }
  };
  // Seed74 previously fused all eight plate lobes into one654-cell mainland.
  // Earlier dense-seat failures stay in the corpus, alongside full-range seeds.
  for (const seed of [0, 13, 57, 74, 116, 20260905, 0xffff_ffff]) prove(seed);
  fc.assert(fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), prove), { numRuns: 16, seed: 20260907 });
});

test('modern fresh water provides the existing spring feature without altering legacy worlds or cultivated biome labels', () => {
  const world = generateWorld(20260905, 'tiny', 4), old = generateWorld(20260905, 'tiny', 4, 4);
  const source = Array.from(world.terrain.keys()).find(cell => isPassable(world.terrain[cell]!) && riverSize(world.hydrology[cell]!))!;
  expect(naturalFeatures(world, source) & FEATURE.spring).toBe(FEATURE.spring);
  const before = naturalFeatures(world, source); world.biome.fill(11); expect(naturalFeatures(world, source)).toBe(before);
  old.hydrology.fill(9); expect(naturalFeatures(old, source)).toBe(naturalFeatures(generateWorld(20260905, 'tiny', 4, 4), source));
});

test('rejects malformed, looping, dead-ended and nonlocal hydrology before canonical use', () => {
  const terrain = new Uint8Array(25), hydrology = new Uint8Array(25), world = { width: 5, height: 5, terrain, hydrology };
  terrain[12] = 1; hydrology[12] = 9; expect(() => validateHydrology(world)).not.toThrow();
  for (const invalid of [7, 8, 32, 64, 255]) { hydrology[12] = invalid; expect(() => validateHydrology(world)).toThrow(RangeError); }
  hydrology[12] = 9; terrain[13] = 1; expect(() => validateHydrology(world)).toThrow('broken outlet');
  hydrology[13] = 12; expect(() => validateHydrology(world)).toThrow('cycle');
  hydrology[13] = 0; terrain[13] = 0; hydrology[12] = 17; expect(() => validateHydrology(world)).not.toThrow();
  expect(() => validateHydrology({ ...world, hydrology: new Uint8Array(24) })).toThrow(RangeError);
  expect(() => generateWorld(1, 'tiny', 4, 4, { layout: 'islands' })).toThrow('Historical');
  expect(() => generateWorld(1, 'tiny', 4, 5, { layout: 'bad' as Exclude<MapLayout, 'legacy'> })).toThrow('layout');
  expect(() => generateWorld(1, 'tiny', 4, 5, [] as never)).toThrow('layout');
});

test('validates one inland spill for an entire connected lake body, not just acyclic cell paths', () => {
  const terrain = new Uint8Array(49).fill(1), hydrology = new Uint8Array(49);
  terrain[24] = 0; terrain[25] = 0; terrain[27] = 0;
  hydrology[24] = 33; hydrology[25] = 33; hydrology[26] = 9;
  const world = { width: 7, height: 7, terrain, hydrology };
  expect(() => validateHydrology(world)).not.toThrow();
  const before = structuredClone(world); validateHydrology(world); expect(world).toEqual(before);
  // Both cell chains terminate safely at sea, but the connected lake now has
  // two independent exits; acyclicity alone used to accept this malformed body.
  hydrology[24] = 37; hydrology[17] = 9; hydrology[18] = 9; hydrology[19] = 9; terrain[20] = 0;
  expect(() => validateHydrology(world)).toThrow('exactly one spill outlet');
  hydrology[24] = 33; hydrology[17] = 0; hydrology[18] = 0; hydrology[19] = 0; terrain[20] = 1;
  terrain[23] = 0; expect(() => validateHydrology(world)).toThrow('not inland');
  const edge = { width: 7, height: 7, terrain: new Uint8Array(49).fill(1), hydrology: new Uint8Array(49) };
  edge.terrain[21] = 0; edge.hydrology[21] = 33; edge.hydrology[22] = 9; edge.terrain[23] = 0;
  expect(() => validateHydrology(edge)).toThrow('not inland');
});
