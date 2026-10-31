import { describe, expect, it } from 'vitest';
import { CONTENT_HASH, HEARTH_EVENTS, HEARTH_EVENT_ANSWER_TURNS, HEARTH_EVENT_INTERVAL } from '@theandril/content';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, stateHashForVersion, type GameCommand, type GameState } from './index';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { withRules } from './rules';
import { PRE_EVENTS_CONTENT_HASH, serializeGameForVersion } from './save';
import { advanceHearthEvents, hearthEventConditionHolds, observeHearthEvents, resolveHearthEvent, validateHearthEvents } from './hearth-events';

const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); if (!result.ok) throw new Error(result.error); return result; };
/** Plays whole rounds until the realm is offered an event, within a bound. */
function untilOffered(state: GameState, factionId: string, rounds = 80): void {
  for (let round = 0; round < rounds; round++) {
    if (state.hearthEvents.pending.some(item => item.factionId === factionId)) return;
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
    untilOffered(lapsing, owner);
    const late = lapsing.hearthEvents.pending.find(item => item.factionId === owner)!;
    const lateTemplate = HEARTH_EVENTS.find(item => item.id === late.templateId)!, lateTown = lapsing.settlements[late.settlementId]!, lateFaction = lapsing.factions.find(item => item.id === owner)!;
    const expected = { food: Math.max(0, lateTown.food + lateTemplate.choices[0]!.effects.food), coin: lateFaction.treasury + lateTemplate.choices[0]!.effects.coin };
    const upkeepFree = structuredClone(lapsing);
    upkeepFree.hearthEvents.pending = [{ ...late }];
    const lapsed: string[] = [];
    withRules(upkeepFree, 46, () => {
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
    expect(JSON.parse(serializeGame(upgraded))).toMatchObject({ version: 46, contentHash: CONTENT_HASH });
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
});
