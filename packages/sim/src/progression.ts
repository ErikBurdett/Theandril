import { z } from 'zod';
import { ARCANE_DISCOVERIES, ATTUNEMENT_VICTORY, CAMPAIGN_PACES, LEGACY_CAMPAIGN_PACES, MAGIC_PATHS, SCHEMA8_CAMPAIGN_PACES, SCHEMA17_CAMPAIGN_PACES, SCHEMA20_CAMPAIGN_PACES, SCHEMA21_CAMPAIGN_PACES, SCHEMA43_ATTUNEMENT_VICTORY, SCHEMA43_CAMPAIGN_PACES, SCHEMA44_ATTUNEMENT_VICTORY, DOCTRINES, INSTITUTIONS, PROSPERITY_PROJECT, SCHEMA20_UNIFICATION_VICTORY, UNIFICATION_VICTORY, technologiesForRules, technologyBranch, type ResearchBranch } from '@theandril/content';
import { isPassable } from '@theandril/mapgen';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { arcaneSites, controllingSettlement } from './arcane-sites';

const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const turn = z.number().int().min(1).max(1_000_000);
export const factionProgressionSchema = z.object({ technologies: z.array(id).max(1000), institutionId: id.nullable(), doctrineId: id.nullable() }).strict();
export type FactionProgression = z.infer<typeof factionProgressionSchema>;
export const victoryProjectSchema = z.object({
  id, projectId: id, factionId: id, settlementId: id, settlementName: z.string().min(1).max(40),
  cell: z.number().int().min(0).max(349_999), startedTurn: turn, progress: z.number().int().min(0).max(100), requiredTurns: z.number().int().min(1).max(100),
  status: z.enum(['active', 'paused', 'cancelled', 'completed']), statusReason: z.string().min(1).max(400).nullable(),
}).strict();
export type VictoryProject = z.infer<typeof victoryProjectSchema>;
/** Rules ≤18 victories; historical save schemas keep this exact shape. */
export const victorySchema = z.object({ path: z.literal('prosperity'), factionId: id, projectId: id, settlementId: id, turn }).strict();
/** Rules 19 adds Unification, recorded on the same public project ledger. */
export const victoryV19Schema = victorySchema.extend({ path: z.enum(['prosperity', 'unification']) }).strict();
/** Rules 38 adds Attunement, the third path, on the same public ledger. */
export const victoryV38Schema = victorySchema.extend({ path: z.enum(['prosperity', 'unification', 'attunement']) }).strict();
export type Victory = z.infer<typeof victoryV38Schema>;
interface Choice { id: string; name: string; description: string; available: boolean; blocker: string | null }
/** One of the realm's Waykeepers as the sealed working sees them: the degree it
 * has reached, where it stands, and why it cannot seal a working today. */
export interface AttunementCaster { characterId: string; name: string; degree: number; settlementId: string | null; qualified: boolean; blocker: string | null }
export interface AttunementObservation {
  id: string; name: string; description: string; knowledgeCost: number; requiredTurns: number; casterDegree: number;
  paths: { pathId: string; pathName: string; held: boolean }[];
  discoveries: { researched: number; total: number };
  casters: AttunementCaster[];
  /** Owned hearths able to host a working today, whether or not a caster stands in them. */
  hostSettlementIds: string[];
  eligibleSettlementIds: string[];
  blockers: string[];
}
export interface ProgressionObservation extends FactionProgression {
  technologyChoices: (Choice & { knowledgeCost: number; requires: string[]; branch: ResearchBranch })[];
  institutionChoices: (Choice & { coinCost: number })[];
  doctrineChoices: (Choice & { coinCost: number })[];
  project: { id: string; name: string; description: string; coinCost: number; activeTurns: number; eligibleSettlementIds: string[]; blockers: string[] };
  /** Rules 19 and later; absent under historical rules. */
  unification?: { id: string; name: string; description: string; requiredTurns: number; held: number; own: number; pledged: number; total: number; minimum: number; blockers: string[] };
  /** Rules 38 and later: the third path exists in this campaign. */
  attunementAvailable?: true;
  /** Rules 38 and later, once the realm has any arcane standing — a researched
   * discovery, a surveyed seam, a living Waykeeper or a working of its own.
   * Until then every requirement is the static one the content states, and the
   * observation stays as small as it was before the path existed. */
  attunement?: AttunementObservation;
}
export const createFactionProgression = (): FactionProgression => ({ technologies: [], institutionId: null, doctrineId: null });
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const ongoing = (project: VictoryProject): boolean => project.status === 'active' || project.status === 'paused';
const isProsperity = (project: VictoryProject): boolean => project.projectId === PROSPERITY_PROJECT.id;
const isUnification = (project: VictoryProject): boolean => project.projectId === UNIFICATION_VICTORY.id;
const isAttunement = (project: VictoryProject): boolean => project.projectId === ATTUNEMENT_VICTORY.id;
const ATTUNEMENT_HOST_LOST = 'The host settlement was conquered or razed; the committed knowledge is lost.';
const NO_CASTER = 'No Waykeeper of the second degree stands at the host.';
const HOST_FELL = 'The host capital fell; the unification bid ended.';
const MAJORITY_LOST = 'The realm no longer holds two thirds of the world’s hearths; the unification bid ended.';
const MAJORITY_LOST_V20 = 'The realm no longer holds a majority of hearths; the unification bid ended.';
const majorityLost = (state: GameState) => rulesVersion(state) < 21 ? MAJORITY_LOST_V20 : MAJORITY_LOST;
const campaignProfile = (state: GameState) => (rulesVersion(state) < 8 ? LEGACY_CAMPAIGN_PACES : rulesVersion(state) === 8 ? SCHEMA8_CAMPAIGN_PACES : rulesVersion(state) < 18 ? SCHEMA17_CAMPAIGN_PACES : rulesVersion(state) < 21 ? SCHEMA20_CAMPAIGN_PACES : rulesVersion(state) < 22 ? SCHEMA21_CAMPAIGN_PACES : rulesVersion(state) < 44 ? SCHEMA43_CAMPAIGN_PACES : CAMPAIGN_PACES)[state.pace];

export function doctrineEffects(doctrineId: string | null) {
  return DOCTRINES.find(item => item.id === doctrineId)?.effects ?? { attack: 0, armor: 0, movement: 0 };
}
export function progressionYields(state: GameState, factionId: string) {
  const progress = state.progression[factionId];
  const effects = { food: 0, industry: 0, coin: 0, knowledge: 0 };
  if (!progress) return effects;
  const definitions = [...technologiesForRules(rulesVersion(state)).filter(item => progress.technologies.includes(item.id)), ...INSTITUTIONS.filter(item => item.id === progress.institutionId)];
  for (const definition of definitions) for (const key of ['food', 'industry', 'coin', 'knowledge'] as const) effects[key] += definition.effects[key];
  return effects;
}
function strategicBlocker(state: GameState): string | null {
  return state.victory ? 'This campaign has ended in victory.' : state.battle ? 'Resolve the pending battle first.' : state.pendingCapture ? 'Resolve the settlement capture first.' : null;
}
/** Sparse settlement aggregation, never a world-cell scan. */
function infrastructure(state: GameState): Map<string, string[]> {
  const towns = new Map<string, string[]>();
  for (const town of Object.values(state.settlements)) {
    if (town.occupationTurns > 0 || PROSPERITY_PROJECT.requiredBuildings.some(id => !town.buildings.includes(id))) continue;
    const ids = towns.get(town.factionId) ?? []; ids.push(town.id); towns.set(town.factionId, ids);
  }
  for (const ids of towns.values()) ids.sort();
  return towns;
}
function requirements(state: GameState, factionId: string, towns: Map<string, string[]>): string[] {
  const progress = state.progression[factionId];
  const blockers: string[] = [];
  if (!progress || PROSPERITY_PROJECT.requiredTechnologies.some(id => !progress.technologies.includes(id))) blockers.push('Research Civic accounts.');
  if (!progress?.institutionId || !PROSPERITY_PROJECT.requiredInstitutions.includes(progress.institutionId)) blockers.push('Adopt an institution.');
  if ((towns.get(factionId)?.length ?? 0) < PROSPERITY_PROJECT.settlementCount) blockers.push(`Maintain ${PROSPERITY_PROJECT.settlementCount} unoccupied settlements, each with a Charter market and Witness archive.`);
  return blockers;
}
function projectPauseReason(state: GameState, project: VictoryProject, towns: Map<string, string[]>): string | null {
  const town = state.settlements[project.settlementId];
  if (town?.occupationTurns) return 'The host settlement is occupied.';
  if (state.sieges[project.settlementId]) return 'The host settlement is under siege.';
  return requirements(state, project.factionId, towns)[0] ?? null;
}
/** Rules 19. Sparse: one pass over settlements, never the map. */
/** Rules 22: a client's hearths stand behind its patron's bid. Political support
 * counts like conquest, so unification can be negotiated as well as taken. */
function hearthCounts(state: GameState): { total: number; counts: Map<string, number>; pledged: Map<string, number> } {
  const counts = new Map<string, number>(), pledged = new Map<string, number>();
  for (const town of Object.values(state.settlements)) counts.set(town.factionId, (counts.get(town.factionId) ?? 0) + 1);
  if (rulesVersion(state) >= 22) {
    for (const bond of state.diplomacy.clients) pledged.set(bond.patronId, (pledged.get(bond.patronId) ?? 0) + (counts.get(bond.clientId) ?? 0));
  }
  return { total: Object.keys(state.settlements).length, counts, pledged };
}
const supported = (standing: { counts: Map<string, number>; pledged: Map<string, number> }, factionId: string): number =>
  (standing.counts.get(factionId) ?? 0) + (standing.pledged.get(factionId) ?? 0);
const unificationProfile = (state: GameState) => rulesVersion(state) < 21 ? SCHEMA20_UNIFICATION_VICTORY : UNIFICATION_VICTORY;
function unificationBlockers(state: GameState, factionId: string, standing = hearthCounts(state)): string[] {
  const held = supported(standing, factionId), blockers: string[] = [], modern = rulesVersion(state) >= 21;
  const profile = unificationProfile(state);
  if (held < profile.minimumSettlements) blockers.push(`Hold at least ${profile.minimumSettlements} hearths (you hold ${held}).`);
  // Rules 19–20 asked for a simple majority; wider rules-21 realms ask for two thirds.
  if (modern ? held * 3 <= standing.total * 2 : held * 2 <= standing.total) blockers.push(modern ? `Hold more than two thirds of all ${standing.total} hearths (you hold ${held}).` : `Hold more than half of all ${standing.total} hearths (you hold ${held}).`);
  const capital = state.land.capitals[factionId];
  if (!capital || state.settlements[capital]?.factionId !== factionId) blockers.push('Hold a capital to host the bid.');
  return blockers;
}
/** Rules 38. Everything the sealed working rests on can be taken: the seams
 * (through the hearths whose borders hold them), the host, and the caster. */
/** Rules 44 and 45 re-priced the working from measured campaigns; a campaign keeps the price it was sealed under. */
const attunementKnowledgeCost = (state: GameState): number => (rulesVersion(state) < 44 ? SCHEMA43_ATTUNEMENT_VICTORY : rulesVersion(state) < 45 ? SCHEMA44_ATTUNEMENT_VICTORY : ATTUNEMENT_VICTORY).knowledgeCost[state.pace];
const casterDegree = (character: GameState['characters'][string]): number => Math.max(0, ...Object.values(character.aptitudes ?? {}));
/** Sparse: seams are few and bounded; every path is checked against the realm's held seams only. */
function attunementPaths(state: GameState, factionId: string): { pathId: string; pathName: string; held: boolean }[] {
  const held = new Set<string>();
  for (const site of arcaneSites(state.world)) if (!held.has(site.pathId) && controllingSettlement(state, site.cell, factionId) !== null) held.add(site.pathId);
  return MAGIC_PATHS.map(path => ({ pathId: path.id, pathName: path.name, held: held.has(path.id) }));
}
function attunementDiscoveries(state: GameState, factionId: string): { researched: number; total: number } {
  const available = ARCANE_DISCOVERIES.filter(item => (item.sinceRules ?? 14) <= rulesVersion(state));
  const researched = state.arcaneResearch[factionId] ?? [];
  return { researched: available.filter(item => researched.includes(item.id)).length, total: available.length };
}
/** Hearths able to host a working: owned, unoccupied, unbesieged, with an archive. */
function attunementHosts(state: GameState, factionId: string): string[] {
  return Object.values(state.settlements).filter(town => town.factionId === factionId && !town.occupationTurns && !state.sieges[town.id] && ATTUNEMENT_VICTORY.requiredBuildings.every(id => town.buildings.includes(id))).map(town => town.id).sort();
}
/** The hearth a Waykeeper stands in, whether lodged there or riding with an army on its hex. */
function casterSettlement(state: GameState, character: GameState['characters'][string]): string | null {
  const location = character.location;
  if (!location) return null;
  if (location.kind === 'settlement') return state.settlements[location.settlementId]?.factionId === character.factionId ? location.settlementId : null;
  if (state.transports[location.armyId]) return null;
  const cell = state.armies[location.armyId]?.cell;
  if (cell === undefined) return null;
  for (const town of Object.values(state.settlements)) if (town.cell === cell && town.factionId === character.factionId) return town.id;
  return null;
}
function attunementCasters(state: GameState, factionId: string, hosts: readonly string[]): AttunementCaster[] {
  return Object.values(state.characters).filter(item => item.factionId === factionId && !item.dead && item.definitionId === 'character.waykeeper').sort((a, b) => a.id < b.id ? -1 : 1).map(character => {
    const degree = casterDegree(character), settlementId = casterSettlement(state, character);
    const blocker = degree < ATTUNEMENT_VICTORY.casterDegree ? `This Waykeeper has not reached the ${ATTUNEMENT_VICTORY.casterDegree === 2 ? 'second' : 'required'} degree of any path.`
      : character.woundedTurns ? 'This caster must recover from wounds.'
        : character.mission ? 'Cancel this caster’s mission first.'
          : character.location?.kind === 'army' && state.transports[character.location.armyId] ? 'Carried troops cannot seal a working.'
            : !settlementId || !hosts.includes(settlementId) ? 'Bring this caster to a hearth that can host the working.' : null;
    return { characterId: character.id, name: character.name, degree, settlementId, qualified: blocker === null, blocker };
  });
}
function attunementObservation(state: GameState, factionId: string): AttunementObservation {
  const faction = state.factions.find(item => item.id === factionId)!;
  const paths = attunementPaths(state, factionId), discoveries = attunementDiscoveries(state, factionId), hosts = attunementHosts(state, factionId);
  const casters = attunementCasters(state, factionId, hosts), cost = attunementKnowledgeCost(state), blockers: string[] = [];
  const strategic = strategicBlocker(state);
  if (strategic) blockers.push(strategic);
  if (discoveries.researched < discoveries.total) blockers.push(`Research every Arcane Theory discovery (${discoveries.researched} of ${discoveries.total}).`);
  for (const path of paths) if (!path.held) blockers.push(`Hold a surveyed ${path.pathName} seam inside your borders.`);
  if (!hosts.length) blockers.push('An unoccupied, unbesieged hearth with a Witness archive must host the working.');
  if (!casters.some(caster => caster.qualified)) blockers.push('A Waykeeper of the second degree must stand at a hearth that can host the working.');
  if (state.projects.some(project => project.factionId === factionId && isAttunement(project) && ongoing(project))) blockers.push('This faction already has an ongoing Attunement.');
  if (faction.knowledge < cost) blockers.push(`Requires ${cost} knowledge upfront; cancellation gives no refund.`);
  const eligible = blockers.length ? [] : hosts.filter(id => casters.some(caster => caster.qualified && caster.settlementId === id));
  return { id: ATTUNEMENT_VICTORY.id, name: ATTUNEMENT_VICTORY.name, description: ATTUNEMENT_VICTORY.description, knowledgeCost: cost, requiredTurns: campaignProfile(state).projectActiveTurns, casterDegree: ATTUNEMENT_VICTORY.casterDegree, paths, discoveries, casters, hostSettlementIds: hosts, eligibleSettlementIds: eligible, blockers };
}
/** Why a sealed working rests today, or null while it advances. Discoveries cannot be lost. */
function attunementPauseReason(state: GameState, project: VictoryProject): string | null {
  const town = state.settlements[project.settlementId];
  if (town?.occupationTurns) return 'The host settlement is occupied.';
  if (state.sieges[project.settlementId]) return 'The host settlement is under siege.';
  const lost = attunementPaths(state, project.factionId).find(path => !path.held);
  if (lost) return `A surveyed ${lost.pathName} seam is no longer held.`;
  if (!attunementCasters(state, project.factionId, [project.settlementId]).some(caster => caster.qualified)) return NO_CASTER;
  return null;
}
export function startAttunement(state: GameState, factionId: string, settlementId: string, characterId: string): CommandResult {
  if (rulesVersion(state) < 38) return fail('Attunement is unavailable under historical rules.');
  const town = state.settlements[settlementId];
  if (!town || town.factionId !== factionId) return fail('You do not control that settlement.');
  const view = attunementObservation(state, factionId);
  if (view.blockers.length) return fail(view.blockers.join(' '));
  if (!view.eligibleSettlementIds.includes(settlementId)) return fail('The host needs a Witness archive, freedom from siege and occupation, and a qualified Waykeeper standing in it.');
  const caster = view.casters.find(item => item.characterId === characterId);
  if (!caster || !caster.qualified || caster.settlementId !== settlementId) return fail(caster?.blocker ?? 'Choose one of your own Waykeepers standing at the host.');
  const faction = state.factions.find(item => item.id === factionId)!;
  faction.knowledge -= view.knowledgeCost;
  const project: VictoryProject = { id: `project.${state.nextId++}`, projectId: ATTUNEMENT_VICTORY.id, factionId, settlementId, settlementName: town.name, cell: town.cell, startedTurn: state.turn, progress: 0, requiredTurns: view.requiredTurns, status: 'active', statusReason: null };
  state.projects = [...state.projects.filter(item => item.factionId !== factionId || !isAttunement(item)), project].sort((a, b) => a.id < b.id ? -1 : 1);
  return { ok: true, events: publicEvent(state, project, 'victory_project_started', `${faction.name} committed ${view.knowledgeCost} knowledge to seal an ${ATTUNEMENT_VICTORY.name} at ${town.name}, hex ${town.cell}, through ${caster.name}. Completion requires ${project.requiredTurns} active turns.`) };
}
function publicEvent(state: GameState, project: VictoryProject, type: string, message: string): DomainEvent[] {
  return state.factions.map(faction => ({ turn: state.turn, type, factionId: faction.id, cell: project.cell, message }));
}
export function getProgressionObservation(state: GameState, factionId: string): ProgressionObservation {
  const faction = state.factions.find(item => item.id === factionId); const progress = state.progression[factionId];
  if (!faction || !progress) throw new Error('Unknown progression faction');
  const pace = campaignProfile(state);
  const strategic = strategicBlocker(state);
  const technologyChoices = technologiesForRules(rulesVersion(state)).map(item => {
    const knowledgeCost = item.id === 'technology.civic_accounts' ? pace.civicKnowledgeCost : item.knowledgeCost;
    const blocker = strategic ?? (progress.technologies.includes(item.id) ? 'Already researched.' : item.requires.some(id => !progress.technologies.includes(id)) ? 'Research the prerequisite technologies.' : faction.knowledge < knowledgeCost ? `Requires ${knowledgeCost} knowledge.` : null);
    return { id: item.id, name: item.name, description: item.description, knowledgeCost, requires: [...item.requires], branch: technologyBranch(item), available: !blocker, blocker };
  });
  const institutionChoices = INSTITUTIONS.map(item => {
    const blocker = strategic ?? (progress.institutionId ? 'An institution has already been adopted; this choice is permanent.' : faction.treasury < item.coinCost ? `Requires ${item.coinCost} coin.` : null);
    return { id: item.id, name: item.name, description: item.description, coinCost: item.coinCost, available: !blocker, blocker };
  });
  const doctrineChoices = DOCTRINES.map(item => {
    const blocker = strategic ?? (progress.doctrineId ? 'A doctrine has already been adopted; this choice is permanent.' : faction.treasury < item.coinCost ? `Requires ${item.coinCost} coin.` : null);
    return { id: item.id, name: item.name, description: item.description, coinCost: item.coinCost, available: !blocker, blocker };
  });
  const towns = infrastructure(state);
  const blockers = requirements(state, factionId, towns);
  if (strategic) blockers.unshift(strategic);
  if (state.projects.some(project => project.factionId === factionId && isProsperity(project) && ongoing(project))) blockers.push('This faction already has an ongoing Hearth Exchange.');
  if (faction.treasury < pace.projectCoinCost) blockers.push(`Requires ${pace.projectCoinCost} coin upfront; cancellation gives no refund.`);
  const eligible = (towns.get(factionId) ?? []).filter(id => !state.sieges[id]);
  if (!eligible.length) blockers.push('A prepared host settlement must be free of siege and occupation.');
  return { ...progress, technologies: [...progress.technologies], technologyChoices, institutionChoices, doctrineChoices,
    project: { id: PROSPERITY_PROJECT.id, name: PROSPERITY_PROJECT.name, description: PROSPERITY_PROJECT.description, coinCost: pace.projectCoinCost, activeTurns: pace.projectActiveTurns, eligibleSettlementIds: blockers.length ? [] : eligible, blockers },
    ...(rulesVersion(state) >= 19 ? { unification: unificationObservation(state, factionId) } : {}),
    ...(rulesVersion(state) >= 38 ? { attunementAvailable: true as const, ...(arcaneStanding(state, factionId) ? { attunement: attunementObservation(state, factionId) } : {}) } : {}) };
}
/** Whether a realm has begun the arcane road at all; bounded by its own records. */
function arcaneStanding(state: GameState, factionId: string): boolean {
  return (state.arcaneResearch[factionId]?.length ?? 0) > 0 || (state.arcaneSurveys[factionId]?.length ?? 0) > 0
    || state.projects.some(project => project.factionId === factionId && isAttunement(project))
    || Object.values(state.characters).some(character => character.factionId === factionId && !character.dead && character.definitionId === 'character.waykeeper');
}
function unificationObservation(state: GameState, factionId: string) {
  const standing = hearthCounts(state);
  const profile = unificationProfile(state);
  return { id: profile.id, name: profile.name, description: profile.description, requiredTurns: campaignProfile(state).projectActiveTurns,
    held: supported(standing, factionId), own: standing.counts.get(factionId) ?? 0, pledged: standing.pledged.get(factionId) ?? 0,
    total: standing.total, minimum: profile.minimumSettlements, blockers: unificationBlockers(state, factionId, standing) };
}
export function chooseProgression(state: GameState, factionId: string, kind: 'research' | 'adoptInstitution' | 'adoptDoctrine', choiceId: string): CommandResult {
  const view = getProgressionObservation(state, factionId);
  const choice = (kind === 'research' ? view.technologyChoices : kind === 'adoptInstitution' ? view.institutionChoices : view.doctrineChoices).find(item => item.id === choiceId);
  if (!choice) return fail('Unknown progression choice.');
  if (choice.blocker) return fail(choice.blocker);
  const faction = state.factions.find(item => item.id === factionId); const progress = state.progression[factionId];
  if (!faction || !progress) return fail('Unknown faction.');
  let spent: string;
  if ('knowledgeCost' in choice) { faction.knowledge -= choice.knowledgeCost; progress.technologies.push(choiceId); progress.technologies.sort(); spent = `${choice.knowledgeCost} knowledge`; }
  else { faction.treasury -= choice.coinCost; spent = `${choice.coinCost} coin`; if (kind === 'adoptInstitution') progress.institutionId = choiceId; else progress.doctrineId = choiceId; }
  return { ok: true, events: [{ turn: state.turn, type: kind === 'research' ? 'technology_researched' : kind === 'adoptInstitution' ? 'institution_adopted' : 'doctrine_adopted', factionId, message: `${faction.name} ${kind === 'research' ? 'researched' : 'adopted'} ${choice.name} for ${spent}.` }] };
}
export function startVictoryProject(state: GameState, factionId: string, settlementId: string): CommandResult {
  const town = state.settlements[settlementId];
  if (!town || town.factionId !== factionId) return fail('You do not control that settlement.');
  const view = getProgressionObservation(state, factionId);
  if (view.project.blockers.length) return fail(view.project.blockers.join(' '));
  if (!view.project.eligibleSettlementIds.includes(settlementId)) return fail('The host needs a market and archive and must be free of siege and occupation.');
  const faction = state.factions.find(item => item.id === factionId);
  if (!faction) return fail('Unknown faction.');
  faction.treasury -= view.project.coinCost;
  const project: VictoryProject = { id: `project.${state.nextId++}`, projectId: PROSPERITY_PROJECT.id, factionId, settlementId, settlementName: town.name, cell: town.cell, startedTurn: state.turn, progress: 0, requiredTurns: view.project.activeTurns, status: 'active', statusReason: null };
  state.projects = [...state.projects.filter(item => item.factionId !== factionId || !isProsperity(item)), project].sort((a, b) => a.id < b.id ? -1 : 1);
  return { ok: true, events: publicEvent(state, project, 'victory_project_started', `${faction.name} committed ${view.project.coinCost} coin to the ${PROSPERITY_PROJECT.name} at ${town.name}, hex ${town.cell}. Completion requires ${project.requiredTurns} active turns.`) };
}
/** Reconcile immediately after conquest or blockade commands; no turn progress here. */
export function reconcileProjects(state: GameState, events: DomainEvent[]): void {
  if (state.victory || !state.projects.some(ongoing)) return;
  const towns = infrastructure(state), standing = hearthCounts(state);
  for (const project of state.projects) {
    if (!ongoing(project)) continue;
    if (isUnification(project)) { endLostUnification(state, project, standing, events); continue; }
    const attunement = isAttunement(project), name = attunement ? ATTUNEMENT_VICTORY.name : PROSPERITY_PROJECT.name;
    const host = state.settlements[project.settlementId];
    if (!host || host.factionId !== project.factionId) {
      project.status = 'cancelled'; project.statusReason = attunement ? ATTUNEMENT_HOST_LOST : 'The host settlement was conquered or razed; the committed coin is lost.';
      events.push(...publicEvent(state, project, 'victory_project_cancelled', `${name} at ${project.settlementName} was cancelled after its host was conquered or razed. No ${attunement ? 'knowledge' : 'coin'} was refunded.`));
      continue;
    }
    const reason = attunement ? attunementPauseReason(state, project) : projectPauseReason(state, project, towns); const status = reason ? 'paused' : 'active';
    if (project.status !== status || project.statusReason !== reason) events.push(...publicEvent(state, project, reason ? 'victory_project_paused' : 'victory_project_resumed', `${name} at ${project.settlementName} ${reason ? 'paused: ' + reason : 'resumed.'}`));
    project.status = status; project.statusReason = reason;
  }
}
/** Rules 38: a sealed working advances like a Prosperity project, on turns its
 * seams, host and caster all hold. */
function advanceAttunement(state: GameState, events: DomainEvent[]): void {
  for (const project of state.projects) {
    if (project.status !== 'active' || !isAttunement(project)) continue;
    project.progress++;
    events.push(...publicEvent(state, project, 'victory_project_progress', `${ATTUNEMENT_VICTORY.name} at ${project.settlementName} completed active turn ${project.progress} of ${project.requiredTurns}.`));
    if (project.progress === project.requiredTurns) {
      project.status = 'completed';
      state.victory = { path: 'attunement', factionId: project.factionId, projectId: project.id, settlementId: project.settlementId, turn: state.turn };
      const faction = state.factions.find(item => item.id === project.factionId);
      events.push(...publicEvent(state, project, 'campaign_victory', `${faction?.name ?? project.factionId} achieved ${ATTUNEMENT_VICTORY.name} by sealing the working at ${project.settlementName} on turn ${state.turn}.`));
      return;
    }
  }
}
function endLostUnification(state: GameState, project: VictoryProject, standing: ReturnType<typeof hearthCounts>, events: DomainEvent[]): void {
  const hostHeld = state.settlements[project.settlementId]?.factionId === project.factionId;
  const reason = !hostHeld ? HOST_FELL : unificationBlockers(state, project.factionId, standing).length ? majorityLost(state) : null;
  if (!reason) return;
  project.status = 'cancelled'; project.statusReason = reason;
  events.push(...publicEvent(state, project, 'victory_project_cancelled', `${UNIFICATION_VICTORY.name} bid from ${project.settlementName} ended: ${reason}`));
}
/** Rules 19: ongoing bids advance while the majority and host hold; a realm that
 * newly holds the majority opens a public bid at its capital. */
function advanceUnification(state: GameState, events: DomainEvent[]): void {
  const standing = hearthCounts(state);
  for (const project of state.projects) {
    if (!isUnification(project) || project.status !== 'active') continue;
    endLostUnification(state, project, standing, events);
    if (project.status !== 'active') continue;
    project.progress++;
    events.push(...publicEvent(state, project, 'victory_project_progress', `${UNIFICATION_VICTORY.name} bid from ${project.settlementName} held for ${project.progress} of ${project.requiredTurns} turns.`));
    if (project.progress === project.requiredTurns) {
      project.status = 'completed';
      state.victory = { path: 'unification', factionId: project.factionId, projectId: project.id, settlementId: project.settlementId, turn: state.turn };
      const faction = state.factions.find(item => item.id === project.factionId);
      events.push(...publicEvent(state, project, 'campaign_victory', `${faction?.name ?? project.factionId} achieved Unification, holding ${standing.counts.get(project.factionId) ?? 0} of ${standing.total} hearths through turn ${state.turn}.`));
      return;
    }
  }
  for (const faction of state.factions) {
    if (state.projects.some(project => project.factionId === faction.id && isUnification(project) && project.status === 'active') || unificationBlockers(state, faction.id, standing).length) continue;
    const capital = state.settlements[state.land.capitals[faction.id]!]!;
    const project: VictoryProject = { id: `project.${state.nextId++}`, projectId: UNIFICATION_VICTORY.id, factionId: faction.id, settlementId: capital.id, settlementName: capital.name, cell: capital.cell, startedTurn: state.turn, progress: 0, requiredTurns: campaignProfile(state).projectActiveTurns, status: 'active', statusReason: null };
    state.projects = [...state.projects.filter(item => item.factionId !== faction.id || !isUnification(item)), project].sort((a, b) => a.id < b.id ? -1 : 1);
    events.push(...publicEvent(state, project, 'victory_project_started', `${faction.name} claims ${UNIFICATION_VICTORY.name}, holding ${standing.counts.get(faction.id) ?? 0} of ${standing.total} hearths. Keeping that hold and ${capital.name} for ${project.requiredTurns} turns unites the world.`));
  }
}
export function advanceProgression(state: GameState, events: DomainEvent[]): void {
  reconcileProjects(state, events);
  // Latest-project records are bounded by faction count; ID order breaks simultaneous finishes.
  for (const project of state.projects) {
    if (project.status !== 'active' || !isProsperity(project)) continue;
    project.progress++;
    events.push(...publicEvent(state, project, 'victory_project_progress', `${PROSPERITY_PROJECT.name} at ${project.settlementName} completed active turn ${project.progress} of ${project.requiredTurns}.`));
    if (project.progress === project.requiredTurns) {
      project.status = 'completed';
      state.victory = { path: 'prosperity', factionId: project.factionId, projectId: project.id, settlementId: project.settlementId, turn: state.turn };
      const faction = state.factions.find(item => item.id === project.factionId);
      events.push(...publicEvent(state, project, 'campaign_victory', `${faction?.name ?? project.factionId} achieved Prosperity by completing the ${PROSPERITY_PROJECT.name} at ${project.settlementName} on turn ${state.turn}.`));
      break;
    }
  }
  if (!state.victory && rulesVersion(state) >= 38) advanceAttunement(state, events);
  if (!state.victory && rulesVersion(state) >= 19) advanceUnification(state, events);
}
/** Historical envelopes and rules never carry the third path or deepened paths. */
export function assertNoAttunement(state: GameState): void {
  if (state.victory?.path === 'attunement' || state.projects.some(isAttunement) || Object.values(state.characters).some(character => character.learnedSkillIds.some(id => id === 'skill.flame_deepening' || id === 'skill.rune_deepening'))) throw new Error('This campaign has attunement content unavailable in historical rules.');
}
export function validateProgression(state: GameState): void {
  const assert = (ok: unknown, reason: string): void => { if (!ok) throw new Error('Invalid save: ' + reason); };
  const owners = new Set(state.factions.map(item => item.id));
  assert(Object.keys(state.progression).length === owners.size && Object.keys(state.progression).every(id => owners.has(id)), 'progression must cover exactly the campaign factions');
  for (const progress of Object.values(state.progression)) {
    assert(progress.technologies.every((id, i) => technologiesForRules(rulesVersion(state)).some(item => item.id === id && item.requires.every(required => progress.technologies.includes(required))) && (i === 0 || id > (progress.technologies[i - 1] ?? ''))), 'invalid, duplicate or unordered researched technology');
    assert(progress.institutionId === null || INSTITUTIONS.some(item => item.id === progress.institutionId), 'unknown institution');
    assert(progress.doctrineId === null || DOCTRINES.some(item => item.id === progress.doctrineId), 'unknown doctrine');
  }
  const projectOwners = new Set<string>(); const towns = infrastructure(state);
  for (const [index, project] of state.projects.entries()) {
    // One record per realm and victory path: its latest Prosperity project and, from rules 19, its latest Unification bid.
    const owner = project.factionId + ':' + project.projectId;
    assert(owners.has(project.factionId) && !projectOwners.has(owner), 'project ownership must be known and unique'); projectOwners.add(owner);
    assert(/^project\.[1-9][0-9]*$/.test(project.id) && Number(project.id.slice(8)) < state.nextId && (index === 0 || project.id > (state.projects[index - 1]?.id ?? '')), 'invalid project identity or order');
    assert(/^settlement\.[1-9][0-9]*$/.test(project.settlementId) && Number(project.settlementId.slice(11)) < state.nextId, 'invalid project settlement reference');
    assert((isProsperity(project) || isUnification(project) && rulesVersion(state) >= 19 || isAttunement(project) && rulesVersion(state) >= 38) && project.requiredTurns === campaignProfile(state).projectActiveTurns && project.startedTurn <= state.turn && project.progress <= state.turn - project.startedTurn && project.progress <= project.requiredTurns, 'invalid project definition or progress');
    assert(project.cell < state.world.width * state.world.height && isPassable(state.world.terrain[project.cell] ?? 0), 'invalid public project location');
    const host = state.settlements[project.settlementId];
    if (project.status !== 'cancelled') assert(host && host.factionId === project.factionId && host.cell === project.cell && host.name === project.settlementName, 'project host ownership or location disagrees');
    if (isUnification(project)) {
      // A bid never pauses. Its majority is re-tested at each round's end, so a
      // mid-round save may hold an active bid whose majority a new hearth just diluted.
      if (ongoing(project)) assert(project.status === 'active' && project.statusReason === null && project.progress < project.requiredTurns, 'unification bids are active or ended');
      if (project.status === 'cancelled') assert((project.statusReason === HOST_FELL || project.statusReason === MAJORITY_LOST || project.statusReason === MAJORITY_LOST_V20) && project.progress < project.requiredTurns, 'invalid ended unification bid');
      if (project.status === 'completed') assert(state.victory?.projectId === project.id && state.victory.path === 'unification' && project.progress === project.requiredTurns && project.statusReason === null, 'completed bid requires a unification victory');
      continue;
    }
    if (isAttunement(project)) {
      if (ongoing(project)) { const reason = attunementPauseReason(state, project); assert(project.status === (reason ? 'paused' : 'active') && project.statusReason === reason && project.progress < project.requiredTurns, 'attunement pause state disagrees with its requirements'); }
      if (project.status === 'cancelled') assert(project.statusReason === ATTUNEMENT_HOST_LOST && project.progress < project.requiredTurns, 'invalid cancelled attunement');
      if (project.status === 'completed') assert(state.victory?.projectId === project.id && state.victory.path === 'attunement' && project.progress === project.requiredTurns && project.statusReason === null && attunementPauseReason(state, project) === null, 'completed attunement requires a valid victory');
      continue;
    }
    if (ongoing(project)) { const reason = projectPauseReason(state, project, towns); assert(project.status === (reason ? 'paused' : 'active') && project.statusReason === reason && project.progress < project.requiredTurns, 'project pause state disagrees with its requirements'); }
    if (project.status === 'cancelled') assert(project.statusReason === 'The host settlement was conquered or razed; the committed coin is lost.' && project.progress < project.requiredTurns, 'invalid cancelled project');
    if (project.status === 'completed') assert(state.victory?.projectId === project.id && state.victory.path === 'prosperity' && project.progress === project.requiredTurns && project.statusReason === null && projectPauseReason(state, project, towns) === null, 'completed project requires a valid victory');
  }
  if (state.victory) assert(owners.has(state.victory.factionId) && state.victory.turn === state.turn && !state.battle && !state.pendingCapture && state.projects.some(project => project.id === state.victory?.projectId && project.factionId === state.victory.factionId && project.settlementId === state.victory.settlementId && project.status === 'completed'), 'victory lacks a completed project or conflicts with pending decisions');
}
