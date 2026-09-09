/** Deliberate visual reuse, not new asset provenance or dedicated content bindings.
 * Keep shared silhouettes here until individually reviewed specialist art exists. */
export const SHARED_UNIT_ART: Readonly<Record<string, { role: string; label: string }>> = {
  'unit.skirmisher': { role: 'unit.scout', label: 'wayfinder' },
  'unit.arbalester': { role: 'unit.scout', label: 'wayfinder' },
  'unit.halberdier': { role: 'unit.spearman', label: 'pike company' },
  'unit.lancer': { role: 'unit.cavalry', label: 'outrider' },
};

export function unitArtRole(contentId: string): string {
  return SHARED_UNIT_ART[contentId]?.role ?? contentId;
}
