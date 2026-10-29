import type { Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 40–41: a realm wards a besieged hearth, or breaks the ward on a hearth
 * it besieges, whenever the observation quotes a rite it can perform there,
 * oldest siege first. The simulation states every requirement; the planner
 * never guesses at ashglass, lodging, seams or degrees. */
export function planRites(view: Observation): AiPlan | null {
  const contested = new Set(view.sieges.map(siege => siege.settlementId));
  const option = (view.rites ?? []).find(rite => rite.canPerform && rite.settlementId && contested.has(rite.settlementId));
  if (!option) return null;
  const hearth = view.settlements.find(town => town.id === option.settlementId);
  const own = hearth?.factionId === view.factionId;
  return { commands: [{ type: 'performRite', factionId: view.factionId, characterId: option.characterId, riteId: option.riteId }],
    reasons: [own ? `${option.name} at ${hearth?.name ?? option.settlementId}: the hearth is besieged and the walls can be held for ${option.durationTurns} turns at ${option.ashglassCost} ashglass.`
      : `${option.name} against ${hearth?.name ?? option.settlementId}: the besieged walls are warded and the ward can be broken for ${option.ashglassCost} ashglass.`] };
}
