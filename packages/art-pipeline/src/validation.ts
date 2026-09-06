import { z } from 'zod';
import { assetManifestSchema, type AssetManifest } from './schema';
import { assetIdSchema, hashSchema, paletteSchema, reviewSchema, type Palette, type Review } from './runtime';
import { assertImage, type RgbaImage } from './png';
import { cacheKey, sha256 } from './provenance';
import { paletteRgb } from './palette';

export interface FrameImage { id: string; image: RgbaImage }
export interface FrameMetrics { id: string; hash: string; colors: number; offPalettePixels: number; partialAlphaPixels: number; hiddenColorPixels: number; opaquePixels: number; padding: number; bounds: { x: number; y: number; w: number; h: number } | null; logicalGridErrors: number }
const metricInteger = z.number().int().nonnegative();
export const validationReportSchema = z.object({ schemaVersion: z.literal(1), assetId: assetIdSchema, inputHash: hashSchema, specificationHash: hashSchema, score: z.number().min(0).max(100), passed: z.boolean(), errors: z.array(z.string().max(2000)).max(65536), warnings: z.array(z.string().max(2000)).max(65536), manualChecks: z.array(z.string().max(2000)).max(65536), metrics: z.array(z.object({ id: assetIdSchema, hash: hashSchema, colors: metricInteger, offPalettePixels: metricInteger, partialAlphaPixels: metricInteger, hiddenColorPixels: metricInteger, opaquePixels: metricInteger, padding: metricInteger, bounds: z.object({ x: metricInteger, y: metricInteger, w: metricInteger, h: metricInteger }).strict().nullable(), logicalGridErrors: metricInteger }).strict()).max(4096) }).strict().superRefine((report, context) => {
  if (report.passed !== (report.errors.length === 0)) context.addIssue({ code: 'custom', message: 'Report pass status contradicts errors' });
  if (report.score !== Math.max(0, 100 - report.errors.length * 20 - report.warnings.length * 2)) context.addIssue({ code: 'custom', message: 'Report score contradicts measured findings' });
});
export type ValidationReport = z.infer<typeof validationReportSchema>;

function specificationFor(input: AssetManifest) {
  const manifest = assetManifestSchema.parse(input);
  const { status: _status, validation: _validation, review: _review, ...specification } = manifest;
  // Review and stage are downstream metadata; changing any source, tool, palette or brief invalidates approval.
  void _status; void _validation; void _review;
  return specification;
}
export const assetSpecificationHash = (input: AssetManifest): string => cacheKey(specificationFor(input));
export function assetInputHash(input: AssetManifest, frames: readonly FrameImage[], palette: Palette): string {
  return cacheKey({ specification: specificationFor(input), palette: paletteSchema.parse(palette), frames: [...frames].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map((frame) => { assertImage(frame.image); return { id: frame.id, width: frame.image.width, height: frame.image.height, hash: sha256(frame.image.data) }; }) });
}

export function measureFrame(frame: FrameImage, palette: Palette, logicalPixelSize = 1): FrameMetrics {
  assertImage(frame.image);
  const { width, height, data } = frame.image;
  const allowed = new Set(paletteRgb(palette).map(([r, g, b]) => r * 65536 + g * 256 + b));
  const colors = new Set<number>();
  let offPalettePixels = 0, partialAlphaPixels = 0, hiddenColorPixels = 0, opaquePixels = 0, logicalGridErrors = 0;
  let left = width, right = -1, top = height, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const at = (y * width + x) * 4, alpha = data[at + 3]!, color = data[at]! * 65536 + data[at + 1]! * 256 + data[at + 2]!;
    if (alpha > 0 && alpha < 255) partialAlphaPixels++;
    if (!alpha && color) hiddenColorPixels++;
    if (alpha) { opaquePixels++; colors.add(color); if (!allowed.has(color)) offPalettePixels++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
    if (logicalPixelSize > 1) {
      const base = ((y - y % logicalPixelSize) * width + x - x % logicalPixelSize) * 4;
      if (data[at] !== data[base] || data[at + 1] !== data[base + 1] || data[at + 2] !== data[base + 2] || alpha !== data[base + 3]) logicalGridErrors++;
    }
  }
  return { id: frame.id, hash: sha256(data), colors: colors.size, offPalettePixels, partialAlphaPixels, hiddenColorPixels, opaquePixels, padding: opaquePixels ? Math.min(left, top, width - right - 1, height - bottom - 1) : Math.min(width, height), bounds: opaquePixels ? { x: left, y: top, w: right - left + 1, h: bottom - top + 1 } : null, logicalGridErrors };
}

/** Pixel-center pointy hex test. Renderer projection remains authoritative; this only validates the source mask. */
export function insideHex(x: number, y: number, width: number, height: number): boolean {
  const nx = Math.abs((x + 0.5 - width / 2) / (width / 2));
  const ny = Math.abs((y + 0.5 - height / 2) / (height / 2));
  return nx <= 0.875 && ny <= 1 - nx / 1.75;
}

export function validateAsset(input: AssetManifest, frames: readonly FrameImage[], inputPalette: Palette): ValidationReport {
  const manifest = assetManifestSchema.parse(input), palette = paletteSchema.parse(inputPalette);
  if (frames.length > 4096 || frames.reduce((sum, frame) => sum + frame.image.width * frame.image.height, 0) > 67_108_864) throw new Error('Asset decoded pixels exceed bounded validation limits');
  const errors: string[] = [], warnings: string[] = [];
  const manualChecks = ['Originality, licensing and provenance review', 'Silhouette and role readability at native and zoomed scale', 'Anatomy, equipment continuity, lighting and material consistency'];
  if (manifest.paletteId !== palette.id) errors.push('Manifest palette ID does not match supplied palette');
  if (manifest.provenance.promptHash !== sha256(manifest.prompt)) errors.push('Prompt hash does not match the exact brief prompt');
  if (frames.length !== manifest.frames.length) errors.push('Decoded frame count differs from manifest');
  if (new Set(frames.map((frame) => frame.id)).size !== frames.length) errors.push('Duplicate decoded frame IDs');
  const byId = new Map(frames.map((frame) => [frame.id, frame]));
  for (const frame of frames) if (!manifest.frames.some((source) => source.id === frame.id)) errors.push(`Unexpected decoded frame ${frame.id}`);
  const metrics: FrameMetrics[] = [];
  for (const source of manifest.frames) {
    const frame = byId.get(source.id);
    if (!frame) { errors.push(`Missing decoded frame ${source.id}`); continue; }
    const result = measureFrame(frame, palette, manifest.constraints.logicalPixelSize);
    metrics.push(result);
    const fail = (message: string) => errors.push(`${source.id}: ${message}`);
    if (frame.image.width !== manifest.nativeResolution.width || frame.image.height !== manifest.nativeResolution.height) fail('dimensions differ from manifest');
    if (!result.opaquePixels) fail('frame is entirely transparent');
    if (result.offPalettePixels) fail(`${result.offPalettePixels} off-palette pixels`);
    if (result.colors > manifest.constraints.maxColors) fail('color limit exceeded');
    if (manifest.constraints.binaryAlpha && result.partialAlphaPixels) fail(`${result.partialAlphaPixels} partially transparent pixels`);
    if (result.hiddenColorPixels) fail('colored transparent pixels risk edge halos');
    if (result.padding < manifest.constraints.transparentPadding) fail('transparent padding below required margin');
    if (result.logicalGridErrors) fail('pixels are not aligned to the requested logical grid');
    if (manifest.constraints.terrain === 'seamless') {
      const { width, height, data } = frame.image;
      let mismatches = 0;
      for (let y = 0; y < height; y++) for (let channel = 0; channel < 4; channel++) if (data[(y * width) * 4 + channel] !== data[(y * width + width - 1) * 4 + channel]) mismatches++;
      for (let x = 0; x < width; x++) for (let channel = 0; channel < 4; channel++) if (data[x * 4 + channel] !== data[((height - 1) * width + x) * 4 + channel]) mismatches++;
      if (mismatches) fail(`opposite repeat edges differ in ${mismatches} channels`);
    } else if (manifest.constraints.terrain === 'hex') {
      const { width, height, data } = frame.image;
      let cracks = 0, spill = 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const expected = insideHex(x, y, width, height), alpha = data[(y * width + x) * 4 + 3]!;
        if (expected && alpha !== 255) cracks++;
        if (!expected && alpha) spill++;
      }
      if (cracks) fail(`hex ground mask has ${cracks} uncovered pixels`);
      if (spill) fail(`hex ground mask has ${spill} pixels outside its pointy footprint`);
    }
  }
  const metricsById = new Map(metrics.map((metric) => [metric.id, metric]));
  const directions = [...new Set(manifest.frames.map((frame) => frame.direction))].sort();
  for (const [state, definition] of Object.entries(manifest.animation.states)) for (const direction of directions) {
    const sequence = manifest.frames.filter((frame) => frame.state === state && frame.direction === direction).sort((a, b) => a.index - b.index);
    const name = `${state}/${direction}`;
    if (sequence.length !== definition.frames || sequence.some((frame, index) => frame.index !== index)) errors.push(`${name}: frame indices/count must be complete and contiguous`);
    if (sequence.some((frame) => Math.abs(frame.durationMs - 1000 / definition.fps) > 1)) errors.push(`${name}: frame durations disagree with declared fps`);
    const first = sequence[0];
    if (!first) continue;
    const initial = metricsById.get(first.id)?.bounds;
    for (const frame of sequence) {
      if (Math.hypot(frame.pivot[0] - first.pivot[0], frame.pivot[1] - first.pivot[1]) > manifest.constraints.maxPivotDrift) errors.push(`${name}: pivot drift exceeds limit`);
      const bounds = metricsById.get(frame.id)?.bounds;
      if (initial && bounds && Math.max(Math.abs(bounds.x - initial.x), Math.abs(bounds.y - initial.y), Math.abs(bounds.w - initial.w), Math.abs(bounds.h - initial.h)) > manifest.constraints.maxBoundingBoxDrift) errors.push(`${name}: bounding box drift exceeds limit`);
    }
    if (sequence.length > 1) {
      const unique = new Set(sequence.map((frame) => metricsById.get(frame.id)?.hash));
      if (unique.size === 1 && manifest.constraints.requireMotion) errors.push(`${name}: animation contains only duplicate frames`);
      else if (unique.size < sequence.length) warnings.push(`${name}: repeated frame images require intentional-hold review`);
      manualChecks.push(`${name}: review temporal flicker, direction, equipment, visual identity and ${definition.loop ? 'loop seam' : 'end pose'}`);
    }
  }
  if (manifest.constraints.terrain !== 'none') manualChecks.push('Inspect repeated/randomized terrain with neighboring biomes at every zoom; transitions and semantic road/river continuity are not established by mask tests');
  return validationReportSchema.parse({ schemaVersion: 1, assetId: manifest.id, inputHash: assetInputHash(manifest, frames, palette), specificationHash: assetSpecificationHash(manifest), score: Math.max(0, 100 - errors.length * 20 - warnings.length * 2), passed: errors.length === 0, errors, warnings, manualChecks, metrics });
}

export function approveAsset(input: AssetManifest, inputReport: ValidationReport, inputReview: Review, reportPath = `reports/${input.id}.json`): AssetManifest {
  const manifest = assetManifestSchema.parse(input), report = validationReportSchema.parse(inputReport), review = reviewSchema.parse(inputReview);
  if (!report.passed || report.errors.length || report.assetId !== manifest.id || report.specificationHash !== assetSpecificationHash(manifest) || review.inputHash !== report.inputHash) throw new Error('Approval requires passing validation and visual review bound to the exact input hash');
  if (!['CANDIDATE', 'VALIDATED', 'NEEDS_REVISION'].includes(manifest.status)) throw new Error('Only a candidate or validated revision may be explicitly approved');
  return assetManifestSchema.parse({ ...manifest, status: 'APPROVED', review, validation: { score: report.score, passed: true, reportPath } });
}
