import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 68: a realm at war with coin to spare hires the cheapest company a
 * city-state quotes to one of its companies at the gate, once a turn, keeping
 * a reserve. The quote is the simulation's; nothing about peace, the gate or
 * the price is guessed. */
export const HIRE_RESERVE = 60;
export function planHire(view: Observation, heldArmyIds: ReadonlySet<string> = new Set()): AiPlan | null {
  if (!view.wars.length) return null;
  const open = (view.hires?.quotes ?? []).filter(quote => !quote.blocker && !heldArmyIds.has(quote.armyId) && view.treasury >= quote.coin + HIRE_RESERVE);
  if (!open.length) return null;
  const quote = [...open].sort((a, b) => a.coin - b.coin || (a.cityStateId < b.cityStateId ? -1 : 1))[0]!;
  const command: GameCommand = { type: 'hireCompany', factionId: view.factionId, cityStateId: quote.cityStateId, armyId: quote.armyId };
  const city = view.factions.find(faction => faction.id === quote.cityStateId)?.name ?? quote.cityStateId;
  return { commands: [command], reasons: [`Hire a company from ${city} at its gate for ${quote.coin} coin: the realm is at war and keeps ${view.treasury - quote.coin} coin after the purchase.`] };
}
