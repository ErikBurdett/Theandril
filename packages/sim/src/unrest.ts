import { z } from 'zod';
import type { DomainEvent, GameState, Settlement } from './types';
import { rulesVersion } from './rules';
import { taxRateOf } from './taxes';

/** Rules 71: unrest in the hearths. Each turn a hearth is not besieged its
 * unrest rises three under heavy taxes, two while it is occupied and one
 * while its devastation stands at fifty or more, and falls one otherwise,
 * two more under lean taxes. At fifty the hearth's industry is halved; at a
 * hundred it riots: one person leaves, the lanes take ten devastation and
 * the unrest falls back to fifty. One record for each hearth with unrest,
 * by hearth; canonical from save 71. */
const id = z.string().min(1).max(100);
export const unrestRecordSchema = z.object({ settlementId: id, level: z.number().int().min(1).max(100) }).strict();
export const unrestStateSchema = z.array(unrestRecordSchema).max(8192);
export type UnrestRecord = z.infer<typeof unrestRecordSchema>;
export interface ObservedUnrest { settlementId: string; level: number; pressures: string[]; halved: boolean }
export const UNREST_HALVING = 50;
export const UNREST_RIOT = 100;
export const RIOT_DEVASTATION = 10;

export const emptyUnrest = (): UnrestRecord[] => [];
export const hasUnrest = (state: GameState): boolean => (state.unrest?.length ?? 0) > 0;
export function assertNoUnrest(state: GameState): void {
  if (hasUnrest(state)) throw new Error('This campaign has unrest unavailable in historical rules.');
}
export const unrestOf = (state: GameState, settlementId: string): number => rulesVersion(state) >= 71 ? state.unrest.find(item => item.settlementId === settlementId)?.level ?? 0 : 0;
/** Whether the hearth's industry is halved by unrest. */
export const unrestHalvesIndustry = (state: GameState, settlementId: string): boolean => unrestOf(state, settlementId) >= UNREST_HALVING;
/** The pressures on a hearth this turn and their sum, positive or negative. */
export function unrestPressures(state: GameState, town: Settlement): { change: number; pressures: string[] } {
  const rate = taxRateOf(state, town.factionId), pressures: string[] = [];
  let change = 0;
  if (rate === 'heavy') { change += 3; pressures.push('heavy taxes'); }
  if (town.occupationTurns > 0) { change += 2; pressures.push('occupation'); }
  if (town.devastation >= 50) { change += 1; pressures.push('devastation'); }
  if (!pressures.length) { change -= 1; if (rate === 'lean') { change -= 2; pressures.push('lean taxes ease the lanes'); } }
  else if (rate === 'lean') { change -= 2; pressures.push('lean taxes ease the lanes'); }
  return { change, pressures };
}
function setUnrest(state: GameState, settlementId: string, level: number): void {
  const rest = state.unrest.filter(item => item.settlementId !== settlementId);
  state.unrest = level > 0 ? [...rest, { settlementId, level }].sort((a, b) => a.settlementId < b.settlementId ? -1 : 1) : rest;
}
/** The turn's unrest for one hearth, after its lanes have mended; a besieged hearth stands still. */
export function advanceUnrest(state: GameState, town: Settlement, events: DomainEvent[]): void {
  if (rulesVersion(state) < 71 || state.sieges[town.id]) return;
  const { change } = unrestPressures(state, town);
  let level = Math.max(0, Math.min(UNREST_RIOT, unrestOf(state, town.id) + change));
  if (level >= UNREST_RIOT) {
    const left = town.population > 1 ? 1 : 0;
    town.population -= left; town.devastation = Math.min(100, town.devastation + RIOT_DEVASTATION);
    level = UNREST_HALVING;
    events.push({ turn: state.turn, factionId: town.factionId, type: 'riot', cell: town.cell, message: `${town.name} riots: ${left ? 'a household leaves, ' : ''}the lanes take ${RIOT_DEVASTATION} devastation and the unrest falls to ${UNREST_HALVING}.` });
  }
  setUnrest(state, town.id, level);
}
export function observeUnrest(state: GameState, factionId: string): ObservedUnrest[] | undefined {
  if (rulesVersion(state) < 71) return undefined;
  return Object.values(state.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1).map(town => ({ settlementId: town.id, level: unrestOf(state, town.id), pressures: unrestPressures(state, town).pressures, halved: unrestHalvesIndustry(state, town.id) }));
}
export function validateUnrest(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: unrest ' + message); };
  for (const [index, item] of state.unrest.entries()) {
    assert(state.settlements[item.settlementId], 'names an unknown hearth');
    assert(!index || item.settlementId > state.unrest[index - 1]!.settlementId, 'is out of order or repeated');
  }
}
