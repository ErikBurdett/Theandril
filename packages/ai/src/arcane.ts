import { hexDistance } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

/** Rules 23. A realm cannot study Arcane Theory until it holds a surveyed seam,
 * so a realm without one pays to survey the ground it already occupies. Surveys
 * are occasional and come out of surplus: they are a bet, not a budget line. */
const SURVEY_TURNS = 6;
const SURVEY_RESERVE = 60;

export function planArcaneSurvey(view: Observation): AiPlan | null {
  if (view.arcaneSites.some(site => site.controlled)) return null;
  if (view.treasury < view.arcaneSearchCoinCost + SURVEY_RESERVE) return null;
  const seat = view.factions.findIndex(faction => faction.id === view.factionId);
  if (seat < 0 || (view.turn + seat) % SURVEY_TURNS !== 0) return null;
  const surveyed = new Set(view.arcaneSites.map(site => site.cell));
  const hearths = view.settlements.filter(town => town.factionId === view.factionId);
  if (!hearths.length) return null;
  // Survey from a company standing on the realm's own hinterland that has not yet
  // moved; nothing is diverted from an expedition or a march. Land detail is
  // trimmed in an AI observation, so proximity to a hearth stands for its borders.
  const army = view.armies
    .filter(item => item.factionId === view.factionId && item.movement > 0 && item.domain !== 'naval' && !item.carrierId && !surveyed.has(item.cell)
      && hearths.some(town => hexDistance(item.cell, town.cell, view.width) <= 4))
    .sort((a, b) => a.cell - b.cell || (a.id < b.id ? -1 : 1))[0];
  if (!army) return null;
  return {
    commands: [{ type: 'searchArcane', factionId: view.factionId, armyId: army.id }],
    reasons: [`Survey the ground under ${army.name} for ${view.arcaneSearchCoinCost} coin: the realm holds no arcane seam, and Arcane Theory needs one.`],
  };
}

/** A surveyed seam the realm does not yet hold is worth claiming ahead of
 * ordinary hinterland: it is the only ground that unlocks Arcane Theory. */
export function claimArcaneSeam(view: Observation, budget: number): { command: GameCommand; coinCost: number; reason: string } | null {
  if (view.arcaneSites.some(site => site.controlled)) return null;
  const wanted = new Set(view.arcaneSites.filter(site => !site.controlled).map(site => site.cell));
  if (!wanted.size) return null;
  for (const land of view.land.settlements) {
    const cell = land.cells.find(item => wanted.has(item.cell) && item.claim.canStart && item.claim.coinCost <= budget);
    if (cell) return {
      command: { type: 'claimCell', factionId: view.factionId, settlementId: land.settlementId, cell: cell.cell },
      coinCost: cell.claim.coinCost,
      reason: `Claim the surveyed arcane seam beside ${land.settlementId} for ${cell.claim.coinCost} coin; holding it is what allows Arcane Theory.`,
    };
  }
  return null;
}
