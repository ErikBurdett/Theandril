import { z } from 'zod';
import { CRISIS_BLIGHT_KEYS, crisesForRules, crisisDefinition, EPOCHS, type CrisisBlight, type CrisisDefinition } from '@theandril/content';
import { SeededRandom } from '@theandril/mapgen';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';

/** Rules 53: crises of the ages. When the world enters an age after the
 * first, one of the age's crises is drawn from the campaign seed and the age's
 * index, so a replay draws the same one, and it stands for its term. Each
 * turn every hearth of every realm that has not sheltered pays the toll;
 * a realm shelters its hearths once, by command, for the quoted coin. The
 * standing crisis and the crises past are canonical, recorded from save 53. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAX_PAST_CRISES = 16;
export const activeCrisisSchema = z.object({ id, crisisId: id, startedTurn: turn, endsTurn: turn, sheltered: z.array(id).max(64) }).strict();
export const pastCrisisSchema = z.object({ id, crisisId: id, startedTurn: turn, endedTurn: turn }).strict();
export const crisisStateSchema = z.object({ active: activeCrisisSchema.nullable(), past: z.array(pastCrisisSchema).max(MAX_PAST_CRISES) }).strict();
export type ActiveCrisis = z.infer<typeof activeCrisisSchema>;
export type PastCrisis = z.infer<typeof pastCrisisSchema>;
export type CrisisState = z.infer<typeof crisisStateSchema>;
export interface ObservedCrisis {
  id: string; crisisId: string; name: string; description: string; startedTurn: number; endsTurn: number; turnsLeft: number;
  /** What each unsheltered hearth loses every turn. */
  blight: CrisisBlight; hearths: number; sheltered: boolean; shelterCost: number; shelterBlocker: string | null; shelter: string;
}
export const crisisCommandSchemas = [
  z.object({ type: z.literal('shelterFromCrisis'), factionId: id, crisisId: id }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byId = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;

export const emptyCrises = (): CrisisState => ({ active: null, past: [] });
export const hasCrises = (state: GameState): boolean => Boolean(state.crises?.active) || (state.crises?.past.length ?? 0) > 0;
export function assertNoCrises(state: GameState): void {
  if (hasCrises(state)) throw new Error('This campaign has crises unavailable in historical rules.');
}
const hearthsOf = (state: GameState, factionId: string) => Object.values(state.settlements).filter(town => town.factionId === factionId);
const definitionOf = (state: GameState, crisisId: string): CrisisDefinition | undefined => crisesForRules(rulesVersion(state)).find(crisis => crisis.id === crisisId);
/** The toll in words: "2 food, 1 devastation". */
export const blightWords = (blight: CrisisBlight): string => CRISIS_BLIGHT_KEYS.filter(key => blight[key]).map(key => `${blight[key]} ${key}`).join(', ');
export const shelterCost = (state: GameState, crisis: CrisisDefinition, factionId: string): number => crisis.shelterCoinPerHearth * hearthsOf(state, factionId).length;

/** Why the realm cannot shelter its hearths now, or null. */
export function shelterBlocker(state: GameState, factionId: string): string | null {
  const active = state.crises.active;
  if (!active) return 'No crisis stands.';
  const crisis = definitionOf(state, active.crisisId);
  if (!crisis) return 'The standing crisis is unknown to these rules.';
  if (active.sheltered.includes(factionId)) return 'The realm’s hearths are already sheltered.';
  const hearths = hearthsOf(state, factionId).length;
  if (!hearths) return 'The realm holds no hearth to shelter.';
  const cost = crisis.shelterCoinPerHearth * hearths;
  const faction = state.factions.find(item => item.id === factionId);
  if (!faction) return 'Unknown realm.';
  if (faction.treasury < cost) return `Requires ${cost} coin; the treasury holds ${faction.treasury}.`;
  return null;
}
export function shelterFromCrisis(state: GameState, factionId: string, crisisId: string): CommandResult {
  if (rulesVersion(state) < 53) return fail('Crises are not part of these rules.');
  const active = state.crises.active;
  if (!active || active.id !== crisisId) return fail('This crisis is not the one that stands.');
  const blocker = shelterBlocker(state, factionId);
  if (blocker) return fail(blocker);
  const crisis = definitionOf(state, active.crisisId)!, faction = state.factions.find(item => item.id === factionId)!;
  const hearths = hearthsOf(state, factionId).length, cost = crisis.shelterCoinPerHearth * hearths;
  faction.treasury -= cost;
  active.sheltered = [...active.sheltered, factionId].sort(byId);
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'crisis_sheltered', message: `${crisis.name}: ${faction.name} shelters its ${hearths} hearth${hearths === 1 ? '' : 's'} for ${cost} coin. ${crisis.shelter}` }] };
}
/** Every age the world entered since `previousIndex` brings its crisis, drawn from the seed and the age; a crisis still standing ends as the next begins. */
export function beginCrises(state: GameState, previousIndex: number, reachedIndex: number, events: DomainEvent[]): void {
  if (rulesVersion(state) < 53 || state.victory) return;
  for (let index = previousIndex + 1; index <= reachedIndex; index++) {
    const age = EPOCHS[index]!;
    const pool = crisesForRules(rulesVersion(state)).filter(crisis => crisis.epoch === age.id);
    if (!pool.length) continue;
    if (state.crises.active) endCrisis(state, events, `${age.name} begins`);
    const picker = new SeededRandom((state.world.seed ^ 0x43524953 ^ Math.imul(index, 0x9e3779b1)) >>> 0);
    const crisis = pool[picker.nextInt(pool.length)]!;
    state.crises.active = { id: `crisis.${state.turn}.${index}`, crisisId: crisis.id, startedTurn: state.turn, endsTurn: state.turn + crisis.turns, sheltered: [] };
    for (const faction of state.factions) events.push({ turn: state.turn, factionId: faction.id, type: 'crisis_begun', message: `${crisis.name} comes with ${age.name.toLowerCase()}: ${crisis.description} Every unsheltered hearth loses ${blightWords(crisis.blight)} each turn until turn ${state.crises.active.endsTurn}; sheltering costs ${crisis.shelterCoinPerHearth} coin a hearth.` });
  }
}
function endCrisis(state: GameState, events: DomainEvent[], because: string): void {
  const active = state.crises.active;
  if (!active) return;
  const crisis = crisisDefinition(active.crisisId);
  state.crises.past = [...state.crises.past, { id: active.id, crisisId: active.crisisId, startedTurn: active.startedTurn, endedTurn: state.turn }].slice(-MAX_PAST_CRISES);
  state.crises.active = null;
  for (const faction of state.factions) events.push({ turn: state.turn, factionId: faction.id, type: 'crisis_ended', message: `${crisis?.name ?? active.crisisId} passes: ${because}.` });
}
/** The turn's toll on every unsheltered hearth, then the end of a crisis whose term is up. */
export function advanceCrises(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 53) return;
  const active = state.crises.active;
  if (!active) return;
  if (state.turn >= active.endsTurn) { endCrisis(state, events, 'its term is up'); return; }
  const crisis = definitionOf(state, active.crisisId);
  if (!crisis) return;
  for (const faction of state.factions) {
    if (active.sheltered.includes(faction.id)) continue;
    const hearths = hearthsOf(state, faction.id);
    for (const town of hearths) {
      town.food = Math.max(0, town.food - crisis.blight.food);
      town.devastation = Math.max(0, Math.min(100, town.devastation + crisis.blight.devastation));
    }
    faction.treasury = Math.max(0, faction.treasury - crisis.blight.coin * hearths.length);
    faction.knowledge = Math.max(0, faction.knowledge - crisis.blight.knowledge * hearths.length);
  }
}
export function observeCrisis(state: GameState, factionId: string): ObservedCrisis | undefined {
  if (rulesVersion(state) < 53) return undefined;
  const active = state.crises.active;
  if (!active) return undefined;
  const crisis = definitionOf(state, active.crisisId);
  if (!crisis) return undefined;
  return {
    id: active.id, crisisId: crisis.id, name: crisis.name, description: crisis.description, startedTurn: active.startedTurn, endsTurn: active.endsTurn,
    turnsLeft: Math.max(0, active.endsTurn - state.turn), blight: { ...crisis.blight }, hearths: hearthsOf(state, factionId).length,
    sheltered: active.sheltered.includes(factionId), shelterCost: shelterCost(state, crisis, factionId), shelterBlocker: shelterBlocker(state, factionId), shelter: crisis.shelter,
  };
}
export function validateCrises(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: crisis ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  const active = state.crises.active;
  if (active) {
    assert(crisisDefinition(active.crisisId), 'names an unknown crisis');
    assert(active.startedTurn <= state.turn && active.endsTurn > active.startedTurn, 'term is not in order');
    assert(active.sheltered.every((item, index) => factions.has(item) && (!index || item > active.sheltered[index - 1]!)), 'shelters an unknown realm or is out of order');
  }
  for (const [index, past] of state.crises.past.entries()) {
    assert(crisisDefinition(past.crisisId), 'past names an unknown crisis');
    assert(past.startedTurn <= past.endedTurn && past.endedTurn <= state.turn, 'past term is not in order');
    assert(!index || past.endedTurn >= state.crises.past[index - 1]!.endedTurn, 'past is out of order');
  }
}
