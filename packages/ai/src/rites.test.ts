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

test('a besieger with a qualified riding caster breaks the ward instead of lifting the siege (rules 41)', () => {
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  const column = Object.values(state.armies).find(army => army.factionId === rival.id)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  column.movement = 3; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival.id, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival.id, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  expect(applyCommand(state, { type: 'performRite', factionId: player, characterId: caster.id, riteId: 'rite.seam_warding' })).toMatchObject({ ok: true });
  const hearth = Object.values(state.settlements).find(town => town.factionId === rival.id)!;
  rival.treasury += 200; state.resources.stockpiles[rival.id] = { ...state.resources.stockpiles[rival.id], 'resource.ashglass': 10 };
  expect(applyCommand(state, { type: 'recruitCharacter', factionId: rival.id, settlementId: hearth.id, definitionId: 'character.waykeeper' })).toMatchObject({ ok: true });
  const breaker = Object.values(state.characters).find(item => item.factionId === rival.id && item.definitionId === 'character.waykeeper')!;
  breaker.aptitudes = { 'path.flame': 1, 'path.rune': 2 }; breaker.location = { kind: 'army', armyId: column.id };
  state.arcaneResearch[rival.id] = [...new Set([...(state.arcaneResearch[rival.id] ?? []), 'arcane.rune_binding', 'arcane.unbinding'])];
  const plan = planTurnWithReasons(getObservation(state, rival.id));
  expect(plan.commands).toEqual([{ type: 'performRite', factionId: rival.id, characterId: breaker.id, riteId: 'rite.ward_breaking' }]);
  expect(plan.reasons[0]).toContain('the ward can be broken');
  expect(applyCommand(state, plan.commands[0]!)).toMatchObject({ ok: true });
  expect(state.wards).toEqual([]);
  // (The journey reads one turn of recovery already ticked by the time the player looks.)
  // With the ward gone, the ordinary siege judgement returns: an outmatched column holds its blockade rather than lifting it for a ward.
  const after = planTurnWithReasons(getObservation(state, rival.id));
  expect(after.commands.some(command => command.type === 'liftSiege' || command.type === 'performRite')).toBe(false);
});

test('a Flame-only caster kindles its besieged hearth and a besieger that burns before kindled walls lifts the siege (rules 42)', () => {
  const state = attunementCampaign(), player = state.turnOwnerId, rival = state.factions[1]!.id;
  const host = Object.values(state.settlements).find(town => town.factionId === player)!;
  state.resources.stockpiles[player]!['resource.ashglass'] = 20;
  const caster = Object.values(state.characters).find(item => item.factionId === player && item.definitionId === 'character.waykeeper')!;
  caster.aptitudes = { 'path.flame': 2 };
  const column = Object.values(state.armies).find(army => army.factionId === rival)!;
  column.cell = neighbors(host.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell] ?? 0) && Object.values(state.armies).every(army => army.cell !== cell))!;
  column.movement = 3; refreshAuthoredSight(state);
  expect(applyCommand(state, { type: 'declareWar', factionId: rival, targetFactionId: player })).toMatchObject({ ok: true });
  expect(applyCommand(state, { type: 'besiege', factionId: rival, armyId: column.id, settlementId: host.id })).toMatchObject({ ok: true });
  const plan = planTurnWithReasons(getObservation(state, player));
  expect(plan.commands).toEqual([{ type: 'performRite', factionId: player, characterId: caster.id, riteId: 'rite.seam_kindling' }]);
  expect(applyCommand(state, plan.commands[0]!)).toMatchObject({ ok: true });
  const besieger = planTurnWithReasons(getObservation(state, rival));
  expect(besieger.commands).toEqual([{ type: 'liftSiege', factionId: rival, settlementId: host.id }]);
  expect(besieger.reasons[0]).toContain('kindled');
});
