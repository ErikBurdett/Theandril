import { BIOME_YIELDS, FACTION_ECOLOGIES, IMPROVEMENTS, type LandYield } from '@theandril/content';
import type { GameCommand, Observation } from '@theandril/sim';
import { landPlanningTowns } from './observation-options';

const value = (yields: LandYield, needsFood: boolean): number => yields.food * (needsFood ? 5 : 2) + yields.industry * 3 + yields.coin + yields.knowledge * 2;

/** At most eight worker orders and one paid work order, using only quoted public facts. */
export function planLand(view: Observation, budget: number): { commands: GameCommand[]; reasons: string[]; coinSpent: number } {
  const commands: GameCommand[] = [], reasons: string[] = [];
  const towns = new Map(view.settlements.map(town => [town.id, town]));
  const candidates = landPlanningTowns(view.land.settlements, view.turn);
  const ecology = FACTION_ECOLOGIES[view.factions.find(faction => faction.id === view.factionId)?.definitionId ?? ''];
  let coinSpent = 0;
  for (const land of candidates) {
    const town = towns.get(land.settlementId);
    if (!town || land.workPaused || !land.cells.length) continue;
    const needsFood = town.food < town.population * 8;
    const workers = land.cells.filter(cell => cell.claimed && cell.canWork)
      .sort((a, b) => value(b.yields.total, needsFood) - value(a.yields.total, needsFood) || a.cell - b.cell)
      .slice(0, land.workerCapacity).map(cell => cell.cell).sort((a, b) => a - b);
    if (workers.join(',') !== land.worked.join(',')) commands.push({ type: 'setWorkedTiles', factionId: view.factionId, settlementId: town.id, cells: workers });
    if (coinSpent || land.work) continue;
    const worked = land.cells.filter(cell => workers.includes(cell.cell));
    // Give cultural cultivation a regular opportunity; do not burn treasury on
    // same-biome loops or work that removes a productive existing improvement.
    const cultivation = worked.flatMap(cell => cell.terraformOptions.filter(option => option.canStart && option.coinCost <= budget).map(option => {
      const delta = ecology?.affinities.find(affinity => affinity.biomeId === option.biome)?.yields;
      const base = BIOME_YIELDS[option.biome];
      return { cell, option, benefit: base ? value(base, needsFood) + (delta ? value(delta, needsFood) : 0) - value(cell.yields.biome, needsFood) - value(cell.yields.affinity, needsFood) : -1 };
    })).filter(candidate => candidate.benefit > 0).sort((a, b) => b.benefit - a.benefit || a.option.coinCost - b.option.coinCost || a.cell.cell - b.cell.cell);
    const improvement = worked.flatMap(cell => cell.improvementOptions.filter(option => option.canStart && option.coinCost <= budget).flatMap(option => {
      const definition = IMPROVEMENTS.find(item => item.id === option.improvementId);
      if (!definition) return [];
      const projected = { food: 0, industry: 0, coin: 0, knowledge: 0 };
      for (const key of ['food', 'industry', 'coin', 'knowledge'] as const) projected[key] = Math.max(0,
        cell.yields.biome[key] + cell.yields.features[key] + cell.yields.affinity[key] + definition.yields[key]
        + definition.featureModifiers.reduce((sum, modifier) => sum + ((cell.features & modifier.feature) === modifier.feature ? modifier.yields[key] : 0), 0));
      const benefit = value(projected, needsFood) - value(cell.yields.total, needsFood);
      // Food demand fluctuates as towns grow. A replacement must improve both
      // demand regimes, otherwise gardens and oreworks can demolish each other.
      const stableGain = Math.min(value(projected, true) - value(cell.yields.total, true), value(projected, false) - value(cell.yields.total, false));
      return (cell.improvementId ? stableGain >= 4 : benefit >= 1) ? [{ cell, option, benefit }] : [];
    })).sort((a, b) => b.benefit - a.benefit || a.option.coinCost - b.option.coinCost || a.cell.cell - b.cell.cell);
    const cultivate = cultivation[0];
    if (cultivate && (view.turn % 7 === 0 || !improvement.length)) {
      commands.push({ type: 'terraformTile', factionId: view.factionId, settlementId: town.id, cell: cultivate.cell.cell, biome: cultivate.option.biome });
      coinSpent = cultivate.option.coinCost; reasons.push(`${town.name} cultivates ${cultivate.option.name} for its workers, paying ${coinSpent} coin.`);
    } else if (improvement[0]) {
      const chosen = improvement[0];
      commands.push({ type: 'improveTile', factionId: view.factionId, settlementId: town.id, cell: chosen.cell.cell, improvementId: chosen.option.improvementId });
      coinSpent = chosen.option.coinCost; reasons.push(`${town.name} improves worked land with ${chosen.option.name} for ${coinSpent} coin.`);
    } else {
      const claim = land.cells.filter(cell => cell.claim.canStart && cell.claim.coinCost <= budget)
        .sort((a, b) => value(b.yields.total, needsFood) - value(a.yields.total, needsFood) || a.cell - b.cell)[0];
      const weakest = worked.length ? Math.min(...worked.map(cell => value(cell.yields.total, needsFood))) : 0;
      if (claim && (workers.length < land.workerCapacity || value(claim.yields.total, needsFood) > weakest)) {
        commands.push({ type: 'claimCell', factionId: view.factionId, settlementId: town.id, cell: claim.cell });
        coinSpent = claim.claim.coinCost; reasons.push(`${town.name} expands into a productive adjacent hex for ${coinSpent} coin.`);
      }
    }
  }
  return { commands, reasons, coinSpent };
}
