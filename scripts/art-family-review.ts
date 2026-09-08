/** Exact processed family contact sheets only: never generates, approves or publishes art. */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContactSheet, decodePng, encodePng, FACTION_ART_FAMILIES, FACTION_ART_ROLES, paletteSchema, parseAssetManifest, safeAssetPath, sha256, validateAsset, type AssetManifest, type FrameImage, type RgbaImage } from '../packages/art-pipeline/src/index';
import { factionFrameContract } from './art-factions';

export function parseFamilyReviewArguments(args: readonly string[]): { family: string; stage: 'candidate' | 'approved' } {
  if (args.length !== 2 || new Set(args).size !== 2) throw new Error('Usage: --family=<registered culture> --stage=candidate|approved');
  const family = args.find(arg => arg.startsWith('--family='))?.slice(9), stage = args.find(arg => arg.startsWith('--stage='))?.slice(8);
  if (!family || !(FACTION_ART_FAMILIES as readonly string[]).includes(family) || stage !== 'candidate' && stage !== 'approved') throw new Error('Choose a registered family and explicit candidate or approved boundary.');
  return { family, stage };
}

/** Whole-source thumbnails for composition review, never candidate/approved pixel inputs. */
export function originalOverview(images: readonly RgbaImage[]): RgbaImage {
  if (!images.length || images.length > 6) throw new Error('Original overview requires one to six images.');
  const cell = 400, inset = 8, side = 384, columns = Math.min(images.length, 3);
  const width = columns * cell, height = Math.ceil(images.length / columns) * cell, data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const value = x % cell === 0 || y % cell === 0 ? 112 : (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? 46 : 64;
    data.set([value, value, value, 255], (y * width + x) * 4);
  }
  images.forEach((image, index) => {
    if (image.width < 1 || image.height < 1 || image.width > 8192 || image.height > 8192 || image.data.length !== image.width * image.height * 4) throw new Error('Invalid original review image.');
    const scale = Math.min(side / image.width, side / image.height), w = Math.max(1, Math.floor(image.width * scale)), h = Math.max(1, Math.floor(image.height * scale));
    const left = index % columns * cell + inset + Math.floor((side - w) / 2), top = Math.floor(index / columns) * cell + inset + Math.floor((side - h) / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const from = (Math.min(image.height - 1, Math.floor((y + 0.5) * image.height / h)) * image.width + Math.min(image.width - 1, Math.floor((x + 0.5) * image.width / w))) * 4;
      const to = ((top + y) * width + left + x) * 4, alpha = image.data[from + 3]!;
      for (let channel = 0; channel < 3; channel++) data[to + channel] = Math.round((image.data[from + channel]! * alpha + data[to + channel]! * (255 - alpha)) / 255);
    }
  });
  return { width, height, data };
}

export async function buildFamilyReview(repoRoot: string, options: ReturnType<typeof parseFamilyReviewArguments>) {
  const root = resolve(repoRoot), { family, stage } = parseFamilyReviewArguments([`--family=${options.family}`, `--stage=${options.stage}`]);
  async function read(path: string, limit: number): Promise<Buffer> {
    const absolute = await safeAssetPath(root, path), info = await stat(absolute);
    if (!info.isFile() || info.size > limit) throw new Error(`Not a bounded regular review input: ${path}`);
    const bytes = await readFile(absolute);
    if (bytes.length > limit) throw new Error(`Input grew beyond review limit: ${path}`);
    return bytes;
  }
  const palette = paletteSchema.parse(JSON.parse((await read('assets/palettes/theandril-master.json', 65536)).toString()));
  const items: { manifest: AssetManifest; frames: FrameImage[] }[] = [];
  const originals: { assetId: string; sourcePath: string; sha256: string; image: RgbaImage }[] = [];
  const order: { assetId: string; frameId: string; native: number; inputHash: string; sourcePath: string; pngHash: string; pixelHash: string }[] = [];
  for (const role of FACTION_ART_ROLES) {
    const id = `${role}.${family}`, contract = factionFrameContract(role);
    const manifest = parseAssetManifest(JSON.parse((await read(`assets/art/${stage === 'candidate' ? 'candidates' : 'approved'}/${id}.json`, 1048576)).toString()));
    if (manifest.id !== id || manifest.contentIds.length !== 1 || manifest.contentIds[0] !== id || manifest.nativeResolution.width !== contract.native || manifest.nativeResolution.height !== contract.native) throw new Error(`Identity or native contract mismatch: ${id}`);
    if (stage === 'candidate' ? manifest.status !== 'CANDIDATE' || manifest.review !== null : manifest.status !== 'APPROVED' || !manifest.review) throw new Error(`Wrong review lifecycle: ${id}`);
    // Cohort24 has one independently retained PNG per role. Historical sheet-based families
    // retain their existing source review workflows, rather than pretending a sheet is one role.
    if (FACTION_ART_FAMILIES.indexOf(family as typeof FACTION_ART_FAMILIES[number]) >= 12) {
      const sourcePath = manifest.provenance.sourceRefs[0];
      if (!sourcePath?.endsWith('.png')) throw new Error(`Missing original PNG provenance: ${id}`);
      const bytes = await read(sourcePath, 67108864), hash = sha256(bytes);
      if (!manifest.referenceHashes.includes(hash)) throw new Error(`Original source hash changed: ${id}`);
      originals.push({ assetId: id, sourcePath, sha256: hash, image: decodePng(bytes) });
    }
    const frames: FrameImage[] = [], rows: Omit<typeof order[number], 'inputHash'>[] = [];
    for (const frame of manifest.frames) {
      if (frame.pivot[0] !== contract.pivot[0] || frame.pivot[1] !== contract.pivot[1]) throw new Error(`Unregistered frame pivot: ${frame.id}`);
      const png = await read(frame.sourcePath, 8388608), image = decodePng(png);
      frames.push({ id: frame.id, image });
      rows.push({ assetId: id, frameId: frame.id, native: contract.native, sourcePath: frame.sourcePath, pngHash: sha256(png), pixelHash: sha256(image.data) });
    }
    const report = validateAsset(manifest, frames, palette);
    if (!report.passed || stage === 'approved' && report.inputHash !== manifest.review?.inputHash) throw new Error(`Failed/stale review input: ${id}: ${report.errors.join('; ')}`);
    items.push({ manifest, frames }); order.push(...rows.map(row => ({ ...row, inputHash: report.inputHash })));
  }
  const groups = [
    { name: 'all', items, scale: 1 as const, columns: 6 },
    ...['characters', 'troops', 'settlements', 'heraldry', 'naval'].map(name => ({ name, scale: 4 as const, columns: 3, items: items.filter(item => {
      const id = item.manifest.id, naval = /unit\.(transport|coastal_warship|ocean_warship)\./.test(id);
      return name === 'characters' ? id.startsWith('character.') : name === 'settlements' ? id.startsWith('settlement.') : name === 'heraldry' ? id.startsWith('ui.') : name === 'naval' ? naval : id.startsWith('unit.') && !naval;
    }) })),
  ];
  const outputs = groups.map(group => {
    const image = buildContactSheet(group.items, { scale: group.scale, columns: group.columns }), bytes = encodePng(image);
    return { path: `assets/art/review-previews/family-${stage}-${family}-${group.name}-${group.scale}x.png`, bytes, sha256: sha256(bytes), width: image.width, height: image.height, scale: group.scale, order: group.items.flatMap(item => item.frames.map(frame => frame.id)).sort() };
  });
  originals.sort((a, b) => a.assetId < b.assetId ? -1 : 1);
  if (new Set(originals.map(original => original.sha256)).size !== originals.length) throw new Error('Duplicated original image within family.');
  for (let offset = 0; offset < originals.length; offset += 6) {
    const selected = originals.slice(offset, offset + 6), image = originalOverview(selected.map(source => source.image)), bytes = encodePng(image);
    outputs.push({ path: `assets/art/review-previews/family-${stage}-${family}-originals-${offset / 6 + 1}.png`, bytes, sha256: sha256(bytes), width: image.width, height: image.height, scale: 1, order: selected.map(source => source.assetId) });
  }
  const metadata = { schemaVersion: 1, family, stage, note: 'Every processed frame is validated; processed sheets sort exact asset/frame IDs. Original-source overviews preserve complete composition/aspect and original color at384px maximum, separately from native and nearest4x processed pixel review. No source or approval is changed; no missing role is substituted.', order, originals: originals.map(({ image, ...source }) => ({ ...source, width: image.width, height: image.height })), sheets: outputs.map(({ bytes: _bytes, ...output }) => { void _bytes; return output; }) };
  // All 18 role inputs pass before any review-only output is written.
  for (const output of outputs) { const absolute = await safeAssetPath(root, output.path); await mkdir(dirname(absolute), { recursive: true }); await writeFile(absolute, output.bytes); }
  const metadataPath = `assets/art/review-previews/family-${stage}-${family}-order.json`;
  await writeFile(await safeAssetPath(root, metadataPath), JSON.stringify(metadata, null, 2) + '\n');
  return { ...metadata, metadataPath };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildFamilyReview(resolve(dirname(fileURLToPath(import.meta.url)), '..'), parseFamilyReviewArguments(process.argv.slice(2))), null, 2));
