// Frozen schema-4/5 compatibility planner captured 2026-09-05; never used by runtime AI.
import { evaluatePeaceOffer, type GameCommand, type Observation } from '@theandril/sim';

export interface AiPlan { commands: GameCommand[]; reasons: string[] }

export function protectedFactions(view: Observation): Set<string> {
  return new Set(view.diplomacy.treaties.filter(treaty => treaty.expiresTurn > view.turn)
    .flatMap(treaty => treaty.parties.filter(id => id !== view.factionId)));
}

/** One diplomatic decision per pass avoids planning attacks against a newly accepted peace. */
export function planDiplomacy(view: Observation): AiPlan | null {
  const incoming = [...view.diplomacy.offers].sort((a, b) => a.createdTurn - b.createdTurn || (a.id < b.id ? -1 : 1))
    .find(offer => offer.recipientId === view.factionId && offer.expiresTurn > view.turn && view.wars.includes(offer.proposerId));
  if (incoming) {
    const assessment = evaluatePeaceOffer(view, incoming);
    const accept = assessment.band === 'likely';
    return {
      commands: [{ type: 'respondPeace', factionId: view.factionId, offerId: incoming.id, accept }],
      reasons: [`${accept ? 'Accept' : 'Reject'} ${incoming.id}: ${[...assessment.reasons, ...assessment.objections].join(' ')}`],
    };
  }
  const own = view.armies.filter(army => army.factionId === view.factionId);
  const strength = own.reduce((sum, army) => sum + army.strength, 0);
  const exhausted = own.some(army => army.morale < 30 || army.fatigue > 65);
  const pending = new Set(view.diplomacy.offers.flatMap(offer => [offer.proposerId, offer.recipientId]));
  for (const enemyId of [...view.wars].sort().slice(0, 48)) {
    if (pending.has(enemyId)) continue;
    const memory = view.diplomacy.relations.find(relation => relation.parties.includes(enemyId));
    if (!memory || memory.warStartedTurn === null || view.turn - memory.lastOfferTurn < 3) continue;
    const duration = view.turn - memory.warStartedTurn;
    const seenStrength = view.armies.filter(army => army.factionId === enemyId).reduce((sum, army) => sum + army.strength, 0);
    const pressured = exhausted || seenStrength > strength;
    if (duration < 8 && !(duration >= 3 && pressured)) continue;
    // Preserve some treasury for upkeep and offer at most a quarter of available reserves.
    const offerCoin = pressured ? Math.min(40, Math.floor(Math.max(0, view.treasury - 8) / 4)) : 0;
    return {
      commands: [{ type: 'proposePeace', factionId: view.factionId, targetFactionId: enemyId, terms: { offerCoin, requestCoin: 0, truceTurns: 10 } }],
      reasons: [`Seek peace with ${enemyId}: ${pressured ? 'observed military pressure and recovery needs' : `${duration} turns of war`}; offer ${offerCoin} coin while preserving upkeep reserves.`],
    };
  }
  return null;
}
