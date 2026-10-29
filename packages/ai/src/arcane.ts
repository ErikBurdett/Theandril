import { MAGIC_PATHS } from '@theandril/content';
import { hexDistance } from '@theandril/mapgen';
import { getMovementQuery, GLASS_SHARDS, SITE_SEARCH_RADIUS, type GameCommand, type Observation } from '@theandril/sim';
import { isPassable } from '@theandril/mapgen';
import type { AiPlan } from './diplomacy';
import { observedCells } from './observation-index';
import { heldDelegatedArmyIds } from './theaters';

/** Rules 23. A realm cannot study Arcane Theory until it holds a surveyed seam,
 * so a realm without one pays to survey the ground it already occupies. Surveys
 * are occasional and come out of surplus: they are a bet, not a budget line.
 * Rules 38: once a seam is held, a realm looks further only for the paths it
 * still lacks, more rarely, from a richer surplus, and only where Ashfall glass
 * marks new ground — the sealed working needs a seam of every path. */
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

export function planArcaneSurvey(view: Observation, heldArmyIds: ReadonlySet<string> = heldDelegatedArmyIds(view)): AiPlan | null {
  const further = view.arcaneSites.some(site => site.controlled);
  if (further && (!view.progression.attunement || holdsEverySeamPath(view))) return null;
  if (view.treasury < view.arcaneSearchCoinCost + (further ? FURTHER_SURVEY_RESERVE : SURVEY_RESERVE)) return null;
  const seat = view.factions.findIndex(faction => faction.id === view.factionId);
  // A further survey waits for no cadence: it happens only when a company already
  // stands on fresh glass, which is rare enough to be its own limit.
  if (seat < 0 || !further && (view.turn + seat) % SURVEY_TURNS !== 0) return null;
  const surveyed = surveyedGround(view);
  const hearths = view.settlements.filter(town => town.factionId === view.factionId);
  if (!hearths.length) return null;
  const cells = further ? observedCells(view) : null;
  // Survey from a company standing on the realm's own hinterland that has not yet
  // moved; nothing is diverted from an expedition or a march. Land detail is
  // trimmed in an AI observation, so proximity to a hearth stands for its borders.
  // A further survey must stand on glass that no earlier survey already covered.
  const army = view.armies
    .filter(item => item.factionId === view.factionId && !heldArmyIds.has(item.id) && item.movement > 0 && item.domain !== 'naval' && !item.carrierId && !surveyed.has(item.cell)
      && (further || hearths.some(town => hexDistance(item.cell, town.cell, view.width) <= 4))
      && (!cells || ((cells.get(item.cell)?.featureMask ?? 0) & GLASS_SHARDS) === GLASS_SHARDS && [...surveyed].every(cell => hexDistance(cell, item.cell, view.width) > SITE_SEARCH_RADIUS)))
    .sort((a, b) => a.cell - b.cell || (a.id < b.id ? -1 : 1))[0];
  if (!army) return null;
  return {
    commands: [{ type: 'searchArcane', factionId: view.factionId, armyId: army.id }],
    reasons: [further
      ? `Survey the Ashfall glass under ${army.name} for ${view.arcaneSearchCoinCost} coin: a sealed working needs a seam of every path, and the realm still lacks one.`
      : `Survey the ground under ${army.name} for ${view.arcaneSearchCoinCost} coin: the realm holds no arcane seam, and Arcane Theory needs one.`],
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

/** Rules 39: a realm that holds a seam but lacks a path walks a free company to
 * fresh glass it can see, so the next survey is a choice rather than a bet. At
 * most one such march a turn; the company is held for the rest of the pass. */
export const GLASS_APPROACH_RANGE = 4;
export function planGlassApproach(view: Observation, heldArmyIds: ReadonlySet<string> = heldDelegatedArmyIds(view)): (AiPlan & { heldArmyIds: Set<string> }) | null {
  const held = new Set<string>();
  if (!view.progression.attunement || !view.arcaneSites.some(site => site.controlled) || holdsEverySeamPath(view)) return null;
  if (view.treasury < view.arcaneSearchCoinCost + FURTHER_SURVEY_RESERVE) return null;
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
      reasons: [`March ${best.army.name} ${best.distance} hexes to Ashfall glass at hex ${best.cell}: the realm lacks a seam of one path, and a survey there can find one.`],
      heldArmyIds: held,
    };
  }
  return null;
}
