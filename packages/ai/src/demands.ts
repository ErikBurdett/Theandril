import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 61: a realm short of coin presses a city-state its company already
 * stands beside, taking the richest quote the simulation says is open, once
 * a turn. Nothing is guessed about the walls: the quote is the sum the
 * city would pay, and the simulation decides whether it does. */
export const DEMAND_PURSE = 150;
export const DEMAND_MIN_COIN = 20;
export function planDemand(view: Observation, heldArmyIds: ReadonlySet<string> = new Set()): AiPlan | null {
  const open = (view.tribute?.quotes ?? []).filter(quote => !quote.blocker && quote.coin >= DEMAND_MIN_COIN && !heldArmyIds.has(quote.armyId));
  if (!open.length || view.treasury >= DEMAND_PURSE) return null;
  const quote = [...open].sort((a, b) => b.coin - a.coin || (a.cityStateId < b.cityStateId ? -1 : 1))[0]!;
  const command: GameCommand = { type: 'demandTribute', factionId: view.factionId, cityStateId: quote.cityStateId, armyId: quote.armyId };
  const city = view.factions.find(faction => faction.id === quote.cityStateId)?.name ?? quote.cityStateId;
  return { commands: [command], reasons: [`Press ${city} for tribute with the company at its gate: ${quote.coin} coin if its walls yield, against a treasury of ${view.treasury}.`] };
}
