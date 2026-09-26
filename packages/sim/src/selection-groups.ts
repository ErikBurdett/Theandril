import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState } from './types';
import { armyDomain } from './naval';

export const MAX_SELECTION_GROUPS_PER_FACTION = 24;
export const MAX_SELECTION_GROUP_MEMBERS = 128;
export const SELECTION_GROUP_NAME_MAX = 40;
export const SELECTION_GROUP_KINDS = ['armies', 'settlements'] as const;
export type SelectionGroupKind = typeof SELECTION_GROUP_KINDS[number];
export interface SelectionGroup { id: string; factionId: string; kind: SelectionGroupKind; name: string; memberIds: string[] }
const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
const groupId = z.string().regex(/^selection-group\.[1-9][0-9]*$/).max(40);
const plainName = (value: string) => [...value].every(char => char.charCodeAt(0) >= 32 && char !== '<' && char !== '>');
const name = z.string().trim().min(1).max(SELECTION_GROUP_NAME_MAX).refine(plainName, 'Use a plain-text group name.');
const members = z.array(id).max(MAX_SELECTION_GROUP_MEMBERS);
export const selectionGroupSchema = z.object({ id: groupId, factionId: id, kind: z.enum(SELECTION_GROUP_KINDS),
  name: z.string().min(1).max(SELECTION_GROUP_NAME_MAX).refine(value => value === value.trim() && plainName(value), 'Group names must be trimmed plain text.'), memberIds: members }).strict();
// Save envelopes support at most 64 realms; each has one combined group budget.
export const selectionGroupStateSchema = z.array(selectionGroupSchema).max(64 * MAX_SELECTION_GROUPS_PER_FACTION);
export const selectionGroupCounterSchema = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
export const selectionGroupCommandSchemas = [
  z.object({ type: z.literal('setSelectionGroup'), factionId: id, groupId: groupId.optional(), kind: z.enum(SELECTION_GROUP_KINDS), name, memberIds: members }).strict(),
  z.object({ type: z.literal('deleteSelectionGroup'), factionId: id, groupId }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: SelectionGroup, b: SelectionGroup) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
function memberBelongs(state: GameState, group: Pick<SelectionGroup, 'kind' | 'factionId'>, memberId: string): boolean {
  if (group.kind === 'settlements') return state.settlements[memberId]?.factionId === group.factionId;
  const army = state.armies[memberId];
  return Boolean(army && army.factionId === group.factionId && armyDomain(army) === 'land');
}

export function setSelectionGroup(state: GameState, command: { factionId: string; groupId?: string; kind: SelectionGroupKind; name: string; memberIds: string[] }): CommandResult {
  const previous = command.groupId ? state.selectionGroups.find(group => group.id === command.groupId && group.factionId === command.factionId) : undefined;
  if (command.groupId && !previous) return fail('You do not control that saved group.');
  if (previous && previous.kind !== command.kind) return fail('A saved group cannot change between armies and hearths.');
  if (!previous && !command.memberIds.length) return fail('Select at least one member for a new saved group.');
  if (new Set(command.memberIds).size !== command.memberIds.length) return fail('Choose distinct saved group members.');
  if (command.memberIds.some(memberId => !memberBelongs(state, command, memberId))) return fail(command.kind === 'armies' ? 'Saved army groups require land armies you control.' : 'Saved hearth groups require settlements you control.');
  const own = state.selectionGroups.filter(group => group.factionId === command.factionId);
  if (!previous && own.length >= MAX_SELECTION_GROUPS_PER_FACTION) return fail(`A realm may keep at most ${MAX_SELECTION_GROUPS_PER_FACTION} saved groups.`);
  if (own.some(group => group.id !== previous?.id && group.kind === command.kind && group.name.toLowerCase() === command.name.toLowerCase())) return fail('A saved group of that kind already uses this name.');
  if (!previous && state.nextSelectionGroupId >= Number.MAX_SAFE_INTEGER) return fail('The saved group identifier limit has been reached.');
  const group: SelectionGroup = { id: previous?.id ?? `selection-group.${state.nextSelectionGroupId}`, factionId: command.factionId,
    kind: command.kind, name: command.name, memberIds: [...command.memberIds].sort() };
  if (previous) state.selectionGroups[state.selectionGroups.indexOf(previous)] = group;
  else { state.nextSelectionGroupId++; state.selectionGroups.push(group); state.selectionGroups.sort(byId); }
  return { ok: true, events: [{ turn: state.turn, factionId: command.factionId, type: 'selection_group_saved', message: `Saved group “${group.name}” with ${group.memberIds.length} members. No orders were issued.` }] };
}

export function deleteSelectionGroup(state: GameState, factionId: string, id: string): CommandResult {
  const index = state.selectionGroups.findIndex(group => group.id === id && group.factionId === factionId);
  if (index < 0) return fail('You do not control that saved group.');
  const group = state.selectionGroups[index]!;
  state.selectionGroups.splice(index, 1);
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'selection_group_deleted', message: `Deleted saved group “${group.name}”. Existing orders are unchanged.` }] };
}

/** Called only after successful lifecycle commands, never reads or ordinary moves.
 * Only bounded group membership is scanned; no world/army collection scan. */
export function pruneSelectionGroups(state: GameState, events: DomainEvent[]): void {
  for (const group of state.selectionGroups) {
    const retained = group.memberIds.filter(memberId => memberBelongs(state, group, memberId));
    if (retained.length === group.memberIds.length) continue;
    const removed = group.memberIds.length - retained.length;
    group.memberIds = retained;
    events.push({ turn: state.turn, factionId: group.factionId, type: 'selection_group_pruned', message: `Saved group “${group.name}” lost ${removed} unavailable members; ${retained.length} remain.` });
  }
}

export const observeSelectionGroups = (state: GameState, factionId: string): SelectionGroup[] => state.selectionGroups
  .filter(group => group.factionId === factionId).map(group => ({ ...group, memberIds: [...group.memberIds] }));

export function validateSelectionGroups(state: GameState): void {
  const assert = (condition: unknown, message: string) => { if (!condition) throw new Error('Invalid save: selection group ' + message); };
  selectionGroupStateSchema.parse(state.selectionGroups);
  selectionGroupCounterSchema.parse(state.nextSelectionGroupId);
  const factions = new Set(state.factions.map(faction => faction.id)), counts = new Map<string, number>(), names = new Set<string>();
  for (const [index, group] of state.selectionGroups.entries()) {
    assert(!index || byId(state.selectionGroups[index - 1]!, group) < 0, 'IDs must be unique and canonically ordered.');
    const sequence = Number(group.id.slice('selection-group.'.length));
    assert(Number.isSafeInteger(sequence) && sequence < state.nextSelectionGroupId, 'identifier exceeds its dedicated counter.');
    assert(factions.has(group.factionId), 'owner does not exist.');
    counts.set(group.factionId, (counts.get(group.factionId) ?? 0) + 1);
    assert(counts.get(group.factionId)! <= MAX_SELECTION_GROUPS_PER_FACTION, 'realm exceeds the group limit.');
    const key = JSON.stringify([group.factionId, group.kind, group.name.toLowerCase()]);
    assert(!names.has(key), 'names must be unique within their realm and kind.'); names.add(key);
    assert(group.memberIds.every((memberId, index) => (!index || group.memberIds[index - 1]! < memberId) && memberBelongs(state, group, memberId)), 'members must be sorted, distinct and owned entities of the stated kind.');
  }
}

export function assertNoSelectionGroups(state: GameState): void {
  if (state.selectionGroups.length || state.nextSelectionGroupId !== 1) throw new Error('Historical rules cannot discard saved selection groups or their identifier history.');
}
