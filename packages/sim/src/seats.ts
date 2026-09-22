import { CITY_STATES, FACTIONS, variantFactionColor } from '@theandril/content';

/** Independent single-city powers. They borrow a major culture's art and roster
 * but keep their own name and colour, so their identity lives in the seat ID. */
export const isCityState = (factionId: string): boolean => factionId.startsWith('citystate.');
export const cityStateColor = (id: string): number | undefined => CITY_STATES.find(item => item.id === id)?.color;

/** Every colour a seat may legally carry. A first seat of a culture always flies
 * that culture's colour; a repeated seat flies its own rules-21 variant colour,
 * except in a historical campaign, which repeats the culture's colour instead.
 * Rules are ambient rather than saved, so both remain legal for a repeated seat. */
export function legalFactionColors(faction: { id: string; definitionId: string }): readonly number[] {
  const definition = FACTIONS.find(item => item.id === faction.definitionId);
  if (!definition) return [];
  if (isCityState(faction.id)) { const color = cityStateColor(faction.id); return color === undefined ? [] : [color]; }
  if (faction.id === faction.definitionId) return [definition.color];
  const prefix = faction.definitionId + '.';
  const variant = faction.id.startsWith(prefix) ? Number(faction.id.slice(prefix.length)) : Number.NaN;
  return Number.isSafeInteger(variant) && variant > 0 ? [definition.color, variantFactionColor(definition.color, variant)] : [definition.color];
}
