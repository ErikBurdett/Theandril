import { PROSPERITY_PROJECT } from '@theandril/content';
import type { GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

export interface ProgressionPlan extends AiPlan { coinSpent: number; reserve: number }

/** Observed eligibility is authoritative; costs are budgeted before settlement orders. */
export function planProgression(view: Observation): ProgressionPlan {
  const commands: GameCommand[] = [];
  const reasons: string[] = [];
  const ownTowns = view.settlements.filter(town => town.factionId === view.factionId);
  const progression = view.progression;
  const project = progression.project;
  const host = project.eligibleSettlementIds[0];
  if (host && project.blockers.length === 0) {
    return { commands: [{ type: 'startVictoryProject', factionId: view.factionId, settlementId: host }], reasons: [`Begin ${project.name} at ${host}: infrastructure, progression and ${project.coinCost} coin are ready.`], coinSpent: project.coinCost, reserve: 0 };
  }
  const technology = progression.technologyChoices.find(choice => choice.id === 'technology.cinder_masonry' && choice.available)
    ?? progression.technologyChoices.find(choice => choice.id === 'technology.civic_accounts' && choice.available);
  if (technology) {
    commands.push({ type: 'research', factionId: view.factionId, technologyId: technology.id });
    reasons.push(`Research ${technology.name} to improve the economic foundation for Prosperity.`);
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
  const fieldArmies = view.armies.filter(army => army.factionId === view.factionId && army.canAttack && !army.canFound && army.formations.length >= 2);
  const needsSpecialists = living.length < 6 && view.characterRecruitment.some(choice => choice.canRecruit
    && (choice.role === 'marshal' && living.filter(character => character.role === 'marshal').length < Math.min(3, fieldArmies.length)
      || choice.role === 'engineer' && living.filter(character => character.role === 'engineer').length < Math.min(2, Math.ceil(fieldArmies.length / 3)))
    && fieldArmies.some(army => army.cell === view.settlements.find(town => town.id === choice.settlementId)?.cell
      && (choice.role === 'marshal' ? !army.commander : army.agents.length < 2)));
  const operatingPurse = Math.min(needsSpecialists ? 48 : 24, Math.floor(budget / 4));
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
