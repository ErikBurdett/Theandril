import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { CampaignArchive } from '../index';

const root = new URL('../../../../docs/development/2026-09-27-reinforcement-logistics/historical/', import.meta.url);
export const logistics33ManifestBytes = readFileSync(new URL('manifest.json', root));
export interface HistoricalFile { file: string; bytes: number; sha256: string; gzipBytes: number; gzipSha256: string }
interface Checkpoint {
  hash: string; records: number; factions: number; majorFactions: number; save: HistoricalFile; archive: HistoricalFile;
  commandSeals: { sequence: number; beforeHash: string; afterHash: string; resultSha256: string }[];
}
export const logistics33 = JSON.parse(logistics33ManifestBytes.toString('utf8')) as {
  version: number; contentHash: string; sourceRevision: string; acceptedCommands: number;
  continuationPairs: [string, string][]; cases: Record<string, Checkpoint>;
};
export function historical33File(file: HistoricalFile) {
  const compressed = readFileSync(new URL(file.file, root));
  return { compressed, raw: gunzipSync(compressed) };
}
export function historical33(name: string) {
  const entry = logistics33.cases[name];
  if (!entry) throw new Error(`Missing independently captured rules33 checkpoint: ${name}`);
  const save = historical33File(entry.save).raw.toString('utf8');
  const archiveText = historical33File(entry.archive).raw.toString('utf8');
  return { entry, save, archiveText, archive: JSON.parse(archiveText) as CampaignArchive };
}
