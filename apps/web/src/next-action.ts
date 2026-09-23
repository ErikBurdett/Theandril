import type { Observation } from '@theandril/sim';

/** Every candidate carries the cause that put it here, so a wide realm can read
 * and work one kind of exception at a time instead of cycling every entity. */
export type ActionCause = 'movement' | 'route-interrupted' | 'posting-stalled' | 'empty-queue' | 'charter-stalled' | 'households';
export interface ActionCandidate { id: string; name: string; cell: number; reason: string; cause: ActionCause }
export interface HouseholdCandidate extends ActionCandidate { unassignedHouseholds: number }
export interface ActionCandidates { armies: ActionCandidate[]; settlements: ActionCandidate[]; households: HouseholdCandidate[] }
export type ActionKind = 'army' | 'settlement' | 'household';
export interface ActionGroup { kind: ActionKind; cause: ActionCause; label: string; count: number }
const CAUSE_LABELS: Readonly<Record<ActionCause, string>> = {
  'movement': 'with movement remaining',
  'route-interrupted': 'with an interrupted route',
  'posting-stalled': 'with a stalled posting',
  'empty-queue': 'with an empty production queue',
  'charter-stalled': 'with a stalled charter',
  'households': 'with unassigned households',
};
const plural = (kind: ActionKind, count: number): string =>
  kind === 'army' ? count === 1 ? 'company' : 'companies' : count === 1 ? 'hearth' : 'hearths';

/** One row per cause, largest first: the shape of the work, not a list of names. */
export function actionGroups(candidates: ActionCandidates): ActionGroup[] {
  const groups: ActionGroup[] = [];
  for (const [kind, items] of [['army', candidates.armies], ['settlement', candidates.settlements], ['household', candidates.households]] as const) {
    const counts = new Map<ActionCause, number>();
    for (const item of items) counts.set(item.cause, (counts.get(item.cause) ?? 0) + 1);
    for (const [cause, count] of counts) groups.push({ kind, cause, count, label: `${count} ${plural(kind, count)} ${CAUSE_LABELS[cause]}` });
  }
  return groups.sort((a, b) => b.count - a.count || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
}
export type Direction = 1 | -1;
export interface ShortcutBindings { army: string; settlement: string; turn: string }
export const SHORTCUT_STORAGE_KEY = 'theandril.shortcuts.v1';
export const DEFAULT_SHORTCUTS: ShortcutBindings = { army: 'n', settlement: 's', turn: 'e' };
const byId = (a: ActionCandidate, b: ActionCandidate) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

/** Navigation hints only: all actual orders remain validated by simulation. */
export function actionCandidates(view: Pick<Observation, 'factionId' | 'armies' | 'routes' | 'settlements' | 'productionOptions' | 'charters' | 'postings' | 'sieges' | 'land'>): ActionCandidates {
  const routes = new Map(view.routes.map(route => [route.armyId, route]));
  const besiegers = new Set(view.sieges.map(siege => siege.armyId));
  const armies: ActionCandidate[] = [];
  const postings = new Map(view.postings.map(posting => [posting.armyId, posting] as const));
  for (const army of view.armies) {
    if (army.factionId !== view.factionId || army.carrierId || besiegers.has(army.id) || army.strength <= 0 || army.formations.length === 0
      || army.movementBlocker || army.commander?.status === 'mission' || army.agents.some(agent => agent.status === 'mission')) continue;
    const route = routes.get(army.id);
    if (route?.status === 'active' || (army.movement <= 0 && route?.status !== 'paused')) continue;
    // An army under a posting answers for itself; only a stuck one wants a look,
    // and then the posting's own reason is the reason.
    const posting = postings.get(army.id);
    if (posting && !posting.blocker) continue;
    if (posting?.blocker) { armies.push({ id: army.id, name: army.name, cell: army.cell, cause: 'posting-stalled', reason: `Posting stalled: ${posting.blocker}` }); continue; }
    armies.push({ id: army.id, name: army.name, cell: army.cell, cause: route?.status === 'paused' ? 'route-interrupted' : 'movement',
      reason: route?.status === 'paused' ? `Route interrupted: ${route.pauseReason ?? 'Review the saved route.'}` : `${army.movement} movement remaining` });
  }
  const canProduce = new Set(view.productionOptions.filter(option => option.canQueue).map(option => option.settlementId));
  // A hearth under a charter answers for itself. It is only worth a look when the
  // charter has nothing left it can order, and then its own reason is the reason.
  const charters = new Map(view.charters.map(charter => [charter.settlementId, charter] as const));
  const settlements = view.settlements.filter(town => town.factionId === view.factionId && town.queue.length === 0 && canProduce.has(town.id))
    .filter(town => !charters.has(town.id) || charters.get(town.id)!.blocker !== null)
    .map(town => ({ id: town.id, name: town.name, cell: town.cell,
      cause: charters.has(town.id) ? 'charter-stalled' as const : 'empty-queue' as const,
      reason: charters.get(town.id)?.blocker ?? 'Empty production queue; an available project can be ordered.' }));
  // Compact canonical totals, independent of queue status and paged tile quotes.
  // Do not infer worker capacity from population or choose/spend on tiles here.
  const ownedTowns = new Map(view.settlements.filter(town => town.factionId === view.factionId).map(town => [town.id, town]));
  const households: HouseholdCandidate[] = [];
  for (const land of view.land.settlements) {
    const town = ownedTowns.get(land.settlementId), unassignedHouseholds = land.workerCapacity - land.worked.length;
    if (town && unassignedHouseholds > 0) households.push({ id: town.id, name: town.name, cell: town.cell, unassignedHouseholds, cause: 'households',
      reason: `${unassignedHouseholds} unassigned household${unassignedHouseholds === 1 ? '' : 's'}. Review land to assign worked tiles; unassigned households add no tile yields.` });
  }
  return { armies: armies.sort(byId), settlements: settlements.sort(byId), households: households.sort(byId) };
}

/** Advance from the selected ID even if it stopped being eligible; stable wrap. */
export function nextAction(candidates: readonly ActionCandidate[], currentId: string | undefined, direction: Direction = 1): ActionCandidate | undefined {
  if (!currentId) return direction === 1 ? candidates[0] : candidates.at(-1);
  if (direction === 1) return candidates.find(item => item.id > currentId) ?? candidates[0];
  for (let index = candidates.length - 1; index >= 0; index--) if (candidates[index]!.id < currentId) return candidates[index];
  return candidates.at(-1);
}

export function shortcutError(bindings: ShortcutBindings, kind: keyof ShortcutBindings, input: string): string | null {
  const key = input.toLowerCase();
  if (!/^[a-z]$/.test(key)) return 'Use one letter from A to Z for a shortcut; Shift selects the previous entry.';
  if (Object.entries(bindings).some(([other, value]) => other !== kind && value === key)) return 'That shortcut is already assigned. Choose a different key.';
  return null;
}

export function loadShortcuts(read: () => string | null): { bindings: ShortcutBindings; error: string } {
  try {
    const text = read();
    if (text === null) return { bindings: { ...DEFAULT_SHORTCUTS }, error: '' };
    const input: unknown = JSON.parse(text);
    if (!input || typeof input !== 'object') throw new Error('Invalid shortcut settings');
    const bindings = input as Record<string, unknown>;
    if (!['army', 'settlement', 'turn'].every(key => typeof bindings[key] === 'string' && /^[a-z]$/.test(bindings[key] as string))
      || new Set([bindings.army, bindings.settlement, bindings.turn]).size !== 3) throw new Error('Invalid shortcut settings');
    return { bindings: { army: bindings.army as string, settlement: bindings.settlement as string, turn: bindings.turn as string }, error: '' };
  } catch {
    return { bindings: { ...DEFAULT_SHORTCUTS }, error: 'Saved shortcuts could not be read. Using N, S and E; change them in Campaign & settings.' };
  }
}

export function saveShortcuts(bindings: ShortcutBindings, write: (text: string) => void): string {
  try { write(JSON.stringify(bindings)); return ''; }
  catch { return 'Shortcuts work for this session, but browser storage could not save them.'; }
}

export function actionShortcut(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'ctrlKey' | 'altKey' | 'metaKey' | 'repeat' | 'isComposing' | 'defaultPrevented'>, bindings: ShortcutBindings, blocked: boolean): { kind: ActionKind; direction: Direction } | undefined {
  if (blocked || event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
  const key = event.key.toLowerCase(), kind = key === bindings.army ? 'army' : key === bindings.settlement ? 'settlement' : undefined;
  return kind ? { kind, direction: event.shiftKey ? -1 : 1 } : undefined;
}
