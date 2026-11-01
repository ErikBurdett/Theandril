import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from './index';
import { recordWar } from './diplomacy';
import { withRules } from './rules';
import { serializeGameForVersion } from './save';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { ALLIANCE_OFFER_TURNS, alliesOf, validateAlliances } from './alliances';
import { warPair } from './warfare';

const scene = (): GameState => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 , rulesVersion: 68 /* the first roster, so the campaign also seals under the older rules this file reads */ });
  for (const faction of state.factions) faction.treasury = 200;
  return state;
};
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
const reject = (state: GameState, command: GameCommand, error: string) => { const before = stateHash(state); expect(applyCommand(state, command)).toMatchObject({ ok: false, error: expect.stringContaining(error) }); expect(stateHash(state)).toBe(before); };
/** Puts one of `seer`'s armies beside one of `seen`'s so war may be declared. */
const contact = (state: GameState, seer: string, seen: string) => {
  const mine = Object.values(state.armies).find(army => army.factionId === seer)!, theirs = Object.values(state.armies).find(army => army.factionId === seen)!;
  mine.cell = theirs.cell + 1; refreshAuthoredSight(state);
};

describe('alliances (rules 50)', () => {
  it('is offered, answered, sworn for a term, keeps allies from each other’s throats, and ends with its term', () => {
    const state = scene(), [a, b, c] = state.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
    const city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
    reject(state, { type: 'proposeAlliance', factionId: a, targetFactionId: a, termTurns: 20 }, 'different known realm');
    reject(state, { type: 'proposeAlliance', factionId: a, targetFactionId: city, termTurns: 20 }, 'city-state');
    reject(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 5 }, 'Malformed command');
    const offered = issue(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 20 });
    expect(offered.events.map(event => event.type)).toEqual(['alliance_proposed', 'alliance_proposed']);
    const offer = state.alliances.offers[0]!;
    expect(offer).toMatchObject({ proposerId: a, recipientId: b, termTurns: 20, expiresTurn: state.turn + ALLIANCE_OFFER_TURNS });
    reject(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 20 }, 'standing offer');
    reject(state, { type: 'proposeAlliance', factionId: b, targetFactionId: a, termTurns: 20 }, 'answer it first');
    // Only the recipient answers; the proposer sees the offer, a third realm does not.
    expect(getObservation(state, a).alliances!.offers).toHaveLength(1);
    expect(getObservation(state, c).alliances!.offers).toHaveLength(0);
    reject(state, { type: 'respondAlliance', factionId: a, offerId: offer.id, accept: true }, 'incoming alliance offer');
    const sworn = issue(state, { type: 'respondAlliance', factionId: b, offerId: offer.id, accept: true });
    expect(sworn.events[0]!.type).toBe('alliance_sworn');
    const pact = state.alliances.pacts[0]!;
    expect(pact).toMatchObject({ parties: warPair(a, b), proposerId: a, expiresTurn: state.turn + 20 });
    expect(alliesOf(state, a)).toEqual([b]);
    expect(getObservation(state, c).alliances!.pacts).toHaveLength(1); // pacts are public
    // Allies do not make war on each other; a second pact between them is refused; patron and client do not ally.
    contact(state, a, b);
    reject(state, { type: 'declareWar', factionId: a, targetFactionId: b }, 'Allied realms');
    reject(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 20 }, 'allied already');
    reject(state, { type: 'proposeClient', factionId: a, targetFactionId: b, terms: { giftCoin: 10, tributeCoin: 2, termTurns: 10 } }, 'Allied realms do not take');
    expect(() => validateAlliances(state)).not.toThrow();
    // The term runs out at the turn's close.
    state.turn = pact.expiresTurn - 1;
    const ended = issue(state, { type: 'endTurn', factionId: state.turnOwnerId }).events.filter(event => event.type === 'alliance_ended');
    expect(ended).toHaveLength(2);
    expect(state.alliances.pacts).toEqual([]);
    // An offer left unanswered expires.
    issue(state, { type: 'proposeAlliance', factionId: a, targetFactionId: c, termTurns: 10 });
    state.turn = state.alliances.offers[0]!.expiresTurn - 1;
    expect(issue(state, { type: 'endTurn', factionId: state.turnOwnerId }).events.some(event => event.type === 'alliance_offer_expired')).toBe(true);
    expect(state.alliances.offers).toEqual([]);
  });

  it('calls an ally into a war declared on its partner, unless a binding peace, an oath or a supply agreement with the attacker binds it, and never into a war its partner opens', () => {
    const state = scene(), [a, b, c] = state.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
    issue(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 30 });
    issue(state, { type: 'respondAlliance', factionId: b, offerId: state.alliances.offers[0]!.id, accept: true });
    // c declares war on b: a enters the war beside b, and every party reads it.
    contact(state, c, b);
    const declared = issue(state, { type: 'declareWar', factionId: c, targetFactionId: b });
    expect(declared.events.filter(event => event.type === 'alliance_answered').map(event => event.factionId).sort()).toEqual([a, b, c].sort());
    expect(state.wars).toContainEqual(warPair(a, c));
    expect(state.diplomacy.relations.find(memory => memory.parties.includes(a) && memory.parties.includes(c))?.warStartedTurn).toBe(state.turn);
    expect(() => validateAlliances(state)).not.toThrow();
    // A binding peace between the ally and the attacker leaves the call unanswered.
    const bound = scene(), [x, y, z] = bound.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
    issue(bound, { type: 'proposeAlliance', factionId: x, targetFactionId: y, termTurns: 30 });
    issue(bound, { type: 'respondAlliance', factionId: y, offerId: bound.alliances.offers[0]!.id, accept: true });
    bound.diplomacy.treaties.push({ id: `treaty.${bound.nextId++}`, parties: warPair(x, z), startedTurn: bound.turn, expiresTurn: bound.turn + 10, proposerId: x, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } });
    contact(bound, z, y);
    const quiet = issue(bound, { type: 'declareWar', factionId: z, targetFactionId: y });
    expect(quiet.events.some(event => event.type === 'alliance_unanswered' && event.message.includes('binding peace'))).toBe(true);
    expect(bound.wars).not.toContainEqual(warPair(x, z));
    // An ally allied with the attacker too answers neither; its call goes unanswered and every party reads why.
    const both = scene(), [m, n, o] = both.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
    issue(both, { type: 'proposeAlliance', factionId: m, targetFactionId: n, termTurns: 30 });
    issue(both, { type: 'respondAlliance', factionId: n, offerId: both.alliances.offers[0]!.id, accept: true });
    issue(both, { type: 'proposeAlliance', factionId: m, targetFactionId: o, termTurns: 30 });
    issue(both, { type: 'respondAlliance', factionId: o, offerId: both.alliances.offers[0]!.id, accept: true });
    contact(both, o, n);
    const torn = issue(both, { type: 'declareWar', factionId: o, targetFactionId: n });
    expect(torn.events.some(event => event.type === 'alliance_unanswered' && event.message.includes('allied with both'))).toBe(true);
    expect(both.wars).not.toContainEqual(warPair(m, o));
    expect(() => validateAlliances(both)).not.toThrow();
    // An alliance never calls an ally into a war its partner opens.
    const offensive = scene(), [p, q, r] = offensive.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
    issue(offensive, { type: 'proposeAlliance', factionId: p, targetFactionId: q, termTurns: 30 });
    issue(offensive, { type: 'respondAlliance', factionId: q, offerId: offensive.alliances.offers[0]!.id, accept: true });
    contact(offensive, q, r);
    const opened = issue(offensive, { type: 'declareWar', factionId: q, targetFactionId: r });
    expect(opened.events.some(event => event.type === 'alliance_answered')).toBe(false);
    expect(offensive.wars).not.toContainEqual(warPair(p, r));
  });

  it('refuses an alliance across a war, counts a realm’s pacts and offers against its limit, remembers a breach, and is absent from older rules and envelopes', () => {
    const state = scene(), [a, b, c] = state.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
    state.wars.push(warPair(a, b)); recordWar(state, a, b);
    reject(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 20 }, 'Make peace');
    issue(state, { type: 'proposeAlliance', factionId: a, targetFactionId: c, termTurns: 20 });
    const offer = state.alliances.offers[0]!;
    // Changed facts are checked again on acceptance: a war opened meanwhile blocks the offer, and the quote says so.
    state.wars.push(warPair(a, c)); recordWar(state, a, c);
    expect(getObservation(state, c).alliances!.offers[0]!.acceptanceBlocker).toContain('at war');
    reject(state, { type: 'respondAlliance', factionId: c, offerId: offer.id, accept: true }, 'at war');
    issue(state, { type: 'respondAlliance', factionId: c, offerId: offer.id, accept: false });
    expect(state.alliances.offers).toEqual([]);
    // A breach before the term is remembered.
    const pact = scene(), [x, y] = pact.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string];
    issue(pact, { type: 'proposeAlliance', factionId: x, targetFactionId: y, termTurns: 30 });
    issue(pact, { type: 'respondAlliance', factionId: y, offerId: pact.alliances.offers[0]!.id, accept: true });
    reject(pact, { type: 'renounceAlliance', factionId: x, allyId: 'faction.nobody' }, 'not allied');
    const broken = issue(pact, { type: 'renounceAlliance', factionId: x, allyId: y });
    expect(broken.events[0]!.type).toBe('alliance_broken');
    expect(pact.diplomacy.relations.find(memory => memory.parties.includes(x) && memory.parties.includes(y))).toMatchObject({ trust: -25, grievances: 20 });
    expect(pact.alliances.pacts).toEqual([]);
    // Saves carry the register; an older envelope loads with none and cannot be sealed from a campaign that holds any.
    issue(pact, { type: 'proposeAlliance', factionId: x, targetFactionId: y, termTurns: 30 });
    const loaded = deserializeGame(serializeGame(pact));
    expect(stateHash(loaded)).toBe(stateHash(pact));
    expect(loaded.alliances.offers).toHaveLength(1);
    expect(() => serializeGameForVersion(pact, 49)).toThrow('alliances unavailable');
    const fresh = scene();
    const older = deserializeGame(serializeGameForVersion(fresh, 49));
    expect(older.alliances).toEqual({ pacts: [], offers: [], calls: [] });
    expect(stateHash(older)).toBe(stateHash(fresh));
    withRules(fresh, 49, () => { expect(applyCommand(fresh, { type: 'proposeAlliance', factionId: x, targetFactionId: y, termTurns: 30 })).toMatchObject({ ok: false }); expect(getObservation(fresh, x).alliances).toBeUndefined(); });
  });

  it('rules 56: the partner’s peace ends the wars its allies were called into, an ally’s own peace releases its call, and the calls stay out of older rules and envelopes', () => {
    const allied = (): { state: GameState; a: string; b: string; c: string } => {
      const state = scene(), [a, b, c] = state.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
      issue(state, { type: 'proposeAlliance', factionId: a, targetFactionId: b, termTurns: 30 });
      issue(state, { type: 'respondAlliance', factionId: b, offerId: state.alliances.offers[0]!.id, accept: true });
      contact(state, c, b);
      issue(state, { type: 'declareWar', factionId: c, targetFactionId: b });
      return { state, a, b, c };
    };
    const { state, a, b, c } = allied();
    const call = { allyId: a, attackerId: c, partnerId: b, turn: state.turn };
    expect(state.alliances.calls).toEqual([call]);
    for (const id of [a, b, c]) expect(getObservation(state, id).alliances!.calls).toEqual([call]);
    expect(getObservation(state, state.factions.find(faction => faction.id.startsWith('citystate.'))!.id).alliances!.calls).toEqual([]);
    expect(() => validateAlliances(state)).not.toThrow();
    // c offers b peace and b accepts: a leaves the war with the same truce and no coin, and all three read it.
    issue(state, { type: 'proposePeace', factionId: c, targetFactionId: b, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 12 } });
    const offer = state.diplomacy.offers.find(item => item.proposerId === c && item.recipientId === b)!;
    const peace = issue(state, { type: 'respondPeace', factionId: b, offerId: offer.id, accept: true });
    expect(state.wars.some(pair => pair.includes(a) && pair.includes(c))).toBe(false);
    expect(state.diplomacy.treaties.some(treaty => treaty.parties.includes(a) && treaty.parties.includes(c) && treaty.expiresTurn === state.turn + 12 && treaty.terms.offerCoin === 0 && treaty.terms.requestCoin === 0)).toBe(true);
    expect(peace.events.filter(event => event.type === 'allied_peace').map(event => event.factionId).sort()).toEqual([a, b, c].sort());
    expect(peace.events.find(event => event.type === 'allied_peace')!.message).toContain('leaves the war against');
    expect(state.alliances.calls).toEqual([]);
    expect(state.diplomacy.relations.find(memory => memory.parties.includes(a) && memory.parties.includes(c))?.warStartedTurn).toBeNull();
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // The ally's own peace releases its call; its partner's later peace then changes nothing for it.
    const own = allied();
    issue(own.state, { type: 'proposePeace', factionId: own.c, targetFactionId: own.a, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } });
    const toAlly = own.state.diplomacy.offers.find(item => item.proposerId === own.c && item.recipientId === own.a)!;
    const released = issue(own.state, { type: 'respondPeace', factionId: own.a, offerId: toAlly.id, accept: true });
    expect(released.events.filter(event => event.type === 'allied_peace')).toEqual([]);
    expect(own.state.alliances.calls).toEqual([]);
    issue(own.state, { type: 'proposePeace', factionId: own.c, targetFactionId: own.b, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } });
    const toPartner = own.state.diplomacy.offers.find(item => item.proposerId === own.c && item.recipientId === own.b)!;
    expect(issue(own.state, { type: 'respondPeace', factionId: own.b, offerId: toPartner.id, accept: true }).events.filter(event => event.type === 'allied_peace')).toEqual([]);
    // Older rules record no call; a campaign with one cannot be sealed under them; a v55 envelope loads with none.
    const older = scene(), [x, y, z] = older.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
    withRules(older, 55, () => {
      issue(older, { type: 'proposeAlliance', factionId: x, targetFactionId: y, termTurns: 30 });
      issue(older, { type: 'respondAlliance', factionId: y, offerId: older.alliances.offers[0]!.id, accept: true });
      contact(older, z, y);
      issue(older, { type: 'declareWar', factionId: z, targetFactionId: y });
      expect(older.wars).toContainEqual(warPair(x, z));
      expect(older.alliances.calls).toEqual([]);
      expect(getObservation(older, x).alliances!.calls).toBeUndefined();
    });
    expect(() => serializeGameForVersion(allied().state, 55)).toThrow('answered calls of alliance unavailable');
    const fresh = scene();
    const sealed = serializeGameForVersion(fresh, 55);
    expect(JSON.parse(sealed).state.alliances.calls).toBeUndefined();
    const loaded = deserializeGame(sealed);
    expect(loaded.alliances.calls).toEqual([]);
    expect(stateHash(loaded)).toBe(stateHash(fresh));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 76 });
  });
});
