import type { GameCommand, Observation } from '@theandril/sim';

/** Optional infrastructure work uses the remaining treasury budget, never a rule-side
 * discount. Favor the quoted difficult segment; plain roads already progress naturally. */
export function planRoadAcceleration(view: Observation, coinBudget: number): { command: GameCommand | null; coinSpent: number; reason: string | null } {
  const none = { command: null, coinSpent: 0, reason: null };
  if (view.victory || view.battle || view.pendingCapture) return none;
  const own = new Set(view.settlements.filter(town => town.factionId === view.factionId).map(town => town.id));
  const road = (view.roads ?? []).filter(road => own.has(road.settlementId) && own.has(road.targetId) && road.canAccelerate
    && road.required > 2 && road.coinCost > 0 && road.coinCost <= coinBudget)
    .sort((a, b) => b.progress - a.progress || a.coinCost - b.coinCost || a.length - b.length || (a.settlementId < b.settlementId ? -1 : 1))[0];
  return road ? { command: { type: 'accelerateRoad', factionId: view.factionId, settlementId: road.settlementId }, coinSpent: road.coinCost,
    reason: `Pay ${road.coinCost} coin to finish the difficult road segment toward ${road.targetName}; retain the core expansion and naval budget.` } : none;
}
