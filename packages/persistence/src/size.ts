// Snapshot, legacy envelope and compressed-file bounds are deliberately unchanged.
export const MAX_SAVE_BYTES = 64 * 1024 * 1024;
export const MAX_RECORD_BYTES = 4 * 1024 * 1024;
export const MAX_HISTORY_BYTES = 128 * 1024 * 1024;
export const MAX_CAMPAIGN_BYTES = 192 * 1024 * 1024;
export const MAX_HISTORY_BLOBS = 16_384;
export const MAX_STORED_HISTORY_BYTES = 192 * 1024 * 1024;

/** UTF-8 is the shared unit for snapshots, envelopes and streamed gzip output. */
export function assertSaveSize(text: string, limit = MAX_SAVE_BYTES): void {
  if (text.length > limit || new TextEncoder().encode(text).byteLength > limit) {
    const budget = limit % (1024 * 1024) === 0 ? `${limit / (1024 * 1024)} MiB` : `${limit}-byte`;
    throw new Error(`Save exceeds the ${budget} limit.`);
  }
}
