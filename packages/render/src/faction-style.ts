import { factionArtId, unitArtRole } from '@theandril/art-pipeline/runtime';

export interface EntityArtSelection {
  requestedId: string | null;
  contentId: string | null;
  presentation: 'faction' | 'shared' | 'generic' | 'strategic' | 'procedural';
  warning: string | null;
}

/** Pure presentation lookup: names, seat numbers and enemy colors never select a culture. */
export function selectEntityArt(role: string, definitionId: string | undefined, far: boolean, available: (id: string) => boolean): EntityArtSelection {
  if (role === 'map.ruin') return { requestedId: role, contentId: !far && available(role) ? role : null, presentation: !far && available(role) ? 'generic' : 'procedural', warning: null };
  const artworkRole = unitArtRole(role);
  const displayedRole = far ? role.startsWith('settlement.') ? 'ui.banner' : 'ui.badge' : artworkRole;
  const requestedId = definitionId ? factionArtId(displayedRole, definitionId) : undefined;
  if (requestedId && available(requestedId)) return { requestedId, contentId: requestedId, presentation: far ? 'strategic' : artworkRole !== role ? 'shared' : 'faction', warning: null };
  const contentId = !far && available(artworkRole) ? artworkRole : null;
  const reason = requestedId ? `Faction artwork unavailable: ${requestedId}` : `Unrecognized faction artwork binding: ${definitionId ?? '(missing definition)'}/${displayedRole}`;
  return { requestedId: requestedId ?? null, contentId, presentation: contentId ? 'generic' : 'procedural', warning: `${reason}; ${contentId ? `using generic ${role}` : 'using procedural role marker'}.` };
}
