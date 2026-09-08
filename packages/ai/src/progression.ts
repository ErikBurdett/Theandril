import { BATTLE_SPELLS, IMPROVEMENTS, PROSPERITY_PROJECT } from '@theandril/content';
import { hexDistance, neighbors } from '@theandril/mapgen';
import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';
import { needsNavalInvestment, navalResearchChoice } from './naval';
import { landPlanningTowns } from './observation-options';
import { isWaykeeperBattleArmy } from './characters';

export interface ProgressionPlan extends AiPlan { coinSpent: number; reserve: number }

export const MAX_PROJECT_HOSTS = 64;
export const MAX_PROJECT_THREATS = 64;
export interface ProjectHostAssessment {
  settlementId: string; cell: number; enemyPressure: number; friendlySupport: number;
  uncoveredPressure: number; nearestThreat: number; friendlyDepth: number;
}
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const spellsById = new Map(BATTLE_SPELLS.map(spell => [spell.id, spell]));

/** Bounded owned-land assessment: research responds to usable sites, not hidden geography. */
function landResearch(view: Observation) {
  const towns = landPlanningTowns(view.land.settlements, view.turn);
  const sites = towns.flatMap(town => town.cells.filter(cell => cell.claimed && cell.canWork));
  const scores = new Map<string, number>();
  for (const improvement of IMPROVEMENTS) {
    if (!improvement.requiredTechnologies) continue;
    const matches = sites.filter(cell => improvement.sites.some(site => site.terrainIds.includes(cell.terrain)
      && (!site.biomeIds || site.biomeIds.includes(cell.biome))
      // canWork excludes deep ocean; these authored maritime sites require shallows.
      && (!site.requiredFeatures || (cell.features & site.requiredFeatures) === site.requiredFeatures)
      && (!site.forbiddenFeatures || !(cell.features & site.forbiddenFeatures))));
    for (const technology of improvement.requiredTechnologies) scores.set(technology, (scores.get(technology) ?? 0) + matches.length * 3);
  }
  const frontier = towns.filter(town => town.borderExpansion.nextCell !== null && town.borderExpansion.rate > 0).length;
  scores.set('technology.surveyed_estates', frontier * 4);
  // Stewardship opens several dependent techniques, even without a local spring.
  scores.set('technology.stewardship', (scores.get('technology.stewardship') ?? 0) + frontier + (scores.get('technology.waterworks') ?? 0) + (scores.get('technology.charter_forestry') ?? 0));
  return view.progression.technologyChoices.filter(choice => choice.available && (scores.get(choice.id) ?? 0) > 0)
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || a.knowledgeCost - b.knowledgeCost || byId(a, b))[0];
}
/** Even geographic sampling bounds comparison work without privileging early numeric IDs. */
function sampleGeography<T extends { id: string; cell: number }>(items: T[], limit: number): T[] {
  const sorted = [...items].sort((a, b) => a.cell - b.cell || byId(a, b));
  return sorted.length <= limit ? sorted : Array.from({ length: limit }, (_, i) => sorted[Math.floor(i * (sorted.length - 1) / (limit - 1))]!);
}

/** Heuristic safety, not a promise of unreachable terrain or knowledge of unseen armies. */
export function assessProjectHosts(view: Observation): ProjectHostAssessment[] {
  const eligible = new Set(view.progression.project.eligibleSettlementIds);
  const ownTowns = view.settlements.filter(town => town.factionId === view.factionId);
  const hosts = sampleGeography(ownTowns.filter(town => eligible.has(town.id)), MAX_PROJECT_HOSTS);
  if (!hosts.length) return [];
  const enemies = new Set(view.wars);
  const hostileArmies = view.armies.filter(army => enemies.has(army.factionId) && army.domain !== 'naval' && !army.carrierId && army.canAttack)
    .sort((a, b) => b.strength - a.strength || byId(a, b));
  const hostileTowns = view.settlements.filter(town => enemies.has(town.factionId));
  // Reserve up to sixteen geographic frontier references; prioritize the strongest known
  // field threats within the remaining total64. Missing distant threats remain unknown risk.
  const townLimit = Math.min(hostileTowns.length, Math.max(16, MAX_PROJECT_THREATS - hostileArmies.length));
  const threats = [...hostileArmies.slice(0, MAX_PROJECT_THREATS - townLimit).map(army => ({ cell: army.cell, strength: army.strength })),
    ...sampleGeography(hostileTowns, townLimit).map(town => ({ cell: town.cell, strength: 0 }))];
  const friendlyTowns = sampleGeography(ownTowns, MAX_PROJECT_HOSTS);
  const supportByCell = new Map<number, number>();
  for (const army of view.armies) if (army.factionId === view.factionId && army.domain !== 'naval' && !army.carrierId && army.canAttack) supportByCell.set(army.cell, (supportByCell.get(army.cell) ?? 0) + army.strength);
  return hosts.map(host => {
    let enemyPressure = 0, nearestThreat = 24, friendlySupport = supportByCell.get(host.cell) ?? 0;
    for (const threat of threats) {
      const distance = hexDistance(host.cell, threat.cell, view.width);
      nearestThreat = Math.min(nearestThreat, distance);
      if (distance <= 6) enemyPressure += Math.ceil(threat.strength * (7 - distance) / 7);
    }
    const supportCells = new Set([host.cell]); let frontier = [host.cell];
    for (let ring = 1; ring <= 2; ring++) {
      const next: number[] = [];
      for (const cell of frontier) for (const adjacent of neighbors(cell, view.width, view.height)) if (!supportCells.has(adjacent)) {
        supportCells.add(adjacent); next.push(adjacent);
        friendlySupport += Math.floor((supportByCell.get(adjacent) ?? 0) / (ring + 1));
      }
      frontier = next;
    }
    const friendlyDepth = friendlyTowns.reduce((sum, town) => sum + Math.max(0, 9 - hexDistance(host.cell, town.cell, view.width)), 0);
    return { settlementId: host.id, cell: host.cell, enemyPressure, friendlySupport, uncoveredPressure: Math.max(0, enemyPressure - friendlySupport), nearestThreat, friendlyDepth };
  }).sort((a, b) => a.uncoveredPressure - b.uncoveredPressure || b.nearestThreat - a.nearestThreat || b.friendlyDepth - a.friendlyDepth || b.friendlySupport - a.friendlySupport || byId({ id: a.settlementId }, { id: b.settlementId }));
}

/** Observed eligibility is authoritative; costs are budgeted before settlement orders. */
export function planProgression(view: Observation): ProgressionPlan {
  const commands: GameCommand[] = [];
  const reasons: string[] = [];
  const ownTowns = view.settlements.filter(town => town.factionId === view.factionId);
  const progression = view.progression;
  const project = progression.project;
  const host = project.blockers.length === 0 && project.eligibleSettlementIds.length ? assessProjectHosts(view)[0] : undefined;
  if (host && project.blockers.length === 0) {
    return { commands: [{ type: 'startVictoryProject', factionId: view.factionId, settlementId: host.settlementId }], reasons: [`Begin ${project.name} at ${host.settlementId}: infrastructure, progression and ${project.coinCost} coin are ready. Prefer observed safety: ${host.uncoveredPressure} uncovered nearby enemy strength, friendly support ${host.friendlySupport}, known hostile distance ${host.nearestThreat}, friendly depth ${host.friendlyDepth}.`], coinSpent: project.coinCost, reserve: 0 };
  }
  const maritimeGoal = navalResearchChoice(view);
  const technology = progression.technologyChoices.find(choice => choice.id === 'technology.cinder_masonry' && choice.available)
    // Save toward a real maritime breakpoint even before its price is affordable.
    // Otherwise repeated cheaper purchases can indefinitely starve a paid ferry's
    // deep-water access. The naval planner still requires its authoritative quote.
    ?? (maritimeGoal ? undefined : progression.technologyChoices.find(choice => choice.id === 'technology.civic_accounts' && choice.available) ?? landResearch(view));
  if (maritimeGoal && !maritimeGoal.available) reasons.push(`Save knowledge for ${maritimeGoal.name}: ${view.knowledge}/${maritimeGoal.knowledgeCost}; an observed maritime expedition needs this next link.`);
  if (technology) {
    commands.push({ type: 'research', factionId: view.factionId, technologyId: technology.id });
    reasons.push(`Research ${technology.name} for the economy and the settlement sites currently observed; spend ${technology.knowledgeCost} knowledge.`);
  }
  // Arcane Theory remains a separate national purchase and is useful only with
  // an actual personally gifted officer. Do not divert reserved sea research.
  if (!technology && !maritimeGoal && view.characters.some(character => !character.dead && character.role === 'waykeeper')) {
    const casters = new Map(view.characters.filter(character => !character.dead && character.role === 'waykeeper').map(character => [character.id, character]));
    const discovery = view.arcaneResearch.choices.find(choice => choice.canResearch && choice.casters.some(caster => {
      const aptitudes = casters.get(caster.characterId)?.aptitudes;
      return choice.spellIds.some(id => { const spell = spellsById.get(id); return spell && (aptitudes?.[spell.pathId] ?? 0) >= spell.pathLevel; });
    }));
    if (discovery) { commands.push({ type: 'researchArcane', factionId: view.factionId, discoveryId: discovery.id }); reasons.push(`Research ${discovery.name} for the realm’s appointed Waykeeper; personal aptitude and battlefield strain remain required.`); }
  }
  let budget = view.treasury;
  if (!progression.institutionId && ownTowns.length > 0) {
    const institution = progression.institutionChoices.find(choice => choice.id === 'institution.charter_compact' && choice.available);
    if (institution && budget >= institution.coinCost + 16) {
      commands.push({ type: 'adoptInstitution', factionId: view.factionId, institutionId: institution.id });
      budget -= institution.coinCost;
      reasons.push(`Adopt ${institution.name} while preserving a caravan's funding.`);
    }
  }
  const infrastructure = ownTowns.filter(town => PROSPERITY_PROJECT.requiredBuildings.every(id => town.buildings.includes(id)));
  const developed = infrastructure.length >= PROSPERITY_PROJECT.settlementCount;
  const projectUnderway = view.projects.some(item => item.factionId === view.factionId && (item.status === 'active' || item.status === 'paused'));
  // A bounded operating purse keeps expansion/defense alive during a long savings campaign.
  // Near the actual observed target, close the remaining gap before optional spending resumes.
  // A paid marshal costs 32: an always-24 purse would permanently exclude this new
  // capability once infrastructure is complete. This spends real treasury, not income.
  const living = view.characters.filter(character => !character.dead);
  const fieldArmies = view.armies.filter(army => army.factionId === view.factionId && !army.carrierId && army.canAttack && !army.canFound && army.formations.length >= 2);
  const needsSpecialists = living.length < 6 && view.characterRecruitment.some(choice => choice.canRecruit
    && (choice.role === 'marshal' && living.filter(character => character.role === 'marshal').length < Math.min(3, fieldArmies.length)
      || choice.role === 'engineer' && living.filter(character => character.role === 'engineer').length < Math.min(2, Math.ceil(fieldArmies.length / 3))
      || choice.role === 'waykeeper' && view.wars.length > 0 && !living.some(character => character.role === 'waykeeper') && fieldArmies.some(isWaykeeperBattleArmy) && view.arcaneResearch.choices.some(choice => choice.canResearch || choice.researched))
    && fieldArmies.some(army => army.cell === view.settlements.find(town => town.id === choice.settlementId)?.cell && (choice.role !== 'waykeeper' || isWaykeeperBattleArmy(army))
      && (choice.role === 'marshal' ? !army.commander : army.agents.length < 2)));
  const navalInvestment = needsNavalInvestment(view) && view.productionOptions.some(option => (option.kind === 'naval' || option.itemId === 'building.harbor' || option.itemId === 'unit.colonist') && option.canQueue);
  const operatingPurse = Math.min(navalInvestment ? 64 : needsSpecialists ? 48 : 24, Math.floor(budget / 4));
  const reserve = developed && !projectUnderway
    ? Math.min(project.coinCost, budget >= Math.floor(project.coinCost * 9 / 10) ? project.coinCost : Math.max(0, budget - operatingPurse)) : 0;
  if (!progression.doctrineId && ownTowns.length >= 2) {
    const preference = view.wars.length ? 'doctrine.shield_cohesion' : 'doctrine.march_columns';
    const doctrine = progression.doctrineChoices.find(choice => choice.id === preference && choice.available);
    if (doctrine && budget >= doctrine.coinCost + Math.max(reserve, 32)) {
      commands.push({ type: 'adoptDoctrine', factionId: view.factionId, doctrineId: doctrine.id });
      budget -= doctrine.coinCost;
      reasons.push(`Adopt ${doctrine.name} for ${view.wars.length ? 'the current war' : 'expansion and reinforcement'}.`);
    }
  }
  if (developed && !projectUnderway && budget < project.coinCost) reasons.push(`Reserve coin for ${project.name}: ${budget}/${project.coinCost}; retain a bounded operating purse until the final funding gap.`);
  return { commands, reasons, coinSpent: view.treasury - budget, reserve };
}
