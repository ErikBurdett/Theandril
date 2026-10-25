/** Prepared policy only. Promotion must import the canonical public siege query. */
import { neighbors } from '../../../packages/mapgen/src';
import type { ArmyView, GameCommand, Observation, VictoryProject } from '../../../packages/sim/src';
import { heldDelegatedArmyIds } from '../../../packages/ai/src/theaters';

export const MAX_COUNTERPLAY_PROJECTS = 8;
export const MAX_COUNTERPLAY_QUERIES = 4;
export const COUNTERPLAY_PEACE_HORIZON = 10;
type CounterplayObservation = Observation & { siegeEstablishment?: true };
export type BesiegeQuery = (view: Observation, armyId: string, settlementId: string) => {
  armyId: string; settlementId: string; canBesiege: boolean; blocker: string | null;
};
export interface CounterplayReview {
  command: Extract<GameCommand, { type: 'besiege' }> | null;
  project: VictoryProject | null;
  reason: string | null;
  consideredProjects: number;
  siegeQueries: number;
}
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** One immediately available interruption. Candidate/quote bounds and current
 * permitted sight replace speculative distant operations or cloned-state probes. */
export function reviewProjectCounterplay(
  view: CounterplayObservation,
  protectedIds: ReadonlySet<string>,
  query: BesiegeQuery,
  horizon = COUNTERPLAY_PEACE_HORIZON,
  enemyId?: string,
): CounterplayReview {
  const result: CounterplayReview = { command: null, project: null, reason: null, consideredProjects: 0, siegeQueries: 0 };
  if (!view.siegeEstablishment || view.victory || view.battle || view.pendingCapture) return result;
  const remaining = (project: VictoryProject) => project.requiredTurns - project.progress;
  const ownSoonest = view.projects.reduce((soonest, project) => project.factionId === view.factionId && project.status === 'active'
    && remaining(project) > 0 ? Math.min(soonest, remaining(project)) : soonest, Infinity);
  const wars = new Set(view.wars), hosts = new Map(view.settlements.map(town => [town.id, town]));
  const projects = view.projects.filter(project => project.factionId !== view.factionId && (!enemyId || project.factionId === enemyId)
    && wars.has(project.factionId) && !protectedIds.has(project.factionId) && project.status === 'active'
    && remaining(project) > 0 && remaining(project) <= horizon && ownSoonest >= remaining(project)
    && hosts.get(project.settlementId)?.factionId === project.factionId)
    .sort((a, b) => remaining(a) - remaining(b) || byId(a, b)).slice(0, MAX_COUNTERPLAY_PROJECTS);
  if (!projects.length) return result;
  const held = new Set([
    ...heldDelegatedArmyIds(view), ...view.routes.map(route => route.armyId), ...view.postings.map(posting => posting.armyId),
    ...view.sieges.map(siege => siege.armyId), ...view.characters.flatMap(character => character.mission ? [character.mission.armyId] : []),
  ]);
  const atCell = new Map<number, ArmyView[]>(), hostileStrength = new Map<number, number>();
  for (const army of view.armies) {
    if (army.factionId !== view.factionId && army.domain === 'land' && !army.carrierId) hostileStrength.set(army.cell, (hostileStrength.get(army.cell) ?? 0) + army.strength);
    if (army.factionId !== view.factionId || army.domain !== 'land' || army.carrierId || !army.canAttack || army.canFound
      || army.formations.some(formation => formation.unitId === 'unit.scout') || held.has(army.id) || army.agents.length
      || army.commandBlocker || army.movementBlocker || army.movement <= 0 || army.morale < 35 || army.fatigue > 65) continue;
    const bucket = atCell.get(army.cell) ?? [];
    bucket.push(army); atCell.set(army.cell, bucket);
  }
  for (const bucket of atCell.values()) bucket.sort(byId);
  for (const project of projects) {
    result.consideredProjects++;
    const host = hosts.get(project.settlementId)!;
    // Only the first four eligible IDs per neighboring stack can enter four
    // total quotes. Merge at most 24 representatives, never all armies again.
    const armies = neighbors(host.cell, view.width, view.height).flatMap(cell => (atCell.get(cell) ?? [])
      .filter(army => army.strength >= (hostileStrength.get(host.cell) ?? 0)).slice(0, MAX_COUNTERPLAY_QUERIES)).sort(byId);
    for (const army of armies) {
      if (result.siegeQueries >= MAX_COUNTERPLAY_QUERIES) return result;
      result.siegeQueries++;
      const preview = query(view, army.id, host.id);
      if (!preview.canBesiege) continue;
      result.command = { type: 'besiege', factionId: view.factionId, armyId: army.id, settlementId: host.id };
      result.project = project;
      result.reason = `Interrupt ${project.settlementName}'s active victory project with ${remaining(project)} turns remaining: ${army.name} can legally establish a siege now; no active own project finishes sooner.`;
      return result;
    }
  }
  return result;
}
