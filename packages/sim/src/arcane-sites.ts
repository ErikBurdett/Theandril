import { z } from 'zod';
import { MAGIC_PATHS } from '@theandril/content';
import { hexDistance, isPassable, naturalFeatures, SeededRandom } from '@theandril/mapgen';
import type { CommandResult, GameState } from './types';
import { rulesVersion } from './rules';

type World = GameState['world'];

/** Rules 23: the Ashfall left arcane seams in a few places. Where they lie is a
 * property of the world, derived from its seed like any other geography, so a
 * save records only which realms have paid to survey them. Holding a surveyed
 * seam inside your borders yields ashglass and is what lets a realm study
 * Arcane Theory at all. */
const id = z.string().min(1).max(100);
export const SITE_SEARCH_COIN = 24;
export const SITE_SEARCH_RADIUS = 2;
export const SITE_EXTRACTION = 2;
export const SITE_RESOURCE_ID = 'resource.ashglass';
export const MAX_ARCANE_SITES = 64;
/** The Ashfall glass bit from the natural-feature table. */
export const GLASS_SHARDS = 64;

export interface ArcaneSite { id: string; cell: number; pathId: string }
export interface ObservedArcaneSite extends ArcaneSite { pathName: string; settlementId: string | null; controlled: boolean }
export const arcaneSurveySchema = z.array(z.object({
  factionId: id, cells: z.array(z.number().int().min(0).max(349_999)).max(MAX_ARCANE_SITES),
}).strict()).max(64);
export type ArcaneSurveyState = Record<string, number[]>;

export const arcaneSiteCommandSchemas = [
  z.object({ type: z.literal('searchArcane'), factionId: id, armyId: id }).strict(),
] as const;

const fail = (error: string): CommandResult => ({ ok: false, error, events: [] });
const pathName = (pathId: string): string => MAGIC_PATHS.find(path => path.id === pathId)?.name ?? pathId;

/** Seams are the same for every reader of a world, so they are computed once per
 * world and kept beside it rather than stored in, or seen through, any realm. */
const cache = new WeakMap<World, ArcaneSite[]>();
export function arcaneSites(world: World): ArcaneSite[] {
  const known = cache.get(world);
  if (known) return known;
  const { width, terrain, starts } = world;
  const picker = new SeededRandom(world.seed ^ 0x53454150);
  // Seams lie under Ashfall glass, so a realm can see where it is worth surveying
  // without being told where the seams themselves are.
  const passable: number[] = [];
  for (let cell = 0; cell < terrain.length; cell++) {
    if (!isPassable(terrain[cell] ?? 0)) continue;
    if ((naturalFeatures(world, cell) & GLASS_SHARDS) === GLASS_SHARDS) passable.push(cell);
  }
  const wanted = Math.max(3, Math.min(MAX_ARCANE_SITES, Math.round(passable.length / 12)));
  const chosen: number[] = [];
  const far = (cell: number, others: readonly number[], distance: number): boolean =>
    others.every(other => hexDistance(cell, other, width) >= distance);
  for (let attempt = 0; attempt < passable.length * 4 && chosen.length < wanted; attempt++) {
    const cell = passable[picker.nextInt(passable.length)]!;
    if (chosen.includes(cell) || !far(cell, starts, 4) || !far(cell, chosen, 6)) continue;
    chosen.push(cell);
  }
  const sites = chosen.sort((a, b) => a - b).map((cell, index) => ({
    id: `site.${index + 1}`, cell, pathId: MAGIC_PATHS[index % MAGIC_PATHS.length]!.id,
  }));
  cache.set(world, sites);
  return sites;
}

export const emptyArcaneSurveys = (factionIds: readonly string[]): ArcaneSurveyState =>
  Object.fromEntries(factionIds.map(factionId => [factionId, [] as number[]]));
export const surveyed = (state: GameState, factionId: string, cell: number): boolean =>
  (state.arcaneSurveys[factionId] ?? []).includes(cell);

/** A seam counts as held when a realm that has surveyed it also owns the hearth
 * whose borders contain it. Conquering that hearth takes the seam with it. */
export function controllingSettlement(state: GameState, cell: number, factionId: string): string | null {
  if (!surveyed(state, factionId, cell)) return null;
  for (const [settlementId, land] of Object.entries(state.land.settlements)) {
    if (state.settlements[settlementId]?.factionId !== factionId) continue;
    if (land.claimed.includes(cell)) return settlementId;
  }
  return null;
}
export const holdsArcaneSite = (state: GameState, factionId: string): boolean =>
  rulesVersion(state) >= 23 && arcaneSites(state.world).some(site => controllingSettlement(state, site.cell, factionId) !== null);

/** Ashglass drawn from every held seam, added to the hearth's ordinary yield. */
export function settlementSiteYield(state: GameState, settlementId: string): number {
  if (rulesVersion(state) < 23) return 0;
  const town = state.settlements[settlementId];
  const land = state.land.settlements[settlementId];
  if (!town || !land || state.sieges[settlementId] || town.occupationTurns) return 0;
  let output = 0;
  for (const site of arcaneSites(state.world)) if (surveyed(state, town.factionId, site.cell) && land.claimed.includes(site.cell)) output += SITE_EXTRACTION;
  return output;
}

export function searchObjection(state: GameState, factionId: string, armyId: string): string | null {
  if (rulesVersion(state) < 23) return 'Arcane surveys are unavailable under historical rules.';
  const army = state.armies[armyId];
  const faction = state.factions.find(item => item.id === factionId);
  if (!army || !faction || army.factionId !== factionId) return 'Choose one of your own companies.';
  if (state.battle || state.pendingCapture || state.victory) return 'Resolve the current battle or capture before surveying.';
  if (!army.movement) return 'This company has already spent its movement this turn.';
  if (faction.treasury < SITE_SEARCH_COIN) return `An arcane survey costs ${SITE_SEARCH_COIN} coin.`;
  return null;
}

export function searchArcane(state: GameState, factionId: string, armyId: string): CommandResult {
  const objection = searchObjection(state, factionId, armyId);
  if (objection) return fail(objection);
  const army = state.armies[armyId]!;
  const faction = state.factions.find(item => item.id === factionId)!;
  faction.treasury -= SITE_SEARCH_COIN;
  army.movement = 0;
  const found = arcaneSites(state.world).filter(site => !surveyed(state, factionId, site.cell)
    && hexDistance(site.cell, army.cell, state.world.width) <= SITE_SEARCH_RADIUS);
  const record = state.arcaneSurveys[factionId] ?? (state.arcaneSurveys[factionId] = []);
  for (const site of found) record.push(site.cell);
  record.sort((a, b) => a - b);
  return { ok: true, events: [{
    turn: state.turn, factionId, type: found.length ? 'arcane_site_found' : 'arcane_survey_empty', cell: army.cell,
    message: found.length
      ? `${army.name} surveyed the ground and found ${found.map(site => `a ${pathName(site.pathId).toLowerCase()} seam`).join(' and ')} for ${SITE_SEARCH_COIN} coin. Claim it to draw ashglass and to study Arcane Theory.`
      : `${army.name} surveyed the ground for ${SITE_SEARCH_COIN} coin and found no arcane seam here.`,
  }] };
}

/** Only seams this realm has actually surveyed, with whether it holds them. */
export function observeArcaneSites(state: GameState, factionId: string): ObservedArcaneSite[] {
  if (rulesVersion(state) < 23) return [];
  return arcaneSites(state.world).filter(site => surveyed(state, factionId, site.cell)).map(site => {
    const settlementId = controllingSettlement(state, site.cell, factionId);
    return { ...site, pathName: pathName(site.pathId), settlementId, controlled: settlementId !== null };
  });
}

export const hasArcaneSurveys = (state: GameState): boolean => Object.values(state.arcaneSurveys).some(cells => cells.length);

export function validateArcaneSurveys(state: GameState): void {
  const assert = (condition: unknown, message: string): void => { if (!condition) throw new Error('Invalid save: arcane survey ' + message); };
  const factions = new Set(state.factions.map(faction => faction.id));
  // A realm that never surveyed keeps an empty record; an unknown owner is a forgery.
  assert(Object.keys(state.arcaneSurveys).every(factionId => factions.has(factionId)), 'names a realm this campaign does not seat');
  const seams = new Set(arcaneSites(state.world).map(site => site.cell));
  for (const cells of Object.values(state.arcaneSurveys)) {
    assert(cells.length <= seams.size, 'records more seams than this world holds');
    assert(cells.every((cell, index) => (!index || cells[index - 1]! < cell) && seams.has(cell)), 'must list this world’s seams in order, without repeats');
  }
}
