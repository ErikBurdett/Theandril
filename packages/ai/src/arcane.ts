import { MAGIC_PATHS } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { getMovementQuery, GLASS_SHARDS, SITE_SEARCH_RADIUS, type GameCommand, type Observation } from '@theandril/sim';
import { isPassable } from '@theandril/mapgen';
import type { AiPlan } from './diplomacy';
import { heldDelegatedArmyIds } from './theaters';

/** Rules 23. A realm cannot study Arcane Theory until it holds a surveyed seam.
 * Rules 38: once a seam is held, a realm looks further only for the paths it
 * still lacks, from a richer surplus — the sealed working needs a seam of every
 * path. Seams lie under Ashfall glass, so a survey is paid for only where it can
 * find one: fresh glass — in sight, passable, not within reach of an earlier
 * survey — must lie within the survey's own reach of the company that pays, and
 * the company whose survey covers the most such glass goes first. A realm with
 * no glass in sight never pays; surveys come out of surplus either way. */
const SURVEY_TURNS = 6;
const SURVEY_RESERVE = 60;
const FURTHER_SURVEY_RESERVE = 160;

/** The paths whose seams the realm holds, from its own surveyed sites only. */
export const heldSeamPaths = (view: Observation): ReadonlySet<string> => new Set(view.arcaneSites.filter(site => site.controlled).map(site => site.pathId));
export const holdsEverySeamPath = (view: Observation): boolean => { const held = heldSeamPaths(view); return MAGIC_PATHS.every(path => held.has(path.id)); };

/** Unsurveyed Ashfall glass on passable land in sight that no earlier survey already covered. */
function freshGlass(view: Observation, surveyed: ReadonlySet<number>): number[] {
  const cells: number[] = [];
  for (const cell of view.cells) {
    if (!cell.visible || ((cell.featureMask ?? 0) & GLASS_SHARDS) !== GLASS_SHARDS || !isPassable(cell.terrain) || cell.waterDepth !== 0) continue;
    if ([...surveyed].some(seam => hexDistance(seam, cell.cell, view.width) <= SITE_SEARCH_RADIUS)) continue;
    cells.push(cell.cell);
  }
  return cells.sort((a, b) => a - b);
}

/** Ground this realm need not survey again: found seams and, from rules 39, every hex it has already surveyed. */
const surveyedGround = (view: Observation): Set<number> => new Set([...view.arcaneSites.map(site => site.cell), ...(view.arcaneSearches ?? [])]);

/** How much fresh glass a survey made from this hex would cover. */
function glassInReach(cell: number, glass: readonly number[], width: number): number {
  let count = 0;
  for (const item of glass) if (hexDistance(cell, item, width) <= SITE_SEARCH_RADIUS) count++;
  return count;
}

/** Whether the realm is past its first seam and what purse a survey must leave
 * behind. A realm that has found a seam of every path has nothing left to
 * survey for: holding one it found is a matter of claims or conquest. */
function surveyStance(view: Observation): { further: boolean; reserve: number } | null {
  const found = new Set(view.arcaneSites.map(site => site.pathId));
  if (MAGIC_PATHS.every(path => found.has(path.id))) return null;
  const further = view.arcaneSites.some(site => site.controlled);
  if (further && !view.progression.attunement) return null;
  const reserve = further ? FURTHER_SURVEY_RESERVE : SURVEY_RESERVE;
  if (view.treasury < view.arcaneSearchCoinCost + reserve) return null;
  return { further, reserve };
}

export function planArcaneSurvey(view: Observation, heldArmyIds: ReadonlySet<string> = heldDelegatedArmyIds(view)): AiPlan | null {
  const stance = surveyStance(view);
  if (!stance) return null;
  const glass = freshGlass(view, surveyedGround(view));
  if (!glass.length) return null;
  // A company that has not yet moved and is on no road or siege surveys where it
  // stands; nothing is diverted from a march, and a caravan keeps its movement
  // for founding. The survey covers two hexes around the company, so the glass
  // need not be underfoot, only within that reach. A company standing on fresh
  // glass was marched there for this and surveys at once; otherwise the realm
  // keeps the old cadence, so surveys stay occasional bets out of surplus.
  const routed = new Set(view.routes.map(route => route.armyId)), besieging = new Set(view.sieges.map(siege => siege.armyId));
  const best = view.armies
    .filter(item => item.factionId === view.factionId && !heldArmyIds.has(item.id) && item.movement > 0 && item.domain !== 'naval' && !item.carrierId
      && !item.canFound && !routed.has(item.id) && !besieging.has(item.id))
    .map(army => ({ army, worth: glassInReach(army.cell, glass, view.width), underfoot: glass.includes(army.cell) }))
    .filter(item => item.worth > 0)
    .sort((a, b) => Number(b.underfoot) - Number(a.underfoot) || b.worth - a.worth || a.army.cell - b.army.cell || (a.army.id < b.army.id ? -1 : 1))[0];
  if (!best) return null;
  const seat = view.factions.findIndex(faction => faction.id === view.factionId);
  if (!best.underfoot && (seat < 0 || (view.turn + seat) % SURVEY_TURNS !== 0)) return null;
  return {
    commands: [{ type: 'searchArcane', factionId: view.factionId, armyId: best.army.id }],
    reasons: [stance.further
      ? `Survey the Ashfall glass within reach of ${best.army.name} for ${view.arcaneSearchCoinCost} coin: a sealed working needs a seam of every path, and the realm still lacks one.`
      : `Survey the Ashfall glass within reach of ${best.army.name} for ${view.arcaneSearchCoinCost} coin: the realm holds no arcane seam, and Arcane Theory needs one.`],
  };
}

/** A surveyed seam the realm does not yet hold is worth claiming ahead of
 * ordinary hinterland: it is the only ground that unlocks Arcane Theory, and
 * from rules 38 a seam of each path is what a sealed working rests on. */
export function claimArcaneSeam(view: Observation, budget: number): { command: GameCommand; coinCost: number; reason: string } | null {
  const held = heldSeamPaths(view);
  const wanted = new Set(view.arcaneSites.filter(site => !site.controlled && !held.has(site.pathId) && (view.progression.attunement || !held.size)).map(site => site.cell));
  if (!wanted.size) return null;
  for (const land of view.land.settlements) {
    const cell = land.cells.find(item => wanted.has(item.cell) && item.claim.canStart && item.claim.coinCost <= budget);
    if (cell) return {
      command: { type: 'claimCell', factionId: view.factionId, settlementId: land.settlementId, cell: cell.cell },
      coinCost: cell.claim.coinCost,
      reason: `Claim the surveyed arcane seam beside ${land.settlementId} for ${cell.claim.coinCost} coin; holding it is what allows Arcane Theory.`,
    };
  }
  return null;
}

/** Rules 39: a realm that lacks a seam, or a path, walks a free company to fresh
 * glass it can see when none of its companies already stands within a survey's
 * reach of any, so the next survey is a choice rather than a bet. At most one
 * such march a turn; the company is held for the rest of the pass. */
export const GLASS_APPROACH_RANGE = 4;
export function planGlassApproach(view: Observation, heldArmyIds: ReadonlySet<string> = heldDelegatedArmyIds(view)): (AiPlan & { heldArmyIds: Set<string> }) | null {
  const held = new Set<string>();
  if (!surveyStance(view)) return null;
  const glass = freshGlass(view, surveyedGround(view));
  if (!glass.length) return null;
  const routed = new Set(view.routes.map(route => route.armyId));
  const companies = view.armies.filter(army => army.factionId === view.factionId && army.domain === 'land' && !army.carrierId && army.canAttack && !army.canFound
    && !heldArmyIds.has(army.id) && !routed.has(army.id) && !army.movementBlocker && army.movement > 0 && army.formations.length <= 2 && !army.commander && !army.agents.length
    && !view.sieges.some(siege => siege.armyId === army.id));
  const candidates: { army: typeof companies[number]; cell: number; distance: number }[] = [];
  for (const army of companies) for (const cell of glass) {
    const distance = hexDistance(army.cell, cell, view.width);
    if (distance > 0 && distance <= GLASS_APPROACH_RANGE) candidates.push({ army, cell, distance });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.cell - b.cell || (a.army.id < b.army.id ? -1 : 1));
  // At most four route quotes a turn: the order is only proposed when the rules say it can be queued.
  for (const best of candidates.slice(0, 4)) {
    const preview = getMovementQuery(view, best.army.id, best.cell).preview;
    if (!preview?.canQueue || preview.action !== 'move') continue;
    held.add(best.army.id);
    return {
      commands: [{ type: 'queueMovement', factionId: view.factionId, armyId: best.army.id, target: best.cell }],
      reasons: [`March ${best.army.name} ${best.distance} hexes to Ashfall glass at hex ${best.cell}: the realm ${view.arcaneSites.some(site => site.controlled) ? 'lacks a seam of one path' : 'holds no arcane seam'}, and a survey there can find one.`],
      heldArmyIds: held,
    };
  }
  return null;
}
