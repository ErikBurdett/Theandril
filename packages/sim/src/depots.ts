import { hexDistance } from '@theandril/mapgen';
import { z } from 'zod';
import type { CommandResult, DomainEvent, GameState } from './types';
import { indexes } from './visibility';
import { atWar } from './warfare';
import { rulesVersion } from './rules';

/** Rules 28: a realm can build its reach instead of only conquering it. A company
 * spends its movement and coin to raise a depot where it stands; the depot feeds
 * the ground around it as a hearth does, but less far. Depots cost upkeep every
 * turn, must stand apart from one another, and are pulled down by any enemy that
 * walks onto them — so a supply network is a thing to defend, not a free map. */
const id = z.string().min(1).max(100);
const cell = z.number().int().min(0).max(349_999);
const turn = z.number().int().min(1).max(1_000_030);
export const DEPOT_COIN = 40;
export const DEPOT_UPKEEP = 2;
/** Half-steps a depot feeds: two hexes of open country, or four along a road. */
export const DEPOT_BUDGET = 4;
/** Depots stand apart, so reach is a network of posts rather than a carpet. */
export const DEPOT_SPACING = 3;
export const MAX_REALM_DEPOTS = 32;
export const MAX_DEPOTS = 1024;

export interface Depot { cell: number; factionId: string; foundedTurn: number }
export const depotSchema = z.object({ cell, factionId: id, foundedTurn: turn }).strict() satisfies z.ZodType<Depot>;
export const depotStateSchema = z.array(depotSchema).max(MAX_DEPOTS);
export const depotCommandSchemas = [
  z.object({ type: z.literal('buildDepot'), factionId: id, armyId: id }).strict(),
] as const;
/** Rules 29: a realm may pull down its own depot and stop paying for it. */
export const depotAbandonSchemas = [
  z.object({ type: z.literal('abandonDepot'), factionId: id, cell }).strict(),
] as const;

const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const byCell = (a: Depot, b: Depot): number => a.cell - b.cell;
export const depotsOf = (state: GameState, factionId: string): Depot[] => state.depots.filter(depot => depot.factionId === factionId);

/** Every reason a depot cannot be raised, in the order a player meets them. */
export function depotObjection(state: GameState, factionId: string, armyId: string): string | null {
  if (rulesVersion(state) < 28) return 'Depots are unavailable under historical rules.';
  const army = state.armies[armyId];
  const faction = state.factions.find(item => item.id === factionId);
  if (!army || !faction || army.factionId !== factionId) return 'Choose one of your own companies.';
  if (state.battle || state.pendingCapture || state.victory) return 'Resolve the current battle or capture before building.';
  if (state.transports[armyId]) return 'An embarked army cannot build; put it ashore first.';
  if (!army.movement) return 'This company has already spent its movement this turn.';
  if (faction.treasury < DEPOT_COIN) return `A depot costs ${DEPOT_COIN} coin.`;
  if (indexes(state).settlements.has(army.cell)) return 'A hearth already supplies this ground.';
  if (state.depots.some(depot => depot.cell === army.cell)) return 'A depot already stands here.';
  const claimant = Object.entries(state.land.settlements).find(([settlementId, land]) =>
    land.claimed.includes(army.cell) && state.settlements[settlementId]?.factionId !== factionId);
  if (claimant) return 'This ground is claimed by another realm.';
  const crowded = state.depots.find(depot => depot.factionId === factionId && hexDistance(depot.cell, army.cell, state.world.width) < DEPOT_SPACING);
  if (crowded) return `Depots of one realm stand at least ${DEPOT_SPACING} hexes apart; the nearest is at hex ${crowded.cell}.`;
  if (depotsOf(state, factionId).length >= MAX_REALM_DEPOTS) return `A realm may keep ${MAX_REALM_DEPOTS} depots.`;
  if (state.depots.length >= MAX_DEPOTS) return 'The world holds as many depots as it may.';
  return null;
}

export function buildDepot(state: GameState, factionId: string, armyId: string): CommandResult {
  const objection = depotObjection(state, factionId, armyId);
  if (objection) return fail(objection);
  const army = state.armies[armyId]!;
  const faction = state.factions.find(item => item.id === factionId)!;
  faction.treasury -= DEPOT_COIN;
  army.movement = 0;
  state.depots.push({ cell: army.cell, factionId, foundedTurn: state.turn });
  state.depots.sort(byCell);
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'depot_built', cell: army.cell,
    message: `${army.name} raised a depot for ${DEPOT_COIN} coin. It feeds the ground around it and costs ${DEPOT_UPKEEP} coin a turn.` }] };
}

export function abandonDepot(state: GameState, factionId: string, target: number): CommandResult {
  if (rulesVersion(state) < 29) return fail('Depots cannot be pulled down under historical rules.');
  const index = state.depots.findIndex(depot => depot.cell === target && depot.factionId === factionId);
  if (index < 0) return fail('You hold no depot on that hex.');
  state.depots.splice(index, 1);
  return { ok: true, events: [{ turn: state.turn, factionId, type: 'depot_abandoned', cell: target,
    message: `The depot at hex ${target} was pulled down. Its ${DEPOT_UPKEEP} coin a turn is yours again, and the ground it fed is out of supply.` }] };
}

/** A depot an enemy walks onto is pulled down. Bounded by the world's depots. */
export function advanceDepots(state: GameState, emitted: DomainEvent[]): void {
  if (rulesVersion(state) < 28 || !state.depots.length) return;
  const index = indexes(state);
  state.depots = state.depots.filter(depot => {
    const raider = [...(index.armies.get(depot.cell) ?? [])].sort()
      .map(armyId => state.armies[armyId]).find(army => army && army.factionId !== depot.factionId && atWar(state, depot.factionId, army.factionId));
    if (!raider) return true;
    emitted.push({ turn: state.turn, factionId: depot.factionId, type: 'depot_razed', cell: depot.cell,
      message: `${raider.name} pulled down the depot at hex ${depot.cell}. The ground it fed is out of supply.` });
    emitted.push({ turn: state.turn, factionId: raider.factionId, type: 'depot_razed', cell: depot.cell,
      message: `${raider.name} pulled down an enemy depot at hex ${depot.cell}.` });
    return false;
  });
}

export const depotUpkeep = (state: GameState, factionId: string): number =>
  rulesVersion(state) < 28 ? 0 : depotsOf(state, factionId).length * DEPOT_UPKEEP;

export function validateDepots(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: depot ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  const cells = state.world.width * state.world.height;
  assert(state.depots.every((depot, index) => !index || byCell(state.depots[index - 1]!, depot) < 0), 'records must be unique and canonically ordered');
  for (const depot of state.depots) {
    assert(factions.has(depot.factionId), 'names a realm that does not exist');
    assert(depot.cell < cells, 'names a hex outside the world');
    assert(depot.foundedTurn <= state.turn, 'was founded after the current turn');
  }
}
