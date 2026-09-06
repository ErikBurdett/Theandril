import { expect, test } from 'vitest';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand } from '@theandril/sim';
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
  expect(recruited).toEqual(new Set(['unit.colonist', 'unit.guard', 'unit.spearman', 'unit.scout', 'unit.heavy_infantry', 'unit.cavalry']));
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
