import Dexie from 'dexie';
import { Gzip, strToU8 } from 'fflate';
import { deserializeGame, serializeGame } from '@theandril/sim';
import type { GameState } from '@theandril/sim';
import { checksum } from '@theandril/content';
import { createArchive, parseArchive, type CampaignArchive, type CampaignJournal } from '@theandril/chronicle';
import { assertSaveSize, MAX_SAVE_BYTES, MAX_CAMPAIGN_BYTES, MAX_HISTORY_BYTES, MAX_RECORD_BYTES } from './size';
import { CAMPAIGN_STORES, CampaignStorage, logicalCampaignBytes, migrateLegacyGenerations, type SaveKind } from './campaign-storage';
export type { CampaignSaveStats, SaveKind } from './campaign-storage';

const PORTABLE_V2 = new Uint8Array([84, 65, 67, 50]); // TAC2, then one gzip member.
const utf8Bytes = (text: string) => new TextEncoder().encode(text).byteLength;

/** Preflight sections before whole-envelope encoding or semantic archive cloning. */
function campaignBytes(snapshot: string, raw: unknown, extended: boolean | 'auto'): number {
  assertSaveSize(snapshot);
  if (!raw || typeof raw !== 'object' || !('initialSave' in raw) || typeof raw.initialSave !== 'string'
    || !('records' in raw) || !Array.isArray(raw.records) || raw.records.length > 1_000_000) throw new Error('Invalid campaign archive sections.');
  const archive = raw as CampaignArchive;
  const { initialSave, records, ...header } = archive;
  // Origins keep their original bound, independently of aggregate history.
  assertSaveSize(JSON.stringify({ version: 1, type: 'origin', initialSave }));
  let recordBytes = 0; let largestRecord = 0;
  for (const record of records) {
    const json = JSON.stringify(record);
    const size = utf8Bytes(json); largestRecord = Math.max(largestRecord, size); recordBytes += size;
    if (recordBytes > (extended ? MAX_HISTORY_BYTES : MAX_SAVE_BYTES)) throw new Error('Campaign history exceeds its byte limit.');
  }
  const total = logicalCampaignBytes(snapshot, header, utf8Bytes(JSON.stringify(initialSave)), recordBytes, records.length);
  if (total > (extended ? MAX_CAMPAIGN_BYTES : MAX_SAVE_BYTES)) throw new Error('Campaign exceeds its logical byte limit.');
  if ((extended === true || total > MAX_SAVE_BYTES) && largestRecord > MAX_RECORD_BYTES) throw new Error('A history record exceeds the 4 MiB limit.');
  return total;
}

/** The archive is persisted atomically with its snapshot, outside canonical game rules. */
export function serializeCampaign(game: GameState, archive: CampaignArchive): string {
  const payload = { snapshot: serializeGame(game), archive };
  const logicalBytes = campaignBytes(payload.snapshot, archive, 'auto');
  const version = logicalBytes > MAX_SAVE_BYTES ? 2 : 1;
  const payloadText = JSON.stringify(payload);
  // Reuse the encoded body rather than JSON-stringifying the full history twice.
  const text = `{"format":"theandril-campaign","version":${version},"checksum":"${checksum(payloadText)}",${payloadText.slice(1)}`;
  assertSaveSize(text, version === 2 ? MAX_CAMPAIGN_BYTES : MAX_SAVE_BYTES);
  return text;
}

/** Parse a trust boundary once; do not keep a second unvalidated copy of a large archive alive. */
function readSave(text: string): { game: GameState; archive?: CampaignArchive; envelopeVersion: 1 | 2 | null } {
  assertSaveSize(text, MAX_CAMPAIGN_BYTES);
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('Save is not valid JSON.'); }
  if (!raw || typeof raw !== 'object' || !('format' in raw)) {
    assertSaveSize(text);
    const game = deserializeGame(text);
    return { game, envelopeVersion: null };
  }
  const envelope = raw as Record<string, unknown>;
  if (envelope.format !== 'theandril-campaign' || ![1, 2].includes(envelope.version as number) || typeof envelope.snapshot !== 'string'
    || Object.keys(envelope).sort().join(',') !== 'archive,checksum,format,snapshot,version') throw new Error('Unsupported campaign envelope.');
  assertSaveSize(text, envelope.version === 2 ? MAX_CAMPAIGN_BYTES : MAX_SAVE_BYTES);
  campaignBytes(envelope.snapshot, envelope.archive, envelope.version === 2);
  if (envelope.checksum !== checksum(JSON.stringify({ snapshot: envelope.snapshot, archive: envelope.archive }))) throw new Error('Campaign archive checksum mismatch.');
  const game = deserializeGame(envelope.snapshot);
  return { game, archive: parseArchive(envelope.archive, game), envelopeVersion: envelope.version as 1 | 2 };
}

export function deserializeCampaign(text: string): { game: GameState; archive: CampaignArchive } {
  const { game, archive } = readSave(text);
  return { game, archive: archive ?? createArchive(game, { mode: 'player', coverage: 'from-save' }) };
}

function validateSave(text: string): GameState { return readSave(text).game; }

/** Writes and rotation are one transaction; a failed save cannot evict a valid one. */
export class SaveStore extends Dexie {
  private readonly campaignStorage: CampaignStorage;
  constructor(name = 'theandril-campaigns') {
    super(name);
    this.version(1).stores({ saves: '++id,kind' });
    this.version(2).stores(CAMPAIGN_STORES).upgrade(migrateLegacyGenerations);
    this.campaignStorage = new CampaignStorage(this, { validate: validateSave, parse: deserializeCampaign, serialize: serializeCampaign });
  }
  get lastCampaignSaveStats() { return this.campaignStorage.lastSaveStats; }
  async saveCampaign(game: GameState, journal: CampaignJournal, kind: SaveKind): Promise<void> { await this.campaignStorage.saveCampaign(game, journal, kind); }
  async loadLatestCampaign(kind: SaveKind): Promise<{ game: GameState; journal: CampaignJournal }> { return this.campaignStorage.loadCampaign(kind); }
  async save(text: string, kind: SaveKind): Promise<void> {
    const game = validateSave(text);
    await this.campaignStorage.saveLegacy(text, kind, game.turn);
  }
  async loadLatest(kind: SaveKind): Promise<string> { return this.campaignStorage.loadText(kind); }
}

export async function exportSave(text: string): Promise<Uint8Array> {
  const extended = readSave(text).envelopeVersion === 2;
  const chunks: Uint8Array[] = extended ? [PORTABLE_V2] : [];
  let total = extended ? PORTABLE_V2.length : 0;
  const compressor = new Gzip({ level: 6, mtime: 0 }, chunk => {
    total += chunk.byteLength;
    if (total > MAX_SAVE_BYTES) throw new Error('Compressed save exceeds the 64 MiB limit.');
    chunks.push(chunk);
  });
  for (let from = 0; from < text.length;) {
    let to = Math.min(from + 64 * 1024, text.length);
    // Never split a surrogate pair across independent UTF-8 encoder calls.
    if (to < text.length && text.charCodeAt(to - 1) >= 0xd800 && text.charCodeAt(to - 1) <= 0xdbff) to--;
    compressor.push(strToU8(text.slice(from, to)), to === text.length); from = to;
  }
  const result = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

/** Count streamed output; platform gzip decoding verifies CRC and trailer integrity. */
export async function importSave(bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength > MAX_SAVE_BYTES) throw new Error('Compressed save exceeds the 64 MiB limit.');
  const extended = PORTABLE_V2.every((byte, index) => bytes[index] === byte);
  const compressed = extended ? bytes.subarray(PORTABLE_V2.length) : bytes;
  const limit = extended ? MAX_CAMPAIGN_BYTES : MAX_SAVE_BYTES;
  if (compressed.byteLength < 18 || compressed[0] !== 31 || compressed[1] !== 139) throw new Error('Not a compressed .theandril save.');
  const expectedSize = new DataView(compressed.buffer, compressed.byteOffset, compressed.byteLength).getUint32(compressed.byteLength - 4, true);
  if (expectedSize > limit) throw new Error('Expanded save exceeds its format byte limit.');
  const reader = new Blob([new Uint8Array(compressed).buffer]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks: string[] = [];
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit || total > expectedSize) {
        await reader.cancel();
        throw new Error('Save decompression exceeds its declared size or format byte limit.');
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } catch (error) {
    // Cancellation can itself reject after CRC/codec failure; preserve the original failure.
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally { reader.releaseLock(); }
  if (total !== expectedSize) throw new Error('Save decompression length mismatch.');
  chunks.push(decoder.decode());
  const text = chunks.join('');
  const { game, archive, envelopeVersion } = readSave(text);
  if (extended !== (envelopeVersion === 2)) throw new Error('Portable tag and campaign envelope version differ.');
  return archive ? serializeCampaign(game, archive) : serializeGame(game);
}
