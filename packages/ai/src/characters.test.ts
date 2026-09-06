import { expect, test } from 'vitest';
import { applyCommand, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { CHARACTER_FIXTURE, characterCampaign } from '../../test-fixtures/src/character-fixture';
import { planCharacters } from './characters';
import { planTurn } from './index';

function issue(state: GameState, command: GameCommand): void {
  const result = applyCommand(state, command);
  expect(result.ok, `${JSON.stringify(command)}: ${result.error}`).toBe(true);
}

test('AI funds observed appointments, attaches specialists, completes refits and spends earned experience with exact saved continuation', () => {
  const state = characterCampaign();
  let mirror: GameState | undefined;
  const types = new Set<string>();
  const eventTypes = new Set<string>();
  const beforeStrength = state.armies[CHARACTER_FIXTURE.armyId]!.formations[0]!.strength;
  const submit = (command: GameCommand) => {
    const result = applyCommand(state, command);
    expect(result.ok, `${JSON.stringify(command)}: ${result.error}`).toBe(true);
    if (mirror) expect(applyCommand(mirror, command)).toEqual(result);
    types.add(command.type);
    for (const event of result.events) eventTypes.add(event.type);
  };
  for (let round = 0; round < 12; round++) {
    for (let pass = 0; pass < 4; pass++) {
      const view = getObservation(state, state.turnOwnerId);
      const before = stateHash(state);
      const original = structuredClone(view);
      const plan = planCharacters(view, 100);
      expect(plan.commands).toEqual(planCharacters(structuredClone(view), 100).commands);
      expect(view).toEqual(original); expect(stateHash(state)).toBe(before);
      expect(plan.coinSpent).toBeGreaterThanOrEqual(0); expect(plan.coinSpent).toBeLessThanOrEqual(100);
      expect(plan.commands.length).toBeLessThanOrEqual(6);
      for (const command of plan.commands) submit(command);
    }
    if (round === 0) {
      expect(Object.values(state.characters).some(character => character.mission)).toBe(true);
      mirror = deserializeGame(serializeGame(state));
    }
    submit({ type: 'endTurn', factionId: state.turnOwnerId });
  }
  expect(types).toEqual(new Set(['recruitCharacter', 'assignCharacter', 'startCharacterMission', 'promoteCharacter', 'endTurn']));
  expect(eventTypes.has('character_mission_completed')).toBe(true);
  expect(Object.values(state.characters).some(character => character.definitionId === 'character.engineer' && character.skillId === 'skill.fieldcraft')).toBe(true);
  expect(state.armies[CHARACTER_FIXTURE.armyId]!.formations[0]!.strength).toBeGreaterThan(beforeStrength);
  expect(stateHash(mirror!)).toBe(stateHash(state));
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('zero discretionary budget never fabricates appointments or paid missions', () => {
  const state = characterCampaign();
  const plan = planCharacters(getObservation(state, state.turnOwnerId), 0);
  expect(plan.commands).toEqual([]); expect(plan.coinSpent).toBe(0);
});
test('AI follows acquired prerequisites and prefers battlecraft for a small army without guessing eligibility', () => {
  const state = characterCampaign();
  issue(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.marshal' });
  const marshal = Object.values(state.characters)[0]!;
  issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: marshal.id, armyId: CHARACTER_FIXTURE.armyId });
  marshal.experience = 100;
  for (const expected of ['skill.decisive', 'skill.measured_advance', 'skill.muster_rolls', 'skill.field_orders']) {
    const view = getObservation(state, state.turnOwnerId);
    const plan = planCharacters(view, 0);
    const command = plan.commands.find(item => item.type === 'promoteCharacter');
    expect(command).toMatchObject({ skillId: expected });
    issue(state, command!);
  }
  expect(marshal.learnedSkillIds).toEqual(['skill.field_orders', 'skill.measured_advance', 'skill.muster_rolls']);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});

test('full AI respects active mission carriers and never merges two commanded armies', () => {
  const state = characterCampaign();
  const reserve = Object.values(state.armies).find(army => army.name === CHARACTER_FIXTURE.reserveName)!;
  for (const armyId of [CHARACTER_FIXTURE.armyId, reserve.id]) {
    issue(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.marshal' });
    const character = Object.values(state.characters).find(character => character.definitionId === 'character.marshal' && character.location?.kind === 'settlement')!;
    issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: character.id, armyId });
  }
  issue(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.engineer' });
  const engineer = Object.values(state.characters).find(character => character.definitionId === 'character.engineer')!;
  issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: engineer.id, armyId: CHARACTER_FIXTURE.armyId });
  issue(state, { type: 'startCharacterMission', factionId: state.turnOwnerId, characterId: engineer.id, missionId: 'mission.refit' });
  const view = getObservation(state, state.turnOwnerId);
  const plans = planTurn(view);
  expect(plans.some(command => ['move', 'moveTo', 'mergeArmies', 'transferFormations', 'splitArmy'].includes(command.type) && ('armyId' in command && command.armyId === CHARACTER_FIXTURE.armyId || 'sourceArmyId' in command && (command.sourceArmyId === CHARACTER_FIXTURE.armyId || command.targetArmyId === CHARACTER_FIXTURE.armyId)))).toBe(false);
  for (const command of plans) issue(state, command);
  expect(state.characters[engineer.id]!.mission?.definitionId).toBe('mission.refit');
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});
