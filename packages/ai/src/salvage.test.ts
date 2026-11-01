import { expect, test } from 'vitest';
import { hexDistance, isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, getObservation, type GameCommand, type GameState } from '@theandril/sim';
import { indexes } from '../../sim/src/visibility';
import { CONQUEST_FIXTURE, conquestCampaign } from '../../test-fixtures/src/conquest-fixture';
import { planTurnWithReasons, SALVAGE_REACH } from './index';

const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId, townId = CONQUEST_FIXTURE.settlementId, armyId = CONQUEST_FIXTURE.playerArmyId;
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };

test('a free company walks toward untouched ruins in reach and stays on them until the salvage is taken', () => {
  const state = conquestCampaign();
  issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'besiege', factionId: player, armyId, settlementId: townId });
  for (let turn = 0; turn < 3; turn++) issue(state, { type: 'endTurn', factionId: player });
  issue(state, { type: 'assault', factionId: player, settlementId: townId }); issue(state, { type: 'autoResolveBattle', factionId: player });
  issue(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'raze' });
  issue(state, { type: 'endTurn', factionId: player });
  const ruin = state.ruins[townId]!;
  expect(ruin.salvagedByFactionId).toBe(player);
  // Pretend the salvage is still there and march the vanguard two hexes off: the plan brings it closer.
  delete ruin.salvagedByFactionId;
  const first = neighbors(ruin.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !indexes(state).settlements.get(cell))!;
  const second = neighbors(first, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && hexDistance(cell, ruin.cell, state.world.width) === 2)!;
  issue(state, { type: 'moveTo', factionId: player, armyId, target: second });
  expect(state.armies[armyId]!.cell).toBe(second);
  const view = getObservation(state, player);
  expect(view.ruins.find(item => item.id === townId)!.salvagedByFactionId).toBeUndefined();
  const plan = planTurnWithReasons(view);
  const move = plan.commands.find(command => command.type === 'moveTo' && command.armyId === armyId);
  expect(move).toBeDefined();
  expect(hexDistance((move as { target: number }).target, ruin.cell, state.world.width)).toBeLessThan(2);
  // Beyond reach the ruins draw nothing; salvaged ruins draw nothing.
  const far = { ...view, ruins: view.ruins.map(item => ({ ...item, cell: (item.cell + (SALVAGE_REACH + 2) * view.width) % (view.width * view.height) })) };
  const farMove = planTurnWithReasons(far).commands.find(command => command.type === 'moveTo' && command.armyId === armyId);
  expect(farMove === undefined || hexDistance((farMove as { target: number }).target, ruin.cell, state.world.width) >= hexDistance(second, ruin.cell, state.world.width)).toBe(true);
  const taken = { ...view, ruins: view.ruins.map(item => ({ ...item, salvagedByFactionId: rival })) };
  const takenMove = planTurnWithReasons(taken).commands.find(command => command.type === 'moveTo' && command.armyId === armyId);
  expect(takenMove === undefined || (takenMove as { target: number }).target !== ruin.cell).toBe(true);
});
