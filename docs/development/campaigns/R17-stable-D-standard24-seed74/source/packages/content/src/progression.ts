import { z } from 'zod';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const name = z.string().min(1).max(80);
const description = z.string().min(1).max(500);
const cost = z.number().int().min(1).max(1_000_000);
const bonus = z.number().int().min(0).max(20);
const yields = z.object({ food: bonus, industry: bonus, coin: bonus, knowledge: bonus }).strict();
export const researchBranchSchema = z.enum(['craft', 'stewardship', 'navigation', 'civic']);
export type ResearchBranch = z.infer<typeof researchBranchSchema>;
export const technologySchema = z.object({ id, name, description, knowledgeCost: cost, requires: z.array(id).max(20), effects: yields,
  introducedInRules: z.literal(11).optional(), branch: researchBranchSchema.optional(), borderGrowthBonus: z.number().int().min(1).max(2).optional(),
}).strict();
export const institutionSchema = z.object({ id, name, description, coinCost: cost, effects: yields }).strict();
export const doctrineSchema = z.object({ id, name, description, coinCost: cost, effects: z.object({ armor: bonus, attack: bonus, movement: bonus }).strict() }).strict();
export const prosperityProjectSchema = z.object({
  id, name, description, coinCost: cost, activeTurns: z.number().int().min(1).max(100), settlementCount: z.number().int().min(1).max(100),
  requiredBuildings: z.array(id).min(1).max(20), requiredTechnologies: z.array(id).min(1).max(20), requiredInstitutions: z.array(id).min(1).max(20),
}).strict();
export type TechnologyDefinition = z.infer<typeof technologySchema>;
export type InstitutionDefinition = z.infer<typeof institutionSchema>;
export type DoctrineDefinition = z.infer<typeof doctrineSchema>;
export type ProsperityProjectDefinition = z.infer<typeof prosperityProjectSchema>;

export const campaignPaceSchema = z.enum(['short', 'standard', 'long', 'epic']);
export type CampaignPace = z.infer<typeof campaignPaceSchema>;
export const campaignPaceProfileSchema = z.object({ name, description, civicKnowledgeCost: cost, projectCoinCost: cost, projectActiveTurns: z.number().int().min(1).max(100) }).strict();
export type CampaignPaceProfile = z.infer<typeof campaignPaceProfileSchema>;
/** Frozen prices for command replay under rules4–7; never rebalance these in place. */
export const LEGACY_CAMPAIGN_PACES: Readonly<Record<CampaignPace, CampaignPaceProfile>> = {
  short: { name: 'Short', description: 'A brief test or skirmish campaign, usually measured in dozens of turns. Early growth and AI strength are unchanged.', civicKnowledgeCost: 40, projectCoinCost: 120, projectActiveTurns: 5 },
  standard: { name: 'Standard', description: 'A full campaign aiming for hundreds of turns, with greater late economic investment and time to oppose public projects. Actual length depends on play.', civicKnowledgeCost: 400, projectCoinCost: 10_000, projectActiveTurns: 20 },
  long: { name: 'Long', description: 'An extended campaign aiming around five hundred turns. Higher late costs and a wider public response window do not increase AI strength.', civicKnowledgeCost: 800, projectCoinCost: 24_000, projectActiveTurns: 40 },
  epic: { name: 'Epic', description: 'An enduring campaign aiming around a thousand turns. Large late investments and lengthy public projects extend play without changing AI strength.', civicKnowledgeCost: 1600, projectCoinCost: 60_000, projectActiveTurns: 60 },
};
/** Schema8's stronger military/economy needs a larger late Epic commitment. Early
 * economy and the real60-turn counterplay window stay unchanged; no turn lock. */
export const SCHEMA8_CAMPAIGN_PACES: Readonly<Record<CampaignPace, CampaignPaceProfile>> = {
  ...LEGACY_CAMPAIGN_PACES,
  epic: { ...LEGACY_CAMPAIGN_PACES.epic, projectCoinCost: 75_000 },
};
/** Developed hinterlands increase recurring income. Keep the late commitment
 * proportionate without delaying early work, raising AI strength or locking turns. */
export const CAMPAIGN_PACES: Readonly<Record<CampaignPace, CampaignPaceProfile>> = {
  ...SCHEMA8_CAMPAIGN_PACES,
  standard: { ...SCHEMA8_CAMPAIGN_PACES.standard, projectCoinCost: 18_000 },
  long: { ...SCHEMA8_CAMPAIGN_PACES.long, projectCoinCost: 80_000 },
  epic: { ...SCHEMA8_CAMPAIGN_PACES.epic, projectCoinCost: 240_000 },
};

export const TECHNOLOGIES: readonly TechnologyDefinition[] = [
  { id: 'technology.cinder_masonry', name: 'Cinder masonry', description: 'Reusable kiln forms strengthen hearthland workshops. Every settlement gains 2 industry before devastation, occupation and blockade penalties.', knowledgeCost: 24, requires: [], effects: { food: 0, industry: 2, coin: 0, knowledge: 0 } },
  { id: 'technology.civic_accounts', name: 'Civic accounts', description: 'Public ledgers reconnect the bargains once carried by the Witness Roads. Every settlement gains 1 coin and 1 knowledge before penalties; enables the Hearth Exchange.', knowledgeCost: 40, requires: [], effects: { food: 0, industry: 0, coin: 1, knowledge: 1 } },
  { id: 'technology.coastal_navigation', name: 'Coastal navigation', description: 'Soundings and shore charts reconnect coastal hearthlands. Enables Charter harbors, transports and Coastwatch galleys; vessels can travel coastal shallows. This practical knowledge does not confer magical aptitude.', knowledgeCost: 30, requires: [], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 } },
  { id: 'technology.ocean_navigation', name: 'Ocean navigation', description: 'Deep-water charts and long-voyage rigging open the ocean. Ocean-capable transports and Deepwake warships may cross deep water; coastal galleys remain restricted to shallows.', knowledgeCost: 80, requires: ['technology.coastal_navigation'], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 } },
  { id: 'technology.stewardship', name: 'Seasonal stewardship', description: 'Record planting and water-sharing obligations. Unlocks Spring gardens on fresh-water land; opens the waterworks, forestry and surveyed-estates branches. Knowledge alone does not build or work a tile.', knowledgeCost: 36, requires: [], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 }, introducedInRules: 11, branch: 'stewardship' },
  { id: 'technology.waterworks', name: 'Sluice waterworks', description: 'Controlled sluices support worked wetland Polders. They can feed crowded settlements, but old growth and Ashfall glass make intensive planting less productive. Physical terrain and natural features remain intact.', knowledgeCost: 64, requires: ['technology.stewardship'], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 }, introducedInRules: 11, branch: 'stewardship' },
  { id: 'technology.surveyed_estates', name: 'Surveyed estates', description: 'Witnessed boundary surveys add one civic progress per active settlement turn toward automatic border expansion. Claims still require connected, charted land within the settlement’s reach; siege and occupation halt expansion.', knowledgeCost: 60, requires: ['technology.stewardship'], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 }, introducedInRules: 11, branch: 'civic', borderGrowthBonus: 1 },
  { id: 'technology.charter_forestry', name: 'Charter forestry', description: 'Bind cutting rights to the preservation of living records. Unlocks Grove archives on old-growth woodland: knowledge and modest industry instead of the woodlot’s stronger extraction.', knowledgeCost: 72, requires: ['technology.stewardship'], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 }, introducedInRules: 11, branch: 'stewardship' },
  { id: 'technology.quarry_cranes', name: 'Counterweighted cranes', description: 'Reusable lifting frames unlock Oreworks on mineral seams. Worked Oreworks favor industry at the cost of food and coin; wet ground complicates extraction.', knowledgeCost: 60, requires: ['technology.cinder_masonry'], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 }, introducedInRules: 11, branch: 'craft' },
  { id: 'technology.deep_soundings', name: 'Deep soundings', description: 'Observations from the shore compare returning ships’ ocean records. Unlocks Tide observatories on coastal shallows; knowledge replaces the food-focused role of a fishery. Does not extend worker reach into deep ocean.', knowledgeCost: 120, requires: ['technology.ocean_navigation'], effects: { food: 0, industry: 0, coin: 0, knowledge: 0 }, introducedInRules: 11, branch: 'navigation' },
];
/** Frozen choices remain unavailable to historical command execution. */
export function technologiesForRules(version: number): readonly TechnologyDefinition[] {
  return TECHNOLOGIES.filter(item => (item.introducedInRules ?? (item.id === 'technology.coastal_navigation' || item.id === 'technology.ocean_navigation' ? 8 : 4)) <= version);
}
export function technologyBranch(item: TechnologyDefinition): ResearchBranch {
  return item.branch ?? (item.id === 'technology.cinder_masonry' ? 'craft' : item.id === 'technology.civic_accounts' ? 'civic' : 'navigation');
}
export const INSTITUTIONS: readonly InstitutionDefinition[] = [
  { id: 'institution.charter_compact', name: 'Charter compact', description: 'Recognize shared market charters. Every settlement gains 2 coin before penalties; enables the Hearth Exchange. Permanently excludes Common stewardship.', coinCost: 30, effects: { food: 0, industry: 0, coin: 2, knowledge: 0 } },
  { id: 'institution.common_stewardship', name: 'Common stewardship', description: 'Communal stores take priority over merchant privileges. Every settlement gains 3 food before penalties; enables the Hearth Exchange. Permanently excludes Charter compact.', coinCost: 30, effects: { food: 3, industry: 0, coin: 0, knowledge: 0 } },
];
export const DOCTRINES: readonly DoctrineDefinition[] = [
  { id: 'doctrine.shield_cohesion', name: 'Shield cohesion', description: 'Train formations to cover one another. Armies gain 2 armor in battle. Permanently excludes March columns.', coinCost: 24, effects: { armor: 2, attack: 0, movement: 0 } },
  { id: 'doctrine.march_columns', name: 'March columns', description: 'Organize disciplined marching relays. Armies regain 1 additional strategic movement each turn. Permanently excludes Shield cohesion.', coinCost: 24, effects: { armor: 0, attack: 0, movement: 1 } },
];
export const PROSPERITY_PROJECT: ProsperityProjectDefinition = {
  id: 'project.hearth_exchange', name: 'Hearth Exchange',
  description: 'Host a great exchange supported by three settlements with Charter markets and Witness archives. Sustain its full active period; blockades and conquest can interrupt the endeavor. Funding and duration depend on campaign pace.',
  coinCost: 120, activeTurns: 5, settlementCount: 3,
  requiredBuildings: ['building.market', 'building.archive'], requiredTechnologies: ['technology.civic_accounts'], requiredInstitutions: ['institution.charter_compact', 'institution.common_stewardship'],
};

/** Validate arbitrary candidate packs as well as the shipped one, including dependency cycles. */
export function validateProgressionContent(
  buildingIds: ReadonlySet<string>, technologies = TECHNOLOGIES, institutions = INSTITUTIONS,
  doctrines = DOCTRINES, project = PROSPERITY_PROJECT,
): void {
  technologies.forEach(item => technologySchema.parse(item));
  institutions.forEach(item => institutionSchema.parse(item));
  doctrines.forEach(item => doctrineSchema.parse(item));
  prosperityProjectSchema.parse(project);
  for (const pace of campaignPaceSchema.options) campaignPaceProfileSchema.parse(CAMPAIGN_PACES[pace]);
  const definitions = [...technologies, ...institutions, ...doctrines, project];
  if (new Set(definitions.map(item => item.id)).size !== definitions.length) throw new Error('Duplicate progression ID');
  const technologyById = new Map(technologies.map(item => [item.id, item]));
  const checked = new Set<string>();
  const checking = new Set<string>();
  const visit = (technologyId: string): void => {
    if (checked.has(technologyId)) return;
    const technology = technologyById.get(technologyId);
    if (!technology) throw new Error('Unknown technology requirement: ' + technologyId);
    if (checking.has(technologyId)) throw new Error('Cyclic technology requirements: ' + technologyId);
    checking.add(technologyId);
    if (new Set(technology.requires).size !== technology.requires.length) throw new Error('Duplicate technology requirement: ' + technologyId);
    technology.requires.forEach(visit);
    for (const requirement of technology.requires) if ((technologyById.get(requirement)?.introducedInRules ?? 4) > (technology.introducedInRules ?? 4)) throw new Error('Technology requires a future rules definition: ' + technologyId);
    checking.delete(technologyId); checked.add(technologyId);
  };
  technologies.forEach(item => visit(item.id));
  for (const technologyId of project.requiredTechnologies) visit(technologyId);
  for (const buildingId of project.requiredBuildings) if (!buildingIds.has(buildingId)) throw new Error('Unknown project building: ' + buildingId);
  for (const institutionId of project.requiredInstitutions) if (!institutions.some(item => item.id === institutionId)) throw new Error('Unknown project institution');
}
