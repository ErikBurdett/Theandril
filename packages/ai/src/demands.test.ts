import { expect, test } from 'vitest';
import { neighbors, isPassable } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, createGame, getObservation } from '@theandril/sim';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { DEMAND_PURSE, planDemand } from './demands';
import { answerPatronage } from './diplomacy';
import { planTurnWithReasons } from './index';

test('a realm short of coin presses the city-state its company stands beside, a rich one does not, and a pressed city-state refuses its patronage', () => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 4, cityStateCount: 1, pace: 'short', generatorVersion: 4 });
  for (const faction of state.factions) faction.treasury = 200;
  const realm = state.turnOwnerId, city = state.factions.find(faction => faction.id.startsWith('citystate.'))!.id;
  // Every seat founds its hearth from its caravan on turn 1; the city-state's goes up first here.
  const caravan = Object.values(state.armies).find(army => army.factionId === city && army.formations.some(item => item.unitId === 'unit.colonist'))!;
  const founded = applyCommand(state, { type: 'found', factionId: city, armyId: caravan.id, name: 'Gate City' });
  if (!founded.ok) throw new Error(founded.error);
  const hearth = Object.values(state.settlements).find(town => town.factionId === city)!;
  // Rules 77: a clanhold pays half and a camp three quarters; three more households keep the quote above the AI's minimum whatever the kind drawn.
  hearth.population = 4;
  const gate = neighbors(hearth.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const id = `army.${state.nextId++}`;
  state.armies[id] = { id, factionId: realm, name: 'Pressing company', cell: gate, movement: 1, formations: [0, 1, 2].map(() => ({ ...createArmyFormation(id, 'unit.heavy_infantry'), id: `formation.${state.nextId++}` })) };
  refreshAuthoredSight(state);
  state.factions.find(faction => faction.id === realm)!.treasury = DEMAND_PURSE - 1;
  const view = getObservation(state, realm);
  const plan = planDemand(view)!;
  expect(plan.commands).toEqual([{ type: 'demandTribute', factionId: realm, cityStateId: city, armyId: id }]);
  expect(plan.reasons[0]).toContain('Press');
  expect(planTurnWithReasons(view).commands).toContainEqual(plan.commands[0]);
  expect(planDemand({ ...view, treasury: DEMAND_PURSE })).toBeNull();
  expect(planDemand(view, new Set([id]))).toBeNull();
  expect(planDemand({ ...view, tribute: { quotes: [], demands: [] } })).toBeNull();
  // The demand is legal and, once made, the pressed city-state refuses the realm's patronage for forty turns.
  expect(applyCommand(state, plan.commands[0]!).ok).toBe(true);
  expect(applyCommand(state, { type: 'proposeClient', factionId: realm, targetFactionId: city, terms: { giftCoin: 40, tributeCoin: 6, termTurns: 12 } }).ok).toBe(true);
  const answer = answerPatronage(getObservation(state, city))!;
  expect(answer.commands[0]).toMatchObject({ type: 'respondClient', factionId: city, accept: false });
});
