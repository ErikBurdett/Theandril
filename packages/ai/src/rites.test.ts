import { expect, test } from 'vitest';
import { applyCommand, getObservation } from '@theandril/sim';
import { isPassable, neighbors } from '@theandril/mapgen';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { planTurnWithReasons } from './index';
import { planRites } from './rites';

test('a besieged realm wards its hearth from the quoted rite and a besieger lifts a siege it cannot storm (rules 40)', () => {
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  // Peace: nothing to ward, nothing proposed.
  expect(planRites(getObservation(state, player))).toBeNull();
  const gate = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  column.cell = gate; column.movement = 3;
  refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  const plan = planTurnWithReasons(getObservation(state, player));
  expect(plan.commands).toEqual([{ type: 'performRite', factionId: player, characterId: expect.stringMatching(/^character\./), riteId: 'rite.seam_warding' }]);
  expect(plan.reasons[0]).toContain('the hearth is besieged');
  expect(applyCommand(state, plan.commands[0]!)).toMatchObject({ ok: true });
  expect(planRites(getObservation(state, player))).toBeNull();
  // The besieger reads warded walls it cannot storm and lifts the siege.
  const besieger = planTurnWithReasons(getObservation(state, rival));
  expect(besieger.commands).toEqual([{ type: 'liftSiege', factionId: rival, settlementId: host.id }]);
  expect(besieger.reasons[0]).toContain('warded');
});
