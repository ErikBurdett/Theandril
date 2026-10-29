import { z } from 'zod';
import { STRATEGIC_RITES, type StrategicRiteDefinition } from '@theandril/content';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { arcaneSites, controllingSettlement, SITE_RESOURCE_ID } from './arcane-sites';
import { resourceCostBlocker, spendResourceCosts } from './resources';

/** Rules 40: a strategic rite is a working performed from a hearth. The seam
 * warding binds a held Rune seam into a hearth's walls: while it holds and its
 * caster stays lodged, a siege cannot wear the defenses down and sabotage
 * fails. It is paid in ashglass the realm actually drew, lasts a bounded term,
 * and ends with the seam, the caster or the hearth. */
const id = z.string().min(1).max(100);
const turn = z.number().int().min(1).max(1_000_030);
export const MAX_WARDS = 4096;
export const wardSchema = z.object({ settlementId: id, factionId: id, casterId: id, riteId: id, startedTurn: turn, expiresTurn: turn }).strict();
export const wardStateSchema = z.array(wardSchema).max(MAX_WARDS);
export type Ward = z.infer<typeof wardSchema>;
export interface ObservedWard extends Ward { settlementName: string; riteName: string; remainingTurns: number }
export interface RiteOption { characterId: string; riteId: string; name: string; description: string; ashglassCost: number; durationTurns: number; settlementId: string | null; canPerform: boolean; blocker: string | null }
export const riteCommandSchemas = [
  z.object({ type: z.literal('performRite'), factionId: id, characterId: id, riteId: id }).strict(),
] as const;
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byHearth = (a: Ward, b: Ward): number => a.settlementId < b.settlementId ? -1 : a.settlementId > b.settlementId ? 1 : 0;
const rites = new Map(STRATEGIC_RITES.map(rite => [rite.id, rite]));
export const availableRites = (state: GameState): StrategicRiteDefinition[] => STRATEGIC_RITES.filter(rite => rite.sinceRules <= rulesVersion(state));
export const wardOf = (state: GameState, settlementId: string): Ward | undefined => state.wards.find(ward => ward.settlementId === settlementId);
/** A hearth's walls hold while its ward stands; the ward is dissolved at the turn's start when its ground is gone. */
export const isWarded = (state: GameState, settlementId: string): boolean => rulesVersion(state) >= 40 && wardOf(state, settlementId) !== undefined;

/** The hearth a lodged, able caster could work from, or null. */
function lodgedHearth(state: GameState, character: GameState['characters'][string]): string | null {
  if (character.dead || character.woundedTurns || character.mission || character.location?.kind !== 'settlement') return null;
  const town = state.settlements[character.location.settlementId];
  return town && town.factionId === character.factionId ? town.id : null;
}
/** Rules 41: the warded hearth an army-borne caster's company besieges, or null. */
function besiegedWardedHearth(state: GameState, character: GameState['characters'][string]): string | null {
  if (character.dead || character.woundedTurns || character.mission || character.location?.kind !== 'army') return null;
  const armyId = character.location.armyId;
  const siege = Object.values(state.sieges).find(item => item.armyId === armyId && item.factionId === character.factionId);
  return siege && wardOf(state, siege.settlementId) ? siege.settlementId : null;
}
/** The hearth a rite would act on: the caster's lodging for a warding, the besieged hearth for a breaking. */
const riteTarget = (state: GameState, character: GameState['characters'][string], rite: StrategicRiteDefinition): string | null =>
  rite.kind === 'breaking' ? besiegedWardedHearth(state, character) : lodgedHearth(state, character);
/** Whether a hearth's borders hold a surveyed seam of the rite's path. */
function holdsPathSeam(state: GameState, settlementId: string, factionId: string, pathId: string): boolean {
  return arcaneSites(state.world).some(site => site.pathId === pathId && controllingSettlement(state, site.cell, factionId) === settlementId);
}
export function riteObjection(state: GameState, factionId: string, characterId: string, riteId: string): string | null {
  if (rulesVersion(state) < 40) return 'Strategic rites are unavailable under these historical rules.';
  const rite = rites.get(riteId);
  if (!rite || rite.sinceRules > rulesVersion(state)) return 'Unknown strategic rite.';
  const character = state.characters[characterId];
  if (!character || character.factionId !== factionId || character.dead) return 'Choose one of your own living Waykeepers.';
  if (character.definitionId !== 'character.waykeeper') return 'Only a Waykeeper performs a rite.';
  if (state.victory) return 'This campaign has ended in victory.';
  if (state.battle || state.pendingCapture) return 'Resolve the pending battle or capture first.';
  if (!state.arcaneResearch[factionId]?.includes(rite.discoveryId)) return 'The national arcane discovery is not researched.';
  if ((character.aptitudes?.[rite.pathId] ?? 0) < rite.pathLevel) return 'This Waykeeper lacks the personal path for the rite.';
  if (character.woundedTurns) return 'This caster must recover from wounds.';
  if (character.mission) return 'Cancel this caster’s mission first.';
  if (rite.kind === 'breaking') {
    if (character.location?.kind !== 'army') return 'The caster must ride with a company that besieges a warded hearth.';
    const siege = Object.values(state.sieges).find(item => item.armyId === (character.location as { armyId: string }).armyId && item.factionId === factionId);
    if (!siege) return 'This caster’s company is not besieging a hearth.';
    if (!wardOf(state, siege.settlementId)) return 'The besieged hearth is not warded.';
    return resourceCostBlocker(state, factionId, { [SITE_RESOURCE_ID]: rite.ashglassCost });
  }
  const settlementId = lodgedHearth(state, character);
  if (!settlementId) return 'The caster must be lodged in one of your hearths.';
  const town = state.settlements[settlementId]!;
  if (town.occupationTurns) return 'An occupied hearth cannot be warded.';
  if (!holdsPathSeam(state, settlementId, factionId, rite.pathId)) return 'This hearth’s borders hold no surveyed seam of the rite’s path.';
  if (wardOf(state, settlementId)) return 'This hearth is already warded.';
  return resourceCostBlocker(state, factionId, { [SITE_RESOURCE_ID]: rite.ashglassCost });
}
export function performRite(state: GameState, factionId: string, characterId: string, riteId: string): CommandResult {
  const objection = riteObjection(state, factionId, characterId, riteId);
  if (objection) return fail(objection);
  const rite = rites.get(riteId)!, character = state.characters[characterId]!;
  const settlementId = riteTarget(state, character, rite)!, town = state.settlements[settlementId]!;
  spendResourceCosts(state, factionId, { [SITE_RESOURCE_ID]: rite.ashglassCost });
  if (rite.kind === 'breaking') {
    // The ward ends at once and the caster who held it is jarred, so the walls cannot be re-warded until it recovers.
    const ward = wardOf(state, settlementId)!, holder = state.characters[ward.casterId];
    state.wards = state.wards.filter(item => item.settlementId !== settlementId);
    if (holder && !holder.dead) holder.woundedTurns = Math.max(holder.woundedTurns, 2);
    const realm = state.factions.find(item => item.id === factionId)?.name ?? factionId;
    return { ok: true, events: [
      { turn: state.turn, factionId, type: 'rite_performed', cell: town.cell, message: `${character.name} performed ${rite.name} against ${town.name} for ${rite.ashglassCost} ashglass; its ward is broken${holder ? ` and ${holder.name} is jarred for two turns` : ''}.` },
      { turn: state.turn, factionId: ward.factionId, type: 'ward_ended', cell: town.cell, message: `The warding of ${town.name} ended: it was broken by ${character.name} of ${realm}${holder ? `, and ${holder.name} is jarred for two turns` : ''}.` },
    ] };
  }
  state.wards.push({ settlementId, factionId, casterId: characterId, riteId, startedTurn: state.turn, expiresTurn: state.turn + rite.durationTurns });
  state.wards.sort(byHearth);
  const besieger = state.sieges[settlementId]?.factionId;
  const message = `${character.name} performed ${rite.name} at ${town.name} for ${rite.ashglassCost} ashglass; its walls are warded until turn ${state.turn + rite.durationTurns}.`;
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'rite_performed', cell: town.cell, message }, ...(besieger ? [{ turn: state.turn, factionId: besieger, type: 'rite_performed', cell: town.cell, message: `${town.name} is warded: its defenses hold against siege works and sabotage while the ward stands.` }] : [])] };
}
/** Expiry and dissolution, before sieges act on the turn. Bounded by wards, never by tiles. */
export function advanceWards(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 40 || !state.wards.length) return;
  state.wards = state.wards.filter(ward => {
    const town = state.settlements[ward.settlementId], rite = rites.get(ward.riteId), caster = state.characters[ward.casterId];
    const reason = !town ? 'the hearth is gone' : town.factionId !== ward.factionId ? 'the hearth changed hands'
      : state.turn >= ward.expiresTurn ? 'its term ended'
        : !caster || caster.dead ? 'its caster is dead'
          : lodgedHearth(state, caster) !== ward.settlementId ? 'its caster no longer stands lodged there'
            : rite && !holdsPathSeam(state, ward.settlementId, ward.factionId, rite.pathId) ? 'the seam is no longer held' : null;
    if (!reason) return true;
    for (const factionId of new Set([ward.factionId, ...(town ? [town.factionId] : []), ...(town && state.sieges[town.id] ? [state.sieges[town.id]!.factionId] : [])])) {
      events.push({ turn: state.turn, factionId, type: 'ward_ended', ...(town ? { cell: town.cell } : {}), message: `The warding of ${town?.name ?? ward.settlementId} ended: ${reason}.` });
    }
    return false;
  });
}
/** Owned wards in full; a besieger sees that the walls it faces are warded through the siege. */
export function observeWards(state: GameState, factionId: string): ObservedWard[] {
  if (rulesVersion(state) < 40) return [];
  return state.wards.filter(ward => ward.factionId === factionId).map(ward => ({ ...ward, settlementName: state.settlements[ward.settlementId]?.name ?? ward.settlementId, riteName: rites.get(ward.riteId)?.name ?? ward.riteId, remainingTurns: Math.max(0, ward.expiresTurn - state.turn) }));
}
export function observeRites(state: GameState, factionId: string): RiteOption[] {
  if (rulesVersion(state) < 40) return [];
  const casters = Object.values(state.characters).filter(item => item.factionId === factionId && !item.dead && item.definitionId === 'character.waykeeper').sort((a, b) => a.id < b.id ? -1 : 1);
  return casters.flatMap(character => availableRites(state).map(rite => {
    const blocker = riteObjection(state, factionId, character.id, rite.id);
    return { characterId: character.id, riteId: rite.id, name: rite.name, description: rite.description, ashglassCost: rite.ashglassCost, durationTurns: rite.durationTurns, settlementId: riteTarget(state, character, rite), canPerform: blocker === null, blocker };
  }));
}
export const hasWards = (state: GameState): boolean => (state.wards?.length ?? 0) > 0;
export function assertNoWards(state: GameState): void {
  if (hasWards(state)) throw new Error('This campaign has warded hearths unavailable in historical rules.');
}
export function validateWards(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: ward ' + message); };
  const seen = new Set<string>();
  state.wards.forEach((ward, index) => {
    assert(index === 0 || byHearth(state.wards[index - 1]!, ward) < 0, 'records must be ordered by hearth without repeats');
    assert(!seen.has(ward.settlementId), 'binds one hearth twice'); seen.add(ward.settlementId);
    const town = state.settlements[ward.settlementId], caster = state.characters[ward.casterId], rite = rites.get(ward.riteId);
    assert(town && town.factionId === ward.factionId, 'names a hearth the realm does not hold');
    assert(caster && caster.factionId === ward.factionId && !caster.dead && caster.location?.kind === 'settlement' && caster.location.settlementId === ward.settlementId, 'names a caster not lodged in its hearth');
    assert(rite && rite.sinceRules <= rulesVersion(state) && ward.startedTurn <= state.turn && ward.expiresTurn === ward.startedTurn + rite.durationTurns && ward.expiresTurn > state.turn, 'has an invalid rite or term');
  });
}
