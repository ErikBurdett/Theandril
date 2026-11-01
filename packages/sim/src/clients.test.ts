import { describe, expect, it } from 'vitest';
import { applyCommand, applyCommandForVersion, createGame, deserializeGame, getObservation, serializeGame, serializeGameForVersion, stateHash, type GameCommand, type GameState } from './index';
import { recordWar } from './diplomacy';
import { cityStateTradeFor } from '@theandril/content';
import { advanceClients } from './clients';
import { withRules } from './rules';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { unificationCampaign } from '../../test-fixtures/src/victory-fixture';

const terms = { giftCoin: 40, tributeCoin: 6, termTurns: 12 };
const scene = (): GameState => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 2, pace: 'short', generatorVersion: 4 , rulesVersion: 68 /* the first roster, so the campaign also seals under the older rules this file reads */ });
  for (const faction of state.factions) faction.treasury = 200;
  return state;
};
const issue = (state: GameState, command: GameCommand) => {
  const result = applyCommand(state, command);
  expect(result.ok, result.error).toBe(true);
  return result;
};
const reject = (state: GameState, command: GameCommand, error: string) => {
  const before = stateHash(state);
  expect(applyCommand(state, command)).toMatchObject({ ok: false, error });
  expect(stateHash(state)).toBe(before);
};
const bond = (state: GameState, clientId: string) => state.diplomacy.clients.find(item => item.clientId === clientId);
const offerId = (state: GameState) => state.diplomacy.clientOffers[0]!.id;

describe('patronage between realms (rules 22)', () => {
  it('pays a subsidy on acceptance, takes tribute each turn and ends when the term runs out', () => {
    const state = scene(), patron = state.factions[0]!, client = state.factions[2]!;
    issue(state, { type: 'proposeClient', factionId: patron.id, targetFactionId: client.id, terms });
    // The offer is private to its two realms and discloses its whole cost before consent.
    const offered = getObservation(state, client.id).diplomacy.clientOffers[0]!;
    expect(offered).toMatchObject({ patronId: patron.id, clientId: client.id, terms, acceptanceBlocker: null });
    expect(getObservation(state, state.factions[1]!.id).diplomacy.clientOffers).toEqual([]);
    issue(state, { type: 'respondClient', factionId: client.id, offerId: offered.id, accept: true });
    expect(patron.treasury).toBe(160); expect(client.treasury).toBe(240);
    expect(bond(state, client.id)).toMatchObject({ patronId: patron.id, expiresTurn: state.turn + terms.termTurns, missedTribute: 0 });
    // The oath is public: every realm can see who answers to whom.
    expect(getObservation(state, state.factions[1]!.id).diplomacy.clients).toHaveLength(1);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));

    const resumed = deserializeGame(serializeGame(state));
    for (let turn = 0; turn < terms.termTurns; turn++) for (const faction of state.factions) {
      if (faction.id === state.turnOwnerId) { issue(state, { type: 'endTurn', factionId: faction.id }); issue(resumed, { type: 'endTurn', factionId: faction.id }); }
    }
    expect(stateHash(resumed)).toBe(stateHash(state));
    expect(bond(state, client.id)).toBeUndefined();
    // The subsidy went out once and twelve turns of tribute came back, so the patron ends ahead.
    expect(state.factions[0]!.treasury).toBeGreaterThan(state.factions[2]!.treasury);
  });

  it('refuses patronage that would chain, duplicate or cross a war', () => {
    const state = scene(), [patron, rival, client, other] = state.factions.map(faction => faction.id) as [string, string, string, string];
    reject(state, { type: 'proposeClient', factionId: patron, targetFactionId: patron, terms }, 'Choose a different known realm.');
    reject(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms: { ...terms, giftCoin: 5000 } }, 'You cannot fund the offered subsidy.');
    issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms });
    reject(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms }, 'Await the answer to your standing offer.');
    issue(state, { type: 'respondClient', factionId: client, offerId: offerId(state), accept: true });
    reject(state, { type: 'proposeClient', factionId: rival, targetFactionId: client, terms }, 'That realm already answers to a patron.');
    reject(state, { type: 'proposeClient', factionId: client, targetFactionId: other, terms }, 'A client realm cannot take clients of its own.');
    reject(state, { type: 'proposeClient', factionId: rival, targetFactionId: patron, terms }, 'That realm has clients of its own; it must release them first.');
    reject(state, { type: 'declareWar', factionId: patron, targetFactionId: client }, 'Patron and client do not make war on each other. End the obligation first.');
    // An authored war isolates this objection; contact and scouting are covered elsewhere.
    state.wars.push([rival, other].sort() as [string, string]);
    recordWar(state, rival, other);
    reject(state, { type: 'proposeClient', factionId: rival, targetFactionId: other, terms }, 'Make peace before offering patronage.');
  });

  it('lets a patron release a client and a client renounce, with a breach ending the peace between them', () => {
    const state = scene(), patron = state.factions[0]!.id, client = state.factions[2]!.id, second = state.factions[3]!.id;
    issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms });
    issue(state, { type: 'respondClient', factionId: client, offerId: offerId(state), accept: true });
    issue(state, { type: 'releaseClient', factionId: patron, clientId: client });
    expect(state.diplomacy.clients).toEqual([]);
    reject(state, { type: 'releaseClient', factionId: patron, clientId: client }, 'Choose one of your own clients.');

    issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: second, terms });
    issue(state, { type: 'respondClient', factionId: second, offerId: offerId(state), accept: true });
    // An authored truce shows what a breach costs: the binding peace between them ends.
    const parties = [patron, second].sort() as [string, string];
    recordWar(state, patron, second);
    const memory = state.diplomacy.relations.find(item => item.parties[0] === parties[0] && item.parties[1] === parties[1])!;
    memory.warStartedTurn = null;
    state.diplomacy.treaties.push({ id: `treaty.${state.nextId++}`, parties, proposerId: patron, startedTurn: state.turn, expiresTurn: state.turn + 10, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } });
    const result = issue(state, { type: 'renounceClient', factionId: second });
    expect(result.events.some(event => event.type === 'client_broken')).toBe(true);
    expect(state.diplomacy.clients).toEqual([]);
    expect(state.diplomacy.treaties).toEqual([]);
    expect(memory.grievances).toBeGreaterThan(0); expect(memory.trust).toBeLessThan(0);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
  });

  it('lapses an obligation a client cannot pay for three turns running', () => {
    const state = scene(), patron = state.factions[0]!.id, client = state.factions[2]!;
    issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: client.id, terms: { ...terms, giftCoin: 0, tributeCoin: 200 } });
    issue(state, { type: 'respondClient', factionId: client.id, offerId: offerId(state), accept: true });
    client.treasury = 0;
    const missed: string[] = [];
    for (let turn = 0; turn < 4 && bond(state, client.id); turn++) {
      client.treasury = 0;
      for (const faction of state.factions) if (faction.id === state.turnOwnerId) missed.push(...issue(state, { type: 'endTurn', factionId: faction.id }).events.filter(event => event.type.startsWith('client_')).map(event => event.type));
    }
    expect(missed).toContain('client_tribute_missed');
    expect(missed).toContain('client_lapsed');
    expect(bond(state, client.id)).toBeUndefined();
  });

  it('counts a client’s hearths behind its patron’s unification bid', () => {
    // A campaign with real hearths on both sides: political support must count like conquest.
    const state = unificationCampaign(), patron = state.factions[0]!.id, client = state.factions[1]!.id;
    for (const faction of state.factions) faction.treasury = 200;
    const before = getObservation(state, patron).progression.unification!;
    issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms });
    issue(state, { type: 'respondClient', factionId: client, offerId: offerId(state), accept: true });
    const after = getObservation(state, patron).progression.unification!;
    expect(after.own).toBe(before.own);
    expect(after.pledged).toBe(1);
    expect(after.held).toBe(before.held + 1);
  });

  it('is absent from historical rules and refused by older envelopes', () => {
    const state = scene(), patron = state.factions[0]!.id, client = state.factions[2]!.id;
    expect(applyCommandForVersion(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms }, 21)).toMatchObject({ ok: false });
    // A patronage-free campaign still projects into a rules-21 envelope unchanged.
    expect(stateHash(deserializeGame(serializeGameForVersion(state, 21)))).toBe(stateHash(state));
    issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms });
    expect(() => serializeGameForVersion(state, 21)).toThrow('patronage');
    issue(state, { type: 'respondClient', factionId: client, offerId: offerId(state), accept: true });
    expect(() => serializeGameForVersion(state, 20)).toThrow('patronage');
  });

  it('rules 58: a patron stands for its client against a declared war, unless bound to the attacker, and leaves with the client’s peace', () => {
    const guaranteed = (): { state: GameState; patron: string; client: string; attacker: string } => {
      const state = scene(), [patron, client, attacker] = state.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string, string];
      issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: client, terms });
      issue(state, { type: 'respondClient', factionId: client, offerId: offerId(state), accept: true });
      const mine = Object.values(state.armies).find(army => army.factionId === attacker)!, theirs = Object.values(state.armies).find(army => army.factionId === client)!;
      mine.cell = theirs.cell + 1; refreshAuthoredSight(state);
      return { state, patron, client, attacker };
    };
    const { state, patron, client, attacker } = guaranteed();
    const declared = issue(state, { type: 'declareWar', factionId: attacker, targetFactionId: client });
    expect(declared.events.filter(event => event.type === 'patronage_answered').map(event => event.factionId).sort()).toEqual([patron, client, attacker].sort());
    expect(declared.events.find(event => event.type === 'patronage_answered')!.message).toContain(`for its client`);
    expect(state.wars.some(pair => pair.includes(patron) && pair.includes(attacker))).toBe(true);
    expect(state.alliances.calls).toEqual([{ allyId: patron, attackerId: attacker, partnerId: client, turn: state.turn }]);
    expect(state.diplomacy.relations.find(memory => memory.parties.includes(patron) && memory.parties.includes(attacker))?.warStartedTurn).toBe(state.turn);
    // The client's peace ends the patron's war too, with the same truce.
    issue(state, { type: 'proposePeace', factionId: attacker, targetFactionId: client, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } });
    const offer = state.diplomacy.offers.find(item => item.proposerId === attacker && item.recipientId === client)!;
    const peace = issue(state, { type: 'respondPeace', factionId: client, offerId: offer.id, accept: true });
    expect(peace.events.filter(event => event.type === 'allied_peace').map(event => event.factionId).sort()).toEqual([patron, client, attacker].sort());
    expect(state.wars.some(pair => pair.includes(patron) && pair.includes(attacker))).toBe(false);
    expect(state.alliances.calls).toEqual([]);
    expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
    // A binding peace with the attacker leaves the patron out, and every party reads why.
    const bound = guaranteed();
    bound.state.diplomacy.treaties.push({ id: `treaty.${bound.state.nextId++}`, parties: [bound.patron, bound.attacker].sort() as [string, string], startedTurn: bound.state.turn, expiresTurn: bound.state.turn + 10, proposerId: bound.patron, terms: { offerCoin: 0, requestCoin: 0, truceTurns: 10 } });
    const held = issue(bound.state, { type: 'declareWar', factionId: bound.attacker, targetFactionId: bound.client });
    expect(held.events.filter(event => event.type === 'patronage_unanswered').map(event => event.factionId).sort()).toEqual([bound.patron, bound.client, bound.attacker].sort());
    expect(held.events.find(event => event.type === 'patronage_unanswered')!.message).toContain('binding peace');
    expect(bound.state.wars.some(pair => pair.includes(bound.patron) && pair.includes(bound.attacker))).toBe(false);
    expect(bound.state.alliances.calls).toEqual([]);
    // Nothing under rules 57.
    const older = guaranteed();
    withRules(older.state, 57, () => {
      const quiet = issue(older.state, { type: 'declareWar', factionId: older.attacker, targetFactionId: older.client });
      expect(quiet.events.filter(event => event.type.startsWith('patronage_'))).toEqual([]);
      expect(older.state.wars.some(pair => pair.includes(older.patron) && pair.includes(older.attacker))).toBe(false);
    });
  });

  it('rules 60: a client city-state sends its good to the patron each turn the tribute is paid, a realm client sends none, and nothing comes under older rules', () => {
    const state = scene(), patron = state.factions.find(faction => !faction.id.startsWith('citystate.'))!.id, city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
    const goods = cityStateTradeFor(city)!;
    issue(state, { type: 'proposeClient', factionId: patron, targetFactionId: city, terms });
    const sworn = issue(state, { type: 'respondClient', factionId: city, offerId: offerId(state), accept: true });
    expect(sworn.events.filter(event => event.type === 'client_goods_promised').map(event => event.factionId).sort()).toEqual([patron, city].sort());
    expect(sworn.events.find(event => event.type === 'client_goods_promised')!.message).toContain(`sends ${goods.amount}`);
    expect(getObservation(state, patron).diplomacy.clientGoods).toEqual([{ clientId: city, patronId: patron, resourceId: goods.resourceId, name: expect.any(String), amount: goods.amount }]);
    expect(getObservation(state, state.factions.find(faction => faction.id !== patron && !faction.id.startsWith('citystate.'))!.id).diplomacy.clientGoods).toEqual([]);
    // The tribute turn alone delivers exactly the good; the realm's own works are not in it.
    const before = state.resources.stockpiles[patron]?.[goods.resourceId] ?? 0;
    advanceClients(state);
    expect(state.resources.stockpiles[patron]![goods.resourceId]).toBe(before + goods.amount);
    // A missed tribute sends nothing.
    state.factions.find(faction => faction.id === city)!.treasury = 0;
    advanceClients(state);
    expect(state.resources.stockpiles[patron]![goods.resourceId]).toBe(before + goods.amount);
    // A realm client trades nothing.
    const realm = scene(), [a, b] = realm.factions.filter(faction => !faction.id.startsWith('citystate.')).map(faction => faction.id) as [string, string];
    issue(realm, { type: 'proposeClient', factionId: a, targetFactionId: b, terms });
    const plain = issue(realm, { type: 'respondClient', factionId: b, offerId: offerId(realm), accept: true });
    expect(plain.events.filter(event => event.type === 'client_goods_promised')).toEqual([]);
    expect(getObservation(realm, a).diplomacy.clientGoods).toEqual([]);
    // Nothing under rules 59.
    const older = scene(), olderPatron = older.factions.find(faction => !faction.id.startsWith('citystate.'))!.id, olderCity = older.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
    withRules(older, 59, () => {
      issue(older, { type: 'proposeClient', factionId: olderPatron, targetFactionId: olderCity, terms });
      const quiet = issue(older, { type: 'respondClient', factionId: olderCity, offerId: offerId(older), accept: true });
      expect(quiet.events.filter(event => event.type === 'client_goods_promised')).toEqual([]);
      expect(getObservation(older, olderPatron).diplomacy.clientGoods).toBeUndefined();
      const was = older.resources.stockpiles[olderPatron]?.[goods.resourceId] ?? 0;
      advanceClients(older);
      expect(older.resources.stockpiles[olderPatron]?.[goods.resourceId] ?? 0).toBe(was);
    });
  });
});
