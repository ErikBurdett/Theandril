import { z } from 'zod';
import { neighbors } from '@theandril/mapgen';
import { UNITS } from '@theandril/content';
import type { CommandResult, GameState } from './types';
import { rulesVersion } from './rules';
import { isCityState } from './seats';
import { atWar } from './warfare';
import { relation } from './diplomacy';
import { armyStrength } from './army-composition';
import { indexes } from './visibility';
import { cityStateKindOf } from './hires';

/** Rules 61: a realm may press a city-state for tribute without war. A land
 * company standing beside the city-state's hearth demands coin; if it
 * outweighs the walls' garrison by half again the city-state pays what it
 * can of a sum set by its size, and if it does not the demand is refused.
 * Either way the city-state remembers: its grievance grows, its trust falls,
 * and it is not pressed again by the same realm for twenty turns. Nothing
 * here opens a war or moves a company; the demands are canonical from save 61. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const DEMAND_COOLDOWN_TURNS = 20;
/** The company must outweigh the garrison on the walls by this much. */
export const DEMAND_STRENGTH_RATIO = 1.5;
export const MAX_DEMANDS = 128;
export const demandSchema = z.object({ factionId: id, cityStateId: id, turn, paid: z.boolean(), coin: z.number().int().min(0).max(1_000_000) }).strict();
export const demandStateSchema = z.array(demandSchema).max(MAX_DEMANDS);
export type TributeDemand = z.infer<typeof demandSchema>;
export interface TributeDemandQuote { cityStateId: string; armyId: string; coin: number; blocker: string | null }
export interface ObservedDemands { quotes: TributeDemandQuote[]; demands: TributeDemand[] }
export const demandCommandSchemas = [
  z.object({ type: z.literal('demandTribute'), factionId: id, cityStateId: id, armyId: id }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const units = new Map(UNITS.map(unit => [unit.id, unit]));

export const emptyDemands = (): TributeDemand[] => [];
export const hasDemands = (state: GameState): boolean => (state.demands?.length ?? 0) > 0;
export function assertNoDemands(state: GameState): void {
  if (hasDemands(state)) throw new Error('This campaign has tribute demands unavailable in historical rules.');
}
const hearthOf = (state: GameState, cityStateId: string) => Object.values(state.settlements).find(town => town.factionId === cityStateId);
const landCompany = (army: GameState['armies'][string]): boolean => army.formations.length > 0 && army.formations.every(item => units.get(item.unitId)?.movementDomain !== 'naval' && !units.get(item.unitId)?.canFound);
/** The strength of the city-state's land companies standing on its hearth. */
export function garrisonStrengthAt(state: GameState, cityStateId: string): number {
  const hearth = hearthOf(state, cityStateId);
  if (!hearth) return 0;
  return Object.values(state.armies).filter(army => army.factionId === cityStateId && army.cell === hearth.cell && landCompany(army)).reduce((sum, army) => sum + armyStrength(army), 0);
}
/** What a city-state pays when pressed: a sum set by its size, as much of it as it holds. */
export function tributeOf(state: GameState, cityStateId: string): number {
  const hearth = hearthOf(state, cityStateId), city = state.factions.find(faction => faction.id === cityStateId);
  if (!hearth || !city) return 0;
  // Rules 77: the city-state's kind sets what it pays.
  return Math.max(0, Math.min(city.treasury, Math.floor((20 + 8 * hearth.population) * (cityStateKindOf(state, cityStateId)?.tributePercent ?? 100) / 100)));
}
const lastDemand = (state: GameState, factionId: string, cityStateId: string): TributeDemand | undefined => [...state.demands].reverse().find(item => item.factionId === factionId && item.cityStateId === cityStateId);
/** Why the realm's company cannot press the city-state now, or null. */
export function demandBlocker(state: GameState, factionId: string, cityStateId: string, armyId: string): string | null {
  if (rulesVersion(state) < 61) return 'Tribute demands are not part of these rules.';
  if (isCityState(factionId)) return 'A city-state presses no one.';
  if (!isCityState(cityStateId) || !state.factions.some(faction => faction.id === cityStateId)) return 'Only a city-state may be pressed for tribute.';
  if (atWar(state, factionId, cityStateId)) return 'The realms are at war; a demand is for a city-state at peace.';
  if (state.diplomacy.clients.some(bond => (bond.patronId === factionId && bond.clientId === cityStateId) || (bond.patronId === cityStateId && bond.clientId === factionId))) return 'Patron and client do not press each other for tribute.';
  const hearth = hearthOf(state, cityStateId);
  if (!hearth) return 'The city-state holds no hearth.';
  const army = state.armies[armyId];
  if (!army || army.factionId !== factionId) return 'Choose one of your own companies.';
  if (!landCompany(army) || state.transports[armyId]) return 'Only a land company at the gate can press a city-state.';
  if (!neighbors(hearth.cell, state.world.width, state.world.height).includes(army.cell)) return 'The company must stand beside the city-state’s hearth.';
  const last = lastDemand(state, factionId, cityStateId);
  if (last && state.turn - last.turn < DEMAND_COOLDOWN_TURNS) return `The city-state was pressed on turn ${last.turn}; it is not pressed again before turn ${last.turn + DEMAND_COOLDOWN_TURNS}.`;
  return null;
}
export function demandTribute(state: GameState, factionId: string, cityStateId: string, armyId: string): CommandResult {
  const blocker = demandBlocker(state, factionId, cityStateId, armyId);
  if (blocker) return fail(blocker);
  const army = state.armies[armyId]!, realm = state.factions.find(faction => faction.id === factionId)!, city = state.factions.find(faction => faction.id === cityStateId)!;
  const strength = armyStrength(army), walls = garrisonStrengthAt(state, cityStateId);
  const paid = strength >= walls * DEMAND_STRENGTH_RATIO;
  const coin = paid ? tributeOf(state, cityStateId) : 0;
  const memory = relation(state, factionId, cityStateId);
  if (paid) {
    city.treasury -= coin;
    realm.treasury += coin;
    memory.grievances = Math.min(100, memory.grievances + 25);
    memory.trust = Math.max(-100, memory.trust - 20);
    memory.respect = Math.min(100, memory.respect + 5);
  } else {
    memory.grievances = Math.min(100, memory.grievances + 10);
    memory.trust = Math.max(-100, memory.trust - 10);
  }
  state.demands = [...state.demands, { factionId, cityStateId, turn: state.turn, paid, coin }].slice(-MAX_DEMANDS);
  const message = paid
    ? `${city.name} pays ${coin} coin to ${realm.name}’s ${army.name} at its gate rather than see its walls stormed; the city remembers.`
    : `${city.name} refuses ${realm.name}’s demand: its walls hold ${walls} strength against ${army.name}’s ${strength}; the city remembers.`;
  return { ok: true, events: [factionId, cityStateId].map(id => ({ turn: state.turn, factionId: id, type: paid ? 'tribute_paid' : 'tribute_refused', cell: army.cell, message })) };
}
/** The realm's quotes — every own land company beside a city-state hearth in sight — and the demands it made or was made of. */
export function observeDemands(state: GameState, factionId: string): ObservedDemands | undefined {
  if (rulesVersion(state) < 61) return undefined;
  const quotes: TributeDemandQuote[] = [];
  if (!isCityState(factionId)) {
    const visible = indexes(state).visible.get(factionId);
    for (const city of state.factions.filter(faction => isCityState(faction.id))) {
      const hearth = hearthOf(state, city.id);
      if (!hearth || !visible?.has(hearth.cell)) continue;
      const beside = new Set(neighbors(hearth.cell, state.world.width, state.world.height));
      for (const army of Object.values(state.armies).filter(army => army.factionId === factionId && beside.has(army.cell) && landCompany(army) && !state.transports[army.id]).sort((a, b) => a.id < b.id ? -1 : 1)) {
        quotes.push({ cityStateId: city.id, armyId: army.id, coin: tributeOf(state, city.id), blocker: demandBlocker(state, factionId, city.id, army.id) });
      }
    }
  }
  return { quotes, demands: state.demands.filter(item => item.factionId === factionId || item.cityStateId === factionId).map(item => ({ ...item })) };
}
export function validateDemands(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: tribute demand ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  for (const [index, demand] of state.demands.entries()) {
    assert(factions.has(demand.factionId) && factions.has(demand.cityStateId), 'names an unknown realm');
    assert(isCityState(demand.cityStateId) && !isCityState(demand.factionId), 'is not a realm’s demand of a city-state');
    assert(demand.turn <= state.turn, 'lies ahead');
    assert(!index || demand.turn >= state.demands[index - 1]!.turn, 'is out of order');
    assert(demand.paid || demand.coin === 0, 'refused yet paid');
  }
}
