import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState } from './types';
import { atWar, warPair } from './warfare';
import { rulesVersion } from './rules';
import { isCityState } from './seats';
import { relation } from './diplomacy';

/** Rules 50: an alliance is a defensive pact between two realms for an agreed
 * term. Allies do not make war on each other, and when a third realm declares
 * war on one of them the other enters that war at once unless an oath, a
 * binding peace or a supply agreement with the attacker binds it — then the
 * call goes unanswered and every party reads why. An alliance never calls an
 * ally into a war its partner opens. Patron and client are bound already and
 * do not ally; a city-state keeps to its own walls. Renouncing before the
 * term is a breach the former ally remembers. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAX_ALLIANCES_PER_REALM = 3;
export const ALLIANCE_OFFER_TURNS = 3;
export const allianceTermSchema = z.number().int().min(10).max(60);
export const allianceOfferSchema = z.object({ id, proposerId: id, recipientId: id, createdTurn: turn, expiresTurn: turn, termTurns: allianceTermSchema }).strict();
export const allianceSchema = z.object({ id, parties: z.tuple([id, id]), proposerId: id, startedTurn: turn, expiresTurn: turn, termTurns: allianceTermSchema }).strict();
/** Rules 56: the call an ally answered, kept while the war it entered lasts, so that its partner's peace ends that war too. */
export const allianceCallSchema = z.object({ allyId: id, attackerId: id, partnerId: id, turn }).strict();
export const allianceStateV50Schema = z.object({ pacts: z.array(allianceSchema).max(1128), offers: z.array(allianceOfferSchema).max(1128) }).strict();
export const allianceStateSchema = allianceStateV50Schema.extend({ calls: z.array(allianceCallSchema).max(1128) }).strict();
export type AllianceCall = z.infer<typeof allianceCallSchema>;
export type AllianceOffer = z.infer<typeof allianceOfferSchema>;
export type Alliance = z.infer<typeof allianceSchema>;
export type AllianceState = z.infer<typeof allianceStateSchema>;
export interface ObservedAllianceOffer extends AllianceOffer { acceptanceBlocker: string | null }
export interface ObservedAlliances { pacts: Alliance[]; offers: ObservedAllianceOffer[]; /** Rules 56: the calls the realm answered, made or was answered against. */ calls?: AllianceCall[] }
export const allianceCommandSchemas = [
  z.object({ type: z.literal('proposeAlliance'), factionId: id, targetFactionId: id, termTurns: allianceTermSchema }).strict(),
  z.object({ type: z.literal('respondAlliance'), factionId: id, offerId: id, accept: z.boolean() }).strict(),
  z.object({ type: z.literal('renounceAlliance'), factionId: id, allyId: id }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const same = (pair: [string, string], a: string, b: string): boolean => pair.includes(a) && pair.includes(b);
const pairEvents = (state: GameState, a: string, b: string, type: string, message: string): DomainEvent[] => [a, b].map(factionId => ({ turn: state.turn, factionId, type, message }));
const nameOf = (state: GameState, factionId: string): string => state.factions.find(faction => faction.id === factionId)?.name ?? factionId;

export const emptyAlliances = (): AllianceState => ({ pacts: [], offers: [], calls: [] });
const byCall = (a: AllianceCall, b: AllianceCall): number => a.allyId < b.allyId ? -1 : a.allyId > b.allyId ? 1 : a.attackerId < b.attackerId ? -1 : a.attackerId > b.attackerId ? 1 : a.partnerId < b.partnerId ? -1 : a.partnerId > b.partnerId ? 1 : 0;
export const allianceBetween = (state: GameState, a: string, b: string): Alliance | undefined => state.alliances.pacts.find(pact => same(pact.parties, a, b));
export const alliesOf = (state: GameState, factionId: string): string[] => state.alliances.pacts.filter(pact => pact.parties.includes(factionId)).map(pact => pact.parties[0] === factionId ? pact.parties[1] : pact.parties[0]).sort();
const bound = (state: GameState, a: string, b: string): boolean => state.diplomacy.clients.some(bond => (bond.patronId === a && bond.clientId === b) || (bond.patronId === b && bond.clientId === a));
const commitments = (state: GameState, factionId: string): number => state.alliances.pacts.filter(pact => pact.parties.includes(factionId)).length + state.alliances.offers.filter(offer => offer.proposerId === factionId).length;

/** Every reason an alliance cannot be offered, in the order a player meets them. */
export function allianceProposalObjection(state: GameState, proposerId: string, recipientId: string): string | null {
  if (rulesVersion(state) < 50) return 'Alliances are unavailable under these historical rules.';
  if (!state.factions.some(faction => faction.id === proposerId) || !state.factions.some(faction => faction.id === recipientId) || proposerId === recipientId) return 'Choose a different known realm.';
  if (isCityState(proposerId) || isCityState(recipientId)) return 'A city-state keeps to its own walls and swears no alliance.';
  if (atWar(state, proposerId, recipientId)) return 'Make peace before offering an alliance.';
  if (allianceBetween(state, proposerId, recipientId)) return 'The realms are allied already.';
  if (bound(state, proposerId, recipientId)) return 'Patron and client are bound already; an oath is not an alliance.';
  if (state.alliances.offers.some(offer => offer.proposerId === proposerId && offer.recipientId === recipientId)) return 'Await the answer to your standing offer.';
  if (state.alliances.offers.some(offer => offer.proposerId === recipientId && offer.recipientId === proposerId)) return 'That realm has offered you an alliance; answer it first.';
  if (commitments(state, proposerId) >= MAX_ALLIANCES_PER_REALM) return `A realm keeps at most ${MAX_ALLIANCES_PER_REALM} alliances and offers.`;
  if (state.alliances.pacts.filter(pact => pact.parties.includes(recipientId)).length >= MAX_ALLIANCES_PER_REALM) return 'That realm holds as many alliances as a realm may.';
  return null;
}
/** Checked again on acceptance: nothing may have changed between the realms. */
export function allianceAcceptanceBlocker(state: GameState, offer: AllianceOffer): string | null {
  if (!state.factions.some(faction => faction.id === offer.proposerId) || !state.factions.some(faction => faction.id === offer.recipientId)) return 'The offer references an unknown realm.';
  if (atWar(state, offer.proposerId, offer.recipientId)) return 'The realms are at war; the offer cannot be accepted.';
  if (allianceBetween(state, offer.proposerId, offer.recipientId)) return 'The realms are allied already.';
  if (bound(state, offer.proposerId, offer.recipientId)) return 'Patron and client are bound already.';
  if (state.alliances.pacts.filter(pact => pact.parties.includes(offer.recipientId)).length >= MAX_ALLIANCES_PER_REALM) return 'Your realm holds as many alliances as a realm may.';
  return null;
}
export function proposeAlliance(state: GameState, factionId: string, targetFactionId: string, termTurns: number): CommandResult {
  const parsed = allianceTermSchema.safeParse(termTurns);
  if (!parsed.success) return fail('Choose a term of ten to sixty turns.');
  const objection = allianceProposalObjection(state, factionId, targetFactionId);
  if (objection) return fail(objection);
  const offer: AllianceOffer = { id: `ally.${state.nextId++}`, proposerId: factionId, recipientId: targetFactionId, createdTurn: state.turn, expiresTurn: state.turn + ALLIANCE_OFFER_TURNS, termTurns: parsed.data };
  state.alliances.offers = [...state.alliances.offers, offer].sort(byId);
  return { ok: true, events: pairEvents(state, factionId, targetFactionId, 'alliance_proposed', `${nameOf(state, factionId)} offers ${nameOf(state, targetFactionId)} an alliance of ${parsed.data} turns; it awaits an answer until turn ${offer.expiresTurn}.`) };
}
export function respondAlliance(state: GameState, factionId: string, offerId: string, accept: boolean): CommandResult {
  if (rulesVersion(state) < 50) return fail('Alliances are unavailable under these historical rules.');
  const offer = state.alliances.offers.find(item => item.id === offerId && item.recipientId === factionId);
  if (!offer) return fail('Choose an incoming alliance offer.');
  if (offer.expiresTurn <= state.turn) return fail('This alliance offer is no longer valid.');
  const blocker = accept ? allianceAcceptanceBlocker(state, offer) : null;
  if (blocker) return fail(blocker);
  state.alliances.offers = state.alliances.offers.filter(item => item.id !== offer.id);
  if (!accept) return { ok: true, events: pairEvents(state, offer.proposerId, offer.recipientId, 'alliance_refused', `${nameOf(state, offer.recipientId)} refused the alliance ${nameOf(state, offer.proposerId)} offered.`) };
  const pact: Alliance = { id: `pact.${state.nextId++}`, parties: warPair(offer.proposerId, offer.recipientId), proposerId: offer.proposerId, startedTurn: state.turn, expiresTurn: state.turn + offer.termTurns, termTurns: offer.termTurns };
  state.alliances.pacts = [...state.alliances.pacts, pact].sort(byId);
  return { ok: true, events: pairEvents(state, offer.proposerId, offer.recipientId, 'alliance_sworn', `${nameOf(state, offer.proposerId)} and ${nameOf(state, offer.recipientId)} are allied until turn ${pact.expiresTurn}: neither makes war on the other, and each answers a war declared on the other.`) };
}
/** Ending an alliance before its term is a breach the former ally remembers; after it, the pact simply ends. */
export function renounceAlliance(state: GameState, factionId: string, allyId: string): CommandResult {
  if (rulesVersion(state) < 50) return fail('Alliances are unavailable under these historical rules.');
  const pact = allianceBetween(state, factionId, allyId);
  if (!pact) return fail('Your realm is not allied with that realm.');
  const lawful = state.turn >= pact.expiresTurn;
  state.alliances.pacts = state.alliances.pacts.filter(item => item.id !== pact.id);
  if (lawful) return { ok: true, events: pairEvents(state, factionId, allyId, 'alliance_ended', `The alliance of ${nameOf(state, factionId)} and ${nameOf(state, allyId)} ran its term and ended.`) };
  const memory = relation(state, factionId, allyId);
  memory.trust = Math.max(-100, memory.trust - 25); memory.grievances = Math.min(100, memory.grievances + 20);
  return { ok: true, events: pairEvents(state, factionId, allyId, 'alliance_broken', `${nameOf(state, factionId)} renounced its alliance with ${nameOf(state, allyId)} before turn ${pact.expiresTurn}; the breach is remembered.`) };
}
/** Rules 50: the allies of a realm just declared war on enter the war, each unless an oath, a binding peace, a supply agreement or an alliance with the attacker binds it. */
export function callAllies(state: GameState, attackerId: string, targetId: string, blockerFor: (allyId: string) => string | null): DomainEvent[] {
  if (rulesVersion(state) < 50) return [];
  const events: DomainEvent[] = [];
  for (const allyId of alliesOf(state, targetId)) {
    if (allyId === attackerId || atWar(state, allyId, attackerId)) continue;
    const blocker = allianceBetween(state, allyId, attackerId) ? 'it is allied with both.' : blockerFor(allyId);
    if (blocker) {
      events.push(...[allyId, targetId, attackerId].map(factionId => ({ turn: state.turn, factionId, type: 'alliance_unanswered', message: `${nameOf(state, allyId)} could not answer ${nameOf(state, targetId)}'s call against ${nameOf(state, attackerId)}: ${blocker}` })));
      continue;
    }
    state.wars.push(warPair(allyId, attackerId));
    state.wars.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
    // Rules 56: the call is kept while the war lasts, so the partner's peace ends it.
    if (rulesVersion(state) >= 56) state.alliances.calls = [...state.alliances.calls, { allyId, attackerId, partnerId: targetId, turn: state.turn }].sort(byCall);
    events.push(...[allyId, targetId, attackerId].map(factionId => ({ turn: state.turn, factionId, type: 'alliance_answered', message: `${nameOf(state, allyId)} enters the war against ${nameOf(state, attackerId)} beside its ally ${nameOf(state, targetId)}.` })));
  }
  return events;
}
/** Rules 58: the patron of a realm just declared war on enters the war as its
 * guarantor, unless an oath, a binding peace, a supply agreement or an
 * alliance with the attacker binds it; the call is kept like an ally's, so the
 * client's peace ends the patron's war and the patron's own peace releases it. */
export function callPatron(state: GameState, attackerId: string, clientId: string, blockerFor: (patronId: string) => string | null): DomainEvent[] {
  if (rulesVersion(state) < 58) return [];
  const bond = state.diplomacy.clients.find(item => item.clientId === clientId);
  if (!bond || bond.patronId === attackerId || atWar(state, bond.patronId, attackerId)) return [];
  const patronId = bond.patronId;
  const blocker = allianceBetween(state, patronId, attackerId) ? 'it is allied with the attacker.' : blockerFor(patronId);
  if (blocker) return [patronId, clientId, attackerId].map(factionId => ({ turn: state.turn, factionId, type: 'patronage_unanswered', message: `${nameOf(state, patronId)} could not stand for its client ${nameOf(state, clientId)} against ${nameOf(state, attackerId)}: ${blocker}` }));
  state.wars.push(warPair(patronId, attackerId));
  state.wars.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  state.alliances.calls = [...state.alliances.calls, { allyId: patronId, attackerId, partnerId: clientId, turn: state.turn }].sort(byCall);
  return [patronId, clientId, attackerId].map(factionId => ({ turn: state.turn, factionId, type: 'patronage_answered', message: `${nameOf(state, patronId)} enters the war against ${nameOf(state, attackerId)} for its client ${nameOf(state, clientId)}.` }));
}
/** Rules 56: a peace between two realms settles the calls around it. An ally that
 * made its own peace with the attacker is released from its call; and every ally
 * still at war with the attacker beside the realm that just made peace leaves
 * that war with the same truce and no coin, its offers on the war lapsing, all
 * three parties reading it. Nothing happens under earlier rules. */
export function alliedPeace(state: GameState, a: string, b: string, truceTurns: number): DomainEvent[] {
  if (rulesVersion(state) < 56) return [];
  const events: DomainEvent[] = [];
  state.alliances.calls = state.alliances.calls.filter(call => !same([call.allyId, call.attackerId], a, b));
  const answered = state.alliances.calls.filter(call => same([call.partnerId, call.attackerId], a, b));
  state.alliances.calls = state.alliances.calls.filter(call => !answered.includes(call));
  for (const call of answered) {
    if (!atWar(state, call.allyId, call.attackerId)) continue;
    state.wars = state.wars.filter(pair => !same(pair, call.allyId, call.attackerId));
    const dropped = state.diplomacy.offers.filter(offer => same(warPair(offer.proposerId, offer.recipientId), call.allyId, call.attackerId));
    state.diplomacy.offers = state.diplomacy.offers.filter(offer => !dropped.includes(offer));
    state.diplomacy.treaties = state.diplomacy.treaties.filter(treaty => !same(treaty.parties, call.allyId, call.attackerId));
    state.diplomacy.treaties.push({ id: `treaty.${state.nextId++}`, parties: warPair(call.allyId, call.attackerId), proposerId: call.attackerId, startedTurn: state.turn, expiresTurn: state.turn + truceTurns, terms: { offerCoin: 0, requestCoin: 0, truceTurns } });
    state.diplomacy.treaties.sort(byId);
    relation(state, call.allyId, call.attackerId).warStartedTurn = null;
    events.push(...dropped.flatMap(offer => pairEvents(state, offer.proposerId, offer.recipientId, 'peace_offer_expired', `Peace offer ${offer.id} lapsed: the war it addressed has ended.`)));
    for (const factionId of [call.allyId, call.partnerId, call.attackerId]) events.push({ turn: state.turn, factionId, type: 'allied_peace', message: `${nameOf(state, call.allyId)} leaves the war against ${nameOf(state, call.attackerId)} with the peace its ally ${nameOf(state, call.partnerId)} made; the truce binds them until turn ${state.turn + truceTurns}.` });
  }
  return events;
}
/** Expired offers and pacts, bounded by relationships. */
export function advanceAlliances(state: GameState): DomainEvent[] {
  if (rulesVersion(state) < 50) return [];
  const events: DomainEvent[] = [];
  state.alliances.offers = state.alliances.offers.filter(offer => {
    if (offer.expiresTurn > state.turn) return true;
    events.push(...pairEvents(state, offer.proposerId, offer.recipientId, 'alliance_offer_expired', `The alliance ${nameOf(state, offer.proposerId)} offered ${nameOf(state, offer.recipientId)} expired without an answer.`));
    return false;
  });
  state.alliances.pacts = state.alliances.pacts.filter(pact => {
    if (pact.expiresTurn > state.turn && state.factions.some(faction => faction.id === pact.parties[0]) && state.factions.some(faction => faction.id === pact.parties[1])) return true;
    events.push(...pairEvents(state, pact.parties[0], pact.parties[1], 'alliance_ended', `The alliance of ${nameOf(state, pact.parties[0])} and ${nameOf(state, pact.parties[1])} ran its term and ended.`));
    return false;
  });
  return events;
}
/** Pacts are public; offers are seen by their two parties, with the acceptance blocker quoted. */
export function observeAlliances(state: GameState, factionId: string): ObservedAlliances | undefined {
  if (rulesVersion(state) < 50) return undefined;
  return {
    pacts: state.alliances.pacts.map(pact => ({ ...pact, parties: [...pact.parties] as [string, string] })),
    offers: state.alliances.offers.filter(offer => offer.proposerId === factionId || offer.recipientId === factionId).map(offer => ({ ...offer, acceptanceBlocker: allianceAcceptanceBlocker(state, offer) })),
    ...(rulesVersion(state) >= 56 ? { calls: state.alliances.calls.filter(call => call.allyId === factionId || call.attackerId === factionId || call.partnerId === factionId).map(call => ({ ...call })) } : {}),
  };
}
export const hasAlliances = (state: GameState): boolean => (state.alliances?.pacts.length ?? 0) > 0 || (state.alliances?.offers.length ?? 0) > 0;
export const hasAllianceCalls = (state: GameState): boolean => (state.alliances?.calls?.length ?? 0) > 0;
export function assertNoAllianceCalls(state: GameState): void {
  if (hasAllianceCalls(state)) throw new Error('This campaign has answered calls of alliance unavailable in historical rules.');
}
export function assertNoAlliances(state: GameState): void {
  if (hasAlliances(state)) throw new Error('This campaign has alliances unavailable in historical rules.');
}
export function validateAlliances(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: alliance ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  const ordered = (values: { id: string }[]): boolean => values.every((value, index) => !index || byId(values[index - 1]!, value) < 0);
  assert(ordered(state.alliances.pacts) && ordered(state.alliances.offers), 'records must be unique and canonically ordered');
  const pairs = new Set<string>();
  for (const pact of state.alliances.pacts) {
    assert(/^pact\.[1-9][0-9]*$/.test(pact.id) && Number(pact.id.slice(5)) < state.nextId, 'has invalid entity IDs');
    assert(factions.has(pact.parties[0]) && factions.has(pact.parties[1]) && pact.parties[0] < pact.parties[1], 'requires two distinct known realms in order');
    assert(pact.parties.includes(pact.proposerId), 'names a proposer outside the pact');
    assert(!isCityState(pact.parties[0]) && !isCityState(pact.parties[1]), 'binds a city-state');
    assert(!atWar(state, pact.parties[0], pact.parties[1]), 'binds realms at war');
    assert(!bound(state, pact.parties[0], pact.parties[1]), 'binds patron and client');
    assert(pact.startedTurn <= state.turn && pact.expiresTurn === pact.startedTurn + pact.termTurns && pact.expiresTurn > state.turn, 'has an invalid term');
    const key = pact.parties.join('|');
    assert(!pairs.has(key), 'binds one pair twice'); pairs.add(key);
  }
  for (const factionId of factions) assert(state.alliances.pacts.filter(pact => pact.parties.includes(factionId)).length <= MAX_ALLIANCES_PER_REALM, 'exceeds a realm’s alliances');
  const pending = new Set<string>();
  for (const offer of state.alliances.offers) {
    assert(/^ally\.[1-9][0-9]*$/.test(offer.id) && Number(offer.id.slice(5)) < state.nextId, 'has invalid entity IDs');
    assert(factions.has(offer.proposerId) && factions.has(offer.recipientId) && offer.proposerId !== offer.recipientId, 'requires two distinct known realms');
    const key = warPair(offer.proposerId, offer.recipientId).join('|');
    assert(!pending.has(key), 'has duplicate offers for one pair'); pending.add(key);
    assert(offer.createdTurn <= state.turn && offer.expiresTurn === offer.createdTurn + ALLIANCE_OFFER_TURNS && offer.expiresTurn > state.turn, 'has an invalid offer lifetime');
  }
  for (const [index, call] of (state.alliances.calls ?? []).entries()) {
    assert(factions.has(call.allyId) && factions.has(call.attackerId) && factions.has(call.partnerId), 'call names an unknown realm');
    assert(call.allyId !== call.attackerId && call.allyId !== call.partnerId && call.partnerId !== call.attackerId, 'call names the same realm twice');
    assert(call.turn <= state.turn, 'call lies ahead');
    assert(!index || byCall(state.alliances.calls[index - 1]!, call) < 0, 'calls are out of order');
  }
}
