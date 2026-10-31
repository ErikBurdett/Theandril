import { expect, test } from 'vitest';
import { ATTUNEMENT_VICTORY, TECHNOLOGIES } from '@theandril/content';
import { applyCommand, arcaneSites, createArmyFormation, createGame, getObservation, refreshLandKnowledge, type GameCommand, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { getLandIndex } from '../../sim/src/territory';
import { planTurnWithReasons } from './index';
import { planProgression } from './progression';
import { claimArcaneSeam, GLASS_APPROACH_RANGE, planArcaneSurvey, planGlassApproach, planSeamExpedition, SEAM_CLAIM_REACH, SEAM_OBJECTIVE_RANGE, seamExpeditionSite, seamObjective } from './arcane';
import { protectedFactions } from './diplomacy';
import { planCharacters } from './characters';
import { deserializeGame, serializeGame } from '@theandril/sim';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { SITE_SEARCH_RADIUS } from '@theandril/sim';

const casterOf = (state: GameState) => Object.values(state.characters).find(character => character.factionId === state.turnOwnerId && character.definitionId === 'character.waykeeper')!;
const hostOf = (state: GameState) => Object.values(state.settlements).find(town => town.factionId === state.turnOwnerId)!;

test('an observation-only realm at the brink seals the working through its qualified caster, and the order is legal', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const view = getObservation(state, player), copy = structuredClone(view);
  const plan = planProgression(view);
  expect(view).toEqual(copy);
  expect(plan.commands).toEqual([{ type: 'startAttunement', factionId: player, settlementId: hostOf(state).id, characterId: casterOf(state).id }]);
  expect(plan.reasons[0]).toContain('Seal an Attunement');
  // The whole turn plan leads with the working, as it does with a ready Hearth Exchange.
  const turn = planTurnWithReasons(view);
  expect(turn.commands[0]).toEqual(plan.commands[0]);
  expect(applyCommand(state, plan.commands[0]!)).toMatchObject({ ok: true });
  expect(state.projects.some(project => project.projectId === ATTUNEMENT_VICTORY.id && project.status === 'active')).toBe(true);
  // Nothing further is proposed for the path once the working is underway.
  expect(planProgression(getObservation(state, player)).commands.some(command => command.type === 'startAttunement')).toBe(false);
  // A minor power never pursues a public victory.
  expect(planProgression(view, 0, false).commands.some(command => command.type === 'startAttunement')).toBe(false);
});

test('a realm holding every seam path with a caster of the second degree finishes Arcane Theory it cannot yet cast', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  // A late realm with its practical discoveries behind it; Unbinding needs the
  // second degree of Rune, and this caster deepened Flame.
  state.progression[player]!.technologies = TECHNOLOGIES.map(item => item.id).sort();
  state.arcaneResearch[player] = state.arcaneResearch[player]!.filter(id => id !== 'arcane.unbinding');
  const view = getObservation(state, player);
  expect(view.progression.attunement!.blockers).toEqual(['Research every Arcane Theory discovery (2 of 3).']);
  expect(view.arcaneResearch.choices.find(choice => choice.id === 'arcane.unbinding')!.casters[0]!.canCast).toBe(false);
  const plan = planProgression(view);
  expect(plan.commands).toContainEqual({ type: 'researchArcane', factionId: player, discoveryId: 'arcane.unbinding' });
  expect(plan.reasons.join(' ')).toContain('toward a sealed working');
  // Without a seam of every path the uncastable discovery is not bought.
  const land = state.land.settlements[hostOf(state).id]!;
  const rune = view.arcaneSites.find(site => site.pathId === 'path.rune')!;
  land.claimed = land.claimed.filter(cell => cell !== rune.cell);
  expect(planProgression(getObservation(state, player)).commands.some(command => command.type === 'researchArcane')).toBe(false);
});

test('a caster riding away is brought home when it is all the working lacks, and that company is held', () => {
  const state = attunementCampaign(), player = state.turnOwnerId, caster = casterOf(state), host = hostOf(state);
  const army = Object.values(state.armies).find(item => item.factionId === player)!;
  expect(applyCommand(state, { type: 'assignCharacter', factionId: player, characterId: caster.id, armyId: army.id })).toMatchObject({ ok: true });
  army.cell = state.land.settlements[host.id]!.claimed.filter(cell => cell !== host.cell).sort((a, b) => b - a)[0]!;
  refreshAuthoredSight(state);
  const view = getObservation(state, player);
  expect(view.progression.attunement!.blockers).toEqual(['A Waykeeper of the second degree must stand at a hearth that can host the working.']);
  const plan = planProgression(view);
  expect(plan.commands).toContainEqual({ type: 'queueMovement', factionId: player, armyId: army.id, target: host.cell });
  expect([...plan.heldArmyIds]).toEqual([army.id]);
  expect(applyCommand(state, { type: 'queueMovement', factionId: player, armyId: army.id, target: host.cell })).toMatchObject({ ok: true });
  // An army already on a road is left to it.
  expect(planProgression(getObservation(state, player)).commands.some(command => command.type === 'queueMovement')).toBe(false);
});

test('further surveys and seam claims pursue only the paths the realm still lacks, from glass the realm has not surveyed', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  state.factions[0]!.treasury = 1000;
  const complete = getObservation(state, player);
  expect(planArcaneSurvey(complete)).toBeNull();
  expect(claimArcaneSeam(complete, 1000)).toBeNull();
  // Lose the Rune seam's ground: the realm now lacks one path and still holds Flame.
  const land = state.land.settlements[hostOf(state).id]!;
  const rune = complete.arcaneSites.find(site => site.pathId === 'path.rune')!;
  land.claimed = land.claimed.filter(cell => cell !== rune.cell);
  const lacking = getObservation(state, player);
  expect(lacking.arcaneSites.find(site => site.pathId === 'path.flame')!.controlled).toBe(true);
  expect(lacking.arcaneSites.find(site => site.pathId === 'path.rune')!.controlled).toBe(false);
  // Having found a seam of every path, the realm pays for no further survey and
  // marches nowhere: holding the Rune seam is a matter of claims or conquest.
  expect(planArcaneSurvey({ ...lacking, treasury: 1000 })).toBeNull();
  expect(planGlassApproach({ ...lacking, treasury: 1000 })).toBeNull();
  // The authored seam lies beyond a hearth's ordinary claim reach, so the quote
  // the planner reads is a frontier quote moved onto the seam: the planner only
  // chooses among quotes the observation says can start.
  const frontier = lacking.land.settlements[0]!.cells.find(cell => !cell.claimed && cell.claim.canStart)!;
  expect(claimArcaneSeam(lacking, 1000)).toBeNull();
  lacking.land.settlements[0]!.cells.push({ ...frontier, cell: rune.cell });
  const claim = claimArcaneSeam(lacking, 1000);
  expect(claim?.command).toMatchObject({ type: 'claimCell', factionId: player, cell: rune.cell });
  expect(claim?.coinCost).toBe(frontier.claim.coinCost);
  expect(claimArcaneSeam(lacking, frontier.claim.coinCost - 1)).toBeNull();
  // A realm that has yet to find a Rune seam surveys further, from a richer
  // purse, where fresh glass lies within the survey's reach of the company that
  // pays; once that ground is remembered as surveyed the same company is not
  // sent to pay again.
  const unfound = { ...lacking, arcaneSites: lacking.arcaneSites.filter(site => site.pathId !== 'path.rune') };
  expect(planArcaneSurvey({ ...unfound, treasury: unfound.arcaneSearchCoinCost + 100 })).toBeNull();
  const seat = unfound.factions.findIndex(faction => faction.id === player);
  const cadence = unfound.turn + ((6 - (unfound.turn + seat) % 6) % 6);
  const survey = planArcaneSurvey({ ...unfound, treasury: 1000, turn: cadence });
  if (survey) {
    const armyId = (survey.commands[0] as { armyId: string }).armyId;
    const cell = unfound.armies.find(army => army.id === armyId)!.cell;
    const covered = new Set([...unfound.arcaneSites.map(site => site.cell), ...(unfound.arcaneSearches ?? [])]);
    expect(unfound.cells.some(item => item.visible && ((item.featureMask ?? 0) & 64) === 64 && hexDistance(item.cell, cell, unfound.width) <= SITE_SEARCH_RADIUS
      && [...covered].every(seam => hexDistance(seam, item.cell, unfound.width) > SITE_SEARCH_RADIUS))).toBe(true);
    expect(survey.reasons[0]).toContain('lacks one');
    const remembered = planArcaneSurvey({ ...unfound, treasury: 1000, turn: cadence, arcaneSearches: [...(unfound.arcaneSearches ?? []), cell] });
    expect(remembered?.commands.some(command => command.type === 'searchArcane' && command.armyId === armyId)).toBeFalsy();
  }
});

test('a realm with no seam pays for a survey only where fresh glass lies within its reach, and otherwise marches a company to glass in sight', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  state.arcaneSurveys[player] = []; state.arcaneSearches[player] = [];
  state.factions[0]!.treasury = 1000;
  const view = getObservation(state, player);
  expect(view.arcaneSites).toEqual([]);
  // With no glass in sight nothing is paid for and nothing marches, whatever the turn.
  const bare = structuredClone(view);
  for (const cell of bare.cells) cell.featureMask = (cell.featureMask ?? 0) & ~64;
  for (let turn = 0; turn < 8; turn++) {
    expect(planArcaneSurvey({ ...bare, turn: bare.turn + turn })).toBeNull();
    expect(planGlassApproach({ ...bare, turn: bare.turn + turn })).toBeNull();
  }
  const company = bare.armies.find(army => army.factionId === player && army.domain === 'land' && army.canAttack && !army.canFound)!;
  // Visible passable ground at an exact distance from the company that no other company could survey.
  const groundAt = (distance: number) => bare.cells.find(cell => cell.visible && cell.waterDepth === 0 && isPassable(cell.terrain)
    && hexDistance(cell.cell, company.cell, bare.width) === distance
    && bare.armies.every(army => army.id === company.id || army.factionId !== player || hexDistance(army.cell, cell.cell, bare.width) > SITE_SEARCH_RADIUS))!;
  // Glass two hexes away lies within a survey's reach: the company surveys where
  // it stands on the realm's survey cadence, and never from a thin purse.
  const seat = bare.factions.findIndex(faction => faction.id === player);
  const cadence = bare.turn + ((6 - (bare.turn + seat) % 6) % 6);
  const within = { ...structuredClone(bare), turn: cadence };
  const reach = within.cells.find(cell => cell.cell === groundAt(SITE_SEARCH_RADIUS).cell)!;
  reach.featureMask = (reach.featureMask ?? 0) | 64;
  expect(planArcaneSurvey(within)?.commands).toEqual([{ type: 'searchArcane', factionId: player, armyId: company.id }]);
  expect(planArcaneSurvey(within)?.reasons[0]).toContain('holds no arcane seam');
  expect(planArcaneSurvey({ ...within, turn: cadence + 1 })).toBeNull();
  expect(planArcaneSurvey({ ...within, treasury: within.arcaneSearchCoinCost + 10 })).toBeNull();
  // Glass underfoot was marched to for this: it is surveyed at once, whatever the turn.
  const underfoot = { ...structuredClone(bare), turn: cadence + 1 };
  const standing = underfoot.cells.find(cell => cell.cell === company.cell)!;
  standing.featureMask = (standing.featureMask ?? 0) | 64;
  expect(planArcaneSurvey(underfoot)?.commands).toEqual([{ type: 'searchArcane', factionId: player, armyId: company.id }]);
  // Glass three hexes away is beyond reach: no survey, a march to it instead, with the company held.
  const beyond = structuredClone(bare);
  const far = beyond.cells.find(cell => cell.cell === groundAt(SITE_SEARCH_RADIUS + 1).cell)!;
  far.featureMask = (far.featureMask ?? 0) | 64;
  expect(planArcaneSurvey(beyond)).toBeNull();
  const march = planGlassApproach(beyond);
  expect(march?.commands).toEqual([{ type: 'queueMovement', factionId: player, armyId: company.id, target: far.cell }]);
  expect([...march!.heldArmyIds]).toEqual([company.id]);
  expect(march?.reasons[0]).toContain('holds no arcane seam');
});

test('a realm holding one seam path marches a free company to fresh glass in sight and surveys when it stands there', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  // Lose the Rune seam's ground and forget the seam itself, so the realm lacks a
  // path it has not yet found; keep the purse rich.
  const land = state.land.settlements[hostOf(state).id]!;
  const rune = getObservation(state, player).arcaneSites.find(site => site.pathId === 'path.rune')!;
  land.claimed = land.claimed.filter(cell => cell !== rune.cell);
  state.arcaneSurveys[player] = state.arcaneSurveys[player]!.filter(cell => cell !== rune.cell);
  state.factions[0]!.treasury = 1000;
  const view = getObservation(state, player);
  expect(view.progression.attunement!.paths.find(path => path.pathId === 'path.rune')!.held).toBe(false);
  const surveyed = new Set(view.arcaneSites.map(site => site.cell));
  const glass = view.cells.filter(cell => cell.visible && ((cell.featureMask ?? 0) & 64) === 64 && [...surveyed].every(seam => hexDistance(seam, cell.cell, view.width) > SITE_SEARCH_RADIUS)).map(cell => cell.cell);
  const company = view.armies.find(army => army.factionId === player && army.domain === 'land' && army.canAttack && !army.canFound)!;
  // Author a visible glass target four hexes from the company when the generated sight shows none.
  const target = glass.find(cell => hexDistance(cell, company.cell, view.width) > 0 && hexDistance(cell, company.cell, view.width) <= GLASS_APPROACH_RANGE)
    ?? (() => { const cell = view.cells.find(item => item.visible && item.cell !== company.cell && hexDistance(item.cell, company.cell, view.width) <= 2 && [...surveyed].every(seam => hexDistance(seam, item.cell, view.width) > SITE_SEARCH_RADIUS))!; cell.featureMask = (cell.featureMask ?? 0) | 64; return cell.cell; })();
  const plan = planGlassApproach(view);
  expect(plan?.commands).toEqual([{ type: 'queueMovement', factionId: player, armyId: company.id, target }]);
  expect([...plan!.heldArmyIds]).toEqual([company.id]);
  expect(plan!.reasons[0]).toContain('Ashfall glass');
  // Standing on that glass, the survey itself needs no cadence and is proposed at once.
  const arrived = structuredClone(view);
  arrived.armies.find(army => army.id === company.id)!.cell = target;
  for (let turn = 0; turn < 3; turn++) expect(planArcaneSurvey({ ...arrived, turn: arrived.turn + turn })?.commands).toEqual([{ type: 'searchArcane', factionId: player, armyId: company.id }]);
  expect(planGlassApproach(arrived)?.commands.some(command => command.type === 'queueMovement' && command.armyId === company.id)).toBeFalsy();
  // With every path held nothing marches, and a realm with no seam at all keeps the ordinary first-seam cadence.
  expect(planGlassApproach(getObservation(attunementCampaign(), player))).toBeNull();
});

test('rules 39: a realm never pays to survey ground it remembers surveying, and glass marches skip it too', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const land = state.land.settlements[hostOf(state).id]!;
  const rune = getObservation(state, player).arcaneSites.find(site => site.pathId === 'path.rune')!;
  land.claimed = land.claimed.filter(cell => cell !== rune.cell);
  state.arcaneSurveys[player] = state.arcaneSurveys[player]!.filter(cell => cell !== rune.cell);
  state.factions[0]!.treasury = 1000;
  const view = getObservation(state, player);
  const company = view.armies.find(army => army.factionId === player && army.domain === 'land' && army.canAttack && !army.canFound)!;
  const standing = structuredClone(view);
  const underfoot = standing.cells.find(cell => cell.cell === company.cell)!;
  underfoot.featureMask = (underfoot.featureMask ?? 0) | 64; underfoot.visible = true;
  expect(planArcaneSurvey(standing)?.commands).toEqual([{ type: 'searchArcane', factionId: player, armyId: company.id }]);
  const remembered = { ...standing, arcaneSearches: [company.cell] };
  expect(planArcaneSurvey(remembered)).toBeNull();
  expect(planGlassApproach(remembered)?.commands.some(command => command.type === 'queueMovement' && command.target === company.cell)).toBeFalsy();
});

test('rules 39: a realm at peace holding every seam path appoints a Waykeeper to study at a host hearth, and leaves it lodged there', async () => {
  const { planCharacters } = await import('./characters');
  const { createArmyFormation } = await import('@theandril/sim');
  const state = attunementCampaign(), player = state.turnOwnerId, host = hostOf(state);
  const caster = casterOf(state);
  // Without a caster the realm appoints one at the host even though no war calls for it.
  delete state.characters[caster.id];
  state.factions[0]!.treasury = 500;
  const view = getObservation(state, player);
  expect(view.wars).toEqual([]);
  const plan = planCharacters(view, 200);
  expect(plan.commands).toContainEqual({ type: 'recruitCharacter', factionId: player, settlementId: host.id, definitionId: 'character.waykeeper' });
  expect(plan.reasons.join(' ')).toContain('study the realm');
  expect(applyCommand(state, plan.commands.find(command => command.type === 'recruitCharacter')!)).toMatchObject({ ok: true });
  // A battle army waiting in the same hearth does not pull the lodged caster out in peace.
  const army = Object.values(state.armies).find(item => item.factionId === player)!;
  army.cell = host.cell;
  while (army.formations.length < 4) army.formations.push(createArmyFormation(`army.${state.nextId++}`, 'unit.guard'));
  refreshAuthoredSight(state);
  const lodged = planCharacters(getObservation(state, player), 200);
  expect(lodged.commands.some(command => command.type === 'assignCharacter')).toBe(false);
  expect(lodged.commands.some(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper')).toBe(false);
});

/** The attunement world with the Rune seam's ground lost two hexes around it:
 * the seam is found, unheld, seven hexes from the hearth and in nobody's borders. */
function farSeamCampaign(): { state: GameState; player: string; seam: number } {
  const state = attunementCampaign(), player = state.turnOwnerId, host = hostOf(state);
  const rune = arcaneSites(state.world).find(site => site.pathId === 'path.rune')!;
  const land = state.land.settlements[host.id]!;
  const lost = land.claimed.filter(cell => hexDistance(cell, rune.cell, state.world.width) <= 2);
  land.claimed = land.claimed.filter(cell => !lost.includes(cell));
  // The engine's land index and the realm's own memory of that ground follow, as they would in play.
  const index = getLandIndex(state);
  for (const cell of lost) index.delete(cell);
  refreshLandKnowledge(state, player, lost);
  refreshAuthoredSight(state);
  return { state, player, seam: rune.cell };
}

test('a realm settles beside a seam it found beyond its borders: a free caravan takes the road, is held on it and founds the hearth on arrival', () => {
  const { state, player, seam } = farSeamCampaign(), host = hostOf(state);
  const id = 'army.caravan';
  state.armies[id] = { id, factionId: player, name: 'Seam caravan', cell: host.cell, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
  refreshAuthoredSight(state);
  let view = getObservation(state, player);
  expect(view.arcaneSites.find(site => site.cell === seam)).toMatchObject({ pathId: 'path.rune', controlled: false });
  const distance = hexDistance(host.cell, seam, state.world.width);
  expect(distance).toBeGreaterThan(SEAM_CLAIM_REACH);
  expect(seamExpeditionSite(view)).toMatchObject({ seam: { cell: seam }, site: seam, hearth: { id: host.id }, distance });
  // A seam the border already touches is claimed, never settled beside.
  expect(seamExpeditionSite({ ...view, land: { ...view.land, settlements: view.land.settlements.map(land => ({ ...land, claimed: [...land.claimed, seam - 1] })) } })).toBeNull();
  const plan = planSeamExpedition(view)!;
  expect(plan.commands).toEqual([{ type: 'queueMovement', factionId: player, armyId: id, target: seam }]);
  expect([...plan.heldArmyIds]).toEqual([id]);
  expect(plan.reasons[0]).toContain('found a hearth beside the rune seam');
  const turn = planTurnWithReasons(view);
  expect(turn.commands).toContainEqual(plan.commands[0]);
  expect(turn.commands.filter(command => 'armyId' in command && command.armyId === id)).toEqual([plan.commands[0]]);
  // The road is played out through ordinary turns: the caravan is held on it
  // by every later plan, and founds the hearth when it stands on the seam.
  let founded: string | undefined;
  for (let round = 0; round < 12 && !founded; round++) {
    for (const command of planTurnWithReasons(getObservation(state, player)).commands) {
      if (!('armyId' in command) || command.armyId !== id) continue;
      expect(['queueMovement', 'found']).toContain(command.type);
      const result = applyCommand(state, command);
      expect(result.ok, result.ok ? '' : result.error).toBe(true);
      if (command.type === 'found') founded = command.name;
    }
    for (let seat = 0; seat < state.factions.length; seat++) expect(applyCommand(state, { type: 'endTurn', factionId: state.turnOwnerId })).toMatchObject({ ok: true });
  }
  expect(founded).toBe('Hearth 2');
  view = getObservation(state, player);
  expect(view.arcaneSites.find(site => site.cell === seam)!.controlled).toBe(true);
  expect(view.settlements.find(town => town.name === founded)).toMatchObject({ factionId: player, cell: seam });
  expect(view.progression.attunement!.paths.every(path => path.held)).toBe(true);
  expect(planSeamExpedition(view)).toBeNull();
});

test('with no caravan to send, a realm raises one at the nearest hearth for a far seam when its purse covers the whole hearth, and a company can quote the road', () => {
  const { state, player, seam } = farSeamCampaign(), host = hostOf(state);
  state.factions[0]!.treasury = 260;
  const view = getObservation(state, player);
  const plan = planSeamExpedition(view)!;
  expect(plan.commands).toEqual([{ type: 'queue', factionId: player, settlementId: host.id, itemId: 'unit.colonist' }]);
  expect(plan).toMatchObject({ queuedColonist: true, coinSpent: 16, heldArmyIds: new Set() });
  expect(plan.reasons[0]).toContain(`rune seam at hex ${seam}`);
  const turn = planTurnWithReasons(view);
  expect(turn.commands.filter(command => command.type === 'queue' && command.itemId === 'unit.colonist')).toEqual(plan.commands);
  expect(applyCommand(state, plan.commands[0]!)).toMatchObject({ ok: true });
  // One caravan at a time: the queued one is awaited, and a thin purse raises none.
  expect(planSeamExpedition(getObservation(state, player))).toBeNull();
  expect(planSeamExpedition({ ...view, treasury: 40 })).toBeNull();
  // Without a company to quote the road, no caravan is raised for ground that may be unreachable.
  expect(planSeamExpedition({ ...view, armies: view.armies.filter(army => army.factionId !== player) })).toBeNull();
});

test('a found seam inside another realm\'s borders is neither settled beside nor claimed toward', () => {
  const { state, player, seam } = farSeamCampaign(), rival = state.factions[1]!.id;
  // The rival founds a hearth whose first claims hold the seam, in the player's sight.
  const foundingCell = state.world.terrain.findIndex((terrain, cell) => isPassable(terrain) && state.world.waterDepth[cell] === 0 && hexDistance(cell, seam, state.world.width) === 1
    && Object.values(state.settlements).every(town => hexDistance(town.cell, cell, state.world.width) > 2));
  expect(foundingCell).toBeGreaterThan(0);
  const id = 'army.rival_caravan';
  state.armies[id] = { id, factionId: rival, name: 'Reed caravan', cell: foundingCell, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'found', factionId: rival, armyId: id, name: 'Seam Reach' })).toMatchObject({ ok: true });
  const witness = Object.values(state.armies).find(army => army.factionId === player)!;
  witness.cell = seam;
  refreshAuthoredSight(state);
  const view = getObservation(state, player);
  expect(view.cells.find(cell => cell.cell === seam)).toMatchObject({ factionId: rival });
  expect(view.arcaneSites.find(site => site.cell === seam)).toMatchObject({ controlled: false });
  expect(seamExpeditionSite(view)).toBeNull();
  expect(planSeamExpedition(view)).toBeNull();
  expect(claimArcaneSeam({ ...view, treasury: 1000 }, 1000)).toBeNull();
});

test('a seam found within reach of a hearth is claimed toward one legal hex at a time until the border holds it', () => {
  const state = createGame({ seed: 20, size: 'tiny', factionCount: 2, pace: 'short' }), player = state.turnOwnerId;
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.ok ? '' : result.error).toBe(true); };
  const caravan = Object.values(state.armies).find(army => army.factionId === player && army.formations.some(formation => formation.unitId === 'unit.colonist'))!;
  issue({ type: 'found', factionId: player, armyId: caravan.id, name: 'Seamwatch' });
  const town = Object.values(state.settlements).find(item => item.factionId === player)!;
  const seam = arcaneSites(state.world).find(site => site.pathId === 'path.flame' && hexDistance(site.cell, town.cell, state.world.width) === SEAM_CLAIM_REACH)!;
  expect(seam.cell).toBe(324);
  state.arcaneSurveys[player] = [seam.cell];
  state.factions[0]!.treasury = 1000;
  refreshAuthoredSight(state);
  const gap = () => Math.min(...state.land.settlements[town.id]!.claimed.map(cell => hexDistance(cell, seam.cell, state.world.width)));
  expect(gap()).toBe(SEAM_CLAIM_REACH - 1);
  expect(seamExpeditionSite(getObservation(state, player))).toBeNull();
  const steps: number[] = [];
  for (let claims = 0; claims < 6; claims++) {
    const view = getObservation(state, player);
    if (view.arcaneSites[0]!.controlled) break;
    const claim = claimArcaneSeam(view, 1000)!;
    expect(claim.command).toMatchObject({ type: 'claimCell', factionId: player, settlementId: town.id });
    const before = gap();
    issue(claim.command);
    steps.push((claim.command as { cell: number }).cell);
    expect(gap()).toBeLessThan(before);
  }
  expect(steps).toHaveLength(SEAM_CLAIM_REACH - 1);
  expect(steps.at(-1)).toBe(seam.cell);
  const view = getObservation(state, player);
  expect(view.arcaneSites[0]).toMatchObject({ cell: seam.cell, controlled: true });
  expect(claimArcaneSeam(view, 1000)).toBeNull();
});

test('a seam of a lacking path inside another realm\'s borders is an objective of war: field armies march on it, the hearth holding it is besieged in sight, and a protected realm is never pursued', () => {
  const { state, player, seam } = farSeamCampaign(), rival = state.factions[1]!.id, host = hostOf(state);
  const foundingCell = state.world.terrain.findIndex((terrain, cell) => isPassable(terrain) && state.world.waterDepth[cell] === 0 && hexDistance(cell, seam, state.world.width) === 1
    && Object.values(state.settlements).every(town => hexDistance(town.cell, cell, state.world.width) > 2));
  const id = 'army.rival_caravan';
  state.armies[id] = { id, factionId: rival, name: 'Reed caravan', cell: foundingCell, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'found', factionId: rival, armyId: id, name: 'Seam Reach' })).toMatchObject({ ok: true });
  const reach = Object.values(state.settlements).find(town => town.name === 'Seam Reach')!;
  // The realm learns who holds the ground by seeing it, then its field company returns home.
  const witness = 'army.warband';
  state.armies[witness] = { id: witness, factionId: player, name: 'Glass warband', cell: seam, movement: 3, formations: [createArmyFormation(witness, 'unit.guard'), createArmyFormation(`${witness}.2`, 'unit.guard')] };
  refreshAuthoredSight(state);
  state.armies[witness]!.cell = host.cell; refreshAuthoredSight(state);
  state.factions[0]!.treasury = 40;
  let view = getObservation(state, player);
  expect(view.settlements.some(town => town.id === reach.id)).toBe(false);
  const goal = seamObjective(view, protectedFactions(view))!;
  expect(goal).toMatchObject({ seam: { cell: seam, pathId: 'path.rune' }, holderId: rival, settlementId: reach.id });
  expect(goal.distance).toBeLessThanOrEqual(SEAM_OBJECTIVE_RANGE);
  // Out of sight the seam draws the field army closer; nothing is settled beside a held seam.
  expect(seamExpeditionSite(view)).toBeNull();
  const turn = planTurnWithReasons(view);
  expect(turn.reasons.some(reason => reason.includes('objective of war'))).toBe(true);
  const march = turn.commands.find(command => command.type === 'moveTo' && command.armyId === witness) as { target: number } | undefined;
  expect(march).toBeDefined();
  expect(hexDistance(march!.target, seam, state.world.width)).toBeLessThan(hexDistance(host.cell, seam, state.world.width));
  expect(turn.commands.some(command => command.type === 'declareWar')).toBe(false);
  // Beside the hearth, in sight, the war is declared and the siege laid in one pass.
  state.armies[witness]!.cell = seam; state.armies[witness]!.movement = 3; refreshAuthoredSight(state);
  view = getObservation(state, player);
  const siege = planTurnWithReasons(view);
  expect(siege.commands).toContainEqual({ type: 'declareWar', factionId: player, targetFactionId: rival });
  expect(siege.commands).toContainEqual({ type: 'besiege', factionId: player, armyId: witness, settlementId: reach.id });
  for (const command of siege.commands.filter(command => command.type === 'declareWar' || command.type === 'besiege')) expect(applyCommand(state, command)).toMatchObject({ ok: true });
  expect(state.sieges[reach.id]).toBeDefined();
  // An oath, treaty or supply agreement protects the holder: no objective, no war.
  const bound = { ...view, diplomacy: { ...view.diplomacy, treaties: [{ id: 'treaty.1', parties: [player, rival], expiresTurn: view.turn + 10 }] } } as typeof view;
  expect(seamObjective(bound, protectedFactions(bound))).toBeNull();
  // A realm that holds no seam yet is not on the arcane road and makes no war for one.
  expect(seamObjective({ ...view, arcaneSites: view.arcaneSites.map(site => ({ ...site, controlled: false, settlementId: null })) }, protectedFactions(view))).toBeNull();
  // Nor does a realm already at war, or one without a caster who could seal the working.
  expect(seamObjective({ ...view, wars: ['faction.elsewhere'] }, protectedFactions(view))).toBeNull();
  expect(seamObjective({ ...view, progression: { ...view.progression, attunement: { ...view.progression.attunement!, casters: [] } } }, protectedFactions(view))).toBeNull();
});

test('rules 39: the study post is a hearth whose borders hold a seam, so a lodged Waykeeper actually studies; a caster lodged at a seamless archive hearth gets a studying colleague', () => {
  const state = attunementCampaign(), player = state.turnOwnerId, host = hostOf(state);
  for (const [id, character] of Object.entries(state.characters)) if (character.factionId === player) delete state.characters[id];
  host.buildings = host.buildings.filter(building => building !== 'building.archive');
  // A second hearth carries the archive but holds no seam.
  const site = state.world.terrain.findIndex((terrain, cell) => isPassable(terrain) && state.world.waterDepth[cell] === 0 && hexDistance(cell, host.cell, state.world.width) === 4
    && state.explored[player]!.has(cell) && Object.values(state.settlements).every(town => hexDistance(town.cell, cell, state.world.width) > 2)
    && arcaneSites(state.world).every(seam => hexDistance(seam.cell, cell, state.world.width) > 1));
  expect(site).toBeGreaterThan(0);
  const id = 'army.archive_caravan';
  state.armies[id] = { id, factionId: player, name: 'Archive caravan', cell: site, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'found', factionId: player, armyId: id, name: 'Archive Hold' })).toMatchObject({ ok: true });
  const hold = Object.values(state.settlements).find(town => town.name === 'Archive Hold')!;
  hold.buildings.push('building.archive');
  state.factions[0]!.treasury = 400;
  const loaded = deserializeGame(serializeGame(state));
  let view = getObservation(loaded, player);
  expect(view.progression.attunement!.paths.every(path => path.held)).toBe(true);
  expect(view.progression.attunement!.hostSettlementIds).toEqual([hold.id]);
  expect(view.arcaneSites.every(seam => seam.settlementId === host.id)).toBe(true);
  const plan = planCharacters(view, 400);
  expect(plan.commands).toContainEqual({ type: 'recruitCharacter', factionId: player, settlementId: host.id, definitionId: 'character.waykeeper' });
  expect(plan.commands.some(command => command.type === 'recruitCharacter' && command.settlementId === hold.id)).toBe(false);
  expect(plan.reasons.join(' ')).toContain('study');
  // A caster already lodged at the seamless archive hearth learns nothing there; a second is raised at the seam hearth and the first is not held in place.
  expect(applyCommand(loaded, { type: 'recruitCharacter', factionId: player, settlementId: hold.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
  view = getObservation(loaded, player);
  const second = planCharacters(view, 400);
  expect(second.commands).toContainEqual({ type: 'recruitCharacter', factionId: player, settlementId: host.id, definitionId: 'character.waykeeper' });
  expect(applyCommand(loaded, second.commands.find(command => command.type === 'recruitCharacter')!)).toMatchObject({ ok: true });
  // With a caster studying at the seam hearth, no third is wanted and the student stays lodged.
  view = getObservation(loaded, player);
  const third = planCharacters(view, 400);
  expect(third.commands.some(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper')).toBe(false);
  expect(third.commands.some(command => command.type === 'assignCharacter' && view.characters.find(character => character.id === command.characterId)?.location?.kind === 'settlement' && (view.characters.find(character => character.id === command.characterId)!.location as { settlementId: string }).settlementId === host.id)).toBe(false);
  // The student earns experience each turn; the colleague at the archive does not.
  for (let seat = 0; seat < loaded.factions.length * 3; seat++) expect(applyCommand(loaded, { type: 'endTurn', factionId: loaded.turnOwnerId })).toMatchObject({ ok: true });
  const student = Object.values(loaded.characters).find(character => character.factionId === player && character.location?.kind === 'settlement' && character.location.settlementId === host.id)!;
  const idle = Object.values(loaded.characters).find(character => character.factionId === player && character.location?.kind === 'settlement' && character.location.settlementId === hold.id)!;
  expect(student.experience).toBeGreaterThanOrEqual(3);
  expect(idle.experience).toBe(0);
});
