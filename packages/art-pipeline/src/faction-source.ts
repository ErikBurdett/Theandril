/** Offline provenance layout, not evidence that a source or approval exists. */
import { z } from 'zod';
import { hashSchema } from './runtime';
import { FACTION_ART_FAMILIES, FACTION_ART_ROLES, factionArtId, isFactionNavalArtRole, type FactionArtFamily, type FactionArtRole } from './faction-art';

export const FACTION_SOURCE_KINDS = {
  ashen_compact: 'sheet', reedbound_council: 'sheet', cinder_march: 'sheet', glass_tide: 'sheet',
  iron_covenant: 'slice12', sepulchral_synod: 'slice12',
  mire_courts: 'batch', saltwind_remnant: 'batch', wardhall_remnant: 'batch',
  rimehorn_clans: 'batch', sable_steppe: 'batch', morrow_spore: 'batch',
} as const satisfies Record<FactionArtFamily, 'sheet' | 'slice12' | 'batch'>;

export const factionExpansionBatchIdSchema = z.string().regex(/^[a-z][a-z0-9_-]{0,47}$/);
const sourceSchema = z.object({
  id: z.string().max(120), role: z.enum(FACTION_ART_ROLES), family: z.enum(FACTION_ART_FAMILIES),
  version: z.number().int().min(1).max(9999), sourcePath: z.string().max(512), sourceHash: hashSchema,
  prompt: z.string().min(1).max(20000), provider: z.literal('codex-imagegen'), model: z.string().min(1).max(100),
  seed: z.string().max(120).nullable(), generatedAt: z.iso.datetime(), referenceHashes: z.array(hashSchema).max(62),
}).strict();
export const factionExpansionBatchSchema = z.object({
  schemaVersion: z.literal(1), batchId: factionExpansionBatchIdSchema, sources: z.array(sourceSchema).min(1).max(90),
}).strict().superRefine((batch, context) => {
  const issue = (message: string) => context.addIssue({ code: 'custom', message });
  for (const key of ['id', 'sourcePath', 'sourceHash'] as const) if (new Set(batch.sources.map(source => source[key])).size !== batch.sources.length) issue(`Duplicate source ${key}; each role requires its own original.`);
  for (const source of batch.sources) {
    const naval = isFactionNavalArtRole(source.role);
    if ((!naval && FACTION_SOURCE_KINDS[source.family] !== 'batch') || source.id !== `${source.role}.${source.family}`) issue(`Unregistered expansion identity ${source.id}`);
    if (naval !== (batch.batchId === 'naval')) issue('Naval originals require the dedicated naval batch; historical land originals retain their source routes.');
    if (source.sourcePath !== `assets/art/source/faction-expansion/${batch.batchId}/${source.id}-v${source.version}.png`) issue(`Unregistered original source path for ${source.id}`);
  }
});
export type FactionExpansionBatch = z.infer<typeof factionExpansionBatchSchema>;

/** Exact retained-original path; candidate/cache/approval copies cannot stand in for generation. */
export function isFactionOriginalSource(family: FactionArtFamily, role: FactionArtRole, path: string): boolean {
  const id = factionArtId(role, `faction.${family}`)!;
  if (isFactionNavalArtRole(role)) return new RegExp(`^assets/art/source/faction-expansion/naval/${id.replaceAll('.', '\\.')}\u002dv[1-9][0-9]*\\.png$`).test(path);
  const kind = FACTION_SOURCE_KINDS[family];
  const name = (kind === 'sheet' ? family : id).replaceAll('.', '\\.');
  const prefix = kind === 'sheet' ? 'assets/art/source/factions/' : kind === 'slice12' ? 'assets/art/source/slice12/' : 'assets/art/source/faction-expansion/[a-z][a-z0-9_-]{0,47}/';
  return new RegExp(`^${prefix}${name}-v[1-9][0-9]*\\.png$`).test(path);
}
