import type { Army, BattleDefense } from './types';

export const BATTLE_FORMATION_LIMIT = 20;
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Whole containers keep their officers/cargo intact. Nonparticipants remain on
 * the strategic tile; a tactical victory cannot occupy ground they still hold. */
export function selectDefendingArmies<T extends Pick<Army, 'id' | 'formations'>>(armies: readonly T[], targetId?: string): T[] {
  const ordered = [...armies].sort((a, b) => Number(b.id === targetId) - Number(a.id === targetId) || byId(a, b));
  const selected: T[] = [];
  let remaining = BATTLE_FORMATION_LIMIT;
  for (const army of ordered) {
    if (army.formations.length > remaining) continue;
    selected.push(army);
    remaining -= army.formations.length;
  }
  return selected.sort(byId);
}

/** Omit the optional packet when every defender fits; never include cargo. */
export function defensePreview(armies: readonly Army[], targetId?: string): BattleDefense | undefined {
  const totalFormations = armies.reduce((sum, army) => sum + army.formations.length, 0);
  if (totalFormations <= BATTLE_FORMATION_LIMIT) return undefined;
  const engaged = selectDefendingArmies(armies, targetId);
  const strength = (group: readonly Army[]) => group.reduce((sum, army) => sum + army.formations.reduce((sum, item) => sum + item.strength, 0), 0);
  const engagedFormations = engaged.reduce((sum, army) => sum + army.formations.length, 0), engagedStrength = strength(engaged);
  return { engagedFormations, engagedStrength, reserveFormations: totalFormations - engagedFormations, reserveStrength: strength(armies) - engagedStrength };
}
