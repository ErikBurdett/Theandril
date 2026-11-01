import type { DomainEvent, GameState } from './types';
import { rulesVersion } from './rules';
import { indexes } from './visibility';

/** Rules 81: salvage from the ruins. The ruins of a razed hearth hold one
 * salvage: at the turn's end the realm whose company stands on them takes
 * twenty coin and ten knowledge, once, and the ruin records who took it. Two
 * realms standing there together yield to the earlier id. Resettling the
 * ruins removes them as before. One optional field on the ruin; canonical
 * from save 81. */
export const SALVAGE_COIN = 20;
export const SALVAGE_KNOWLEDGE = 10;
export const hasSalvage = (state: GameState): boolean => Object.values(state.ruins).some(ruin => ruin.salvagedByFactionId);
export function assertNoSalvage(state: GameState): void {
  if (hasSalvage(state)) throw new Error('This campaign has salvaged ruins unavailable in historical rules.');
}
export function validateSalvage(state: GameState): void {
  for (const ruin of Object.values(state.ruins)) {
    if (ruin.salvagedByFactionId !== undefined && !state.factions.some(faction => faction.id === ruin.salvagedByFactionId)) throw new Error('Invalid save: salvage names an unknown realm');
  }
}
/** The turn's salvage, by ruin id. */
export function advanceSalvage(state: GameState, events: DomainEvent[]): void {
  if (rulesVersion(state) < 81) return;
  for (const ruin of Object.values(state.ruins).sort((a, b) => a.id < b.id ? -1 : 1)) {
    if (ruin.salvagedByFactionId) continue;
    const standing = [...(indexes(state).armies.get(ruin.cell) ?? [])].map(id => state.armies[id]).filter(army => army !== undefined).sort((a, b) => a.factionId < b.factionId ? -1 : a.factionId > b.factionId ? 1 : a.id < b.id ? -1 : 1);
    const army = standing[0];
    if (!army) continue;
    const faction = state.factions.find(item => item.id === army.factionId);
    if (!faction) continue;
    faction.treasury += SALVAGE_COIN; faction.knowledge += SALVAGE_KNOWLEDGE;
    ruin.salvagedByFactionId = faction.id;
    events.push({ turn: state.turn, factionId: faction.id, type: 'ruin_salvaged', cell: ruin.cell, message: `${army.name} picks over the ruins of ${ruin.name}: ${SALVAGE_COIN} coin and ${SALVAGE_KNOWLEDGE} knowledge for the realm, and nothing left for the next.` });
  }
}
