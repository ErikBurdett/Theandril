import { UNITS } from '@theandril/content';
import type { GameState, Settlement } from './types';
import { armyUpkeep } from './army-composition';
import { characterUpkeep } from './characters';
import { factionDevelopmentUpkeep, formationDevelopmentUpkeep, hearthDevelopmentUpkeep } from './development';
import { settlementYields } from './simulation';
import { rulesVersion } from './rules';

/** Arithmetic saturates only at the serialization-safe integer bound. */
const safe = (value: number): number => Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));
export function settlementGrowthFood(population: number, version = 16): number { return safe(12 * population + (version >= 16 ? Math.floor(population * population / 2) : 0)); }
export function settlementFoodConsumption(population: number, version = 16): number { return safe(2 * population + (version >= 16 ? Math.floor(population * population / 100) : 0)); }
/** Rules 21 lets realms run wider: hearths cost less to plant as a realm grows. */
export function foundingCoinCost(existingCount: number, version = 16): number { return version >= 21 ? safe(existingCount * (10 + existingCount)) : version >= 16 ? safe(existingCount * (12 + 2 * existingCount)) : 0; }
export interface CivicUpkeep { population: number; territory: number; administration: number; total: number }
export function settlementCivicUpkeep(population: number, claims: number, townCount: number, version = 16): CivicUpkeep {
  const inhabitants = version >= 16 ? safe(Math.ceil(population / 4) + Math.floor(population * population / 200)) : 0;
  const territory = version >= 16 ? safe(Math.ceil(Math.max(0, claims - 7) / (version >= 21 ? 16 : 12))) : 0;
  const administration = version >= 16 ? safe(Math.floor(Math.max(0, townCount - 1) / (version >= 21 ? 5 : 3))) : 0;
  return { population: inhabitants, territory, administration, total: safe(inhabitants + territory + administration) };
}
export interface SettlementGrowthObservation { settlementId: string; foodRequired: number; foodConsumption: number; civicUpkeep: CivicUpkeep }
export interface GrowthObservation {
  founding: { coinCost: number; canAfford: boolean; blocker: string | null; additionalUpkeep: number; effectText: string };
  settlements: SettlementGrowthObservation[];
  civicUpkeep: number;
  economy: { income: number; upkeep: number; net: number; queuedUpkeep: number };
}
export function getGrowthObservation(state: GameState, factionId: string, towns?: readonly Settlement[]): GrowthObservation | undefined {
  const version = rulesVersion(state);
  if (version < 16) return undefined;
  const owned = towns ?? Object.values(state.settlements).filter(town => town.factionId === factionId), count = owned.length;
  // The quote must price the campaign's own rules, or the panel would advertise a cost the turn does not charge.
  const owner = state.factions.find(faction => faction.id === factionId), coinCost = foundingCoinCost(count, version);
  const settlements = owned.map(town => ({ settlementId: town.id, foodRequired: settlementGrowthFood(town.population, version), foodConsumption: settlementFoodConsumption(town.population, version), civicUpkeep: settlementCivicUpkeep(town.population, state.land.settlements[town.id]?.claimed.length ?? 1, count, version) }));
  const administrationBefore = settlementCivicUpkeep(1, 7, count, version).administration, next = settlementCivicUpkeep(1, 7, count + 1, version);
  const blocker = (owner?.treasury ?? 0) < coinCost ? `Founding requires ${coinCost} coin for settlement supplies and administration.` : null;
  const civicUpkeep = safe(settlements.reduce((sum, town) => sum + town.civicUpkeep.total, 0));
  const income = safe(owned.reduce((sum, town) => sum + settlementYields(state, town).coin, 0));
  let upkeep = civicUpkeep + characterUpkeep(state, factionId) + factionDevelopmentUpkeep(state, factionId);
  for (const town of owned) upkeep += hearthDevelopmentUpkeep(state, town.id);
  for (const army of Object.values(state.armies)) if (army.factionId === factionId) upkeep += armyUpkeep(army) + army.formations.reduce((sum, formation) => sum + formationDevelopmentUpkeep(state, formation.id), 0);
  upkeep = safe(upkeep);
  const queuedUpkeep = safe(owned.reduce((sum, town) => sum + town.queue.reduce((total, order) => total + (UNITS.find(unit => unit.id === order.itemId)?.upkeep ?? 0), 0), 0));
  return { founding: { coinCost, canAfford: !blocker, blocker, additionalUpkeep: safe(next.total + count * (next.administration - administrationBefore)), effectText: 'Each additional hearth costs more to establish. Population, territory and realm administration add recurring coin upkeep; growth has no settlement, population or territory ceiling.' }, settlements, civicUpkeep, economy: { income, upkeep, net: income - upkeep, queuedUpkeep } };
}
