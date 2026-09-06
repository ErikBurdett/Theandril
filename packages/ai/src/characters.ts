import { hexDistance } from '@theandril/mapgen';
import type { ArmyView, GameCommand, Observation } from '@theandril/sim';
import type { AiPlan } from './diplomacy';

export interface CharacterPlan extends AiPlan { coinSpent: number; heldArmyIds: Set<string> }
const byId = (a: { id: string }, b: { id: string }) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Sparse functional planner: eligibility comes from sim, priority only from observed facts. */
export function planCharacters(view: Observation, coinBudget: number): CharacterPlan {
  const commands: GameCommand[] = [], reasons: string[] = [];
  const heldArmyIds = new Set(view.characters.flatMap(character => character.mission ? [character.mission.armyId] : []));
  const initialBudget = Math.max(0, coinBudget);
  const result = (): CharacterPlan => ({ commands, reasons, coinSpent: initialBudget - budget, heldArmyIds });
  let budget = initialBudget;
  if (view.victory || view.battle || view.pendingCapture) return result();
  const living = view.characters.filter(character => !character.dead).sort(byId);
  const own = view.armies.filter(army => army.factionId === view.factionId);
  const armies = new Map(own.map(army => [army.id, army]));
  const wars = new Set(view.wars);
  const threats = view.armies.filter(army => wars.has(army.factionId));
  const besiegers = new Set(view.sieges.filter(siege => siege.factionId === view.factionId).map(siege => siege.armyId));
  const exposed = (army: ArmyView): boolean => threats.some(enemy => hexDistance(enemy.cell, army.cell, view.width) <= 3 && enemy.strength >= army.strength);
  const marshals = new Set(own.filter(army => army.commander).map(army => army.id));
  const companions = new Map(own.map(army => [army.id, army.agents.length]));
  const useful = (army: ArmyView): boolean => !army.carrierId && army.canAttack && !army.canFound && !exposed(army);
  const priority = (army: ArmyView, role: string): number => role === 'marshal'
    ? army.formations.length * 100 + army.strength
    : role === 'engineer' ? (army.maxStrength - army.strength) * 4 + army.formations.length * 30
      : (army.formations.length === 1 ? 100 : 0) + army.maxMovement * 10;
  for (const character of living.slice(0, 64)) {
    if (commands.length >= 6) break;
    const carrier = character.location?.kind === 'army' ? armies.get(character.location.armyId) : undefined;
    if (character.mission) {
      if (carrier && exposed(carrier)) {
        commands.push({ type: 'cancelCharacterMission', factionId: view.factionId, characterId: character.id });
        reasons.push(`${character.name} abandons exposed field work so the escort can withdraw on a fresh plan.`);
      }
      continue;
    }
    if (character.woundedTurns) continue;
    const preference = character.role === 'marshal' ? view.wars.length ? 'skill.steadfast' : 'skill.decisive'
      : character.role === 'engineer' && view.sieges.some(siege => siege.factionId === view.factionId) ? 'skill.siegecraft' : 'skill.fieldcraft';
    const trainingPriority = (option: typeof character.promotions[number]): number => option.skillId === preference ? 100
      : option.branch === 'command' ? carrier && carrier.formations.length >= carrier.formationCapacity - 2 ? 90 : 30
      : option.branch === 'battlecraft' ? 60 : 50;
    const promotion = character.promotions.filter(option => option.canPromote).sort((a, b) => trainingPriority(b) - trainingPriority(a) || a.tier - b.tier || (a.skillId < b.skillId ? -1 : 1))[0];
    if (promotion) {
      commands.push({ type: 'promoteCharacter', factionId: view.factionId, characterId: character.id, skillId: promotion.skillId });
      if (carrier) heldArmyIds.add(carrier.id);
      reasons.push(`${character.name} spends earned experience on ${promotion.name}.`);
      continue; // Mission effects must be assessed from the upgraded read model.
    }
    if (!carrier) {
      const targets = character.assignmentOptions.filter(option => option.canAssign).flatMap(option => {
        const army = armies.get(option.armyId);
        return army && useful(army) && (character.role === 'marshal' || army.domain === 'land') && !heldArmyIds.has(army.id) && !besiegers.has(army.id)
          && (character.role === 'marshal' ? !marshals.has(army.id) : (companions.get(army.id) ?? 0) < 2) ? [army] : [];
      }).sort((a, b) => priority(b, character.role) - priority(a, character.role) || byId(a, b));
      const target = targets[0];
      if (target) {
        commands.push({ type: 'assignCharacter', factionId: view.factionId, characterId: character.id, armyId: target.id });
        heldArmyIds.add(target.id);
        if (character.role === 'marshal') marshals.add(target.id); else companions.set(target.id, (companions.get(target.id) ?? 0) + 1);
        reasons.push(`${character.name} joins the co-located ${target.name}; reassess its orders after attachment.`);
      }
      continue;
    }
    if (heldArmyIds.has(carrier.id) || exposed(carrier) || carrier.carrierId || carrier.domain === 'naval') continue;
    const mission = character.missions.filter(option => option.canStart && option.coinCost <= budget).sort((a, b) => {
      const score = (id: string) => id === 'mission.sabotage' ? 3 : id === 'mission.refit' ? 2 : 1;
      return score(b.missionId) - score(a.missionId);
    }).find(option => option.missionId === 'mission.sabotage'
      || option.missionId === 'mission.refit' && carrier.maxStrength - carrier.strength >= Math.min(10, Math.ceil(carrier.maxStrength / 5))
      || option.missionId === 'mission.survey' && !besiegers.has(carrier.id));
    if (mission) {
      commands.push({ type: 'startCharacterMission', factionId: view.factionId, characterId: character.id, missionId: mission.missionId,
        ...(mission.targetCell === undefined ? {} : { targetCell: mission.targetCell }), ...(mission.settlementId === undefined ? {} : { settlementId: mission.settlementId }) });
      budget -= mission.coinCost; heldArmyIds.add(carrier.id);
      reasons.push(`${character.name} commits ${mission.coinCost} coin and ${mission.duration} stationary turns to ${mission.name}: ${mission.effectText}`);
    }
  }
  // At most six appointed specialists initially: retain room for armies and long-term investment.
  if (living.length >= 6 || commands.length >= 6) return result();
  const counts = new Map(['marshal', 'surveyor', 'engineer'].map(role => [role, living.filter(character => character.role === role).length]));
  const fieldArmies = own.filter(army => useful(army) && army.formations.length >= 2);
  const desired = new Map([['marshal', Math.min(3, fieldArmies.length)], ['surveyor', 1], ['engineer', fieldArmies.length ? Math.min(2, Math.ceil(fieldArmies.length / 3)) : 0]]);
  const rolePriority = ['marshal', 'engineer', 'surveyor'];
  const opportunities = view.characterRecruitment.filter(option => option.canRecruit && option.coinCost <= budget && (counts.get(option.role) ?? 0) < (desired.get(option.role) ?? 0))
    .sort((a, b) => rolePriority.indexOf(a.role) - rolePriority.indexOf(b.role) || (a.settlementId < b.settlementId ? -1 : a.settlementId > b.settlementId ? 1 : 0));
  for (const option of opportunities) {
    const town = view.settlements.find(town => town.id === option.settlementId);
    if (!town) continue;
    const candidate = own.filter(army => army.cell === town.cell && army.domain === 'land' && useful(army) && !besiegers.has(army.id) && !heldArmyIds.has(army.id)
      && (option.role === 'marshal' ? army.formations.length >= 2 && !marshals.has(army.id) : (companions.get(army.id) ?? 0) < 2))
      .sort((a, b) => priority(b, option.role) - priority(a, option.role) || byId(a, b))[0];
    if (!candidate) continue;
    commands.push({ type: 'recruitCharacter', factionId: view.factionId, settlementId: option.settlementId, definitionId: option.definitionId });
    budget -= option.coinCost; heldArmyIds.add(candidate.id);
    reasons.push(`Appoint ${option.name} at ${town.name} for the waiting ${candidate.name}; pay ${option.coinCost} coin and ${option.upkeep} recurring upkeep.`);
    break; // A fresh view supplies the new stable character ID.
  }
  return result();
}
