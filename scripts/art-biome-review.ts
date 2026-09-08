/** Review evidence only. Exact original + two candidate/approved variants, never auto-approval. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContactSheet, decodePng, encodePng, paletteSchema, parseAssetManifest, safeAssetPath, sha256, validateAsset, type RgbaImage } from '../packages/art-pipeline/src/index';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = async (path: string) => readFile(await safeAssetPath(root, path));
const biome = process.argv.find(arg => arg.startsWith('--biome='))?.slice(8);
const stage = process.argv.includes('--approved') ? 'approved' : 'candidates';
if (!biome || !['ocean', 'grassland', 'temperate_forest', 'taiga', 'tundra', 'desert', 'steppe', 'marsh', 'rainforest', 'alpine', 'ash_scrub', 'chalkland'].includes(biome)) throw new Error('Choose --biome=<existing biome> [--approved]');
const palette = paletteSchema.parse(JSON.parse((await read('assets/palettes/theandril-master.json')).toString()));
const assets = await Promise.all([0, 1, 2].map(async variant => {
  const id = `terrain.${biome}${variant ? `.variant_${variant}` : ''}`;
  const manifest = parseAssetManifest(JSON.parse((await read(`assets/art/${variant ? stage : 'approved'}/${id}.json`)).toString()));
  if (manifest.id !== id || manifest.status !== (variant && stage === 'candidates' ? 'CANDIDATE' : 'APPROVED')) throw new Error('Wrong lifecycle/identity in review source');
  const frames = await Promise.all(manifest.frames.map(async frame => ({ id: frame.id, image: decodePng(await read(frame.sourcePath)) })));
  const report = validateAsset(manifest, frames, palette);
  if (!report.passed || manifest.status === 'APPROVED' && report.inputHash !== manifest.review?.inputHash) throw new Error('Invalid or stale review pixels');
  return { manifest, frames, report };
}));
const sheet = buildContactSheet(assets, { scale: 1, columns: 3 });
const repeat: RgbaImage = { width: 316, height: 256, data: new Uint8Array(316 * 256 * 4) };
for (let row = 0; row < 5; row++) for (let column = 0; column < 5; column++) {
  // Fixed mixed pattern, not a performance fixture or simulation source.
  const tile = assets[(row * 7 + column * 5 + Math.floor(column / 2)) % 3]!.frames[0]!.image;
  const left = column * 56 + (row % 2) * 28, top = row * 48;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const at = (y * 64 + x) * 4;
    if (tile.data[at + 3]) repeat.data.set(tile.data.subarray(at, at + 4), ((top + y) * repeat.width + left + x) * 4);
  }
}
const base: RgbaImage = { width: 320, height: sheet.height + 8 + repeat.height, data: new Uint8Array(320 * (sheet.height + 8 + repeat.height) * 4) };
for (const [part, top] of [[sheet, 0], [repeat, sheet.height + 8]] as const) for (let y = 0; y < part.height; y++) base.data.set(part.data.subarray(y * part.width * 4, (y + 1) * part.width * 4), ((top + y) * base.width + 2) * 4);
const prefix = `docs/art/reviews/slice21-${biome}-${stage}`;
await mkdir(await safeAssetPath(root, 'docs/art/reviews'), { recursive: true });
const evidence: { path: string; sha256: string }[] = [];
for (const scale of [1, 4]) {
  const enlarged: RgbaImage = { width: base.width * scale, height: base.height * scale, data: new Uint8Array(base.data.length * scale * scale) };
  for (let y = 0; y < enlarged.height; y++) for (let x = 0; x < enlarged.width; x++) {
    const at = (Math.floor(y / scale) * base.width + Math.floor(x / scale)) * 4;
    enlarged.data.set(base.data.subarray(at, at + 4), (y * enlarged.width + x) * 4);
  }
  const path = `${prefix}-${scale}x.png`, bytes = encodePng(enlarged);
  await writeFile(await safeAssetPath(root, path), bytes); evidence.push({ path, sha256: sha256(bytes) });
}
const result = { stage, biome, order: assets.map(({ manifest, report }) => ({ id: manifest.id, inputHash: report.inputHash })), evidence,
  note: 'Original base left, variant1 middle, variant2 right; deterministic mixed repeat below. Nearest integer enlargement. Automated validity is not visual approval or in-game acceptance.' };
await writeFile(await safeAssetPath(root, `${prefix}-order.json`), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
