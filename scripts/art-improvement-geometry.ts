/** Offline union measurements from exact approvals and atlas pixels; never edits artwork. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILDINGS, IMPROVEMENTS, RESOURCES } from '../packages/content/src/index';
import { cropImage, decodePng, parseAssetManifest, parseRuntimeCatalog, sha256, validateAsset } from '../packages/art-pipeline/src/index';
import { measureOpaqueGeometry } from '../packages/render/src/tile-footprint';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = parseRuntimeCatalog(JSON.parse(await readFile(resolve(root, 'assets/art/runtime/catalog.json'), 'utf8')));
const ids = [...RESOURCES, ...IMPROVEMENTS, ...(process.argv.includes('--improvements-only') ? [] : BUILDINGS)].map(item => item.id).sort();
const records: Record<string, unknown> = {};
const images = new Map<string, ReturnType<typeof decodePng>>();
for (const id of ids) {
  const asset = catalog.assets.find(asset => asset.id === id);
  if (!asset) throw new Error(`Missing approved map artwork: ${id}`);
  const page = catalog.atlases.find(page => page.id === asset.atlasId)!;
  let image = images.get(page.id);
  if (!image) {
    const png = await readFile(resolve(root, 'assets/art/runtime', page.imageUrl.split('/').at(-1)!));
    if (sha256(png) !== page.sha256) throw new Error(`Atlas hash mismatch: ${page.id}`);
    image = decodePng(png); images.set(page.id, image);
  }
  const manifest = parseAssetManifest(JSON.parse(await readFile(resolve(root, `assets/art/approved/${id}.json`), 'utf8')));
  const frames = await Promise.all(manifest.frames.map(async frame => ({ id: frame.id, image: decodePng(await readFile(resolve(root, frame.sourcePath))) })));
  const report = validateAsset(manifest, frames, catalog.palette);
  if (!report.passed || report.inputHash !== asset.review.inputHash || manifest.review?.inputHash !== report.inputHash) throw new Error(`Stale approval: ${id}`);
  for (const frame of asset.frames) {
    const approved = frames.find(item => item.id === frame.id);
    if (!approved || sha256(cropImage(image, frame.frame).data) !== sha256(approved.image.data)) throw new Error(`Published pixels differ: ${frame.id}`);
  }
  records[id] = { approvalHash: asset.review.inputHash, atlasId: page.id, atlasHash: page.sha256, native: [asset.nativeResolution.width, asset.nativeResolution.height], pivot: asset.pivot,
    frames: asset.frames.map(frame => [frame.id, frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h]), geometry: measureOpaqueGeometry(frames.map(frame => frame.image)) };
}
const path = resolve(root, 'packages/render/src/improvement-geometry-data.json');
await mkdir(dirname(path), { recursive: true });
await writeFile(path, JSON.stringify({ schemaVersion: 1, assets: records }, null, 2) + '\n');
console.log(`Measured exact opaque-frame unions for ${ids.length} approved improvement/civic assets.`);
