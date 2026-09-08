import type { Observation } from '@theandril/sim';

export interface MapActionKnowledge { visible: boolean; factionId?: string | null; settlementId?: string | null }
export interface MapActionChoice {
  id: string;
  kind: 'army' | 'settlement' | 'tile';
  label: string;
  summary?: string;
  selection: { cell: number; armyId?: string; settlementId?: string };
}

/** Inspection choices only. Current simulation quotes still decide every order.
 * The live UI supplies renderer knowledge because its compact observation has no cells.
 */
export function getMapActionChoices(view: Observation, cell: number, selectedSettlementId?: string, knowledge?: MapActionKnowledge): MapActionChoice[] {
  if (!Number.isSafeInteger(cell) || cell < 0 || cell >= view.width * view.height) return [];
  const known = knowledge ?? view.cells.find(item => item.cell === cell);
  const choices: MapActionChoice[] = view.armies
    .filter(army => army.cell === cell && army.factionId === view.factionId && !army.carrierId)
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    .map(army => ({ id: army.id, kind: 'army', label: army.name,
      summary: `${army.domain === 'naval' ? 'Fleet' : 'Army'} · ${army.formations.length} formations`, selection: { cell, armyId: army.id } }));
  const ownTowns = view.settlements.filter(town => town.factionId === view.factionId);
  const actualTown = ownTowns.find(town => town.cell === cell);
  const claim = view.land.settlements.find(town => town.claimed.includes(cell));
  const claimTown = claim && ownTowns.find(town => town.id === claim.settlementId);
  const manager = actualTown ?? claimTown;
  if (manager) choices.push({ id: manager.id, kind: 'settlement', label: manager.name,
    summary: actualTown ? 'Settlement management' : 'Manages this claimed tile', selection: { cell, settlementId: manager.id } });

  const foreignTown = view.settlements.some(town => town.cell === cell && town.factionId !== view.factionId);
  const foreignClaim = Boolean(known?.factionId && known.factionId !== view.factionId)
    || Boolean(known?.settlementId && !ownTowns.some(town => town.id === known.settlementId));
  // Do not turn remembered/foreign/uncharted land into an own-town action target.
  // Selecting visible unclaimed terrain only opens the town's authoritative quote.
  const expansionTown = !manager && known?.visible && !foreignTown && !foreignClaim && !known.settlementId && !known.factionId
    ? ownTowns.find(town => town.id === selectedSettlementId) : undefined;
  const tileTown = manager ?? expansionTown;
  choices.push({ id: `tile.${cell}`, kind: 'tile', label: `Hex ${cell}`,
    summary: tileTown ? `Land review · ${tileTown.name}` : foreignTown || foreignClaim ? 'Foreign land · read-only'
      : known ? `${known.visible ? 'Terrain' : 'Last known terrain'} · read-only` : 'Uncharted terrain · read-only',
    selection: { cell, ...(tileTown ? { settlementId: tileTown.id } : {}) } });
  return choices;
}
