import { z } from 'zod';
import { CAMPAIGN_PACES, LEGACY_CAMPAIGN_PACES, SCHEMA8_CAMPAIGN_PACES, SCHEMA17_CAMPAIGN_PACES, DOCTRINES, INSTITUTIONS, PROSPERITY_PROJECT, technologiesForRules, technologyBranch, type ResearchBranch } from '@theandril/content';
import { isPassable } from '@theandril/mapgen';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';

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
export const victorySchema = z.object({ path: z.literal('prosperity'), factionId: id, projectId: id, settlementId: id, turn }).strict();
export type Victory = z.infer<typeof victorySchema>;
interface Choice { id: string; name: string; description: string; available: boolean; blocker: string | null }
export interface ProgressionObservation extends FactionProgression {
  technologyChoices: (Choice & { knowledgeCost: number; requires: string[]; branch: ResearchBranch })[];
  institutionChoices: (Choice & { coinCost: number })[];
  doctrineChoices: (Choice & { coinCost: number })[];
  project: { id: string; name: string; description: string; coinCost: number; activeTurns: number; eligibleSettlementIds: string[]; blockers: string[] };
}
export const createFactionProgression = (): FactionProgression => ({ technologies: [], institutionId: null, doctrineId: null });
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const ongoing = (project: VictoryProject): boolean => project.status === 'active' || project.status === 'paused';
const campaignProfile = (state: GameState) => (rulesVersion(state) < 8 ? LEGACY_CAMPAIGN_PACES : rulesVersion(state) === 8 ? SCHEMA8_CAMPAIGN_PACES : rulesVersion(state) < 18 ? SCHEMA17_CAMPAIGN_PACES : CAMPAIGN_PACES)[state.pace];

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
  if (state.projects.some(project => project.factionId === factionId && ongoing(project))) blockers.push('This faction already has an ongoing Hearth Exchange.');
  if (faction.treasury < pace.projectCoinCost) blockers.push(`Requires ${pace.projectCoinCost} coin upfront; cancellation gives no refund.`);
  const eligible = (towns.get(factionId) ?? []).filter(id => !state.sieges[id]);
  if (!eligible.length) blockers.push('A prepared host settlement must be free of siege and occupation.');
  return { ...progress, technologies: [...progress.technologies], technologyChoices, institutionChoices, doctrineChoices,
    project: { id: PROSPERITY_PROJECT.id, name: PROSPERITY_PROJECT.name, description: PROSPERITY_PROJECT.description, coinCost: pace.projectCoinCost, activeTurns: pace.projectActiveTurns, eligibleSettlementIds: blockers.length ? [] : eligible, blockers } };
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
  state.projects = [...state.projects.filter(item => item.factionId !== factionId), project].sort((a, b) => a.id < b.id ? -1 : 1);
  return { ok: true, events: publicEvent(state, project, 'victory_project_started', `${faction.name} committed ${view.project.coinCost} coin to the ${PROSPERITY_PROJECT.name} at ${town.name}, hex ${town.cell}. Completion requires ${project.requiredTurns} active turns.`) };
}
/** Reconcile immediately after conquest or blockade commands; no turn progress here. */
export function reconcileProjects(state: GameState, events: DomainEvent[]): void {
  if (state.victory || !state.projects.some(ongoing)) return;
  const towns = infrastructure(state);
  for (const project of state.projects) {
    if (!ongoing(project)) continue;
    const host = state.settlements[project.settlementId];
    if (!host || host.factionId !== project.factionId) {
      project.status = 'cancelled'; project.statusReason = 'The host settlement was conquered or razed; the committed coin is lost.';
      events.push(...publicEvent(state, project, 'victory_project_cancelled', `${PROSPERITY_PROJECT.name} at ${project.settlementName} was cancelled after its host was conquered or razed. No coin was refunded.`));
      continue;
    }
    const reason = projectPauseReason(state, project, towns); const status = reason ? 'paused' : 'active';
    if (project.status !== status || project.statusReason !== reason) events.push(...publicEvent(state, project, reason ? 'victory_project_paused' : 'victory_project_resumed', `${PROSPERITY_PROJECT.name} at ${project.settlementName} ${reason ? 'paused: ' + reason : 'resumed.'}`));
    project.status = status; project.statusReason = reason;
  }
}
export function advanceProgression(state: GameState, events: DomainEvent[]): void {
  reconcileProjects(state, events);
  // Latest-project records are bounded by faction count; ID order breaks simultaneous finishes.
  for (const project of state.projects) {
    if (project.status !== 'active') continue;
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
    assert(owners.has(project.factionId) && !projectOwners.has(project.factionId), 'project ownership must be known and unique'); projectOwners.add(project.factionId);
    assert(/^project\.[1-9][0-9]*$/.test(project.id) && Number(project.id.slice(8)) < state.nextId && (index === 0 || project.id > (state.projects[index - 1]?.id ?? '')), 'invalid project identity or order');
    assert(/^settlement\.[1-9][0-9]*$/.test(project.settlementId) && Number(project.settlementId.slice(11)) < state.nextId, 'invalid project settlement reference');
    assert(project.projectId === PROSPERITY_PROJECT.id && project.requiredTurns === campaignProfile(state).projectActiveTurns && project.startedTurn <= state.turn && project.progress <= state.turn - project.startedTurn && project.progress <= project.requiredTurns, 'invalid project definition or progress');
    assert(project.cell < state.world.width * state.world.height && isPassable(state.world.terrain[project.cell] ?? 0), 'invalid public project location');
    const host = state.settlements[project.settlementId];
    if (project.status !== 'cancelled') assert(host && host.factionId === project.factionId && host.cell === project.cell && host.name === project.settlementName, 'project host ownership or location disagrees');
    if (ongoing(project)) { const reason = projectPauseReason(state, project, towns); assert(project.status === (reason ? 'paused' : 'active') && project.statusReason === reason && project.progress < project.requiredTurns, 'project pause state disagrees with its requirements'); }
    if (project.status === 'cancelled') assert(project.statusReason === 'The host settlement was conquered or razed; the committed coin is lost.' && project.progress < project.requiredTurns, 'invalid cancelled project');
    if (project.status === 'completed') assert(state.victory?.projectId === project.id && project.progress === project.requiredTurns && project.statusReason === null && projectPauseReason(state, project, towns) === null, 'completed project requires a valid victory');
  }
  if (state.victory) assert(owners.has(state.victory.factionId) && state.victory.turn === state.turn && !state.battle && !state.pendingCapture && state.projects.some(project => project.id === state.victory?.projectId && project.factionId === state.victory.factionId && project.settlementId === state.victory.settlementId && project.status === 'completed'), 'victory lacks a completed project or conflicts with pending decisions');
}
