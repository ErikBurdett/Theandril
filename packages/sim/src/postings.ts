import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState } from './types';
import { transferArmyFormations } from './army-composition';
import { queueMovement } from './movement';
import { rulesVersion } from './rules';

/** Rules 26: an army may be posted to a hex it will march to and then hold, or
 * march to and join the force already standing there. A hearth may name a muster
 * point, and every company it raises is posted there the turn it forms. Nothing
 * here moves an army the player could not move: a posting goes through the
 * ordinary travel order, and it never touches an army that already has one. */
const id = z.string().min(1).max(100);
const cell = z.number().int().min(0).max(349_999);
export const POSTING_MODES = ['hold', 'join'] as const;
export type PostingMode = typeof POSTING_MODES[number];
export const MAX_POSTINGS = 8192;
export const MAX_MUSTERS = 4096;

export interface Posting { armyId: string; factionId: string; cell: number; mode: PostingMode }
export interface ObservedPosting extends Posting { arrived: boolean; blocker: string | null }
export interface Muster { settlementId: string; factionId: string; cell: number }
export const postingSchema = z.object({ armyId: id, factionId: id, cell, mode: z.enum(POSTING_MODES) }).strict() satisfies z.ZodType<Posting>;
export const postingStateSchema = z.array(postingSchema).max(MAX_POSTINGS);
export const musterSchema = z.object({ settlementId: id, factionId: id, cell }).strict() satisfies z.ZodType<Muster>;
export const musterStateSchema = z.array(musterSchema).max(MAX_MUSTERS);

export const postingCommandSchemas = [
  z.object({ type: z.literal('setPosting'), factionId: id, armyId: id, cell, mode: z.union([z.enum(POSTING_MODES), z.literal('none')]) }).strict(),
  z.object({ type: z.literal('setMuster'), factionId: id, settlementId: id, cell: cell.nullable() }).strict(),
] as const;

export const POSTING_NAMES: Readonly<Record<PostingMode, string>> = { hold: 'Hold', join: 'Join' };
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byArmy = (a: Posting, b: Posting): number => a.armyId < b.armyId ? -1 : a.armyId > b.armyId ? 1 : 0;
const byTown = (a: Muster, b: Muster): number => a.settlementId < b.settlementId ? -1 : a.settlementId > b.settlementId ? 1 : 0;
const unknown = 'You have not explored that hex.';

export const postingFor = (state: GameState, armyId: string): Posting | undefined => state.postings.find(item => item.armyId === armyId);
export const musterFor = (state: GameState, settlementId: string): Muster | undefined => state.musters.find(item => item.settlementId === settlementId);

/** The force a posted army would join where it stands: the largest, then the oldest. */
export function joinHost(state: GameState, armyId: string) {
  const army = state.armies[armyId];
  if (!army) return undefined;
  return Object.values(state.armies)
    .filter(other => other.id !== army.id && other.factionId === army.factionId && other.cell === army.cell && !state.transports[other.id])
    .sort((a, b) => b.formations.length - a.formations.length || (a.id < b.id ? -1 : 1))[0];
}

export function setPosting(state: GameState, factionId: string, armyId: string, target: number, mode: PostingMode | 'none'): CommandResult {
  const army = state.armies[armyId];
  if (!army || army.factionId !== factionId) return fail('You do not control that army.');
  const index = state.postings.findIndex(item => item.armyId === armyId);
  if (mode === 'none') {
    if (index < 0) return fail('That army holds no posting.');
    state.postings.splice(index, 1);
    return { ok: true, events: [{ turn: state.turn, factionId, type: 'posting_cleared', cell: army.cell, message: `${army.name} returned to direct orders.` }] };
  }
  if (!state.explored[factionId]?.has(target)) return fail(unknown);
  if (index < 0 && state.postings.length >= MAX_POSTINGS) return fail('The realm already holds as many postings as it may.');
  const posting: Posting = { armyId, factionId, cell: target, mode };
  if (index < 0) { state.postings.push(posting); state.postings.sort(byArmy); } else state.postings[index] = posting;
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'posting_set', cell: army.cell,
    message: `${army.name} is posted to hex ${target} and will ${mode === 'join' ? 'join the force standing there' : 'hold it'}.` }] };
}

export function setMuster(state: GameState, factionId: string, settlementId: string, target: number | null): CommandResult {
  const town = state.settlements[settlementId];
  if (!town || town.factionId !== factionId) return fail('You do not control that settlement.');
  const index = state.musters.findIndex(item => item.settlementId === settlementId);
  if (target === null) {
    if (index < 0) return fail('That hearth names no muster point.');
    state.musters.splice(index, 1);
    return { ok: true, events: [{ turn: state.turn, factionId, type: 'muster_cleared', cell: town.cell, message: `${town.name} no longer musters its companies anywhere.` }] };
  }
  if (!state.explored[factionId]?.has(target)) return fail(unknown);
  if (index < 0 && state.musters.length >= MAX_MUSTERS) return fail('The realm already names as many muster points as it may.');
  const muster: Muster = { settlementId, factionId, cell: target };
  if (index < 0) { state.musters.push(muster); state.musters.sort(byTown); } else state.musters[index] = muster;
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'muster_set', cell: town.cell, message: `${town.name} musters every company it raises at hex ${target}.` }] };
}

/** A company raised at a hearth with a muster point marches there and joins. */
export function musterNewArmy(state: GameState, settlementId: string, armyId: string): void {
  if (rulesVersion(state) < 26) return;
  const muster = musterFor(state, settlementId);
  const army = state.armies[armyId];
  if (!muster || !army || muster.factionId !== army.factionId || state.postings.length >= MAX_POSTINGS) return;
  state.postings.push({ armyId, factionId: army.factionId, cell: muster.cell, mode: 'join' });
  state.postings.sort(byArmy);
}

/** Answered after ordinary travel, so a posting only ever starts a march for an
 * army that has no travel order of its own. Bounded by the realm's own armies. */
export function advancePostings(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 26) return;
  state.musters = state.musters.filter(muster => state.settlements[muster.settlementId]?.factionId === muster.factionId);
  state.postings = state.postings.filter(posting => state.armies[posting.armyId]?.factionId === posting.factionId);
  for (const posting of [...state.postings].sort(byArmy)) {
    let army = state.armies[posting.armyId];
    if (!army) continue;
    if (army.cell !== posting.cell) {
      // A travel order the player gave, active or paused, always takes precedence.
      if (state.routes[posting.armyId] || state.transports[posting.armyId]) continue;
      const result = queueMovement(state, posting.factionId, posting.armyId, posting.cell);
      if (result.ok) events.push(...result.events);
      army = state.armies[posting.armyId]!;
    }
    // An army that reached its posting this turn joins this turn: arriving and
    // standing idle beside the force it was sent to is never what was asked.
    if (posting.mode !== 'join' || army.cell !== posting.cell) continue;
    const host = joinHost(state, posting.armyId);
    if (!host) continue;
    const result = transferArmyFormations(state, posting.factionId, posting.armyId, host.id);
    if (result.ok) events.push(...result.events);
  }
  state.postings = state.postings.filter(posting => state.armies[posting.armyId]);
}

export function observePostings(state: GameState, factionId: string): ObservedPosting[] {
  return state.postings.filter(posting => posting.factionId === factionId).map(posting => {
    const army = state.armies[posting.armyId];
    const arrived = army?.cell === posting.cell;
    const route = state.routes[posting.armyId];
    const blocker = arrived
      ? posting.mode === 'join' && !joinHost(state, posting.armyId) ? 'No other force of this realm stands here to join.' : null
      : state.transports[posting.armyId] ? 'The army is aboard a fleet; it resumes its posting once ashore.'
        : route ? route.status === 'paused' ? route.pauseReason : null
          : 'No safe route to the posting is known; the army is waiting.';
    return { ...posting, arrived, blocker };
  });
}

export function validatePostings(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: posting ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  const cells = state.world.width * state.world.height;
  assert(state.postings.every((posting, index) => !index || byArmy(state.postings[index - 1]!, posting) < 0), 'records must be unique and canonically ordered');
  assert(state.musters.every((muster, index) => !index || byTown(state.musters[index - 1]!, muster) < 0), 'muster records must be unique and canonically ordered');
  // An army lost or a hearth taken since the snapshot is pruned at the next turn,
  // so only the realm holding the order and the hex it names must still be real.
  for (const posting of state.postings) {
    assert(factions.has(posting.factionId), 'names a realm that does not exist');
    assert(posting.cell < cells, 'names a hex outside the world');
  }
  for (const muster of state.musters) {
    assert(factions.has(muster.factionId), 'names a realm that does not exist');
    assert(muster.cell < cells, 'names a hex outside the world');
  }
}
