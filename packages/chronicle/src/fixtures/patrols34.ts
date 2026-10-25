import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import type { GameCommand } from '@theandril/sim';
import type { CampaignArchive } from '../index';

const root = new URL('../../../../docs/development/2026-10-24-patrols/historical/', import.meta.url);
type FileSeal = { file: string; sha256: string; gzipSha256: string; bytes: number };
type Case = { save: FileSeal; archive: FileSeal; hash: string; seals: { command: GameCommand; before: string; after: string; result: string }[] };
export const patrol34ManifestBytes = readFileSync(new URL('manifest.json', root));
export const patrol34Manifest = JSON.parse(patrol34ManifestBytes.toString()) as { version: number; sourceRevision: string; contentHash: string; cases: Record<string, Case> };
export const patrol34File = (file: FileSeal) => { const compressed = readFileSync(new URL(file.file, root)); return { compressed, raw: gunzipSync(compressed).toString() }; };
export function historical34(name: string) {
  const entry = patrol34Manifest.cases[name];
  if (!entry) throw new Error(`Unknown historical patrol checkpoint ${name}`);
  return { entry, save: patrol34File(entry.save).raw, archive: JSON.parse(patrol34File(entry.archive).raw) as CampaignArchive };
}
