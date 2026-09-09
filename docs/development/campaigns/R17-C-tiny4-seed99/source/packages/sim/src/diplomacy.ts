import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState, Observation } from './types';
import { getObservation } from './simulation';
import { atWar, warPair } from './warfare';
import { rulesVersion } from './rules';

const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const peaceTermsSchema = z.object({
  offerCoin: z.number().int().min(0).max(1_000_000),
  requestCoin: z.number().int().min(0).max(1_000_000),
  truceTurns: z.number().int().min(5).max(30),
}).strict().refine(terms => !terms.offerCoin || !terms.requestCoin, 'Offer or request coin, not both.');
export type PeaceTerms = z.infer<typeof peaceTermsSchema>;
export const peaceCommandSchemas = [
  z.object({ type: z.literal('proposePeace'), factionId: id, targetFactionId: id, terms: peaceTermsSchema }).strict(),
  z.object({ type: z.literal('respondPeace'), factionId: id, offerId: id, accept: z.boolean() }).strict(),
] as const;
const offerSchema = z.object({
  id, proposerId: id, recipientId: id, createdTurn: turn, expiresTurn: turn, terms: peaceTermsSchema,
}).strict();
const treatySchema = z.object({
  id, parties: z.tuple([id, id]), startedTurn: turn, expiresTurn: turn, proposerId: id, terms: peaceTermsSchema,
}).strict();
const relationSchema = z.object({
  parties: z.tuple([id, id]), trust: z.number().int().min(-100).max(100),
  respect: z.number().int().min(0).max(100), grievances: z.number().int().min(0).max(100),
  warStartedTurn: turn.nullable(), lastOfferTurn: z.number().int().min(0).max(1_000_000),
}).strict();
export const diplomacyStateSchema = z.object({
  offers: z.array(offerSchema).max(1128), treaties: z.array(treatySchema).max(1128),
  relations: z.array(relationSchema).max(1128),
}).strict();
export type PeaceOffer = z.infer<typeof offerSchema>;
export type PeaceTreaty = z.infer<typeof treatySchema>;
export type DiplomaticRelation = z.infer<typeof relationSchema>;
export type DiplomacyState = z.infer<typeof diplomacyStateSchema>;
export type ObservedPeaceOffer = PeaceOffer & { acceptanceBlocker: string | null };
export type DiplomacyObservation = Omit<DiplomacyState, 'offers'> & { offers: ObservedPeaceOffer[] };
export interface PeaceAssessment { band: 'likely' | 'uncertain' | 'unlikely'; reasons: string[]; objections: string[] }
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const same = (pair: [string, string], a: string, b: string): boolean => pair.includes(a) && pair.includes(b);
const key = (pair: [string, string]): string => JSON.stringify(pair);
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const MAX_COIN = 1_000_000_000;

function paymentObjection(state: GameState, offer: PeaceOffer): string | null {
  const proposer = state.factions.find(faction => faction.id === offer.proposerId);
  const recipient = state.factions.find(faction => faction.id === offer.recipientId);
  if (!proposer || !recipient) return 'The peace offer references an unknown faction.';
  const { offerCoin, requestCoin } = offer.terms;
  if (proposer.treasury < offerCoin || recipient.treasury < requestCoin) return 'A party can no longer fund these terms. Reject the offer or replenish the treasury.';
  const coinLimit = rulesVersion(state) >= 16 ? Number.MAX_SAFE_INTEGER : MAX_COIN;
  if (proposer.treasury - offerCoin + requestCoin > coinLimit || recipient.treasury - requestCoin + offerCoin > coinLimit) return 'The payment would exceed a treasury limit.';
  return null;
}

export function createDiplomacy(): DiplomacyState { return { offers: [], treaties: [], relations: [] }; }

function relation(state: GameState, a: string, b: string): DiplomaticRelation {
  let result = state.diplomacy.relations.find(item => same(item.parties, a, b));
  if (!result) {
    result = { parties: warPair(a, b), trust: 0, respect: 0, grievances: 0, warStartedTurn: null, lastOfferTurn: 0 };
    state.diplomacy.relations.push(result);
    state.diplomacy.relations.sort((first, second) => first.parties[0] < second.parties[0] ? -1 : first.parties[0] > second.parties[0] ? 1 : first.parties[1] < second.parties[1] ? -1 : first.parties[1] > second.parties[1] ? 1 : 0);
  }
  return result;
}

export function declareWarObjection(state: GameState, a: string, b: string): string | null {
  const treaty = state.diplomacy.treaties.find(item => same(item.parties, a, b) && item.expiresTurn > state.turn);
  return treaty ? `A binding peace protects this faction until turn ${treaty.expiresTurn}.` : null;
}

export function recordWar(state: GameState, a: string, b: string): void {
  const memory = relation(state, a, b);
  memory.warStartedTurn = state.turn;
  memory.trust = clamp(memory.trust - 15, -100, 100);
  memory.grievances = clamp(memory.grievances + 15, 0, 100);
}

export function recordConquest(state: GameState, a: string, b: string, outcome: string): void {
  if (a === b) return;
  const memory = relation(state, a, b);
  memory.grievances = clamp(memory.grievances + (outcome === 'liberate' ? -10 : outcome === 'raze' ? 40 : outcome === 'sack' ? 25 : 10), 0, 100);
  memory.respect = clamp(memory.respect + 5, 0, 100);
}

function pairEvents(state: GameState, a: string, b: string, type: string, message: string): DomainEvent[] {
  return [a, b].map(factionId => ({ turn: state.turn, factionId, type, message }));
}

function proposalObjection(state: GameState, a: string, b: string, terms: PeaceTerms): string | null {
  const source = state.factions.find(faction => faction.id === a);
  if (!source || !state.factions.some(faction => faction.id === b) || a === b) return 'Choose a different known faction.';
  if (!atWar(state, a, b)) return 'Peace terms require an active war.';
  if (source.treasury < terms.offerCoin) return 'You cannot fund the offered payment.';
  if (state.diplomacy.offers.some(offer => same(warPair(offer.proposerId, offer.recipientId), a, b))) return 'Respond to the existing peace offer first.';
  const memory = state.diplomacy.relations.find(item => same(item.parties, a, b));
  if (memory?.lastOfferTurn === state.turn) return 'Only one peace proposal per pair may be sent in a turn.';
  return null;
}

export function proposePeace(state: GameState, factionId: string, targetFactionId: string, terms: PeaceTerms): CommandResult {
  const parsed = peaceTermsSchema.safeParse(terms);
  if (!parsed.success) return fail('Invalid peace terms: ' + parsed.error.issues[0]?.message);
  const objection = proposalObjection(state, factionId, targetFactionId, parsed.data);
  if (objection) return fail(objection);
  const offer: PeaceOffer = { id: `offer.${state.nextId++}`, proposerId: factionId, recipientId: targetFactionId, createdTurn: state.turn, expiresTurn: state.turn + 3, terms: { ...parsed.data } };
  state.diplomacy.offers.push(offer);
  state.diplomacy.offers.sort(byId);
  relation(state, factionId, targetFactionId).lastOfferTurn = state.turn;
  return { ok: true, events: pairEvents(state, factionId, targetFactionId, 'peace_proposed', `Peace offer ${offer.id} awaits a response until turn ${offer.expiresTurn}. Payments occur only on acceptance.`) };
}

export function respondPeace(state: GameState, factionId: string, offerId: string, accept: boolean): CommandResult {
  const offer = state.diplomacy.offers.find(item => item.id === offerId && item.recipientId === factionId);
  if (!offer) return fail('Choose an incoming peace offer.');
  if (offer.expiresTurn <= state.turn || !atWar(state, offer.proposerId, offer.recipientId)) return fail('This peace offer is no longer valid.');
  const proposer = state.factions.find(faction => faction.id === offer.proposerId);
  const recipient = state.factions.find(faction => faction.id === offer.recipientId);
  if (!proposer || !recipient) return fail('The peace offer references an unknown faction.');
  const { offerCoin, requestCoin, truceTurns } = offer.terms;
  const objection = accept ? paymentObjection(state, offer) : null;
  if (objection) return fail(objection);
  // All rejection paths are above this point: no partial payments or broken wars.
  state.diplomacy.offers = state.diplomacy.offers.filter(item => item.id !== offer.id);
  if (!accept) return { ok: true, events: pairEvents(state, proposer.id, recipient.id, 'peace_rejected', `Peace offer ${offer.id} was rejected.`) };
  proposer.treasury += requestCoin - offerCoin;
  recipient.treasury += offerCoin - requestCoin;
  const parties = warPair(proposer.id, recipient.id);
  state.wars = state.wars.filter(pair => !same(pair, proposer.id, recipient.id));
  state.diplomacy.treaties.push({ id: `treaty.${state.nextId++}`, parties, proposerId: proposer.id, startedTurn: state.turn, expiresTurn: state.turn + truceTurns, terms: { ...offer.terms } });
  state.diplomacy.treaties.sort(byId);
  const memory = relation(state, proposer.id, recipient.id);
  memory.warStartedTurn = null;
  memory.trust = clamp(memory.trust + 5, -100, 100);
  memory.respect = clamp(memory.respect + 5, 0, 100);
  memory.grievances = Math.max(0, memory.grievances - 5);
  return { ok: true, events: pairEvents(state, proposer.id, recipient.id, 'peace_accepted', `Peace was signed until turn ${state.turn + truceTurns}. ${offerCoin || requestCoin} coin transferred; existing settlement ownership remains unchanged.`) };
}

/** Work is bounded by diplomatic pairs, never by tiles. Called after the turn advances. */
export function advanceDiplomacy(state: GameState): DomainEvent[] {
  const events: DomainEvent[] = [];
  state.diplomacy.offers = state.diplomacy.offers.filter(offer => {
    if (offer.expiresTurn > state.turn) return true;
    events.push(...pairEvents(state, offer.proposerId, offer.recipientId, 'peace_offer_expired', `Peace offer ${offer.id} expired without agreement.`));
    return false;
  });
  state.diplomacy.treaties = state.diplomacy.treaties.filter(treaty => {
    if (treaty.expiresTurn > state.turn) return true;
    events.push(...pairEvents(state, treaty.parties[0], treaty.parties[1], 'peace_expired', 'The binding peace has expired. Relations remain peaceful until a new declaration of war.'));
    return false;
  });
  return events;
}

export function getDiplomacyObservation(state: GameState, factionId: string): DiplomacyObservation {
  return {
    offers: state.diplomacy.offers.filter(offer => offer.proposerId === factionId || offer.recipientId === factionId).map(offer => ({ ...offer, terms: { ...offer.terms }, acceptanceBlocker: paymentObjection(state, offer) })),
    treaties: state.diplomacy.treaties.filter(treaty => treaty.parties.includes(factionId)).map(treaty => ({ ...treaty, parties: [...treaty.parties], terms: { ...treaty.terms } })),
    relations: state.diplomacy.relations.filter(memory => memory.parties.includes(factionId)).map(memory => ({ ...memory, parties: [...memory.parties] })),
  };
}

/** AI valuation consumes the recipient's permitted observation, never canonical hidden armies. */
export function evaluatePeaceOffer(view: Observation, offer: PeaceOffer | ObservedPeaceOffer): PeaceAssessment {
  const reasons: string[] = [];
  const objections: string[] = [];
  if ('acceptanceBlocker' in offer && offer.acceptanceBlocker) return { band: 'unlikely', reasons, objections: [offer.acceptanceBlocker] };
  if (offer.recipientId !== view.factionId || !view.wars.includes(offer.proposerId)) return { band: 'unlikely', reasons, objections: ['These terms do not address an active war.'] };
  if (offer.terms.requestCoin > view.treasury) return { band: 'unlikely', reasons, objections: ['The requested payment is unavailable.'] };
  const memory = view.diplomacy.relations.find(item => item.parties.includes(offer.proposerId));
  const duration = memory?.warStartedTurn === null || memory?.warStartedTurn === undefined ? 0 : view.turn - memory.warStartedTurn;
  const own = view.armies.filter(army => army.factionId === view.factionId);
  const ownStrength = own.reduce((sum, army) => sum + army.strength, 0);
  const seenEnemyStrength = view.armies.filter(army => army.factionId === offer.proposerId).reduce((sum, army) => sum + army.strength, 0);
  let score = 0;
  if (duration >= 8) { score += 3; reasons.push('A prolonged war favors a settlement.'); }
  else if (duration < 3) { score -= 2; objections.push('The conflict is too recent for a white peace.'); }
  if (seenEnemyStrength > ownStrength || own.some(army => army.morale < 30 || army.fatigue > 65)) { score += 2; reasons.push('Relief from military pressure is valuable.'); }
  if (offer.terms.offerCoin >= 10) { score += Math.min(5, Math.floor(offer.terms.offerCoin / 10)); reasons.push('The offered payment supports recovery.'); }
  if (offer.terms.requestCoin) { score -= 2 + Math.ceil(offer.terms.requestCoin / Math.max(10, Math.floor(view.treasury / 5))); objections.push('Reparations would divert funds from recovery.'); }
  if ((memory?.grievances ?? 0) >= 40) { score -= 2; objections.push('Recent grievances weigh against reconciliation.'); }
  if (offer.terms.truceTurns >= 10) { score++; reasons.push('A longer binding peace gives time to rebuild.'); }
  if (!reasons.length) reasons.push('Peace would end attacks and release sieges.');
  return { band: score >= 1 ? 'likely' : score >= -1 ? 'uncertain' : 'unlikely', reasons, objections };
}

/** Player-visible assessment only; exact force totals and utility scores are never returned. */
export function previewPeace(state: GameState, proposerId: string, targetId: string, terms: PeaceTerms): PeaceAssessment {
  const parsed = peaceTermsSchema.safeParse(terms);
  if (!parsed.success) return { band: 'unlikely', reasons: [], objections: ['Choose valid coin terms and a peace duration of 5–30 turns.'] };
  const objection = proposalObjection(state, proposerId, targetId, parsed.data);
  if (objection) return { band: 'unlikely', reasons: [], objections: [objection] };
  const offer: PeaceOffer = { id: 'preview', proposerId, recipientId: targetId, createdTurn: state.turn, expiresTurn: state.turn + 3, terms: parsed.data };
  return evaluatePeaceOffer(getObservation(state, targetId), { ...offer, acceptanceBlocker: paymentObjection(state, offer) });
}

/** Cross-reference validation is separate from shape validation so saves cannot invent treaties. */
export function validateDiplomacy(state: GameState): void {
  diplomacyStateSchema.parse(state.diplomacy);
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: diplomacy ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  const ordered = (values: { id: string }[]): boolean => values.every((value, index) => !index || byId(values[index - 1]!, value) < 0);
  assert(ordered(state.diplomacy.offers) && ordered(state.diplomacy.treaties), 'records must be unique and canonically ordered');
  const memories = state.diplomacy.relations;
  assert(memories.every((memory, index) => {
    if (!index) return true;
    const previous = memories[index - 1]!.parties;
    return previous[0] < memory.parties[0] || (previous[0] === memory.parties[0] && previous[1] < memory.parties[1]);
  }), 'relationships must be unique and canonically ordered');
  const validPair = (pair: [string, string]): void => { assert(factions.has(pair[0]) && factions.has(pair[1]) && pair[0] < pair[1], 'requires distinct canonical faction parties'); };
  const ids = new Set<string>();
  const checkId = (value: string, kind: string): void => {
    assert(new RegExp(`^${kind}\\.[1-9][0-9]*$`).test(value) && Number(value.slice(kind.length + 1)) < state.nextId && !ids.has(value), 'has invalid or duplicate entity IDs');
    ids.add(value);
  };
  const relations = new Map<string, DiplomaticRelation>();
  for (const memory of state.diplomacy.relations) {
    validPair(memory.parties);
    assert(!relations.has(key(memory.parties)), 'contains duplicate relationships');
    assert(memory.lastOfferTurn <= state.turn && (memory.warStartedTurn === null || memory.warStartedTurn <= state.turn), 'contains future relationship memories');
    assert((memory.warStartedTurn !== null) === atWar(state, ...memory.parties), 'war memory disagrees with formal war');
    relations.set(key(memory.parties), memory);
  }
  for (const pair of state.wars) assert(relations.has(key(pair)), 'war is missing relationship memory');
  const pendingPairs = new Set<string>();
  for (const offer of state.diplomacy.offers) {
    checkId(offer.id, 'offer');
    const pair = warPair(offer.proposerId, offer.recipientId);
    validPair(pair);
    assert(!pendingPairs.has(key(pair)) && atWar(state, ...pair), 'offer is duplicated or not at war');
    assert(offer.createdTurn <= state.turn && offer.expiresTurn === offer.createdTurn + 3 && offer.expiresTurn > state.turn, 'offer lifetime is invalid');
    assert(relations.get(key(pair))?.lastOfferTurn === offer.createdTurn, 'offer disagrees with relationship memory');
    pendingPairs.add(key(pair));
  }
  const treatyPairs = new Set<string>();
  for (const treaty of state.diplomacy.treaties) {
    checkId(treaty.id, 'treaty'); validPair(treaty.parties);
    assert(!treatyPairs.has(key(treaty.parties)) && !atWar(state, ...treaty.parties), 'treaty is duplicated or at war');
    assert(treaty.parties.includes(treaty.proposerId) && relations.has(key(treaty.parties)), 'treaty has invalid references');
    assert(treaty.startedTurn <= state.turn && treaty.expiresTurn === treaty.startedTurn + treaty.terms.truceTurns && treaty.expiresTurn > state.turn, 'treaty lifetime is invalid');
    treatyPairs.add(key(treaty.parties));
  }
}
