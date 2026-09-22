import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState } from './types';
import { atWar, warPair } from './warfare';
import { rulesVersion } from './rules';

/** Rules 22: a realm may take another realm as its client. The patron pays a
 * subsidy once; the client pays tribute every turn for an agreed term and keeps
 * its own hearths, armies and orders. Nothing here moves a settlement: patronage
 * is an obligation between realms, not a conquest. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAX_CLIENT_RELATIONS = 128;
/** A client that cannot pay this many turns in a row falls out of its obligation. */
export const TRIBUTE_GRACE = 3;
export const CLIENT_OFFER_TURNS = 3;

export const clientTermsSchema = z.object({
  giftCoin: z.number().int().min(0).max(1_000_000),
  tributeCoin: z.number().int().min(0).max(200),
  termTurns: z.number().int().min(10).max(60),
}).strict();
export type ClientTerms = z.infer<typeof clientTermsSchema>;
export const clientOfferSchema = z.object({
  id, patronId: id, clientId: id, createdTurn: turn, expiresTurn: turn, terms: clientTermsSchema,
}).strict();
export const clientBondSchema = z.object({
  id, patronId: id, clientId: id, startedTurn: turn, expiresTurn: turn, terms: clientTermsSchema,
  missedTribute: z.number().int().min(0).max(TRIBUTE_GRACE),
}).strict();
export type ClientOffer = z.infer<typeof clientOfferSchema>;
export type ClientBond = z.infer<typeof clientBondSchema>;
export type ObservedClientOffer = ClientOffer & { acceptanceBlocker: string | null };

export const clientCommandSchemas = [
  z.object({ type: z.literal('proposeClient'), factionId: id, targetFactionId: id, terms: clientTermsSchema }).strict(),
  z.object({ type: z.literal('respondClient'), factionId: id, offerId: id, accept: z.boolean() }).strict(),
  z.object({ type: z.literal('releaseClient'), factionId: id, clientId: id }).strict(),
  z.object({ type: z.literal('renounceClient'), factionId: id }).strict(),
] as const;

const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const pairEvents = (state: GameState, a: string, b: string, type: string, message: string): DomainEvent[] =>
  [a, b].map(factionId => ({ turn: state.turn, factionId, type, message }));

export const patronOf = (state: GameState, factionId: string): ClientBond | undefined =>
  state.diplomacy.clients.find(bond => bond.clientId === factionId);
export const clientsOf = (state: GameState, factionId: string): ClientBond[] =>
  state.diplomacy.clients.filter(bond => bond.patronId === factionId);

/** Every reason a patronage offer cannot be made, in the order a player meets them. */
export function clientProposalObjection(state: GameState, patronId: string, clientId: string, terms: ClientTerms): string | null {
  const patron = state.factions.find(faction => faction.id === patronId);
  if (!patron || !state.factions.some(faction => faction.id === clientId) || patronId === clientId) return 'Choose a different known realm.';
  if (atWar(state, patronId, clientId)) return 'Make peace before offering patronage.';
  if (patron.treasury < terms.giftCoin) return 'You cannot fund the offered subsidy.';
  if (patronOf(state, patronId)) return 'A client realm cannot take clients of its own.';
  if (patronOf(state, clientId)) return 'That realm already answers to a patron.';
  if (clientsOf(state, clientId).length) return 'That realm has clients of its own; it must release them first.';
  if (clientsOf(state, patronId).length + state.diplomacy.clientOffers.filter(offer => offer.patronId === patronId).length >= MAX_CLIENT_RELATIONS) return 'You already hold as many clients as a realm may.';
  if (state.diplomacy.clientOffers.some(offer => offer.patronId === patronId && offer.clientId === clientId)) return 'Await the answer to your standing offer.';
  if (state.diplomacy.clientOffers.some(offer => offer.patronId === clientId && offer.clientId === patronId)) return 'That realm has offered you patronage; answer it first.';
  return null;
}

/** Checked again on acceptance: the subsidy must still be payable. */
export function clientAcceptanceBlocker(state: GameState, offer: ClientOffer): string | null {
  const patron = state.factions.find(faction => faction.id === offer.patronId);
  if (!patron || !state.factions.some(faction => faction.id === offer.clientId)) return 'The offer references an unknown realm.';
  if (atWar(state, offer.patronId, offer.clientId)) return 'The realms are at war; the offer cannot be accepted.';
  if (patron.treasury < offer.terms.giftCoin) return 'The patron can no longer fund the subsidy.';
  if (patronOf(state, offer.clientId)) return 'This realm already answers to a patron.';
  if (patronOf(state, offer.patronId) || clientsOf(state, offer.clientId).length) return 'Patronage cannot pass through a realm that is itself bound.';
  return null;
}

export function proposeClient(state: GameState, factionId: string, targetFactionId: string, terms: ClientTerms): CommandResult {
  if (rulesVersion(state) < 22) return fail('Patronage is unavailable under these historical rules.');
  const parsed = clientTermsSchema.safeParse(terms);
  if (!parsed.success) return fail('Invalid patronage terms: ' + parsed.error.issues[0]?.message);
  const objection = clientProposalObjection(state, factionId, targetFactionId, parsed.data);
  if (objection) return fail(objection);
  const offer: ClientOffer = { id: `client.${state.nextId++}`, patronId: factionId, clientId: targetFactionId, createdTurn: state.turn, expiresTurn: state.turn + CLIENT_OFFER_TURNS, terms: { ...parsed.data } };
  state.diplomacy.clientOffers.push(offer);
  state.diplomacy.clientOffers.sort(byId);
  return { ok: true, events: pairEvents(state, factionId, targetFactionId, 'client_proposed', `Patronage offer ${offer.id} awaits an answer until turn ${offer.expiresTurn}: ${parsed.data.giftCoin} coin on acceptance, ${parsed.data.tributeCoin} coin tribute each turn for ${parsed.data.termTurns} turns.`) };
}

export function respondClient(state: GameState, factionId: string, offerId: string, accept: boolean): CommandResult {
  if (rulesVersion(state) < 22) return fail('Patronage is unavailable under these historical rules.');
  const offer = state.diplomacy.clientOffers.find(item => item.id === offerId && item.clientId === factionId);
  if (!offer) return fail('Choose an incoming patronage offer.');
  if (offer.expiresTurn <= state.turn) return fail('This patronage offer is no longer valid.');
  const blocker = accept ? clientAcceptanceBlocker(state, offer) : null;
  if (blocker) return fail(blocker);
  // Every refusal is above this line: no partial payment and no half-made obligation.
  state.diplomacy.clientOffers = state.diplomacy.clientOffers.filter(item => item.id !== offer.id);
  if (!accept) return { ok: true, events: pairEvents(state, offer.patronId, offer.clientId, 'client_refused', `Patronage offer ${offer.id} was refused.`) };
  const patron = state.factions.find(faction => faction.id === offer.patronId)!;
  const client = state.factions.find(faction => faction.id === offer.clientId)!;
  patron.treasury -= offer.terms.giftCoin;
  client.treasury += offer.terms.giftCoin;
  state.diplomacy.clients.push({ id: `bond.${state.nextId++}`, patronId: offer.patronId, clientId: offer.clientId, startedTurn: state.turn, expiresTurn: state.turn + offer.terms.termTurns, terms: { ...offer.terms }, missedTribute: 0 });
  state.diplomacy.clients.sort(byId);
  return { ok: true, events: pairEvents(state, offer.patronId, offer.clientId, 'client_accepted', `${client.name} answers to ${patron.name} until turn ${state.turn + offer.terms.termTurns}. ${offer.terms.giftCoin} coin changed hands; ${offer.terms.tributeCoin} coin tribute is due each turn.`) };
}

export function releaseClient(state: GameState, factionId: string, clientId: string): CommandResult {
  if (rulesVersion(state) < 22) return fail('Patronage is unavailable under these historical rules.');
  const bond = state.diplomacy.clients.find(item => item.patronId === factionId && item.clientId === clientId);
  if (!bond) return fail('Choose one of your own clients.');
  state.diplomacy.clients = state.diplomacy.clients.filter(item => item.id !== bond.id);
  return { ok: true, events: pairEvents(state, bond.patronId, bond.clientId, 'client_released', `${bond.patronId === factionId ? 'The patron' : 'The realm'} released its client; the obligation ended with no breach.`) };
}

/** A client ends its own obligation. After the term that is lawful; before it, a breach. */
export function renounceClient(state: GameState, factionId: string): CommandResult {
  if (rulesVersion(state) < 22) return fail('Patronage is unavailable under these historical rules.');
  const bond = patronOf(state, factionId);
  if (!bond) return fail('Your realm answers to no patron.');
  const lawful = state.turn >= bond.expiresTurn;
  state.diplomacy.clients = state.diplomacy.clients.filter(item => item.id !== bond.id);
  if (lawful) return { ok: true, events: pairEvents(state, bond.patronId, bond.clientId, 'client_ended', 'The agreed term ended and the realm is independent again.') };
  // A breach frees the patron to answer at once: the binding peace between them ends.
  state.diplomacy.treaties = state.diplomacy.treaties.filter(treaty => !(treaty.parties.includes(bond.patronId) && treaty.parties.includes(bond.clientId)));
  const memory = state.diplomacy.relations.find(item => item.parties.includes(bond.patronId) && item.parties.includes(bond.clientId));
  if (memory) { memory.trust = Math.max(-100, memory.trust - 25); memory.grievances = Math.min(100, memory.grievances + 20); }
  return { ok: true, events: pairEvents(state, bond.patronId, bond.clientId, 'client_broken', `The obligation was renounced before turn ${bond.expiresTurn}. The breach ends any binding peace between the realms.`) };
}

/** Tribute, lapsed obligations and expired terms. Bounded by relationships, never by tiles. */
export function advanceClients(state: GameState): DomainEvent[] {
  if (rulesVersion(state) < 22) return [];
  const events: DomainEvent[] = [];
  state.diplomacy.clientOffers = state.diplomacy.clientOffers.filter(offer => {
    if (offer.expiresTurn > state.turn) return true;
    events.push(...pairEvents(state, offer.patronId, offer.clientId, 'client_offer_expired', `Patronage offer ${offer.id} expired without an answer.`));
    return false;
  });
  const factions = new Map(state.factions.map(faction => [faction.id, faction]));
  state.diplomacy.clients = state.diplomacy.clients.filter(bond => {
    const patron = factions.get(bond.patronId), client = factions.get(bond.clientId);
    if (!patron || !client) return false;
    if (state.turn >= bond.expiresTurn) {
      events.push(...pairEvents(state, bond.patronId, bond.clientId, 'client_ended', `${client.name} completed its term and is independent again.`));
      return false;
    }
    if (client.treasury >= bond.terms.tributeCoin) {
      client.treasury -= bond.terms.tributeCoin;
      patron.treasury += bond.terms.tributeCoin;
      bond.missedTribute = 0;
      return true;
    }
    bond.missedTribute += 1;
    if (bond.missedTribute < TRIBUTE_GRACE) {
      events.push(...pairEvents(state, bond.patronId, bond.clientId, 'client_tribute_missed', `${client.name} could not pay ${bond.terms.tributeCoin} coin tribute (${bond.missedTribute} of ${TRIBUTE_GRACE} turns).`));
      return true;
    }
    const memory = state.diplomacy.relations.find(item => item.parties.includes(bond.patronId) && item.parties.includes(bond.clientId));
    if (memory) memory.grievances = Math.min(100, memory.grievances + 10);
    events.push(...pairEvents(state, bond.patronId, bond.clientId, 'client_lapsed', `${client.name} failed its tribute for ${TRIBUTE_GRACE} turns; the obligation lapsed.`));
    return false;
  });
  return events;
}

export function validateClients(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: patronage ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  const ordered = (values: { id: string }[]): boolean => values.every((value, index) => !index || byId(values[index - 1]!, value) < 0);
  assert(ordered(state.diplomacy.clients) && ordered(state.diplomacy.clientOffers), 'records must be unique and canonically ordered');
  const patrons = new Set<string>(), boundClients = new Set<string>();
  for (const bond of state.diplomacy.clients) {
    assert(/^bond\.[1-9][0-9]*$/.test(bond.id) && Number(bond.id.slice(5)) < state.nextId, 'has invalid entity IDs');
    assert(factions.has(bond.patronId) && factions.has(bond.clientId) && bond.patronId !== bond.clientId, 'requires two distinct known realms');
    assert(!boundClients.has(bond.clientId), 'gives one realm two patrons');
    assert(!atWar(state, bond.patronId, bond.clientId), 'cannot bind realms at war');
    assert(bond.startedTurn <= state.turn && bond.expiresTurn === bond.startedTurn + bond.terms.termTurns && bond.expiresTurn > state.turn, 'has an invalid term');
    boundClients.add(bond.clientId); patrons.add(bond.patronId);
  }
  for (const patron of patrons) assert(!boundClients.has(patron), 'chains patronage through a bound realm');
  const pending = new Set<string>();
  for (const offer of state.diplomacy.clientOffers) {
    assert(/^client\.[1-9][0-9]*$/.test(offer.id) && Number(offer.id.slice(7)) < state.nextId, 'has invalid entity IDs');
    assert(factions.has(offer.patronId) && factions.has(offer.clientId) && offer.patronId !== offer.clientId, 'requires two distinct known realms');
    const pair = warPair(offer.patronId, offer.clientId).join('|');
    assert(!pending.has(pair), 'has duplicate offers for one pair');
    assert(offer.createdTurn <= state.turn && offer.expiresTurn === offer.createdTurn + CLIENT_OFFER_TURNS && offer.expiresTurn > state.turn, 'has an invalid offer lifetime');
    pending.add(pair);
  }
}
