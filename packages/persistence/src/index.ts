import Dexie from 'dexie';
import { gzipSync, strFromU8, strToU8 } from 'fflate';
import { deserializeGame, serializeGame } from '@theandril/sim';
import type { GameState } from '@theandril/sim';
import { checksum } from '@theandril/content';
import { createArchive, parseArchive, type CampaignArchive, type CampaignJournal } from '@theandril/chronicle';
import { assertSaveSize, MAX_SAVE_BYTES } from './size';
import { CAMPAIGN_STORES, CampaignStorage, migrateLegacyGenerations, type SaveKind } from './campaign-storage';
export type { CampaignSaveStats, SaveKind } from './campaign-storage';

const MAX_BYTES = MAX_SAVE_BYTES;

/** The archive is persisted atomically with its snapshot, outside canonical game rules. */
export function serializeCampaign(game: GameState, archive: CampaignArchive): string {
  const payload = { snapshot: serializeGame(game), archive };
  const payloadText = JSON.stringify(payload);
  const text = JSON.stringify({ format: 'theandril-campaign', version: 1, checksum: checksum(payloadText), ...payload });
  assertSaveSize(text);
  return text;
}

export function deserializeCampaign(text: string): { game: GameState; archive: CampaignArchive } {
  assertSaveSize(text);
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('Save is not valid JSON.'); }
  if (!raw || typeof raw !== 'object' || !('format' in raw)) {
    const game = deserializeGame(text);
    return { game, archive: createArchive(game, { mode: 'player', coverage: 'from-save' }) };
  }
  const envelope = raw as Record<string, unknown>;
  if (envelope.format !== 'theandril-campaign' || envelope.version !== 1 || typeof envelope.snapshot !== 'string'
    || Object.keys(envelope).sort().join(',') !== 'archive,checksum,format,snapshot,version') throw new Error('Unsupported campaign envelope.');
  if (envelope.checksum !== checksum(JSON.stringify({ snapshot: envelope.snapshot, archive: envelope.archive }))) throw new Error('Campaign archive checksum mismatch.');
  const game = deserializeGame(envelope.snapshot);
  return { game, archive: parseArchive(envelope.archive, game) };
}

function validateSave(text: string): GameState {
  // Preserve compatibility of the raw canonical snapshot API used by tools/fixtures.
  const raw: unknown = JSON.parse(text);
  return raw && typeof raw === 'object' && 'format' in raw ? deserializeCampaign(text).game : deserializeGame(text);
}

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
    assertSaveSize(text);
    const game = validateSave(text);
    await this.campaignStorage.saveLegacy(text, kind, game.turn);
  }
  async loadLatest(kind: SaveKind): Promise<string> {
    return this.campaignStorage.loadText(kind);
  }
}

export async function exportSave(text: string): Promise<Uint8Array> {
  assertSaveSize(text);
  validateSave(text);
  return gzipSync(strToU8(text));
}

/** Count actual streamed output; platform gzip decoding verifies CRC and trailer integrity. */
export async function importSave(bytes: Uint8Array): Promise<string> {
  if (bytes.byteLength < 18 || bytes.byteLength > MAX_BYTES || bytes[0] !== 31 || bytes[1] !== 139) throw new Error('Not a compressed .theandril save.');
  const expectedSize = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(bytes.byteLength - 4, true);
  if (expectedSize > MAX_BYTES) throw new Error('Expanded save exceeds the 64 MiB limit.');
  const reader = new Blob([new Uint8Array(bytes).buffer]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES || total > expectedSize) {
        await reader.cancel();
        throw new Error('Save decompression exceeds its declared size or the 64 MiB limit.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (total !== expectedSize) throw new Error('Save decompression length mismatch.');
  const expanded = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { expanded.set(chunk, offset); offset += chunk.length; }
  const text = strFromU8(expanded);
  const raw: unknown = JSON.parse(text);
  if (raw && typeof raw === 'object' && 'format' in raw) {
    const { game, archive } = deserializeCampaign(text);
    return serializeCampaign(game, archive);
  }
  return serializeGame(deserializeGame(text));
}
