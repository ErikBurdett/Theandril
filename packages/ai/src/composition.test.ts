import { expect, test } from 'vitest';
import { refreshAuthoredSight } from '../../test-fixtures/src/authored-land';
import { applyCommand, createArmyFormation, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState } from '@theandril/sim';
import { UNITS } from '@theandril/content';
import { isPassable, neighbors } from '@theandril/mapgen';
import { characterCampaign } from '../../test-fixtures/src/character-fixture';
import { planTurn } from './index';

test('AI recruits varied formations and assembles real mixed armies through legal public commands', () => {
  const state = createGame({ seed: 748291, size: 'tiny', factionCount: 1, pace: 'epic' });
  const recruited = new Set<string>(); let merges = 0; let largestArmy = 1;
  let mirror: typeof state | undefined;
  const issue = (command: GameCommand) => {
    const result = applyCommand(state, command);
    expect(result.ok, `${state.turn}: ${JSON.stringify(command)}: ${result.error}`).toBe(true);
    if (mirror) expect(applyCommand(mirror, command)).toEqual(result);
    if (command.type === 'queue' && command.itemId.startsWith('unit.')) recruited.add(command.itemId);
    if (command.type === 'mergeArmies') merges++;
    largestArmy = Math.max(largestArmy, ...Object.values(state.armies).map(army => army.formations.length));
  };
  for (let round = 0; round < 100; round++) {
    for (const command of planTurn(getObservation(state, state.turnOwnerId))) issue(command);
    issue({ type: 'endTurn', factionId: state.turnOwnerId });
    if (round === 24) mirror = deserializeGame(serializeGame(state));
  }
  // Modern land research reaches both estate and orework branches. Every land
  // role must be recruited through its real paid, prerequisite-checked queue.
  expect(new Set([...recruited].filter(id => UNITS.find(unit => unit.id === id)?.movementDomain !== 'naval'))).toEqual(new Set(['unit.colonist', 'unit.guard', 'unit.spearman', 'unit.scout', 'unit.heavy_infantry', 'unit.cavalry', 'unit.skirmisher', 'unit.arbalester', 'unit.halberdier', 'unit.lancer']));
  expect([...recruited].every(id => UNITS.some(unit => unit.id === id))).toBe(true);
  expect(merges).toBeGreaterThan(0);
  expect(largestArmy).toBeGreaterThanOrEqual(3);
  expect(largestArmy).toBeLessThanOrEqual(12);
  expect(mirror && stateHash(mirror)).toBe(stateHash(state));
});

test('founding proposals reserve space for other caravans within the same planning batch', () => {
  const state = createGame({ seed: 74, size: 'tiny', factionCount: 1 });
  const view = getObservation(state, state.turnOwnerId);
  const colonist = view.armies.find(army => army.canFound)!;
  view.armies.push({ ...structuredClone(colonist), id: 'army.999', formations: colonist.formations.map(formation => ({ ...formation, id: 'formation.999' })) });
  expect(planTurn(view).filter(command => command.type === 'found')).toHaveLength(1);
});

test.each([16, 20])('AI concentrates %i real formations under the eligible commander in response to a visible large rival', capacity => {
  let state = characterCampaign();
  const factionId = state.turnOwnerId, home = state.settlements['settlement.5']!;
  const issue = (command: GameCommand): void => { const result = applyCommand(state, command); expect(result.ok, JSON.stringify(command) + ': ' + result.error).toBe(true); };
  issue({ type: 'recruitCharacter', factionId, settlementId: home.id, definitionId: 'character.marshal' });
  const marshal = Object.values(state.characters)[0]!;
  issue({ type: 'assignCharacter', factionId, characterId: marshal.id, armyId: 'army.2' });
  if (capacity === 20) {
    marshal.experience = 54; // Authored earned-experience input; every prerequisite purchase is a real command.
    for (const skillId of ['skill.steadfast', 'skill.muster_rolls', 'skill.field_orders']) issue({ type: 'promoteCharacter', factionId, characterId: marshal.id, skillId });
  }
  const target = state.armies['army.2']!, source = Object.values(state.armies).find(army => army.id !== target.id)!;
  const targetCount = capacity === 16 ? 10 : 12;
  const fill = (army: typeof target, count: number): void => {
    while (army.formations.length < count) army.formations.push(createArmyFormation(`army.${state.nextId++}`, army.formations.length % 2 ? 'unit.spearman' : 'unit.guard'));
    for (const formation of army.formations) { const unit = UNITS.find(unit => unit.id === formation.unitId)!; formation.strength = unit.strength; formation.morale = unit.morale; formation.fatigue = 0; }
    army.formations.sort((a, b) => a.id < b.id ? -1 : 1);
  };
  fill(target, targetCount); fill(source, capacity - targetCount);
  const enemyFactionId = state.factions[1]!.id;
  const enemyCell = neighbors(home.cell, state.world.width, state.world.height).find(cell => isPassable(state.world.terrain[cell]!) && !Object.values(state.settlements).some(town => town.cell === cell))!;
  const enemyId = `army.${state.nextId++}`;
  state.armies[enemyId] = { id: enemyId, factionId: enemyFactionId, name: 'Observed rival host', cell: enemyCell, movement: 1, formations: [createArmyFormation(enemyId, 'unit.guard')] };
  fill(state.armies[enemyId]!, 20); // A real visible over-command rival, not invented hidden force strength.
  const scoutId = `army.${state.nextId++}`;
  state.armies[scoutId] = { id: scoutId, factionId, name: 'Independent patrol', cell: home.cell, movement: 5, formations: [createArmyFormation(scoutId, 'unit.scout')] };
  function revealSight(game: GameState, owner: string, origin: number, radius: number): void {
    let frontier = [origin]; const seen = new Set(frontier);
    for (let ring = 0; ring < radius; ring++) { const next: number[] = []; for (const cell of frontier) for (const adjacent of neighbors(cell, game.world.width, game.world.height)) if (!seen.has(adjacent)) { seen.add(adjacent); next.push(adjacent); } frontier = next; }
    for (const cell of seen) game.explored[owner]!.add(cell);
  }
  revealSight(state, factionId, home.cell, 4); revealSight(state, enemyFactionId, enemyCell, 2);
  state.factions[0]!.treasury = 0; state.factions[0]!.knowledge = 0;
  refreshAuthoredSight(state);
  state = deserializeGame(serializeGame(state));
  const view = getObservation(state, factionId), plan = planTurn(view);
  expect(view.armies.find(army => army.id === target.id)?.formationCapacity).toBe(capacity);
  expect(plan).toContainEqual({ type: 'mergeArmies', factionId, sourceArmyId: source.id, targetArmyId: target.id });
  expect(plan.some(command => command.type === 'mergeArmies' && (command.sourceArmyId === scoutId || command.targetArmyId === scoutId))).toBe(false);
  for (const command of plan) issue(command);
  expect(state.armies[target.id]!.formations).toHaveLength(capacity);
  expect(state.armies[scoutId]!.formations).toHaveLength(1);
  expect(stateHash(deserializeGame(serializeGame(state)))).toBe(stateHash(state));
});
