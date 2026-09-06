import { neighbors, isPassable } from '@theandril/mapgen';
import { applyCommand, createArmyFormation, deserializeGame, serializeGame, type GameCommand, type GameState } from '@theandril/sim';
import { borderBattleCampaign } from './combat-fixture';
import { refreshAuthoredSight } from './authored-land';

export const CHARACTER_FIXTURE = {
  playerFactionId: 'faction.ashen_compact', enemyFactionId: 'faction.reedbound_council',
  homeId: 'settlement.5', homeName: 'Ashen Hearth', armyId: 'army.2', armyName: 'Witness column',
  reserveName: 'Reserve escort', enemyArmyId: 'army.4',
} as const;

const issue = (state: GameState, command: GameCommand): void => {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Character fixture rejected ${command.type}: ${result.error}`);
};

/** Explicitly funded/damaged scenario; characters are appointed through real commands. */
export function characterCampaign(armyCount = 2): GameState {
  if (!Number.isInteger(armyCount) || armyCount < 2 || armyCount > 200) throw new Error('Character fixture army count must be 2–200.');
  const state = borderBattleCampaign();
  const home = state.settlements[CHARACTER_FIXTURE.homeId]!;
  const player = state.armies[CHARACTER_FIXTURE.armyId]!;
  state.factions[0]!.treasury = 2000;
  for (const army of Object.values(state.armies)) if (army.factionId !== state.turnOwnerId) delete state.armies[army.id];
  player.cell = home.cell;
  player.name = CHARACTER_FIXTURE.armyName;
  player.formations = [
    { ...createArmyFormation(player.id, 'unit.guard'), strength: 25, morale: 30, fatigue: 15 },
    { ...createArmyFormation(`army.${state.nextId++}`, 'unit.spearman'), strength: 45, morale: 35, fatigue: 10 },
    { ...createArmyFormation(`army.${state.nextId++}`, 'unit.cavalry'), strength: 30, morale: 30, fatigue: 10 },
  ];
  player.movement = 3;
  for (let index = 1; index < armyCount; index++) {
    const id = `army.${state.nextId++}`;
    state.armies[id] = {
      id, factionId: state.turnOwnerId, name: index === 1 ? CHARACTER_FIXTURE.reserveName : `Hearth reserve ${index}`,
      cell: home.cell, movement: 3, formations: [createArmyFormation(id, 'unit.guard')],
    };
  }
  refreshAuthoredSight(state);
  return deserializeGame(serializeGame(state));
}

/** An actual appointed commander fights a visible neighboring guard; no battle result is injected. */
export function characterBattleCampaign(): GameState {
  let state = borderBattleCampaign();
  const home = state.settlements[CHARACTER_FIXTURE.homeId]!;
  const player = state.armies[CHARACTER_FIXTURE.armyId]!;
  const enemy = state.armies[CHARACTER_FIXTURE.enemyArmyId]!;
  const towns = new Set(Object.values(state.settlements).map(town => town.cell));
  const enemyCell = neighbors(home.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !towns.has(cell));
  if (enemyCell === undefined) throw new Error('Character battle fixture has no enemy approach.');
  state.factions[0]!.treasury = 500;
  player.cell = home.cell; player.name = CHARACTER_FIXTURE.armyName;
  player.formations = [
    { ...createArmyFormation(player.id, 'unit.guard'), strength: 55, morale: 30, fatigue: 10 },
    { ...createArmyFormation(`army.${state.nextId++}`, 'unit.spearman'), strength: 60, morale: 35, fatigue: 10 },
  ];
  enemy.cell = enemyCell;
  const visible = new Set([enemyCell]);
  let frontier = [enemyCell];
  for (let ring = 0; ring < 2; ring++) {
    const next: number[] = [];
    for (const cell of frontier) for (const adjacent of neighbors(cell, state.world.width, state.world.height)) {
      if (!visible.has(adjacent)) { visible.add(adjacent); next.push(adjacent); }
    }
    frontier = next;
  }
  for (const cell of visible) state.explored[enemy.factionId]!.add(cell);
  // Rebuild spatial/fog indexes before issuing normal appointment/assignment commands.
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  issue(state, { type: 'recruitCharacter', factionId: state.turnOwnerId, settlementId: home.id, definitionId: 'character.marshal' });
  const marshal = Object.values(state.characters).find(character => character.definitionId === 'character.marshal');
  if (!marshal) throw new Error('Character fixture did not appoint its marshal.');
  issue(state, { type: 'assignCharacter', factionId: state.turnOwnerId, characterId: marshal.id, armyId: player.id });
  return deserializeGame(serializeGame(state));
}
