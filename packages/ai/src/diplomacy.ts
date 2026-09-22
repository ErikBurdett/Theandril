import { evaluatePeaceOffer, isCityState, type GameCommand, type Observation } from '@theandril/sim';

export interface AiPlan { commands: GameCommand[]; reasons: string[] }

/** Realms this one may not attack: binding truces, and — from rules 22 — its own
 * patron and clients, who answer the same oath rather than each other's armies. */
export function protectedFactions(view: Observation): Set<string> {
  const bound = view.diplomacy.clients.flatMap(bond =>
    bond.patronId === view.factionId ? [bond.clientId] : bond.clientId === view.factionId ? [bond.patronId] : []);
  return new Set([...bound, ...view.diplomacy.treaties.filter(treaty => treaty.expiresTurn > view.turn)
    .flatMap(treaty => treaty.parties.filter(id => id !== view.factionId))]);
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

/** Rules 22 patronage. A realm answers a standing offer before it makes one, so a
 * single pass never both accepts an oath and proposes another. Both sides judge
 * the bargain from their own permitted observation: hearths held, coin and war. */
const hearths = (view: Observation, factionId: string): number => view.settlements.filter(town => town.factionId === factionId).length;

/** Answering an offer changes who may be attacked, so it ends the pass and the
 * rest of the turn is planned again from the new facts. */
export function answerPatronage(view: Observation): AiPlan | null {
  const factionId = view.factionId;
  const bound = view.diplomacy.clients.some(bond => bond.clientId === factionId);
  const incoming = [...view.diplomacy.clientOffers].sort((a, b) => a.createdTurn - b.createdTurn || (a.id < b.id ? -1 : 1))
    .find(offer => offer.clientId === factionId && offer.expiresTurn > view.turn && !offer.acceptanceBlocker);
  if (incoming) {
    // Accept protection when the patron is the stronger realm and the tribute is
    // payable out of standing income rather than out of the next caravan.
    const patronHearths = hearths(view, incoming.patronId), own = hearths(view, factionId);
    const affordable = (view.growth?.economy.net ?? 0) >= incoming.terms.tributeCoin || view.treasury >= incoming.terms.tributeCoin * 8;
    const outmatched = patronHearths > own || view.wars.length > 0 || isCityState(factionId);
    const accept = !bound && affordable && outmatched && incoming.terms.giftCoin >= incoming.terms.tributeCoin * 4;
    return {
      commands: [{ type: 'respondClient', factionId, offerId: incoming.id, accept }],
      reasons: [`${accept ? 'Accept' : 'Refuse'} patronage ${incoming.id} from ${incoming.patronId}: ${patronHearths} hearths against ${own}, ${incoming.terms.tributeCoin} coin tribute against ${view.growth?.economy.net ?? 0} net income, ${incoming.terms.giftCoin} coin offered.`],
    };
  }
  return null;
}

/** Making an offer binds nobody, so it travels with the turn's ordinary orders. */
export function proposePatronage(view: Observation): AiPlan | null {
  const factionId = view.factionId;
  const bound = view.diplomacy.clients.some(bond => bond.clientId === factionId);
  if (bound || isCityState(factionId) || view.factions.length < 2) return null;
  // A realm courts a neighbour at most once every ten turns. Patronage is a
  // standing oath, not a bid repeated until somebody tires of refusing it.
  const seat = view.factions.findIndex(faction => faction.id === factionId);
  if (seat < 0 || (view.turn + seat) % 10 !== 0) return null;
  const own = hearths(view, factionId);
  const gift = 40, tribute = 6;
  // Protect ordinary spending: patronage is paid from surplus, never from the purse.
  if (view.treasury < gift + 80 || own < 2) return null;
  const pending = new Set(view.diplomacy.clientOffers.flatMap(offer => [offer.patronId, offer.clientId]));
  const claimed = new Set(view.diplomacy.clients.flatMap(bond => [bond.patronId, bond.clientId]));
  const candidate = view.factions.map(faction => faction.id)
    .filter(id => id !== factionId && !pending.has(id) && !claimed.has(id) && !view.wars.includes(id) && hearths(view, id) > 0 && hearths(view, id) < own)
    .sort((a, b) => (isCityState(b) ? 1 : 0) - (isCityState(a) ? 1 : 0) || hearths(view, a) - hearths(view, b) || (a < b ? -1 : 1))[0];
  if (!candidate) return null;
  return {
    commands: [{ type: 'proposeClient', factionId, targetFactionId: candidate, terms: { giftCoin: gift, tributeCoin: tribute, termTurns: 20 } }],
    reasons: [`Offer ${candidate} patronage: ${hearths(view, candidate)} hearths against ${own}, ${gift} coin now for ${tribute} coin each turn and its hearths behind any unification bid.`],
  };
}
