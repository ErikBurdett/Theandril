import { expect, test } from 'vitest';
import { BUILDINGS } from '@theandril/content';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
import { isPassable, neighbors, TERRAIN } from '@theandril/mapgen';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { navalCampaign, NAVAL_FIXTURE } from '../../test-fixtures/src/naval-fixture';
import { planTurn } from './index';
import { navalResearchChoice } from './naval';

test('long-term project savings preserve a researched first ocean scout’s real quote', () => {
  let state = navalCampaign();
  const factionId = state.turnOwnerId;
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); };
  state.armies[NAVAL_FIXTURE.enemyFleetId]!.cell = NAVAL_FIXTURE.shallowCell;
  for (const row of [8, 24]) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = { id, factionId, name: 'Reserve witness', cell: row * state.world.width + 8, movement: 3, formations: [createArmyFormation(id, 'unit.colonist')] };
    refreshAuthoredSight(state);
    issue({ type: 'found', factionId, armyId: id, name: `Reserve ${row}` });
  }
  for (const town of Object.values(state.settlements)) if (town.factionId === factionId) town.buildings = [...BUILDINGS.filter(building => !building.coastalOnly).map(building => building.id), ...(town.id === NAVAL_FIXTURE.homeId ? ['building.harbor'] : [])];
  issue({ type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  issue({ type: 'adoptInstitution', factionId, institutionId: 'institution.charter_compact' });
  state.factions[0]!.treasury = 200;
  state.factions[0]!.knowledge = 0;
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const view = getObservation(state, factionId);
  expect(view.settlements.filter(town => town.factionId === factionId)).toHaveLength(3);
  expect(view.productionOptions.find(option => option.itemId === 'unit.ocean_warship' && option.settlementId === NAVAL_FIXTURE.homeId)?.canQueue).toBe(true);
  const command = planTurn(view).find(command => command.type === 'queue' && command.itemId === 'unit.ocean_warship');
  expect(command).toEqual({ type: 'queue', factionId, settlementId: NAVAL_FIXTURE.homeId, itemId: 'unit.ocean_warship' });
  issue(command!);
  expect(state.factions[0]!.treasury).toBe(152);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('an isolated open-sea harbor preserves knowledge for its first researched ocean expedition', () => {
  let state = createGame({ seed: 748291, size: 'standard', factionCount: 2, pace: 'short' });
  const factionId = state.turnOwnerId;
  const issue = (command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); };
  // Authored coastal deployment on genuine broad-theater geography; the other
  // realm stays outside current sight and every research purchase is canonical.
  const shore = state.world.terrain.findIndex((terrain, cell) => isPassable(terrain) && neighbors(cell, state.world.width, state.world.height).some(next => state.world.terrain[next] === TERRAIN.water));
  for (const army of Object.values(state.armies)) if (army.factionId === factionId) army.cell = shore;
  state.factions[0]!.treasury = 2000; state.factions[0]!.knowledge = 500;
  refreshAuthoredSight(state);
  issue({ type: 'found', factionId, armyId: 'army.1', name: 'Discovery Quay' });
  const town = Object.values(state.settlements)[0]!;
  town.buildings = ['building.harbor', 'building.workshop']; town.population = 8;
  issue({ type: 'research', factionId, technologyId: 'technology.coastal_navigation' });
  issue({ type: 'research', factionId, technologyId: 'technology.cinder_masonry' });
  state.factions[0]!.knowledge = 79;
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const first = getObservation(state, factionId);
  expect(first.factions).toHaveLength(1);
  expect(navalResearchChoice(first)).toMatchObject({ id: 'technology.ocean_navigation', available: false, knowledgeCost: 80 });
  for (const command of planTurn(first)) issue(command);
  expect(state.factions[0]!.knowledge).toBe(79);
  issue({ type: 'endTurn', factionId });
  const before = state.factions[0]!.knowledge, plan = planTurn(getObservation(state, factionId));
  expect(plan).toContainEqual({ type: 'research', factionId, technologyId: 'technology.ocean_navigation' });
  for (const command of plan) issue(command);
  expect(state.factions[0]!.knowledge).toBe(before - 80);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});
