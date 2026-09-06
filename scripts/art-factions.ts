/** Offline preparation only: machine-valid crops are never visual approvals. */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertImage, cacheKey, cropImage, decodePng, encodePng, normalizePalette,
  paletteSchema, parseAssetManifest, safeAssetPath, sha256,
  type AssetManifest, type ImageRect, type RgbaImage,
} from '../packages/art-pipeline/src/index';
import { FACTION_ART_FAMILIES, FACTION_ART_ROLES, factionArtId, type FactionArtFamily, type FactionArtRole } from '../packages/art-pipeline/src/faction-art';

// The source prompt's row-major order is authoritative; registry ordering is not layout.
export const FACTION_SHEET_ROLES = [
  'unit.colonist', 'unit.scout', 'unit.guard', 'unit.spearman',
  'unit.heavy_infantry', 'unit.cavalry', 'character.marshal', 'character.surveyor',
  'character.engineer', 'settlement.village', 'settlement.town', 'settlement.city',
  'ui.crest', 'ui.banner', 'ui.badge',
] as const satisfies readonly FactionArtRole[];
const ALPHA_THRESHOLD = 128;
const CREATED_AT = '2026-09-05T00:00:00.000Z';
const PROMPTS_PATH = 'assets/art/source/faction-generation-prompts.json';
const REVISIONS_PATH = 'assets/art/source/faction-revisions.json';
type Palette = ReturnType<typeof paletteSchema.parse>;
type CellInspection = { index: number; role: FactionArtRole | null; rect: ImageRect; bounds: ImageRect | null; visiblePixels: number; transparentPixels: number };
export type SheetInspection = { width: number; height: number; cells: CellInspection[]; errors: string[]; warnings: string[] };
export type FactionCrop = { role: FactionArtRole; rect: ImageRect; componentIds?: number[] };
const COMPONENT_ALGORITHM = 'alpha128-8connected-first-visible-pixel-v1';

function alphaBounds(image: RgbaImage): ImageRect | null {
  let left = image.width, top = image.height, right = -1, bottom = -1;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    if (image.data[(y * image.width + x) * 4 + 3]! < ALPHA_THRESHOLD) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  return right < 0 ? null : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

export function inspectFactionSheet(image: RgbaImage): SheetInspection {
  assertImage(image);
  const report: SheetInspection = { width: image.width, height: image.height, cells: [], errors: [], warnings: [] };
  if (image.width !== image.height || image.width < 128) report.errors.push('Expected a square four-column/four-row source of at least 128 pixels.');
  for (let index = 0; index < 16; index++) {
    // Floor both endpoints: odd-sized provider exports have no discarded edge pixels.
    const col = index % 4, row = Math.floor(index / 4);
    const x = Math.floor(col * image.width / 4), y = Math.floor(row * image.height / 4);
    const rect = { x, y, w: Math.floor((col + 1) * image.width / 4) - x, h: Math.floor((row + 1) * image.height / 4) - y };
    const cell = cropImage(image, rect), bounds = alphaBounds(cell);
    let visiblePixels = 0, transparentPixels = 0;
    for (let at = 3; at < cell.data.length; at += 4) {
      if (cell.data[at]! >= ALPHA_THRESHOLD) visiblePixels++;
      if (cell.data[at] === 0) transparentPixels++;
    }
    const role = FACTION_SHEET_ROLES[index] ?? null;
    report.cells.push({ index, role, rect, bounds, visiblePixels, transparentPixels });
    if (role && !bounds) report.errors.push(`Cell ${index + 1} (${role}) is empty.`);
    if (role && transparentPixels < rect.w * rect.h * 0.1) report.errors.push(`Cell ${index + 1} (${role}) lacks genuine transparent margins; background repair is not permitted.`);
    if (!role && visiblePixels > 0) report.errors.push(`Cell 16 must be empty; found ${visiblePixels} alpha>=128 pixels at ${JSON.stringify(bounds)}.`);
    if (role && bounds && (bounds.x === 0 || bounds.y === 0 || bounds.x + bounds.w === rect.w || bounds.y + bounds.h === rect.h)) {
      report.warnings.push(`Cell ${index + 1} (${role}) touches a cell edge; inspect for clipped features or neighboring fragments.`);
    }
  }
  return report;
}

export function factionFrameContract(role: FactionArtRole): { native: number; pivot: [number, number]; maxHeight: number; centered: boolean; type: AssetManifest['type'] } {
  const native = role === 'unit.cavalry' || role === 'settlement.village' || role === 'settlement.town' ? 96 : role === 'settlement.city' ? 128 : role === 'ui.badge' ? 32 : 64;
  const centered = role === 'ui.badge' || role === 'ui.crest';
  const ground = centered ? native / 2 : native > 64 ? native - 16 : 56;
  const maxHeight = centered ? native - 4 : native > 64 ? ground - 2 : role === 'unit.spearman' || role === 'ui.banner' ? 54 : 48;
  return { native, pivot: [native / 2, ground], maxHeight, centered, type: role.startsWith('ui.') ? 'ui' : role.startsWith('settlement.') ? 'settlement' : 'unit' };
}

export function fitFactionFrame(cell: RgbaImage, bounds: ImageRect, role: FactionArtRole, palette: Palette): RgbaImage {
  const crop = cropImage(cell, bounds), contract = factionFrameContract(role), size = contract.native;
  const scale = Math.min((size - 4) / crop.width, contract.maxHeight / crop.height);
  const w = Math.max(1, Math.floor(crop.width * scale)), h = Math.max(1, Math.floor(crop.height * scale));
  const left = Math.floor((size - w) / 2), top = contract.centered ? Math.floor((size - h) / 2) : contract.pivot[1] - h;
  const image = { width: size, height: size, data: new Uint8Array(size * size * 4) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sourceX = Math.min(crop.width - 1, Math.floor((x + 0.5) * crop.width / w));
    const sourceY = Math.min(crop.height - 1, Math.floor((y + 0.5) * crop.height / h));
    const at = (sourceY * crop.width + sourceX) * 4;
    image.data.set(crop.data.subarray(at, at + 4), ((top + y) * size + left + x) * 4);
  }
  const normalized = normalizePalette(image, palette, { alphaThreshold: ALPHA_THRESHOLD }).image;
  if (!alphaBounds(normalized)) throw new Error(`${role} vanished during native nearest fitting; source needs revision.`);
  return normalized;
}

function overlaps(a: ImageRect, b: ImageRect): boolean { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

/** Explicit irregular crops retain every alpha>=128 source pixel, with no overlap or background repair. */
export function inspectFactionCrops(image: RgbaImage, crops: readonly FactionCrop[]): SheetInspection {
  assertImage(image);
  const report: SheetInspection = { width: image.width, height: image.height, cells: [], errors: [], warnings: [] };
  if (crops.length !== 15 || new Set(crops.map((crop) => crop.role)).size !== 15 || crops.some((crop) => !FACTION_SHEET_ROLES.includes(crop.role))) throw new Error('Explicit crops require exactly the fifteen distinct faction roles.');
  const coverage = new Uint8Array(image.width * image.height);
  const segmentation = crops.some((crop) => crop.componentIds) ? connectedComponents(image) : null;
  let transparent = 0;
  for (let at = 3; at < image.data.length; at += 4) if (image.data[at] === 0) transparent++;
  if (transparent < image.width * image.height * 0.1) report.errors.push('Source lacks genuine transparency; opaque/checkerboard background repair is forbidden.');
  for (const [index, role] of FACTION_SHEET_ROLES.entries()) {
    const crop = crops.find((entry) => entry.role === role)!, rect = crop.rect;
    const cell = isolatedCrop(image, crop, segmentation?.labels), bounds = alphaBounds(cell);
    if (crop.componentIds && (!crop.componentIds.length || new Set(crop.componentIds).size !== crop.componentIds.length || crop.componentIds.some((id) => !segmentation!.components.some((component) => component.id === id)))) report.errors.push(`${role}: invalid/duplicate source component IDs.`);
    let visiblePixels = 0, transparentPixels = 0;
    for (let y = 0; y < rect.h; y++) for (let x = 0; x < rect.w; x++) {
      const alpha = cell.data[(y * rect.w + x) * 4 + 3]!;
      if (alpha === 0) transparentPixels++;
      if (alpha < ALPHA_THRESHOLD) continue;
      visiblePixels++;
      const coveredAt = (rect.y + y) * image.width + rect.x + x;
      coverage[coveredAt] = coverage[coveredAt]! + 1;
    }
    report.cells.push({ index, role, rect, bounds, visiblePixels, transparentPixels });
    if (!bounds) report.errors.push(`${role}: explicit crop is empty.`);
    if (crops.some((other) => other.role !== role && overlaps(rect, other.rect) && !(crop.componentIds && other.componentIds))) report.errors.push(`${role}: explicit crop overlaps another role without disjoint component masks.`);
    if (rect.x === 0 || rect.y === 0 || rect.x + rect.w === image.width || rect.y + rect.h === image.height) report.warnings.push(`${role}: crop touches original source edge; inspect for an already-clipped source feature.`);
  }
  let omitted = 0, duplicated = 0;
  for (let at = 0; at < coverage.length; at++) if (image.data[at * 4 + 3]! >= ALPHA_THRESHOLD) {
    if (!coverage[at]) omitted++; else if (coverage[at]! > 1) duplicated++;
  }
  if (omitted || duplicated) report.errors.push(`Explicit crop coverage fails: ${omitted} visible source pixels omitted, ${duplicated} duplicated.`);
  if (segmentation) for (const component of segmentation.components) {
    const owners = crops.filter((crop) => crop.componentIds?.includes(component.id));
    if (owners.length > 1) report.errors.push(`Source component ${component.id} is assigned to multiple roles.`);
    for (const owner of owners) {
      const r = owner.rect, c = component.rect;
      if (c.x < r.x || c.y < r.y || c.x + c.w > r.x + r.w || c.y + c.h > r.y + r.h) report.errors.push(`${owner.role}: source component ${component.id} is clipped by its rectangle.`);
    }
  }
  return report;
}

function connectedComponents(image: RgbaImage) {
  const labels = new Int32Array(image.width * image.height), queue = new Int32Array(labels.length);
  const components: { id: number; rect: ImageRect; count: number }[] = [];
  for (let origin = 0; origin < labels.length; origin++) {
    if (labels[origin] || image.data[origin * 4 + 3]! < ALPHA_THRESHOLD) continue;
    let count = 1, cursor = 0, left = image.width, top = image.height, right = -1, bottom = -1;
    queue[0] = origin; labels[origin] = origin + 1;
    while (cursor < count) {
      const at = queue[cursor++]!, x = at % image.width, y = Math.floor(at / image.width);
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= image.width || ny < 0 || ny >= image.height) continue;
        const next = ny * image.width + nx;
        if (labels[next] || image.data[next * 4 + 3]! < ALPHA_THRESHOLD) continue;
        labels[next] = origin + 1; queue[count++] = next;
      }
    }
    components.push({ id: origin, rect: { x: left, y: top, w: right - left + 1, h: bottom - top + 1 }, count });
  }
  return { components, labels };
}

function isolatedCrop(image: RgbaImage, crop: FactionCrop, labels?: Int32Array): RgbaImage {
  const cell = cropImage(image, crop.rect);
  if (!crop.componentIds) return cell;
  const components = new Set(crop.componentIds), map = labels ?? connectedComponents(image).labels;
  for (let y = 0; y < cell.height; y++) for (let x = 0; x < cell.width; x++) {
    const at = (y * cell.width + x) * 4;
    if (!components.has(map[(crop.rect.y + y) * image.width + crop.rect.x + x]! - 1)) cell.data.fill(0, at, at + 4);
  }
  return cell;
}

/** A proposal, not approval: isolate 15 substantial components and keep nearby detached details. */
export function proposeFactionCrops(image: RgbaImage, allowComponentMasks = false): FactionCrop[] {
  assertImage(image);
  let transparent = 0;
  for (let at = 3; at < image.data.length; at += 4) if (image.data[at] === 0) transparent++;
  if (transparent < image.width * image.height * 0.1) throw new Error('Source lacks genuine transparency; opaque/checkerboard background repair is forbidden.');
  const { components } = connectedComponents(image);
  components.sort((a, b) => b.count - a.count || a.rect.y - b.rect.y || a.rect.x - b.rect.x);
  if (components.length < 15 || components[14]!.count < 64 || (components[15]?.count ?? 0) >= components[14]!.count / 2) throw new Error('Cannot isolate exactly fifteen substantial sprites; review/revise source composition.');
  const assigned = new Map<FactionArtRole, number[]>();
  const crops = components.slice(0, 15).map(({ rect, id }): FactionCrop => {
    const col = Math.floor((rect.x + rect.w / 2) * 4 / image.width), row = Math.floor((rect.y + rect.h / 2) * 4 / image.height);
    const role = FACTION_SHEET_ROLES[row * 4 + col];
    if (!role) throw new Error('Unexpected substantial sprite in empty source region.');
    assigned.set(role, [id]); return { role, rect: { ...rect } };
  });
  if (new Set(crops.map((crop) => crop.role)).size !== 15) throw new Error('Multiple substantial components occupy the same role slot; explicit human layout is needed.');
  for (const component of components.slice(15)) {
    const distance = (rect: ImageRect) => Math.max(0, rect.x - component.rect.x - component.rect.w, component.rect.x - rect.x - rect.w) ** 2 + Math.max(0, rect.y - component.rect.y - component.rect.h, component.rect.y - rect.y - rect.h) ** 2;
    const owner = [...crops].sort((a, b) => distance(a.rect) - distance(b.rect) || FACTION_SHEET_ROLES.indexOf(a.role) - FACTION_SHEET_ROLES.indexOf(b.role))[0]!;
    assigned.get(owner.role)!.push(component.id);
    const x = Math.min(owner.rect.x, component.rect.x), y = Math.min(owner.rect.y, component.rect.y);
    owner.rect = { x, y, w: Math.max(owner.rect.x + owner.rect.w, component.rect.x + component.rect.w) - x, h: Math.max(owner.rect.y + owner.rect.h, component.rect.y + component.rect.h) - y };
  }
  if (allowComponentMasks) for (const crop of crops) if (crops.some((other) => other.role !== crop.role && overlaps(crop.rect, other.rect))) crop.componentIds = assigned.get(crop.role)!.sort((a, b) => a - b);
  crops.sort((a, b) => FACTION_SHEET_ROLES.indexOf(a.role) - FACTION_SHEET_ROLES.indexOf(b.role));
  const report = inspectFactionCrops(image, crops);
  if (report.errors.length) throw new Error(report.errors.join('\n'));
  return crops;
}

export function extractFactionSheet(image: RgbaImage, palette: Palette, crops?: readonly FactionCrop[]) {
  const inspection = crops ? inspectFactionCrops(image, crops) : inspectFactionSheet(image);
  if (inspection.errors.length) throw new Error(`Faction source rejected:\n${inspection.errors.join('\n')}`);
  const labels = crops?.some((crop) => crop.componentIds) ? connectedComponents(image).labels : undefined;
  return { inspection, frames: inspection.cells.flatMap((cell) => {
    if (!cell.role || !cell.bounds) return [];
    const sourceCrop = crops?.find((crop) => crop.role === cell.role);
    const frame = fitFactionFrame(sourceCrop ? isolatedCrop(image, sourceCrop, labels) : cropImage(image, cell.rect), cell.bounds, cell.role, palette);
    return [{ role: cell.role, cell: cell.rect, bounds: cell.bounds, nativeBounds: alphaBounds(frame)!, image: frame }];
  }) };
}

export function factionCropContactSheet(frames: ReturnType<typeof extractFactionSheet>['frames'], scale: 1 | 4): RgbaImage {
  if (frames.length !== 15 || ![1, 4].includes(scale)) throw new Error('Faction contact sheet requires fifteen frames at 1x or 4x.');
  const cellSize = Math.max(...frames.map((frame) => Math.max(frame.image.width, frame.image.height))) + 16;
  const width = cellSize * 4 * scale;
  if (width > 4096) throw new Error('Crop evidence exceeds the bounded 4096px canvas.');
  const data = new Uint8Array(width * width * 4);
  for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
    const value = Math.floor(x / scale) % cellSize === 0 || Math.floor(y / scale) % cellSize === 0 ? 100 : (Math.floor(x / (8 * scale)) + Math.floor(y / (8 * scale))) % 2 ? 40 : 56;
    data.set([value, value, value, 255], (y * width + x) * 4);
  }
  for (const [index, role] of FACTION_SHEET_ROLES.entries()) {
    const frame = frames.find((item) => item.role === role)?.image;
    if (!frame) throw new Error(`Missing contact-sheet role ${role}.`);
    const left = ((index % 4) * cellSize + Math.floor((cellSize - frame.width) / 2)) * scale;
    const top = (Math.floor(index / 4) * cellSize + Math.floor((cellSize - frame.height) / 2)) * scale;
    for (let y = 0; y < frame.height * scale; y++) for (let x = 0; x < frame.width * scale; x++) {
      const from = (Math.floor(y / scale) * frame.width + Math.floor(x / scale)) * 4;
      if (frame.data[from + 3]) data.set(frame.data.subarray(from, from + 4), ((top + y) * width + left + x) * 4);
    }
  }
  return { width, height: width, data };
}

function object(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error(`Invalid ${label}`);
  return input as Record<string, unknown>;
}
function strings(input: unknown, label: string): string[] {
  if (!Array.isArray(input) || !input.length || !input.every((entry): entry is string => typeof entry === 'string' && entry.length > 0)) throw new Error(`Invalid ${label}`);
  return input;
}
function requiredString(input: unknown, label: string): string {
  if (typeof input !== 'string' || !input) throw new Error(`Invalid ${label}`);
  return input;
}
export function parseFactionArguments(args: string[]): FactionArtFamily[] {
  const sheetFamilies: FactionArtFamily[] = ['ashen_compact', 'reedbound_council', 'cinder_march', 'glass_tide'];
  if (!args.length) return sheetFamilies;
  if (args.length !== 1 || !args[0]!.startsWith('--family=')) throw new Error('Usage: node --import tsx scripts/art-factions.ts [--family=slug]');
  const family = args[0]!.slice('--family='.length);
  const known = FACTION_ART_FAMILIES.find((entry) => entry === family);
  if (!known) throw new Error('Unknown faction family; no source paths were opened.');
  if (!sheetFamilies.includes(known)) throw new Error('This culture uses individual generated sources; run scripts/art-slice12.ts, not sheet extraction.');
  return [known];
}

async function write(root: string, path: string, bytes: string | Uint8Array) {
  const absolute = await safeAssetPath(root, path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, bytes);
}

async function sourceMetadata(root: string, family: FactionArtFamily, prompts: Record<string, unknown>) {
  let version = 1, prompt = requiredString(prompts[family], `${family} prompt`), promptPath = PROMPTS_PATH;
  if (family === 'ashen_compact') {
    const revisions = object(JSON.parse(await readFile(await safeAssetPath(root, REVISIONS_PATH), 'utf8')), 'faction revisions');
    const revision = object(revisions[family], `${family} revision`);
    if (typeof revision.version !== 'number' || !Number.isInteger(revision.version) || revision.version < 2 || revision.version > 100 || revision.source !== `assets/art/source/factions/${family}-v${revision.version}.png`) throw new Error('Ashen Compact requires an explicit revised source and prompt; rejected v1 is forbidden.');
    version = revision.version; prompt = requiredString(revision.prompt, 'revised prompt'); promptPath = REVISIONS_PATH;
  }
  return { version, source: `assets/art/source/factions/${family}-v${version}.png`, prompt, promptPath };
}

function parseCrops(input: unknown): FactionCrop[] {
  if (!Array.isArray(input) || input.length !== 15) throw new Error('Crop metadata requires fifteen rectangles.');
  return input.map((value) => {
    const record = object(value, 'crop'), role = FACTION_SHEET_ROLES.find((entry) => entry === record.role), rect = object(record.rect, 'crop rectangle');
    if (!role || !['x', 'y', 'w', 'h'].every((key) => typeof rect[key] === 'number' && Number.isInteger(rect[key]))) throw new Error('Invalid crop role/rectangle.');
    let componentIds: number[] | undefined;
    if (record.componentIds !== undefined) {
      if (!Array.isArray(record.componentIds) || !record.componentIds.length || record.componentIds.length > 1024 || !record.componentIds.every((id): id is number => typeof id === 'number' && Number.isInteger(id) && id >= 0)) throw new Error('Invalid crop component IDs.');
      componentIds = record.componentIds;
    }
    return { role, rect: { x: rect.x as number, y: rect.y as number, w: rect.w as number, h: rect.h as number }, ...(componentIds ? { componentIds } : {}) };
  });
}

export async function prepareFactionCropEvidence(root: string, family: FactionArtFamily) {
  if (!FACTION_ART_FAMILIES.includes(family)) throw new Error('Unknown faction family.');
  const palette = paletteSchema.parse(JSON.parse(await readFile(await safeAssetPath(root, 'assets/palettes/theandril-master.json'), 'utf8')));
  const generation = object(JSON.parse(await readFile(await safeAssetPath(root, PROMPTS_PATH), 'utf8')), 'generation metadata');
  const { source } = await sourceMetadata(root, family, object(generation.prompts, 'generation prompts'));
  const bytes = await readFile(await safeAssetPath(root, source)), image = decodePng(bytes), crops = proposeFactionCrops(image, family === 'glass_tide');
  const extracted = extractFactionSheet(image, palette, crops), evidence = [];
  for (const scale of [1, 4] as const) {
    const path = `assets/art/source/factions/crop-evidence/${family}-${scale}x.png`, png = encodePng(factionCropContactSheet(extracted.frames, scale));
    evidence.push({ path, sha256: sha256(png), scale });
    await write(root, path, png);
  }
  const segmentation = connectedComponents(image), sourceHash = sha256(bytes);
  const sourceFrames = extracted.frames.map((frame) => {
    const raw = isolatedCrop(image, crops.find((crop) => crop.role === frame.role)!, segmentation.labels);
    for (let at = 0; at < raw.data.length; at += 4) {
      if (raw.data[at + 3]! < ALPHA_THRESHOLD) raw.data.fill(0, at, at + 4); else raw.data[at + 3] = 255;
    }
    return { ...frame, image: raw };
  });
  const sourceEvidencePath = `assets/art/source/factions/crop-evidence/${family}-source.png`, sourcePng = encodePng(factionCropContactSheet(sourceFrames, 1));
  await write(root, sourceEvidencePath, sourcePng);
  evidence.push({ path: sourceEvidencePath, sha256: sha256(sourcePng), scale: 1 as const });
  const record = { schemaVersion: 1, source, sourceHash, width: image.width, height: image.height, crops, cropsHash: cacheKey(crops),
    components: { algorithm: COMPONENT_ALGORITHM, hash: cacheKey({ sourceHash, algorithm: COMPONENT_ALGORITHM, components: segmentation.components }), definitions: segmentation.components },
    evidence, review: null, warnings: extracted.inspection.warnings, note: 'Source rectangle proposal only; contact sheet follows exact original prompt order. Retains every alpha>=128 source pixel once. Component masks only isolate disconnected foreign sprites; no repainting/keying. Source evidence preserves original RGB at full resolution with the disclosed alpha128 threshold. Native fitting/normalization is not visual approval.' };
  await write(root, `assets/art/source/factions/crops-${family}.json`, JSON.stringify(record, null, 2) + '\n');
  return record;
}

export async function prepareFactionArt(root: string, families: readonly FactionArtFamily[]) {
  if (!families.length || new Set(families).size !== families.length || families.some((family) => !FACTION_ART_FAMILIES.includes(family))) throw new Error('Expected unique known faction families.');
  const palette = paletteSchema.parse(JSON.parse(await readFile(await safeAssetPath(root, 'assets/palettes/theandril-master.json'), 'utf8')));
  const generation = object(JSON.parse(await readFile(await safeAssetPath(root, PROMPTS_PATH), 'utf8')), 'generation metadata');
  if (generation.schemaVersion !== 1 || generation.provider !== 'codex-imagegen' || generation.model !== 'not-exposed-by-tool' || generation.seed !== null) throw new Error('Unsupported faction generation provenance.');
  const prompts = object(generation.prompts, 'generation prompts'), licenseNotes = strings(generation.licenseNotes, 'license notes');
  const scriptHash = sha256(await readFile(fileURLToPath(import.meta.url)));
  const indexPath = 'assets/art/faction-index.json';
  let previousFamilies: Record<string, unknown> = {};
  try {
    const prior = object(JSON.parse(await readFile(await safeAssetPath(root, indexPath), 'utf8')), 'faction index');
    if (prior.schemaVersion !== 1) throw new Error('Unsupported faction index version.');
    previousFamilies = object(prior.families, 'faction index families');
  } catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
  const prepared = [];
  for (const family of families) {
    const { version, source, prompt, promptPath } = await sourceMetadata(root, family, prompts);
    const sourceBytes = await readFile(await safeAssetPath(root, source)), sourceHash = sha256(sourceBytes);
    const cropPath = `assets/art/source/factions/crops-${family}.json`;
    let crops: FactionCrop[] | undefined;
    try {
      const record = object(JSON.parse(await readFile(await safeAssetPath(root, cropPath), 'utf8')), 'explicit crops');
      crops = parseCrops(record.crops);
      const review = object(record.review, 'source-crop review (required before irregular extraction)');
      requiredString(review.reviewer, 'crop reviewer'); requiredString(review.notes, 'crop review notes');
      if (record.schemaVersion !== 1 || record.source !== source || record.sourceHash !== sourceHash || review.sourceHash !== sourceHash || record.cropsHash !== cacheKey(crops) || review.cropsHash !== record.cropsHash) throw new Error('Explicit crop source/rectangle/review hash mismatch.');
      if (crops.some((crop) => crop.componentIds)) {
        if (family !== 'glass_tide' || crops.some((crop) => crop.componentIds && !['character.surveyor', 'settlement.city'].includes(crop.role))) throw new Error('Component masks are authorized only for the reviewed Glass Tide surveyor/city overlap.');
      }
      if (record.components !== undefined || crops.some((crop) => crop.componentIds)) {
        const components = object(record.components, 'component provenance'), actual = connectedComponents(decodePng(sourceBytes));
        if (components.algorithm !== COMPONENT_ALGORITHM || components.hash !== cacheKey({ sourceHash, algorithm: COMPONENT_ALGORITHM, components: actual.components }) || cacheKey(components.definitions) !== cacheKey(actual.components)) throw new Error('Source component provenance hash mismatch.');
      }
    } catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
    const extracted = extractFactionSheet(decodePng(sourceBytes), palette, crops);
    const records = extracted.frames.map((frame) => {
      const id = factionArtId(frame.role, `faction.${family}`);
      if (!id) throw new Error('Faction role registry mismatch.');
      const contract = factionFrameContract(frame.role), png = encodePng(frame.image), outputHash = sha256(png);
      const nativePath = `assets/art/source/native/${id}/idle-se-0.png`;
      const componentIds = crops?.find((crop) => crop.role === frame.role)?.componentIds;
      const settings = { method: 'nearest-pixel-center', layout: crops ? 'reviewed-irregular-rectangles' : 'four-by-four-grid', cell: frame.cell, crop: frame.bounds, contract, alphaThreshold: ALPHA_THRESHOLD, transparentPadding: 2, paletteHash: cacheKey(palette), scriptHash, ...(componentIds ? { componentIds, componentAlgorithm: COMPONENT_ALGORITHM } : {}) };
      const manifest = parseAssetManifest({
        schemaVersion: 1, id, type: contract.type, status: 'BRIEF_READY', version,
        nativeResolution: { width: contract.native, height: contract.native }, paletteId: palette.id, contentIds: [id], prompt,
        frames: [{ id: `${id}/idle/se/0`, direction: 'se', state: 'idle', index: 0, durationMs: 250, pivot: contract.pivot, sourcePath: nativePath }],
        animation: { states: { idle: { frames: 1, fps: 4, loop: false } } },
        provenance: { provider: 'codex-imagegen', model: 'not-exposed-by-tool', promptHash: sha256(prompt), sourceRefs: [source, promptPath, ...(crops ? [cropPath] : [])], licenseNotes },
        createdAt: CREATED_AT, referenceHashes: [sourceHash],
        processing: [{ tool: 'theandril-faction-extraction', version: '1', profile: `registered-${contract.native}`, settingsHash: cacheKey(settings), inputHash: sourceHash, outputHash }],
        validation: null, review: null,
        constraints: { transparentPadding: 2, maxColors: 64, binaryAlpha: true, logicalPixelSize: 1, maxPivotDrift: 0, maxBoundingBoxDrift: 0, requireMotion: false, terrain: 'none' },
      });
      return { manifest, png, extraction: { id, role: frame.role, cell: frame.cell, bounds: frame.bounds, nativeBounds: frame.nativeBounds, pivot: contract.pivot, settings, outputHash } };
    });
    prepared.push({ family, source, sourceHash, version, records, warnings: extracted.inspection.warnings });
  }
  // All requested sources/manifests pass before writing any native or brief output.
  for (const family of prepared) for (const record of family.records) {
    await safeAssetPath(root, record.manifest.frames[0]!.sourcePath);
    await safeAssetPath(root, `assets/art/briefs/${record.manifest.id}.json`);
  }
  for (const family of prepared) for (const record of family.records) {
    await write(root, record.manifest.frames[0]!.sourcePath, record.png);
    await write(root, `assets/art/briefs/${record.manifest.id}.json`, JSON.stringify(record.manifest, null, 2) + '\n');
  }
  // Rebuild the dedicated index from qualified briefs only, never foundation assets.
  const files = await readdir(await safeAssetPath(root, 'assets/art/briefs'));
  const assets: string[] = [];
  for (const family of FACTION_ART_FAMILIES) for (const role of FACTION_ART_ROLES) {
    const id = factionArtId(role, `faction.${family}`)!;
    if (files.includes(`${id}.json`)) assets.push(id);
  }
  for (const family of prepared) previousFamilies[family.family] = {
    source: family.source, sourceHash: family.sourceHash, version: family.version,
    assets: family.records.map((record) => record.manifest.id), extraction: family.records.map((record) => record.extraction), warnings: family.warnings,
  };
  const indexedFamilies = Object.fromEntries(FACTION_ART_FAMILIES.flatMap((family) => previousFamilies[family] ? [[family, previousFamilies[family]]] : []));
  await write(root, indexPath, JSON.stringify({ schemaVersion: 1, assets, families: indexedFamilies, note: 'Prepared single-facing static candidates only. Pixel Snapper, Aseprite, validation and individual visual approval remain required.' }, null, 2) + '\n');
  return prepared.map((family) => ({ family: family.family, source: family.source, sourceHash: family.sourceHash, assets: family.records.length, warnings: family.warnings }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2), proposing = args[0] === '--propose-crops';
  const families = parseFactionArguments(proposing ? args.slice(1) : args);
  const operation = proposing ? Promise.all(families.map((family) => prepareFactionCropEvidence(root, family))) : prepareFactionArt(root, families);
  operation
    .then((result) => console.log(JSON.stringify({ prepared: result, approved: 0 }, null, 2)))
    .catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Faction preparation failed.'); process.exitCode = 1; });
}
