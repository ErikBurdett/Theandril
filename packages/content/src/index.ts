import { z } from 'zod';
import { TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES, validateProgressionContent } from './progression';
import { CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES, validateCharacterContent } from './characters';
import { BIOME_YIELDS, FACTION_ECOLOGIES, IMPROVEMENTS, NATURAL_FEATURES, validateEcologyContent } from './ecology';
import { FACTIONS, FACTION_ROSTERS, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS, factionSchema, validateFactionContent } from './factions';
export * from './progression';
export * from './characters';
export * from './ecology';
export * from './factions';

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
];
/** Stable content checksum. Gameplay saves reject packs with changed parameters. */
export function checksum(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export const CONTENT_HASH = checksum(JSON.stringify({ BUILDINGS, UNITS, FACTIONS, TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES, BIOME_YIELDS, FACTION_ECOLOGIES, IMPROVEMENTS, NATURAL_FEATURES, FACTION_ROSTERS, FACTION_PROFILES, FACTION_RECRUITMENT_WEIGHTS }));
export const LOCALIZATION: Readonly<Record<string, string>> = Object.fromEntries([
  ...[...BUILDINGS, ...UNITS, ...FACTIONS, ...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES, PROSPERITY_PROJECT, ...CHARACTER_DEFINITIONS, ...CHARACTER_MISSIONS, ...CHARACTER_SKILLS, ...COMMANDER_ABILITIES, ...IMPROVEMENTS, ...NATURAL_FEATURES, ...Object.entries(CAMPAIGN_PACES).map(([key, profile]) => ({ ...profile, id: 'pace.' + key }))].flatMap(item => [[item.id + '.name', item.name], ...('description' in item ? [[item.id + '.description', item.description]] : [])]),
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
export function validateContent(): { buildings: number; units: number; factions: number; technologies: number; institutions: number; doctrines: number; projects: number; characterRoles: number; characterMissions: number; characterSkills: number; commanderAbilities: number; improvements: number; naturalFeatures: number; hash: string } {
  const definitions = [...BUILDINGS, ...UNITS, ...FACTIONS, ...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES, PROSPERITY_PROJECT, ...CHARACTER_DEFINITIONS, ...CHARACTER_MISSIONS, ...CHARACTER_SKILLS, ...COMMANDER_ABILITIES, ...IMPROVEMENTS, ...NATURAL_FEATURES];
  if (new Set(definitions.map(item => item.id)).size !== definitions.length) throw new Error('Duplicate content ID');
  validateProductionContent();
  FACTIONS.forEach(item => factionSchema.parse(item));
  validateFactionContent(UNITS);
  validateProgressionContent(new Set(BUILDINGS.map(item => item.id)));
  validateCharacterContent(new Set(FACTIONS.map(item => item.id)));
  validateEcologyContent(new Set(FACTIONS.map(item => item.id)));
  for (const item of definitions) if (!LOCALIZATION[item.id + '.name']) throw new Error('Missing localization: ' + item.id);
  return { buildings: BUILDINGS.length, units: UNITS.length, factions: FACTIONS.length, technologies: TECHNOLOGIES.length, institutions: INSTITUTIONS.length, doctrines: DOCTRINES.length, projects: 1, characterRoles: CHARACTER_DEFINITIONS.length, characterMissions: CHARACTER_MISSIONS.length, characterSkills: CHARACTER_SKILLS.length, commanderAbilities: COMMANDER_ABILITIES.length, improvements: IMPROVEMENTS.length, naturalFeatures: NATURAL_FEATURES.length, hash: CONTENT_HASH };
}
