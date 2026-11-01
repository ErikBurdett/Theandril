import { MIGRATION_MIN_POPULATION, MIGRATION_RANGE, type GameCommand, type Observation } from '@theandril/sim';
import { hexDistance } from '@theandril/mapgen';
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
  // Rules 55: a hearth of three or more with a known sheltered hearth of another realm within range may lose a household when the crisis passes; people are valued as the hearth events value them. Only hearths in sight or memory count: nothing is guessed about shelter the realm cannot see.
  const havens = view.settlements.filter(town => town.factionId !== view.factionId && crisis.shelteredRealms?.includes(town.factionId));
  const exposed = havens.length ? view.settlements.filter(town => town.factionId === view.factionId && town.population >= MIGRATION_MIN_POPULATION && havens.some(haven => hexDistance(town.cell, haven.cell, view.width) <= MIGRATION_RANGE)).length : 0;
  return perHearth * crisis.hearths * crisis.turnsLeft + exposed * 25;
}
export function planCrisis(view: Observation): CrisisPlan | null {
  const crisis = view.crisis;
  if (!crisis || crisis.sheltered || crisis.shelterBlocker || crisis.shelterCost > view.treasury) return null;
  const toll = remainingToll(view);
  if (toll <= crisis.shelterCost) return null;
  const command: GameCommand = { type: 'shelterFromCrisis', factionId: view.factionId, crisisId: crisis.id };
  return { commands: [command], coinSpent: crisis.shelterCost, reasons: [`Shelter the realm's ${crisis.hearths} hearth${crisis.hearths === 1 ? '' : 's'} from ${crisis.name} for ${crisis.shelterCost} coin: the toll still to come over ${crisis.turnsLeft} turns is worth about ${Math.round(toll)}.`] };
}
