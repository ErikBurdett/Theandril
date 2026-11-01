import { expect, test } from 'vitest';
import { applyCommand, getObservation, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { planOffices } from './offices';

const appoint = (state: GameState, definitionId: string) => { const player = state.turnOwnerId, town = Object.values(state.settlements).find(item => item.factionId === player)!; const result = applyCommand(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId }); expect(result.ok, result.error).toBe(true); };

test('a vacant office goes to a character of its role sitting in a hearth with no company to join, never the realm’s only one of that role, one a turn', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  state.factions.find(item => item.id === player)!.treasury = 5000;
  appoint(state, 'character.surveyor');
  const lone = getObservation(state, player);
  // One surveyor: no office, whatever the road offers.
  expect(planOffices({ ...lone, characters: lone.characters.map(character => ({ ...character, assignmentOptions: [] })) })).toBeNull();
  appoint(state, 'character.surveyor');
  const view = getObservation(state, player);
  const idle = { ...view, characters: view.characters.map(character => ({ ...character, assignmentOptions: [] })) };
  const plan = planOffices(idle)!;
  expect(plan.commands).toHaveLength(1);
  expect(plan.commands[0]).toMatchObject({ type: 'holdOffice', factionId: player, officeId: 'office.keeper_of_the_roll' });
  const holder = view.characters.find(character => character.id === (plan.commands[0] as { holderId: string }).holderId)!;
  expect(holder).toMatchObject({ role: 'surveyor', factionId: player, dead: false });
  expect(holder.location?.kind).toBe('settlement');
  expect(plan.reasons[0]).toContain(`${holder.name} takes office as Keeper of the Roll`);
  // A character with a company to join, or one the turn already ordered, is left for the road.
  const riding = { ...idle, characters: idle.characters.map(character => character.id === holder.id ? { ...character, assignmentOptions: [{ armyId: 'army.1', label: 'x', canAssign: true, blocker: null }] } : character) };
  expect((planOffices(riding)?.commands[0] as { holderId?: string } | undefined)?.holderId).not.toBe(holder.id);
  expect((planOffices(idle, new Set([holder.id]))?.commands[0] as { holderId?: string } | undefined)?.holderId).not.toBe(holder.id);
  // Taken for real; then nothing vacant for a surveyor, and nothing for other realms' offices.
  expect(applyCommand(state, plan.commands[0]!).ok).toBe(true);
  const after = getObservation(state, player);
  expect(after.offices!.find(item => item.officeId === 'office.keeper_of_the_roll')!.holderCharacterId).toBe(holder.id);
  expect(planOffices({ ...after, characters: after.characters.map(character => ({ ...character, assignmentOptions: [] })) })?.commands.some(command => command.type === 'holdOffice' && command.officeId === 'office.keeper_of_the_roll')).toBeFalsy();
  expect(planOffices({ ...view, offices: undefined })).toBeNull();
});
