import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 53: a realm shelters its hearths from the standing crisis when the
 * toll still to come, valued as the hearth events are valued (coin at face,
 * knowledge and stored food at a premium, devastation at its cost to the
 * hearth), outweighs the quoted price, and the treasury can pay it. Nothing
 * is guessed about the crisis beyond what the simulation quotes. */
export interface CrisisPlan extends AiPlan { coinSpent: number }
export function remainingToll(view: Observation): number {
  const crisis = view.crisis;
  if (!crisis) return 0;
  const perHearth = crisis.blight.coin + crisis.blight.knowledge * 1.5 + crisis.blight.food * 1.5 + crisis.blight.devastation * 2;
  return perHearth * crisis.hearths * crisis.turnsLeft;
}
export function planCrisis(view: Observation): CrisisPlan | null {
  const crisis = view.crisis;
  if (!crisis || crisis.sheltered || crisis.shelterBlocker || crisis.shelterCost > view.treasury) return null;
  const toll = remainingToll(view);
  if (toll <= crisis.shelterCost) return null;
  const command: GameCommand = { type: 'shelterFromCrisis', factionId: view.factionId, crisisId: crisis.id };
  return { commands: [command], coinSpent: crisis.shelterCost, reasons: [`Shelter the realm's ${crisis.hearths} hearth${crisis.hearths === 1 ? '' : 's'} from ${crisis.name} for ${crisis.shelterCost} coin: the toll still to come over ${crisis.turnsLeft} turns is worth about ${Math.round(toll)}.`] };
}
