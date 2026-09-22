import { expect, test } from 'vitest';
import { ARCANE_DISCOVERIES } from '@theandril/content';
import { applyCommand, createArmyFormation, deserializeGame, getMovementQuery, getObservation, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { createArchive, applyRecordedCommand, replayArchive } from '../../chronicle/src/index';
import { characterBattleCampaign } from '../../test-fixtures/src/character-fixture';
import { refreshAuthoredSight, holdSurveyedSeam } from '../../test-fixtures/src/authored-land';
import { planCharacters } from './characters';
import { planProgression } from './progression';

const owner = 'faction.ashen_compact';
function laboratory() {
  const game = characterBattleCampaign(), town = game.settlements['settlement.5']!, army = game.armies['army.2']!;
  // Explicit fiscal/roster laboratory. All research, appointment, attachment and
  // combat decisions below are actual paid public commands, not injected flags.
  game.factions[0]!.treasury = 5000; game.factions[0]!.knowledge = 2000;
  while (army.formations.length < 4) army.formations.push(createArmyFormation(`army.${game.nextId++}`, 'unit.guard'));
  army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  const checked = (command: GameCommand) => { const result = applyCommand(game, command); expect(result).toMatchObject({ ok: true }); };
  checked({ type: 'queue', factionId: owner, settlementId: town.id, itemId: 'building.archive' });
  for (let turn = 0; turn < 20 && !town.buildings.includes('building.archive'); turn++) checked({ type: 'endTurn', factionId: owner });
  expect(town.buildings).toContain('building.archive');
  checked({ type: 'declareWar', factionId: owner, targetFactionId: 'faction.reedbound_council' });
  // Arcane Theory is studied from a seam the realm holds; surveying is proved in the sim's own tests.
  holdSurveyedSeam(game, owner);
  return deserializeGame(serializeGame(game));
}
test('observation-only AI pays for one useful Waykeeper, attaches it and purchases real national discoveries before shared-kernel combat', () => {
  const game = laboratory(), initial = serializeGame(game), archive = createArchive(game, { mode: 'player', coverage: 'from-save' });
  const record = (command: GameCommand) => { const result = applyRecordedCommand(game, archive, command); expect(result, JSON.stringify(command)).toMatchObject({ ok: true }); };
  const view = getObservation(game, owner), copy = structuredClone(view), plan = planCharacters(view, 40);
  expect(view).toEqual(copy); expect(planCharacters(view, 40)).toEqual(plan);
  const recruit = plan.commands.find(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper');
  expect(recruit).toBeDefined();
  const purse = game.factions[0]!.treasury; record(recruit!); expect(game.factions[0]!.treasury).toBe(purse - 40);
  const caster = Object.values(game.characters).find(item => item.definitionId === 'character.waykeeper')!;
  const attach = planCharacters(getObservation(game, owner), 0).commands.find(command => command.type === 'assignCharacter' && command.characterId === caster.id);
  expect(attach).toBeDefined(); record(attach!);
  for (let step = 0; step < 20 && game.arcaneResearch[owner]!.length < ARCANE_DISCOVERIES.length; step++) {
    const choices = planProgression(getObservation(game, owner)).commands;
    for (const command of choices) {
      const knowledge = game.factions[0]!.knowledge; record(command);
      if (command.type === 'researchArcane') expect(game.factions[0]!.knowledge).toBe(knowledge - ARCANE_DISCOVERIES.find(item => item.id === command.discoveryId)!.knowledgeCost);
    }
  }
  expect(game.arcaneResearch[owner]).toHaveLength(2);
  record({ type: 'attack', factionId: owner, armyId: 'army.2', targetArmyId: 'army.4' });
  record({ type: 'autoResolveBattle', factionId: owner });
  expect(game.battleReports.at(-1)!.abilityState!.casters.find(item => item.characterId === caster.id)!.strain).toBeGreaterThan(0);
  expect(serializeGame(replayArchive(archive))).toBe(serializeGame(game));
  expect(initial).not.toBe(serializeGame(game));
});

test('the AI never appoints unfunded casters or researches magic without an actual gifted officer', () => {
  const game = laboratory(), view = getObservation(game, owner);
  expect(planCharacters(view, 39).commands.some(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper')).toBe(false);
  expect(planProgression(view).commands.some(command => command.type === 'researchArcane')).toBe(false);
  const peaceful = structuredClone(view); peaceful.wars = [];
  expect(planCharacters(peaceful, 100).commands.some(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper')).toBe(false);
  expect(game.arcaneResearch[owner]).toEqual([]);
});

test('a declined tactical policy never causes the AI to substitute an unrecorded spell action', () => {
  const game: GameState = laboratory();
  const before = serializeGame(game);
  const view = getObservation(game, owner);
  planCharacters(view, 100); planProgression(view);
  expect(serializeGame(game)).toBe(before);
});

function appointmentLaboratory() {
  let game = laboratory();
  // Author a safe, co-located scout alternative without changing either role's
  // eligibility. Appointment, companion occupancy and movement remain real orders.
  for (const army of Object.values(game.armies)) if (army.factionId !== owner) delete game.armies[army.id];
  const explorerId = `army.${game.nextId++}`;
  game.armies[explorerId] = { id: explorerId, factionId: owner, name: 'Independent explorer',
    cell: game.settlements['settlement.5']!.cell, movement: 3, formations: [createArmyFormation(explorerId, 'unit.scout')] };
  refreshAuthoredSight(game);
  game = deserializeGame(serializeGame(game));
  const issue = (command: GameCommand) => expect(applyCommand(game, command), JSON.stringify(command)).toMatchObject({ ok: true });
  const recruit = (definitionId: string) => {
    issue({ type: 'recruitCharacter', factionId: owner, settlementId: 'settlement.5', definitionId });
    return Object.values(game.characters).find(character => character.definitionId === definitionId && character.location?.kind === 'settlement')!;
  };
  return { game, explorerId, issue, recruit };
}

test('Waykeepers choose a qualifying local battle stack and its free companion slot, never a lone explorer', () => {
  const { game, explorerId, issue, recruit } = appointmentLaboratory();
  const caster = recruit('character.waykeeper'), engineer = recruit('character.engineer');
  issue({ type: 'assignCharacter', factionId: owner, characterId: engineer.id, armyId: 'army.2' });
  const view = getObservation(game, owner), before = serializeGame(game), copy = structuredClone(view);
  expect(view.armies.find(army => army.id === 'army.2')!.agents).toHaveLength(1);
  expect(caster.id).not.toBe(engineer.id);
  const plan = planCharacters(view, 0);
  expect(plan.commands.find(command => command.type === 'assignCharacter' && command.characterId === caster.id)).toEqual({ type: 'assignCharacter', factionId: owner, characterId: caster.id, armyId: 'army.2' });
  expect(planCharacters(view, 0)).toEqual(plan); expect(view).toEqual(copy); expect(serializeGame(game)).toBe(before);
  const mirror = deserializeGame(before), attach = plan.commands.find(command => command.type === 'assignCharacter' && command.characterId === caster.id)!;
  expect(applyCommand(game, attach)).toEqual(applyCommand(mirror, attach));
  expect(serializeGame(game)).toBe(serializeGame(mirror));
  expect(game.characters[caster.id]!.location).toEqual({ kind: 'army', armyId: 'army.2' });
  issue({ type: 'unassignCharacter', factionId: owner, characterId: caster.id, settlementId: 'settlement.5' });
  const secondEngineer = recruit('character.engineer');
  issue({ type: 'assignCharacter', factionId: owner, characterId: secondEngineer.id, armyId: 'army.2' });
  const full = getObservation(game, owner);
  expect(full.characters.find(character => character.id === caster.id)!.assignmentOptions.find(option => option.armyId === explorerId)?.canAssign).toBe(true);
  expect(planCharacters(full, 0).commands.some(command => command.type === 'assignCharacter' && command.characterId === caster.id)).toBe(false);
});

test('a remote qualifying army does not justify a paid Waykeeper for a local lone scout', () => {
  const { game, issue } = appointmentLaboratory();
  const town = game.settlements['settlement.5']!;
  const destination = getMovementQuery(getObservation(game, owner), 'army.2').reachable.find(cell => !Object.values(game.settlements).some(item => item.cell === cell.cell));
  expect(destination).toBeDefined();
  issue({ type: 'moveTo', factionId: owner, armyId: 'army.2', target: destination!.cell });
  expect(game.armies['army.2']!.cell).not.toBe(town.cell);
  const view = getObservation(game, owner);
  expect(view.characterRecruitment.some(option => option.definitionId === 'character.waykeeper' && option.canRecruit)).toBe(true);
  expect(view.armies.some(army => army.factionId === owner && army.formations.length >= 4)).toBe(true);
  expect(planCharacters(view, 40).commands.some(command => command.type === 'recruitCharacter' && command.definitionId === 'character.waykeeper')).toBe(false);
});

test('Arcane research buys only discoveries usable by the actual personal paths of its living caster', () => {
  const { game, issue, recruit } = appointmentLaboratory();
  const caster = recruit('character.waykeeper');
  // A legal imported personal profile can differ from the standard dual-path recruit.
  caster.aptitudes = { 'path.rune': 1 };
  expect(serializeGame(deserializeGame(serializeGame(game)))).toBe(serializeGame(game));
  for (let count = 0; count < 16; count++) {
    const choice = getObservation(game, owner).progression.technologyChoices.find(choice => choice.available);
    if (!choice) break;
    issue({ type: 'research', factionId: owner, technologyId: choice.id });
  }
  const view = getObservation(game, owner), original = structuredClone(view);
  expect(view.arcaneResearch.choices.find(choice => choice.id === 'arcane.ember_projection')!.canResearch).toBe(true);
  const research = planProgression(view).commands.find(command => command.type === 'researchArcane');
  expect(research).toEqual({ type: 'researchArcane', factionId: owner, discoveryId: 'arcane.rune_binding' });
  expect(view).toEqual(original);
  const mirror = deserializeGame(serializeGame(game));
  expect(applyCommand(game, research!)).toEqual(applyCommand(mirror, research!));
  expect(serializeGame(game)).toBe(serializeGame(mirror));
  expect(planProgression(getObservation(game, owner)).commands.some(command => command.type === 'researchArcane')).toBe(false);
});
