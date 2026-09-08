import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { describeGeography, generateWorld, inspectV7Climate, isLake, isPassable, neighbors, recommendedFactionCount, type World } from '@theandril/mapgen';

const flags = process.argv.slice(2);
if (flags.some(flag => !['--overview', '--output'].includes(flag))) throw new Error('Usage: node --import tsx scripts/benchmark-inland-seas.ts [--overview | --output]');
const directory = resolve('packages/mapgen/diagnostics'), layouts = ['continents', 'islands', 'archipelago'] as const;
function fingerprint(world: World): string {
  const hash = createHash('sha256');
  for (const values of [world.terrain, world.fertility, world.biome, world.waterDepth, world.hydrology]) hash.update(values);
  return hash.update(JSON.stringify({ seed: world.seed, width: world.width, height: world.height, generatorVersion: world.generatorVersion, layout: world.layout, starts: world.starts })).digest('hex');
}
/** Actual disconnected saltwater components, not counts inferred from intended carving. */
function inlandSeas(world: World) {
  const seen = new Uint8Array(world.terrain.length), queue = new Int32Array(seen.length);
  const bodies: { cells: number; deepCells: number; passableShoreCells: number; broadShoreCells: number }[] = [];
  for (let origin = 0; origin < seen.length; origin++) {
    if (seen[origin] || world.terrain[origin] !== 0 || isLake(world.hydrology[origin]!)) continue;
    let head = 0, tail = 1, edge = false, deepCells = 0; queue[0] = origin; seen[origin] = 1;
    const shore = new Set<number>();
    while (head < tail) {
      const cell = queue[head++]!, x = cell % world.width, y = Math.floor(cell / world.width);
      edge ||= x === 0 || y === 0 || x === world.width - 1 || y === world.height - 1;
      if (world.waterDepth[cell] === 2) deepCells++;
      for (const adjacent of neighbors(cell, world.width, world.height)) {
        if (isPassable(world.terrain[adjacent]!)) shore.add(adjacent);
        if (!seen[adjacent] && world.terrain[adjacent] === 0 && !isLake(world.hydrology[adjacent]!)) { seen[adjacent] = 1; queue[tail++] = adjacent; }
      }
    }
    if (!edge) bodies.push({ cells: tail, deepCells, passableShoreCells: shore.size,
      broadShoreCells: [...shore].filter(cell => neighbors(cell, world.width, world.height).filter(next => isPassable(world.terrain[next]!)).length >= 4).length });
  }
  return bodies.sort((a, b) => b.cells - a.cells || b.deepCells - a.deepCells);
}

if (flags.includes('--overview')) {
  const { encodePng } = await import('../packages/art-pipeline/src/png');
  const palette = [[25,49,65,255],[113,130,76,255],[59,94,63,255],[68,100,94,255],[139,151,141,255],[174,152,101,255],[143,131,82,255],[68,114,96,255],[45,99,71,255],[186,190,180,255],[120,104,90,255],[174,177,147,255]];
  mkdirSync(directory, { recursive: true });
  for (const seed of [42, 74, 20260905]) {
    const width = 1788, height = 700, data = new Uint8Array(width * height * 4), panels = [];
    for (let at = 0; at < data.length; at += 4) data.set([15, 20, 25, 255], at);
    for (const [row, version] of [6, 7].entries()) for (const [column, layout] of layouts.entries()) {
      const world = generateWorld(seed, 'small', 12, version as 6 | 7, { layout });
      const point = (cell: number) => [column * 596 + 2 + Math.round((cell % world.width + (Math.floor(cell / world.width) & 1) / 2) * 2.3), row * 350 + 20 + Math.floor(cell / world.width) * 2] as const;
      const dot = (x: number, y: number, color: number[]) => { if (x >= 0 && y >= 0 && x < width && y < height) data.set(color, (y * width + x) * 4); };
      for (let cell = 0; cell < world.terrain.length; cell++) {
        const [x, y] = point(cell), color = isLake(world.hydrology[cell]!) ? [83,155,180,255]
          : world.terrain[cell] === 0 && world.waterDepth[cell] === 1 ? [43,80,96,255] : palette[world.biome[cell]!]!;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) dot(x + dx, y + dy, color);
      }
      for (const cell of world.starts) {
        const [x, y] = point(cell);
        for (let offset = -3; offset <= 3; offset++) { dot(x + offset, y, [255,229,143,255]); dot(x, y + offset, [255,229,143,255]); }
      }
      panels.push({ row, column, generatorVersion: version, layout, sha256: fingerprint(world), inlandSeas: inlandSeas(world) });
    }
    const basename = `v7-inland-seas-overview-${seed}`;
    writeFileSync(resolve(directory, basename + '.png'), encodePng({ width, height, data }));
    writeFileSync(resolve(directory, basename + '.json'), JSON.stringify({ seed, width, height,
      note: 'Top row preserved generator6; bottom generator7. Left Continents, middle Islands, right Archipelago. Gold crosses starts; shallow saltwater teal, deep saltwater darkblue, freshwater lakes cyan. Code-native diagnostic pixels, not production art or renderer performance evidence.', panels }, null, 2) + '\n');
    console.log(resolve(directory, basename + '.png'));
  }
} else {
  const measurements = [];
  for (const size of ['tiny', 'small', 'huge', 'legendary'] as const) for (const layout of layouts) {
    const factionCount = recommendedFactionCount(size), reference = generateWorld(20260905, size, factionCount, 7, { layout }), sha256 = fingerprint(reference), samplesMs = [];
    for (let sample = 0; sample < 5; sample++) {
      const start = performance.now(), world = generateWorld(20260905, size, factionCount, 7, { layout });
      samplesMs.push(performance.now() - start); assert.equal(fingerprint(world), sha256);
    }
    const prior = generateWorld(20260905, size, factionCount, 6, { layout }), geography = describeGeography(reference), detail = inspectV7Climate(reference);
    assert(geography.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3));
    measurements.push({ size, seed: 20260905, factionCount, sha256, ...geography, inlandSeas: inlandSeas(reference), inlandSeaCarvings: detail.inlandSeaCarvings,
      priorV6: { sha256: fingerprint(prior), landCells: describeGeography(prior).landCells, inlandSeas: inlandSeas(prior) }, samplesMs,
      meanMs: samplesMs.reduce((sum, ms) => sum + ms, 0) / samplesMs.length, medianMs: [...samplesMs].sort((a, b) => a - b)[2], maxMs: Math.max(...samplesMs), deterministicSamples: samplesMs.length });
  }
  const report = { date: new Date().toISOString(), runtime: process.version, cpu: cpus()[0]?.model, logicalCpus: cpus().length, ramBytes: totalmem(), generatorVersion: 7,
    scope: 'Whole warm generation including ordinary allocation/GC, drainage, starts and strict hydrology validation; one reference warmup plus5samples. Hash comparisons, component/depth/shore diagnostics, prior6 generation and regenerated relief are outside timing. No AI/save/archive/browser/mature campaign throughput claim.',
    policy: 'At most3/2/1 basins on Continents/Islands/Archipelago, host-relative target12–18%/8–14%/5–10%, totalexcavationcap3%/2%/1.5% ofmap, at least3original landhexes toexistingwater. Minimumretained macro-land15%, actualfreshlakes countedseparately. Tiny retains6physical carving for48-seat viability. Salt seas are not freshwater lakes; usable shore counts are not guaranteed town foundations.',
    memory: 'canonicalBufferBytes counts the5 canonical Uint8Array buffers only. Final process memory is not a peak or retained-memory measurement.',
    measurements, finalMemory: process.memoryUsage() };
  if (flags.includes('--output')) { mkdirSync(directory, { recursive: true }); writeFileSync(resolve(directory, 'v7-inland-seas.json'), JSON.stringify(report, null, 2) + '\n'); }
  console.log(JSON.stringify(report, null, 2));
}
