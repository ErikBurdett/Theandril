import { describe, expect, it } from 'vitest';
import { CONTENT_HASH, HEARTH_EVENTS, HEARTH_EVENT_ANSWER_TURNS, HEARTH_EVENT_INTERVAL } from '@theandril/content';
import { applyCommand, createArmyFormation, deserializeGame, getObservation, serializeGame, stateHash, stateHashForVersion, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_CHAINS_CONTENT_HASH, PRE_EVENTS_CONTENT_HASH, PRE_EVENTS_II_CONTENT_HASH, serializeGameForVersion } from './save';
import { advanceHearthEvents, hearthEventConditionHolds, observeHearthEvents, resolveHearthEvent, validateHearthEvents } from './hearth-events';
import { landmarks } from './landmarks';
import { armyStrength } from './army-composition';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); return result; };
/** Plays whole rounds until the realm is offered an event, within a bound. */
/** Ends rounds until the realm is offered an event; with `ordinary`, a crisis's own event (rules 54) is answered with its first choice and the wait goes on for a drawn one. */
function untilOffered(state: GameState, factionId: string, rounds = 80, ordinary = false): void {
  for (let round = 0; round < rounds; round++) {
    const pending = state.hearthEvents.pending.find(item => item.factionId === factionId);
    if (pending && !(ordinary && pending.id.endsWith('.crisis'))) return;
    if (pending) issue(state, { type: 'resolveHearthEvent', factionId, eventId: pending.id, choiceId: HEARTH_EVENTS.find(item => item.id === pending.templateId)!.choices[0]!.id });
    for (let seat = 0; seat < state.factions.length; seat++) issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
  }
  throw new Error('No hearth event was offered within the bound.');
}

describe('rules 46: hearth events', () => {
  it('offers the same events to the same campaign, draws independently per realm and turn, and never under historical rules', () => {
    const first = attunementCampaign(), second = attunementCampaign(), other = attunementCampaign();
    other.world.seed ^= 1; // the draw reads the campaign seed, so a different world offers different events
    const offers = (state: GameState) => {
      const log: string[] = [];
      for (let round = 0; round < 40; round++) {
        for (let seat = 0; seat < state.factions.length; seat++) {
          const result = issue(state, { type: 'endTurn', factionId: state.turnOwnerId });
          log.push(...result.events.filter(event => event.type === 'hearth_event_offered').map(event => `${event.turn}:${event.factionId}:${event.message.slice(0, 24)}`));
        }
      }
      return log;
    };
    const a = offers(first), b = offers(second), c = offers(other);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    expect(c).not.toEqual(a);
    expect(stateHash(first)).toBe(stateHash(second));
    // Each realm draws at most once every interval, and holds at most one event.
    const byFaction = new Map<string, number[]>();
    for (const entry of a) { const [turn, factionId] = entry.split(':'); byFaction.set(factionId!, [...(byFaction.get(factionId!) ?? []), Number(turn)]); }
    for (const turns of byFaction.values()) for (let i = 1; i < turns.length; i++) expect(turns[i]! - turns[i - 1]!).toBeGreaterThanOrEqual(HEARTH_EVENT_INTERVAL);
    const historical = attunementCampaign();
    withRules(historical, 45, () => {
      expect(offers(historical)).toEqual([]);
      expect(getObservation(historical, historical.turnOwnerId).hearthEvents).toBeUndefined();
    });
    expect(historical.hearthEvents.pending).toEqual([]);
  });

  it('answers an event with a quoted choice, applies exactly its effects, refuses foreign or unknown answers, and takes the first choice when it lapses', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
    untilOffered(state, player);
    const pending = state.hearthEvents.pending.find(item => item.factionId === player)!;
    const view = getObservation(state, player);
    const offered = view.hearthEvents!.find(item => item.id === pending.id)!;
    const template = HEARTH_EVENTS.find(item => item.id === pending.templateId)!;
    expect(offered).toMatchObject({ settlementId: pending.settlementId, name: template.name, expiresTurn: pending.turn + HEARTH_EVENT_ANSWER_TURNS });
    expect(offered.text).not.toContain('{hearth}');
    expect(offered.text).toContain(offered.settlementName);
    expect(offered.choices.map(choice => choice.id)).toEqual(template.choices.map(choice => choice.id));
    // A foreign realm cannot answer it, nor can the owner with an answer the event does not quote.
    expect(applyCommand(state, { type: 'resolveHearthEvent', factionId: rival, eventId: pending.id, choiceId: template.choices[0]!.id })).toMatchObject({ ok: false, error: expect.stringContaining('no such hearth event') });
    expect(applyCommand(state, { type: 'resolveHearthEvent', factionId: player, eventId: pending.id, choiceId: 'invent_an_answer' })).toMatchObject({ ok: false, error: expect.stringContaining('own answers') });
    // An answer that costs more coin than the realm holds is quoted as blocked and refused; nothing is paid short.
    const costly = template.choices.find(item => item.effects.coin < 0);
    if (costly) {
      const purse = state.factions.find(item => item.id === player)!, held = purse.treasury;
      purse.treasury = -costly.effects.coin - 1;
      expect(getObservation(state, player).hearthEvents!.find(item => item.id === pending.id)!.choices.find(item => item.id === costly.id)!.blocker).toBe(`Requires ${-costly.effects.coin} coin.`);
      expect(applyCommand(state, { type: 'resolveHearthEvent', factionId: player, eventId: pending.id, choiceId: costly.id })).toMatchObject({ ok: false, error: `Requires ${-costly.effects.coin} coin.` });
      purse.treasury = held;
    }
    // The second choice applies exactly its quoted effects to the hearth and the realm.
    const choice = template.choices[1]!, town = state.settlements[pending.settlementId]!, faction = state.factions.find(item => item.id === player)!;
    const before = { food: town.food, population: town.population, devastation: town.devastation, treasury: faction.treasury, knowledge: faction.knowledge };
    const result = issue(state, { type: 'resolveHearthEvent', factionId: player, eventId: pending.id, choiceId: choice.id });
    expect(result.events.some(event => event.type === 'hearth_event_resolved' && event.message.includes(choice.label.toLowerCase()))).toBe(true);
    expect(town.food).toBe(Math.max(0, before.food + choice.effects.food));
    expect(town.population).toBe(Math.max(1, before.population + choice.effects.population));
    expect(town.devastation).toBe(Math.max(0, Math.min(100, before.devastation + choice.effects.devastation)));
    expect(faction.treasury).toBe(Math.max(0, before.treasury + choice.effects.coin));
    expect(faction.knowledge).toBe(Math.max(0, before.knowledge + choice.effects.knowledge));
    expect(state.hearthEvents.pending.some(item => item.id === pending.id)).toBe(false);
    expect(applyCommand(state, { type: 'resolveHearthEvent', factionId: player, eventId: pending.id, choiceId: choice.id })).toMatchObject({ ok: false });
    // An event left unanswered takes its first choice when its term ends.
    const lapsing = attunementCampaign(), owner = lapsing.turnOwnerId;
    untilOffered(lapsing, owner, 80, true);
    const late = lapsing.hearthEvents.pending.find(item => item.factionId === owner)!;
    const lateTemplate = HEARTH_EVENTS.find(item => item.id === late.templateId)!, lateTown = lapsing.settlements[late.settlementId]!, lateFaction = lapsing.factions.find(item => item.id === owner)!;
    const expected = { food: Math.max(0, lateTown.food + lateTemplate.choices[0]!.effects.food), coin: lateFaction.treasury + lateTemplate.choices[0]!.effects.coin };
    const upkeepFree = structuredClone(lapsing);
    upkeepFree.hearthEvents.pending = [{ ...late }];
    const lapsed: string[] = [];
    withRules(upkeepFree, 47, () => {
      upkeepFree.turn = late.expiresTurn;
      const events: Parameters<typeof advanceHearthEvents>[1] = [];
      advanceHearthEvents(upkeepFree, events);
      lapsed.push(...events.filter(event => event.type === 'hearth_event_lapsed').map(event => event.message));
    });
    expect(lapsed).toHaveLength(1);
    expect(lapsed[0]).toContain(lateTemplate.choices[0]!.label.toLowerCase());
    expect(upkeepFree.settlements[late.settlementId]!.food).toBe(expected.food);
    expect(upkeepFree.factions.find(item => item.id === owner)!.treasury).toBe(Math.max(0, expected.coin));
    expect(upkeepFree.hearthEvents.pending).toEqual([]);
  });

  it('evaluates conditions from canonical state and offers nothing at a besieged or occupied hearth', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, host = Object.values(state.settlements).find(town => town.factionId === player)!;
    const template = (condition: string) => HEARTH_EVENTS.find(item => item.condition === condition)!;
    expect(hearthEventConditionHolds(state, template('any'), host.id)).toBe(true);
    expect(hearthEventConditionHolds(state, template('seam'), host.id)).toBe(true);
    expect(hearthEventConditionHolds(state, template('wartime'), host.id)).toBe(false);
    expect(hearthEventConditionHolds(state, template('devastated'), host.id)).toBe(false);
    host.devastation = 25;
    expect(hearthEventConditionHolds(state, template('devastated'), host.id)).toBe(true);
    host.population = 2;
    expect(hearthEventConditionHolds(state, template('populous'), host.id)).toBe(false);
    host.population = 6;
    expect(hearthEventConditionHolds(state, template('populous'), host.id)).toBe(true);
    state.wars.push([player, state.factions[1]!.id].sort() as [string, string]);
    expect(hearthEventConditionHolds(state, template('wartime'), host.id)).toBe(true);
    expect(hearthEventConditionHolds(state, template('any'), 'settlement.none')).toBe(false);
    // Rules 54: an event of a crisis comes only while that crisis stands.
    const crisisEvent = HEARTH_EVENTS.find(item => item.crisis)!;
    expect(hearthEventConditionHolds(state, crisisEvent, host.id)).toBe(false);
    state.crises.active = { id: 'crisis.1.1', crisisId: crisisEvent.crisis!, startedTurn: state.turn, endsTurn: state.turn + 5, sheltered: [] };
    expect(hearthEventConditionHolds(state, crisisEvent, host.id)).toBe(false); // never drawn: the crisis offers it
    state.crises.active = null;
    // Rules 52: a landmark within the hearth's own borders; no survey is needed.
    const landmarkCell = landmarks(state.world)[0]?.cell;
    const hostLand = state.land.settlements[host.id]!;
    hostLand.claimed = hostLand.claimed.filter(cell => cell !== landmarkCell);
    expect(hearthEventConditionHolds(state, template('landmark'), host.id)).toBe(false);
    if (landmarkCell !== undefined) {
      hostLand.claimed = [...hostLand.claimed, landmarkCell];
      expect(hearthEventConditionHolds(state, template('landmark'), host.id)).toBe(true);
      hostLand.claimed = hostLand.claimed.filter(cell => cell !== landmarkCell);
    }
    // Occupied: no event may visit; the draw still spends the realm's turn.
    host.occupationTurns = 2;
    const events: Parameters<typeof advanceHearthEvents>[1] = [];
    for (let turn = 0; turn < 60 && !state.hearthEvents.pending.some(item => item.factionId === player); turn++) { state.turn++; advanceHearthEvents(state, events); }
    expect(state.hearthEvents.pending.some(item => item.factionId === player)).toBe(false);
  });

  it('seals events into the save, loads a v45 envelope without them, keeps older hashes blind to them, and refuses to seal them under older rules', () => {
    const state = attunementCampaign(), player = state.turnOwnerId;
    untilOffered(state, player);
    const loaded = deserializeGame(serializeGame(state));
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(loaded.hearthEvents).toEqual(state.hearthEvents);
    expect(observeHearthEvents(loaded, player)).toEqual(observeHearthEvents(state, player));
    expect(() => validateHearthEvents(loaded)).not.toThrow();
    expect(() => serializeGameForVersion(state, 45)).toThrow('hearth events unavailable');
    // Before any event, a rules 45 envelope loads unchanged under the new pack with empty events, and its rules 45 hash ignores the register.
    const fresh = attunementCampaign();
    const sealed = serializeGameForVersion(fresh, 45);
    expect(JSON.parse(sealed)).toMatchObject({ version: 45, contentHash: PRE_EVENTS_CONTENT_HASH });
    const upgraded = deserializeGame(sealed);
    expect(upgraded.hearthEvents).toEqual({ pending: [], recent: [] });
    expect(stateHash(upgraded)).toBe(stateHash(fresh));
    expect(stateHashForVersion(upgraded, 45)).toBe(stateHashForVersion(fresh, 45));
    expect(JSON.parse(serializeGame(upgraded))).toMatchObject({ version: 55, contentHash: CONTENT_HASH });
    // A corrupt register is refused: two events for one realm, or a hearth the realm does not hold.
    const corrupt = deserializeGame(serializeGame(state));
    const pending = corrupt.hearthEvents.pending[0]!;
    corrupt.hearthEvents.pending = [pending, { ...pending, id: pending.id + 'x' }];
    expect(() => validateHearthEvents(corrupt)).toThrow('two events');
    corrupt.hearthEvents.pending = [{ ...pending, settlementId: Object.values(corrupt.settlements).find(town => town.factionId !== player)!.id }];
    expect(() => validateHearthEvents(corrupt)).toThrow('does not hold');
    const legacy = attunementCampaign();
    withRules(legacy, 45, () => expect(resolveHearthEvent(legacy, legacy.turnOwnerId, 'event.1', 'a')).toMatchObject({ ok: false, error: expect.stringContaining('historical') }));
  });

  it('rules 47: the second catalogue reads harbor, archive, garrison, peace, breadth and youth from canonical state, moves ashglass and garrison strength, and seals only under rules 47', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, host = Object.values(state.settlements).find(town => town.factionId === player)!;
    const template = (id: string) => HEARTH_EVENTS.find(item => item.id === id)!;
    expect(hearthEventConditionHolds(state, template('event.visiting_witness'), host.id)).toBe(true); // the fixture's archive
    expect(hearthEventConditionHolds(state, template('event.drowned_ledger'), host.id)).toBe(host.buildings.includes('building.harbor'));
    expect(hearthEventConditionHolds(state, template('event.border_fair'), host.id)).toBe(true);
    expect(hearthEventConditionHolds(state, template('event.far_hearth_petition'), host.id)).toBe(false);
    expect(hearthEventConditionHolds(state, template('event.first_winter'), host.id)).toBe(host.population <= 2);
    const guard = Object.values(state.armies).find(army => army.factionId === player && army.formations.some(item => item.unitId !== 'unit.colonist'));
    expect(hearthEventConditionHolds(state, template('event.veteran_drill'), host.id)).toBe(Boolean(guard && guard.cell === host.cell));
    // A garrison drill hardens every company at the hearth up to its full ranks; a fever thins them, never below one.
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId: player, name: 'Quartered guard', cell: host.cell, movement: 3, formations: [{ ...createArmyFormation(id, 'unit.guard'), strength: 30 }] };
    expect(hearthEventConditionHolds(state, template('event.veteran_drill'), host.id)).toBe(true);
    const offer = (templateId: string) => { const eventId = `event.${state.turn}.9`; state.hearthEvents.pending = [{ id: eventId, factionId: player, settlementId: host.id, templateId, turn: state.turn, expiresTurn: state.turn + HEARTH_EVENT_ANSWER_TURNS }]; return eventId; };
    state.factions[0]!.treasury = 100;
    let eventId = offer('event.veteran_drill');
    expect(getObservation(state, player).hearthEvents![0]!.choices[0]!.summary).toBe('-20 coin, +15 garrison strength');
    issue(state, { type: 'resolveHearthEvent', factionId: player, eventId, choiceId: 'pay_the_drill' });
    expect(armyStrength(state.armies[id]!)).toBe(45);
    expect(state.factions[0]!.treasury).toBe(80);
    eventId = offer('event.garrison_fever');
    issue(state, { type: 'resolveHearthEvent', factionId: player, eventId, choiceId: 'ration_the_sick' });
    expect(armyStrength(state.armies[id]!)).toBe(33);
    // Ashglass is drawn from and paid into the realm's stockpile, and an answer that spends more than it holds is blocked.
    state.resources.stockpiles[player]!['resource.ashglass'] = 4;
    eventId = offer('event.seam_hum');
    let view = getObservation(state, player);
    expect(view.hearthEvents![0]!.choices[1]!.blocker).toBe('Requires 6 ashglass.');
    expect(applyCommand(state, { type: 'resolveHearthEvent', factionId: player, eventId, choiceId: 'quiet_the_seam' })).toMatchObject({ ok: false, error: 'Requires 6 ashglass.' });
    issue(state, { type: 'resolveHearthEvent', factionId: player, eventId, choiceId: 'leave_them_to_it' });
    expect(state.resources.stockpiles[player]!['resource.ashglass']).toBe(8);
    eventId = offer('event.seam_hum');
    issue(state, { type: 'resolveHearthEvent', factionId: player, eventId, choiceId: 'quiet_the_seam' });
    expect(state.resources.stockpiles[player]!['resource.ashglass']).toBe(2);
    // A pending rules 47 event cannot be sealed as a v46 envelope; a rules 46 event can, and the envelope loads unchanged under rules 47.
    eventId = offer('event.wolf_winter');
    expect(() => serializeGameForVersion(state, 46)).toThrow('hearth events unavailable');
    offer('event.kiln_fire');
    const sealed = serializeGameForVersion(state, 46);
    expect(JSON.parse(sealed)).toMatchObject({ version: 46, contentHash: PRE_EVENTS_II_CONTENT_HASH });
    const loaded = deserializeGame(sealed);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 55, contentHash: CONTENT_HASH });
    view = getObservation(loaded, player);
    expect(view.hearthEvents![0]!.name).toBe('A kiln fire');
    // Under rules 46 the second catalogue is never drawn: every offer over a long run names a first-batch template.
    const second = new Set(HEARTH_EVENTS.filter(item => item.sinceRules === 47).map(item => item.id));
    const historical = attunementCampaign();
    withRules(historical, 46, () => {
      for (let round = 0; round < 60; round++) for (let seat = 0; seat < historical.factions.length; seat++) issue(historical, { type: 'endTurn', factionId: historical.turnOwnerId });
    });
    expect(historical.hearthEvents.pending.every(item => !second.has(item.templateId))).toBe(true);
  });

  it('rules 48: an answer schedules its follow-up at the same hearth, which is offered on its turn, chains on, lapses like any event, is never drawn, and seals only under rules 48', () => {
    const state = attunementCampaign(), player = state.turnOwnerId, host = Object.values(state.settlements).find(town => town.factionId === player)!;
    state.factions[0]!.treasury = 200;
    const offer = (templateId: string) => { const eventId = `event.${state.turn}.9`; state.hearthEvents.pending = [{ id: eventId, factionId: player, settlementId: host.id, templateId, turn: state.turn, expiresTurn: state.turn + HEARTH_EVENT_ANSWER_TURNS }]; return eventId; };
    const eventId = offer('event.river_rising');
    const view = getObservation(state, player);
    const rising = view.hearthEvents![0]!;
    expect(rising.choices.map(choice => choice.followUp?.name)).toEqual(['The levees hold', 'The river floods']);
    const result = issue(state, { type: 'resolveHearthEvent', factionId: player, eventId, choiceId: 'wait_and_see' });
    expect(result.events[0]!.message).toContain('What follows comes in 2 turns');
    // The follow-up waits ahead: not seen, not answerable, counted as the realm's one event; the draw passes the realm by.
    const scheduled = state.hearthEvents.pending[0]!;
    expect(scheduled).toMatchObject({ templateId: 'event.river_floods', turn: state.turn + 2, expiresTurn: state.turn + 2 + HEARTH_EVENT_ANSWER_TURNS, chainedFrom: 'event.river_rising', settlementId: host.id });
    expect(getObservation(state, player).hearthEvents).toEqual([]);
    expect(applyCommand(state, { type: 'resolveHearthEvent', factionId: player, eventId: scheduled.id, choiceId: 'rebuild_the_fields' })).toMatchObject({ ok: false, error: expect.stringContaining('no such hearth event') });
    expect(() => validateHearthEvents(state)).not.toThrow();
    const offered: string[] = [];
    for (let seat = 0; seat < state.factions.length * 2; seat++) offered.push(...issue(state, { type: 'endTurn', factionId: state.turnOwnerId }).events.filter(event => event.type === 'hearth_event_offered' && event.factionId === player).map(event => event.message));
    expect(offered).toHaveLength(1);
    expect(offered[0]).toContain('The river floods at');
    expect(offered[0]).toContain('following the river rising');
    const floods = getObservation(state, player).hearthEvents![0]!;
    expect(floods).toMatchObject({ id: scheduled.id, name: 'The river floods', followsFrom: 'The river rising' });
    // A chained event answered applies its effects like any other; one left alone lapses to its first affordable answer and chains on where that answer does.
    const food = host.food, coin = state.factions[0]!.treasury;
    issue(state, { type: 'resolveHearthEvent', factionId: player, eventId: floods.id, choiceId: 'rebuild_the_fields' });
    expect(host.food).toBe(Math.max(0, food - 6));
    expect(state.factions[0]!.treasury).toBe(coin - 35);
    expect(state.hearthEvents.pending).toEqual([]);
    offer('event.riders_on_the_ridge');
    issue(state, { type: 'resolveHearthEvent', factionId: player, eventId: `event.${state.turn}.9`, choiceId: 'bar_the_gates' });
    const strike = state.hearthEvents.pending[0]!;
    expect(strike.templateId).toBe('event.riders_strike');
    const clone = structuredClone(state);
    clone.turn = strike.expiresTurn;
    const lapsed: Parameters<typeof advanceHearthEvents>[1] = [];
    advanceHearthEvents(clone, lapsed);
    expect(lapsed.some(event => event.type === 'hearth_event_lapsed' && event.message.includes('sally out') && event.message.includes('What follows comes in 2 turns'))).toBe(true);
    expect(clone.hearthEvents.pending[0]).toMatchObject({ templateId: 'event.riders_driven_off', chainedFrom: 'event.riders_strike' });
    // Chained templates are never drawn, and a scheduled rules 48 event cannot be sealed as v47; without one the v47 envelope loads unchanged.
    const chained = new Set(HEARTH_EVENTS.filter(item => item.condition === 'chained').map(item => item.id));
    const drawn = attunementCampaign();
    for (let round = 0; round < 80; round++) for (let seat = 0; seat < drawn.factions.length; seat++) issue(drawn, { type: 'endTurn', factionId: drawn.turnOwnerId });
    expect(drawn.hearthEvents.pending.every(item => !chained.has(item.templateId) || item.chainedFrom)).toBe(true);
    expect(() => serializeGameForVersion(state, 47)).toThrow('hearth events unavailable');
    state.hearthEvents.pending = [];
    const sealed = serializeGameForVersion(state, 47);
    expect(JSON.parse(sealed)).toMatchObject({ version: 47, contentHash: PRE_CHAINS_CONTENT_HASH });
    const loaded = deserializeGame(sealed);
    expect(stateHash(loaded)).toBe(stateHash(state));
    expect(JSON.parse(serializeGame(loaded))).toMatchObject({ version: 55, contentHash: CONTENT_HASH });
    // A pending event that lies ahead without an event it follows is refused by validation.
    const corrupt = deserializeGame(serializeGame(state));
    corrupt.hearthEvents.pending = [{ id: 'event.999.1', factionId: player, settlementId: host.id, templateId: 'event.kiln_fire', turn: corrupt.turn + 3, expiresTurn: corrupt.turn + 3 + HEARTH_EVENT_ANSWER_TURNS }];
    expect(() => validateHearthEvents(corrupt)).toThrow('lies ahead');
  });
});
