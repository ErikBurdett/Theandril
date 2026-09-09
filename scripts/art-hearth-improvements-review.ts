/** Native/enlarged evidence for the exact selected stage. Never approves or publishes art. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContactSheet, decodePng, encodePng, paletteSchema, parseAssetManifest, safeAssetPath, sha256, validateAsset } from '../packages/art-pipeline/src/index';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stage = process.argv.includes('--approved') ? 'approved' : 'candidates';
const names = ['spring_garden', 'polder', 'grove_archive', 'oreworks', 'tide_observatory'];
const palette = paletteSchema.parse(JSON.parse(await readFile(resolve(root, 'assets/palettes/theandril-master.json'), 'utf8')));
const items = [];
const order = [];
for (const name of names) {
  const id = `improvement.${name}`, manifestPath = `assets/art/${stage}/${id}.json`;
  const manifestBytes = await readFile(await safeAssetPath(root, manifestPath)), manifest = parseAssetManifest(JSON.parse(manifestBytes.toString('utf8')));
  if (manifest.id !== id || manifest.frames.length !== 1 || manifest.nativeResolution.width !== 64 || manifest.nativeResolution.height !== 64 || manifest.frames[0]!.pivot.join(',') !== '32,48') throw new Error(`Invalid registered map prop: ${id}`);
  const frameBytes = await readFile(await safeAssetPath(root, manifest.frames[0]!.sourcePath));
  const frames = [{ id: manifest.frames[0]!.id, image: decodePng(frameBytes) }], report = validateAsset(manifest, frames, palette);
  if (!report.passed || (stage === 'approved' && (manifest.status !== 'APPROVED' || manifest.review?.inputHash !== report.inputHash))) throw new Error(`Invalid/stale ${stage} asset: ${id}`);
  items.push({ manifest, frames });
  order.push({ id, manifestPath, manifestHash: sha256(manifestBytes), pngHash: sha256(frameBytes), pixelHash: sha256(frames[0]!.image.data), inputHash: report.inputHash });
}
const directory = `docs/art/reviews/hearth-improvements-${stage}`;
await mkdir(resolve(root, directory), { recursive: true });
const sheets = [];
for (const scale of [1, 4] as const) {
  const png = encodePng(buildContactSheet(items, { scale, columns: 5 })), path = `${directory}/all-${scale}x.png`;
  await writeFile(resolve(root, path), png); sheets.push({ path, sha256: sha256(png) });
}
await writeFile(resolve(root, directory, 'order.json'), JSON.stringify({ stage, note: 'Contact-sheet order is lexical by asset ID: grove archive, oreworks, polder, spring garden, tide observatory. Review generation grants no approval.', assets: order.sort((a, b) => a.id.localeCompare(b.id)), sheets }, null, 2) + '\n');
console.log(`Validated ${items.length} exact ${stage} improvements; 1× and 4× evidence: ${directory}`);
