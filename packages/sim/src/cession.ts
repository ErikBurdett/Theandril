import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { indexes, updateSight } from './visibility';
import { handleLandCapture } from './territory';
import { charactersLodgedIn } from './characters';

/** Rules 39: a hearth may pass between a patron and its client without a war.
 * The oath is the only permission; nothing is paid, and the hearth keeps its
 * people, buildings and land. Everything standing on it must leave first, so
 * no army or officer is ever found inside another realm's walls. */
const id = z.string().min(1).max(100);
export const cessionCommandSchemas = [
  z.object({ type: z.literal('cedeSettlement'), factionId: id, settlementId: id, recipientFactionId: id }).strict(),
] as const;
export interface CessionOption { factionId: string; name: string; relation: 'patron' | 'client'; blocker: string | null }
const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });

/** The realms bound to this one by an oath, each with whether a hearth may pass to it. */
export function cessionOptions(state: GameState, factionId: string, settlementId: string): CessionOption[] {
  if (rulesVersion(state) < 39) return [];
  const bound: { id: string; relation: 'patron' | 'client' }[] = [];
  for (const bond of state.diplomacy.clients) {
    if (bond.patronId === factionId) bound.push({ id: bond.clientId, relation: 'client' });
    else if (bond.clientId === factionId) bound.push({ id: bond.patronId, relation: 'patron' });
  }
  return bound.sort((a, b) => a.id < b.id ? -1 : 1)
    .map(({ id: recipientId, relation }) => ({ factionId: recipientId, name: state.factions.find(faction => faction.id === recipientId)?.name ?? recipientId, relation, blocker: cessionObjection(state, factionId, settlementId, recipientId) }));
}

export function cessionObjection(state: GameState, factionId: string, settlementId: string, recipientFactionId: string): string | null {
  if (rulesVersion(state) < 39) return 'Cession is unavailable under these historical rules.';
  const town = state.settlements[settlementId];
  if (!town || town.factionId !== factionId) return 'You do not control that settlement.';
  if (state.victory) return 'This campaign has ended in victory.';
  if (state.battle || state.pendingCapture) return 'Resolve the pending battle or capture first.';
  if (!state.factions.some(faction => faction.id === recipientFactionId) || recipientFactionId === factionId) return 'Choose a realm bound to you by an oath.';
  if (!state.diplomacy.clients.some(bond => (bond.patronId === factionId && bond.clientId === recipientFactionId) || (bond.clientId === factionId && bond.patronId === recipientFactionId))) return 'A hearth passes only between a patron and its client.';
  if (state.land.capitals[factionId] === settlementId) return 'A realm keeps its capital.';
  if (state.sieges[settlementId]) return 'A besieged hearth cannot change hands.';
  if (town.occupationTurns) return 'An occupied hearth cannot change hands.';
  if (state.projects.some(project => project.settlementId === settlementId && project.factionId === factionId && (project.status === 'active' || project.status === 'paused'))) return 'A hearth hosting your victory project cannot be ceded.';
  if (charactersLodgedIn(state, settlementId)) return 'Officers lodged in the hearth must leave first.';
  if (indexes(state).armies.get(town.cell)?.size) return 'Armies must leave the hearth before it changes hands.';
  return null;
}

export function cedeSettlement(state: GameState, factionId: string, settlementId: string, recipientFactionId: string, emitted: DomainEvent[]): CommandResult {
  const objection = cessionObjection(state, factionId, settlementId, recipientFactionId);
  if (objection) return fail(objection);
  const town = state.settlements[settlementId]!;
  const giver = state.factions.find(faction => faction.id === factionId)!, recipient = state.factions.find(faction => faction.id === recipientFactionId)!;
  const oldName = town.name;
  updateSight(state, town.factionId, town.cell, 3, -1);
  town.factionId = recipientFactionId;
  town.queue = [];
  const usedNames = new Set(Object.values(state.settlements).filter(other => other.id !== town.id && other.factionId === town.factionId).map(other => other.name));
  let suffix = 0;
  while (usedNames.has(town.name)) { const ending = ` #${town.id.slice(11)}.${++suffix}`; town.name = oldName.slice(0, 40 - ending.length) + ending; }
  updateSight(state, town.factionId, town.cell, 3, 1);
  // Standing orders of the old realm end with its rule; the land, its workers and policies follow the capture path.
  for (const charter of state.charters.filter(item => item.settlementId === settlementId)) emitted.push({ turn: state.turn, factionId: charter.factionId, type: 'charter_lost', cell: town.cell, message: `${oldName} left the realm; its charter ended.` });
  state.charters = state.charters.filter(item => item.settlementId !== settlementId);
  state.musters = state.musters.filter(item => item.settlementId !== settlementId);
  handleLandCapture(state, settlementId, factionId, emitted);
  return { ok: true, events: [factionId, recipientFactionId].map(owner => ({ turn: state.turn, factionId: owner, type: 'settlement_ceded', cell: town.cell, message: `${oldName} passed from ${giver.name} to ${recipient.name} under their oath. Its people, buildings and land are kept; production orders are cancelled.` })) };
}
