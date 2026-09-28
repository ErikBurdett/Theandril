import { z } from 'zod';
import type { GameState } from './types';

/** Pure shapes and validation: save must not import movement or simulation. */
export const MAX_THEATERS_PER_FACTION = 8;
export const MAX_THEATER_HEARTHS = 16;
export const MAX_THEATER_MEMBERS = 128;
export const MAX_THEATER_DISPATCHES = 16;
const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const theaterId = z.string().max(40).regex(/^theater\.[1-9][0-9]*$/);
const cell = z.number().int().min(0).max(349_999);
const plain = (value: string) => [...value].every(char => char.charCodeAt(0) >= 32 && char !== '<' && char !== '>');
const name = z.string().trim().min(1).max(40).refine(plain, 'Use a plain-text theater name.');
const config = { factionId: id, name, settlementIds: z.array(id).min(1).max(MAX_THEATER_HEARTHS), armyIds: z.array(id).max(MAX_THEATER_MEMBERS), reserveCell: cell, guardsPerSettlement: z.number().int().min(1).max(4), enabled: z.boolean() };
export const theaterV33CommandSchemas = [
  z.object({ type: z.literal('setTheater'), theaterId: theaterId.optional(), ...config }).strict(),
  z.object({ type: z.literal('deleteTheater'), factionId: id, theaterId }).strict(),
] as const;
const reinforcementLimit = z.number().int().min(0).max(4);
export const theaterCommandSchemas = [
  theaterV33CommandSchemas[0].extend({ reinforcementLimit: reinforcementLimit.optional() }).strict(),
  theaterV33CommandSchemas[1],
] as const;
export type TheaterCommand = z.infer<typeof theaterCommandSchemas[number]>;
export const defenseTheaterV33Schema = z.object({ ...config, name: z.string().min(1).max(40).refine(value => value === value.trim() && plain(value)), id: theaterId,
  lastRunTurn: z.number().int().min(1).nullable(), lastDispatches: z.array(z.object({ armyId: id, targetCell: cell, accepted: z.boolean(), message: z.string().min(1).max(1000) }).strict()).max(MAX_THEATER_DISPATCHES),
}).strict();
export const defenseTheaterV33StateSchema = z.array(defenseTheaterV33Schema).max(64 * MAX_THEATERS_PER_FACTION);
const reinforcementHolds = z.array(z.object({ settlementId: id, extraGuards: z.number().int().min(1).max(4), untilTurn: z.number().int().min(1) }).strict()).max(MAX_THEATER_HEARTHS);
/** Optional only for historical in-memory campaigns; version34 saves require both. */
export const defenseTheaterSchema = defenseTheaterV33Schema.extend({ reinforcementLimit: reinforcementLimit.optional(), reinforcementHolds: reinforcementHolds.optional() }).strict();
export const defenseTheaterV34StateSchema = z.array(defenseTheaterSchema.required({ reinforcementLimit: true, reinforcementHolds: true })).max(64 * MAX_THEATERS_PER_FACTION);
export const defenseTheaterStateSchema = z.array(defenseTheaterSchema).max(64 * MAX_THEATERS_PER_FACTION);
export const theaterCounterSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
export type DefenseTheater = z.infer<typeof defenseTheaterSchema>;
export type TheaterDispatch = DefenseTheater['lastDispatches'][number];
export interface TheaterHearth { settlementId: string; name: string; cell: number | null; available: boolean; stationed: number; incoming: number; required: number; deficit: number; reinforcement?: { visibleEnemies: number; extraGuards: number; holdUntilTurn: number | null } }
export interface TheaterMember { armyId: string; cell: number | null; status: 'garrison' | 'incoming' | 'reserve' | 'ready' | 'overridden' | 'blocked' | 'unavailable'; targetCell: number | null; blocker: string | null }
export interface ObservedDefenseTheater extends DefenseTheater { hearths: TheaterHearth[]; members: TheaterMember[]; missingGuards: number; blocker: string | null }
/** Compact own-realm read model. Counts describe canonical observations; they
 * are validated at the view boundary without recomputing assignment rules. */
export const observedDefenseTheaterSchema = defenseTheaterSchema.extend({
  hearths: z.array(z.object({ settlementId: id, name: z.string().min(1).max(1000), cell: cell.nullable(), available: z.boolean(),
    stationed: z.number().int().min(0).max(60_000), incoming: z.number().int().min(0).max(60_000),
    required: z.number().int().min(1).max(8), deficit: z.number().int().min(0).max(8), reinforcement: z.object({ visibleEnemies: z.number().int().min(0).max(60_000), extraGuards: reinforcementLimit, holdUntilTurn: z.number().int().min(1).nullable() }).strict().optional() }).strict()).max(MAX_THEATER_HEARTHS),
  members: z.array(z.object({ armyId: id, cell: cell.nullable(), status: z.enum(['garrison', 'incoming', 'reserve', 'ready', 'overridden', 'blocked', 'unavailable']),
    targetCell: cell.nullable(), blocker: z.string().max(1000).nullable() }).strict()).max(MAX_THEATER_MEMBERS),
  missingGuards: z.number().int().min(0).max(MAX_THEATER_HEARTHS * 8), blocker: z.string().max(1000).nullable(),
}).strict();

export function validateTheaters(state: GameState): void {
  const assert = (condition: unknown, message: string) => { if (!condition) throw new Error('Invalid save: defensive theater ' + message); };
  defenseTheaterStateSchema.parse(state.theaters);
  theaterCounterSchema.parse(state.nextTheaterId);
  const factions = new Set(state.factions.map(item => item.id)), names = new Set<string>(), armies = new Set<string>(), towns = new Set<string>(), counts = new Map<string, number>();
  const sorted = (ids: string[]) => ids.every((id, index) => !index || ids[index - 1]! < id);
  for (const [i, theater] of state.theaters.entries()) {
    assert(!i || state.theaters[i - 1]!.id < theater.id, 'IDs must be sorted and unique.');
    const sequence = Number(theater.id.slice(8));
    assert(Number.isSafeInteger(sequence) && sequence < state.nextTheaterId, 'identifier exceeds its counter.');
    assert(factions.has(theater.factionId), 'owner does not exist.');
    counts.set(theater.factionId, (counts.get(theater.factionId) ?? 0) + 1);
    assert(counts.get(theater.factionId)! <= MAX_THEATERS_PER_FACTION, 'realm exceeds its theater limit.');
    const key = `${theater.factionId}:${theater.name.toLowerCase()}`;
    assert(!names.has(key), 'names must be unique per realm.'); names.add(key);
    assert(sorted(theater.armyIds) && sorted(theater.settlementIds), 'references must be sorted and distinct.');
    const holds = theater.reinforcementHolds ?? [];
    assert(sorted(holds.map(hold => hold.settlementId)), 'reinforcement holds must be sorted and distinct.');
    assert(holds.every(hold => theater.enabled && theater.settlementIds.includes(hold.settlementId) && hold.extraGuards <= (theater.reinforcementLimit ?? 0) && hold.untilTurn <= state.turn + 1), 'reinforcement hold exceeds its policy or turn.');
    // Loss/capture can occur between phases; old references remain saveable.
    for (const id of theater.armyIds) { const key = `${theater.factionId}:${id}`; assert(!armies.has(key), 'army belongs to two theaters.'); armies.add(key); }
    for (const id of theater.settlementIds) { const key = `${theater.factionId}:${id}`; assert(!towns.has(key), 'hearth belongs to two theaters.'); towns.add(key); }
    assert(theater.reserveCell < state.world.width * state.world.height && state.explored[theater.factionId]?.has(theater.reserveCell), 'reserve must be an explored world hex.');
    assert(theater.lastRunTurn === null ? !theater.lastDispatches.length : theater.lastRunTurn <= state.turn, 'dispatch turn is invalid.');
    assert(new Set(theater.lastDispatches.map(item => item.armyId)).size === theater.lastDispatches.length, 'dispatch members must be distinct.');
    assert(theater.lastDispatches.every(item => item.targetCell < state.world.width * state.world.height && state.explored[theater.factionId]?.has(item.targetCell)), 'dispatch target must be explored.');
  }
}
export function assertNoTheaterReinforcements(state: GameState): void {
  if (state.theaters.some(theater => (theater.reinforcementLimit ?? 0) !== 0 || theater.reinforcementHolds?.length)) throw new Error('Historical rules cannot discard theater reinforcement policy or holds.');
}
export function assertNoTheaters(state: GameState): void {
  if (state.theaters.length || state.nextTheaterId !== 1) throw new Error('Historical rules cannot discard defensive theaters or their identifier history.');
}
