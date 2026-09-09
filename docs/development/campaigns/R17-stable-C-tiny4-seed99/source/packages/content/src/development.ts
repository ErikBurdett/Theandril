import { z } from 'zod';
import type { CharacterSkillDefinition } from './characters';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const amount = z.number().int().min(0).max(1000);
const bonus = z.number().int().min(0).max(20);
export const developmentScopeSchema = z.enum(['formation', 'hearth', 'faction']);
export type DevelopmentScope = z.infer<typeof developmentScopeSchema>;
export const developmentEffectsSchema = z.object({
  food: bonus, industry: bonus, coin: bonus, knowledge: bonus,
  attack: bonus, armor: bonus, initiative: bonus, range: bonus, morale: bonus,
}).strict();
export type DevelopmentEffects = z.infer<typeof developmentEffectsSchema>;
export const developmentNodeSchema = z.object({
  id, scope: developmentScopeSchema, name: z.string().min(1).max(80), description: z.string().min(1).max(420),
  branch: z.string().min(1).max(50), tier: z.number().int().min(1).max(4),
  coinCost: amount, progressCost: amount, upkeep: z.number().int().min(0).max(10),
  resourceCosts: z.record(id, z.number().int().min(1).max(6)).optional(),
  requiresAll: z.array(id).max(8), requiresAny: z.array(id).max(8), exclusiveGroup: z.string().min(1).max(50).nullable(),
  requiredBuildings: z.array(id).max(5), requiredTechnologies: z.array(id).max(5),
  requiredInstitution: id.nullable(), requiredDoctrine: id.nullable(),
  minimumPopulation: z.number().int().min(0).max(20), minimumRange: z.number().int().min(0).max(4),
  effects: developmentEffectsSchema,
}).strict();
export type DevelopmentNode = z.infer<typeof developmentNodeSchema>;
export const EMPTY_DEVELOPMENT_EFFECTS: Readonly<DevelopmentEffects> = { food: 0, industry: 0, coin: 0, knowledge: 0, attack: 0, armor: 0, initiative: 0, range: 0, morale: 0 };
type NodeInput = Pick<DevelopmentNode, 'id' | 'scope' | 'name' | 'description' | 'branch' | 'tier' | 'coinCost' | 'progressCost'>
  & Partial<Omit<DevelopmentNode, 'effects'>> & { effects: Partial<DevelopmentEffects> };
const node = (input: NodeInput): DevelopmentNode => ({ upkeep: 0, requiresAll: [], requiresAny: [], exclusiveGroup: null,
  requiredBuildings: [], requiredTechnologies: [], requiredInstitution: null, requiredDoctrine: null, minimumPopulation: 0, minimumRange: 0,
  ...input, effects: { ...EMPTY_DEVELOPMENT_EFFECTS, ...input.effects } });

const materialCosts: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'training.breakthrough': { 'resource.iron': 4, 'resource.grain': 2 },
  'training.held_line': { 'resource.iron': 4, 'resource.timber': 3 },
  'training.countershot': { 'resource.copper': 3, 'resource.timber': 3 },
  'training.veteran_service': { 'resource.silver': 2, 'resource.salt': 2 },
  'hearth.granary_rotations': { 'resource.grain': 4, 'resource.salt': 2 },
  'hearth.seed_exchange': { 'resource.horses': 2, 'resource.grain': 6 },
  'hearth.kiln_guilds': { 'resource.iron': 3, 'resource.copper': 2 },
  'hearth.master_workyards': { 'resource.iron': 6, 'resource.ashglass': 2 },
  'hearth.charter_ledger': { 'resource.silver': 2, 'resource.ashglass': 2 },
  'hearth.exchange_quarter': { 'resource.horses': 3, 'resource.silver': 4 },
  'tradition.harvest_councils': { 'resource.grain': 4, 'resource.salt': 2 },
  'tradition.itinerant_courts': { 'resource.horses': 4, 'resource.silver': 3 },
  'tradition.standing_reserve': { 'resource.iron': 6, 'resource.grain': 6 },
  'tradition.disciplined_momentum': { 'resource.horses': 6, 'resource.copper': 2 },
};
const withMaterials = (item: DevelopmentNode): DevelopmentNode => materialCosts[item.id] ? { ...item, resourceCosts: { ...materialCosts[item.id] } } : item;

/** Persistent companies spend earned battle experience, never a commander's experience. */
export const FORMATION_TRAINING: readonly DevelopmentNode[] = [
  node({ id: 'training.field_habits', scope: 'formation', name: 'Field habits', description: 'The surviving company learns to hold formation under pressure. Adds 4 battle morale; training does not replace casualties or restore movement.', branch: 'Service', tier: 1, coinCost: 8, progressCost: 3, effects: { morale: 4 } }),
  node({ id: 'training.pressure_drill', scope: 'formation', name: 'Pressure drill', description: 'Practice committing a line at the decisive moment. Adds 2 attack. Permanently chooses Assault over Line and Missile training.', branch: 'Assault', tier: 2, coinCost: 16, progressCost: 5, requiresAll: ['training.field_habits'], exclusiveGroup: 'company_method', effects: { attack: 2 } }),
  node({ id: 'training.breakthrough', scope: 'formation', name: 'Breach timing', description: 'Veterans recognize the instant a formation gives ground. Adds 3 attack and 1 initiative.', branch: 'Assault', tier: 3, coinCost: 28, progressCost: 8, requiresAll: ['training.pressure_drill'], upkeep: 1, effects: { attack: 3, initiative: 1 } }),
  node({ id: 'training.shield_partners', scope: 'formation', name: 'Covering partners', description: 'Pairs learn to shelter each other through a long engagement. Adds 1 armor. Permanently chooses Line over Assault and Missile training.', branch: 'Line', tier: 2, coinCost: 16, progressCost: 5, requiresAll: ['training.field_habits'], exclusiveGroup: 'company_method', effects: { armor: 1 } }),
  node({ id: 'training.held_line', scope: 'formation', name: 'Held line', description: 'A company with shared battle memory keeps its ranks intact. Adds 2 armor and 4 battle morale.', branch: 'Line', tier: 3, coinCost: 28, progressCost: 8, requiresAll: ['training.shield_partners'], upkeep: 1, effects: { armor: 2, morale: 4 } }),
  node({ id: 'training.measured_sights', scope: 'formation', name: 'Measured sights', description: 'A formation with a ranged weapon learns to act before an opening closes. Adds 2 initiative. Permanently chooses Missile over Assault and Line training.', branch: 'Missile', tier: 2, coinCost: 16, progressCost: 5, requiresAll: ['training.field_habits'], exclusiveGroup: 'company_method', minimumRange: 1, effects: { initiative: 2 } }),
  node({ id: 'training.countershot', scope: 'formation', name: 'Countershot', description: 'Experienced crews coordinate covering fire. Adds 1 range and 1 attack to an already ranged formation.', branch: 'Missile', tier: 3, coinCost: 28, progressCost: 8, requiresAll: ['training.measured_sights'], minimumRange: 1, upkeep: 1, effects: { range: 1, attack: 1 } }),
  node({ id: 'training.veteran_service', scope: 'formation', name: 'Witnessed service', description: 'A tested company maintains its own veteran cadre. Adds 6 battle morale and 1 armor after completing any training branch.', branch: 'Service', tier: 4, coinCost: 36, progressCost: 12, requiresAny: ['training.breakthrough', 'training.held_line', 'training.countershot'], upkeep: 1, effects: { morale: 6, armor: 1 } }),
].map(withMaterials);

/** Local civic work is earned at this hearth. Advanced specializations compete;
 * inherited development remains attached to the hearth through conquest. */
export const HEARTH_DEVELOPMENTS: readonly DevelopmentNode[] = [
  node({ id: 'hearth.common_store', scope: 'hearth', name: 'Common store', description: 'Put the root cellar under a witnessed rotation of local households. Adds 2 food before ordinary town penalties.', branch: 'Provisions', tier: 1, coinCost: 24, progressCost: 4, requiredBuildings: ['building.granary'], minimumPopulation: 2, upkeep: 1, effects: { food: 2 } }),
  node({ id: 'hearth.granary_rotations', scope: 'hearth', name: 'Granary rotations', description: 'Specialize the hearth in dependable provisions. Adds 3 food; permanently excludes advanced Craft and Commerce specializations.', branch: 'Provisions', tier: 2, coinCost: 42, progressCost: 8, requiresAll: ['hearth.common_store'], requiredBuildings: ['building.granary'], minimumPopulation: 4, exclusiveGroup: 'hearth_specialization', upkeep: 1, effects: { food: 3 } }),
  node({ id: 'hearth.seed_exchange', scope: 'hearth', name: 'Seed exchange', description: 'A city exchanges seed records and reserve stores through its market. Adds 4 food and 1 knowledge.', branch: 'Provisions', tier: 3, coinCost: 70, progressCost: 14, requiresAll: ['hearth.granary_rotations'], requiredBuildings: ['building.granary', 'building.market'], minimumPopulation: 8, upkeep: 2, effects: { food: 4, knowledge: 1 } }),
  node({ id: 'hearth.craft_courts', scope: 'hearth', name: 'Craft courts', description: 'Give working crews a common place to settle tools, measurements and apprenticeships. Adds 2 industry.', branch: 'Craft', tier: 1, coinCost: 28, progressCost: 4, requiredBuildings: ['building.workshop'], minimumPopulation: 3, upkeep: 1, effects: { industry: 2 } }),
  node({ id: 'hearth.kiln_guilds', scope: 'hearth', name: 'Kiln guilds', description: 'Specialize the hearth in coordinated production. Adds 3 industry and 1 coin; permanently excludes advanced Provisions and Commerce specializations.', branch: 'Craft', tier: 2, coinCost: 46, progressCost: 8, requiresAll: ['hearth.craft_courts'], requiredBuildings: ['building.workshop'], minimumPopulation: 5, exclusiveGroup: 'hearth_specialization', upkeep: 2, effects: { industry: 3, coin: 1 } }),
  node({ id: 'hearth.master_workyards', scope: 'hearth', name: 'Master workyards', description: 'A city records skilled practice beside its working furnaces. Adds 4 industry and 2 knowledge.', branch: 'Craft', tier: 3, coinCost: 80, progressCost: 14, requiresAll: ['hearth.kiln_guilds'], requiredBuildings: ['building.workshop', 'building.archive'], minimumPopulation: 8, upkeep: 3, effects: { industry: 4, knowledge: 2 } }),
  node({ id: 'hearth.witness_counter', scope: 'hearth', name: 'Witness counter', description: 'Keep a public counter for the market’s obligations and payments. Adds 3 coin.', branch: 'Commerce', tier: 1, coinCost: 28, progressCost: 4, requiredBuildings: ['building.market'], minimumPopulation: 3, upkeep: 1, effects: { coin: 3 } }),
  node({ id: 'hearth.charter_ledger', scope: 'hearth', name: 'Charter ledger', description: 'Specialize the hearth in recorded exchange. Adds 3 coin and 2 knowledge; permanently excludes advanced Provisions and Craft specializations.', branch: 'Commerce', tier: 2, coinCost: 46, progressCost: 8, requiresAll: ['hearth.witness_counter'], requiredBuildings: ['building.market', 'building.archive'], minimumPopulation: 5, exclusiveGroup: 'hearth_specialization', upkeep: 2, effects: { coin: 3, knowledge: 2 } }),
  node({ id: 'hearth.exchange_quarter', scope: 'hearth', name: 'Exchange quarter', description: 'Witness houses and market courts sustain a city’s permanent exchange district. Adds 5 coin and 3 knowledge.', branch: 'Commerce', tier: 3, coinCost: 80, progressCost: 14, requiresAll: ['hearth.charter_ledger'], requiredBuildings: ['building.market', 'building.archive'], minimumPopulation: 8, upkeep: 3, effects: { coin: 5, knowledge: 3 } }),
].map(withMaterials);

/** Influence supports institutions and military customs; it never substitutes
 * for technology knowledge or an individual caster's personal aptitude. */
export const FACTION_TRADITIONS: readonly DevelopmentNode[] = [
  node({ id: 'tradition.store_pledges', scope: 'faction', name: 'Store pledges', description: 'Extend Common stewardship through reciprocal reserve obligations. Every hearth gains 2 food before local penalties.', branch: 'Common stewardship', tier: 1, coinCost: 60, progressCost: 6, requiredInstitution: 'institution.common_stewardship', upkeep: 2, effects: { food: 2 } }),
  node({ id: 'tradition.harvest_councils', scope: 'faction', name: 'Harvest councils', description: 'Local stewards coordinate planting and shared repairs. Every hearth gains 2 food and 1 industry.', branch: 'Common stewardship', tier: 2, coinCost: 120, progressCost: 12, requiresAll: ['tradition.store_pledges'], requiredInstitution: 'institution.common_stewardship', upkeep: 3, effects: { food: 2, industry: 1 } }),
  node({ id: 'tradition.open_ledgers', scope: 'faction', name: 'Open ledgers', description: 'Extend the Charter compact with records that can travel between markets. Every hearth gains 2 coin and 1 knowledge.', branch: 'Charter compact', tier: 1, coinCost: 60, progressCost: 6, requiredInstitution: 'institution.charter_compact', upkeep: 2, effects: { coin: 2, knowledge: 1 } }),
  node({ id: 'tradition.itinerant_courts', scope: 'faction', name: 'Itinerant courts', description: 'Travelling witnesses settle obligations across the realm. Every hearth gains 2 coin and 1 industry.', branch: 'Charter compact', tier: 2, coinCost: 120, progressCost: 12, requiresAll: ['tradition.open_ledgers'], requiredInstitution: 'institution.charter_compact', upkeep: 3, effects: { coin: 2, industry: 1 } }),
  node({ id: 'tradition.watched_ranks', scope: 'faction', name: 'Watched ranks', description: 'Carry Shield cohesion into an established system of mutual watches. Every fighting formation gains 1 armor and 4 battle morale.', branch: 'Shield cohesion', tier: 1, coinCost: 60, progressCost: 6, requiredDoctrine: 'doctrine.shield_cohesion', upkeep: 2, effects: { armor: 1, morale: 4 } }),
  node({ id: 'tradition.standing_reserve', scope: 'faction', name: 'Standing reserve', description: 'Keep trained replacements and reserve equipment ready for the line. Every fighting formation gains 1 armor and 1 attack; this does not heal existing losses.', branch: 'Shield cohesion', tier: 2, coinCost: 120, progressCost: 12, requiresAll: ['tradition.watched_ranks'], requiredDoctrine: 'doctrine.shield_cohesion', upkeep: 3, effects: { armor: 1, attack: 1 } }),
  node({ id: 'tradition.dispatch_cells', scope: 'faction', name: 'Dispatch cells', description: 'Extend March columns with compact groups trained to pass orders. Every fighting formation gains 2 initiative.', branch: 'March columns', tier: 1, coinCost: 60, progressCost: 6, requiredDoctrine: 'doctrine.march_columns', upkeep: 2, effects: { initiative: 2 } }),
  node({ id: 'tradition.disciplined_momentum', scope: 'faction', name: 'Disciplined momentum', description: 'A moving column keeps enough order to strike together. Every fighting formation gains 2 attack and 4 battle morale.', branch: 'March columns', tier: 2, coinCost: 120, progressCost: 12, requiresAll: ['tradition.dispatch_cells'], requiredDoctrine: 'doctrine.march_columns', upkeep: 3, effects: { attack: 2, morale: 4 } }),
].map(withMaterials);
export const DEVELOPMENT_NODES: readonly DevelopmentNode[] = [...FORMATION_TRAINING, ...HEARTH_DEVELOPMENTS, ...FACTION_TRADITIONS];

const advancedSkill = (input: Pick<CharacterSkillDefinition, 'id' | 'name' | 'description' | 'roles' | 'experienceCost' | 'requiresAll' | 'branch' | 'tier'> & Partial<CharacterSkillDefinition>): CharacterSkillDefinition => ({
  leadership: { attack: 0, armor: 0 }, rallyBonus: 0, surveyRadiusBonus: 0, refitBonus: 0, sabotageRiskReduction: 0,
  requiresAny: [], exclusiveGroup: null, commandCapacityBonus: 0, introducedInRules: 16, ...input,
});
export const ADVANCED_CHARACTER_SKILLS: readonly CharacterSkillDefinition[] = [
  advancedSkill({ id: 'skill.witnessed_assault', name: 'Witnessed assault', description: 'Build on Measured advance: the marshal adds 1 attack and restores 2 more morale with Rally.', roles: ['marshal'], experienceCost: 24, requiresAll: ['skill.measured_advance'], branch: 'battlecraft', tier: 3, leadership: { attack: 1, armor: 0 }, rallyBonus: 2 }),
  advancedSkill({ id: 'skill.last_standard', name: 'Last standard', description: 'Build on Unbroken line: the marshal adds 1 armor and restores 3 more morale with Rally.', roles: ['marshal'], experienceCost: 24, requiresAll: ['skill.unbroken_line'], branch: 'battlecraft', tier: 3, leadership: { attack: 0, armor: 1 }, rallyBonus: 3 }),
  advancedSkill({ id: 'skill.route_memory', name: 'Route memory', description: 'Extend Horizon studies with an additional hex of actual survey reach. Unseen armies remain hidden.', roles: ['surveyor'], experienceCost: 24, requiresAll: ['skill.horizon_studies'], branch: 'survey', tier: 3, surveyRadiusBonus: 1 }),
  advancedSkill({ id: 'skill.far_witness', name: 'Far witness', description: 'The surveyor reads the distant ground through recorded journeys. Adds one further hex to survey missions.', roles: ['surveyor'], experienceCost: 32, requiresAll: ['skill.route_memory'], branch: 'survey', tier: 4, surveyRadiusBonus: 1 }),
  advancedSkill({ id: 'skill.traveling_arsenal', name: 'Travelling arsenal', description: 'Develop Column workshops into a travelling stores practice. Refit restores 4 more missing strength per surviving formation; destroyed units stay destroyed.', roles: ['engineer'], experienceCost: 24, requiresAll: ['skill.column_workshops'], branch: 'engineering', tier: 3, refitBonus: 4 }),
  advancedSkill({ id: 'skill.breach_accounts', name: 'Breach accounts', description: 'Apply Sapper watch to the survival of the siege column. The engineer adds 1 armor to the escorted formations.', roles: ['engineer'], experienceCost: 24, requiresAll: ['skill.sapper_watch'], branch: 'engineering', tier: 3, leadership: { attack: 0, armor: 1 } }),
];

export interface DevelopmentReferences { buildings: ReadonlySet<string>; technologies: ReadonlySet<string>; institutions: ReadonlySet<string>; doctrines: ReadonlySet<string>; resources?: ReadonlySet<string> }
export function validateDevelopmentContent(references: DevelopmentReferences, nodes = DEVELOPMENT_NODES): void {
  const byId = new Map(nodes.map(item => [item.id, item]));
  if (byId.size !== nodes.length) throw new Error('Duplicate development node ID.');
  for (const item of nodes) {
    developmentNodeSchema.parse(item);
    if (!item.progressCost || !item.coinCost || !Object.values(item.effects).some(Boolean)) throw new Error('Development needs a paid cost and a real effect: ' + item.id);
    const parents = [...item.requiresAll, ...item.requiresAny];
    if (new Set(parents).size !== parents.length) throw new Error('Duplicate development prerequisite: ' + item.id);
    for (const parentId of parents) {
      const parent = byId.get(parentId);
      if (!parent || parent.scope !== item.scope || parent.tier >= item.tier) throw new Error('Unknown, incompatible or cyclic development prerequisite: ' + item.id);
    }
    for (const [ids, available] of [[item.requiredBuildings, references.buildings], [item.requiredTechnologies, references.technologies]] as const) {
      if (new Set(ids).size !== ids.length || ids.some(required => !available.has(required))) throw new Error('Unknown or duplicate development requirement: ' + item.id);
    }
    if (item.requiredInstitution && !references.institutions.has(item.requiredInstitution) || item.requiredDoctrine && !references.doctrines.has(item.requiredDoctrine)) throw new Error('Unknown development policy: ' + item.id);
    if (references.resources && Object.keys(item.resourceCosts ?? {}).some(id => !references.resources!.has(id))) throw new Error('Unknown development material: ' + item.id);
    if (item.scope !== 'hearth' && (item.minimumPopulation || item.requiredBuildings.length) || item.scope !== 'formation' && item.minimumRange) throw new Error('Development requirement belongs to a different entity: ' + item.id);
    if (item.scope === 'formation' && ['food', 'industry', 'coin', 'knowledge'].some(key => item.effects[key as keyof DevelopmentEffects])) throw new Error('A formation cannot invent settlement yields: ' + item.id);
    if (item.scope === 'hearth' && ['attack', 'armor', 'initiative', 'range', 'morale'].some(key => item.effects[key as keyof DevelopmentEffects])) throw new Error('A hearth cannot invent formation stats: ' + item.id);
  }
}
