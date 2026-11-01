import { z } from 'zod';
import { UNITS } from '@theandril/content';
import type { Army, ArmyFormation, CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';

/** Rules 75: a land army's deployment. The line is the formations in their
 * canonical order, as every battle has drawn them up; a shield wall puts the
 * best-armored formations in the front rank; pikes forward puts the
 * polearms there; skirmish puts the ranged companies there. The doctrine
 * is kept on the army and read when a battle is drawn up; it moves nothing
 * on the map. Canonical from save 75. */
export const DEPLOYMENTS = ['line', 'shieldwall', 'pikes', 'skirmish', 'wings'] as const;
export type Deployment = typeof DEPLOYMENTS[number];
export const deploymentSchema = z.enum(DEPLOYMENTS);
export const DEPLOYMENT_NAMES: Readonly<Record<Deployment, string>> = { line: 'The line', shieldwall: 'Shield wall', pikes: 'Pikes forward', skirmish: 'Skirmish', wings: 'Cavalry wings' };
export const DEPLOYMENT_TEXT: Readonly<Record<Deployment, string>> = {
  line: 'The formations draw up in their canonical order.',
  shieldwall: 'The best-armored formations take the front rank.',
  pikes: 'The polearms take the front rank, with their reach beyond it.',
  skirmish: 'The ranged companies take the front rank and engage first.',
  wings: 'The mounted companies take the outer columns of every rank, the foot the centre.',
};
export const deploymentCommandSchemas = [
  z.object({ type: z.literal('setDeployment'), factionId: z.string().min(1).max(100), armyId: z.string().min(1).max(100), deployment: deploymentSchema }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const units = new Map(UNITS.map(unit => [unit.id, unit]));
/** Rules 76 added the cavalry wings; a campaign under rules 75 reads an army as the line it could not yet leave. */
export const deploymentOf = (state: GameState, army: Army): Deployment => rulesVersion(state) >= 76 ? army.deployment ?? 'line' : rulesVersion(state) >= 75 && army.deployment !== 'wings' ? army.deployment ?? 'line' : 'line';
const mounted = (item: ArmyFormation): boolean => { const unit = units.get(item.unitId); return Boolean(unit && unit.movement >= 4 && unit.range === 0 && unit.movementDomain !== 'naval'); };
/** The rank a formation prefers under a doctrine: lower draws up first. */
function priority(deployment: Deployment, item: ArmyFormation): number {
  const unit = units.get(item.unitId);
  if (!unit || deployment === 'line') return 0;
  if (deployment === 'shieldwall') return -unit.armor;
  if (deployment === 'pikes') return unit.range === 1 && unit.movementDomain !== 'naval' ? 0 : 1;
  return unit.range >= 2 ? 0 : 1;
}
/** The army's formations in the order a battle draws them up: by doctrine, then by id. */
export function arrangedFormations(state: GameState, army: Army): ArmyFormation[] {
  const doctrine = deploymentOf(state, army);
  const byId = (a: ArmyFormation, b: ArmyFormation): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  if (doctrine !== 'wings') return [...army.formations].sort((a, b) => priority(doctrine, a) - priority(doctrine, b) || byId(a, b));
  // Rules 76: rank by rank, the outer columns go to the mounted and the centre to the foot; whichever runs out, the other fills the rest.
  const horse = army.formations.filter(mounted).sort(byId), foot = army.formations.filter(item => !mounted(item)).sort(byId);
  const order: ArmyFormation[] = [];
  while (horse.length || foot.length) {
    const rank: (ArmyFormation | undefined)[] = [undefined, undefined, undefined, undefined, undefined];
    for (const column of [0, 4]) rank[column] = horse.shift() ?? foot.shift();
    for (const column of [1, 2, 3]) rank[column] = foot.shift() ?? horse.shift();
    for (const item of rank) if (item) order.push(item);
  }
  return order;
}
/** The unit names of the first five formations as they would draw up. */
export const frontRank = (state: GameState, army: Army): string[] => arrangedFormations(state, army).slice(0, 5).map(item => units.get(item.unitId)?.name ?? item.unitId);
export const hasDeployments = (state: GameState): boolean => Object.values(state.armies).some(army => army.deployment !== undefined);
export function assertNoDeployments(state: GameState): void {
  if (hasDeployments(state)) throw new Error('This campaign has army deployments unavailable in historical rules.');
}
/** Rules 76: the wings are a doctrine rules 75 did not know. */
export function assertNoWings(state: GameState): void {
  if (Object.values(state.armies).some(army => army.deployment === 'wings')) throw new Error('This campaign has cavalry wings unavailable in historical rules.');
}
export function deploymentBlocker(state: GameState, factionId: string, armyId: string, deployment: Deployment): string | null {
  if (rulesVersion(state) < 75) return 'Deployments are not part of these rules.';
  const army = state.armies[armyId];
  if (!army || army.factionId !== factionId) return 'Choose one of your own armies.';
  if (army.formations.some(item => units.get(item.unitId)?.movementDomain === 'naval')) return 'A fleet draws up as the sea allows.';
  if (deployment === 'wings' && rulesVersion(state) < 76) return 'Cavalry wings are not part of these rules.';
  if (state.battle) return 'Resolve the current battle first.';
  if (deploymentOf(state, army) === deployment) return `${army.name} already draws up as ${DEPLOYMENT_NAMES[deployment].toLowerCase()}.`;
  return null;
}
export function setDeployment(state: GameState, factionId: string, armyId: string, deployment: Deployment): CommandResult {
  const blocker = deploymentBlocker(state, factionId, armyId, deployment);
  if (blocker) return fail(blocker);
  const army = state.armies[armyId]!;
  if (deployment === 'line') delete army.deployment; else army.deployment = deployment;
  const event: DomainEvent = { turn: state.turn, factionId, type: 'deployment_set', cell: army.cell, message: `${army.name} will draw up as ${DEPLOYMENT_NAMES[deployment].toLowerCase()}: ${DEPLOYMENT_TEXT[deployment]} Front rank: ${frontRank(state, army).join(', ')}.` };
  return { ok: true, events: [event] };
}
export function validateDeployments(state: GameState): void {
  for (const army of Object.values(state.armies)) {
    if (army.deployment === undefined) continue;
    if (!(['shieldwall', 'pikes', 'skirmish', 'wings'] as string[]).includes(army.deployment)) throw new Error('Invalid save: army deployment is not a doctrine');
    if (army.deployment === 'wings' && rulesVersion(state) < 76) throw new Error('Invalid save: cavalry wings belong to rules 76 or later');
    if (army.formations.some(item => units.get(item.unitId)?.movementDomain === 'naval')) throw new Error('Invalid save: a fleet keeps no deployment');
  }
}
