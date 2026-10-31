import { MAGIC_PATHS, UNITS } from '@theandril/content';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { getMovementQuery, GLASS_SHARDS, SITE_SEARCH_RADIUS, type ArmyView, type GameCommand, type Observation, type ObservedArcaneSite } from '@theandril/sim';
import type { AiPlan } from './diplomacy';
import { observedCells } from './observation-index';
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

/** Seams the realm has found but does not hold, of paths it still lacks,
 * while those paths matter: before its first seam, which Arcane Theory needs,
 * or while a sealed working is within the rules. */
function wantedSeams(view: Observation): ObservedArcaneSite[] {
  const held = heldSeamPaths(view);
  return view.arcaneSites.filter(site => !site.controlled && !held.has(site.pathId) && (view.progression.attunement || !held.size));
}

/** How far a hearth's borders are pushed toward a found seam instead of
 * settling beside it: within this many hexes of the hearth, claims reach it. */
export const SEAM_CLAIM_REACH = 4;

/** A surveyed seam the realm does not yet hold is worth claiming ahead of
 * ordinary hinterland: it is the only ground that unlocks Arcane Theory, and
 * from rules 38 a seam of each path is what a sealed working rests on. A seam
 * near a hearth but not yet on its border is reached one claim at a time, each
 * claim the legal hex that leaves the border nearest the seam; a seam inside
 * another realm's borders is not claimed toward, since the border would stop
 * at theirs. */
export function claimArcaneSeam(view: Observation, budget: number): { command: GameCommand; coinCost: number; reason: string } | null {
  const wanted = wantedSeams(view);
  if (!wanted.length) return null;
  const seamCells = new Set(wanted.map(site => site.cell));
  for (const land of view.land.settlements) {
    const cell = land.cells.find(item => seamCells.has(item.cell) && item.claim.canStart && item.claim.coinCost <= budget);
    if (cell) return {
      command: { type: 'claimCell', factionId: view.factionId, settlementId: land.settlementId, cell: cell.cell },
      coinCost: cell.claim.coinCost,
      reason: `Claim the surveyed arcane seam beside ${land.settlementId} for ${cell.claim.coinCost} coin; holding it is what allows Arcane Theory.`,
    };
  }
  const cells = observedCells(view);
  const free = wanted.filter(site => !cells.get(site.cell)?.factionId);
  if (!free.length) return null;
  for (const land of view.land.settlements) {
    const town = view.settlements.find(item => item.id === land.settlementId);
    if (!town) continue;
    const near = free.filter(site => hexDistance(town.cell, site.cell, view.width) <= SEAM_CLAIM_REACH);
    if (!near.length) continue;
    const gap = (cell: number): number => Math.min(...near.map(site => hexDistance(cell, site.cell, view.width)));
    const current = Math.min(...land.claimed.map(gap));
    const step = land.cells.filter(item => !item.claimed && item.claim.canStart && item.claim.coinCost <= budget && gap(item.cell) < current)
      .sort((a, b) => gap(a.cell) - gap(b.cell) || a.claim.coinCost - b.claim.coinCost || a.cell - b.cell)[0];
    if (!step) continue;
    const seam = near.sort((a, b) => hexDistance(step.cell, a.cell, view.width) - hexDistance(step.cell, b.cell, view.width) || a.cell - b.cell)[0]!;
    return {
      command: { type: 'claimCell', factionId: view.factionId, settlementId: land.settlementId, cell: step.cell },
      coinCost: step.claim.coinCost,
      reason: `Claim hex ${step.cell} for ${town.name} for ${step.claim.coinCost} coin: it carries the border to within ${gap(step.cell)} hex${gap(step.cell) === 1 ? '' : 'es'} of the surveyed ${seam.pathName.toLowerCase()} seam, which the realm must hold.`,
    };
  }
  return null;
}

/** How far from its nearest hearth a realm will send a caravan to settle
 * beside a seam it found; a saved route carries at most 256 hexes anyway. */
export const SEAM_EXPEDITION_RANGE = 48;
export interface SeamExpeditionSite { seam: ObservedArcaneSite; site: number; hearth: Observation['settlements'][number]; distance: number }
export interface SeamExpedition extends AiPlan { heldArmyIds: Set<string>; coinSpent: number; queuedColonist: boolean }

/** Where a realm would settle to hold a seam it found: the seam's own hex, or
 * a neighbour, on passable dry ground in nobody's borders and three hexes from
 * every known settlement. Seams within claim reach of a hearth are left to its
 * claims; the nearest qualifying seam to the realm's hearths is chosen. */
export function seamExpeditionSite(view: Observation): SeamExpeditionSite | null {
  const own = view.settlements.filter(town => town.factionId === view.factionId);
  if (!own.length) return null;
  const cells = observedCells(view);
  const towns = view.settlements.map(town => town.cell);
  // A seam on a hearth's border is claimed, not settled beside.
  const border = new Set(view.land.settlements.flatMap(land => land.claimed.flatMap(cell => neighbors(cell, view.width, view.height))));
  const candidates: SeamExpeditionSite[] = [];
  for (const seam of wantedSeams(view)) {
    if (cells.get(seam.cell)?.factionId || border.has(seam.cell)) continue;
    const hearth = own.reduce((nearest, town) => hexDistance(town.cell, seam.cell, view.width) < hexDistance(nearest.cell, seam.cell, view.width) ? town : nearest);
    const distance = hexDistance(hearth.cell, seam.cell, view.width);
    if (distance <= SEAM_CLAIM_REACH || distance > SEAM_EXPEDITION_RANGE) continue;
    const site = [seam.cell, ...neighbors(seam.cell, view.width, view.height).sort((a, b) => a - b)].find(cell => {
      const ground = cells.get(cell);
      return ground && isPassable(ground.terrain) && ground.waterDepth === 0 && !ground.settlementId && towns.every(town => hexDistance(town, cell, view.width) > 2);
    });
    if (site === undefined) continue;
    candidates.push({ seam, site, hearth, distance });
  }
  return candidates.sort((a, b) => a.distance - b.distance || a.seam.cell - b.seam.cell)[0] ?? null;
}

/** A hearth name the realm has not used, in the planner's own numbering. */
function hearthName(view: Observation): string {
  const names = new Set(view.settlements.filter(town => town.factionId === view.factionId).map(town => town.name));
  let number = view.settlements.filter(town => town.factionId === view.factionId).length;
  let name: string;
  do { name = `Hearth ${++number}`; } while (names.has(name));
  return name;
}

/** A realm holds a seam it found far from its hearths by settling beside it.
 * A free caravan is given the road and held on it until it arrives, when it
 * founds the hearth; a caravan already bound there keeps its road. With no
 * caravan, one is raised at the nearest hearth once the purse covers the
 * caravan, the founding fee and the new hearth's running costs, and only when
 * a company of the realm can quote a road to the site, so an unreachable seam
 * never raises caravans turn after turn. One expedition at a time, one route
 * quote a turn. */
export function planSeamExpedition(view: Observation, heldArmyIds: ReadonlySet<string> = heldDelegatedArmyIds(view)): SeamExpedition | null {
  const target = seamExpeditionSite(view);
  if (!target) return null;
  const factionId = view.factionId, held = new Set<string>();
  const label = `${target.seam.pathName.toLowerCase()} seam at hex ${target.seam.cell}`;
  const lack = view.arcaneSites.some(site => site.controlled) ? 'lacks a seam of that path' : 'holds no arcane seam';
  const routes = new Map(view.routes.map(route => [route.armyId, route]));
  const caravans = view.armies.filter(army => army.factionId === factionId && army.canFound && army.domain !== 'naval' && !army.carrierId && !heldArmyIds.has(army.id) && !army.commandBlocker)
    .sort((a, b) => hexDistance(a.cell, target.site, view.width) - hexDistance(b.cell, target.site, view.width) || (a.id < b.id ? -1 : 1));
  const found = (army: typeof caravans[number]): SeamExpedition => {
    const name = hearthName(view);
    return { commands: [{ type: 'found', factionId, armyId: army.id, name }], reasons: [`Found ${name} with ${army.name} beside the ${label}: its borders hold the seam, and the realm ${lack}.`], heldArmyIds: new Set([army.id]), coinSpent: view.growth?.founding.coinCost ?? 0, queuedColonist: false };
  };
  const bound = caravans.find(army => routes.get(army.id)?.waypoints.at(-1) === target.site);
  if (bound) {
    held.add(bound.id);
    if (bound.cell === target.site && bound.movement > 0) return found(bound);
    const route = routes.get(bound.id)!;
    if (route.status === 'paused') {
      const preview = getMovementQuery(view, bound.id, target.site).preview;
      if (preview?.canQueue && preview.action === 'move') return { commands: [{ type: 'queueMovement', factionId, armyId: bound.id, target: target.site }], reasons: [`${bound.name} takes a fresh road to the ${label} after its travel paused: ${route.pauseReason ?? 'the road was interrupted'}.`], heldArmyIds: held, coinSpent: 0, queuedColonist: false };
      return { commands: [], reasons: [`${bound.name} waits on its road to the ${label}: ${preview?.blocker ?? route.pauseReason ?? 'no safe road is quoted'}.`], heldArmyIds: held, coinSpent: 0, queuedColonist: false };
    }
    return { commands: [], reasons: [`${bound.name} continues its road to the ${label}; it founds a hearth there to hold the seam.`], heldArmyIds: held, coinSpent: 0, queuedColonist: false };
  }
  const caravan = caravans.find(army => !routes.has(army.id) && army.movement > 0 && !army.movementBlocker);
  if (caravan) {
    if (caravan.cell === target.site) return found(caravan);
    const preview = getMovementQuery(view, caravan.id, target.site).preview;
    if (!preview?.canQueue || preview.action !== 'move') return null;
    held.add(caravan.id);
    return { commands: [{ type: 'queueMovement', factionId, armyId: caravan.id, target: target.site }], reasons: [`March ${caravan.name} ${preview.path.length} hexes to found a hearth beside the ${label}: the realm ${lack}, and a hearth there holds it.`], heldArmyIds: held, coinSpent: 0, queuedColonist: false };
  }
  if (!view.growth || caravans.length) return null;
  const colonist = UNITS[0]!;
  if (view.settlements.some(town => town.factionId === factionId && town.queue.some(order => order.itemId === colonist.id))) return null;
  if (view.treasury < colonist.coinCost + view.growth.founding.coinCost + view.growth.founding.additionalUpkeep * 6 + 24) return null;
  const hearth = view.settlements.filter(town => town.factionId === factionId && !town.queue.length && view.productionOptions.some(option => option.settlementId === town.id && option.itemId === colonist.id && option.canQueue))
    .sort((a, b) => hexDistance(a.cell, target.site, view.width) - hexDistance(b.cell, target.site, view.width) || (a.id < b.id ? -1 : 1))[0];
  if (!hearth) return null;
  const company = view.armies.filter(army => army.factionId === factionId && army.domain === 'land' && !army.carrierId && !army.canFound)
    .sort((a, b) => hexDistance(a.cell, hearth.cell, view.width) - hexDistance(b.cell, hearth.cell, view.width) || (a.id < b.id ? -1 : 1))[0];
  if (!company || !getMovementQuery(view, company.id, target.site).preview?.canQueue) return null;
  return { commands: [{ type: 'queue', factionId, settlementId: hearth.id, itemId: colonist.id }], reasons: [`Raise a caravan at ${hearth.name} for the ${label}, ${target.distance} hexes away: the realm ${lack}, and a hearth beside the seam holds it.`], heldArmyIds: held, coinSpent: colonist.coinCost, queuedColonist: true };
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

/** How far from its hearths a realm will carry a war for a seam another realm holds. */
export const SEAM_OBJECTIVE_RANGE = 24;
export interface SeamObjective { seam: ObservedArcaneSite; holderId: string; settlementId: string | null; distance: number; atWar: boolean }

/** A seam of a path the realm lacks, found inside another realm's borders, is
 * an objective of war once it is the last gap before the working (the realm
 * holds a seam and a caster of the required degree): field armies march on it, the
 * hearth whose borders hold it is besieged when it comes into sight, and the
 * war is declared the moment a company can lay siege. The objective never opens
 * a second front: at peace any unprotected holder may be pursued, but a realm
 * already at war pursues only a holder it already fights, so a war that cost it
 * a seam hearth is carried back to that hearth. Realms bound by oath, treaty or
 * a supply agreement are never pursued; one objective at a time, the nearest to
 * the realm's hearths within range. The ground's holder is read from the realm's
 * own memory of the land, so a seam another realm claimed since it was last
 * seen is pursued only once it is seen again. */
export function seamObjective(view: Observation, protectedIds: ReadonlySet<string>): SeamObjective | null {
  const attunement = view.progression.attunement;
  // Only the last gap is worth a war: the realm holds a seam and has a caster
  // who could seal the working, so the seam is all it lacks.
  if (!attunement || !view.arcaneSites.some(site => site.controlled) || !attunement.casters.some(caster => caster.degree >= attunement.casterDegree)) return null;
  const own = view.settlements.filter(town => town.factionId === view.factionId);
  if (!own.length) return null;
  const wars = new Set(view.wars);
  const cells = observedCells(view);
  const candidates: SeamObjective[] = [];
  for (const seam of wantedSeams(view)) {
    const ground = cells.get(seam.cell), holderId = ground?.factionId;
    if (!holderId || holderId === view.factionId || protectedIds.has(holderId)) continue;
    if (wars.size && !wars.has(holderId)) continue;
    const distance = Math.min(...own.map(town => hexDistance(town.cell, seam.cell, view.width)));
    if (distance > SEAM_OBJECTIVE_RANGE) continue;
    candidates.push({ seam, holderId, settlementId: ground?.settlementId ?? null, distance, atWar: wars.has(holderId) });
  }
  return candidates.sort((a, b) => a.distance - b.distance || a.seam.cell - b.seam.cell)[0] ?? null;
}

/** How close to the seam a company counts as part of the column gathering for it. */
export const SEAM_RALLY_REACH = 3;
const fieldCompany = (view: Observation, army: ArmyView): boolean => army.factionId === view.factionId && army.domain === 'land' && !army.carrierId
  && army.canAttack && !army.canFound && !army.formations.some(formation => formation.unitId === 'unit.scout');
/** Where the column for the seam gathers: the siege lines, when the realm
 * besieges the hearth holding the seam; else the hex of the strongest own
 * field company already within reach of the seam; else the seam itself.
 * Companies drawn to the objective share that hex instead of each claiming its
 * own, so they stand together and are concentrated into one column the next
 * turn; a company alone before a warded hearth can neither wear its walls nor
 * storm them. */
export function seamRally(view: Observation, goal: SeamObjective): number {
  const siege = goal.settlementId === null ? undefined : view.sieges.find(siege => siege.factionId === view.factionId && siege.settlementId === goal.settlementId);
  const besieger = siege && view.armies.find(army => army.id === siege.armyId);
  if (besieger) return besieger.cell;
  const near = view.armies.filter(army => fieldCompany(view, army) && hexDistance(army.cell, goal.seam.cell, view.width) <= SEAM_RALLY_REACH)
    .sort((a, b) => b.strength - a.strength || b.formations.length - a.formations.length || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return near[0]?.cell ?? goal.seam.cell;
}
/** Whether the realm is actually pursuing its seam objective: a company stands
 * within reach of the seam or besieges the hearth that holds it. Only then is
 * the war with the holder worth holding against a peace. */
export function seamPursued(view: Observation, goal: SeamObjective): boolean {
  return view.armies.some(army => fieldCompany(view, army) && hexDistance(army.cell, goal.seam.cell, view.width) <= SEAM_RALLY_REACH)
    || (goal.settlementId !== null && view.sieges.some(siege => siege.factionId === view.factionId && siege.settlementId === goal.settlementId));
}
