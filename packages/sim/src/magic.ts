import { z } from 'zod';
import { ARCANE_DISCOVERIES, BATTLE_SPELLS, MAGIC_PATHS } from '@theandril/content';
import type { CommandResult, GameState } from './types';
import { rulesVersion } from './rules';
import { holdsArcaneSite } from './arcane-sites';

const id = z.string().min(1).max(100).regex(/^[a-z][a-z0-9_.-]*$/);
export const personalAptitudesSchema = z.record(id, z.number().int().min(1).max(3));
export const arcaneResearchSchema = z.array(z.object({ factionId: id, discoveries: z.array(id).max(16) }).strict()).min(1).max(48);
export type ArcaneResearchState = Record<string, string[]>;
export interface ArcaneResearchOption {
  id: string; name: string; description: string; knowledgeCost: number; researched: boolean;
  canResearch: boolean; blocker: string | null; spellIds: string[];
  casters: { characterId: string; name: string; canCast: boolean; blocker: string | null }[];
}
export interface ArcaneResearchObservation { discoveries: string[]; choices: ArcaneResearchOption[] }
export const emptyArcaneResearch = (factionIds: readonly string[]): ArcaneResearchState => Object.fromEntries(factionIds.map(id => [id, []]));
export function characterSpellIds(aptitudes: Readonly<Record<string, number>> | undefined, discoveries: readonly string[]): string[] {
  return BATTLE_SPELLS.filter(spell => discoveries.includes(spell.discoveryId) && (aptitudes?.[spell.pathId] ?? 0) >= spell.pathLevel).map(spell => spell.id).sort();
}
function researchObjection(state: GameState, factionId: string, discoveryId: string): string | null {
  if (rulesVersion(state) < 14) return 'Arcane Theory is unavailable under historical rules.';
  const definition = ARCANE_DISCOVERIES.find(item => item.id === discoveryId);
  const faction = state.factions.find(item => item.id === factionId);
  if (!definition || !faction) return 'Unknown arcane discovery.';
  if (state.arcaneResearch[factionId]?.includes(discoveryId)) return 'This arcane discovery is already researched.';
  if (state.battle || state.pendingCapture || state.victory) return 'Resolve the current battle or capture before researching.';
  if (!Object.values(state.settlements).some(town => town.factionId === factionId && !town.occupationTurns && !state.sieges[town.id] && town.buildings.includes(definition.requiredBuildingId))) return 'An unoccupied, unbesieged Witness archive is required for Arcane Theory.';
  if (faction.knowledge < definition.knowledgeCost) return 'Not enough knowledge for this arcane discovery.';
  // Rules 23: Arcane Theory is studied from a seam the realm actually holds.
  if (rulesVersion(state) >= 23 && !holdsArcaneSite(state, factionId)) return 'Arcane Theory needs a surveyed arcane seam inside your own borders.';
  return null;
}
export function researchArcane(state: GameState, factionId: string, discoveryId: string): CommandResult {
  const error = researchObjection(state, factionId, discoveryId);
  if (error) return { ok: false, error, events: [] };
  const definition = ARCANE_DISCOVERIES.find(item => item.id === discoveryId)!;
  state.factions.find(item => item.id === factionId)!.knowledge -= definition.knowledgeCost;
  state.arcaneResearch[factionId]!.push(discoveryId); state.arcaneResearch[factionId]!.sort();
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'arcane_researched', message: `${definition.name} was researched for ${definition.knowledgeCost} knowledge. A personally qualified caster is still required.` }] };
}
export function observeArcaneResearch(state: GameState, factionId: string): ArcaneResearchObservation {
  if (rulesVersion(state) < 14) return { discoveries: [], choices: [] };
  const discoveries = [...(state.arcaneResearch[factionId] ?? [])];
  const casters = Object.values(state.characters).filter(item => item.factionId === factionId && !item.dead && item.definitionId === 'character.waykeeper').sort((a, b) => a.id < b.id ? -1 : 1);
  return { discoveries, choices: ARCANE_DISCOVERIES.map(definition => {
    const blocker = researchObjection(state, factionId, definition.id), researched = discoveries.includes(definition.id);
    return { ...definition, spellIds: [...definition.spellIds], researched, canResearch: blocker === null, blocker,
      casters: casters.map(character => {
        const capable = characterSpellIds(character.aptitudes, [definition.id]).length > 0;
        const objection = !capable ? 'The required personal magical path is missing.' : !researched ? 'The national arcane discovery is not researched.' : character.woundedTurns ? 'This caster must recover from wounds.' : character.location?.kind !== 'army' ? 'Attach this caster to an army.' : state.transports[character.location.armyId] ? 'Carried troops cannot cast independently of their fleet.' : null;
        return { characterId: character.id, name: character.name, canCast: objection === null, blocker: objection };
      }) };
  }) };
}
export function validateArcaneResearch(state: GameState): void {
  const expected = state.factions.map(item => item.id).sort(), actual = Object.keys(state.arcaneResearch).sort();
  if (actual.join('|') !== expected.join('|')) throw new Error('Arcane research must cover exactly the campaign factions.');
  for (const discoveries of Object.values(state.arcaneResearch)) if (new Set(discoveries).size !== discoveries.length || discoveries.some((id, i) => !ARCANE_DISCOVERIES.some(item => item.id === id) || i > 0 && id <= discoveries[i - 1]!)) throw new Error('Unknown, duplicate or unordered arcane discovery.');
  for (const character of Object.values(state.characters)) {
    if (character.aptitudes === undefined) { if (character.definitionId === 'character.waykeeper') throw new Error('A Waykeeper requires an explicit personal aptitude profile.'); continue; }
    if (character.definitionId !== 'character.waykeeper' || Object.keys(character.aptitudes).some(id => !MAGIC_PATHS.some(path => path.id === id))) throw new Error('Invalid personal magical aptitude profile.');
    personalAptitudesSchema.parse(character.aptitudes);
  }
}
