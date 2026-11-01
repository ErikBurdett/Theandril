import { z } from 'zod';
import type { CommandResult, GameState } from './types';
import { rulesVersion } from './rules';
import { allianceBetween, alliesOf } from './alliances';

/** Rules 72: allies share their maps. `shareMaps` gives each ally every hex
 * the other has explored — remembered ground, not present sight — once
 * every twenty turns for the pair. One record for each pair that shared,
 * by pair; canonical from save 72. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAP_SHARE_COOLDOWN_TURNS = 20;
export const mapShareSchema = z.object({ parties: z.tuple([id, id]), turn }).strict();
export const mapShareStateSchema = z.array(mapShareSchema).max(1128);
export type MapShare = z.infer<typeof mapShareSchema>;
export interface ObservedMapShare { allyId: string; lastTurn: number | null; canShare: boolean; blocker: string | null }
export const mapShareCommandSchemas = [
  z.object({ type: z.literal('shareMaps'), factionId: id, allyId: id }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const pair = (a: string, b: string): [string, string] => a < b ? [a, b] : [b, a];
const byPair = (a: MapShare, b: MapShare): number => a.parties[0] < b.parties[0] ? -1 : a.parties[0] > b.parties[0] ? 1 : a.parties[1] < b.parties[1] ? -1 : a.parties[1] > b.parties[1] ? 1 : 0;

export const emptyMapShares = (): MapShare[] => [];
export const hasMapShares = (state: GameState): boolean => (state.mapShares?.length ?? 0) > 0;
export function assertNoMapShares(state: GameState): void {
  if (hasMapShares(state)) throw new Error('This campaign has shared maps unavailable in historical rules.');
}
export const lastMapShare = (state: GameState, a: string, b: string): MapShare | undefined => { const [x, y] = pair(a, b); return state.mapShares.find(item => item.parties[0] === x && item.parties[1] === y); };
export function mapShareBlocker(state: GameState, factionId: string, allyId: string): string | null {
  if (rulesVersion(state) < 72) return 'Shared maps are not part of these rules.';
  if (factionId === allyId || !allianceBetween(state, factionId, allyId)) return 'Maps are shared with an ally.';
  const last = lastMapShare(state, factionId, allyId);
  if (last && state.turn - last.turn < MAP_SHARE_COOLDOWN_TURNS) return `Maps were shared on turn ${last.turn}; they are shared again from turn ${last.turn + MAP_SHARE_COOLDOWN_TURNS}.`;
  return null;
}
export function shareMaps(state: GameState, factionId: string, allyId: string): CommandResult {
  const blocker = mapShareBlocker(state, factionId, allyId);
  if (blocker) return fail(blocker);
  const mine = state.explored[factionId] ?? new Set<number>(), theirs = state.explored[allyId] ?? new Set<number>();
  let learned = 0, taught = 0;
  for (const cell of theirs) if (!mine.has(cell)) { mine.add(cell); learned++; }
  for (const cell of mine) if (!theirs.has(cell)) { theirs.add(cell); taught++; }
  state.explored[factionId] = mine; state.explored[allyId] = theirs;
  state.mapShares = [...state.mapShares.filter(item => !(item.parties[0] === pair(factionId, allyId)[0] && item.parties[1] === pair(factionId, allyId)[1])), { parties: pair(factionId, allyId), turn: state.turn }].sort(byPair);
  const name = (id: string) => state.factions.find(faction => faction.id === id)?.name ?? id;
  const message = `${name(factionId)} and ${name(allyId)} share their maps: ${name(factionId)} learns ${learned} hexes and ${name(allyId)} ${taught}.`;
  return { ok: true, events: [factionId, allyId].map(item => ({ turn: state.turn, factionId: item, type: 'maps_shared', message })) };
}
export function observeMapShares(state: GameState, factionId: string): ObservedMapShare[] | undefined {
  if (rulesVersion(state) < 72) return undefined;
  return alliesOf(state, factionId).map(allyId => { const blocker = mapShareBlocker(state, factionId, allyId); return { allyId, lastTurn: lastMapShare(state, factionId, allyId)?.turn ?? null, canShare: blocker === null, blocker }; });
}
export function validateMapShares(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: shared map ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  for (const [index, item] of state.mapShares.entries()) {
    assert(factions.has(item.parties[0]) && factions.has(item.parties[1]) && item.parties[0] < item.parties[1], 'names an unknown or unordered pair');
    assert(item.turn <= state.turn, 'lies ahead');
    assert(!index || byPair(state.mapShares[index - 1]!, item) < 0, 'is out of order or repeated');
  }
}
