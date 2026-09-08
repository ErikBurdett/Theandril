export interface ArmySizeSource { formationCount?: number; formations?: readonly unknown[] }
/** Own/visible army views already expose formations. Spectator maps expose only
 * a count, never a private roster. Unknown older projections keep one marker.
 */
export function observedFormationCount(army: ArmySizeSource): number {
  const count = army.formationCount ?? army.formations?.length ?? 1;
  return Number.isSafeInteger(count) && count > 0 ? count : 1;
}

const SINGLE = [{ x: 0, y: 0 }] as const;
const PAIR = [{ x: -9, y: -7 }, { x: 7, y: 3 }] as const;
const COMPANY = [{ x: -11, y: -9 }, { x: 11, y: -7 }, { x: 0, y: 5 }] as const;

/** Rear-to-front representatives, not a sprite for each formation or a new army.
 * All figures retain the same approved native scale; no faction-wide tinting.
 */
export function armyRepresentatives(formations: number, far = false) {
  return far || formations <= 1 ? SINGLE : formations < 6 ? PAIR : COMPANY;
}

interface StackMarker extends ArmySizeSource {
  id: string; cell: number; factionId: string; settlement: boolean; ruin?: boolean; domain?: 'land' | 'naval';
}
export interface VisibleMarkerGroup<T> {
  representative: T;
  /** Already observed/cargo-filtered members, retained for selection labels. */
  members: T[];
  armyCount: number;
  formationCount: number;
}

/** Aggregate redundant co-located figures, never the canonical armies. A chosen
 * army keeps its own size/role; without selection the largest wins stable ties.
 * Different realms and domains remain separate even if their artwork matches.
 */
export function groupVisibleMarkers<T extends StackMarker>(entries: readonly T[], selectedId?: string): VisibleMarkerGroup<T>[] {
  const groups = new Map<string, VisibleMarkerGroup<T>>();
  for (const entry of entries) {
    const army = !entry.settlement && !entry.ruin;
    const key = army ? `${entry.cell}/${entry.factionId}/${entry.domain ?? 'land'}` : `entity/${entry.id}`;
    const group = groups.get(key), count = army ? observedFormationCount(entry) : 0;
    if (!group) {
      groups.set(key, { representative: entry, members: [entry], armyCount: Number(army), formationCount: count });
      continue;
    }
    group.members.push(entry); group.armyCount++; group.formationCount += count;
    const current = group.representative, currentCount = observedFormationCount(current);
    if (entry.id === selectedId || current.id !== selectedId && (count > currentCount || count === currentCount && entry.id < current.id)) group.representative = entry;
  }
  return [...groups.values()];
}

/** Called only for already-culled markers on a camera/observation change. */
export function orderVisibleMarkers<T extends { id: string; cell: number; settlement: boolean }>(entries: readonly T[], selectedId: string | undefined, far: boolean): T[] {
  return [...entries].sort((a, b) => {
    const selected = Number(a.id === selectedId) - Number(b.id === selectedId);
    // Near: selected army is drawn last. Far: its representative wins the
    // existing co-located badge aggregation without inventing a new entity.
    return selected * (far ? -1 : 1) || a.cell - b.cell || Number(b.settlement) - Number(a.settlement) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
}
