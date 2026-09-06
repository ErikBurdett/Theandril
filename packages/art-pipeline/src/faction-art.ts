/** Authored cultures, not campaign seat IDs or player-editable faction names. */
export const FACTION_ART_FAMILIES = ['ashen_compact', 'reedbound_council', 'cinder_march', 'glass_tide'] as const;
export const FACTION_ART_ROLES = [
  'unit.colonist', 'unit.scout', 'unit.guard', 'unit.spearman', 'unit.heavy_infantry', 'unit.cavalry',
  'character.marshal', 'character.surveyor', 'character.engineer',
  'settlement.village', 'settlement.town', 'settlement.city',
  'ui.crest', 'ui.badge', 'ui.banner',
] as const;
export type FactionArtFamily = typeof FACTION_ART_FAMILIES[number];
export type FactionArtRole = typeof FACTION_ART_ROLES[number];
export type FactionArtId = `${FactionArtRole}.${FactionArtFamily}`;

const definitions = new Map<string, FactionArtFamily>(FACTION_ART_FAMILIES.map(family => [`faction.${family}`, family]));
const roles = new Set<string>(FACTION_ART_ROLES);

/** Qualified IDs are exclusive catalog bindings; never bind variants to the generic role. */
export function factionArtId(contentId: string, definitionId: string): FactionArtId | undefined {
  const family = definitions.get(definitionId);
  return family && roles.has(contentId) ? `${contentId as FactionArtRole}.${family}` : undefined;
}

export const FACTION_ART_IDS: readonly FactionArtId[] = FACTION_ART_FAMILIES.flatMap(family => FACTION_ART_ROLES.map(role => `${role}.${family}` as FactionArtId));
