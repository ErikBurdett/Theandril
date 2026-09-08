import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { describeGeography, generateWorld, geographicDiversity, inspectV6Climate, hydrologyDownstream, isLake, recommendedFactionCount, riverSize, validateHydrology, type World } from '@theandril/mapgen';

const layouts = ['continents', 'islands', 'archipelago'] as const;
const flags = process.argv.slice(2);
if (flags.some(flag => !['--overview', '--output', '--tiny', '--final', '--v6'].includes(flag))) throw new Error('Usage: node --import tsx scripts/benchmark-world-geography.ts [--overview] [--output] [--tiny | --final] [--v6]');
const tinyRevision = flags.includes('--tiny');
const finalRevision = flags.includes('--final');
const version = flags.includes('--v6') ? 6 : 5;
if (version === 6 && finalRevision) throw new Error('--final belongs to retained generator5 evidence; use --v6 --output for new evidence.');
if (finalRevision && (tinyRevision || flags.includes('--overview'))) throw new Error('--final measures all12 cases; do not combine it with --tiny or --overview.');
const directory = resolve('packages/mapgen/diagnostics');
const fingerprint = (world: World) => {
  const hash = createHash('sha256');
  for (const values of [world.terrain, world.fertility, world.biome, world.waterDepth, world.hydrology]) hash.update(values);
  return hash.update(JSON.stringify({ seed: world.seed, width: world.width, height: world.height, generatorVersion: world.generatorVersion, layout: world.layout, starts: world.starts })).digest('hex');
};

if (flags.includes('--overview')) {
  // Diagnostic pixels, not production artwork or renderer performance evidence.
  const { encodePng } = await import('../packages/art-pipeline/src/png');
  mkdirSync(directory, { recursive: true });
  const paths = [];
  for (const seed of [42, 74, 20260905]) {
    const worlds = layouts.map(layout => generateWorld(seed, tinyRevision ? 'tiny' : 'small', tinyRevision ? 4 : 12, version, { layout }));
    const panelWidth = tinyRevision ? 120 : 596, panelHeight = tinyRevision ? 94 : 424, width = panelWidth * 3, height = panelHeight;
    const data = new Uint8Array(width * height * 4);
    for (let index = 0; index < data.length; index += 4) data.set([15, 20, 25, 255], index);
    const dot = (x: number, y: number, color: readonly number[], radius = 0) => {
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) data.set(color, (ny * width + nx) * 4);
      }
    };
    const line = (ax: number, ay: number, bx: number, by: number, color: readonly number[], radius = 0) => {
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let step = 0; step <= steps; step++) dot(Math.round(ax + (bx - ax) * step / Math.max(1, steps)), Math.round(ay + (by - ay) * step / Math.max(1, steps)), color, radius);
    };
    const palette = [[25,49,65,255],[113,130,76,255],[59,94,63,255],[68,100,94,255],[139,151,141,255],[174,152,101,255],[143,131,82,255],[68,114,96,255],[45,99,71,255],[186,190,180,255],[120,104,90,255],[174,177,147,255]];
    const metadata = worlds.map((world, panel) => {
      const point = (cell: number): [number, number] => [panel * panelWidth + 2 + Math.round((cell % world.width + (Math.floor(cell / world.width) & 1) / 2) * 2.3), 24 + Math.floor(cell / world.width) * 2];
      for (let cell = 0; cell < world.terrain.length; cell++) {
        const [x, y] = point(cell);
        const color = isLake(world.hydrology[cell]!) ? [83,155,180,255] : world.terrain[cell] === 0 && world.waterDepth[cell] === 1 ? [43,80,96,255] : palette[world.biome[cell]!]!;
        dot(x, y, color, 1);
      }
      for (let cell = 0; cell < world.terrain.length; cell++) if (riverSize(world.hydrology[cell]!)) {
        const next = hydrologyDownstream(cell, world.width, world.height, world.hydrology[cell]!)!;
        line(...point(cell), ...point(next), [72,151,177,255]);
      }
      for (const start of world.starts) {
        const [x, y] = point(start); line(x - 3, y, x + 3, y, [255,229,143,255]); line(x, y - 3, x, y + 3, [255,229,143,255]);
      }
      // Corner pips index the layout; textual labels/seeds are in the companion JSON.
      for (let pip = 0; pip <= panel; pip++) dot(panel * panelWidth + 10 + pip * 10, 10, [226,206,164,255], 2);
      return { panel: panel + 1, sha256: fingerprint(world), ...describeGeography(world), ...(version === 6 ? geographicDiversity(world) : {}) };
    });
    // Keep compact-world cells at the same original diagnostic sampling, then
    // integer-enlarge the complete overview so its sea straits remain inspectable.
    const scale = tinyRevision ? 4 : 1, expanded = tinyRevision ? new Uint8Array(data.length * scale * scale) : data;
    if (tinyRevision) for (let y = 0; y < height * scale; y++) for (let x = 0; x < width * scale; x++) {
      const source = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 4;
      expanded.set(data.subarray(source, source + 4), (y * width * scale + x) * 4);
    }
    const basename = `v${version}-${tinyRevision ? 'tiny-' : ''}overview-${seed}`, path = resolve(directory, basename + '.png');
    writeFileSync(path, encodePng({ width: width * scale, height: height * scale, data: expanded }));
    writeFileSync(resolve(directory, basename + '.json'), JSON.stringify({ generatorVersion: version, seed, width: width * scale, height: height * scale, note: 'Code-native odd-row overview: left continents, middle islands, right archipelago. Gold crosses are starts; cyan lines rivers, light blue upland lakes. Not live renderer/art approval evidence.', panels: metadata }, null, 2) + '\n');
    paths.push(path);
  }
  console.log(JSON.stringify({ overviews: paths }, null, 2));
} else {
  const measurements = [];
  const provisional = finalRevision ? JSON.parse(readFileSync(resolve(directory, 'v5-geography-benchmark.json'), 'utf8')) as { measurements: { size: string; layout: string; sha256: string }[] } : null;
  let unchangedProvisionalCases = 0;
  for (const size of tinyRevision ? ['tiny'] as const : ['tiny', 'small', 'huge', 'legendary'] as const) for (const layout of tinyRevision && version === 5 ? ['archipelago'] as const : layouts) {
    const factionCount = recommendedFactionCount(size), reference = generateWorld(20260905, size, factionCount, version, { layout }), hash = fingerprint(reference), times: number[] = [];
    if (provisional && !(size === 'tiny' && layout === 'archipelago')) {
      const earlier = provisional.measurements.find(item => item.size === size && item.layout === layout);
      assert.equal(hash, earlier?.sha256, `${size}/${layout} must retain exact pre-Tiny-correction geography`); unchangedProvisionalCases++;
    }
    for (let sample = 0; sample < 5; sample++) {
      const start = performance.now(), world = generateWorld(20260905, size, factionCount, version, { layout });
      times.push(performance.now() - start);
      assert.equal(fingerprint(world), hash); validateHydrology(world);
    }
    const start = performance.now(), geography = describeGeography(reference), describeMs = performance.now() - start;
    assert.equal(geography.startingRegions.length, factionCount);
    assert(geography.startingRegions.every(region => region.passableCells >= 24 && region.freshwaterWithin3));
    const sorted = [...times].sort((a, b) => a - b);
    const climate = version === 6 ? inspectV6Climate(reference) : null;
    measurements.push({ size, seed: 20260905, factionCount, ...geography,
      ...(version === 6 ? { diversity: geographicDiversity(reference), priorV5: (() => { const prior = generateWorld(20260905, size, factionCount, 5, { layout }); return { sha256: fingerprint(prior), ...describeGeography(prior), diversity: geographicDiversity(prior) }; })(),
        climate: { prevailingWind: climate!.prevailingWind, leewardLandCells: climate!.rainShadow.reduce((sum, value) => sum + Number(value > 0), 0),
          freshwaterLandCellsWithin2: climate!.freshwaterDistance.reduce((sum, value, cell) => sum + Number(value < 3 && reference.terrain[cell] !== 0), 0) } } : {}), samplesMs: times,
      meanMs: times.reduce((a, b) => a + b, 0) / times.length, medianMs: sorted[2]!, maxMs: sorted.at(-1)!, describeMs,
      sha256: hash, deterministicSamples: times.length, topologyValidated: true });
  }
  const report = { date: new Date().toISOString(), runtime: process.version, cpu: cpus()[0]?.model, logicalCpus: cpus().length, ramBytes: totalmem(), generatorVersion: version,
    scope: 'Warm whole generation, one reference warmup + five timed samples per preset/layout, normal allocation/GC included. Generation includes drainage, viable starts and hydrology validation. SHA256/equality, second validation and detached geography descriptions occur outside generation timing. No simulation/AI, save/archive, renderer/browser or mature campaign throughput claim.',
    ...(tinyRevision ? { revision: 'Pre-release generator5 Tiny archipelago sea-strait correction. Supersedes only the provisional Tiny archipelago geometry in v5-geography-benchmark.json; original evidence is retained. Larger-size geometry is unchanged. Lake-body validation is now stricter for every size.' } : {}),
    ...(finalRevision ? { revision: 'Final generator5 after Tiny archipelago sea-strait correction and strengthened inland/single-spill lake validation. These measured timings supersede all12 provisional timing cases in v5-geography-benchmark.json, which remains retained as draft evidence.', unchangedProvisionalGeographyCases: unchangedProvisionalCases } : {}),
    ...(version === 6 ? { revision: 'Generator6 adds asymmetric branching plate outlines, offshore groups, additional eligible enclosed seas/lakes, graded spine saddles, layout-scaled real major catchments and hydrology/elevation/wind-aware biome classification. Played generator5 and its retained evidence are unchanged. V5 comparisons and all climate/diversity diagnostics are outside timing.',
      biomeAgreementSampling: 'landBiomeNeighborAgreement samples east-west same-row non-water pairs only, excluding row wraps; not all six hex neighbors. Matching and sampled edge counts accompany new diagnostic output.' } : {}),
    memory: 'canonicalBufferBytes counts five actual owned Uint8Array buffers only. Final process memory is not peak or retained-memory evidence; transient elevation/drainage/component arrays are excluded from this canonical count.',
    measurements, finalMemory: process.memoryUsage() };
  if (flags.includes('--output')) { mkdirSync(directory, { recursive: true }); writeFileSync(resolve(directory, version === 6 ? tinyRevision ? 'v6-tiny-geography-climate.json' : 'v6-geography-climate.json' : finalRevision ? 'v5-geography-final.json' : tinyRevision ? 'v5-tiny-archipelago-revision.json' : 'v5-geography-benchmark.json'), JSON.stringify(report, null, 2) + '\n'); }
  console.log(JSON.stringify(report, null, 2));
}
