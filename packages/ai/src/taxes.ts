import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 70: a realm whose coin runs out sets heavy taxes; one that is rich
 * and whose lanes are scarred sets lean ones; otherwise it keeps steady
 * taxes. One change a turn, and only when the rate would change. */
export const HEAVY_TAX_TREASURY = 60;
export const LEAN_TAX_TREASURY = 400;
export function planTaxes(view: Observation): AiPlan | null {
  const taxes = view.tax;
  if (!taxes || !view.growth) return null;
  const scarred = view.settlements.some(town => town.factionId === view.factionId && town.devastation >= 10);
  const wanted = view.growth.economy.net < 0 && view.treasury < HEAVY_TAX_TREASURY ? 'heavy'
    : view.treasury >= LEAN_TAX_TREASURY && view.growth.economy.net > 0 && scarred ? 'lean' : 'steady';
  if (wanted === taxes.rate) return null;
  const command: GameCommand = { type: 'setTaxRate', factionId: view.factionId, rate: wanted };
  const reason = wanted === 'heavy' ? `Heavy taxes: the treasury holds ${view.treasury} coin and the turn runs ${view.growth.economy.net} short.`
    : wanted === 'lean' ? `Lean taxes: the treasury holds ${view.treasury} coin, the turn runs ${view.growth.economy.net} ahead and a hearth is scarred.`
      : `Steady taxes: neither short of coin nor rich with scarred hearths.`;
  return { commands: [command], reasons: [reason] };
}
