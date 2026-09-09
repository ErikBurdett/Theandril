import { FACTION_RECRUITMENT_WEIGHTS, LAND_MILITARY_UNIT_IDS, type LandMilitaryUnitId } from '@theandril/content';

/** Stable tie order, then weighted repeats; locked specialists are filtered by canonical production quotes. */
export function recruitmentRoster(definitionId: string | undefined): LandMilitaryUnitId[] {
  const weights = FACTION_RECRUITMENT_WEIGHTS[definitionId ?? ''] ?? FACTION_RECRUITMENT_WEIGHTS['faction.ashen_compact']!;
  return [...LAND_MILITARY_UNIT_IDS, ...LAND_MILITARY_UNIT_IDS.flatMap(id => Array<LandMilitaryUnitId>(weights[id] - 1).fill(id))];
}
