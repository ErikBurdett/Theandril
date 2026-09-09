/** Offline compiler measurements only; no approvals, provider calls, public writes or renderer/FPS claims. */
import { readFile } from 'node:fs/promises';
import { writeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { assetManifestSchema, buildAtlas, cacheKey, decodePng, parseRuntimeCatalog, safeAssetPath, sha256, validateAsset, type FrameImage } from '../packages/art-pipeline/src/index';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async (path: string) => readFile(await safeAssetPath(root, path));
const catalog = parseRuntimeCatalog(JSON.parse((await read('assets/art/runtime/catalog.json')).toString()));
const inputs = await Promise.all(catalog.assets.map(async (asset) => {
  const manifest = assetManifestSchema.parse(JSON.parse((await read(`assets/art/approved/${asset.id}.json`)).toString()));
  const frames: FrameImage[] = await Promise.all(manifest.frames.map(async (frame) => ({ id: frame.id, image: decodePng(await read(frame.sourcePath)) })));
  return { manifest, frames };
}));
if (!inputs.length) throw new Error('An approved published pack is required; this benchmark never creates approvals');
function measure<T>(run: () => T, iterations = 7): { medianMs: number; p95Ms: number; minMs: number; maxMs: number; iterations: number; result: T } {
  const times: number[] = [];
  let result = run(); // Warm runtime code; this is not a cold-tool or cold-filesystem measurement.
  for (let index = 0; index < iterations; index++) { const start = performance.now(); result = run(); times.push(performance.now() - start); }
  times.sort((a, b) => a - b);
  return { medianMs: times[Math.floor(times.length / 2)]!, p95Ms: times[Math.ceil(times.length * 0.95) - 1]!, minMs: times[0]!, maxMs: times.at(-1)!, iterations, result };
}
function withoutResult<T>({ result: _result, ...summary }: ReturnType<typeof measure<T>>) { void _result; return summary; }
const validate = measure(() => {
  let frames = 0;
  for (const item of inputs) { const report = validateAsset(item.manifest, item.frames, catalog.palette); if (!report.passed || report.inputHash !== item.manifest.review!.inputHash) throw new Error(`Stale approved benchmark input: ${item.manifest.id}`); frames += item.frames.length; }
  return frames;
});
const pages = [];
for (const page of catalog.atlases) {
  const png = await read(`assets/art/runtime/${page.imageUrl.split('/').at(-1)!}`);
  const selected = inputs.filter((item) => catalog.assets.find((asset) => asset.id === item.manifest.id)!.atlasId === page.id);
  if (page.width !== page.height || ![512, 1024, 2048].includes(page.width)) throw new Error('Benchmark supports current square compiler pages only');
  const options = { id: page.id, pageSize: page.width === 512 ? 512 as const : page.width === 1024 ? 1024 as const : 2048 as const, imageUrl: page.imageUrl, jsonUrl: page.jsonUrl, palette: catalog.palette };
  const build = measure(() => buildAtlas(selected, options));
  const reversed = buildAtlas([...selected].reverse(), options);
  if (sha256(build.result.png) !== page.sha256 || sha256(reversed.png) !== page.sha256 || cacheKey(build.result.catalog) !== cacheKey(reversed.catalog)) throw new Error('Published atlas/reversed input mismatch');
  const decode = measure(() => decodePng(png));
  pages.push({ id: page.id, width: page.width, height: page.height, pngBytes: png.length, rgbaBytes: page.width * page.height * 4, pngHash: page.sha256, build: withoutResult(build), decode: withoutResult(decode) });
}
const base = inputs.find((item) => item.manifest.id === 'unit.guard') ?? inputs[0]!;
const syntheticFrames: FrameImage[] = Array.from({ length: 1000 }, (_, index) => ({ id: `benchmark.guard/idle/se/${index}`, image: base.frames[index % base.frames.length]!.image }));
const synthetic = assetManifestSchema.parse({ ...base.manifest, id: 'benchmark.guard', status: 'CANDIDATE', contentIds: ['benchmark.guard'], review: null, validation: null, frames: syntheticFrames.map((frame, index) => ({ ...base.manifest.frames[index % base.manifest.frames.length]!, id: frame.id, index, direction: 'se', state: 'idle', durationMs: 250 })), animation: { states: { idle: { frames: 1000, fps: 4, loop: true } } }, constraints: { ...base.manifest.constraints, requireMotion: base.frames.length > 1 } });
const largeValidation = measure(() => validateAsset(synthetic, syntheticFrames, catalog.palette), 5);
if (!largeValidation.result.passed || synthetic.status !== 'CANDIDATE' || synthetic.review !== null) throw new Error('Synthetic validation benchmark violated candidate boundary');
writeSync(1, JSON.stringify({ workload: 'Offline art compilation; warm code/data, filesystem reads excluded. Not renderer performance.', approvedAssets: inputs.length, publishedFrames: validate.result, validation: withoutResult(validate), pages, syntheticValidation: { description: '1,000 in-memory frame references repeating approved source pixels with distinct test IDs; not new production artwork or approval.', frames: syntheticFrames.length, processedPixelBytes: syntheticFrames.reduce((sum, frame) => sum + frame.image.data.length, 0), status: synthetic.status, timing: withoutResult(largeValidation) }, peakResidentMiB: process.resourceUsage().maxRSS / 1024 }, null, 2) + '\n');
