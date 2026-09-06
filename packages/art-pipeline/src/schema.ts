import { z } from 'zod';
import { assetIdSchema, assetStatusSchema, assetTypeSchema, hashSchema, pivotSchema, provenanceSchema, resolutionSchema, reviewSchema, validationSummarySchema } from './runtime';

export const sourcePathSchema = z.string().min(1).max(512).refine((path) => !path.startsWith('/') && !path.includes('\\') && !path.split('/').some((part) => part === '..' || part === '.' || !part) && !/^[A-Za-z]:/.test(path) && Array.from(path).every((char) => char.charCodeAt(0) >= 32), 'Expected safe relative source path');
export const frameSourceSchema = z.object({ id: assetIdSchema, direction: assetIdSchema, state: assetIdSchema, index: z.number().int().min(0).max(1023), durationMs: z.number().int().min(1).max(60000), pivot: pivotSchema, sourcePath: sourcePathSchema }).strict();
export const processingStepSchema = z.object({ tool: z.string().min(1).max(100), version: z.string().min(1).max(100), profile: z.string().min(1).max(100), settingsHash: hashSchema, inputHash: hashSchema, outputHash: hashSchema }).strict();
export const assetManifestSchema = z.object({
  schemaVersion: z.literal(1), id: assetIdSchema, type: assetTypeSchema, status: assetStatusSchema, version: z.number().int().positive(), nativeResolution: resolutionSchema,
  paletteId: assetIdSchema, contentIds: z.array(assetIdSchema).min(1).max(64), prompt: z.string().min(1).max(20000), frames: z.array(frameSourceSchema).min(1).max(4096),
  animation: z.object({ states: z.record(assetIdSchema, z.object({ frames: z.number().int().min(1).max(1024), fps: z.number().min(0.1).max(120), loop: z.boolean() }).strict()) }).strict(),
  provenance: provenanceSchema, createdAt: z.iso.datetime(), seed: z.string().max(120).optional(), referenceHashes: z.array(hashSchema).max(64).default([]), processing: z.array(processingStepSchema).max(32).default([]),
  validation: validationSummarySchema.nullable().default(null), review: reviewSchema.nullable(),
  constraints: z.object({ transparentPadding: z.number().int().min(0).max(64), maxColors: z.number().int().min(1).max(256), binaryAlpha: z.boolean(), logicalPixelSize: z.number().int().min(1).max(16), maxPivotDrift: z.number().min(0).max(64), maxBoundingBoxDrift: z.number().min(0).max(4096), requireMotion: z.boolean(), terrain: z.enum(['none', 'seamless', 'hex']) }).strict(),
}).strict().superRefine((manifest, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  if (new Set(manifest.frames.map((frame) => frame.id)).size !== manifest.frames.length) issue('Duplicate frame IDs');
  const stateCount = Object.keys(manifest.animation.states).length;
  if (stateCount < 1 || stateCount > 32) issue('Animation requires 1–32 declared states');
  if (new Set(manifest.frames.map((frame) => frame.direction)).size > 16) issue('Animation exceeds 16 declared directions');
  if (new Set(manifest.contentIds).size !== manifest.contentIds.length) issue('Duplicate content IDs');
  if (manifest.constraints.transparentPadding * 2 >= Math.min(manifest.nativeResolution.width, manifest.nativeResolution.height)) issue('Padding leaves no drawable canvas');
  for (const frame of manifest.frames) {
    if (frame.pivot[0] > manifest.nativeResolution.width || frame.pivot[1] > manifest.nativeResolution.height) issue('Frame pivot outside canvas');
    if (!manifest.animation.states[frame.state]) issue('Frame references absent animation state');
  }
  if (['APPROVED', 'ATLASED', 'INTEGRATED'].includes(manifest.status) && (!manifest.review || !manifest.validation?.passed)) issue('Approved status requires passing validation and explicit review');
});
export type AssetManifest = z.infer<typeof assetManifestSchema>;
export type FrameSource = z.infer<typeof frameSourceSchema>;
export const parseAssetManifest = (input: unknown): AssetManifest => assetManifestSchema.parse(input);
