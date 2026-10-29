import type { Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 40: a realm wards a besieged hearth whenever the observation quotes a
 * rite it can perform there, oldest siege first. The simulation states every
 * requirement; the planner never guesses at ashglass, lodging or seams. */
export function planRites(view: Observation): AiPlan | null {
  const besieged = new Set(view.sieges.filter(siege => siege.factionId !== view.factionId).map(siege => siege.settlementId));
  const option = (view.rites ?? []).find(rite => rite.canPerform && rite.settlementId && besieged.has(rite.settlementId));
  if (!option) return null;
  const hearth = view.settlements.find(town => town.id === option.settlementId);
  return { commands: [{ type: 'performRite', factionId: view.factionId, characterId: option.characterId, riteId: option.riteId }],
    reasons: [`${option.name} at ${hearth?.name ?? option.settlementId}: the hearth is besieged and the walls can be held for ${option.durationTurns} turns at ${option.ashglassCost} ashglass.`] };
}
