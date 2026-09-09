import { describe, expect, it } from 'vitest';
import { hexDistance, isPassable } from '@theandril/mapgen';
import { applyCommand, createGame, deserializeGame, getObservation, serializeGame, stateHash, type GameCommand, type GameState, type Observation } from '@theandril/sim';
import { rebaseAuthoredLand } from '../../test-fixtures/src/authored-land';
import { aiObservationOptions, landPlanningTowns, LAND_PLANNING_TOWN_LIMIT, planTurnWithReasons } from './index';

/** Synthetic owned-town/knowledge setup; geography stays generated and imports strictly. */
function authoredTowns(count: number): GameState {
  const game = createGame({ seed: 74, size: 'tiny', factionCount: 1, pace: 'epic' });
  const centers: number[] = [];
  for (let cell = 0; cell < game.world.terrain.length && centers.length < count; cell++) {
    if (!isPassable(game.world.terrain[cell]!) || centers.some(other => hexDistance(cell, other, game.world.width) < 5)) continue;
    centers.push(cell);
    const id = `settlement.${game.nextId++}`;
    game.settlements[id] = { id, factionId: game.turnOwnerId, founderFactionId: game.turnOwnerId, name: `Authored Hearth ${centers.length}`, cell,
      population: 3, food: centers.length % 2 ? 40 : 8, buildings: ['building.granary'], queue: [], devastation: 0, occupationTurns: 0 };
  }
  if (centers.length !== count) throw new Error('Authored town fixture has insufficient separated generated land.');
  game.factions[0]!.treasury = 1_000; game.factions[0]!.knowledge = 1_000;
  game.progression[game.turnOwnerId]!.technologies = ['technology.cinder_masonry', 'technology.civic_accounts'];
  rebaseAuthoredLand(game);
  return deserializeGame(serializeGame(game));
}

function withoutDetails(view: Observation): Observation {
  return { ...view, land: { ...view.land, settlements: view.land.settlements.map(({ cellWindow: _cellWindow, ...town }) => ({ ...town, cells: [] })) } };
}

describe('shared AI land observation and planning window', () => {
  it('derives only a bounded read selector from public turn metadata', () => {
    expect(LAND_PLANNING_TOWN_LIMIT).toBe(8);
    expect(aiObservationOptions(1)).toEqual({ landDetails: { offset: 0, limit: 8 } });
    expect(aiObservationOptions(3)).toEqual({ landDetails: { offset: 16, limit: 8 } });
    expect(aiObservationOptions(1_000_000)).toEqual({ landDetails: { offset: 7_999_992, limit: 8 } });
    for (const turn of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) expect(() => aiObservationOptions(turn)).toThrow();
    const first = aiObservationOptions(3); first.landDetails.limit = 0;
    expect(aiObservationOptions(3).landDetails.limit).toBe(8);
  });

  it.each([0, 1, 8, 9, 16, 17])('matches the original modular planner order without mutating %i input entries', count => {
    const entries = Object.freeze(Array.from({ length: count }, (_, index) => ({ id: `settlement.${index + 1}` })).sort((a, b) => a.id < b.id ? -1 : 1));
    for (const turn of [1, 2, 3, 9, 17, 34, 1_000_000]) {
      const offset = entries.length ? ((turn - 1) * 8) % entries.length : 0;
      const original = Array.from({ length: Math.min(8, entries.length) }, (_, index) => entries[(offset + index) % entries.length]!);
      expect(landPlanningTowns(entries, turn)).toEqual(original);
    }
  });

  it.each([0, 1, 8, 9, 16, 17])('retains identical complete proposals/reasons and all summaries across %i towns and wrap-around turns', count => {
    const game = authoredTowns(count);
    for (const turn of [1, 2, 3, 9, 17, 1_000_000]) {
      game.turn = turn; // Authored query epoch, not a claim of simulated elapsed turns.
      const before = serializeGame(game);
      const full = getObservation(game, game.turnOwnerId);
      const scoped = getObservation(game, game.turnOwnerId, aiObservationOptions(game.turn));
      expect(withoutDetails(scoped)).toEqual(withoutDetails(full));
      const selected = new Set(landPlanningTowns(full.land.settlements, turn).map(town => town.settlementId));
      expect(scoped.land.settlements.filter(town => town.cells.length).map(town => town.settlementId)).toEqual(full.land.settlements.filter(town => selected.has(town.settlementId)).map(town => town.settlementId));
      for (const [index, town] of scoped.land.settlements.entries()) expect(town.cells).toEqual(selected.has(town.settlementId) ? full.land.settlements[index]!.cells : []);
      expect(planTurnWithReasons(scoped)).toEqual(planTurnWithReasons(full));
      expect(serializeGame(game)).toBe(before);
      const pristine = structuredClone(scoped);
      const detailed = scoped.land.settlements.find(town => town.cells.length);
      if (detailed) detailed.cells[0]!.improvementOptions.splice(0);
      expect(getObservation(game, game.turnOwnerId, aiObservationOptions(turn))).toEqual(pristine);
      expect(serializeGame(game)).toBe(before);
    }
  });

  it('keeps real commands/results and saved continuation identical to full-detail planning', () => {
    const full = authoredTowns(17);
    let scoped = deserializeGame(serializeGame(full)), paidWork = 0;
    const issue = (command: GameCommand): void => {
      const result = applyCommand(full, command);
      expect(result.ok, result.error ?? JSON.stringify(command)).toBe(true);
      expect(applyCommand(scoped, command)).toEqual(result);
      if (command.type === 'improveTile' || command.type === 'terraformTile') paidWork++;
    };
    for (let round = 0; round < 10; round++) {
      const expected = planTurnWithReasons(getObservation(full, full.turnOwnerId));
      const actual = planTurnWithReasons(getObservation(scoped, scoped.turnOwnerId, aiObservationOptions(scoped.turn)));
      expect(actual).toEqual(expected);
      for (const command of expected.commands) issue(command);
      issue({ type: 'endTurn', factionId: full.turnOwnerId });
      expect(stateHash(scoped)).toBe(stateHash(full));
      if (round === 4) scoped = deserializeGame(serializeGame(scoped));
    }
    expect(paidWork).toBeGreaterThan(0);
    expect(serializeGame(deserializeGame(serializeGame(scoped)))).toBe(serializeGame(full));
  });
});
