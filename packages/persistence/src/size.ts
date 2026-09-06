export const MAX_SAVE_BYTES = 64 * 1024 * 1024;

/** Enforce the same UTF-8 byte budget as the bounded gzip decoder. */
export function assertSaveSize(text: string, limit = MAX_SAVE_BYTES): void {
  if (text.length > limit || new TextEncoder().encode(text).byteLength > limit) throw new Error('Save exceeds the 64 MiB limit.');
}
