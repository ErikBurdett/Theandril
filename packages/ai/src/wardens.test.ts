import { expect, test } from 'vitest';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, getObservation, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { planTurnWithReasons } from './index';
import { planCharacters } from './characters';
import { planRiteResearch, planWardenReturn, wardensWanted } from './wardens';

/** The brink fixture at war: the player's host holds both seams and the rival's column stands at its gate, not yet blockading. */
function threatenedAtWar(): { state: GameState; player: string; rival: string; hostId: string } {
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  column.movement = 3; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  return { state, player, rival, hostId: host.id };
}

test('a realm holding a seam researches the rite discovery its caster could use, and only then', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  caster.aptitudes = { 'path.rune': 1 };
  // Everything is researched on the brink: nothing to buy.
  expect(planRiteResearch(getObservation(state, player))).toBeNull();
  state.arcaneResearch[player] = state.arcaneResearch[player]!.filter(id => id !== 'arcane.rune_binding');
  expect(planRiteResearch(getObservation(state, player))).toMatchObject({ command: { type: 'researchArcane', factionId: player, discoveryId: 'arcane.rune_binding' } });
  // Without a caster of the path, the discovery waits.
  caster.aptitudes = { 'path.flame': 1 };
  expect(planRiteResearch(getObservation(state, player))).toBeNull();
  // Without the seam, nothing is worth buying either.
  caster.aptitudes = { 'path.rune': 1 };
  state.arcaneSurveys[player] = [];
  expect(planRiteResearch(getObservation(state, player))).toBeNull();
});

test('at war, a realm with a seam and no caster appoints a Waykeeper at the seam hearth and keeps it lodged there', () => {
  const { state, player, hostId } = threatenedAtWar();
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  expect(wardensWanted(getObservation(state, player))).toBe(true);
  // The lodged caster is not handed to a co-located company.
  const kept = planCharacters(getObservation(state, player), 500);
  expect(kept.commands.filter(command => command.type === 'assignCharacter' && command.characterId === caster.id)).toEqual([]);
  // Without any caster, the realm appoints one at the seam hearth rather than elsewhere.
  caster.dead = true;
  const plan = planCharacters(getObservation(state, player), 500);
  const appointment = plan.commands.find(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper');
  expect(appointment).toMatchObject({ settlementId: hostId });
  expect(plan.reasons.some(reason => reason.includes("work its seam's rite"))).toBe(true);
  // At peace the warden is not wanted.
  expect(wardensWanted({ ...getObservation(state, player), wars: [] })).toBe(false);
});

test('a threatened seam hearth calls its riding qualified caster home and lodges it at the gate, but a blockade is too late', () => {
  const { state, player, rival, hostId } = threatenedAtWar();
  const host = state.settlements[hostId]!;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  const escort = Object.values(state.armies).find(army => army.factionId === player)!;
  // The caster rides two hexes out with the realm's own company.
  escort.cell = [...Array(state.world.terrain.length).keys()].find(cell => cell !== host.cell && isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell) && Object.values(state.settlements).every(town => town.cell !== cell) && neighbors(host.cell, state.world.width, state.world.height).some(near => neighbors(near, state.world.width, state.world.height).includes(cell)))!;
  caster.location = { kind: 'army', armyId: escort.id };
  refreshAuthoredSight(state);
  const away = planWardenReturn(getObservation(state, player));
  expect(away.commands).toEqual([{ type: 'queueMovement', factionId: player, armyId: escort.id, target: host.cell }]);
  expect([...away.heldArmyIds]).toEqual([escort.id]);
  expect(planTurnWithReasons(getObservation(state, player)).commands).toContainEqual({ type: 'queueMovement', factionId: player, armyId: escort.id, target: host.cell });
  // Standing at the hearth, the caster lodges; lodged, nothing more is asked.
  escort.cell = host.cell; refreshAuthoredSight(state);
  const home = planWardenReturn(getObservation(state, player));
  expect(home.commands).toEqual([{ type: 'unassignCharacter', factionId: player, characterId: caster.id, settlementId: hostId }]);
  expect(applyCommand(state, home.commands[0]!)).toMatchObject({ ok: true });
  expect(planWardenReturn(getObservation(state, player)).commands).toEqual([]);
  // With ashglass in store, the quoted rite now stands ready for the next planning pass.
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  expect(getObservation(state, player).rites!.some(rite => rite.canPerform)).toBe(true);
  // Once the column blockades the hearth, nothing can lodge there: the call is not repeated.
  caster.location = { kind: 'army', armyId: escort.id }; escort.cell = host.cell; refreshAuthoredSight(state);
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: hostId })).toMatchObject({ ok: true });
  expect(planWardenReturn(getObservation(state, player)).commands).toEqual([]);
});

test('when a battle stack could carry a caster but none stands at a hearth, the seam hearth still gets its warden', () => {
  const { state, player, hostId } = threatenedAtWar();
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  caster.dead = true;
  // A four-company field army far from any hearth makes the realm want a battle caster it cannot appoint anywhere.
  const escort = Object.values(state.armies).find(army => army.factionId === player)!;
  const host = state.settlements[hostId]!;
  escort.cell = [...Array(state.world.terrain.length).keys()].find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.settlements).every(town => town.cell !== cell) && Object.values(state.armies).every(army => army.cell !== cell) && neighbors(host.cell, state.world.width, state.world.height).some(near => neighbors(near, state.world.width, state.world.height).includes(cell)))!;
  escort.formations = [0, 1, 2, 3].map(() => createArmyFormation(`army.${state.nextId++}`, 'unit.guard'));
  refreshAuthoredSight(state);
  const plan = planCharacters(getObservation(state, player), 500);
  const appointment = plan.commands.find(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper');
  expect(appointment).toMatchObject({ settlementId: hostId });
  expect(plan.reasons.some(reason => reason.includes("work its seam's rite"))).toBe(true);
});
