import { MAX_SELECTION_GROUPS_PER_FACTION, MAX_SELECTION_GROUP_MEMBERS, SELECTION_GROUP_NAME_MAX, type SelectionGroup } from '@theandril/sim';

/** Validate the compact worker read model before React or request completion.
 * Canonical membership and command validation remain in packages/sim. */
export function assertSelectionGroupResponse(value: unknown, factionId: string): asserts value is SelectionGroup[] {
  const bad = () => { throw new Error('The saved group update could not be read. Restore a saved campaign.'); };
  if (!Array.isArray(value) || value.length > MAX_SELECTION_GROUPS_PER_FACTION) return bad();
  const ids = new Set<string>();
  for (const group of value) {
    if (!group || typeof group !== 'object' || typeof group.id !== 'string' || !/^selection-group\.[1-9][0-9]*$/.test(group.id) || group.id.length > 40
      || ids.has(group.id) || group.factionId !== factionId || !['armies', 'settlements'].includes(group.kind)
      || typeof group.name !== 'string' || !group.name.trim() || group.name.length > SELECTION_GROUP_NAME_MAX
      || !Array.isArray(group.memberIds) || group.memberIds.length > MAX_SELECTION_GROUP_MEMBERS
      || Array.from(group.memberIds).some((id: unknown) => typeof id !== 'string' || id.length < 1 || id.length > 100)
      || new Set(group.memberIds).size !== group.memberIds.length) return bad();
    ids.add(group.id);
  }
}
