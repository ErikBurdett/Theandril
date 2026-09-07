/** Read-only batch audit; run from the repository root. Does not approve or publish. */
import { readFile, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { decodePng, sha256, parseAssetManifest, validateAsset, paletteSchema } from '../../../../../packages/art-pipeline/src/index.ts';
import { factionExpansionBatchSchema } from '../../../../../packages/art-pipeline/src/faction-source.ts';

const base = 'assets/art/source/faction-expansion/rimesable';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const batch = factionExpansionBatchSchema.parse(await read(base + '/generation.json'));
const first = factionExpansionBatchSchema.parse(await read(base + '/generation-first-pass.json'));
const palette = paletteSchema.parse(await read('assets/palettes/theandril-master.json'));
const assets = [];
let approvedCount = 0;
for (const source of batch.sources) {
  try { if ((await stat('assets/art/approved/' + source.id + '.json')).isFile()) approvedCount++; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const original = await readFile(source.sourcePath);
  if (sha256(original) !== source.sourceHash) throw Error('Source mismatch ' + source.id);
  const image = decodePng(original);
  let alphaZero = 0;
  for (let index = 3; index < image.data.length; index += 4) if (image.data[index] === 0) alphaZero++;
  const record = await read(base + '/' + source.id + '-v' + source.version + '.json');
  if (sha256(await readFile(record.nativePath)) !== record.nativeHash) throw Error('Native mismatch');
  const candidate = parseAssetManifest(await read('assets/art/candidates/' + source.id + '.json'));
  if (candidate.status !== 'CANDIDATE' || candidate.review !== null || candidate.version !== source.version || candidate.frames.length !== 1 || candidate.frames[0].durationMs !== 250) throw Error('Candidate contract mismatch');
  const frames = await Promise.all(candidate.frames.map(async frame => ({ id: frame.id, image: decodePng(await readFile(frame.sourcePath)) })));
  const validation = validateAsset(candidate, frames, palette);
  const report = await read('assets/art/reports/' + source.id + '.json');
  if (!validation.passed || validation.inputHash !== report.inputHash) throw Error('Validation mismatch ' + source.id);
  const folder = dirname(candidate.frames[0].sourcePath);
  for (const tail of ['editable.aseprite', 'aseprite/sprite.png', 'aseprite/sprite.json']) {
    if (!(await stat(folder + '/' + tail)).isFile()) throw Error('Missing native export');
  }
  assets.push({ id: source.id, version: source.version, sourceHash: source.sourceHash,
    sourceSize: [image.width, image.height], alphaZeroPixels: alphaZero, nativeHash: record.nativeHash,
    processedInputHash: report.inputHash, metrics: report.metrics[0],
    tools: candidate.processing.filter(step => step.tool === 'aseprite' || step.tool === 'spritefusion-pixel-snapper').map(step => ({ tool: step.tool, version: step.version })) });
}
const rejected = first.sources.find(source => source.id === 'settlement.village.sable_steppe');
if (!rejected || sha256(await readFile(rejected.sourcePath)) !== rejected.sourceHash) throw Error('Lost rejected source');
const previews = [];
for (const family of ['rimehorn_clans', 'sable_steppe']) for (const scale of [1, 4]) {
  const path = 'assets/art/review-previews/' + family + '-' + scale + 'x.png';
  previews.push({ path, sha256: sha256(await readFile(path)) });
}
console.log(JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), batchId: batch.batchId,
  activeAssetCount: assets.length,
  originalGenerationCount: new Set([...first.sources, ...batch.sources].map(source => source.sourcePath)).size,
  approvedCount,
  activeSourceHashesUnique: new Set(assets.map(asset => asset.sourceHash)).size,
  allSourcesHaveTrueAlpha: assets.every(asset => asset.alphaZeroPixels > 0), allProcessedChecksPass: true,
  retainedRejectedSource: { id: rejected.id, version: 1, sourceHash: rejected.sourceHash,
    reason: 'Unwanted snow on dry-steppe village; replaced by separately generated version2.' }, previews, assets }, null, 2));
