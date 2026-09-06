/** Review-only contact sheets from exact durable approvals; never publishes or approves. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContactSheet, decodePng, encodePng, paletteSchema, parseAssetManifest, safeAssetPath, validateAsset, type AssetManifest, type FrameImage, type RgbaImage } from '../packages/art-pipeline/src/index';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async (path: string) => readFile(await safeAssetPath(root, path));
const palette = paletteSchema.parse(JSON.parse((await read('assets/palettes/theandril-master.json')).toString('utf8')));
const sources: { id: string; family: string }[] = JSON.parse((await read('assets/art/source/slice12/generation.json')).toString('utf8'));
if (sources.length !== 37 || new Set(sources.map(source => source.id)).size !== 37) throw new Error('Complete slice12 review requires exactly37 distinct source IDs');
const terrainCandidates = process.argv.includes('--terrain-candidates');
const assets: { manifest: AssetManifest; frames: FrameImage[]; family: string }[] = [];
for (const source of sources.filter(source => !terrainCandidates || source.family === 'terrain').sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
  const manifest = parseAssetManifest(JSON.parse((await read(`assets/art/${terrainCandidates ? 'candidates' : 'approved'}/${source.id}.json`)).toString('utf8')));
  if (manifest.id !== source.id || manifest.status !== (terrainCandidates ? 'CANDIDATE' : 'APPROVED')) throw new Error('Unexpected lifecycle or mismatched source in review pack');
  const frames = await Promise.all(manifest.frames.map(async frame => ({ id: frame.id, image: decodePng(await read(frame.sourcePath)) })));
  const report = validateAsset(manifest, frames, palette);
  if (!report.passed || !terrainCandidates && report.inputHash !== manifest.review?.inputHash) throw new Error(`Invalid pixels or stale approval: ${source.id}`);
  assets.push({ manifest, frames, family: source.family });
}
const groups = [
  { name: 'all', assets, columns: 7 },
  { name: 'iron_covenant', assets: assets.filter(asset => asset.family === 'iron_covenant'), columns: 5 },
  { name: 'sepulchral_synod', assets: assets.filter(asset => asset.family === 'sepulchral_synod'), columns: 5 },
  { name: 'land', assets: assets.filter(asset => asset.family === 'terrain' || asset.family === 'improvement'), columns: 4 },
];
for (const group of terrainCandidates ? [] : groups) {
  const prefix = `assets/art/review-previews/slice12-${group.name}`;
  for (const scale of [1, 4] as const) {
    const path = await safeAssetPath(root, `${prefix}-${scale}x.png`);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, encodePng(buildContactSheet(group.assets, { scale, columns: group.columns })));
  }
  const order = group.assets.map(asset => ({ id: asset.manifest.id, native: asset.manifest.nativeResolution, pivot: asset.manifest.frames[0]!.pivot, inputHash: asset.manifest.review!.inputHash }));
  await writeFile(await safeAssetPath(root, `${prefix}-order.json`), JSON.stringify({ columns: group.columns, assets: order }, null, 2) + '\n');
  console.log(`${prefix}-{1,4}x.png: ${group.assets.length} individually approved assets; not runtime publication.`);
}

// Native pointy-hex spacing matches the Art Lab seam preview, not the fractional world camera.
for (const asset of assets.filter(asset => asset.family === 'terrain')) {
  const tile = asset.frames[0]!.image;
  const repeat: RgbaImage = { width: 316, height: 256, data: new Uint8Array(316 * 256 * 4) };
  for (let row = 0; row < 5; row++) for (let column = 0; column < 5; column++) {
    const left = column * 56 + (row % 2) * 28, top = row * 48;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const from = (y * 64 + x) * 4;
      if (tile.data[from + 3]) repeat.data.set(tile.data.subarray(from, from + 4), ((top + y) * repeat.width + left + x) * 4);
    }
  }
  for (const scale of [1, 4] as const) {
    const image: RgbaImage = { width: repeat.width * scale, height: repeat.height * scale, data: new Uint8Array(repeat.data.length * scale * scale) };
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const from = (Math.floor(y / scale) * repeat.width + Math.floor(x / scale)) * 4;
      image.data.set(repeat.data.subarray(from, from + 4), (y * image.width + x) * 4);
    }
    await writeFile(await safeAssetPath(root, `assets/art/review-previews/slice12-${asset.manifest.id}-repeat-${scale}x.png`), encodePng(image));
  }
}
