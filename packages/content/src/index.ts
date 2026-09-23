import { z } from 'zod';
import { RESOURCES, validateResourceContent } from './resources';
import { DEVELOPMENT_NODES, validateDevelopmentContent } from './development';
export * from './resources';
export * from './development';
import { TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, UNIFICATION_VICTORY, CAMPAIGN_PACES, validateProgressionContent } from './progression';
import { CITY_STATES, cityStateSchema } from './city-states';
import { CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES, validateCharacterContent } from './characters';
import { BIOME_YIELDS, FACTION_ECOLOGIES, IMPROVEMENTS, NATURAL_FEATURES, validateEcologyContent } from './ecology';
import { FACTIONS, FACTION_ROSTERS, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, factionSchema, validateFactionContent } from './factions';
import { ARCANE_DISCOVERIES, BATTLE_SPELLS, FACTION_APTITUDES, FACTION_ARCANE_TRADITIONS, MAGIC_PATHS, WAYKEEPER_APTITUDES, MAX_CASTER_STRAIN, INNATE_BATTLE_ABILITIES, validateMagicContent } from './magic';
export * from './progression';
export * from './city-states';
export * from './characters';
export * from './ecology';
export * from './factions';
export * from './magic';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const nonnegative = z.number().int().nonnegative();
const prerequisites = z.array(id).max(20).refine(values => new Set(values).size === values.length, 'Duplicate prerequisite');
export const buildingSchema = z.object({ id, name: z.string().min(1), cost: z.number().int().positive(), coinCost: nonnegative, food: nonnegative, industry: nonnegative, coin: nonnegative, knowledge: nonnegative, coastalOnly: z.boolean().optional(), requiredTechnologies: prerequisites.optional() }).strict();
export const unitSchema = z.object({
  id, name: z.string().min(1), description: z.string().min(1).max(240).optional(), cost: z.number().int().positive(), coinCost: nonnegative, upkeep: nonnegative,
  movement: z.number().int().positive(), sight: z.number().int().positive(), canFound: z.boolean(), strength: z.number().int().positive(), attack: z.number().int().positive(),
  armor: nonnegative, initiative: nonnegative, range: nonnegative, morale: z.number().int().min(1).max(100),
  // Absence means land. Do not insert defaults into old definitions or historical projections.
  movementDomain: z.enum(['land', 'naval']).optional(),
  naval: z.object({ transportCapacity: z.number().int().min(0).max(24), oceanCapable: z.boolean() }).strict().optional(),
  requiredTechnologies: prerequisites.optional(), requiredBuildings: prerequisites.optional(),
  introducedInRules: z.literal(15).optional(),
}).strict().superRefine((unit, context) => {
  if ((unit.movementDomain === 'naval') !== (unit.naval !== undefined)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Naval movement and capabilities must be defined together' });
  if (unit.naval && unit.canFound) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Ships carry founders; they cannot found settlements themselves' });
});
export type BuildingDefinition = z.infer<typeof buildingSchema>;
export type UnitDefinition = z.infer<typeof unitSchema>;
export const BUILDINGS: readonly BuildingDefinition[] = [
  { id: 'building.granary', name: 'Root cellar', cost: 18, coinCost: 8, food: 4, industry: 0, coin: 0, knowledge: 0 },
  { id: 'building.workshop', name: 'Cinder workshop', cost: 24, coinCost: 12, food: 0, industry: 4, coin: 0, knowledge: 0 },
  { id: 'building.market', name: 'Charter market', cost: 24, coinCost: 10, food: 0, industry: 0, coin: 5, knowledge: 0 },
  { id: 'building.archive', name: 'Witness archive', cost: 24, coinCost: 12, food: 0, industry: 0, coin: 0, knowledge: 4 },
  { id: 'building.harbor', name: 'Charter harbor', cost: 36, coinCost: 20, food: 0, industry: 0, coin: 2, knowledge: 0, coastalOnly: true, requiredTechnologies: ['technology.coastal_navigation'] },
];
export const UNITS: readonly UnitDefinition[] = [
  { id: 'unit.colonist', name: 'Hearth caravan', cost: 30, coinCost: 16, upkeep: 1, movement: 3, sight: 2, canFound: true, strength: 10, attack: 3, armor: 1, initiative: 3, range: 0, morale: 40 },
  { id: 'unit.scout', name: 'Wayfinder', cost: 16, coinCost: 8, upkeep: 1, movement: 5, sight: 4, canFound: false, strength: 20, attack: 7, armor: 2, initiative: 10, range: 2, morale: 55 },
  { id: 'unit.guard', name: 'Oath guard', cost: 24, coinCost: 12, upkeep: 2, movement: 3, sight: 2, canFound: false, strength: 60, attack: 14, armor: 5, initiative: 6, range: 0, morale: 75 },
  { id: 'unit.spearman', name: 'Ash pike company', description: 'Affordable line troops whose long pikes reach beyond the front rank.', cost: 22, coinCost: 10, upkeep: 2, movement: 3, sight: 2, canFound: false, strength: 65, attack: 12, armor: 4, initiative: 5, range: 1, morale: 70 },
  { id: 'unit.heavy_infantry', name: 'Cinder plate cohort', description: 'Well-armored veterans with strong morale. Their heavy kit slows the entire marching column.', cost: 40, coinCost: 22, upkeep: 3, movement: 2, sight: 2, canFound: false, strength: 85, attack: 17, armor: 9, initiative: 3, range: 0, morale: 85 },
  { id: 'unit.cavalry', name: 'Charter outriders', description: 'Fast, hard-hitting mounted companies. High initiative rewards flanking, but light armor makes prolonged fighting costly.', cost: 36, coinCost: 18, upkeep: 3, movement: 5, sight: 3, canFound: false, strength: 50, attack: 18, armor: 3, initiative: 12, range: 0, morale: 65 },
  { id: 'unit.transport', name: 'Charter transport', description: 'Carries up to eight land formations per surviving transport formation. Lightly armed; escorts protect its passengers. Ocean navigation unlocks deep-water passage.', cost: 36, coinCost: 24, upkeep: 2, movement: 5, sight: 3, canFound: false, strength: 70, attack: 6, armor: 3, initiative: 5, range: 0, morale: 65, movementDomain: 'naval', naval: { transportCapacity: 8, oceanCapable: true }, requiredTechnologies: ['technology.coastal_navigation'], requiredBuildings: ['building.harbor'] },
  { id: 'unit.coastal_warship', name: 'Coastwatch galley', description: 'Fast coastal escorts with ranged crews. Shallow-draft galleys cannot enter deep ocean, even after Ocean navigation; they carry no land formations.', cost: 44, coinCost: 30, upkeep: 3, movement: 6, sight: 4, canFound: false, strength: 90, attack: 18, armor: 6, initiative: 10, range: 2, morale: 75, movementDomain: 'naval', naval: { transportCapacity: 0, oceanCapable: false }, requiredTechnologies: ['technology.coastal_navigation'], requiredBuildings: ['building.harbor'] },
  { id: 'unit.ocean_warship', name: 'Deepwake warship', description: 'Heavy ocean-going escorts with armored hulls and longer-ranged crews. Expensive to maintain and slower than galleys; they carry no land formations.', cost: 64, coinCost: 48, upkeep: 4, movement: 5, sight: 4, canFound: false, strength: 120, attack: 24, armor: 9, initiative: 7, range: 3, morale: 85, movementDomain: 'naval', naval: { transportCapacity: 0, oceanCapable: true }, requiredTechnologies: ['technology.coastal_navigation', 'technology.ocean_navigation'], requiredBuildings: ['building.harbor'] },
  { id: 'unit.skirmisher', name: 'Reed skirmishers', description: 'Light missile companies move quickly and strike early from the second rank. Fragile in a prolonged melee; they trade a wayfinder’s scouting reach for stronger fighting.', cost: 26, coinCost: 14, upkeep: 2, movement: 4, sight: 3, canFound: false, strength: 40, attack: 13, armor: 1, initiative: 14, range: 1, morale: 60, requiredTechnologies: ['technology.stewardship'], requiredBuildings: ['building.granary'], introducedInRules: 15 },
  { id: 'unit.arbalester', name: 'Witness arbalesters', description: 'Workshop-trained bow crews deliver powerful volleys from the rear rank. Slow to take the initiative and vulnerable when their protecting line collapses.', cost: 38, coinCost: 22, upkeep: 3, movement: 3, sight: 2, canFound: false, strength: 45, attack: 20, armor: 3, initiative: 4, range: 3, morale: 70, requiredTechnologies: ['technology.cinder_masonry'], requiredBuildings: ['building.workshop'], introducedInRules: 15 },
  { id: 'unit.halberdier', name: 'Kiln halberdiers', description: 'Armored polearm companies combine strong blows with second-rank reach. Their heavy equipment slows a column, and they cost more to maintain than ash pikes.', cost: 48, coinCost: 28, upkeep: 4, movement: 2, sight: 2, canFound: false, strength: 80, attack: 20, armor: 7, initiative: 4, range: 1, morale: 80, requiredTechnologies: ['technology.quarry_cranes'], requiredBuildings: ['building.workshop'], introducedInRules: 15 },
  { id: 'unit.lancer', name: 'Road lancers', description: 'Charter-backed armored riders deliver heavy melee blows with high initiative. Slower and costlier than outriders, they provide a durable mounted assault company.', cost: 54, coinCost: 32, upkeep: 4, movement: 4, sight: 3, canFound: false, strength: 65, attack: 24, armor: 6, initiative: 11, range: 0, morale: 80, requiredTechnologies: ['technology.surveyed_estates'], requiredBuildings: ['building.market'], introducedInRules: 15 },
];
/** Rules-aware catalogs keep future paid recruits out of historical commands and observations. */
export function unitsForRules(version: number): readonly UnitDefinition[] {
  return UNITS.filter(unit => (unit.introducedInRules ?? 4) <= version);
}
/** Stable content checksum. Gameplay saves reject packs with changed parameters. */
export function checksum(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
/** The whole-pack seal. Historical packs substitute their frozen pace table and omit later additions. */
/** Magic content is versioned like the pace table: an older pack is sealed with
 * the workings that campaign could actually reach. */
export interface MagicPack { discoveries: typeof ARCANE_DISCOVERIES; spells: typeof BATTLE_SPELLS; traditions: boolean }
export const CURRENT_MAGIC: MagicPack = { discoveries: ARCANE_DISCOVERIES, spells: BATTLE_SPELLS, traditions: true };
export const magicPackForRules = (rules: number): MagicPack => {
  const discoveries = ARCANE_DISCOVERIES.filter(item => (item.sinceRules ?? 14) <= rules);
  const ids = new Set(discoveries.map(item => item.id));
  return { discoveries, spells: BATTLE_SPELLS.filter(spell => ids.has(spell.discoveryId)), traditions: rules >= 24 };
};
export const contentPackHash = (paces: typeof CAMPAIGN_PACES = CAMPAIGN_PACES, unification: typeof UNIFICATION_VICTORY | null = UNIFICATION_VICTORY, cityStates = true, magic: MagicPack = CURRENT_MAGIC): string => checksum(JSON.stringify({ BUILDINGS, UNITS, FACTIONS, TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES: paces, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES, BIOME_YIELDS, FACTION_ECOLOGIES, IMPROVEMENTS, NATURAL_FEATURES, FACTION_ROSTERS, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, ARCANE_DISCOVERIES: magic.discoveries, BATTLE_SPELLS: magic.spells, MAGIC_PATHS, WAYKEEPER_APTITUDES, MAX_CASTER_STRAIN, INNATE_BATTLE_ABILITIES, RESOURCES, DEVELOPMENT_NODES, ...(unification ? { UNIFICATION_VICTORY: unification } : {}), ...(cityStates ? { CITY_STATES } : {}), ...(magic.traditions ? { FACTION_APTITUDES, FACTION_ARCANE_TRADITIONS } : {}) }));
export const CONTENT_HASH = contentPackHash();
export const LOCALIZATION: Readonly<Record<string, string>> = Object.fromEntries([
  ...INNATE_BATTLE_ABILITIES.flatMap(item => [[item.id + '.name', item.name], [item.id + '.description', item.description]]),
  ...[...RESOURCES, ...DEVELOPMENT_NODES, ...BUILDINGS, ...UNITS, ...FACTIONS, ...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES, PROSPERITY_PROJECT, UNIFICATION_VICTORY, ...CITY_STATES, ...CHARACTER_DEFINITIONS, ...CHARACTER_MISSIONS, ...CHARACTER_SKILLS, ...COMMANDER_ABILITIES, ...IMPROVEMENTS, ...NATURAL_FEATURES, ...ARCANE_DISCOVERIES, ...BATTLE_SPELLS, ...MAGIC_PATHS, ...Object.entries(CAMPAIGN_PACES).map(([key, profile]) => ({ ...profile, id: 'pace.' + key }))].flatMap(item => [[item.id + '.name', item.name], ...('description' in item ? [[item.id + '.description', item.description]] : [])]),
  ...Object.entries(FACTION_PROFILES).flatMap(([id, profile]) => [[id + '.description', profile.description], [id + '.recruitmentRationale', profile.recruitmentRationale]]),
]);

/** Validate production unlocks against actual content, without hardcoded ship IDs in consumers. */
export function validateProductionContent(buildings = BUILDINGS, units = UNITS, technologies = TECHNOLOGIES): void {
  buildings.forEach(item => buildingSchema.parse(item));
  units.forEach(item => unitSchema.parse(item));
  const definitions = [...buildings, ...units];
  if (new Set(definitions.map(item => item.id)).size !== definitions.length) throw new Error('Duplicate production ID');
  const buildingById = new Map(buildings.map(item => [item.id, item]));
  const technologyIds = new Set(technologies.map(item => item.id));
  for (const definition of definitions) {
    for (const technologyId of definition.requiredTechnologies ?? []) if (!technologyIds.has(technologyId)) throw new Error('Unknown production technology: ' + technologyId);
  }
  for (const unit of units) {
    for (const buildingId of unit.requiredBuildings ?? []) if (!buildingById.has(buildingId)) throw new Error('Unknown recruitment building: ' + buildingId);
    if (unit.naval && !unit.requiredBuildings?.some(buildingId => buildingById.get(buildingId)?.coastalOnly)) throw new Error('Naval recruitment requires coastal infrastructure: ' + unit.id);
  }
}
/** City-states borrow a real culture's art and roster, so each must name one and
 * fly a colour no culture or other city-state already uses on the same map. */
export function validateCityStateContent(): void {
  const cultures = new Set<string>(FACTIONS.map(item => item.id));
  const colors = new Set<number>(FACTIONS.map(item => item.color));
  for (const item of CITY_STATES) {
    cityStateSchema.parse(item);
    if (!cultures.has(item.cultureId)) throw new Error('Unknown city-state culture: ' + item.cultureId);
    if (colors.has(item.color)) throw new Error('City-state colour collides with another banner: ' + item.id);
    colors.add(item.color);
  }
}
export function validateContent(): { resources: number; developmentNodes: number; buildings: number; units: number; factions: number; technologies: number; institutions: number; doctrines: number; projects: number; characterRoles: number; characterMissions: number; characterSkills: number; commanderAbilities: number; improvements: number; naturalFeatures: number; arcaneDiscoveries: number; battleSpells: number; magicPaths: number; innateBattleAbilities: number; hash: string } {
  const definitions = [...RESOURCES, ...DEVELOPMENT_NODES, ...BUILDINGS, ...UNITS, ...FACTIONS, ...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES, PROSPERITY_PROJECT, UNIFICATION_VICTORY, ...CITY_STATES, ...CHARACTER_DEFINITIONS, ...CHARACTER_MISSIONS, ...CHARACTER_SKILLS, ...COMMANDER_ABILITIES, ...IMPROVEMENTS, ...NATURAL_FEATURES, ...ARCANE_DISCOVERIES, ...BATTLE_SPELLS, ...MAGIC_PATHS, ...INNATE_BATTLE_ABILITIES];
  if (new Set(definitions.map(item => item.id)).size !== definitions.length) throw new Error('Duplicate content ID');
  validateProductionContent();
  validateResourceContent();
  validateDevelopmentContent({ buildings: new Set(BUILDINGS.map(item => item.id)), technologies: new Set(TECHNOLOGIES.map(item => item.id)), institutions: new Set(INSTITUTIONS.map(item => item.id)), doctrines: new Set(DOCTRINES.map(item => item.id)), resources: new Set(RESOURCES.map(item => item.id)) });
  FACTIONS.forEach(item => factionSchema.parse(item));
  validateFactionContent(UNITS);
  validateCityStateContent();
  validateProgressionContent(new Set(BUILDINGS.map(item => item.id)));
  validateCharacterContent(new Set(FACTIONS.map(item => item.id)));
  validateMagicContent(new Set(CHARACTER_DEFINITIONS.map(item => item.id)), new Set(BUILDINGS.map(item => item.id)));
  for (const ability of INNATE_BATTLE_ABILITIES) if (!UNITS.some(unit => unit.id === ability.unitId)) throw new Error('Unknown innate-ability unit: ' + ability.unitId);
  validateEcologyContent(new Set(FACTIONS.map(item => item.id)));
  for (const item of definitions) if (!LOCALIZATION[item.id + '.name']) throw new Error('Missing localization: ' + item.id);
  return { resources: RESOURCES.length, developmentNodes: DEVELOPMENT_NODES.length, buildings: BUILDINGS.length, units: UNITS.length, factions: FACTIONS.length, technologies: TECHNOLOGIES.length, institutions: INSTITUTIONS.length, doctrines: DOCTRINES.length, projects: 1, characterRoles: CHARACTER_DEFINITIONS.length, characterMissions: CHARACTER_MISSIONS.length, characterSkills: CHARACTER_SKILLS.length, commanderAbilities: COMMANDER_ABILITIES.length, improvements: IMPROVEMENTS.length, naturalFeatures: NATURAL_FEATURES.length, arcaneDiscoveries: ARCANE_DISCOVERIES.length, battleSpells: BATTLE_SPELLS.length, magicPaths: MAGIC_PATHS.length, innateBattleAbilities: INNATE_BATTLE_ABILITIES.length, hash: CONTENT_HASH };
}
