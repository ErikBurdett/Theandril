/** Dry-run by default. Imports genuine poses; never generates, activates, approves or publishes art. */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { animationSourceIndexSchema, prepareAnimationSource, scoutIdleRecipe } from '../packages/art-pipeline/src/animation-source';
import { decodePng } from '../packages/art-pipeline/src/png';
import { paletteSchema } from '../packages/art-pipeline/src/runtime';
import { parseAssetManifest } from '../packages/art-pipeline/src/schema';
import { cacheKey, safeAssetPath, sha256 } from '../packages/art-pipeline/src/provenance';
import { validateAsset } from '../packages/art-pipeline/src/validation';

const metadataPath = 'assets/art/source/animations/unit.scout.ashen_compact-idle-generation.json';
const referencePath = 'assets/art/approved/unit.scout.ashen_compact/829619119f8ac12e03c4f8b5ad35636a7a53063cfbeb0bd74272fb4bd8418d4b/frame-0.png';
const referenceHash = 'e84206034bf22e6ea66b4c9ec956c8c4e581d112a4a519b58949de7e07a083ec';
const sourceHash = '8a7435f320b5b884be400cd574dbfdc9864cf78f2c91540116f899d4d7daebe4';
const toolPaths = ['scripts/art-animation-source.ts', 'packages/art-pipeline/src/animation-source.ts', 'packages/art-pipeline/src/png.ts', 'packages/art-pipeline/src/palette.ts', 'packages/art-pipeline/src/provenance.ts'];
const codeRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = (value: unknown) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const absent = (error: unknown) => error instanceof Error && 'code' in error && error.code === 'ENOENT';

export async function prepareScoutAnimation(root: string, write = false) {
  const read = async (path: string) => {
    const resolved = await safeAssetPath(root, path), info = await stat(resolved);
    if (!info.isFile() || info.size > 64 * 1024 * 1024) throw new Error('Animation input exceeds file size bound');
    return readFile(resolved);
  };
  const metadataBytes = await read(metadataPath), sourceIndex = animationSourceIndexSchema.parse(JSON.parse(metadataBytes.toString()));
  const selected = sourceIndex.generations[1]!;
  if (selected.sha256 !== sourceHash || sourceIndex.reference.path !== referencePath || sourceIndex.reference.sha256 !== referenceHash) throw new Error('Animation source/reference differs from the measured registration recipe');
  const reference = await read(referencePath);
  if (sha256(reference) !== referenceHash) throw new Error('Approved reference hash mismatch');
  const decodedReference = decodePng(reference);
  if (decodedReference.width !== 64 || decodedReference.height !== 64) throw new Error('Approved reference canvas changed');
  // Verify the rejected edit input too: the selected alpha edit must retain its
  // actual original provenance, not silently relabel a generated replacement.
  const originals = await Promise.all(sourceIndex.generations.map(async generation => {
    const bytes = await read(generation.sourcePath);
    if (sha256(bytes) !== generation.sha256) throw new Error('Animation provenance source hash mismatch');
    return bytes;
  }));
  const palette = paletteSchema.parse(JSON.parse((await read('assets/palettes/theandril-master.json')).toString()));
  const prepared = prepareAnimationSource(originals[1]!, scoutIdleRecipe(sourceHash), palette);
  const tools = await Promise.all(toolPaths.map(async path => ({ path, sha256: sha256(await readFile(resolve(codeRoot, path))) })));
  const toolHash = cacheKey(tools), settingsHash = cacheKey({ recipe: prepared.recipe, palette, toolHash });
  const inputHash = cacheKey({ metadataHash: sha256(metadataBytes), referenceHash, sourceHash, settingsHash });
  const base = `assets/art/source/animations/prepared/${sourceIndex.id}-v5-${inputHash}`;
  const recordPath = `${base}/record.json`, briefPath = `${base}/candidate.brief.json`;
  const nativeBase = `assets/art/source/native/${sourceIndex.id}/animation-v5/${inputHash}`;
  let priorRecord: Buffer | undefined;
  try { priorRecord = await read(recordPath); } catch (error) { if (!absent(error)) throw error; }
  // This is actual candidate preparation time, not a fabricated generation
  // timestamp. Repeated preparation reuses the immutable record's original time.
  const preparedAt: unknown = priorRecord ? (JSON.parse(priorRecord.toString()) as { preparedAt?: unknown }).preparedAt : new Date().toISOString();
  if (typeof preparedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(preparedAt)
    || !Number.isFinite(Date.parse(preparedAt)) || new Date(preparedAt).toISOString() !== preparedAt) throw new Error('Invalid immutable preparation timestamp');
  const record = { schemaVersion: 1, id: sourceIndex.id, assetVersion: 5, sourceVersion: sourceIndex.sourceVersion,
    inputHash, preparedAt, generatedAt: null, sourceIndexPath: metadataPath, sourceIndexHash: sha256(metadataBytes), sourceIndex,
    referenceHash, recipe: prepared.recipe, toolHash, tools, settingsHash,
    frames: prepared.frames.map(frame => ({ index: frame.index, path: `${nativeBase}/idle-se-${frame.index}.png`, sha256: frame.sha256,
      pixelHash: frame.pixelHash, bounds: frame.bounds, source: frame.source })),
    note: 'Original four-pose sheet followed by a built-in alpha-background edit. No source generation timestamp/model/seed inferred. Native import uses one common scale, four measured foot anchors, nearest sampling, threshold128 and the master palette. No redrawing, synthetic translation frames or interpolation. Identity, equipment, grounding and loop require visual review; this record is not approval.' };
  const recordBytes = json(record), prompt = `Original four-pose source prompt:\n${sourceIndex.generations[0]!.prompt}\n\nSelected alpha-edit prompt:\n${selected.prompt}`;
  const brief = parseAssetManifest({ schemaVersion: 1, id: sourceIndex.id, type: 'unit', status: 'BRIEF_READY', version: 5,
    nativeResolution: { width: 64, height: 64 }, paletteId: palette.id, contentIds: [sourceIndex.id], prompt,
    frames: record.frames.map(frame => ({ id: `${sourceIndex.id}/idle/se/${frame.index}`, direction: 'se', state: 'idle', index: frame.index,
      durationMs: 250, pivot: [32, 56], sourcePath: frame.path })),
    animation: { states: { idle: { frames: 4, fps: 4, loop: true } } },
    provenance: { provider: selected.provider, model: selected.model, promptHash: sha256(prompt),
      sourceRefs: [...sourceIndex.generations.map(source => source.sourcePath), metadataPath, referencePath, recordPath, ...toolPaths],
      licenseNotes: ['Original Theandril commissioned sheet and built-in alpha edit, referencing its retained approved scout. Service terms apply; no third-party game artwork used or model/seed/rights guarantee inferred.'] },
    createdAt: preparedAt, referenceHashes: [...sourceIndex.generations.map(source => source.sha256), referenceHash, sha256(metadataBytes), sha256(recordBytes)],
    processing: [{ tool: 'theandril-animation-source', version: '1', profile: 'common-scale-foot-registered-idle64', settingsHash, inputHash: sourceHash,
      outputHash: cacheKey(record.frames.map(frame => frame.sha256)) }], validation: null, review: null,
    constraints: { transparentPadding: 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 2, requireMotion: true, terrain: 'none' },
  });
  const validation = validateAsset(brief, prepared.frames.map(frame => ({ id: brief.frames[frame.index]!.id, image: frame.image })), palette);
  if (!validation.passed) throw new Error(`Native animation validation failed: ${validation.errors.join('; ')}`);
  const writes = [...record.frames.map((frame, index) => ({ path: frame.path, bytes: Buffer.from(prepared.frames[index]!.png) })),
    { path: recordPath, bytes: recordBytes }, { path: briefPath, bytes: json(brief) }];
  const missing: typeof writes = [];
  for (const item of writes) {
    try { if (!(await read(item.path)).equals(item.bytes)) throw new Error(`Immutable animation output conflict: ${item.path}`); }
    catch (error) { if (!absent(error)) throw error; missing.push(item); }
  }
  // Complete preflight precedes every write. Exclusive creation prevents racing
  // overwrites; a partial I/O failure is safe to retry without replacing files.
  if (write) for (const item of missing) {
    const path = await safeAssetPath(root, item.path); await mkdir(dirname(path), { recursive: true }); await writeFile(path, item.bytes, { flag: 'wx' });
  }
  return { id: sourceIndex.id, inputHash, prepared: write, approved: false, activated: false, briefPath, recordPath,
    frames: record.frames, validation: { passed: validation.passed, warnings: validation.warnings, manualChecks: validation.manualChecks } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => arg !== '--prepare')) throw new Error('Usage: node --import tsx scripts/art-animation-source.ts [--prepare]');
  console.log(JSON.stringify(await prepareScoutAnimation(codeRoot, args.includes('--prepare')), null, 2));
}
