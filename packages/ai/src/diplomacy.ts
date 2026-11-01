import { evaluatePeaceOffer, isCityState, type GameCommand, type Observation } from '@theandril/sim';
import { cityStateTradeFor } from '@theandril/content';
import { UNIFICATION_VICTORY } from '@theandril/content';
import { reviewProjectCounterplay } from './project-counterplay';
import { seamPursued, type SeamObjective } from './arcane';

export interface AiPlan { commands: GameCommand[]; reasons: string[] }

/** Realms this one may not attack: binding truces, and — from rules 22 — its own
 * patron and clients, who answer the same oath rather than each other's armies. */
export function protectedFactions(view: Observation): Set<string> {
  const bound = view.diplomacy.clients.flatMap(bond =>
    bond.patronId === view.factionId ? [bond.clientId] : bond.clientId === view.factionId ? [bond.patronId] : []);
  for (const agreement of view.supplyAccess?.agreements ?? []) if (agreement.expiresTurn > view.turn) {
    if (agreement.buyerId === view.factionId) bound.push(agreement.providerId);
    else if (agreement.providerId === view.factionId) bound.push(agreement.buyerId);
  }
  for (const offer of view.supplyAccess?.offers ?? []) if (offer.buyerId === view.factionId && offer.expiresTurn > view.turn) bound.push(offer.providerId);
  // Rules 50: allies do not make war on each other.
  for (const pact of view.alliances?.pacts ?? []) if (pact.parties.includes(view.factionId)) bound.push(...pact.parties.filter(id => id !== view.factionId));
  return new Set([...bound, ...view.diplomacy.treaties.filter(treaty => treaty.expiresTurn > view.turn)
    .flatMap(treaty => treaty.parties.filter(id => id !== view.factionId))]);
}

/** Rules 50. A realm at war, or one weaker than the realm offering, accepts a
 * defensive pact from a realm it is at peace with; a realm answers a standing
 * offer before it makes one. Answering an offer changes who may be attacked
 * and who answers a war, so it ends the pass. */
export function answerAlliance(view: Observation): AiPlan | null {
  const factionId = view.factionId;
  if (!view.alliances || isCityState(factionId) || view.strategicCommandBlocker) return null;
  const incoming = [...view.alliances.offers].sort((a, b) => a.createdTurn - b.createdTurn || (a.id < b.id ? -1 : 1))
    .find(offer => offer.recipientId === factionId && offer.expiresTurn > view.turn);
  if (!incoming) return null;
  const own = hearths(view, factionId), theirs = hearths(view, incoming.proposerId);
  const held = view.alliances.pacts.filter(pact => pact.parties.includes(factionId)).length;
  // A realm bound by oath to a third realm answers that oath first; a realm at war with fewer than two allies takes the pact, since every pact also calls it into its partner's wars.
  const accept = !incoming.acceptanceBlocker && !view.diplomacy.clients.some(bond => bond.clientId === factionId) && view.wars.length > 0 && held < 2;
  return {
    commands: [{ type: 'respondAlliance', factionId, offerId: incoming.id, accept }],
    reasons: [`${accept ? 'Accept' : 'Refuse'} the alliance ${incoming.proposerId} offers for ${incoming.termTurns} turns: ${theirs} hearths against ${own}, ${view.wars.length} war${view.wars.length === 1 ? '' : 's'} of our own${incoming.acceptanceBlocker ? `; ${incoming.acceptanceBlocker}` : ''}.`],
  };
}
/** Whether the wars in sight press the realm: exhausted companies, or more enemy strength in view than its own. */
export function pressedByWar(view: Observation): boolean {
  if (!view.wars.length) return false;
  const own = view.armies.filter(army => army.factionId === view.factionId);
  const strength = own.reduce((sum, army) => sum + army.strength, 0);
  const enemies = new Set(view.wars);
  const seen = view.armies.filter(army => enemies.has(army.factionId)).reduce((sum, army) => sum + army.strength, 0);
  return own.some(army => army.morale < 30 || army.fatigue > 65) || seen > strength;
}
/** Rules 50. A realm pressed by a war and without an ally courts one every ten turns: the strongest known realm at peace with it that is neither bound to it nor already full. Making an offer binds nobody, so it travels with the turn's orders. */
export const ALLIANCE_TERM = 30;
export function proposeAlliance(view: Observation): AiPlan | null {
  const factionId = view.factionId;
  if (!view.alliances || isCityState(factionId) || !pressedByWar(view) || view.factions.length < 2) return null;
  const seat = view.factions.findIndex(faction => faction.id === factionId);
  if (seat < 0 || (view.turn + seat + 5) % 10 !== 0) return null;
  // Only this realm's own partners and offers are passed over; a realm allied elsewhere may still be courted.
  const allied = new Set(view.alliances.pacts.filter(pact => pact.parties.includes(factionId)).flatMap(pact => pact.parties));
  const pending = new Set(view.alliances.offers.filter(offer => offer.proposerId === factionId || offer.recipientId === factionId).flatMap(offer => [offer.proposerId, offer.recipientId]));
  const bound = new Set(view.diplomacy.clients.flatMap(bond => [bond.patronId, bond.clientId]));
  if (view.alliances.pacts.some(pact => pact.parties.includes(factionId)) || view.alliances.offers.some(offer => offer.proposerId === factionId)) return null;
  // Pacts are public: a realm already holding as many as a realm may is not courted.
  const full = (id: string) => view.alliances!.pacts.filter(pact => pact.parties.includes(id)).length >= 3;
  const candidate = view.factions.map(faction => faction.id)
    .filter(id => id !== factionId && !isCityState(id) && !view.wars.includes(id) && !allied.has(id) && !pending.has(id) && !bound.has(id) && !full(id))
    .sort((a, b) => hearths(view, b) - hearths(view, a) || (a < b ? -1 : 1))[0];
  if (!candidate) return null;
  return {
    commands: [{ type: 'proposeAlliance', factionId, targetFactionId: candidate, termTurns: ALLIANCE_TERM }],
    reasons: [`Offer ${candidate} an alliance of ${ALLIANCE_TERM} turns: ${hearths(view, candidate)} hearths beside our ${hearths(view, factionId)} while the realm is pressed by war.`],
  };
}

/** Accepted peace ends the pass. A rejection preserves war and the quoted
 * siege facts, so an imminent-project rejection may carry that one siege in
 * the same batch: Watch plans only once per realm per round. */
export function planDiplomacy(view: Observation, seamGoal: SeamObjective | null = null): AiPlan | null {
  if (view.strategicCommandBlocker) return null;
  // A war carried to the seam of the missing path is held while a company
  // pursues it: no peace is offered to the holder and none of its is accepted.
  // The hold ends with the pursuit, so a column driven off makes peace as before.
  const heldWar = seamGoal?.atWar && seamPursued(view, seamGoal) ? seamGoal.holderId : null;
  const incoming = [...view.diplomacy.offers].sort((a, b) => a.createdTurn - b.createdTurn || (a.id < b.id ? -1 : 1))
    .find(offer => offer.recipientId === view.factionId && offer.expiresTurn > view.turn && view.wars.includes(offer.proposerId));
  if (incoming) {
    const assessment = evaluatePeaceOffer(view, incoming);
    const accept = assessment.band === 'likely';
    const interruption = reviewProjectCounterplay(view, protectedFactions(view), incoming.terms.truceTurns, incoming.proposerId);
    if (interruption.command || interruption.peaceBlockedFactionIds.includes(incoming.proposerId)) return {
      commands: [{ type: 'respondPeace', factionId: view.factionId, offerId: incoming.id, accept: false }, ...(interruption.command ? [interruption.command] : [])],
      reasons: [`Reject ${incoming.id}: its ${incoming.terms.truceTurns}-turn binding peace would protect this enemy victory. ${interruption.reason}`],
    };
    if (incoming.proposerId === heldWar) return {
      commands: [{ type: 'respondPeace', factionId: view.factionId, offerId: incoming.id, accept: false }],
      reasons: [`Reject ${incoming.id}: the war with ${incoming.proposerId} is carried to the ${seamGoal!.seam.pathName.toLowerCase()} seam at hex ${seamGoal!.seam.cell}, the last the working lacks, and a company stands before it.`],
    };
    return {
      commands: [{ type: 'respondPeace', factionId: view.factionId, offerId: incoming.id, accept }],
      reasons: [`${accept ? 'Accept' : 'Reject'} ${incoming.id}: ${[...assessment.reasons, ...assessment.objections].join(' ')}`],
    };
  }
  // This also runs during peace-offer cooldowns; no second same-turn planning
  // pass is required to execute an available interruption before victory.
  const interruption = reviewProjectCounterplay(view, protectedFactions(view));
  if (interruption.command) return { commands: [interruption.command], reasons: [interruption.reason!] };
  const own = view.armies.filter(army => army.factionId === view.factionId);
  const strength = own.reduce((sum, army) => sum + army.strength, 0);
  const exhausted = own.some(army => army.morale < 30 || army.fatigue > 65);
  const pending = new Set(view.diplomacy.offers.flatMap(offer => [offer.proposerId, offer.recipientId]));
  for (const enemyId of [...view.wars].sort().slice(0, 48)) {
    if (pending.has(enemyId) || interruption.peaceBlockedFactionIds.includes(enemyId) || enemyId === heldWar) continue;
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
  const bond = view.diplomacy.clients.find(item => item.clientId === factionId);
  const bound = bond !== undefined;
  // A client's hearths stand behind its patron's unification bid. An oath that
  // would end the campaign is renounced, even at the price of a breach: the
  // patron may answer with war, but the realm is no longer bidding against itself.
  const biddingPatron = (patronId: string): boolean => view.projects.some(project => project.factionId === patronId && project.projectId === UNIFICATION_VICTORY.id && project.status === 'active');
  if (bond && biddingPatron(bond.patronId) && !view.strategicCommandBlocker) return {
    commands: [{ type: 'renounceClient', factionId }],
    reasons: [`Renounce patronage under ${bond.patronId}: its public unification bid counts this realm's hearths, and ending the oath withdraws them${view.turn >= bond.expiresTurn ? ' lawfully' : ' at the price of a breach'}.`],
  };
  const incoming = [...view.diplomacy.clientOffers].sort((a, b) => a.createdTurn - b.createdTurn || (a.id < b.id ? -1 : 1))
    .find(offer => offer.clientId === factionId && offer.expiresTurn > view.turn && !offer.acceptanceBlocker);
  if (incoming) {
    // Accept protection when the patron is the stronger realm and the tribute is
    // payable out of standing income rather than out of the next caravan. Never
    // pledge hearths to a realm already bidding to unite the world.
    const patronHearths = hearths(view, incoming.patronId), own = hearths(view, factionId);
    const affordable = (view.growth?.economy.net ?? 0) >= incoming.terms.tributeCoin || view.treasury >= incoming.terms.tributeCoin * 8;
    const outmatched = patronHearths > own || view.wars.length > 0 || isCityState(factionId);
    const bidding = biddingPatron(incoming.patronId);
    // Rules 61: a city-state pressed for tribute by this realm within forty turns refuses its patronage.
    const pressed = (view.tribute?.demands ?? []).some(item => item.cityStateId === factionId && item.factionId === incoming.patronId && view.turn - item.turn < 40);
    const accept = !bound && !bidding && !pressed && affordable && outmatched && incoming.terms.giftCoin >= incoming.terms.tributeCoin * 4;
    return {
      commands: [{ type: 'respondClient', factionId, offerId: incoming.id, accept }],
      reasons: [`${accept ? 'Accept' : 'Refuse'} patronage ${incoming.id} from ${incoming.patronId}: ${patronHearths} hearths against ${own}, ${incoming.terms.tributeCoin} coin tribute against ${view.growth?.economy.net ?? 0} net income, ${incoming.terms.giftCoin} coin offered${bidding ? '; that realm holds a public unification bid' : ''}.`],
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
  // Rules 50: an ally is an equal, never a client.
  const allied = new Set((view.alliances?.pacts ?? []).filter(pact => pact.parties.includes(factionId)).flatMap(pact => pact.parties));
  // Rules 60: a city-state whose good the realm holds little of is courted first; nothing is guessed beyond the quoted trade and the realm's own stockpile.
  const wanted = (id: string): number => { const trade = view.diplomacy.clientGoods === undefined ? undefined : cityStateTradeFor(id); if (!trade) return 0; const stock = view.resources?.stockpiles.find(item => item.resourceId === trade.resourceId); return (stock?.amount ?? 0) < 6 ? 1 : 0; };
  const candidate = view.factions.map(faction => faction.id)
    .filter(id => id !== factionId && !pending.has(id) && !claimed.has(id) && !allied.has(id) && !view.wars.includes(id) && hearths(view, id) > 0 && hearths(view, id) < own)
    .sort((a, b) => (isCityState(b) ? 1 : 0) - (isCityState(a) ? 1 : 0) || wanted(b) - wanted(a) || hearths(view, a) - hearths(view, b) || (a < b ? -1 : 1))[0];
  if (!candidate) return null;
  return {
    commands: [{ type: 'proposeClient', factionId, targetFactionId: candidate, terms: { giftCoin: gift, tributeCoin: tribute, termTurns: 20 } }],
    reasons: [`Offer ${candidate} patronage: ${hearths(view, candidate)} hearths against ${own}, ${gift} coin now for ${tribute} coin each turn and its hearths behind any unification bid.`],
  };
}
