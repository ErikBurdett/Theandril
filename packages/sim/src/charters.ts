import { BUILDINGS, unitsForRules } from '@theandril/content';
import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState } from './types';
import { productionRequirementBlocker } from './naval';
import { rulesVersion } from './rules';

/** Rules 25: a hearth may be given a standing charter instead of an order every
 * turn. A charter never does anything a player could not: it waits for an empty
 * queue, obeys the ordinary production rules, spends the ordinary coin, and is
 * bounded by a ceiling the player sets and a reserve it will not draw past. It
 * is a way to stop typing, not a way to get more. */
const id = z.string().min(1).max(100);
export const CHARTER_FOCI = ['works', 'wealth', 'learning', 'muster'] as const;
export type CharterFocus = typeof CHARTER_FOCI[number];
export const CHARTER_CEILING_MIN = 4;
export const CHARTER_CEILING_MAX = 64;
/** Coin a charter will never draw a treasury below: a standing order must not bankrupt a realm. */
export const CHARTER_RESERVE = 40;
export const MAX_CHARTERS = 4096;

export interface Charter { settlementId: string; factionId: string; focus: CharterFocus; ceiling: number }
/** What a charter would place next, or why it can place nothing, derived on demand. */
export interface ObservedCharter extends Charter { itemId: string | null; itemName: string | null; blocker: string | null }
export const charterSchema = z.object({
  settlementId: id,
  factionId: id,
  focus: z.enum(CHARTER_FOCI),
  ceiling: z.number().int().min(CHARTER_CEILING_MIN).max(CHARTER_CEILING_MAX),
}).strict() satisfies z.ZodType<Charter>;
export const charterStateSchema = z.array(charterSchema).max(MAX_CHARTERS);

export const charterCommandSchemas = [
  z.object({
    type: z.literal('setCharter'), factionId: id, settlementId: id,
    focus: z.union([z.enum(CHARTER_FOCI), z.literal('none')]),
    ceiling: z.number().int().min(CHARTER_CEILING_MIN).max(CHARTER_CEILING_MAX),
  }).strict(),
] as const;

export const CHARTER_NAMES: Readonly<Record<CharterFocus, string>> = {
  works: 'Works', wealth: 'Wealth', learning: 'Learning', muster: 'Muster',
};
/** Every building charter finishes the same hearth; the focus only says what it
 * reaches for first. Ties fall to the cheaper work, so a charter is never a
 * surprise and never leaves a hearth half-built. */
const BUILDING_PRIORITY: Readonly<Record<Exclude<CharterFocus, 'muster'>, (item: typeof BUILDINGS[number]) => number>> = {
  works: item => item.industry + item.food,
  wealth: item => item.coin,
  learning: item => item.knowledge,
};
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: Charter, b: Charter): number => a.settlementId < b.settlementId ? -1 : a.settlementId > b.settlementId ? 1 : 0;

export const charterFor = (state: GameState, settlementId: string): Charter | undefined =>
  state.charters.find(item => item.settlementId === settlementId);

/** The order a charter would place next, or the reason it can place none. Derived
 * every time it is asked, so no explanation is ever stale in a save or a replay. */
export function charterChoice(state: GameState, charter: Charter): { itemId: string; name: string; coinCost: number } | null | string {
  const town = state.settlements[charter.settlementId];
  if (!town || town.factionId !== charter.factionId) return 'That hearth no longer answers to this realm.';
  if (town.queue.length) return null;
  const faction = state.factions.find(item => item.id === charter.factionId);
  if (!faction) return 'That hearth no longer answers to this realm.';
  const affordable = faction.treasury - CHARTER_RESERVE;
  const candidates = charter.focus === 'muster'
    ? unitsForRules(rulesVersion(state)).filter(unit => unit.movementDomain !== 'naval' && !unit.canFound)
      .map(unit => ({ item: unit, weight: unit.cost }))
    : BUILDINGS.filter(item => !town.buildings.includes(item.id))
      .map(item => ({ item, weight: BUILDING_PRIORITY[charter.focus as Exclude<CharterFocus, 'muster'>](item) }));
  if (!candidates.length) return charter.focus === 'muster'
    ? 'No company can be raised under these rules.'
    : 'Every building already stands at this hearth.';
  const legal = candidates.filter(entry => !productionRequirementBlocker(state, town, entry.item.id));
  if (!legal.length) return 'Nothing this charter builds is permitted at this hearth yet.';
  const within = legal.filter(entry => entry.item.coinCost <= charter.ceiling);
  if (!within.length) return `Nothing this charter builds costs ${charter.ceiling} coin or less; raise the ceiling.`;
  const funded = within.filter(entry => entry.item.coinCost <= affordable);
  if (!funded.length) return `The treasury is within ${CHARTER_RESERVE} coin of its reserve; the charter is waiting.`;
  const chosen = funded.sort((a, b) => b.weight - a.weight || a.item.coinCost - b.item.coinCost || (a.item.id < b.item.id ? -1 : 1))[0]!;
  return { itemId: chosen.item.id, name: chosen.item.name, coinCost: chosen.item.coinCost };
}

export function setCharter(state: GameState, factionId: string, settlementId: string, focus: CharterFocus | 'none', ceiling: number): CommandResult {
  const town = state.settlements[settlementId];
  if (!town || town.factionId !== factionId) return fail('You do not control that settlement.');
  const existing = state.charters.findIndex(item => item.settlementId === settlementId);
  if (focus === 'none') {
    if (existing < 0) return fail('That hearth holds no charter.');
    state.charters.splice(existing, 1);
    return { ok: true, events: [{ turn: state.turn, factionId, type: 'charter_revoked', cell: town.cell, message: `${town.name} returned to direct orders.` }] };
  }
  if (existing < 0 && state.charters.length >= MAX_CHARTERS) return fail('The realm already holds as many charters as it may.');
  const charter: Charter = { settlementId, factionId, focus, ceiling };
  if (existing < 0) { state.charters.push(charter); state.charters.sort(byId); } else state.charters[existing] = charter;
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'charter_set', cell: town.cell,
    message: `${town.name} holds a ${CHARTER_NAMES[focus]} charter under a ${ceiling} coin ceiling.` }] };
}

/** Standing orders are answered once a turn, after every hearth's yield has
 * landed, in settlement order. Bounded by the realm's own hearths. */
export function advanceCharters(state: GameState, emitted: DomainEvent[]): void {
  if (rulesVersion(state) < 25 || !state.charters.length) return;
  const factions = new Map(state.factions.map(faction => [faction.id, faction]));
  state.charters = state.charters.filter(charter => {
    const town = state.settlements[charter.settlementId];
    if (!town) return false;
    if (town.factionId !== charter.factionId) {
      emitted.push({ turn: state.turn, factionId: charter.factionId, type: 'charter_lost', cell: town.cell, message: `${town.name} left the realm; its charter ended.` });
      return false;
    }
    return true;
  });
  for (const charter of state.charters) {
    const choice = charterChoice(state, charter);
    if (typeof choice !== 'object' || choice === null) continue;
    const faction = factions.get(charter.factionId);
    const town = state.settlements[charter.settlementId];
    if (!faction || !town) continue;
    faction.treasury -= choice.coinCost;
    town.queue.push({ itemId: choice.itemId, progress: 0 });
    emitted.push({ turn: state.turn, factionId: charter.factionId, type: 'charter_ordered', cell: town.cell,
      message: `${town.name}'s ${CHARTER_NAMES[charter.focus]} charter ordered ${choice.name} for ${choice.coinCost} coin.` });
  }
}

export function observeCharters(state: GameState, factionId: string): ObservedCharter[] {
  return state.charters.filter(charter => charter.factionId === factionId).map(charter => {
    const choice = charterChoice(state, charter);
    return typeof choice === 'object' && choice !== null
      ? { ...charter, itemId: choice.itemId, itemName: choice.name, blocker: null }
      : { ...charter, itemId: null, itemName: null, blocker: typeof choice === 'string' ? choice : null };
  });
}

export function validateCharters(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: charter ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  assert(state.charters.every((charter, index) => !index || byId(state.charters[index - 1]!, charter) < 0), 'records must be unique and canonically ordered');
  // A charter whose hearth was razed or taken is pruned at the next turn, so a
  // snapshot between the two is legal; only the realm that holds it must exist.
  for (const charter of state.charters) assert(factions.has(charter.factionId), 'names a realm that does not exist');
}
