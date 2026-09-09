import { BIOME_YIELDS, FACTION_ECOLOGIES, IMPROVEMENTS, PROSPERITY_PROJECT, resourceById, type LandYield } from '@theandril/content';
import type { GameCommand, Observation } from '@theandril/sim';
import { landPlanningTowns } from './observation-options';

const value = (yields: LandYield, needsFood: boolean): number => yields.food * (needsFood ? 5 : 2) + yields.industry * 3 + yields.coin + yields.knowledge * 2;

/** At most eight worker orders and one paid work order, using only quoted public facts. */
export function planLand(view: Observation, budget: number, plannedProduction: ReadonlySet<string> = new Set()): { commands: GameCommand[]; reasons: string[]; coinSpent: number } {
  const commands: GameCommand[] = [], reasons: string[] = [];
  const towns = new Map(view.settlements.map(town => [town.id, town]));
  const candidates = landPlanningTowns(view.land.settlements, view.turn);
  const ecology = FACTION_ECOLOGIES[view.factions.find(faction => faction.id === view.factionId)?.definitionId ?? ''];
  const stocks = new Map(view.resources?.stockpiles.map(stock => [stock.resourceId, stock]));
  const materialDemand = (resourceId: string | undefined): number => {
    const stock = resourceId ? stocks.get(resourceId) : undefined;
    return stock ? Math.floor(Math.max(0, 6 - stock.amount) * 4 / (1 + stock.perTurn)) : 0;
  };
  const prepared = view.settlements.filter(town => town.factionId === view.factionId
    && PROSPERITY_PROJECT.requiredBuildings.every(id => town.buildings.includes(id)));
  const fundingProject = prepared.length >= PROSPERITY_PROJECT.settlementCount && view.treasury < view.progression.project.coinCost
    && !view.projects.some(project => project.factionId === view.factionId && (project.status === 'active' || project.status === 'paused'));
  let coinSpent = 0;
  for (const land of candidates) {
    const town = towns.get(land.settlementId);
    if (!town || land.workPaused || !land.cells.length) continue;
    const needsFood = town.food < town.population * 8;
    // Industry is not stored. A developed idle town funding the public project can
    // employ its workers for coin and growth instead of producing discarded industry.
    // Only allocation changes: paid replacement/cultivation keeps its stable utility
    // so a temporary queue or project phase cannot cause demolition churn.
    const fiscalWorkers = fundingProject && !town.queue.length && !plannedProduction.has(town.id)
      && PROSPERITY_PROJECT.requiredBuildings.every(id => town.buildings.includes(id));
    const workerValue = (yields: LandYield): number => fiscalWorkers
      ? yields.food * (needsFood ? 5 : 2) + yields.industry + yields.coin * 4 + yields.knowledge * 2
      : value(yields, needsFood);
    const pageCells = new Set(land.cells.map(cell => cell.cell));
    const retained = land.cellWindow ? land.worked.filter(cell => !pageCells.has(cell)) : [];
    const workers = [...retained, ...land.cells.filter(cell => cell.claimed && cell.canWork)
      .sort((a, b) => workerValue(b.yields.total) + materialDemand(b.resourceId) - workerValue(a.yields.total) - materialDemand(a.resourceId) || a.cell - b.cell)
      .slice(0, Math.max(0, land.workerCapacity - retained.length)).map(cell => cell.cell)].sort((a, b) => a - b);
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
      const resource = cell.resourceId ? resourceById.get(cell.resourceId) : undefined;
      // Retain the realm's last productive source. Surplus duplicate extraction
      // sites may still be replaced through the existing strict utility test.
      if (resource && cell.improvementId === resource.improvementId && definition.id !== resource.improvementId && (stocks.get(resource.id)?.perTurn ?? 0) <= resource.extraction) return [];
      const projected = { food: 0, industry: 0, coin: 0, knowledge: 0 };
      for (const key of ['food', 'industry', 'coin', 'knowledge'] as const) projected[key] = Math.max(0,
        cell.yields.biome[key] + cell.yields.features[key] + cell.yields.affinity[key] + definition.yields[key]
        + definition.featureModifiers.reduce((sum, modifier) => sum + ((cell.features & modifier.feature) === modifier.feature ? modifier.yields[key] : 0), 0));
      const material = definition.requiredResourceId ? materialDemand(definition.requiredResourceId) : 0;
      const benefit = value(projected, needsFood) - value(cell.yields.total, needsFood) + material;
      // Food demand fluctuates as towns grow. A replacement must improve both
      // demand regimes, otherwise gardens and oreworks can demolish each other.
      const stableGain = Math.min(value(projected, true) - value(cell.yields.total, true), value(projected, false) - value(cell.yields.total, false)) + material;
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
        .sort((a, b) => value(b.yields.total, needsFood) + materialDemand(b.resourceId) - value(a.yields.total, needsFood) - materialDemand(a.resourceId) || a.cell - b.cell)[0];
      const weakest = worked.length ? Math.min(...worked.map(cell => value(cell.yields.total, needsFood))) : 0;
      if (claim && (workers.length < land.workerCapacity || value(claim.yields.total, needsFood) + materialDemand(claim.resourceId) > weakest)) {
        commands.push({ type: 'claimCell', factionId: view.factionId, settlementId: town.id, cell: claim.cell });
        coinSpent = claim.claim.coinCost; reasons.push(`${town.name} expands into a productive adjacent hex for ${coinSpent} coin.`);
      }
    }
  }
  return { commands, reasons, coinSpent };
}
