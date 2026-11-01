import { expect, test } from 'vitest';
import { applyCommand, getObservation, type GameState } from '@theandril/sim';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { planOffices } from './offices';
import { OFFICE_HOLDER_TREASURY, planCharacters } from './characters';

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

test('a sitting surveyor with a company to join takes the office once another surveyor rides, and the character planner appoints a second surveyor to sit when the office is vacant and the purse allows', () => {
  const state = attunementCampaign(), player = state.turnOwnerId;
  state.factions.find(item => item.id === player)!.treasury = 5000;
  appoint(state, 'character.surveyor');
  const lone = getObservation(state, player);
  // One surveyor on the road: the planner wants a second to sit.
  const seat = planCharacters(lone, 400);
  const appointment = seat.commands.find(command => command.type === 'recruitCharacter' && command.definitionId === 'character.surveyor');
  expect(appointment).toBeDefined();
  expect(seat.reasons.some(reason => reason.includes('to sit as Keeper of the Roll'))).toBe(true);
  // Not when the purse is short, nor once the office is held.
  expect(planCharacters({ ...lone, treasury: OFFICE_HOLDER_TREASURY - 1 }, 400).commands.some(command => command.type === 'recruitCharacter' && command.definitionId === 'character.surveyor')).toBe(false);
  expect(applyCommand(state, appointment!).ok).toBe(true);
  const view = getObservation(state, player);
  const surveyors = view.characters.filter(character => character.role === 'surveyor');
  expect(surveyors).toHaveLength(2);
  // Both sit in the hearth with a company to join: nothing yet, as before.
  const both = { ...view, characters: view.characters.map(character => character.role === 'surveyor' ? { ...character, assignmentOptions: [{ armyId: 'army.1', label: 'x', canAssign: true, blocker: null }] } : character) };
  expect(planOffices(both)).toBeNull();
  // One rides: the sitting one takes the office though a company waits for it.
  const [rider, sitter] = surveyors;
  const riding = { ...both, characters: both.characters.map(character => character.id === rider!.id ? { ...character, location: { kind: 'army' as const, armyId: 'army.1' } } : character) };
  const plan = planOffices(riding)!;
  expect(plan.commands[0]).toMatchObject({ type: 'holdOffice', officeId: 'office.keeper_of_the_roll', holderId: sitter!.id });
  expect(applyCommand(state, { type: 'holdOffice', factionId: player, officeId: 'office.keeper_of_the_roll', holderId: sitter!.id }).ok).toBe(true);
  const held = getObservation(state, player);
  expect(held.legitimacy).toMatchObject({ level: 3, standing: 'strong' });
  expect(planCharacters(held, 400).commands.some(command => command.type === 'recruitCharacter' && command.definitionId === 'character.surveyor')).toBe(false);
});
