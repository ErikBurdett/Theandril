import { z } from 'zod';
import { neighbors } from '@theandril/mapgen';
import { UNITS } from '@theandril/content';
import type { Army, CommandResult, GameState } from './types';
import { rulesVersion } from './rules';
import { isCityState } from './seats';
import { atWar } from './warfare';
import { relation } from './diplomacy';
import { indexes } from './visibility';

/** Rules 68: a city-state sells companies. A realm's land company standing
 * beside a city-state's hearth, at peace with it, may hire a company of Ash
 * pike raised at the gate for a sum set by the city-state's size; the coin
 * goes to the city, the company to the realm, with no movement left this
 * turn and an ordinary company of the realm from then on. The city sells
 * to the same realm once every ten turns and thinks a little better of a
 * paying customer. The hires are canonical from save 68. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const HIRE_COOLDOWN_TURNS = 10;
export const HIRED_UNIT_ID = 'unit.spearman';
export const MAX_HIRES = 256;
export const hireSchema = z.object({ factionId: id, cityStateId: id, armyId: id, turn, coin: z.number().int().min(0).max(1_000_000) }).strict();
export const hireStateSchema = z.array(hireSchema).max(MAX_HIRES);
export type HireRecord = z.infer<typeof hireSchema>;
export interface HireQuote { cityStateId: string; armyId: string; coin: number; blocker: string | null }
export interface ObservedHires { quotes: HireQuote[]; hires: HireRecord[] }
export type HireRaiser = (state: GameState, factionId: string, cell: number, unitId: string) => Army;
export const hireCommandSchemas = [
  z.object({ type: z.literal('hireCompany'), factionId: id, cityStateId: id, armyId: id }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const units = new Map(UNITS.map(unit => [unit.id, unit]));

export const emptyHires = (): HireRecord[] => [];
export const hasHires = (state: GameState): boolean => (state.hires?.length ?? 0) > 0;
export function assertNoHires(state: GameState): void {
  if (hasHires(state)) throw new Error('This campaign has hired companies unavailable in historical rules.');
}
const hearthOf = (state: GameState, cityStateId: string) => Object.values(state.settlements).find(town => town.factionId === cityStateId);
const landCompany = (army: GameState['armies'][string]): boolean => army.formations.length > 0 && army.formations.every(item => units.get(item.unitId)?.movementDomain !== 'naval' && !units.get(item.unitId)?.canFound);
/** What a city-state asks for a company: a sum set by its size. */
export function hirePriceOf(state: GameState, cityStateId: string): number {
  const hearth = hearthOf(state, cityStateId);
  return hearth ? 30 + 4 * hearth.population : 0;
}
const lastHire = (state: GameState, factionId: string, cityStateId: string): HireRecord | undefined => [...state.hires].reverse().find(item => item.factionId === factionId && item.cityStateId === cityStateId);
/** Why the realm's company cannot hire from the city-state now, or null. */
export function hireBlocker(state: GameState, factionId: string, cityStateId: string, armyId: string): string | null {
  if (rulesVersion(state) < 68) return 'Hired companies are not part of these rules.';
  if (isCityState(factionId)) return 'A city-state hires from no one.';
  if (!isCityState(cityStateId) || !state.factions.some(faction => faction.id === cityStateId)) return 'Only a city-state sells companies.';
  if (atWar(state, factionId, cityStateId)) return 'The realms are at war; a city-state sells to a realm at peace.';
  const hearth = hearthOf(state, cityStateId);
  if (!hearth) return 'The city-state holds no hearth.';
  if (state.sieges[hearth.id]) return 'A besieged city-state sells nothing.';
  const army = state.armies[armyId];
  if (!army || army.factionId !== factionId) return 'Choose one of your own companies.';
  if (!landCompany(army) || state.transports[armyId]) return 'Only a land company at the gate can hire from a city-state.';
  if (!neighbors(hearth.cell, state.world.width, state.world.height).includes(army.cell)) return 'The company must stand beside the city-state’s hearth.';
  const last = lastHire(state, factionId, cityStateId);
  if (last && state.turn - last.turn < HIRE_COOLDOWN_TURNS) return `The city-state sold to you on turn ${last.turn}; it sells again from turn ${last.turn + HIRE_COOLDOWN_TURNS}.`;
  const price = hirePriceOf(state, cityStateId);
  if ((state.factions.find(faction => faction.id === factionId)?.treasury ?? 0) < price) return `Not enough coin: the company costs ${price}.`;
  return null;
}
export function hireCompany(state: GameState, factionId: string, cityStateId: string, armyId: string, raise: HireRaiser): CommandResult {
  const blocker = hireBlocker(state, factionId, cityStateId, armyId);
  if (blocker) return fail(blocker);
  const army = state.armies[armyId]!, realm = state.factions.find(faction => faction.id === factionId)!, city = state.factions.find(faction => faction.id === cityStateId)!;
  const coin = hirePriceOf(state, cityStateId);
  realm.treasury -= coin; city.treasury += coin;
  const hired = raise(state, factionId, army.cell, HIRED_UNIT_ID);
  hired.name = `Hired pikes of ${city.name}`; hired.movement = 0;
  const memory = relation(state, factionId, cityStateId);
  memory.trust = Math.min(100, memory.trust + 5);
  state.hires = [...state.hires, { factionId, cityStateId, armyId: hired.id, turn: state.turn, coin }].slice(-MAX_HIRES);
  const unit = units.get(HIRED_UNIT_ID)?.name ?? HIRED_UNIT_ID;
  const message = `${city.name} sells ${realm.name} a company of ${unit} for ${coin} coin; ${hired.name} stands at the gate beside ${army.name}.`;
  return { ok: true, events: [factionId, cityStateId].map(item => ({ turn: state.turn, factionId: item, type: 'company_hired', cell: army.cell, message })) };
}
/** The realm's quotes — every own land company beside a city-state hearth in sight — and the hires it made or sold. */
export function observeHires(state: GameState, factionId: string): ObservedHires | undefined {
  if (rulesVersion(state) < 68) return undefined;
  const quotes: HireQuote[] = [];
  if (!isCityState(factionId)) {
    const visible = indexes(state).visible.get(factionId);
    for (const city of state.factions.filter(faction => isCityState(faction.id))) {
      const hearth = hearthOf(state, city.id);
      if (!hearth || !visible?.has(hearth.cell)) continue;
      const beside = new Set(neighbors(hearth.cell, state.world.width, state.world.height));
      for (const army of Object.values(state.armies).filter(army => army.factionId === factionId && beside.has(army.cell) && landCompany(army) && !state.transports[army.id]).sort((a, b) => a.id < b.id ? -1 : 1)) {
        quotes.push({ cityStateId: city.id, armyId: army.id, coin: hirePriceOf(state, city.id), blocker: hireBlocker(state, factionId, city.id, army.id) });
      }
    }
  }
  return { quotes, hires: state.hires.filter(item => item.factionId === factionId || item.cityStateId === factionId).map(item => ({ ...item })) };
}
export function validateHires(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: hired company ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  for (const [index, hire] of state.hires.entries()) {
    assert(factions.has(hire.factionId) && factions.has(hire.cityStateId), 'names an unknown realm');
    assert(isCityState(hire.cityStateId) && !isCityState(hire.factionId), 'is not a realm’s hire from a city-state');
    assert(hire.turn <= state.turn, 'lies ahead');
    assert(!index || hire.turn >= state.hires[index - 1]!.turn, 'is out of order');
    assert(/^army\.[1-9][0-9]*$/.test(hire.armyId), 'names no company');
  }
}
