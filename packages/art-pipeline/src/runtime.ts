import { z } from 'zod';
export * from './faction-art';

export const assetIdSchema = z.string().min(1).max(120).regex(/^[a-z][a-z0-9]*(?:[._/-][a-z0-9]+)*$/);
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const assetTypeSchema = z.enum(['unit', 'monster', 'terrain', 'settlement', 'map-object', 'effect', 'ui', 'portrait']);
export const assetStatusSchema = z.enum(['MISSING', 'BRIEF_READY', 'GENERATING', 'CANDIDATE', 'REJECTED', 'VALIDATED', 'APPROVED', 'ATLASED', 'INTEGRATED', 'NEEDS_REVISION']);
const dimension = z.number().int().min(1).max(4096);
export const resolutionSchema = z.object({ width: dimension, height: dimension }).strict();
export const pivotSchema = z.tuple([z.number().int().min(0).max(4096), z.number().int().min(0).max(4096)]);
export const paletteSchema = z.object({ id: assetIdSchema, version: z.number().int().positive(), colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(256), ramps: z.record(z.string().min(1).max(80), z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(64)).optional() }).strict().superRefine((value, context) => {
  if (new Set(value.colors.map((color) => color.toLowerCase())).size !== value.colors.length) context.addIssue({ code: 'custom', message: 'Palette colors must be unique' });
  for (const ramp of Object.values(value.ramps ?? {})) if (ramp.some((color) => !value.colors.some((entry) => entry.toLowerCase() === color.toLowerCase()))) context.addIssue({ code: 'custom', message: 'Ramp color missing from master palette' });
});
export const reviewSchema = z.object({ reviewer: z.string().min(1).max(120), reviewedAt: z.iso.datetime(), notes: z.string().min(12).max(8000), evidencePaths: z.array(z.string().min(1).max(512)).min(1).max(32), inputHash: hashSchema }).strict();
export const provenanceSchema = z.object({ provider: z.string().min(1).max(100), model: z.string().min(1).max(100).optional(), promptHash: hashSchema, sourceRefs: z.array(z.string().min(1).max(512)).min(1).max(64), licenseNotes: z.array(z.string().min(1).max(2000)).min(1).max(32) }).strict();
export const validationSummarySchema = z.object({ score: z.number().min(0).max(100), passed: z.boolean(), reportPath: z.string().min(1).max(512) }).strict();
const rectSchema = z.object({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative(), w: dimension, h: dimension }).strict();
export const runtimeFrameSchema = z.object({ id: assetIdSchema, frame: rectSchema, direction: assetIdSchema, state: assetIdSchema, index: z.number().int().min(0).max(1023), durationMs: z.number().int().min(1).max(60000) }).strict();
export const runtimeClipSchema = z.object({ id: assetIdSchema, direction: assetIdSchema, state: assetIdSchema, frames: z.array(assetIdSchema).min(1).max(1024), durationsMs: z.array(z.number().int().min(1).max(60000)).min(1).max(1024), loop: z.boolean() }).strict();
export const runtimeAssetSchema = z.object({ id: assetIdSchema, type: assetTypeSchema, status: z.enum(['APPROVED', 'ATLASED', 'INTEGRATED']), contentIds: z.array(assetIdSchema).min(1).max(64), nativeResolution: resolutionSchema, pivot: pivotSchema, atlasId: assetIdSchema, frames: z.array(runtimeFrameSchema).min(1).max(4096), clips: z.array(runtimeClipSchema).min(1).max(1024), validation: validationSummarySchema, provenance: provenanceSchema, review: reviewSchema }).strict();
const publicUrl = z.string().max(512).regex(/^\/art\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/).refine((value) => !value.includes('..') && !value.includes('//'), 'Unsafe art URL');
export const atlasReferenceSchema = z.object({ id: assetIdSchema, imageUrl: publicUrl, jsonUrl: publicUrl, width: dimension, height: dimension, sha256: hashSchema }).strict();
export const runtimeCatalogSchema = z.object({ schemaVersion: z.literal(1), palette: paletteSchema, atlases: z.array(atlasReferenceSchema).max(32), assets: z.array(runtimeAssetSchema).max(4096) }).strict().superRefine((catalog, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  const atlases = new Map(catalog.atlases.map((atlas) => [atlas.id, atlas]));
  if (atlases.size !== catalog.atlases.length) issue('Duplicate atlas IDs');
  if (new Set(catalog.assets.map((asset) => asset.id)).size !== catalog.assets.length) issue('Duplicate asset IDs');
  const bindings = new Set<string>();
  const globalFrames = new Set<string>();
  const packed = new Map<string, Array<z.infer<typeof rectSchema>>>();
  if (catalog.atlases.reduce((sum, atlas) => sum + atlas.width * atlas.height * 4, 0) > 128 * 1024 * 1024) { issue('Catalog exceeds the 128 MiB desktop texture budget'); return; }
  if (catalog.assets.reduce((sum, asset) => sum + asset.frames.length, 0) > 8192) { issue('Catalog exceeds the bounded runtime frame count'); return; }
  for (const asset of catalog.assets) {
    const atlas = atlases.get(asset.atlasId);
    if (!atlas) issue(`Missing atlas for ${asset.id}`);
    if (!asset.validation.passed) issue(`Unvalidated runtime asset ${asset.id}`);
    if (asset.pivot[0] > asset.nativeResolution.width || asset.pivot[1] > asset.nativeResolution.height) issue(`Invalid pivot for ${asset.id}`);
    for (const binding of asset.contentIds) { if (bindings.has(binding)) issue(`Duplicate content binding ${binding}`); bindings.add(binding); }
    const frames = new Map(asset.frames.map((frame) => [frame.id, frame]));
    if (frames.size !== asset.frames.length) issue('Duplicate frame IDs');
    for (const frame of asset.frames) {
      if (globalFrames.has(frame.id)) issue('Duplicate global frame ID');
      globalFrames.add(frame.id);
      const occupied = packed.get(asset.atlasId) ?? [];
      const rect = frame.frame;
      if (occupied.some((other) => rect.x < other.x + other.w && rect.x + rect.w > other.x && rect.y < other.y + other.h && rect.y + rect.h > other.y)) issue('Overlapping atlas frame rectangles');
      occupied.push(rect); packed.set(asset.atlasId, occupied);
      if (frame.frame.w !== asset.nativeResolution.width || frame.frame.h !== asset.nativeResolution.height) issue('Frame canvas differs from native resolution');
      if (atlas && (frame.frame.x + frame.frame.w > atlas.width || frame.frame.y + frame.frame.h > atlas.height)) issue('Frame outside atlas');
    }
    const covered = new Set<string>();
    if (new Set(asset.clips.map((clip) => clip.id)).size !== asset.clips.length) issue('Duplicate clip IDs');
    for (const clip of asset.clips) {
      if (clip.frames.length !== clip.durationsMs.length) issue('Clip timing count mismatch');
      for (let index = 0; index < clip.frames.length; index++) {
        const id = clip.frames[index]!;
        const frame = frames.get(id);
        if (!frame || frame.direction !== clip.direction || frame.state !== clip.state || frame.index !== index || frame.durationMs !== clip.durationsMs[index]) issue('Clip/frame mismatch');
        if (covered.has(id)) issue('Frame assigned to more than one clip');
        covered.add(id);
      }
    }
    if (covered.size !== frames.size) issue('Unreferenced runtime frame');
  }
  if (globalFrames.size > 8192) issue('Catalog exceeds the bounded runtime frame count');
});
export const labAssetSchema = z.object({ id: assetIdSchema, type: assetTypeSchema, status: assetStatusSchema, contentIds: z.array(assetIdSchema).max(64), nativeResolution: resolutionSchema, pivot: pivotSchema, previewUrl: publicUrl.nullable(), runtime: runtimeAssetSchema.nullable(), validation: validationSummarySchema.nullable(), provenance: provenanceSchema, review: reviewSchema.nullable(), reasons: z.array(z.string().max(2000)).max(64) }).strict();
export const artLabCatalogSchema = z.object({ schemaVersion: z.literal(1), palette: paletteSchema, atlases: z.array(atlasReferenceSchema).max(32), assets: z.array(labAssetSchema).max(4096) }).strict().superRefine((catalog, context) => {
  if (new Set(catalog.assets.map((asset) => asset.id)).size !== catalog.assets.length) context.addIssue({ code: 'custom', message: 'Duplicate lab asset IDs' });
  for (const asset of catalog.assets) {
    if (asset.runtime && (asset.runtime.id !== asset.id || asset.runtime.status !== asset.status)) context.addIssue({ code: 'custom', message: 'Lab/runtime identity mismatch' });
  }
  const runtime = runtimeCatalogSchema.safeParse({ schemaVersion: 1, palette: catalog.palette, atlases: catalog.atlases, assets: catalog.assets.flatMap((asset) => asset.runtime ? [asset.runtime] : []) });
  if (!runtime.success) context.addIssue({ code: 'custom', message: `Invalid lab runtime subset: ${runtime.error.issues.map((issue) => issue.message).join('; ')}` });
});
export type Palette = z.infer<typeof paletteSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type RuntimeAsset = z.infer<typeof runtimeAssetSchema>;
export type RuntimeCatalog = z.infer<typeof runtimeCatalogSchema>;
export type ArtLabCatalog = z.infer<typeof artLabCatalogSchema>;
export const parseRuntimeCatalog = (input: unknown): RuntimeCatalog => runtimeCatalogSchema.parse(input);
export const parseArtLabCatalog = (input: unknown): ArtLabCatalog => artLabCatalogSchema.parse(input);
