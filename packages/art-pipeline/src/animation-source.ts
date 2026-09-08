import { z } from 'zod';
import { decodePng, encodePng, type ImageRect, type RgbaImage } from './png';
import { normalizePalette } from './palette';
import { sha256 } from './provenance';
import { hashSchema, type Palette } from './runtime';
import { sourcePathSchema } from './schema';

const coordinate = z.number().int().min(0).max(4096);
const rectSchema = z.object({ x: coordinate, y: coordinate, w: coordinate.positive(), h: coordinate.positive() }).strict();
export const animationRecipeSchema = z.object({
  sourceHash: hashSchema,
  sourceSize: z.object({ width: coordinate.positive(), height: coordinate.positive() }).strict(),
  scale: z.object({ numerator: z.number().int().min(1).max(4096), denominator: z.number().int().min(1).max(4096) }).strict(),
  frames: z.array(z.object({ crop: rectSchema, anchor: z.tuple([coordinate, coordinate]) }).strict()).length(4),
  nativeSize: z.literal(64), pivot: z.tuple([z.literal(32), z.literal(56)]),
  alphaThreshold: z.literal(128), transparentPadding: z.literal(2), maxBoundingBoxDrift: z.literal(2),
}).strict();
export type AnimationRecipe = z.infer<typeof animationRecipeSchema>;

const generationSchema = z.object({
  sourcePath: sourcePathSchema, sha256: hashSchema, prompt: z.string().min(1).max(20000),
  provider: z.literal('codex-imagegen'), model: z.literal('not-exposed-by-tool'), seed: z.null(),
  referencePath: sourcePathSchema.optional(), decision: z.enum(['rejected', 'selected-for-native-review']), reason: z.string().min(1).max(4000),
}).strict();
export const animationSourceIndexSchema = z.object({
  schemaVersion: z.literal(1), id: z.literal('unit.scout.ashen_compact'), clip: z.literal('idle'), sourceVersion: z.literal(2),
  layout: z.object({ columns: z.literal(2), rows: z.literal(2) }).strict(),
  reference: z.object({ path: sourcePathSchema, sha256: hashSchema }).strict(),
  generations: z.array(generationSchema).length(2), note: z.string().min(1).max(4000),
}).strict().superRefine((value, context) => {
  const [original, selected] = value.generations;
  if (original!.sourcePath !== 'assets/art/source/animations/unit.scout.ashen_compact-idle-v1.png' || original!.decision !== 'rejected'
    || selected!.sourcePath !== 'assets/art/source/animations/unit.scout.ashen_compact-idle-v2.png' || selected!.decision !== 'selected-for-native-review'
    || selected!.referencePath !== original!.sourcePath || selected!.sha256 === original!.sha256) context.addIssue({ code: 'custom', message: 'Expected retained rejected original and distinct selected alpha-edit source in version order' });
});

/** Reviewed geometry for the actual four-pose original, not generated motion.
 * Both soles retain their observed +583 x / +547 y registration; the anchor is
 * nine source pixels below the forward sole, preserving the reference foot gap.
 * The denominator is the common 369-pixel source height, never a per-frame fit. */
export function scoutIdleRecipe(sourceHash: string): AnimationRecipe {
  return animationRecipeSchema.parse({ sourceHash, sourceSize: { width: 1254, height: 1254 },
    scale: { numerator: 47, denominator: 369 }, frames: [
      { crop: { x: 0, y: 0, w: 627, h: 627 }, anchor: [310, 539] },
      { crop: { x: 627, y: 0, w: 627, h: 627 }, anchor: [893, 539] },
      { crop: { x: 0, y: 627, w: 627, h: 627 }, anchor: [310, 1086] },
      { crop: { x: 627, y: 627, w: 627, h: 627 }, anchor: [893, 1086] },
    ], nativeSize: 64, pivot: [32, 56], alphaThreshold: 128, transparentPadding: 2, maxBoundingBoxDrift: 2 });
}

function bounds(image: RgbaImage, rect: ImageRect, threshold: number): { bounds: ImageRect; transparent: number; fractional: number; opaque: number } {
  let left = rect.x + rect.w, top = rect.y + rect.h, right = -1, bottom = -1, transparent = 0, fractional = 0, opaque = 0;
  for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
    const alpha = image.data[(y * image.width + x) * 4 + 3]!;
    if (!alpha) transparent++; else if (alpha < 255) fractional++; else opaque++;
    if (alpha < threshold) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  if (right < 0) throw new Error('Animation frame has no threshold-visible subject');
  return { bounds: { x: left, y: top, w: right - left + 1, h: bottom - top + 1 }, transparent, fractional, opaque };
}

/** Only common-scale nearest sampling, alpha threshold and palette mapping.
 * Identity/equipment/loop quality still need native and playback visual review. */
export function prepareAnimationSource(sourceBytes: Uint8Array, input: AnimationRecipe, palette: Palette) {
  const recipe = animationRecipeSchema.parse(input);
  if (sha256(sourceBytes) !== recipe.sourceHash) throw new Error('Animation original source hash mismatch');
  const source = decodePng(sourceBytes);
  if (source.width !== recipe.sourceSize.width || source.height !== recipe.sourceSize.height) throw new Error('Animation source dimensions differ from explicit recipe');
  if (recipe.scale.numerator > recipe.scale.denominator) throw new Error('Native import may not upscale source detail');
  const covered = new Uint8Array(source.width * source.height), scale = recipe.scale.numerator / recipe.scale.denominator;
  const frames = recipe.frames.map(({ crop, anchor }, index) => {
    if (crop.x + crop.w > source.width || crop.y + crop.h > source.height || anchor[0] < crop.x || anchor[0] >= crop.x + crop.w
      || anchor[1] < crop.y || anchor[1] >= crop.y + crop.h) throw new Error('Animation crop/anchor outside source');
    for (let y = crop.y; y < crop.y + crop.h; y++) for (let x = crop.x; x < crop.x + crop.w; x++) {
      const at = y * source.width + x;
      if (covered[at]) throw new Error('Animation crops overlap'); covered[at] = 1;
    }
    const stats = bounds(source, crop, recipe.alphaThreshold), b = stats.bounds;
    if (stats.transparent < crop.w * crop.h / 10) throw new Error('Original animation needs genuine zero-alpha margins, not an opaque backdrop');
    if (b.x <= crop.x || b.y <= crop.y || b.x + b.w >= crop.x + crop.w || b.y + b.h >= crop.y + crop.h) throw new Error('Clipped animation original/crop');
    const left = (b.x - anchor[0]) * scale + recipe.pivot[0], top = (b.y - anchor[1]) * scale + recipe.pivot[1];
    if (left < recipe.transparentPadding || top < recipe.transparentPadding || left + b.w * scale > recipe.nativeSize - recipe.transparentPadding
      || top + b.h * scale > recipe.nativeSize - recipe.transparentPadding) throw new Error('Registered subject exceeds native padding; do not clip or individually resize frames');
    const image: RgbaImage = { width: recipe.nativeSize, height: recipe.nativeSize, data: new Uint8Array(recipe.nativeSize ** 2 * 4) };
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const sx = Math.floor(anchor[0] + (x + .5 - recipe.pivot[0]) * recipe.scale.denominator / recipe.scale.numerator);
      const sy = Math.floor(anchor[1] + (y + .5 - recipe.pivot[1]) * recipe.scale.denominator / recipe.scale.numerator);
      if (sx < crop.x || sy < crop.y || sx >= crop.x + crop.w || sy >= crop.y + crop.h) continue;
      const at = (sy * source.width + sx) * 4;
      image.data.set(source.data.subarray(at, at + 4), (y * image.width + x) * 4);
    }
    const normalized = normalizePalette(image, palette, { alphaThreshold: recipe.alphaThreshold }).image;
    const nativeBounds = bounds(normalized, { x: 0, y: 0, w: 64, h: 64 }, 128).bounds, png = encodePng(normalized);
    return { index, image: normalized, png, sha256: sha256(png), pixelHash: sha256(normalized.data), bounds: nativeBounds, source: stats };
  });
  for (let cell = 0; cell < covered.length; cell++) if (!covered[cell] && source.data[cell * 4 + 3]! >= recipe.alphaThreshold) throw new Error('Animation recipe omits visible original pixels');
  if (new Set(frames.map(frame => frame.pixelHash)).size !== frames.length) throw new Error('Animation contains duplicate registered stills; real distinct poses are required');
  const first = frames[0]!.bounds;
  for (const frame of frames) if (Math.max(...(['x', 'y', 'w', 'h'] as const).map(key => Math.abs(frame.bounds[key] - first[key]))) > recipe.maxBoundingBoxDrift) throw new Error('Animation bounding box drift exceeds explicit limit');
  return { recipe, frames };
}
