import { z } from 'zod';
import type { DomainEvent, GameState, Settlement } from './types';
import { rulesVersion } from './rules';
import { taxRateOf } from './taxes';
import { indexes, updateSight } from './visibility';
import { handleLandCapture } from './territory';
import { captureSettlementCharacters } from './characters';

/** Rules 71: unrest in the hearths. Each turn a hearth is not besieged its
 * unrest rises three under heavy taxes, two while it is occupied and one
 * while its devastation stands at fifty or more, and falls one otherwise,
 * two more under lean taxes. At fifty the hearth's industry is halved; at a
 * hundred it riots: one person leaves, the lanes take ten devastation and
 * the unrest falls back to fifty. One record for each hearth with unrest,
 * by hearth; canonical from save 71.
 *
 * Rules 80: restoration. A hearth held by a realm other than its founder,
 * with no army standing in it, does not riot when its unrest reaches a
 * hundred: the lanes rise for the old banner and the hearth returns to its
 * founder, while the founder still holds a hearth and the hearth is not the
 * holder's capital. It keeps its people, buildings and land as a cession
 * does; the holder's officers lodged there are lost as in a conquest, its
 * standing orders end, the lanes take the riot's ten devastation, the
 * occupation ends and the unrest clears. A garrison holds the hearth and
 * it riots as before. No field, command or content. */
const id = z.string().min(1).max(100);
export const unrestRecordSchema = z.object({ settlementId: id, level: z.number().int().min(1).max(100) }).strict();
export const unrestStateSchema = z.array(unrestRecordSchema).max(8192);
export type UnrestRecord = z.infer<typeof unrestRecordSchema>;
export interface ObservedUnrest { settlementId: string; level: number; pressures: string[]; halved: boolean; rising?: string; garrisoned?: boolean }
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
/** Rules 80: the founder a hearth's lanes may rise for, or null while it is the founder's, the founder holds no hearth or it is the holder's capital. */
export function founderToRiseFor(state: GameState, town: Settlement): GameState['factions'][number] | null {
  if (rulesVersion(state) < 80 || town.founderFactionId === town.factionId) return null;
  const founder = state.factions.find(faction => faction.id === town.founderFactionId);
  if (!founder || !Object.values(state.settlements).some(other => other.factionId === founder.id)) return null;
  if (state.land.capitals[town.factionId] === town.id) return null;
  return founder;
}
/** Whether an army stands in the hearth; a garrison holds it through a riot. */
export const garrisoned = (state: GameState, town: Settlement): boolean => Boolean(indexes(state).armies.get(town.cell)?.size);
/** The founder a hearth would return to if it riots now, or null while an army stands in it. */
export function restorationOf(state: GameState, town: Settlement): GameState['factions'][number] | null {
  const founder = founderToRiseFor(state, town);
  return founder && !garrisoned(state, town) ? founder : null;
}
/** The hearth returns to its founder: the cession's transfer with a conquest's loss of lodged officers. */
function restore(state: GameState, town: Settlement, founder: GameState['factions'][number], events: DomainEvent[]): void {
  const holderId = town.factionId, holder = state.factions.find(faction => faction.id === holderId)!, oldName = town.name;
  captureSettlementCharacters(state, town.id, events);
  for (const pending of state.hearthEvents.pending.filter(item => item.settlementId === town.id)) events.push({ turn: state.turn, factionId: pending.factionId, type: 'hearth_event_lapsed', message: `${pending.templateId} passed: the hearth is no longer the realm's.` });
  state.hearthEvents.pending = state.hearthEvents.pending.filter(item => item.settlementId !== town.id);
  updateSight(state, holderId, town.cell, 3, -1);
  town.factionId = founder.id;
  town.queue = [];
  const usedNames = new Set(Object.values(state.settlements).filter(other => other.id !== town.id && other.factionId === town.factionId).map(other => other.name));
  let suffix = 0;
  while (usedNames.has(town.name)) { const ending = ` #${town.id.slice(11)}.${++suffix}`; town.name = oldName.slice(0, 40 - ending.length) + ending; }
  updateSight(state, town.factionId, town.cell, 3, 1);
  for (const charter of state.charters.filter(item => item.settlementId === town.id)) events.push({ turn: state.turn, factionId: charter.factionId, type: 'charter_lost', cell: town.cell, message: `${oldName} left the realm; its charter ended.` });
  state.charters = state.charters.filter(item => item.settlementId !== town.id);
  state.musters = state.musters.filter(item => item.settlementId !== town.id);
  handleLandCapture(state, town.id, holderId, events);
  town.devastation = Math.min(100, town.devastation + RIOT_DEVASTATION);
  town.occupationTurns = 0;
  setUnrest(state, town.id, 0);
  for (const owner of [holderId, founder.id]) events.push({ turn: state.turn, factionId: owner, type: 'restoration', cell: town.cell, message: `${oldName} rises for ${founder.name}: with no garrison to hold it, the lanes throw out ${holder.name}’s reeves and the hearth returns to the realm that founded it, taking ${RIOT_DEVASTATION} devastation.` });
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
    const founder = restorationOf(state, town);
    if (founder) { restore(state, town, founder, events); return; }
    const left = town.population > 1 ? 1 : 0;
    town.population -= left; town.devastation = Math.min(100, town.devastation + RIOT_DEVASTATION);
    level = UNREST_HALVING;
    events.push({ turn: state.turn, factionId: town.factionId, type: 'riot', cell: town.cell, message: `${town.name} riots: ${left ? 'a household leaves, ' : ''}the lanes take ${RIOT_DEVASTATION} devastation and the unrest falls to ${UNREST_HALVING}.` });
  }
  setUnrest(state, town.id, level);
}
export function observeUnrest(state: GameState, factionId: string): ObservedUnrest[] | undefined {
  if (rulesVersion(state) < 71) return undefined;
  return Object.values(state.settlements).filter(town => town.factionId === factionId).sort((a, b) => a.id < b.id ? -1 : 1).map(town => { const founder = founderToRiseFor(state, town); return { settlementId: town.id, level: unrestOf(state, town.id), pressures: unrestPressures(state, town).pressures, halved: unrestHalvesIndustry(state, town.id), ...(founder ? { rising: founder.name, garrisoned: garrisoned(state, town) } : {}) }; });
}
export function validateUnrest(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: unrest ' + message); };
  for (const [index, item] of state.unrest.entries()) {
    assert(state.settlements[item.settlementId], 'names an unknown hearth');
    assert(!index || item.settlementId > state.unrest[index - 1]!.settlementId, 'is out of order or repeated');
  }
}
