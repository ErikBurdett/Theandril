import { z } from 'zod';
import { RESOURCES, resourceById, type ResourceDefinition } from '@theandril/content';
import type { World } from '@theandril/mapgen';
import type { DomainEvent, GameState, Settlement } from './types';
import { rulesVersion } from './rules';

const id = z.string().regex(/^[a-z][a-z0-9_.-]*$/);
const amount = z.number().int().nonnegative().safe();
export const resourceStateSchema = z.object({ version: z.union([z.literal(0), z.literal(1)]), deposits: z.record(z.string().regex(/^(0|[1-9][0-9]{0,5})$/), id), stockpiles: z.record(id, z.record(id, amount)) }).strict();
export type ResourceState = z.infer<typeof resourceStateSchema>;
export type ResourceCosts = Readonly<Record<string, number>>;
export const resourceCommandSchema = z.object({ type: z.literal('sellResource'), factionId: id, settlementId: id, resourceId: id, amount: z.number().int().min(1).max(1_000_000) }).strict();
export type ResourceCommand = z.infer<typeof resourceCommandSchema>;
export interface ResourceObservation { version: 0 | 1; stockpiles: { resourceId: string; name: string; amount: number; perTurn: number; salePrice: number; improvementId: string }[]; marketSettlementIds: string[] }
const mix = (seed: number, cell: number, salt: number): number => {
  let value = (seed ^ Math.imul(cell + 1, 0x9e3779b1) ^ salt) >>> 0;
  value = Math.imul(value ^ value >>> 16, 0x85ebca6b); value = Math.imul(value ^ value >>> 13, 0xc2b2ae35);
  return (value ^ value >>> 16) >>> 0;
};
function suited(resource: ResourceDefinition, world: World, cell: number): boolean {
  return resource.terrainIds.includes(world.terrain[cell]!) && (!resource.biomeIds || resource.biomeIds.includes(world.biome[cell]!)) && world.waterDepth[cell] !== 2;
}
/** Resource generation is a separate immutable layer. Existing geography and
 * its generator seals stay exact; migrated worlds receive version0, no deposits. */
export function createResources(world: World, factionIds: readonly string[], version: 0 | 1 = 1): ResourceState {
  const state: ResourceState = { version, deposits: {}, stockpiles: Object.fromEntries(factionIds.map(id => [id, {}])) };
  if (!version) return state;
  const starts = new Set(world.starts), best = new Map<string, { cell: number; score: number }>();
  const counts = new Map<string, number>();
  for (let cell = 0; cell < world.terrain.length; cell++) {
    if (starts.has(cell) || world.waterDepth[cell] === 2) continue;
    const suitable = RESOURCES.filter(resource => suited(resource, world, cell));
    if (!suitable.length) continue;
    for (const resource of suitable) {
      const score = mix(world.seed, cell, resource.code * 6911), previous = best.get(resource.id);
      if (!previous || score < previous.score) best.set(resource.id, { cell, score });
    }
    if (mix(world.seed, cell, 0x5f21a91) % 23) continue;
    const cluster = Math.floor(cell % world.width / 6) + Math.floor(Math.floor(cell / world.width) / 6) * Math.ceil(world.width / 6);
    const resource = suitable[mix(world.seed, cluster, 0xb331) % suitable.length]!;
    state.deposits[cell] = resource.id; counts.set(resource.id, (counts.get(resource.id) ?? 0) + 1);
  }
  // Tiny worlds should include every resource their actual ecology supports.
  // Selection is geography-only and deterministic; no terrain is rewritten.
  for (const resource of RESOURCES) if (!counts.has(resource.id)) {
    const candidate = best.get(resource.id);
    if (candidate && !state.deposits[candidate.cell]) state.deposits[candidate.cell] = resource.id;
  }
  return state;
}
export function resourceCostBlocker(state: GameState, factionId: string, costs: ResourceCosts = {}): string | null {
  for (const [resourceId, cost] of Object.entries(costs)) {
    const resource = resourceById.get(resourceId);
    if (!resource || !Number.isSafeInteger(cost) || cost < 0) return 'Invalid resource requirement.';
    if (cost && (rulesVersion(state) < 16 || (state.resources?.stockpiles[factionId]?.[resourceId] ?? 0) < cost)) return `Requires ${cost} ${resource.name} in the realm stockpile.`;
  }
  return null;
}
export function spendResourceCosts(state: GameState, factionId: string, costs: ResourceCosts = {}): void {
  const blocker = resourceCostBlocker(state, factionId, costs);
  if (blocker) throw new Error(blocker);
  const stock = state.resources.stockpiles[factionId];
  if (!stock && Object.values(costs).some(Boolean)) throw new Error('Missing realm stockpile.');
  for (const [id, cost] of Object.entries(costs)) if (cost) {
    stock![id] = (stock![id] ?? 0) - cost;
    if (!stock![id]) delete stock![id];
  }
}
export function settlementResourceYield(state: GameState, town: Settlement): Record<string, number> {
  const output: Record<string, number> = {};
  if (rulesVersion(state) < 16 || !state.resources?.version || state.sieges[town.id] || town.occupationTurns) return output;
  const land = state.land.settlements[town.id];
  for (const cell of land?.worked ?? []) {
    const resource = resourceById.get(state.resources.deposits[cell] ?? '');
    if (resource && land?.improvements[cell] === resource.improvementId) output[resource.id] = (output[resource.id] ?? 0) + resource.extraction;
  }
  return output;
}
export function harvestSettlementResources(state: GameState, town: Settlement): void {
  const output = settlementResourceYield(state, town), stock = state.resources.stockpiles[town.factionId];
  for (const [id, quantity] of Object.entries(output)) stock![id] = Math.min(Number.MAX_SAFE_INTEGER, (stock![id] ?? 0) + quantity);
}
export function resourceObservation(state: GameState, factionId: string): ResourceObservation {
  const income: Record<string, number> = {}, marketSettlementIds: string[] = [];
  for (const town of Object.values(state.settlements)) if (town.factionId === factionId) {
    for (const [id, amount] of Object.entries(settlementResourceYield(state, town))) income[id] = (income[id] ?? 0) + amount;
    if (town.buildings.includes('building.market') && !state.sieges[town.id] && !town.occupationTurns) marketSettlementIds.push(town.id);
  }
  return { version: state.resources?.version ?? 0, marketSettlementIds: marketSettlementIds.sort(), stockpiles: RESOURCES.map(resource => ({ resourceId: resource.id, name: resource.name, amount: state.resources?.stockpiles[factionId]?.[resource.id] ?? 0, perTurn: income[resource.id] ?? 0, salePrice: resource.salePrice, improvementId: resource.improvementId })) };
}
export function applyResourceCommand(state: GameState, command: ResourceCommand, emitted: DomainEvent[]): string | null {
  if (rulesVersion(state) < 16) return 'Resource contracts are unavailable under these historical rules.';
  const town = state.settlements[command.settlementId], resource = resourceById.get(command.resourceId);
  if (!town || town.factionId !== command.factionId || !town.buildings.includes('building.market')) return 'Resource contracts require your own Charter market.';
  if (state.sieges[town.id] || town.occupationTurns) return 'Resource contracts are suspended during siege or occupation.';
  if (!resource) return 'Unknown resource.';
  const costs = { [resource.id]: command.amount }, blocker = resourceCostBlocker(state, command.factionId, costs);
  if (blocker) return blocker;
  const owner = state.factions.find(faction => faction.id === command.factionId)!, coin = resource.salePrice * command.amount;
  if (!Number.isSafeInteger(owner.treasury + coin)) return 'This contract exceeds the supported treasury precision.';
  spendResourceCosts(state, command.factionId, costs); owner.treasury += coin;
  emitted.push({ turn: state.turn, type: 'resource_contract', factionId: command.factionId, cell: town.cell, message: `${town.name} sold ${command.amount} ${resource.name} for ${coin} coin.` });
  return null;
}
export function validateResources(state: GameState): void {
  const resourceState = resourceStateSchema.parse(state.resources);
  const factions = new Set(state.factions.map(faction => faction.id));
  if (Object.keys(resourceState.stockpiles).length !== factions.size) throw new Error('Resource stockpile owners do not match the campaign.');
  for (const [id, stock] of Object.entries(resourceState.stockpiles)) {
    if (!factions.has(id) || Object.keys(stock).some(id => !resourceById.has(id))) throw new Error('Unknown stockpile owner or resource.');
    if (!resourceState.version && Object.keys(stock).length) throw new Error('Historical resource layer cannot contain stockpiles.');
  }
  for (const [key, id] of Object.entries(resourceState.deposits)) {
    const cell = Number(key), resource = resourceById.get(id);
    if (!resourceState.version || !resource || cell >= state.world.terrain.length || !suited(resource, state.world, cell)) throw new Error('Invalid resource deposit.');
  }
}
