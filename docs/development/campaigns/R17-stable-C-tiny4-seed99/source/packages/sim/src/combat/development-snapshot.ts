import { z } from 'zod';
import { DEVELOPMENT_NODES, EMPTY_DEVELOPMENT_EFFECTS, UNITS, type DevelopmentEffects } from '@theandril/content';
import type { CampaignBattle, GameState } from '../types';
const id = z.string().min(1).max(100);
export const battleDevelopmentSchema = z.object({ formationId: id, trainingIds: z.array(id).max(8), traditionIds: z.array(id).max(8) }).strict();
export type BattleDevelopmentSnapshot = z.infer<typeof battleDevelopmentSchema>;
export function snapshotBattleDevelopment(state: GameState, battle: Pick<CampaignBattle, 'formationBindings' | 'attackerId' | 'attackerFactionId' | 'defenderFactionId' | 'combat'>): BattleDevelopmentSnapshot[] {
  return battle.formationBindings.map(binding => {
    const unit = [...battle.combat.attacker, ...battle.combat.defender].find(unit => unit.id === binding.battleFormationId)!;
    const eligible = binding.armyId !== null && !UNITS.find(item => item.id === unit.unitId)?.canFound;
    const factionId = binding.armyId === battle.attackerId ? battle.attackerFactionId : battle.defenderFactionId;
    return { formationId: binding.formationId, trainingIds: eligible ? [...(state.development.formations[binding.formationId]?.nodeIds ?? [])] : [], traditionIds: eligible ? [...(state.development.factions[factionId]?.nodeIds ?? [])] : [] };
  });
}
/** Completed reports retain the nodes present at deployment, even if the realm
 * develops later or the surviving company is transferred to another army. */
export function battleDevelopmentEffects(snapshot: BattleDevelopmentSnapshot | undefined, unitId?: string, policy?: { institutionId: string | null; doctrineId: string | null }): DevelopmentEffects {
  const effects = { ...EMPTY_DEVELOPMENT_EFFECTS };
  if (!snapshot) return effects;
  for (const [scope, ids] of [['formation', snapshot.trainingIds], ['faction', snapshot.traditionIds]] as const) {
    const acquired = new Set(ids);
    for (const [index, id] of ids.entries()) {
      const node = DEVELOPMENT_NODES.find(node => node.id === id);
      if (!node || node.scope !== scope || index > 0 && id <= ids[index - 1]!) throw new Error('Invalid battle development snapshot.');
      if (node.requiresAll.some(id => !acquired.has(id)) || node.requiresAny.length && !node.requiresAny.some(id => acquired.has(id)) || node.exclusiveGroup && ids.some(id => id !== node.id && DEVELOPMENT_NODES.find(other => other.id === id)?.exclusiveGroup === node.exclusiveGroup)) throw new Error('Invalid battle development prerequisites or specialization.');
      if (unitId && node.minimumRange > (UNITS.find(unit => unit.id === unitId)?.range ?? 0)) throw new Error('Invalid battle training weapon requirement.');
      if (policy && (node.requiredDoctrine && node.requiredDoctrine !== policy.doctrineId || node.requiredInstitution && node.requiredInstitution !== policy.institutionId)) throw new Error('Invalid battle tradition policy.');
      for (const key of ['attack', 'armor', 'initiative', 'range', 'morale'] as const) effects[key] += node.effects[key];
    }
  }
  return effects;
}
