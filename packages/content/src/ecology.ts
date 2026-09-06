import { z } from 'zod';

/** Signed contributions. Clamp only the final worked-tile sum, not individual penalties. */
export interface LandYield { food: number; industry: number; coin: number; knowledge: number }
export const landYieldSchema = z.object({ food: z.number().int().min(-10).max(10), industry: z.number().int().min(-10).max(10), coin: z.number().int().min(-10).max(10), knowledge: z.number().int().min(-10).max(10) }).strict();
const yieldOf = (food = 0, industry = 0, coin = 0, knowledge = 0): LandYield => ({ food, industry, coin, knowledge });
const biomeId = z.number().int().min(0).max(11);
const unique = (values: readonly number[]): boolean => new Set(values).size === values.length;
const biomeIds = z.array(biomeId).min(1).max(12).refine(unique, 'Duplicate biome');
const identifier = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const featureBit = z.number().int().min(1).max(64).refine(value => (value & (value - 1)) === 0, 'A feature must be one known bit');
const featureMask = z.number().int().min(0).max(127);

/** Numeric geography IDs are deliberately dependency-free; cross-package tests seal their mapping. */
export const BIOME_YIELDS: Readonly<Record<number, LandYield>> = {
  0: yieldOf(1, 0, 1), 1: yieldOf(2), 2: yieldOf(1, 1), 3: yieldOf(0, 2),
  4: yieldOf(1), 5: yieldOf(0, 1), 6: yieldOf(1, 0, 1), 7: yieldOf(1, 0, 1),
  8: yieldOf(2, 1), 9: yieldOf(0, 2), 10: yieldOf(0, 2), 11: yieldOf(1, 1),
};

export interface NaturalFeatureDefinition { feature: number; id: string; name: string; description: string; yields: LandYield }
export const naturalFeatureSchema = z.object({ feature: featureBit, id: identifier, name: z.string().min(1).max(80), description: z.string().min(1).max(500), yields: landYieldSchema }).strict();
export const NATURAL_FEATURES: readonly NaturalFeatureDefinition[] = [
  { feature: 1, id: 'feature.spring', name: 'Fresh spring', description: 'Reliable fresh water feeds a worked hex. It does not create a navigable river.', yields: yieldOf(1) },
  { feature: 2, id: 'feature.ore', name: 'Ore seam', description: 'Exposed mineral seams provide industry and reward careful quarrying.', yields: yieldOf(0, 1) },
  { feature: 4, id: 'feature.old_growth', name: 'Old growth', description: 'Ancient woodland preserves living records. Its knowledge remains valuable under managed cutting.', yields: yieldOf(0, 0, 0, 1) },
  { feature: 8, id: 'feature.waterlogging', name: 'Waterlogged ground', description: 'Saturated ground slows ordinary extraction and field drainage.', yields: yieldOf(0, -1) },
  { feature: 16, id: 'feature.peat', name: 'Peat bed', description: 'Wet organic beds supply modest fuel; reedworks can use them more effectively.', yields: yieldOf(0, 1) },
  { feature: 32, id: 'feature.rich_shoals', name: 'Rich shoals', description: 'Productive coastal shallows sustain fish and reward a shore fishery.', yields: yieldOf(1) },
  { feature: 64, id: 'feature.glass_shards', name: 'Ashfall glass', description: 'Vitrified fragments hamper food gathering but preserve evidence of the disputed Ashfall.', yields: yieldOf(-1, 0, 0, 1) },
];

export interface FactionEcology { factionId: string; terraformBiomeIds: readonly number[]; affinities: readonly { biomeId: number; yields: LandYield }[] }
export const factionEcologySchema = z.object({ factionId: identifier, terraformBiomeIds: z.array(biomeId.min(1)).min(1).max(2).refine(unique, 'Duplicate cultivation target'), affinities: z.array(z.object({ biomeId, yields: landYieldSchema }).strict()).min(1).max(12).refine(values => unique(values.map(value => value.biomeId)), 'Duplicate affinity') }).strict();
const affinity = (biomeId: number, yields: LandYield) => ({ biomeId, yields });
/** All unlisted biomes are neutral. These bonuses never grant movement or magical access. */
export const FACTION_ECOLOGIES: Readonly<Record<string, FactionEcology>> = {
  'faction.ashen_compact': { factionId: 'faction.ashen_compact', terraformBiomeIds: [1, 2], affinities: [affinity(1, yieldOf(1)), affinity(2, yieldOf(0, 1)), affinity(4, yieldOf(-1)), affinity(5, yieldOf(-1))] },
  'faction.reedbound_council': { factionId: 'faction.reedbound_council', terraformBiomeIds: [7, 8], affinities: [affinity(7, yieldOf(1)), affinity(8, yieldOf(1)), affinity(5, yieldOf(-1)), affinity(10, yieldOf(-1))] },
  'faction.cinder_march': { factionId: 'faction.cinder_march', terraformBiomeIds: [10, 6], affinities: [affinity(10, yieldOf(0, 1)), affinity(6, yieldOf(0, 1)), affinity(7, yieldOf(0, -1)), affinity(8, yieldOf(0, -1))] },
  'faction.glass_tide': { factionId: 'faction.glass_tide', terraformBiomeIds: [11], affinities: [affinity(0, yieldOf(0, 0, 1)), affinity(11, yieldOf(0, 0, 1)), affinity(4, yieldOf(-1)), affinity(3, yieldOf(0, -1))] },
  'faction.iron_covenant': { factionId: 'faction.iron_covenant', terraformBiomeIds: [3], affinities: [affinity(3, yieldOf(0, 1)), affinity(9, yieldOf(0, 1)), affinity(7, yieldOf(-1)), affinity(8, yieldOf(0, -1))] },
  'faction.sepulchral_synod': { factionId: 'faction.sepulchral_synod', terraformBiomeIds: [11, 5], affinities: [affinity(11, yieldOf(0, 0, 0, 1)), affinity(5, yieldOf(1)), affinity(7, yieldOf(0, -1)), affinity(8, yieldOf(0, -1))] },
  'faction.mire_courts': { factionId: 'faction.mire_courts', terraformBiomeIds: [7, 8], affinities: [affinity(7, yieldOf(1)), affinity(8, yieldOf(0, 0, 0, 1)), affinity(5, yieldOf(-1)), affinity(10, yieldOf(-1))] },
  'faction.saltwind_remnant': { factionId: 'faction.saltwind_remnant', terraformBiomeIds: [11], affinities: [affinity(0, yieldOf(0, 0, 1)), affinity(11, yieldOf(0, 1)), affinity(3, yieldOf(0, -1)), affinity(8, yieldOf(0, 0, -1))] },
  'faction.wardhall_remnant': { factionId: 'faction.wardhall_remnant', terraformBiomeIds: [1, 11], affinities: [affinity(11, yieldOf(0, 1)), affinity(1, yieldOf(0, 0, 0, 1)), affinity(7, yieldOf(0, -1)), affinity(8, yieldOf(0, -1))] },
  'faction.rimehorn_clans': { factionId: 'faction.rimehorn_clans', terraformBiomeIds: [3, 4], affinities: [affinity(4, yieldOf(1)), affinity(3, yieldOf(0, 1)), affinity(5, yieldOf(-1)), affinity(7, yieldOf(0, -1))] },
  'faction.sable_steppe': { factionId: 'faction.sable_steppe', terraformBiomeIds: [6, 5], affinities: [affinity(6, yieldOf(1)), affinity(5, yieldOf(0, 0, 1)), affinity(7, yieldOf(-1)), affinity(3, yieldOf(0, 0, -1))] },
  'faction.morrow_spore': { factionId: 'faction.morrow_spore', terraformBiomeIds: [2, 8], affinities: [affinity(2, yieldOf(0, 0, 0, 1)), affinity(8, yieldOf(1)), affinity(11, yieldOf(-1)), affinity(10, yieldOf(0, 0, -1))] },
};

/** Sites are OR clauses; every supplied predicate inside a site must match. */
export interface ImprovementSite { terrainIds: readonly number[]; biomeIds?: readonly number[]; waterDepthIds?: readonly number[]; requiredFeatures?: number; forbiddenFeatures?: number }
export interface ImprovementDefinition { id: string; name: string; description: string; coinCost: number; turns: number; yields: LandYield; sites: readonly ImprovementSite[]; featureModifiers: readonly { feature: number; yields: LandYield }[] }
export const improvementSiteSchema = z.object({ terrainIds: z.array(z.number().int().min(0).max(4)).min(1).max(5).refine(unique, 'Duplicate terrain'), biomeIds: biomeIds.optional(), waterDepthIds: z.array(z.number().int().min(0).max(2)).min(1).max(3).refine(unique, 'Duplicate water depth').optional(), requiredFeatures: featureMask.optional(), forbiddenFeatures: featureMask.optional() }).strict().refine(site => !((site.requiredFeatures ?? 0) & (site.forbiddenFeatures ?? 0)), 'Required and forbidden features overlap');
export const improvementSchema = z.object({ id: identifier, name: z.string().min(1).max(80), description: z.string().min(1).max(500), coinCost: z.number().int().min(1).max(1_000_000), turns: z.number().int().min(1).max(100), yields: landYieldSchema, sites: z.array(improvementSiteSchema).min(1).max(8), featureModifiers: z.array(z.object({ feature: featureBit, yields: landYieldSchema }).strict()).max(7).refine(values => unique(values.map(value => value.feature)), 'Duplicate feature modifier') }).strict();
export const IMPROVEMENTS: readonly ImprovementDefinition[] = [
  { id: 'improvement.terraced_fields', name: 'Terraced fields', description: 'Cultivated field steps add 2 food. Springs add 1 more food; waterlogging costs 1 food.', coinCost: 18, turns: 2, yields: yieldOf(2), sites: [{ terrainIds: [1, 2, 3], biomeIds: [1, 6, 11] }], featureModifiers: [{ feature: 1, yields: yieldOf(1) }, { feature: 8, yields: yieldOf(-1) }] },
  { id: 'improvement.managed_woodlot', name: 'Managed woodlot', description: 'Selective woodland use adds 2 industry and 1 food. Old growth adds 1 knowledge; glass fragments cost 1 industry.', coinCost: 24, turns: 3, yields: yieldOf(1, 2), sites: [{ terrainIds: [1, 2, 3], biomeIds: [2, 3, 8] }], featureModifiers: [{ feature: 4, yields: yieldOf(0, 0, 0, 1) }, { feature: 64, yields: yieldOf(0, -1) }] },
  { id: 'improvement.quarry', name: 'Measured quarry', description: 'Stone cutting adds 3 industry but costs 1 food. Ore adds 1 industry; waterlogging costs 1 industry.', coinCost: 28, turns: 3, yields: yieldOf(-1, 3), sites: [{ terrainIds: [3, 4] }, { terrainIds: [1, 2], biomeIds: [11] }], featureModifiers: [{ feature: 2, yields: yieldOf(0, 1) }, { feature: 8, yields: yieldOf(0, -1) }] },
  { id: 'improvement.reedworks', name: 'Reedworks', description: 'Wetland beds add 1 food, 1 industry and 1 coin. Peat adds 1 industry; glass fragments cost 1 coin.', coinCost: 22, turns: 2, yields: yieldOf(1, 1, 1), sites: [{ terrainIds: [1, 2, 3], biomeIds: [7] }], featureModifiers: [{ feature: 16, yields: yieldOf(0, 1) }, { feature: 64, yields: yieldOf(0, 0, -1) }] },
  { id: 'improvement.shore_fishery', name: 'Shore fishery', description: 'A shallow-water fishery adds 2 food and 1 coin. Rich shoals add 1 food; glass fragments cost 1 coin.', coinCost: 24, turns: 2, yields: yieldOf(2, 0, 1), sites: [{ terrainIds: [0], biomeIds: [0], waterDepthIds: [1] }], featureModifiers: [{ feature: 32, yields: yieldOf(1) }, { feature: 64, yields: yieldOf(0, 0, -1) }] },
];

/** Cross-reference checks are separate from shape checks so imported packs cannot invent IDs. */
export function validateEcologyContent(factionIds: ReadonlySet<string>, ecologies = FACTION_ECOLOGIES, improvements = IMPROVEMENTS, features = NATURAL_FEATURES, biomeYields = BIOME_YIELDS): void {
  const all = [...improvements, ...features];
  if (new Set(all.map(item => item.id)).size !== all.length) throw new Error('Duplicate ecology content ID');
  features.forEach(item => naturalFeatureSchema.parse(item));
  if (features.some(item => !item.id.startsWith('feature.'))) throw new Error('Invalid natural feature ID');
  if (features.length !== 7 || !unique(features.map(item => item.feature))) throw new Error('Natural feature bits must cover the seven geography features exactly');
  if (Object.keys(biomeYields).length !== 12) throw new Error('Missing biome yields');
  for (let biome = 0; biome < 12; biome++) {
    const value = landYieldSchema.parse(biomeYields[biome]);
    if (Object.values(value).some(amount => amount < 0)) throw new Error('Base biome yields must be nonnegative');
  }
  for (const [key, ecology] of Object.entries(ecologies)) {
    factionEcologySchema.parse(ecology);
    if (key !== ecology.factionId || !factionIds.has(key)) throw new Error('Unknown ecology faction: ' + key);
    if (ecology.terraformBiomeIds.includes(9)) throw new Error('Cultivation cannot create alpine relief');
    for (const target of ecology.terraformBiomeIds) if (!ecology.affinities.some(item => item.biomeId === target && Object.values(item.yields).some(value => value > 0))) throw new Error('Cultivation target must have a positive faction affinity');
  }
  for (const factionId of factionIds) if (!ecologies[factionId]) throw new Error('Missing faction ecology: ' + factionId);
  const featureBits = new Set(features.map(item => item.feature));
  for (const improvement of improvements) {
    improvementSchema.parse(improvement);
    if (!improvement.id.startsWith('improvement.')) throw new Error('Invalid improvement ID');
    for (const modifier of improvement.featureModifiers) if (!featureBits.has(modifier.feature)) throw new Error('Unknown improvement feature');
    for (const site of improvement.sites) {
      const possible = site.terrainIds.some(terrain => {
        const water = terrain === 0;
        return (!site.biomeIds || site.biomeIds.some(biome => water === (biome === 0)))
          && (!site.waterDepthIds || site.waterDepthIds.some(depth => water === (depth !== 0)));
      });
      if (!possible) throw new Error('Impossible improvement biome/depth/terrain site');
    }
  }
}
