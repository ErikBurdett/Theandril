import { z } from 'zod';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const text = z.string().min(1).max(320);
const bounded = (max: number) => z.number().int().min(0).max(max);
export const characterRoleSchema = z.enum(['marshal', 'surveyor', 'engineer']);
export type CharacterRole = z.infer<typeof characterRoleSchema>;
const leadership = z.object({ attack: bounded(5), armor: bounded(5) }).strict();
export const characterDefinitionSchema = z.object({
  id, role: characterRoleSchema, name: text, description: text,
  coinCost: bounded(500), upkeep: bounded(20), leadership,
  missionIds: z.array(id).max(8), skillIds: z.array(id).min(1).max(8),
}).strict();
export type CharacterDefinition = z.infer<typeof characterDefinitionSchema>;
export const characterMissionSchema = z.object({
  id, kind: z.enum(['survey', 'refit', 'sabotage']), name: text, description: text,
  duration: z.number().int().min(1).max(20), coinCost: bounded(500), experience: bounded(100),
  radius: bounded(8), strengthRestore: bounded(20), defenseDamage: bounded(100),
  woundTurns: bounded(10), failureChance: bounded(90),
}).strict();
export type CharacterMissionDefinition = z.infer<typeof characterMissionSchema>;
export const characterSkillSchema = z.object({
  id, name: text, description: text, roles: z.array(characterRoleSchema).min(1).max(3),
  experienceCost: z.number().int().min(1).max(1000), leadership,
  rallyBonus: bounded(20), surveyRadiusBonus: bounded(2), refitBonus: bounded(10), sabotageRiskReduction: bounded(25),
}).strict();
export type CharacterSkillDefinition = z.infer<typeof characterSkillSchema>;
export const commanderAbilitySchema = z.object({
  id, name: text, description: text, moraleRestore: z.number().int().min(1).max(30), threshold: bounded(100),
}).strict();
export type CommanderAbilityDefinition = z.infer<typeof commanderAbilitySchema>;

export const CHARACTER_DEFINITIONS: readonly CharacterDefinition[] = [
  { id: 'character.marshal', role: 'marshal', name: 'Hearth marshal', description: 'An appointed field commander. Leads the attached army, rallies shaken formations once per battle, and earns experience from its outcomes.', coinCost: 32, upkeep: 2, leadership: { attack: 1, armor: 0 }, missionIds: [], skillIds: ['skill.steadfast', 'skill.decisive'] },
  { id: 'character.surveyor', role: 'surveyor', name: 'Road witness', description: 'A travelling surveyor who charts terrain from an escorted camp. Surveys preserve geographic knowledge, not the positions of unseen foreign troops.', coinCost: 20, upkeep: 1, leadership: { attack: 0, armor: 0 }, missionIds: ['mission.survey'], skillIds: ['skill.fieldcraft'] },
  { id: 'character.engineer', role: 'engineer', name: 'March engineer', description: 'A field specialist who must travel with an army. Refits replenish real formation losses; siege sabotage trades coin and exposure for damage to defenses.', coinCost: 28, upkeep: 2, leadership: { attack: 0, armor: 0 }, missionIds: ['mission.refit', 'mission.sabotage'], skillIds: ['skill.fieldcraft', 'skill.siegecraft'] },
];
export const CHARACTER_MISSIONS: readonly CharacterMissionDefinition[] = [
  { id: 'mission.survey', kind: 'survey', name: 'Survey the frontier', description: 'Hold the escort in place for two turns to chart terrain within six hexes. Unseen armies remain hidden. Moving or fighting interrupts the work without a refund.', duration: 2, coinCost: 4, experience: 4, radius: 6, strengthRestore: 0, defenseDamage: 0, woundTurns: 0, failureChance: 0 },
  { id: 'mission.refit', kind: 'refit', name: 'Refit the column', description: 'Hold the column for two turns to restore up to five missing strength per formation. Refit cannot exceed a formation’s normal capacity or recreate a destroyed formation.', duration: 2, coinCost: 12, experience: 4, radius: 0, strengthRestore: 5, defenseDamage: 0, woundTurns: 0, failureChance: 0 },
  { id: 'mission.sabotage', kind: 'sabotage', name: 'Undermine the defenses', description: 'Work from the besieging army for two turns. Success removes thirty siege defense; failure wounds the engineer. Relief, peace or displacement interrupts the operation.', duration: 2, coinCost: 10, experience: 6, radius: 0, strengthRestore: 0, defenseDamage: 30, woundTurns: 3, failureChance: 25 },
];
export const CHARACTER_SKILLS: readonly CharacterSkillDefinition[] = [
  { id: 'skill.steadfast', name: 'Keeper of the line', description: 'The marshal’s formations gain one armor; Rally restores five additional morale. This permanent specialization excludes Decisive orders.', roles: ['marshal'], experienceCost: 12, leadership: { attack: 0, armor: 1 }, rallyBonus: 5, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0 },
  { id: 'skill.decisive', name: 'Decisive orders', description: 'The marshal’s formations gain two additional attack. This permanent specialization excludes Keeper of the line.', roles: ['marshal'], experienceCost: 12, leadership: { attack: 2, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0 },
  { id: 'skill.fieldcraft', name: 'Patient fieldcraft', description: 'A surveyor charts one hex farther; an engineer restores two additional strength per formation during refit. Engineers choose this instead of Siege craft.', roles: ['surveyor', 'engineer'], experienceCost: 12, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 1, refitBonus: 2, sabotageRiskReduction: 0 },
  { id: 'skill.siegecraft', name: 'Siege craft', description: 'Careful preparation lowers the risk of a sabotage failure and wounds. Choose this permanent engineering specialization instead of Patient fieldcraft.', roles: ['engineer'], experienceCost: 12, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 15 },
];
export const COMMANDER_ABILITIES: readonly CommanderAbilityDefinition[] = [
  { id: 'ability.rally', name: 'Rally the line', description: 'Once per battle, restore up to twelve morale to the marshal’s surviving formations, capped by their normal morale. Rally does not heal casualties or change the battle’s random stream.', moraleRestore: 12, threshold: 45 },
];

export interface CharacterNamePool { given: readonly string[]; family: readonly string[] }
/** Civic/geographic names follow the four introductory cultures, not borrowed rosters. */
export const CHARACTER_NAMES: Readonly<Record<string, CharacterNamePool>> = {
  'faction.ashen_compact': { given: ['Mera', 'Aven', 'Ressa', 'Tovan', 'Edrin', 'Leth', 'Sella', 'Orven'], family: ['Kilnbound', 'Ashwell', 'Coalstead', 'Oathweft', 'Flint', 'Hearthward', 'Copperspan', 'Roothearth'] },
  'faction.reedbound_council': { given: ['Neri', 'Vessa', 'Talen', 'Ossa', 'Iren', 'Belan', 'Sori', 'Denna'], family: ['Reedwake', 'Mirebank', 'Silt', 'Fordkeeper', 'Willowreach', 'Rushward', 'Lowwater', 'Ferryglass'] },
  'faction.cinder_march': { given: ['Dren', 'Kesta', 'Rovan', 'Venn', 'Arda', 'Hessa', 'Torrel', 'Oska'], family: ['Slagwatch', 'Flintscar', 'Coalridge', 'Emberpost', 'Ironstair', 'Burntfell', 'Blackkiln', 'Redquarry'] },
  'faction.glass_tide': { given: ['Seren', 'Lessa', 'Cerin', 'Vero', 'Ilna', 'Oren', 'Tessa', 'Navel'], family: ['Glasswake', 'Saltcharter', 'Lanternquay', 'Tideledger', 'Stormsill', 'Shoreglass', 'Harborwrit', 'Whitecove'] },
};
export function characterName(factionDefinitionId: string, serial: number): string {
  const pool = CHARACTER_NAMES[factionDefinitionId];
  if (!pool || !Number.isSafeInteger(serial) || serial < 1) throw new Error('Invalid character naming reference or serial.');
  const offset = serial - 1;
  const capacity = pool.given.length * pool.family.length;
  const cycle = Math.floor(offset / capacity);
  return `${pool.given[offset % pool.given.length]} ${pool.family[Math.floor(offset / pool.given.length) % pool.family.length]}${cycle ? ` ${cycle + 1}` : ''}`;
}

export function validateCharacterContent(
  factionIds: ReadonlySet<string>, definitions = CHARACTER_DEFINITIONS,
  missions = CHARACTER_MISSIONS, skills = CHARACTER_SKILLS, abilities = COMMANDER_ABILITIES,
  names = CHARACTER_NAMES,
): void {
  const all = [...definitions, ...missions, ...skills, ...abilities];
  if (new Set(all.map(item => item.id)).size !== all.length) throw new Error('Duplicate character content ID');
  definitions.forEach(item => characterDefinitionSchema.parse(item));
  missions.forEach(item => characterMissionSchema.parse(item));
  skills.forEach(item => characterSkillSchema.parse(item));
  abilities.forEach(item => commanderAbilitySchema.parse(item));
  const missionIds = new Set(missions.map(item => item.id));
  const skillById = new Map(skills.map(item => [item.id, item]));
  for (const definition of definitions) {
    if (new Set(definition.missionIds).size !== definition.missionIds.length || new Set(definition.skillIds).size !== definition.skillIds.length) throw new Error('Duplicate character capability');
    for (const reference of definition.missionIds) if (!missionIds.has(reference)) throw new Error('Unknown character mission: ' + reference);
    for (const reference of definition.skillIds) if (!skillById.get(reference)?.roles.includes(definition.role)) throw new Error('Unknown or incompatible character skill: ' + reference);
  }
  if (!abilities.some(item => item.id === 'ability.rally')) throw new Error('Marshal Rally ability is required');
  const poolSchema = z.object({ given: z.array(z.string().min(1).max(24)).min(2).max(100), family: z.array(z.string().min(1).max(24)).min(2).max(100) }).strict();
  for (const [factionId, pool] of Object.entries(names)) {
    if (!factionIds.has(factionId)) throw new Error('Unknown character naming faction: ' + factionId);
    poolSchema.parse(pool);
    if (new Set(pool.given).size !== pool.given.length || new Set(pool.family).size !== pool.family.length) throw new Error('Duplicate character name fragment');
  }
  for (const factionId of factionIds) if (!names[factionId]) throw new Error('Missing character naming pool: ' + factionId);
}
