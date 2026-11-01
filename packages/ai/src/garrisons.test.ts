import { expect, test } from 'vitest';
import { isPassable, neighbors } from '@theandril/mapgen';
import { applyCommand, getObservation, type GameCommand, type GameState } from '@theandril/sim';
import { indexes } from '../../sim/src/visibility';
import { CONQUEST_FIXTURE, subjectCampaign } from '../../test-fixtures/src/conquest-fixture';
import { GARRISON_UNREST, planGarrisons } from './garrisons';
import { planTurnWithReasons } from './index';

const player = CONQUEST_FIXTURE.playerFactionId, rival = CONQUEST_FIXTURE.enemyFactionId, townId = CONQUEST_FIXTURE.settlementId, armyId = CONQUEST_FIXTURE.playerArmyId;
const issue = (state: GameState, command: GameCommand) => { const result = applyCommand(state, command); expect(result.ok, result.error).toBe(true); return result; };
/** Reedwatch captured by occupation with the vanguard standing in it, the founder still holding Reedfold. */
function occupied(): GameState {
  const state = subjectCampaign();
  issue(state, { type: 'declareWar', factionId: player, targetFactionId: rival }); issue(state, { type: 'besiege', factionId: player, armyId, settlementId: townId });
  for (let turn = 0; turn < 3; turn++) issue(state, { type: 'endTurn', factionId: player });
  issue(state, { type: 'assault', factionId: player, settlementId: townId }); issue(state, { type: 'autoResolveBattle', factionId: player });
  issue(state, { type: 'resolveCapture', factionId: player, settlementId: townId, outcome: 'occupy' });
  issue(state, { type: 'endTurn', factionId: player });
  return state;
}

test('a company standing in a conquered hearth whose lanes may rise is held there, and one is sent in when none stands there', () => {
  const state = occupied(), town = state.settlements[townId]!;
  // Quiet lanes: nothing to hold.
  expect(planGarrisons(getObservation(state, player), new Set())).toEqual({ commands: [], reasons: [], heldArmyIds: new Set() });
  // Restless lanes with the vanguard inside: the vanguard is held, no order.
  state.unrest = [{ settlementId: townId, level: GARRISON_UNREST }];
  let view = getObservation(state, player);
  expect(view.unrest!.find(item => item.settlementId === townId)!.rising).toBe('Reedbound Council');
  const standing = planGarrisons(view, new Set());
  expect(standing.commands).toEqual([]);
  expect([...standing.heldArmyIds]).toEqual([armyId]);
  expect(standing.reasons[0]).toContain('holds Reedwatch');
  expect(planTurnWithReasons(view).commands.some(command => (command.type === 'moveTo' || command.type === 'queueMovement') && command.armyId === armyId)).toBe(false);
  // The vanguard marched out: it is ordered back by a queued road and held.
  const away = neighbors(town.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !indexes(state).settlements.get(cell))!;
  issue(state, { type: 'moveTo', factionId: player, armyId, target: away });
  view = getObservation(state, player);
  const sent = planGarrisons(view, new Set());
  expect(sent.commands).toEqual([{ type: 'queueMovement', factionId: player, armyId, target: town.cell }]);
  expect(sent.reasons[0]).toContain('garrison Reedwatch');
  expect(planTurnWithReasons(view).commands).toContainEqual(sent.commands[0]);
  // A company another planner holds is not taken; below the watch level, or once the hearth is garrisoned by the rule's reading, nothing is ordered.
  expect(planGarrisons(view, new Set([armyId])).commands).toEqual([]);
  state.unrest = [{ settlementId: townId, level: GARRISON_UNREST - 1 }];
  expect(planGarrisons(getObservation(state, player), new Set()).commands).toEqual([]);
  // The order is legal and brings the company home.
  state.unrest = [{ settlementId: townId, level: GARRISON_UNREST }];
  issue(state, sent.commands[0]!);
  issue(state, { type: 'endTurn', factionId: player });
  expect(state.armies[armyId]!.cell).toBe(town.cell);
  expect(town.factionId).toBe(player);
});
