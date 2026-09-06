import { z } from 'zod';
import { TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES, validateProgressionContent } from './progression';
import { CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES, validateCharacterContent } from './characters';
export * from './progression';
export * from './characters';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const nonnegative = z.number().int().nonnegative();
export const buildingSchema = z.object({ id, name: z.string().min(1), cost: z.number().int().positive(), coinCost: nonnegative, food: nonnegative, industry: nonnegative, coin: nonnegative, knowledge: nonnegative }).strict();
export const unitSchema = z.object({ id, name: z.string().min(1), description: z.string().min(1).max(240).optional(), cost: z.number().int().positive(), coinCost: nonnegative, upkeep: nonnegative, movement: z.number().int().positive(), sight: z.number().int().positive(), canFound: z.boolean(), strength: z.number().int().positive(), attack: z.number().int().positive(), armor: nonnegative, initiative: nonnegative, range: nonnegative, morale: z.number().int().min(1).max(100) }).strict();
export const factionSchema = z.object({ id, name: z.string().min(1), color: z.number().int().min(0).max(0xffffff), motto: z.string().min(1) }).strict();
export type BuildingDefinition = z.infer<typeof buildingSchema>;
export type UnitDefinition = z.infer<typeof unitSchema>;
export const BUILDINGS: readonly BuildingDefinition[] = [
  { id: 'building.granary', name: 'Root cellar', cost: 18, coinCost: 8, food: 4, industry: 0, coin: 0, knowledge: 0 },
  { id: 'building.workshop', name: 'Cinder workshop', cost: 24, coinCost: 12, food: 0, industry: 4, coin: 0, knowledge: 0 },
  { id: 'building.market', name: 'Charter market', cost: 24, coinCost: 10, food: 0, industry: 0, coin: 5, knowledge: 0 },
  { id: 'building.archive', name: 'Witness archive', cost: 24, coinCost: 12, food: 0, industry: 0, coin: 0, knowledge: 4 },
];
export const UNITS: readonly UnitDefinition[] = [
  { id: 'unit.colonist', name: 'Hearth caravan', cost: 30, coinCost: 16, upkeep: 1, movement: 3, sight: 2, canFound: true, strength: 10, attack: 3, armor: 1, initiative: 3, range: 0, morale: 40 },
  { id: 'unit.scout', name: 'Wayfinder', cost: 16, coinCost: 8, upkeep: 1, movement: 5, sight: 4, canFound: false, strength: 20, attack: 7, armor: 2, initiative: 10, range: 2, morale: 55 },
  { id: 'unit.guard', name: 'Oath guard', cost: 24, coinCost: 12, upkeep: 2, movement: 3, sight: 2, canFound: false, strength: 60, attack: 14, armor: 5, initiative: 6, range: 0, morale: 75 },
  { id: 'unit.spearman', name: 'Ash pike company', description: 'Affordable line troops whose long pikes reach beyond the front rank.', cost: 22, coinCost: 10, upkeep: 2, movement: 3, sight: 2, canFound: false, strength: 65, attack: 12, armor: 4, initiative: 5, range: 1, morale: 70 },
  { id: 'unit.heavy_infantry', name: 'Cinder plate cohort', description: 'Well-armored veterans with strong morale. Their heavy kit slows the entire marching column.', cost: 40, coinCost: 22, upkeep: 3, movement: 2, sight: 2, canFound: false, strength: 85, attack: 17, armor: 9, initiative: 3, range: 0, morale: 85 },
  { id: 'unit.cavalry', name: 'Charter outriders', description: 'Fast, hard-hitting mounted companies. High initiative rewards flanking, but light armor makes prolonged fighting costly.', cost: 36, coinCost: 18, upkeep: 3, movement: 5, sight: 3, canFound: false, strength: 50, attack: 18, armor: 3, initiative: 12, range: 0, morale: 65 },
];
export const FACTIONS = [
  { id: 'faction.ashen_compact', name: 'Ashen Compact', color: 0xc9a66b, motto: 'Keep the hearth. Keep the oath.' },
  { id: 'faction.reedbound_council', name: 'Reedbound Council', color: 0x82b5a0, motto: 'No river belongs to one shore.' },
  { id: 'faction.cinder_march', name: 'Cinder March', color: 0xc17f77, motto: 'We hold what the fire spared.' },
  { id: 'faction.glass_tide', name: 'Glass Tide', color: 0x879fca, motto: 'Every horizon is a promise.' },
] as const;

/** Stable content checksum. Gameplay saves reject packs with changed parameters. */
export function checksum(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export const CONTENT_HASH = checksum(JSON.stringify({ BUILDINGS, UNITS, FACTIONS, TECHNOLOGIES, INSTITUTIONS, DOCTRINES, PROSPERITY_PROJECT, CAMPAIGN_PACES, CHARACTER_DEFINITIONS, CHARACTER_MISSIONS, CHARACTER_SKILLS, COMMANDER_ABILITIES, CHARACTER_NAMES }));
export const LOCALIZATION: Readonly<Record<string, string>> = Object.fromEntries([...BUILDINGS, ...UNITS, ...FACTIONS, ...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES, PROSPERITY_PROJECT, ...CHARACTER_DEFINITIONS, ...CHARACTER_MISSIONS, ...CHARACTER_SKILLS, ...COMMANDER_ABILITIES, ...Object.entries(CAMPAIGN_PACES).map(([key, profile]) => ({ ...profile, id: 'pace.' + key }))].flatMap(item => [[item.id + '.name', item.name], ...('description' in item ? [[item.id + '.description', item.description]] : [])]));
export function validateContent(): { buildings: number; units: number; factions: number; technologies: number; institutions: number; doctrines: number; projects: number; characterRoles: number; characterMissions: number; characterSkills: number; commanderAbilities: number; hash: string } {
  const definitions = [...BUILDINGS, ...UNITS, ...FACTIONS, ...TECHNOLOGIES, ...INSTITUTIONS, ...DOCTRINES, PROSPERITY_PROJECT, ...CHARACTER_DEFINITIONS, ...CHARACTER_MISSIONS, ...CHARACTER_SKILLS, ...COMMANDER_ABILITIES];
  if (new Set(definitions.map(item => item.id)).size !== definitions.length) throw new Error('Duplicate content ID');
  BUILDINGS.forEach(item => buildingSchema.parse(item));
  UNITS.forEach(item => unitSchema.parse(item));
  FACTIONS.forEach(item => factionSchema.parse(item));
  validateProgressionContent(new Set(BUILDINGS.map(item => item.id)));
  validateCharacterContent(new Set(FACTIONS.map(item => item.id)));
  for (const item of definitions) if (!LOCALIZATION[item.id + '.name']) throw new Error('Missing localization: ' + item.id);
  return { buildings: BUILDINGS.length, units: UNITS.length, factions: FACTIONS.length, technologies: TECHNOLOGIES.length, institutions: INSTITUTIONS.length, doctrines: DOCTRINES.length, projects: 1, characterRoles: CHARACTER_DEFINITIONS.length, characterMissions: CHARACTER_MISSIONS.length, characterSkills: CHARACTER_SKILLS.length, commanderAbilities: COMMANDER_ABILITIES.length, hash: CONTENT_HASH };
}
