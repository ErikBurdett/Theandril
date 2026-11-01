import { z } from 'zod';
import { landmarkKind, relicDefinition, relicOfLandmarkKind, type RelicDefinition } from '@theandril/content';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { landmarks } from './landmarks';

/** Rules 63: the first hearth to work a landmark's hex brings up the relic of
 * that place, once, for its realm; the realm bestows it on a living character
 * of its own, who leads the company it rides with a little better for it, and
 * may take it back. One relic per landmark; the relics are canonical from
 * save 63 and read by their realm. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAX_RELICS = 64;
export const relicRecordSchema = z.object({ id, relicId: id, landmarkId: id, factionId: id, holderCharacterId: id.nullable(), foundTurn: turn }).strict();
export const relicStateSchema = z.array(relicRecordSchema).max(MAX_RELICS);
export type RelicRecord = z.infer<typeof relicRecordSchema>;
export interface ObservedRelic extends RelicRecord { name: string; description: string; landmarkName: string; holderName: string | null; leadership: RelicDefinition['leadership'] }
export const relicCommandSchemas = [
  z.object({ type: z.literal('bestowRelic'), factionId: id, relicId: id, bearerId: id.nullable() }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

export const emptyRelics = (): RelicRecord[] => [];
export const hasRelics = (state: GameState): boolean => (state.relics?.length ?? 0) > 0;
export function assertNoRelics(state: GameState): void {
  if (hasRelics(state)) throw new Error('This campaign has relics unavailable in historical rules.');
}
/** The first hearth to work a landmark's hex brings up its relic, in landmark order. */
export function advanceRelics(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 63 || state.victory) return;
  const found = new Set(state.relics.map(item => item.landmarkId));
  for (const site of landmarks(state.world, rulesVersion(state))) {
    if (found.has(site.id) || state.relics.length >= MAX_RELICS) continue;
    const kind = landmarkKind(site.kindId), relic = relicOfLandmarkKind(site.kindId, rulesVersion(state));
    if (!kind || !relic) continue;
    const entry = Object.entries(state.land.settlements).find(([settlementId, land]) => state.settlements[settlementId] && land.worked.includes(site.cell));
    if (!entry) continue;
    const town = state.settlements[entry[0]]!;
    state.relics = [...state.relics, { id: site.id, relicId: relic.id, landmarkId: site.id, factionId: town.factionId, holderCharacterId: null, foundTurn: state.turn }].sort(byId);
    events.push({ turn: state.turn, factionId: town.factionId, type: 'relic_found', cell: site.cell, message: `The workers of ${town.name} have brought up ${relic.name} from ${kind.name}: ${relic.description} It waits in the hearth for a character to bear it.` });
  }
}
/** Why the relic cannot go to that character now, or null; a null character takes it back. */
export function bestowBlocker(state: GameState, factionId: string, relicId: string, characterId: string | null): string | null {
  if (rulesVersion(state) < 63) return 'Relics are not part of these rules.';
  const record = state.relics.find(item => item.id === relicId);
  if (!record || record.factionId !== factionId) return 'Choose a relic of your own realm.';
  if (characterId === null) return record.holderCharacterId === null ? 'Nobody bears this relic.' : null;
  const character = state.characters[characterId];
  if (!character || character.factionId !== factionId) return 'Choose a living character of your own realm.';
  if (character.dead) return 'The dead bear nothing.';
  if (record.holderCharacterId === characterId) return 'That character bears it already.';
  return null;
}
export function bestowRelic(state: GameState, factionId: string, relicId: string, characterId: string | null): CommandResult {
  const blocker = bestowBlocker(state, factionId, relicId, characterId);
  if (blocker) return fail(blocker);
  const record = state.relics.find(item => item.id === relicId)!, relic = relicDefinition(record.relicId)!;
  const before = record.holderCharacterId ? state.characters[record.holderCharacterId]?.name : undefined;
  record.holderCharacterId = characterId;
  const holder = characterId ? state.characters[characterId]!.name : null;
  return { ok: true, events: [{ turn: state.turn, factionId, type: holder ? 'relic_bestowed' : 'relic_taken_back', message: holder ? `${relic.name} goes to ${holder}${before ? ` from ${before}` : ''}: ${leadershipWords(relic)}.` : `${relic.name} is taken back from ${before ?? 'its bearer'} and waits in the hearth.` }] };
}
const leadershipWords = (relic: RelicDefinition): string => [relic.leadership.attack ? `+${relic.leadership.attack} attack` : '', relic.leadership.armor ? `+${relic.leadership.armor} armor` : ''].filter(Boolean).join(', ') + ' for the company its bearer rides with';
/** What the relics a character bears add to the company it leads. */
export function relicLeadership(state: GameState, characterId: string): { attack: number; armor: number } {
  if (rulesVersion(state) < 63) return { attack: 0, armor: 0 };
  return state.relics.filter(item => item.holderCharacterId === characterId).reduce((sum, item) => { const relic = relicDefinition(item.relicId); return relic ? { attack: sum.attack + relic.leadership.attack, armor: sum.armor + relic.leadership.armor } : sum; }, { attack: 0, armor: 0 });
}
export function observeRelics(state: GameState, factionId: string): ObservedRelic[] | undefined {
  if (rulesVersion(state) < 63) return undefined;
  return state.relics.filter(item => item.factionId === factionId).flatMap(item => {
    const relic = relicDefinition(item.relicId), site = landmarks(state.world, rulesVersion(state)).find(site => site.id === item.landmarkId);
    if (!relic) return [];
    return [{ ...item, name: relic.name, description: relic.description, landmarkName: site ? landmarkKind(site.kindId)?.name ?? site.id : item.landmarkId, holderName: item.holderCharacterId ? state.characters[item.holderCharacterId]?.name ?? null : null, leadership: { ...relic.leadership } }];
  });
}
export function validateRelics(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: relic ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  for (const [index, item] of state.relics.entries()) {
    assert(relicDefinition(item.relicId), 'names an unknown relic');
    assert(factions.has(item.factionId), 'belongs to an unknown realm');
    assert(item.holderCharacterId === null || state.characters[item.holderCharacterId]?.factionId === item.factionId, 'is borne by a character of another realm');
    assert(item.foundTurn <= state.turn, 'was found ahead of the campaign');
    assert(!index || item.id > state.relics[index - 1]!.id, 'is out of order or repeated');
  }
}
