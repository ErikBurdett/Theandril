import { expect, test } from 'vitest';
import { neighbors, isPassable } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, getObservation, hirePriceOf } from '@theandril/sim';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { HIRE_RESERVE, planHire } from './hires';
import { planTurnWithReasons } from './index';

test('a realm at war with coin to spare hires the company a city-state quotes at its gate, keeping a reserve; a realm at peace or short of coin does not', () => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 });
  for (const faction of state.factions) faction.treasury = 200;
  const realm = state.turnOwnerId, city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
  const caravan = Object.values(state.armies).find(army => army.factionId === city && army.formations.some(item => item.unitId === 'unit.colonist'))!;
  const founded = applyCommand(state, { type: 'found', factionId: city, armyId: caravan.id, name: 'Gate City' });
  if (!founded.ok) throw new Error(founded.error);
  const hearth = Object.values(state.settlements).find(town => town.factionId === city)!;
  const gate = neighbors(hearth.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: realm, name: 'Buying company', cell: gate, movement: 1, formations: [{ ...createArmyFormation(id, 'unit.heavy_infantry'), id: `formation.${state.nextId++}` }] };
  refreshAuthoredSight(state);
  const price = hirePriceOf(state, city);
  // At peace: nothing.
  expect(planHire(getObservation(state, realm))).toBeNull();
  // At war, as the observation reports it; the hire itself needs no war, only the coin and the gate.
  const rival = state.factions.find(faction => faction.id !== realm && !faction.id.startsWith('citystate.'))!.id;
  state.factions.find(faction => faction.id === realm)!.treasury = price + HIRE_RESERVE;
  const view = { ...getObservation(state, realm), wars: [rival] };
  const plan = planHire(view)!;
  expect(plan.commands).toEqual([{ type: 'hireCompany', factionId: realm, cityStateId: city, armyId: id }]);
  expect(plan.reasons[0]).toContain(`Hire a company from ${state.factions.find(faction => faction.id === city)!.name}`);
  expect(planTurnWithReasons(view).commands).toContainEqual(plan.commands[0]);
  expect(planHire({ ...view, treasury: price + HIRE_RESERVE - 1 })).toBeNull();
  expect(planHire(view, new Set([id]))).toBeNull();
  expect(planHire({ ...view, hires: { quotes: [], hires: [] } })).toBeNull();
  expect(planHire({ ...view, hires: undefined })).toBeNull();
  const before = Object.keys(state.armies).length;
  const hired = applyCommand(state, plan.commands[0]!);
  expect(hired.ok, hired.error).toBe(true);
  expect(Object.keys(state.armies)).toHaveLength(before + 1);
  expect(planHire(getObservation(state, realm))).toBeNull();
});
