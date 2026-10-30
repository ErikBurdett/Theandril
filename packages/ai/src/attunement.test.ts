import { expect, test } from 'vitest';
import { ATTUNEMENT_VICTORY, TECHNOLOGIES } from '@theandril/content';
import { applyCommand, getObservation, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { planTurnWithReasons } from './index';
import { planProgression } from './progression';
import { claimArcaneSeam, GLASS_APPROACH_RANGE, planArcaneSurvey, planGlassApproach } from './arcane';
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
