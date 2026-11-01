import { z } from 'zod';
import { CHARACTER_DEFINITIONS, officeDefinition, officesForRules, type OfficeDefinition, type OfficeYields } from '@theandril/content';
import type { CommandResult, DomainEvent, GameState } from './types';
import type { Character } from './characters';
import { rulesVersion } from './rules';

/** Rules 65: offices of the realm. A realm keeps one office for each
 * character role; a living, unwounded character of that role who sits in a
 * hearth of the realm may hold it, and the hearth they sit in gains the
 * office's yield while they do. A holder cannot ride with a company until
 * they resign; death vacates the office. Canonical from save 65, read by
 * the realm. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAX_OFFICES = 192;
export const officeRecordSchema = z.object({ id, officeId: id, factionId: id, characterId: id, sinceTurn: turn }).strict();
export const officeStateSchema = z.array(officeRecordSchema).max(MAX_OFFICES);
export type OfficeRecord = z.infer<typeof officeRecordSchema>;
export interface ObservedOffice { officeId: string; name: string; description: string; role: OfficeDefinition['role']; yields: OfficeYields; holderCharacterId: string | null; holderName: string | null; settlementId: string | null; settlementName: string | null; sinceTurn: number | null }
export const officeCommandSchemas = [
  z.object({ type: z.literal('holdOffice'), factionId: id, officeId: id, holderId: id }).strict(),
  z.object({ type: z.literal('resignOffice'), factionId: id, officeId: id }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
const roleOf = (character: Character): string | undefined => CHARACTER_DEFINITIONS.find(definition => definition.id === character.definitionId)?.role;
const recordId = (officeId: string, factionId: string): string => `${officeId}.${factionId}`;
export const yieldWords = (yields: OfficeYields): string => (['food', 'industry', 'coin', 'knowledge'] as const).filter(key => yields[key]).map(key => `+${yields[key]} ${key}`).join(', ');

export const emptyOffices = (): OfficeRecord[] => [];
export const hasOffices = (state: GameState): boolean => (state.offices?.length ?? 0) > 0;
export function assertNoOffices(state: GameState): void {
  if (hasOffices(state)) throw new Error('This campaign has offices unavailable in historical rules.');
}
/** The office a character holds, if any. */
export const heldOffice = (state: GameState, characterId: string): OfficeRecord | undefined => rulesVersion(state) >= 65 ? state.offices.find(item => item.characterId === characterId) : undefined;
/** Why the character cannot take the office now, or null. */
export function holdBlocker(state: GameState, factionId: string, officeId: string, characterId: string): string | null {
  if (rulesVersion(state) < 65) return 'Offices are not part of these rules.';
  const office = officeDefinition(officeId);
  if (!office || office.sinceRules > rulesVersion(state)) return 'Choose an office of the realm.';
  if (state.offices.some(item => item.factionId === factionId && item.officeId === officeId)) return 'Someone holds that office already.';
  const character = state.characters[characterId];
  if (!character || character.factionId !== factionId) return 'Choose a living character of your own realm.';
  if (character.dead) return 'The dead hold no office.';
  if (character.woundedTurns) return 'This character must recover from wounds first.';
  if (roleOf(character) !== office.role) return `Only a character of the ${office.role} role holds ${office.name}.`;
  if (character.location?.kind !== 'settlement') return 'The holder must sit in a hearth of the realm.';
  if (state.offices.some(item => item.characterId === characterId)) return 'That character holds an office already.';
  return null;
}
export function holdOffice(state: GameState, factionId: string, officeId: string, characterId: string): CommandResult {
  const blocker = holdBlocker(state, factionId, officeId, characterId);
  if (blocker) return fail(blocker);
  const office = officeDefinition(officeId)!, character = state.characters[characterId]!;
  const town = character.location?.kind === 'settlement' ? state.settlements[character.location.settlementId] : undefined;
  state.offices = [...state.offices, { id: recordId(officeId, factionId), officeId, factionId, characterId, sinceTurn: state.turn }].sort(byId);
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'office_held', ...(town ? { cell: town.cell } : {}), message: `${character.name} takes office as ${office.name} at ${town?.name ?? 'the hearth'}: ${yieldWords(office.yields)} for the hearth they sit in.` }] };
}
export function resignBlocker(state: GameState, factionId: string, officeId: string): string | null {
  if (rulesVersion(state) < 65) return 'Offices are not part of these rules.';
  if (!state.offices.some(item => item.factionId === factionId && item.officeId === officeId)) return 'Nobody holds that office.';
  return null;
}
export function resignOffice(state: GameState, factionId: string, officeId: string): CommandResult {
  const blocker = resignBlocker(state, factionId, officeId);
  if (blocker) return fail(blocker);
  const record = state.offices.find(item => item.factionId === factionId && item.officeId === officeId)!, office = officeDefinition(officeId)!;
  const holder = state.characters[record.characterId]?.name ?? 'its holder';
  state.offices = state.offices.filter(item => item !== record);
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'office_resigned', message: `${holder} resigns as ${office.name}; the office is vacant.` }] };
}
/** Death vacates whatever the character held. */
export function vacateOffices(state: GameState, character: Character, events: DomainEvent[]): void {
  if (rulesVersion(state) < 65) return;
  for (const record of state.offices.filter(item => item.characterId === character.id)) {
    const office = officeDefinition(record.officeId);
    state.offices = state.offices.filter(item => item !== record);
    events.push({ turn: state.turn, factionId: record.factionId, type: 'office_vacated', message: `${office?.name ?? record.officeId} is vacant: ${character.name} held it.` });
  }
}
/** What the offices held by characters sitting in the hearth add to it. */
export function officeYields(state: GameState, settlementId: string): OfficeYields {
  const sum: OfficeYields = { food: 0, industry: 0, coin: 0, knowledge: 0 };
  if (rulesVersion(state) < 65) return sum;
  for (const record of state.offices) {
    const character = state.characters[record.characterId], office = officeDefinition(record.officeId);
    if (!character || !office || character.dead || character.location?.kind !== 'settlement' || character.location.settlementId !== settlementId) continue;
    sum.food += office.yields.food; sum.industry += office.yields.industry; sum.coin += office.yields.coin; sum.knowledge += office.yields.knowledge;
  }
  return sum;
}
export function observeOffices(state: GameState, factionId: string): ObservedOffice[] | undefined {
  if (rulesVersion(state) < 65) return undefined;
  return officesForRules(rulesVersion(state)).map(office => {
    const record = state.offices.find(item => item.factionId === factionId && item.officeId === office.id);
    const holder = record ? state.characters[record.characterId] : undefined;
    const town = holder?.location?.kind === 'settlement' ? state.settlements[holder.location.settlementId] : undefined;
    return { officeId: office.id, name: office.name, description: office.description, role: office.role, yields: { ...office.yields }, holderCharacterId: record?.characterId ?? null, holderName: holder?.name ?? null, settlementId: town?.id ?? null, settlementName: town?.name ?? null, sinceTurn: record?.sinceTurn ?? null };
  });
}
export function validateOffices(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: office ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id)), holders = new Set<string>();
  for (const [index, item] of state.offices.entries()) {
    const office = officeDefinition(item.officeId), character = state.characters[item.characterId];
    assert(office && office.sinceRules <= rulesVersion(state), 'names an unknown office');
    assert(factions.has(item.factionId) && item.id === recordId(item.officeId, item.factionId), 'belongs to an unknown realm or is misnamed');
    assert(character && !character.dead && character.factionId === item.factionId && roleOf(character) === office?.role && character.location?.kind === 'settlement', 'is held by nobody who could hold it');
    assert(!holders.has(item.characterId), 'is held beside another office by the same character'); holders.add(item.characterId);
    assert(item.sinceTurn <= state.turn, 'was taken ahead of the campaign');
    assert(!index || item.id > state.offices[index - 1]!.id, 'is out of order or repeated');
  }
}
