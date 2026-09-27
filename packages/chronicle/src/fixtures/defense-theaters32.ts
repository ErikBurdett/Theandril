import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { CampaignArchive } from '../index';

const root = new URL('../../../../docs/development/2026-09-27-defense-theaters/historical/', import.meta.url);
export const defenseTheaters32ManifestBytes = readFileSync(new URL('manifest.json', root));
export interface HistoricalFile { file: string; bytes: number; sha256: string; gzipBytes: number; gzipSha256: string }
interface Checkpoint { hash: string; records: number; factions: number; save: HistoricalFile; archive: HistoricalFile }
export const defenseTheaters32 = JSON.parse(defenseTheaters32ManifestBytes.toString('utf8')) as {
  version: number; contentHash: string; sourceRevision: string; cases: Record<string, Checkpoint>;
};
export function historical32File(file: HistoricalFile) {
  const compressed = readFileSync(new URL(file.file, root));
  return { compressed, raw: gunzipSync(compressed) };
}
export function historical32(name: string) {
  const entry = defenseTheaters32.cases[name];
  if (!entry) throw new Error(`Missing independently captured rules32 checkpoint: ${name}`);
  const save = historical32File(entry.save).raw.toString('utf8');
  const archiveText = historical32File(entry.archive).raw.toString('utf8');
  return { entry, save, archiveText, archive: JSON.parse(archiveText) as CampaignArchive };
}
