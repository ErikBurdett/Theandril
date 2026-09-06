import { z } from 'zod';

const id = z.string().regex(/^[a-z]+\.[a-z_]+$/);
const name = z.string().min(1).max(80);
const description = z.string().min(1).max(500);
const cost = z.number().int().min(1).max(1_000_000);
const bonus = z.number().int().min(0).max(20);
const yields = z.object({ food: bonus, industry: bonus, coin: bonus, knowledge: bonus }).strict();
export const technologySchema = z.object({ id, name, description, knowledgeCost: cost, requires: z.array(id).max(20), effects: yields }).strict();
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
export const CAMPAIGN_PACES: Readonly<Record<CampaignPace, CampaignPaceProfile>> = {
  short: { name: 'Short', description: 'A brief test or skirmish campaign, usually measured in dozens of turns. Early growth and AI strength are unchanged.', civicKnowledgeCost: 40, projectCoinCost: 120, projectActiveTurns: 5 },
  standard: { name: 'Standard', description: 'A full campaign aiming for hundreds of turns, with greater late economic investment and time to oppose public projects. Actual length depends on play.', civicKnowledgeCost: 400, projectCoinCost: 10_000, projectActiveTurns: 20 },
  long: { name: 'Long', description: 'An extended campaign aiming around five hundred turns. Higher late costs and a wider public response window do not increase AI strength.', civicKnowledgeCost: 800, projectCoinCost: 24_000, projectActiveTurns: 40 },
  epic: { name: 'Epic', description: 'An enduring campaign aiming around a thousand turns. Large late investments and lengthy public projects extend play without changing AI strength.', civicKnowledgeCost: 1600, projectCoinCost: 60_000, projectActiveTurns: 60 },
};

export const TECHNOLOGIES: readonly TechnologyDefinition[] = [
  { id: 'technology.cinder_masonry', name: 'Cinder masonry', description: 'Reusable kiln forms strengthen hearthland workshops. Every settlement gains 2 industry before devastation, occupation and blockade penalties.', knowledgeCost: 24, requires: [], effects: { food: 0, industry: 2, coin: 0, knowledge: 0 } },
  { id: 'technology.civic_accounts', name: 'Civic accounts', description: 'Public ledgers reconnect the bargains once carried by the Witness Roads. Every settlement gains 1 coin and 1 knowledge before penalties; enables the Hearth Exchange.', knowledgeCost: 40, requires: [], effects: { food: 0, industry: 0, coin: 1, knowledge: 1 } },
];
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
    checking.delete(technologyId); checked.add(technologyId);
  };
  technologies.forEach(item => visit(item.id));
  for (const technologyId of project.requiredTechnologies) visit(technologyId);
  for (const buildingId of project.requiredBuildings) if (!buildingIds.has(buildingId)) throw new Error('Unknown project building: ' + buildingId);
  for (const institutionId of project.requiredInstitutions) if (!institutions.some(item => item.id === institutionId)) throw new Error('Unknown project institution');
}
