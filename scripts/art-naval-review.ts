/** Review-only naval contact sheets. This tool never prepares, approves or publishes assets. */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildContactSheet, decodePng, encodePng, FACTION_ART_FAMILIES, FACTION_NAVAL_ART_ROLES,
  paletteSchema, parseAssetManifest, safeAssetPath, sha256, validateAsset,
  type AssetManifest, type FrameImage,
} from '../packages/art-pipeline/src/index';

export type NavalReviewOptions = { stage: 'candidate' | 'approved'; family?: string; cohort?: 'all' | 1 | 2 | 3 };
export function parseNavalReviewArguments(args: readonly string[]): NavalReviewOptions {
  const stage = args.filter(arg => arg.startsWith('--stage=')), family = args.filter(arg => arg.startsWith('--family=')), cohort = args.filter(arg => arg.startsWith('--cohort='));
  if (stage.length !== 1 || family.length + cohort.length !== 1 || new Set(args).size !== args.length || args.some(arg => !arg.startsWith('--stage=') && !arg.startsWith('--family=') && !arg.startsWith('--cohort='))) throw new Error('Usage: --stage=candidate|approved --family=<authored family> OR --cohort=1|2|3|all. Review output only.');
  const selectedStage = stage[0]!.slice(8);
  if (selectedStage !== 'candidate' && selectedStage !== 'approved') throw new Error('Choose the candidate or approved boundary explicitly.');
  if (family.length) {
    const selectedFamily = family[0]!.slice(9);
    if (!(FACTION_ART_FAMILIES as readonly string[]).includes(selectedFamily)) throw new Error('Unknown naval art family.');
    return { stage: selectedStage, family: selectedFamily };
  }
  const selectedCohort = cohort[0]!.slice(9);
  if (!['all', '1', '2', '3'].includes(selectedCohort)) throw new Error('Naval review cohorts are three registered groups of four cultures, or all.');
  return { stage: selectedStage, cohort: selectedCohort === 'all' ? 'all' : Number(selectedCohort) as 1 | 2 | 3 };
}

/** Missing/failed candidates never silently fall back to approvals (or vice versa).
 * Input and output hashes bind order metadata to the exact displayed processed pixels.
 */
export async function buildNavalReview(repoRoot: string, options: NavalReviewOptions) {
  const root = resolve(repoRoot);
  const selected = parseNavalReviewArguments([`--stage=${options.stage}`, options.family ? `--family=${options.family}` : `--cohort=${options.cohort}`]);
  const families = selected.family ? [selected.family] : selected.cohort === 'all' ? [...FACTION_ART_FAMILIES] : FACTION_ART_FAMILIES.slice((selected.cohort! - 1) * 4, selected.cohort! * 4);
  const label = selected.family ?? `cohort-${selected.cohort}`;
  const directory = selected.stage === 'candidate' ? 'candidates' : 'approved';
  async function read(path: string, limit: number) {
    const absolute = await safeAssetPath(root, path), info = await stat(absolute);
    if (!info.isFile() || info.size > limit) throw new Error(`Naval review input is not a bounded regular file: ${path}`);
    const bytes = await readFile(absolute);
    if (bytes.length > limit) throw new Error(`Naval review input exceeds its limit: ${path}`);
    return bytes;
  }
  const palette = paletteSchema.parse(JSON.parse((await read('assets/palettes/theandril-master.json', 65536)).toString()));
  const items: { manifest: AssetManifest; frames: FrameImage[] }[] = [];
  const order: { assetId: string; frameId: string; manifestPath: string; manifestHash: string; inputHash: string; sourcePath: string; pngHash: string; pixelHash: string; status: string }[] = [];
  for (const id of families.flatMap(family => FACTION_NAVAL_ART_ROLES.map(role => `${role}.${family}`)).sort()) {
    const manifestPath = `assets/art/${directory}/${id}.json`, bytes = await read(manifestPath, 1024 * 1024), manifest = parseAssetManifest(JSON.parse(bytes.toString()));
    if (manifest.id !== id || manifest.contentIds.length !== 1 || manifest.contentIds[0] !== id || manifest.nativeResolution.width !== 96 || manifest.nativeResolution.height !== 96 || manifest.frames.length !== 1) throw new Error(`Naval frame/identity contract mismatch: ${id}`);
    if (selected.stage === 'candidate' ? manifest.status !== 'CANDIDATE' || manifest.review !== null : manifest.status !== 'APPROVED' || !manifest.review) throw new Error(`Wrong review boundary for ${id}: expected ${selected.stage}, received ${manifest.status}.`);
    const frame = manifest.frames[0]!;
    if (frame.pivot[0] !== 48 || frame.pivot[1] !== 80 || frame.state !== 'idle' || frame.direction !== 'se' || frame.index !== 0 || frame.durationMs !== 250 || manifest.animation.states.idle?.loop !== false) throw new Error(`Naval static pose/pivot contract mismatch: ${id}`);
    const png = await read(frame.sourcePath, 8 * 1024 * 1024), image = decodePng(png), frames = [{ id: frame.id, image }];
    const report = validateAsset(manifest, frames, palette);
    if (!report.passed || selected.stage === 'approved' && report.inputHash !== manifest.review?.inputHash) throw new Error(`Failed or stale naval review input: ${id}: ${report.errors.join('; ')}`);
    items.push({ manifest, frames });
    order.push({ assetId: id, frameId: frame.id, manifestPath, manifestHash: sha256(bytes), inputHash: report.inputHash, sourcePath: frame.sourcePath, pngHash: sha256(png), pixelHash: sha256(image.data), status: manifest.status });
  }
  const sheets = [{ name: label, items, scale: 1 as const, columns: selected.family ? 3 : families.length },
    ...families.map(family => ({ name: family, items: items.filter(item => item.manifest.id.endsWith(`.${family}`)), scale: 4 as const, columns: 3 }))];
  const outputs = sheets.map(sheet => {
    const image = buildContactSheet(sheet.items, { scale: sheet.scale, columns: sheet.columns }), bytes = encodePng(image);
    return { path: `assets/art/review-previews/naval-${selected.stage}-${sheet.name}-${sheet.scale}x.png`, width: image.width, height: image.height, sha256: sha256(bytes), bytes,
      assetIds: sheet.items.map(item => item.manifest.id).sort(), scale: sheet.scale, columns: sheet.columns };
  });
  const metadata = { schemaVersion: 1, stage: selected.stage, selection: label,
    note: 'Review-only processed pixels, sorted by exact asset ID (coastal, ocean, transport). Passing metrics and producing evidence do not approve or publish any asset.',
    order, sheets: outputs.map(({ bytes: _bytes, ...output }) => { void _bytes; return output; }) };
  const metadataPath = `assets/art/review-previews/naval-${selected.stage}-${label}-order.json`;
  // All inputs validate before any review output is written. No manifest/source is changed.
  for (const output of outputs) { const absolute = await safeAssetPath(root, output.path); await mkdir(dirname(absolute), { recursive: true }); await writeFile(absolute, output.bytes); }
  const absolute = await safeAssetPath(root, metadataPath); await mkdir(dirname(absolute), { recursive: true }); await writeFile(absolute, JSON.stringify(metadata, null, 2) + '\n');
  return { ...metadata, metadataPath };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildNavalReview(resolve(dirname(fileURLToPath(import.meta.url)), '..'), parseNavalReviewArguments(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}
