import { landmarkKind, landmarkKindsForRules, type LandmarkKind } from '@theandril/content';
import { hexDistance, isPassable, naturalFeatures, neighbors, SeededRandom, TERRAIN } from '@theandril/mapgen';
import type { GameState } from './types';
import { rulesVersion } from './rules';
import { arcaneSites, GLASS_SHARDS } from './arcane-sites';

type World = GameState['world'];
export interface Landmark { id: string; cell: number; kindId: string }
export interface ObservedLandmark extends Landmark { name: string; description: string; yields: LandmarkKind['yields'] }
export const MAX_LANDMARKS = 24;
/** The newest rules whose landmark catalogue placement may read; placement is read for a rules version so a sealed reading never changes. */
export const LANDMARK_RULES = 57;

/** Landmarks are the same for every reader of a world, computed once per world
 * and kept beside it: on passable land away from the starts, the seams and
 * each other, each of a kind that fits its ground, chosen from the seed. */
const cache = new WeakMap<World, Map<number, { sites: Landmark[]; byCell: Map<number, Landmark> }>>();
function derive(world: World, rules: number): { sites: Landmark[]; byCell: Map<number, Landmark> } {
  const byRules = cache.get(world) ?? new Map<number, { sites: Landmark[]; byCell: Map<number, Landmark> }>();
  cache.set(world, byRules);
  const known = byRules.get(rules);
  if (known) return known;
  const kinds = landmarkKindsForRules(rules);
  const { width, height, terrain, starts } = world;
  const picker = new SeededRandom(world.seed ^ 0x4c414e44);
  const seams = arcaneSites(world).map(site => site.cell);
  const passable: number[] = [];
  for (let cell = 0; cell < terrain.length; cell++) {
    if (!isPassable(terrain[cell] ?? 0) || (naturalFeatures(world, cell) & GLASS_SHARDS) === GLASS_SHARDS) continue;
    passable.push(cell);
  }
  const wanted = Math.max(4, Math.min(MAX_LANDMARKS, Math.round(passable.length / 40)));
  const far = (cell: number, others: readonly number[], distance: number): boolean => others.every(other => hexDistance(cell, other, width) >= distance);
  const coastal = (cell: number): boolean => neighbors(cell, width, height).some(next => terrain[next] === TERRAIN.water);
  const chosen: { cell: number; kind: LandmarkKind }[] = [];
  for (let attempt = 0; attempt < passable.length * 4 && chosen.length < wanted; attempt++) {
    const cell = passable[picker.nextInt(passable.length)]!;
    if (chosen.some(item => item.cell === cell) || !far(cell, starts, 4) || !far(cell, seams, 2) || !far(cell, chosen.map(item => item.cell), 8)) continue;
    const ground = terrain[cell] as 1 | 2 | 3, shore = coastal(cell);
    const fits = kinds.filter(kind => kind.terrains.includes(ground) && (!kind.coastal || shore));
    if (!fits.length) continue;
    chosen.push({ cell, kind: fits[picker.nextInt(fits.length)]! });
  }
  const sites = chosen.sort((a, b) => a.cell - b.cell).map((item, index) => ({ id: `landmark.${index + 1}`, cell: item.cell, kindId: item.kind.id }));
  const result = { sites, byCell: new Map(sites.map(site => [site.cell, site])) };
  byRules.set(rules, result);
  return result;
}
/** The landmarks of a world under a rules version: the catalogue of those rules placed from the seed. */
export const landmarks = (world: World, rules: number = LANDMARK_RULES): Landmark[] => derive(world, rules).sites;
export const landmarkAt = (world: World, cell: number, rules: number = LANDMARK_RULES): Landmark | undefined => derive(world, rules).byCell.get(cell);
const zero = { food: 0, industry: 0, coin: 0, knowledge: 0 };
/** What the landmark on a hex yields to the hearth that works it, under rules that know landmarks. */
export function landmarkYieldAt(state: GameState, cell: number): LandmarkKind['yields'] {
  if (rulesVersion(state) < 51) return zero;
  const site = landmarkAt(state.world, cell, rulesVersion(state));
  const kind = site && landmarkKindsForRules(rulesVersion(state)).find(item => item.id === site.kindId);
  return kind ? kind.yields : zero;
}
/** Every landmark on ground the realm has explored, in full; who holds its hex is read from the land the realm knows. */
export function observeLandmarks(state: GameState, factionId: string): ObservedLandmark[] | undefined {
  if (rulesVersion(state) < 51) return undefined;
  const explored = state.explored[factionId];
  return landmarks(state.world, rulesVersion(state)).filter(site => explored?.has(site.cell)).flatMap(site => {
    const kind = landmarkKind(site.kindId);
    return kind ? [{ ...site, name: kind.name, description: kind.description, yields: { ...kind.yields } }] : [];
  });
}
