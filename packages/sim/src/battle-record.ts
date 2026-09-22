import type { CampaignBattle } from './types';

/** Finished battles are history. Deep-freezing a report when it is recorded (or
 * loaded) guarantees that no later command can change it, so its validated
 * canonical copy can be computed once and reused by every hash and save. */
const sealed = new WeakSet<object>();

function deepFreeze(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze((value as Record<string, unknown>)[key]);
}

export function sealBattleReport(report: CampaignBattle): void {
  deepFreeze(report);
  sealed.add(report);
}

/** True only for reports frozen by sealBattleReport, never for merely shallow-frozen objects. */
export function isSealedBattleReport(report: CampaignBattle): boolean {
  return sealed.has(report);
}

/** Memoize a pure projection of a sealed report; unsealed reports are projected on every call. */
export function sealedProjection<T>(cache: WeakMap<CampaignBattle, T>, report: CampaignBattle, project: (report: CampaignBattle) => T): T {
  if (!sealed.has(report)) return project(report);
  let value = cache.get(report);
  if (value === undefined) { value = project(report); deepFreeze(value); cache.set(report, value); }
  return value;
}
