/** Shared read/planning budget; summaries remain complete and in canonical order. */
export const LAND_PLANNING_TOWN_LIMIT = 8;

/** Only public turn metadata is needed to select this round's detailed towns. */
export function aiObservationOptions(turn: number): { landDetails: { offset: number; limit: number } } {
  const offset = (turn - 1) * LAND_PLANNING_TOWN_LIMIT;
  if (!Number.isSafeInteger(turn) || turn < 1 || !Number.isSafeInteger(offset)) throw new Error('AI observation turn must be a positive, safely representable integer.');
  return { landDetails: { offset, limit: LAND_PLANNING_TOWN_LIMIT } };
}

/** Match the observation selector without reordering or discarding its summaries. */
export function landPlanningTowns<T>(entries: readonly T[], turn: number): T[] {
  const { offset, limit } = aiObservationOptions(turn).landDetails;
  if (!entries.length) return [];
  const start = offset % entries.length;
  return Array.from({ length: Math.min(limit, entries.length) }, (_, index) => entries[(start + index) % entries.length]!);
}
