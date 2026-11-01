import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 70: a realm whose coin runs out sets heavy taxes; one that is rich
 * and whose lanes are scarred sets lean ones; otherwise it keeps steady
 * taxes. One change a turn, and only when the rate would change. */
export const HEAVY_TAX_TREASURY = 60;
export const LEAN_TAX_TREASURY = 400;
/** Rules 71: no heavy taxes once a hearth's unrest reaches this; lean taxes at this unrest when the treasury allows. */
export const UNREST_RESTRAINT = 40;
export const UNREST_EASE = 60;
export const EASE_TAX_TREASURY = 150;
export function planTaxes(view: Observation): AiPlan | null {
  const taxes = view.tax;
  if (!taxes || !view.growth) return null;
  const scarred = view.settlements.some(town => town.factionId === view.factionId && town.devastation >= 10);
  // Rules 71: a realm whose lanes are restless does not press them harder, and eases them when it can afford to.
  const unrest = Math.max(0, ...(view.unrest ?? []).map(item => item.level));
  const wanted = unrest >= UNREST_EASE && view.treasury >= EASE_TAX_TREASURY ? 'lean'
    : view.growth.economy.net < 0 && view.treasury < HEAVY_TAX_TREASURY && unrest < UNREST_RESTRAINT ? 'heavy'
      : view.treasury >= LEAN_TAX_TREASURY && view.growth.economy.net > 0 && scarred ? 'lean' : 'steady';
  if (wanted === taxes.rate) return null;
  const command: GameCommand = { type: 'setTaxRate', factionId: view.factionId, rate: wanted };
  const reason = wanted === 'heavy' ? `Heavy taxes: the treasury holds ${view.treasury} coin and the turn runs ${view.growth.economy.net} short.`
    : wanted === 'lean' ? unrest >= UNREST_EASE ? `Lean taxes: a hearth's unrest stands at ${unrest} and the treasury holds ${view.treasury} coin to ease it.` : `Lean taxes: the treasury holds ${view.treasury} coin, the turn runs ${view.growth.economy.net} ahead and a hearth is scarred.`
      : `Steady taxes: neither short of coin nor rich with scarred hearths.`;
  return { commands: [command], reasons: [reason] };
}
