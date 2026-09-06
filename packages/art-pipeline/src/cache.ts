import { z } from 'zod';
import { assetManifestSchema, sourcePathSchema, type AssetManifest } from './schema';
import { assetIdSchema, hashSchema } from './runtime';
import { cacheKey, verifyCachedFiles } from './provenance';

const cachedFileSchema = z.object({ path: sourcePathSchema, sha256: hashSchema }).strict();
export const assetCacheReceiptSchema = z.object({ schemaVersion: z.literal(1), key: hashSchema, manifestHash: hashSchema, files: z.array(cachedFileSchema).min(1).max(4096), manifest: assetManifestSchema }).strict().superRefine((receipt, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  const paths = new Set(receipt.files.map((file) => file.path));
  if (paths.size !== receipt.files.length) issue('Duplicate cache file paths');
  if (cacheKey(receipt.manifest) !== receipt.manifestHash) issue('Cache manifest checksum mismatch');
  if (!['CANDIDATE', 'VALIDATED', 'NEEDS_REVISION'].includes(receipt.manifest.status)) issue('Cache may contain only unapproved candidate artifacts');
  const localSources: string[] = [];
  for (const path of receipt.manifest.provenance.sourceRefs) {
    if (sourcePathSchema.safeParse(path).success) localSources.push(path);
    else if (!z.url({ protocol: /^https?$/ }).safeParse(path).success) issue('Cache source reference is neither a safe retained path nor an HTTP(S) attribution URL');
  }
  for (const path of [...receipt.manifest.frames.map((frame) => frame.sourcePath), ...localSources]) if (!paths.has(path)) issue(`Cache receipt does not cover referenced source ${path}`);
});
export type AssetCacheReceipt = z.infer<typeof assetCacheReceiptSchema>;

export function createAssetCacheReceipt(key: string, inputManifest: AssetManifest, files: readonly { path: string; sha256: string }[]): AssetCacheReceipt {
  const manifest = assetManifestSchema.parse(inputManifest);
  return assetCacheReceiptSchema.parse({ schemaVersion: 1, key, manifestHash: cacheKey(manifest), files: [...files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0), manifest });
}

/** A malformed, stale, incomplete or foreign receipt is a cache miss, never authority to alter approval. */
export async function verifyAssetCacheReceipt(root: string, input: unknown, expected: { key: string; assetId: string }): Promise<AssetManifest | null> {
  const request = z.object({ key: hashSchema, assetId: assetIdSchema }).strict().parse(expected);
  const parsed = assetCacheReceiptSchema.safeParse(input);
  if (!parsed.success || parsed.data.key !== request.key || parsed.data.manifest.id !== request.assetId) return null;
  if (!await verifyCachedFiles(root, parsed.data.files)) return null;
  return parsed.data.manifest;
}
