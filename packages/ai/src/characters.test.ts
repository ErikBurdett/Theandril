import { expect, test } from 'vitest';
import { applyCommand, applyCommandForVersion, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { CHARACTER_FIXTURE, characterCampaign } from '../../test-fixtures/src/character-fixture';
import { attunementCampaign } from '../../test-fixtures/src/victory-fixture';
import { planCharacters } from './characters';
import { planTurn, surveysBeforeMarches } from './index';
import { characterLeadership } from '../../sim/src/characters';

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
  // Rules 64 would make this first appointment the culture's notable figure, already specialized; an ordinary officer is appointed under rules 63 so the scenario keeps a blank specialization (notables.test.ts covers the figures).
  expect(applyCommandForVersion(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.marshal' }, 63).ok).toBe(true);
  const marshal = Object.values(state.characters)[0]!;
  issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: marshal.id, armyId: CHARACTER_FIXTURE.armyId });
  marshal.experience = 100;
  for (const expected of ['skill.decisive', 'skill.measured_advance', 'skill.witnessed_assault', 'skill.muster_rolls', 'skill.field_orders']) {
    const view = getObservation(state, state.turnOwnerId);
    const plan = planCharacters(view, 0);
    const command = plan.commands.find(item => item.type === 'promoteCharacter');
    expect(command).toMatchObject({ skillId: expected });
    issue(state, command!);
  }
  expect(marshal.learnedSkillIds).toEqual(['skill.field_orders', 'skill.measured_advance', 'skill.muster_rolls', 'skill.witnessed_assault']);
  expect(marshal.experience).toBe(4);
  expect(characterLeadership(marshal, 16).attack).toBe(5);
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

test('full AI trains an experienced company before starting the same army’s paid refit', () => {
  const state = characterCampaign();
  const factionId = state.turnOwnerId, army = state.armies[CHARACTER_FIXTURE.armyId]!;
  issue(state, { type: 'recruitCharacter', factionId, settlementId: CHARACTER_FIXTURE.homeId, definitionId: 'character.engineer' });
  const engineer = Object.values(state.characters).find(character => character.definitionId === 'character.engineer')!;
  issue(state, { type: 'assignCharacter', factionId, characterId: engineer.id, armyId: army.id });
  // Explicit experienced/damaged-company setup; battle-earned balances are
  // independently covered by sim/development.test.ts and the browser battle.
  const formationId = getObservation(state, factionId).development!.candidates.find(entity => entity.scope === 'formation' && entity.armyId === army.id)!.entityId;
  state.development.formations[formationId] = { experience: 3, nodeIds: [] };
  const mirror = deserializeGame(serializeGame(state));
  const plan = planTurn(getObservation(state, factionId));
  const training = plan.findIndex(command => command.type === 'develop' && command.entityId === formationId);
  const refit = plan.findIndex(command => command.type === 'startCharacterMission' && command.characterId === engineer.id && command.missionId === 'mission.refit');
  expect(training).toBeGreaterThanOrEqual(0); expect(refit).toBeGreaterThan(training);
  for (const command of plan) { issue(state, command); issue(mirror, command); }
  expect(state.development.formations[formationId]).toEqual({ experience: 0, nodeIds: ['training.field_habits'] });
  expect(state.characters[engineer.id]!.mission?.definitionId).toBe('mission.refit');
  expect(stateHash(mirror)).toBe(stateHash(state));
});

test('a survey and the assignment that carries its surveyor are issued before any march, so a march cannot chart the surveyed ground first, and the ordering keeps every other order in place', () => {
  // A synthetic batch: the carrier's training and depot stood after the first march and are hoisted before the survey; nothing else moves.
  const synthetic = surveysBeforeMarches({ characters: [{ id: 'char.1', location: { kind: 'army', armyId: 'army.9' } }], armies: [{ id: 'army.9', formations: [{ id: 'formation.9' }] }] } as unknown as Parameters<typeof surveysBeforeMarches>[0], [
    { type: 'research', factionId: 'f', technologyId: 't' }, { type: 'queueMovement', factionId: 'f', armyId: 'army.2', target: 5 }, { type: 'develop', factionId: 'f', scope: 'formation', entityId: 'formation.9', nodeId: 'n' },
    { type: 'startCharacterMission', factionId: 'f', characterId: 'char.1', missionId: 'mission.survey' }, { type: 'buildDepot', factionId: 'f', armyId: 'army.9' }, { type: 'moveTo', factionId: 'f', armyId: 'army.3', target: 7 },
  ] as GameCommand[]);
  expect(synthetic.map(command => command.type)).toEqual(['research', 'develop', 'buildDepot', 'startCharacterMission', 'queueMovement', 'moveTo']);
  const state = attunementCampaign(), player = state.turnOwnerId;
  state.factions.find(item => item.id === player)!.treasury = 5000;
  const town = Object.values(state.settlements).find(item => item.factionId === player)!;
  const before = new Set(Object.keys(state.characters));
  issue(state, { type: 'recruitCharacter', factionId: player, settlementId: town.id, definitionId: 'character.surveyor' });
  const surveyor = Object.values(state.characters).find(item => !before.has(item.id))!;
  issue(state, { type: 'assignCharacter', factionId: player, characterId: surveyor.id, armyId: Object.values(state.armies).find(army => army.factionId === player)!.id });
  let surveys = 0;
  for (let round = 0; round < 8 && !state.victory; round++) {
    const commands = planTurn(getObservation(state, player));
    const survey = commands.findIndex(command => command.type === 'startCharacterMission' && command.missionId === 'mission.survey');
    if (survey >= 0) {
      surveys++;
      // Before every march of the batch; the orders that stand before it never move a company.
      expect(commands.slice(0, survey).every(command => command.type !== 'moveTo' && command.type !== 'queueMovement')).toBe(true);
      const firstMarch = commands.findIndex(command => command.type === 'moveTo' || command.type === 'queueMovement');
      if (firstMarch >= 0) expect(survey).toBeLessThan(firstMarch);
    }
    for (const command of commands) issue(state, command);
    if (!state.victory) issue(state, { type: 'endTurn', factionId: player });
  }
  expect(surveys).toBeGreaterThan(0);
});
