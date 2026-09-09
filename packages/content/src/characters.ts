import { z } from 'zod';
import { ADVANCED_CHARACTER_SKILLS } from './development';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const text = z.string().min(1).max(320);
const bounded = (max: number) => z.number().int().min(0).max(max);
export const characterRoleSchema = z.enum(['marshal', 'surveyor', 'engineer', 'waykeeper']);
export type CharacterRole = z.infer<typeof characterRoleSchema>;
const leadership = z.object({ attack: bounded(5), armor: bounded(5) }).strict();
export const characterDefinitionSchema = z.object({
  id, role: characterRoleSchema, name: text, description: text,
  coinCost: bounded(500), upkeep: bounded(20), leadership,
  missionIds: z.array(id).max(8), skillIds: z.array(id).max(8),
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
  requiresAll: z.array(id).max(8), requiresAny: z.array(id).max(8),
  branch: z.enum(['specialization', 'command', 'battlecraft', 'survey', 'engineering']), tier: z.number().int().min(1).max(4),
  exclusiveGroup: z.enum(['marshal_specialization', 'field_specialization']).nullable(), commandCapacityBonus: bounded(4),
  introducedInRules: z.literal(16).optional(),
}).strict();
export type CharacterSkillDefinition = z.infer<typeof characterSkillSchema>;
export const commanderAbilitySchema = z.object({
  id, name: text, description: text, moraleRestore: z.number().int().min(1).max(30), threshold: bounded(100),
}).strict();
export type CommanderAbilityDefinition = z.infer<typeof commanderAbilitySchema>;

export const LEGACY_CHARACTER_DEFINITIONS: readonly CharacterDefinition[] = [
  { id: 'character.marshal', role: 'marshal', name: 'Hearth marshal', description: 'An appointed field commander. Leads the attached army, rallies shaken formations once per battle, and earns experience from its outcomes.', coinCost: 32, upkeep: 2, leadership: { attack: 1, armor: 0 }, missionIds: [], skillIds: ['skill.steadfast', 'skill.decisive', 'skill.muster_rolls', 'skill.field_orders', 'skill.measured_advance', 'skill.unbroken_line'] },
  { id: 'character.surveyor', role: 'surveyor', name: 'Road witness', description: 'A travelling surveyor who charts terrain from an escorted camp. Surveys preserve geographic knowledge, not the positions of unseen foreign troops.', coinCost: 20, upkeep: 1, leadership: { attack: 0, armor: 0 }, missionIds: ['mission.survey'], skillIds: ['skill.fieldcraft', 'skill.horizon_studies'] },
  { id: 'character.engineer', role: 'engineer', name: 'March engineer', description: 'A field specialist who must travel with an army. Refits replenish real formation losses; siege sabotage trades coin and exposure for damage to defenses.', coinCost: 28, upkeep: 2, leadership: { attack: 0, armor: 0 }, missionIds: ['mission.refit', 'mission.sabotage'], skillIds: ['skill.fieldcraft', 'skill.siegecraft', 'skill.column_workshops', 'skill.sapper_watch'] },
  { id: 'character.waykeeper', role: 'waykeeper', name: 'Waykeeper', description: 'A paid travelling practitioner with personal Flame and Rune aptitude. Researched Cinder thread and Bound ward consume limited battle strain. Occupies a companion slot, not an army command.', coinCost: 40, upkeep: 3, leadership: { attack: 0, armor: 0 }, missionIds: [], skillIds: [] },
];
export const CHARACTER_DEFINITIONS: readonly CharacterDefinition[] = LEGACY_CHARACTER_DEFINITIONS.map(definition => ({ ...definition,
  skillIds: [...definition.skillIds, ...ADVANCED_CHARACTER_SKILLS.filter(skill => skill.roles.includes(definition.role)).map(skill => skill.id)],
}));
export const characterDefinitionsForRules = (version: number): readonly CharacterDefinition[] => version >= 16 ? CHARACTER_DEFINITIONS : LEGACY_CHARACTER_DEFINITIONS;
export const CHARACTER_MISSIONS: readonly CharacterMissionDefinition[] = [
  { id: 'mission.survey', kind: 'survey', name: 'Survey the frontier', description: 'Hold the escort in place for two turns to chart terrain within six hexes. Unseen armies remain hidden. Moving or fighting interrupts the work without a refund.', duration: 2, coinCost: 4, experience: 4, radius: 6, strengthRestore: 0, defenseDamage: 0, woundTurns: 0, failureChance: 0 },
  { id: 'mission.refit', kind: 'refit', name: 'Refit the column', description: 'Hold the column for two turns to restore up to five missing strength per formation. Refit cannot exceed a formation’s normal capacity or recreate a destroyed formation.', duration: 2, coinCost: 12, experience: 4, radius: 0, strengthRestore: 5, defenseDamage: 0, woundTurns: 0, failureChance: 0 },
  { id: 'mission.sabotage', kind: 'sabotage', name: 'Undermine the defenses', description: 'Work from the besieging army for two turns. Success removes thirty siege defense; failure wounds the engineer. Relief, peace or displacement interrupts the operation.', duration: 2, coinCost: 10, experience: 6, radius: 0, strengthRestore: 0, defenseDamage: 30, woundTurns: 3, failureChance: 25 },
];
const originalSkills = [
  { id: 'skill.steadfast', name: 'Keeper of the line', description: 'The marshal’s formations gain one armor; Rally restores five additional morale. This permanent specialization excludes Decisive orders.', roles: ['marshal'], experienceCost: 12, leadership: { attack: 0, armor: 1 }, rallyBonus: 5, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0 },
  { id: 'skill.decisive', name: 'Decisive orders', description: 'The marshal’s formations gain two additional attack. This permanent specialization excludes Keeper of the line.', roles: ['marshal'], experienceCost: 12, leadership: { attack: 2, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0 },
  { id: 'skill.fieldcraft', name: 'Patient fieldcraft', description: 'A surveyor charts one hex farther; an engineer restores two additional strength per formation during refit. Engineers choose this instead of Siege craft.', roles: ['surveyor', 'engineer'], experienceCost: 12, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 1, refitBonus: 2, sabotageRiskReduction: 0 },
  { id: 'skill.siegecraft', name: 'Siege craft', description: 'Careful preparation lowers the risk of a sabotage failure and wounds. Choose this permanent engineering specialization instead of Patient fieldcraft.', roles: ['engineer'], experienceCost: 12, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 15 },
] as const;
export const CHARACTER_SKILLS: readonly CharacterSkillDefinition[] = [
  ...originalSkills.map((skill): CharacterSkillDefinition => ({ ...skill, roles: [...skill.roles], requiresAll: [], requiresAny: [], branch: 'specialization', tier: 1, exclusiveGroup: skill.roles.some(role => role === 'marshal') ? 'marshal_specialization' : 'field_specialization', commandCapacityBonus: 0 })),
  { id: 'skill.muster_rolls', name: 'Muster rolls', description: 'Organized formation officers raise this healthy marshal’s command capacity from sixteen to eighteen. Compatible with either specialization and its battlecraft branch.', roles: ['marshal'], experienceCost: 18, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0, requiresAll: [], requiresAny: ['skill.steadfast', 'skill.decisive'], branch: 'command', tier: 2, exclusiveGroup: null, commandCapacityBonus: 2 },
  { id: 'skill.field_orders', name: 'Field orders', description: 'A practiced chain of officers raises this healthy marshal’s command capacity from eighteen to twenty formations. The command remains vulnerable to the marshal’s wounds or absence.', roles: ['marshal'], experienceCost: 24, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0, requiresAll: ['skill.muster_rolls'], requiresAny: [], branch: 'command', tier: 3, exclusiveGroup: null, commandCapacityBonus: 2 },
  { id: 'skill.measured_advance', name: 'Measured advance', description: 'Build on Decisive orders: every formation under this healthy marshal gains one more attack. This battlecraft branch can be learned alongside command expansion.', roles: ['marshal'], experienceCost: 18, leadership: { attack: 1, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0, requiresAll: ['skill.decisive'], requiresAny: [], branch: 'battlecraft', tier: 2, exclusiveGroup: null, commandCapacityBonus: 0 },
  { id: 'skill.unbroken_line', name: 'Unbroken line', description: 'Build on Keeper of the line: every formation under this healthy marshal gains one more armor. This battlecraft branch can be learned alongside command expansion.', roles: ['marshal'], experienceCost: 18, leadership: { attack: 0, armor: 1 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0, requiresAll: ['skill.steadfast'], requiresAny: [], branch: 'battlecraft', tier: 2, exclusiveGroup: null, commandCapacityBonus: 0 },
  { id: 'skill.horizon_studies', name: 'Horizon studies', description: 'A practiced Road witness extends Patient fieldcraft by another hex, charting terrain within eight hexes. Hidden armies are still not revealed.', roles: ['surveyor'], experienceCost: 18, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 1, refitBonus: 0, sabotageRiskReduction: 0, requiresAll: ['skill.fieldcraft'], requiresAny: [], branch: 'survey', tier: 2, exclusiveGroup: null, commandCapacityBonus: 0 },
  { id: 'skill.column_workshops', name: 'Column workshops', description: 'Build on Patient fieldcraft: organized repair parties restore three additional missing strength per formation, for ten in a completed refit. Lost formations cannot be recreated.', roles: ['engineer'], experienceCost: 18, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 3, sabotageRiskReduction: 0, requiresAll: ['skill.fieldcraft'], requiresAny: [], branch: 'engineering', tier: 2, exclusiveGroup: null, commandCapacityBonus: 0 },
  { id: 'skill.sapper_watch', name: 'Sapper watch', description: 'Build on Siege craft: guarded working parties remove the remaining ten percentage points of sabotage-failure risk. Enemy relief or displacement can still interrupt the operation.', roles: ['engineer'], experienceCost: 18, leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 10, requiresAll: ['skill.siegecraft'], requiresAny: [], branch: 'engineering', tier: 2, exclusiveGroup: null, commandCapacityBonus: 0 },
  ...ADVANCED_CHARACTER_SKILLS,
];
export const characterSkillsForRules = (version: number): readonly CharacterSkillDefinition[] => CHARACTER_SKILLS.filter(skill => (skill.introducedInRules ?? (skill.exclusiveGroup ? 7 : 8)) <= version);
export const COMMANDER_ABILITIES: readonly CommanderAbilityDefinition[] = [
  { id: 'ability.rally', name: 'Rally the line', description: 'Once per battle, restore up to twelve morale to the marshal’s surviving formations, capped by their normal morale. Rally does not heal casualties or change the battle’s random stream.', moraleRestore: 12, threshold: 45 },
];

export interface CharacterNamePool { given: readonly string[]; family: readonly string[] }
/** Civic/geographic pools preserve the original six cultures and name each new tradition independently. */
export const CHARACTER_NAMES: Readonly<Record<string, CharacterNamePool>> = {
  'faction.ashen_compact': { given: ['Mera', 'Aven', 'Ressa', 'Tovan', 'Edrin', 'Leth', 'Sella', 'Orven'], family: ['Kilnbound', 'Ashwell', 'Coalstead', 'Oathweft', 'Flint', 'Hearthward', 'Copperspan', 'Roothearth'] },
  'faction.reedbound_council': { given: ['Neri', 'Vessa', 'Talen', 'Ossa', 'Iren', 'Belan', 'Sori', 'Denna'], family: ['Reedwake', 'Mirebank', 'Silt', 'Fordkeeper', 'Willowreach', 'Rushward', 'Lowwater', 'Ferryglass'] },
  'faction.cinder_march': { given: ['Dren', 'Kesta', 'Rovan', 'Venn', 'Arda', 'Hessa', 'Torrel', 'Oska'], family: ['Slagwatch', 'Flintscar', 'Coalridge', 'Emberpost', 'Ironstair', 'Burntfell', 'Blackkiln', 'Redquarry'] },
  'faction.glass_tide': { given: ['Seren', 'Lessa', 'Cerin', 'Vero', 'Ilna', 'Oren', 'Tessa', 'Navel'], family: ['Glasswake', 'Saltcharter', 'Lanternquay', 'Tideledger', 'Stormsill', 'Shoreglass', 'Harborwrit', 'Whitecove'] },
  'faction.iron_covenant': { given: ['Dova', 'Bren', 'Hedra', 'Olek', 'Marn', 'Vedra', 'Korin', 'Sava'], family: ['Anvilward', 'Seamkeeper', 'Deepmeasure', 'Kilnseal', 'Stonebrace', 'Passiron', 'Forgeledger', 'Valleybond'] },
  'faction.sepulchral_synod': { given: ['Erel', 'Naia', 'Sethra', 'Oris', 'Vela', 'Thalen', 'Merin', 'Ista'], family: ['Chalkseal', 'Terraceward', 'Boneledger', 'Quietgrain', 'Ninthstep', 'Drywell', 'Veilmark', 'Lastmeasure'] },
  'faction.mire_courts': { given: ['Orell', 'Nethra', 'Velune', 'Issel', 'Maroe', 'Thessa', 'Ulen', 'Enneth'], family: ['Stillbough', 'Seasonroot', 'Fenmantle', 'Lilycourt', 'Mossbell', 'Duskpool', 'Alderveil', 'Deepfrond'] },
  'faction.saltwind_remnant': { given: ['Alda', 'Cerrel', 'Nessa', 'Veylan', 'Odris', 'Evara', 'Tallis', 'Illa'], family: ['Keelwrit', 'Outerwake', 'Pledgesail', 'Ropemeasure', 'Soundingmark', 'Seacounter', 'Weatherbond', 'Anchorheir'] },
  'faction.wardhall_remnant': { given: ['Hadran', 'Elwen', 'Marden', 'Reva', 'Teren', 'Odra', 'Selwin', 'Brenna'], family: ['Plainsward', 'Linewright', 'Reachstone', 'Hallmeasure', 'Surveybar', 'Bracekeeper', 'Gatecourse', 'Levelmark'] },
  'faction.rimehorn_clans': { given: ['Ruva', 'Torrin', 'Kelda', 'Varek', 'Olva', 'Hedrin', 'Norna', 'Sivren'], family: ['Rimeledge', 'Hornkeeper', 'Snowbeam', 'Shelterstone', 'Coldhearth', 'Tundrafold', 'Hightallow', 'Wintershare'] },
  'faction.sable_steppe': { given: ['Saren', 'Ivara', 'Odan', 'Rilka', 'Tamar', 'Veshi', 'Alen', 'Kora'], family: ['Grassknot', 'Farbridle', 'Campward', 'Duskrein', 'Openmile', 'Grazingmark', 'Saddlewrit', 'Windtether'] },
  'faction.morrow_spore': { given: ['Melli', 'Ovenna', 'Issa', 'Nelun', 'Vaeri', 'Somen', 'Erla', 'Tavvi'], family: ['Threadgrove', 'Morrowcap', 'Loamkeeper', 'Rootwitness', 'Sporeweft', 'Underleaf', 'Fallenbough', 'Ringmemory'] },
  'faction.cistern_assembly': { given: ['Demin', 'Alta', 'Emin', 'Tavia', 'Ludo', 'Ilara', 'Numa', 'Sadin'], family: ['Thirdmeasure', 'Sillkeeper', 'Drawcord', 'Lidstone', 'Basinstep', 'Shadewell', 'Jarreader', 'Chalkspout'] },
  'faction.unsealed_companies': { given: ['Berr', 'Sova', 'Jerrin', 'Hask', 'Nolda', 'Rudda', 'Perr', 'Avik'], family: ['Oncepaid', 'Rollkeeper', 'Termend', 'Wagonvote', 'Openseal', 'Canvasmend', 'Roadwage', 'Lastreceipt'] },
  'faction.lantern_hospices': { given: ['Enna', 'Tovel', 'Sunea', 'Miren', 'Pela', 'Ansel', 'Dovi', 'Elia'], family: ['Wickward', 'Cleanstep', 'Linencourt', 'Lamprest', 'Doorplace', 'Quietcot', 'Bluewash', 'Shuttertend'] },
  'faction.cairnwing_concord': { given: ['Kirr', 'Sevet', 'Tekk', 'Avrit', 'Kessi', 'Rekk', 'Iset', 'Vekri'], family: ['Lowbracket', 'Redledge', 'Liftcord', 'Screestep', 'Upperstay', 'Windbolt', 'Cairnspan', 'Landingbrace'] },
  'faction.red_sluice': { given: ['Pella', 'Rusk', 'Daska', 'Verrit', 'Orda', 'Gessin', 'Tekla', 'Padrin'], family: ['Gatefive', 'Barwright', 'Chaincourse', 'Spillreader', 'Bankgauge', 'Wheeltend', 'Sluicetally', 'Lowerreach'] },
  'faction.velvet_meridian': { given: ['Aveline', 'Orel', 'Celune', 'Ivelle', 'Lorian', 'Nevane', 'Amiel', 'Sereva'], family: ['Hemscale', 'Pendline', 'Nightstitch', 'Plumbweft', 'Skyinterval', 'Discweight', 'Veilthread', 'Roundmeasure'] },
  'faction.brine_choir': { given: ['Olumi', 'Dessa', 'Aruva', 'Omeli', 'Ussa', 'Lumeo', 'Yali', 'Dosani'], family: ['Poolmouth', 'Ringlow', 'Shoreanswer', 'Shellinterval', 'Eelgrass', 'Covevoice', 'Ripplebreak', 'Quayreply'] },
  'faction.emberwake_convocation': { given: ['Isca', 'Toren', 'Pava', 'Neris', 'Udel', 'Senna', 'Jorin', 'Asel'], family: ['Seedwheel', 'Claybreath', 'Burnaccount', 'Jarwake', 'Ventkeeper', 'Firebreak', 'Fallowproof', 'Safekiln'] },
  'faction.underhush_exchange': { given: ['Demm', 'Luva', 'Udden', 'Pemm', 'Otta', 'Besk', 'Nummi', 'Tulla'], family: ['Softcut', 'Neararch', 'Ventlease', 'Stillfitting', 'Touchmark', 'Quietjoint', 'Lowtally', 'Smokeclause'] },
  'faction.vesper_court': { given: ['Veyra', 'Dellan', 'Lysene', 'Corvin', 'Ismera', 'Valeth', 'Nerelle', 'Osvan'], family: ['Closedglass', 'Redshutter', 'Duskvessel', 'Slatewalk', 'Vineward', 'Silverlintel', 'Lastguest', 'Garnetbound'] },
  'faction.manytrack_moot': { given: ['Venn', 'Seli', 'Haren', 'Mova', 'Endri', 'Keli', 'Uvan', 'Rali'], family: ['Broadpath', 'Reedstride', 'Boughmeeting', 'Crosscord', 'Widearch', 'Fieldhearing', 'Openfork', 'Trailshare'] },
  'faction.margin_observance': { given: ['Edda', 'Ravel', 'Imren', 'Nella', 'Tavin', 'Edrel', 'Pera', 'Soval'], family: ['Foldmark', 'Lastmargin', 'Blankbracket', 'Pagecondition', 'Gapkeeper', 'Copyline', 'Leadcase', 'Ashfolio'] },
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
  for (const skill of skills) {
    const references = [...skill.requiresAll, ...skill.requiresAny];
    if (new Set(references).size !== references.length) throw new Error('Duplicate character skill prerequisite');
    for (const reference of references) {
      const prerequisite = skillById.get(reference);
      if (!prerequisite || !skill.roles.every(role => prerequisite.roles.includes(role)) || prerequisite.tier >= skill.tier) throw new Error('Unknown, incompatible or cyclic character skill prerequisite');
    }
    if (skill.exclusiveGroup && references.length || !skill.exclusiveGroup && !references.length) throw new Error('Character tree roots must be specializations and later nodes require prerequisites');
    if (skill.commandCapacityBonus && !skill.roles.every(role => role === 'marshal')) throw new Error('Only marshals can expand command capacity');
  }
  for (const definition of definitions) {
    if (new Set(definition.missionIds).size !== definition.missionIds.length || new Set(definition.skillIds).size !== definition.skillIds.length) throw new Error('Duplicate character capability');
    for (const reference of definition.missionIds) if (!missionIds.has(reference)) throw new Error('Unknown character mission: ' + reference);
    for (const reference of definition.skillIds) if (!skillById.get(reference)?.roles.includes(definition.role)) throw new Error('Unknown or incompatible character skill: ' + reference);
    const available = definition.skillIds.map(id => skillById.get(id)!);
    const reachable = new Set<string>();
    for (const root of available.filter(skill => skill.exclusiveGroup)) {
      const branch = new Set([root.id]);
      for (const skill of [...available].sort((a, b) => a.tier - b.tier)) if (!skill.exclusiveGroup && skill.requiresAll.every(id => branch.has(id)) && (!skill.requiresAny.length || skill.requiresAny.some(id => branch.has(id)))) branch.add(skill.id);
      for (const id of branch) reachable.add(id);
    }
    if (available.some(skill => !reachable.has(skill.id))) throw new Error('Unreachable character skill: unavailable prerequisites or mutually exclusive specializations');
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
