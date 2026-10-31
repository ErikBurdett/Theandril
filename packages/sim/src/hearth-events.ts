import { z } from 'zod';
import { HEARTH_EVENT_ANSWER_TURNS, HEARTH_EVENT_CHANCE_PERCENT, HEARTH_EVENT_FIRST_TURN, HEARTH_EVENT_INTERVAL, hearthEventsForRules, type HearthEventDefinition, type HearthEventEffects } from '@theandril/content';
import { neighbors, SeededRandom } from '@theandril/mapgen';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { arcaneSites, controllingSettlement } from './arcane-sites';

/** Rules 46: hearth events. At the start of a turn a realm that has had no
 * event for ten turns may be offered one at a hearth of its own that is
 * neither besieged nor occupied: the hearth, the event and whether one comes
 * at all are drawn from the campaign seed, the turn and the realm's seat, so a
 * replay offers the same events and a save loads into the same offers. The
 * realm answers with one of the event's choices by command; an event left
 * unanswered for five turns takes its first choice. Every effect moves a field
 * that already exists; nothing is created that older rules could not hold. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAX_PENDING_HEARTH_EVENTS = 64;
export const pendingHearthEventSchema = z.object({ id, factionId: id, settlementId: id, templateId: id, turn, expiresTurn: turn }).strict();
export const hearthEventStateSchema = z.object({
  pending: z.array(pendingHearthEventSchema).max(MAX_PENDING_HEARTH_EVENTS),
  recent: z.array(z.object({ factionId: id, turn }).strict()).max(64),
}).strict();
export type PendingHearthEvent = z.infer<typeof pendingHearthEventSchema>;
export type HearthEventState = z.infer<typeof hearthEventStateSchema>;
export interface ObservedHearthEventChoice { id: string; label: string; description: string; effects: HearthEventEffects; summary: string; blocker: string | null }
export interface ObservedHearthEvent { id: string; settlementId: string; settlementName: string; cell: number; name: string; text: string; turn: number; expiresTurn: number; choices: ObservedHearthEventChoice[] }
export const hearthEventCommandSchemas = [
  z.object({ type: z.literal('resolveHearthEvent'), factionId: id, eventId: id, choiceId: z.string().min(1).max(100) }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const byFaction = (a: { factionId: string }, b: { factionId: string }): number => a.factionId < b.factionId ? -1 : a.factionId > b.factionId ? 1 : 0;

export const emptyHearthEvents = (): HearthEventState => ({ pending: [], recent: [] });
export const hasHearthEvents = (state: GameState): boolean => (state.hearthEvents?.pending.length ?? 0) > 0 || (state.hearthEvents?.recent.length ?? 0) > 0;
export function assertNoHearthEvents(state: GameState): void {
  if (hasHearthEvents(state)) throw new Error('This campaign has hearth events unavailable in historical rules.');
}
const templates = (state: GameState) => hearthEventsForRules(rulesVersion(state));
const templateOf = (state: GameState, templateId: string): HearthEventDefinition | undefined => templates(state).find(item => item.id === templateId);

/** Whether a template's condition holds at a hearth, from canonical state only. */
export function hearthEventConditionHolds(state: GameState, template: HearthEventDefinition, settlementId: string): boolean {
  const town = state.settlements[settlementId];
  if (!town) return false;
  switch (template.condition) {
    case 'any': return true;
    case 'populous': return town.population >= 6;
    case 'devastated': return town.devastation >= 20;
    case 'coastal': return neighbors(town.cell, state.world.width, state.world.height).some(cell => (state.world.waterDepth[cell] ?? 0) > 0);
    case 'seam': return arcaneSites(state.world).some(site => controllingSettlement(state, site.cell, town.factionId) === settlementId);
    case 'wartime': return state.wars.some(pair => pair.includes(town.factionId));
  }
}
/** Hearths an event may visit: the realm's own, neither besieged nor occupied, by id. */
const eligibleHearths = (state: GameState, factionId: string) => Object.values(state.settlements)
  .filter(town => town.factionId === factionId && !state.sieges[town.id] && !town.occupationTurns).sort(byId);
/** The draw for one realm on one turn, independent of every other draw in the campaign. */
const draw = (state: GameState, seat: number): SeededRandom =>
  new SeededRandom(((state.world.seed >>> 0) ^ Math.imul(state.turn, 0x9e3779b1) ^ Math.imul(seat + 1, 0x85ebca77)) >>> 0);

export function describeHearthEventEffects(effects: HearthEventEffects): string {
  const parts: string[] = [];
  const signed = (value: number) => (value > 0 ? '+' : '') + value;
  if (effects.food) parts.push(`${signed(effects.food)} stored food`);
  if (effects.population) parts.push(`${signed(effects.population)} population`);
  if (effects.devastation) parts.push(`${signed(effects.devastation)} devastation`);
  if (effects.coin) parts.push(`${signed(effects.coin)} coin`);
  if (effects.knowledge) parts.push(`${signed(effects.knowledge)} knowledge`);
  return parts.length ? parts.join(', ') : 'no change';
}
/** An answer that costs coin or knowledge the realm does not have is not on offer; nothing is ever paid short. */
export function hearthEventChoiceBlocker(state: GameState, factionId: string, effects: HearthEventEffects): string | null {
  const faction = state.factions.find(item => item.id === factionId);
  if (!faction) return 'Unknown realm.';
  if (effects.coin < 0 && faction.treasury < -effects.coin) return `Requires ${-effects.coin} coin.`;
  if (effects.knowledge < 0 && faction.knowledge < -effects.knowledge) return `Requires ${-effects.knowledge} knowledge.`;
  return null;
}
function applyEffects(state: GameState, pending: PendingHearthEvent, effects: HearthEventEffects): void {
  const town = state.settlements[pending.settlementId], faction = state.factions.find(item => item.id === pending.factionId);
  if (town && town.factionId === pending.factionId) {
    town.food = Math.max(0, town.food + effects.food);
    town.population = Math.max(1, town.population + effects.population);
    town.devastation = Math.max(0, Math.min(100, town.devastation + effects.devastation));
  }
  if (faction) {
    faction.treasury = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, faction.treasury + effects.coin));
    faction.knowledge = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, faction.knowledge + effects.knowledge));
  }
}
const remove = (state: GameState, eventId: string): void => { state.hearthEvents.pending = state.hearthEvents.pending.filter(item => item.id !== eventId); };
const noteTurn = (state: GameState, factionId: string): void => {
  state.hearthEvents.recent = [...state.hearthEvents.recent.filter(item => item.factionId !== factionId), { factionId, turn: state.turn }].sort(byFaction);
};
const storyText = (template: HearthEventDefinition, hearthName: string): string => template.text.split('{hearth}').join(hearthName);

/** Lapsed events take their first choice; then each realm without an event may be offered one. Bounded by realms and their hearths, never by tiles. */
export function advanceHearthEvents(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 46 || state.victory) return;
  for (const pending of [...state.hearthEvents.pending].sort(byId)) {
    if (pending.expiresTurn > state.turn) continue;
    const template = templateOf(state, pending.templateId), town = state.settlements[pending.settlementId];
    remove(state, pending.id);
    if (!template || !town || town.factionId !== pending.factionId) {
      events.push({ turn: state.turn, factionId: pending.factionId, type: 'hearth_event_lapsed', message: `${template?.name ?? pending.templateId} passed: the hearth is no longer the realm's.` });
      continue;
    }
    // The first answer the realm can afford; the last if it can afford none, which costs nothing it has.
    const choice = template.choices.find(item => hearthEventChoiceBlocker(state, pending.factionId, item.effects) === null) ?? template.choices[template.choices.length - 1]!;
    applyEffects(state, pending, choice.effects);
    events.push({ turn: state.turn, factionId: pending.factionId, type: 'hearth_event_lapsed', cell: town.cell, message: `${template.name} at ${town.name} went unanswered, so ${choice.label.toLowerCase()} was taken: ${describeHearthEventEffects(choice.effects)}.` });
  }
  const catalogue = templates(state);
  if (!catalogue.length || state.turn < HEARTH_EVENT_FIRST_TURN) return;
  const recent = new Map(state.hearthEvents.recent.map(item => [item.factionId, item.turn]));
  const offered = new Set(state.hearthEvents.pending.map(item => item.factionId));
  state.factions.map((faction, seat) => ({ faction, seat })).sort((a, b) => byId(a.faction, b.faction)).forEach(({ faction, seat }) => {
    if (offered.has(faction.id) || state.hearthEvents.pending.length >= MAX_PENDING_HEARTH_EVENTS) return;
    const last = recent.get(faction.id);
    if (last !== undefined && state.turn - last < HEARTH_EVENT_INTERVAL) return;
    const hearths = eligibleHearths(state, faction.id);
    if (!hearths.length) return;
    const random = draw(state, seat);
    if (random.nextInt(100) >= HEARTH_EVENT_CHANCE_PERCENT) { noteTurn(state, faction.id); return; }
    const town = hearths[random.nextInt(hearths.length)]!;
    const eligible = catalogue.filter(template => hearthEventConditionHolds(state, template, town.id));
    if (!eligible.length) { noteTurn(state, faction.id); return; }
    const total = eligible.reduce((sum, template) => sum + template.weight, 0);
    let roll = random.nextInt(total);
    const template = eligible.find(item => (roll -= item.weight) < 0) ?? eligible[eligible.length - 1]!;
    // One event per realm per turn, so the id needs no counter and shifts no other id in the campaign.
    const pending: PendingHearthEvent = { id: `event.${state.turn}.${seat + 1}`, factionId: faction.id, settlementId: town.id, templateId: template.id, turn: state.turn, expiresTurn: state.turn + HEARTH_EVENT_ANSWER_TURNS };
    state.hearthEvents.pending = [...state.hearthEvents.pending, pending].sort(byId);
    noteTurn(state, faction.id);
    events.push({ turn: state.turn, factionId: faction.id, type: 'hearth_event_offered', cell: town.cell, message: `${template.name} at ${town.name}: ${storyText(template, town.name)} Answer it by turn ${pending.expiresTurn}.` });
  });
}

export function hearthEventObjection(state: GameState, factionId: string, eventId: string, choiceId: string): string | null {
  if (rulesVersion(state) < 46) return 'Hearth events are unavailable under these historical rules.';
  if (state.victory) return 'This campaign has ended in victory.';
  if (state.battle || state.pendingCapture) return 'Resolve the pending battle or capture first.';
  const pending = state.hearthEvents.pending.find(item => item.id === eventId);
  if (!pending || pending.factionId !== factionId) return 'You have no such hearth event to answer.';
  const template = templateOf(state, pending.templateId);
  if (!template) return 'This event is unknown to the current rules.';
  const choice = template.choices.find(item => item.id === choiceId);
  if (!choice) return 'Choose one of the event’s own answers.';
  return hearthEventChoiceBlocker(state, factionId, choice.effects);
}
export function resolveHearthEvent(state: GameState, factionId: string, eventId: string, choiceId: string): CommandResult {
  const objection = hearthEventObjection(state, factionId, eventId, choiceId);
  if (objection) return fail(objection);
  const pending = state.hearthEvents.pending.find(item => item.id === eventId)!, template = templateOf(state, pending.templateId)!;
  const choice = template.choices.find(item => item.id === choiceId)!, town = state.settlements[pending.settlementId];
  remove(state, pending.id);
  if (!town || town.factionId !== factionId) return { ok: true, events: [{ turn: state.turn, factionId, type: 'hearth_event_lapsed', message: `${template.name} passed: the hearth is no longer the realm's.` }] };
  applyEffects(state, pending, choice.effects);
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'hearth_event_resolved', cell: town.cell, message: `${template.name} at ${town.name}: ${choice.label.toLowerCase()}. ${describeHearthEventEffects(choice.effects)}.` }] };
}
/** Own pending events in full, with every answer quoted. */
export function observeHearthEvents(state: GameState, factionId: string): ObservedHearthEvent[] {
  if (rulesVersion(state) < 46) return [];
  return state.hearthEvents.pending.filter(item => item.factionId === factionId).flatMap(pending => {
    const template = templateOf(state, pending.templateId), town = state.settlements[pending.settlementId];
    if (!template || !town) return [];
    return [{ id: pending.id, settlementId: town.id, settlementName: town.name, cell: town.cell, name: template.name, text: storyText(template, town.name), turn: pending.turn, expiresTurn: pending.expiresTurn,
      choices: template.choices.map(choice => ({ id: choice.id, label: choice.label, description: choice.description, effects: choice.effects, summary: describeHearthEventEffects(choice.effects), blocker: hearthEventChoiceBlocker(state, factionId, choice.effects) })) }];
  });
}
export function validateHearthEvents(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: hearth event ' + message); };
  const seenFactions = new Set<string>();
  state.hearthEvents.pending.forEach((pending, index) => {
    assert(index === 0 || byId(state.hearthEvents.pending[index - 1]!, pending) < 0, 'records must be ordered by id without repeats');
    assert(!seenFactions.has(pending.factionId), 'offers a realm two events at once'); seenFactions.add(pending.factionId);
    const town = state.settlements[pending.settlementId];
    assert(state.factions.some(faction => faction.id === pending.factionId), 'names an unknown realm');
    assert(town && town.factionId === pending.factionId, 'names a hearth the realm does not hold');
    assert(templateOf(state, pending.templateId), 'names an unknown event');
    assert(pending.turn <= state.turn && pending.expiresTurn === pending.turn + HEARTH_EVENT_ANSWER_TURNS, 'has an invalid term');
  });
  state.hearthEvents.recent.forEach((item, index) => {
    assert(index === 0 || byFaction(state.hearthEvents.recent[index - 1]!, item) < 0, 'memory must be ordered by realm without repeats');
    assert(state.factions.some(faction => faction.id === item.factionId) && item.turn <= state.turn, 'memory names an unknown realm or a future turn');
  });
}
