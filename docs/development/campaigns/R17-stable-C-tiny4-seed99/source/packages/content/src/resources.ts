import { z } from 'zod';
import type { ImprovementDefinition, LandYield } from './ecology';

export interface ResourceDefinition {
  id: string; code: number; name: string; description: string; category: 'provisions' | 'material' | 'luxury' | 'arcane';
  terrainIds: readonly number[]; biomeIds?: readonly number[]; salePrice: number;
  improvementId: string; extraction: number;
}
const resourceSchema = z.object({ id: z.string().regex(/^resource\.[a-z_]+$/), code: z.number().int().min(1).max(254), name: z.string().min(1), description: z.string().min(1), category: z.enum(['provisions', 'material', 'luxury', 'arcane']), terrainIds: z.array(z.number().int().min(0).max(4)).min(1), biomeIds: z.array(z.number().int().min(0).max(11)).optional(), salePrice: z.number().int().positive(), improvementId: z.string().regex(/^improvement\.[a-z_]+$/), extraction: z.number().int().positive() }).strict();
export const RESOURCES: readonly ResourceDefinition[] = [
  { id: 'resource.grain', code: 1, name: 'Hearthgrain', description: 'Wild grainlands support granges, provisions and civic storehouses.', category: 'provisions', terrainIds: [1], biomeIds: [1, 6, 11], salePrice: 2, improvementId: 'improvement.grange', extraction: 3 },
  { id: 'resource.iron', code: 2, name: 'Ironstone', description: 'Iron-bearing stone supplies armor training and heavy civic works.', category: 'material', terrainIds: [1, 3, 4], salePrice: 4, improvementId: 'improvement.iron_mine', extraction: 2 },
  { id: 'resource.copper', code: 3, name: 'Red copper', description: 'Copper veins supply fittings, missile equipment and precision tools.', category: 'material', terrainIds: [1, 3, 4], salePrice: 3, improvementId: 'improvement.copper_mine', extraction: 2 },
  { id: 'resource.salt', code: 4, name: 'White salt', description: 'Salt preserves provisions and underpins trading charters.', category: 'provisions', terrainIds: [0, 1, 3], biomeIds: [0, 5, 6, 11], salePrice: 3, improvementId: 'improvement.salt_house', extraction: 2 },
  { id: 'resource.timber', code: 5, name: 'Heartwood', description: 'Dense straight timber serves engineering, shields and settlement workshops.', category: 'material', terrainIds: [1, 2, 3], biomeIds: [2, 3, 8], salePrice: 3, improvementId: 'improvement.timber_yard', extraction: 2 },
  { id: 'resource.horses', code: 6, name: 'Steppe horses', description: 'Wild herds support remount yards and mobile military training.', category: 'material', terrainIds: [1], biomeIds: [1, 6], salePrice: 5, improvementId: 'improvement.remount_yard', extraction: 1 },
  { id: 'resource.silver', code: 7, name: 'Witness silver', description: 'Pale silver funds advanced charters and exacting civic instruments.', category: 'luxury', terrainIds: [3, 4], salePrice: 7, improvementId: 'improvement.silver_mine', extraction: 1 },
  { id: 'resource.ashglass', code: 8, name: 'Ashglass', description: 'Vitrified Ashfall deposits preserve arcane traces for advanced civic and military study.', category: 'arcane', terrainIds: [1, 3, 4], biomeIds: [9, 10, 11], salePrice: 6, improvementId: 'improvement.glass_refinery', extraction: 1 },
];
const yieldOf = (food = 0, industry = 0, coin = 0, knowledge = 0): LandYield => ({ food, industry, coin, knowledge });
const works = [
  ['Hearthgrain grange', 28, 3, yieldOf(3), []],
  ['Ironstone mine', 42, 4, yieldOf(-1, 3), ['technology.cinder_masonry']],
  ['Copper mine', 34, 3, yieldOf(0, 2, 1), ['technology.cinder_masonry']],
  ['Salt house', 30, 3, yieldOf(1, 0, 1), []],
  ['Heartwood yard', 30, 3, yieldOf(0, 3), []],
  ['Remount yard', 38, 4, yieldOf(1, 0, 1), ['technology.stewardship']],
  ['Silver mine', 52, 4, yieldOf(-1, 1, 2), ['technology.quarry_cranes']],
  ['Ashglass refinery', 56, 5, yieldOf(0, 0, 0, 3), ['technology.cinder_masonry']],
] as const;
export const RESOURCE_IMPROVEMENTS: readonly ImprovementDefinition[] = RESOURCES.map((resource, index) => {
  const [name, coinCost, turns, yields, requiredTechnologies] = works[index]!;
  return { id: resource.improvementId, name, description: `Work this completed site to gather ${resource.extraction} ${resource.name} each active turn into the realm stockpile. Requires its actual deposit; occupation and siege halt extraction.`, coinCost, turns, yields,
    sites: [{ terrainIds: resource.terrainIds, ...(resource.biomeIds ? { biomeIds: resource.biomeIds } : {}), ...(resource.terrainIds.includes(0) ? { waterDepthIds: [0, 1] } : {}) }], featureModifiers: [], introducedInRules: 16, requiredResourceId: resource.id,
    ...(requiredTechnologies.length ? { requiredTechnologies } : {}) };
});
export const resourceById = new Map(RESOURCES.map(resource => [resource.id, resource]));
export const resourceByCode = new Map(RESOURCES.map(resource => [resource.code, resource]));
export function validateResourceContent(): void {
  RESOURCES.forEach(resource => resourceSchema.parse(resource));
  if (new Set(RESOURCES.map(resource => resource.id)).size !== RESOURCES.length || new Set(RESOURCES.map(resource => resource.code)).size !== RESOURCES.length) throw new Error('Duplicate resource identity or packed code.');
  for (const resource of RESOURCES) if (!RESOURCE_IMPROVEMENTS.some(work => work.id === resource.improvementId && work.requiredResourceId === resource.id)) throw new Error('Resource lacks its extraction building.');
}
